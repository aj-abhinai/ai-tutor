// Generates comic scripts from topics using LLM
import { getTextModel } from "./gemini-client";
import {
  characterConfig,
  CHITRILET_COUNT,
  CURRICULUM_CONTEXT,
  PANELS_PER_COMIC
} from "./config";
import type { ComicScript, ComicPanel } from "./types";

const CHITRILET_NAMES = ["Piko", "Mili", "Tara", "Nimo"];
const DEFAULT_PANEL_KIDS: ReadonlyArray<ReadonlyArray<string>> = [
  ["Piko", "Mili"],
  ["Tara", "Nimo"],
  ["Piko", "Tara", "Mili"],
  ["Piko", "Mili", "Tara", "Nimo"],
];

function sanitizeDialogue(dialogue: unknown): string {
  const raw = typeof dialogue === "string" ? dialogue : "";
  return raw
    .replace(/\b[A-Za-z][A-Za-z ]{0,18}:\s*/g, "")
    .replace(/\b(chitri|chitrilets?|piko|mili|tara|nimo|teacher|sir|maam|madam)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function normalizeDialogueBlock(dialogue: string): string {
  const cleaned = dialogue.trim();
  if (!cleaned) {
    return "What do we notice first?\nThe key idea becomes clear in this step.";
  }

  const pieces = cleaned
    .split(/\n|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const normalizedLines = pieces
    .map((line) =>
      line
        .replace(/\b(chitri|chitrilets?|piko|mili|tara|nimo|teacher|sir|maam|madam)\b/gi, "")
        .replace(/\s+/g, " ")
        .replace(/\s+([,.!?])/g, "$1")
        .trim()
    )
    .filter((line) => line.length > 0)
    .map((line) => (/[.!?]$/.test(line) ? line : `${line}.`));

  const shouldUseFourLines =
    normalizedLines.length >= 4 && normalizedLines.join(" ").length > 170;
  const finalLines = normalizedLines.slice(0, shouldUseFourLines ? 4 : 3);
  if (finalLines.length === 0) {
    return "What do we notice first?\nThe key idea becomes clear in this step.";
  }

  return finalLines.join("\n");
}

function normalizeKidsPresent(rawKids: unknown, panelIndex: number): string[] {
  const canonicalByLower = new Map<string, string>(
    CHITRILET_NAMES.map((name) => [name.toLowerCase(), name])
  );
  const fallback = [...DEFAULT_PANEL_KIDS[panelIndex % DEFAULT_PANEL_KIDS.length]];

  if (!Array.isArray(rawKids)) {
    return fallback;
  }

  const normalized = rawKids
    .map((kid) => String(kid).trim().toLowerCase())
    .map((kid) => canonicalByLower.get(kid) ?? "")
    .filter((kid) => kid.length > 0);

  const unique = normalized.filter((kid, idx, arr) => arr.indexOf(kid) === idx);

  while (unique.length < 2) {
    const nextFallback = fallback.find((kid) => !unique.includes(kid));
    if (!nextFallback) break;
    unique.push(nextFallback);
  }

  return unique.slice(0, CHITRILET_COUNT);
}

function ensureKidCoverage(panels: ComicPanel[]): ComicPanel[] {
  const covered = new Set(panels.flatMap((panel) => panel.kids_present ?? []));
  const missing = CHITRILET_NAMES.filter((kid) => !covered.has(kid));

  for (const kid of missing) {
    const panelWithSpace = panels.find(
      (panel) =>
        !(panel.kids_present ?? []).includes(kid) &&
        (panel.kids_present?.length ?? 0) < CHITRILET_COUNT
    );

    if (panelWithSpace) {
      panelWithSpace.kids_present = [...(panelWithSpace.kids_present ?? []), kid];
      continue;
    }

    const replaceTarget =
      panels.find(
        (panel) => !(panel.kids_present ?? []).includes(kid) && (panel.kids_present?.length ?? 0) > 2
      ) ?? panels[panels.length - 1];

    const baseKids = replaceTarget.kids_present ? [...replaceTarget.kids_present] : [];
    if (baseKids.length === 0) {
      replaceTarget.kids_present = [kid, DEFAULT_PANEL_KIDS[0][0]];
      continue;
    }

    baseKids[baseKids.length - 1] = kid;
    replaceTarget.kids_present = baseKids
      .filter((kidName, idx, arr) => arr.indexOf(kidName) === idx)
      .slice(0, CHITRILET_COUNT);

    while ((replaceTarget.kids_present?.length ?? 0) < 2) {
      const backupKid = DEFAULT_PANEL_KIDS[0].find(
        (name) => !(replaceTarget.kids_present ?? []).includes(name)
      );
      if (!backupKid) break;
      replaceTarget.kids_present = [...(replaceTarget.kids_present ?? []), backupKid];
    }
  }

  return panels;
}

function extractJsonCandidate(responseText: string): string {
  const fenced = responseText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }
  return jsonMatch[0];
}

function escapeRawNewlinesInsideStrings(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (!inString) {
      if (ch === "\"") {
        inString = true;
      }
      out += ch;
      continue;
    }

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === "\"") {
      inString = false;
      out += ch;
      continue;
    }

    if (ch === "\n") {
      out += "\\n";
      continue;
    }

    if (ch === "\r") {
      continue;
    }

    out += ch;
  }

  return out;
}

function removeTrailingCommas(input: string): string {
  return input.replace(/,\s*([}\]])/g, "$1");
}

function parseComicScriptResponse(responseText: string): ComicScript {
  const candidate = extractJsonCandidate(responseText);
  const parseAttempts = [
    candidate,
    escapeRawNewlinesInsideStrings(candidate),
    removeTrailingCommas(escapeRawNewlinesInsideStrings(candidate)),
  ];

  let lastError: unknown = null;
  for (const attempt of parseAttempts) {
    try {
      return JSON.parse(attempt) as ComicScript;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to parse JSON");
}

export async function generateComicScript(topic: string): Promise<ComicScript> {
  const chitri = characterConfig.characters.chitri;
  const chitrilets = characterConfig.characters.chitrilets;
  const style = characterConfig.style;

  const prompt = `Create a ${PANELS_PER_COMIC}-panel educational comic strip about "${topic}".

PRIMARY GOAL:
- Teach the topic with scientific accuracy.
- Keep explanations simple and age-appropriate without reducing concept difficulty.
- Preserve topic continuity across all panels.

CURRICULUM ANCHOR:
- Use ${CURRICULUM_CONTEXT} as the explicit curriculum context.
- Keep terminology and explanation style aligned to this level.
- If the topic is above this level, explain with a Class 7 bridge while keeping facts correct.

CHARACTERS:
TEACHER: ${chitri.name} (${chitri.species})
- ${chitri.description}
- Personality: ${chitri.personality}

STUDENTS: ${chitrilets.name}
- ${chitrilets.description}
- The four kids are: ${CHITRILET_NAMES.join(", ")}.
- Each panel must include at least 2 kids.
- Across the full comic, all 4 kids must appear at least once.

STYLE:
- ${style.art_style}, ${style.mood} mood.
- Keep explanations clear and complete.
- Avoid slang and avoid incorrect simplifications.
- Keep the tone cute, warm, and friendly while staying scientifically correct.

BACKGROUND DIRECTION:
- Background should vary by panel based on the topic scene.
- Maintain continuity of world and lesson flow.
- Do not default to forest in every panel.
- Use context-appropriate settings across the series (for example: schoolyard, classroom corner, rooftop, home courtyard, library nook, simple lab table, park, or sky scene) based on the concept.
- Choose scenes logically for explanation: each panel setting should directly support the specific idea being explained in that panel.
- Prefer demonstration-friendly setups (for example: experiment table for science process, sky scene for space topic, water edge/cloud scene for water cycle, playground for force/motion).
- Allow moderate creative freedom in environment design when it still matches topic logic and story continuity.
- Within a single topic, similar or near-similar scenes are allowed if they help continuity and explanation.
- Avoid forcing scene diversity just for variety inside one topic.
- For each panel, make the setting specific and vivid (location + 2 concrete environmental details/props).
- Prefer imaginative but logical settings tied to concept (e.g., rooftop at sunset, greenhouse corner, workshop bench, library model section, riverside, kitchen science moment, observatory terrace, market scene).
- Across different topics, settings must adapt to topic context (for example: photosynthesis vs circuits vs dams vs anatomy should not reuse the same scene template).

STORY STRUCTURE:
1. Generate exactly ${PANELS_PER_COMIC} panels.
2. Keep a clear learning flow from setup -> explanation -> consolidation.
3. You may vary pacing and scene type per panel as long as the concept progression is clear.
4. End with a clear takeaway, but do not force a rigid template.
5. Ensure scene progression feels like a mini journey, not one static place.

DIALOGUE RULES:
- Use 2 to 3 dialogue lines in most panels.
- Use 4 lines only as an edge case when the concept needs it for clarity.
- Do not add extra filler lines; each line must move the explanation forward.
- Prefer alternating interaction flow:
  line 1 = kid question/observation,
  line 2 = explanation,
  line 3 (optional) = kid reaction or follow-up,
  line 4 (optional) = explanation or recap.
- Dialogue can include question, observation, explanation, or recap in natural order.
- Prioritize clarity and concept delivery over forced brevity.
- Keep turn-to-turn flow natural, like a real ongoing conversation.
- Use correct spelling.
- Do NOT prefix dialogue with speaker names (no "Chitri:").
- Do NOT use the word "Chitrilets" in dialogue text.
- Do NOT use any character names in dialogue text.
- Do NOT use direct address words like teacher/sir/maam.
- Keep it like normal spoken conversation.

OUTPUT FORMAT (JSON only, no extra text):
{
  "topic": "${topic}",
  "panels": [
    {
      "panel_number": 1,
      "scene_description": "Visual description showing ${chitri.name} teaching at least 2 kids",
      "character_action": "What ${chitri.name} is doing and how kids react",
      "kids_present": ["Piko", "Mili"],
      "dialogue": "Curious line.\\nExplanation line.\\nRecap line."
    }
  ]
}

Return valid JSON only.`;

  console.log(`\nGenerating comic script for topic: "${topic}"`);
  console.log(`Prompt length: ${prompt.length} chars\n`);

  const model = getTextModel();
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let parsed: ComicScript;

  try {
    parsed = parseComicScriptResponse(responseText);
  } catch {
    console.error("Failed to parse JSON response:");
    console.error(responseText);
    throw new Error("Failed to parse comic script");
  }

  if (!parsed.panels || !Array.isArray(parsed.panels)) {
    throw new Error("Invalid comic script format");
  }

  if (parsed.panels.length !== PANELS_PER_COMIC) {
    throw new Error(`Expected ${PANELS_PER_COMIC} panels, got ${parsed.panels.length}`);
  }

  parsed.panels = parsed.panels.map((panel: ComicPanel, idx: number) => ({
    panel_number: Number(panel.panel_number) || idx + 1,
    scene_description: String(panel.scene_description ?? "").trim(),
    character_action: String(panel.character_action ?? "").trim(),
    dialogue: normalizeDialogueBlock(sanitizeDialogue(panel.dialogue)),
    kids_present: normalizeKidsPresent(panel.kids_present, idx),
  }));

  parsed.panels = ensureKidCoverage(parsed.panels);

  console.log(`Generated ${parsed.panels.length} panels`);
  parsed.panels.forEach((panel: ComicPanel, i: number) => {
    console.log(
      `  Panel ${i + 1}: [kids: ${(panel.kids_present ?? []).join(", ")}] ${panel.dialogue.substring(0, 50)}...`
    );
  });

  return parsed;
}

if (require.main === module) {
  (async () => {
    try {
      const topic = process.argv.slice(2).join(" ").trim() || "photosynthesis";
      const script = await generateComicScript(topic);
      console.log("\nGenerated Script:");
      console.log(JSON.stringify(script, null, 2));
    } catch (error) {
      console.error("Error generating script:", error);
      process.exit(1);
    }
  })();
}
