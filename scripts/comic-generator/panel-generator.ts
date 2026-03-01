// Generates panel images from comic scripts
import { extractTextFromImageWithREST, generateImageWithREST } from "./gemini-client";
import {
  characterConfig,
  CHITRILET_COUNT,
  PANEL_MAX_GENERATION_ATTEMPTS,
  PANEL_TEXT_MIN_MATCH_SCORE,
  PANEL_TEXT_VERIFICATION_ENABLED,
  VARIANTS_PER_PANEL
} from "./config";
import type { ComicPanel, PanelVariant } from "./types";
import fs from "fs";
import path from "path";

const PANELS_DIR = path.join(__dirname, "data", "panels");
const CHARACTER_REF_DIR = path.join(__dirname, "data", "character-refs");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitDialogueLines(dialogue: string): string[] {
  const pieces = dialogue
    .split(/\n|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const normalized = pieces
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .map((line) => (/[.!?]$/.test(line) ? line : `${line}.`));

  const shouldUseFourLines = normalized.length >= 4 && normalized.join(" ").length > 170;
  const maxLines = shouldUseFourLines ? 4 : 3;
  const lines = normalized.slice(0, maxLines);
  if (lines.length < 2) {
    return ["What do we notice here?", "Here is the key idea clearly."];
  }
  return lines;
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[rows - 1][cols - 1];
}

function computeTextMatchScore(expected: string, actual: string): number {
  const exp = normalizeForMatch(expected);
  const act = normalizeForMatch(actual);

  if (!exp || !act) return 0;

  const dist = levenshteinDistance(exp, act);
  const maxLen = Math.max(exp.length, act.length);
  if (maxLen === 0) return 1;
  return Math.max(0, 1 - dist / maxLen);
}

export async function generatePanelVariants(
  panel: ComicPanel,
  panelSetId: string
): Promise<PanelVariant[]> {
  const chitri = characterConfig.characters.chitri;
  const chitrilets = characterConfig.characters.chitrilets;
  const style = characterConfig.style;

  const selectedKids = panel.kids_present && panel.kids_present.length >= 2
    ? panel.kids_present
    : ["Piko", "Mili"];
  const dialogueLines = splitDialogueLines(panel.dialogue);
  const dialogueLineBlock = dialogueLines
    .map((line, idx) => {
      if (idx % 2 === 0) {
        return `  ${idx + 1}) Kid bubble: "${line}"`;
      }
      return `  ${idx + 1}) Guide bubble: "${line}"`;
    })
    .join("\n");
  const expectedDialogueText = dialogueLines.join(" ");

  const prompt = `Create one educational cartoon panel image.

TOPIC CONTEXT:
${panel.scene_description}

PANEL ACTION:
${panel.character_action}

CHARACTERS:
- ${chitri.name}: older house sparrow teacher, consistent look from reference image.
- Chitrilets present in this panel (${selectedKids.length} kids): ${selectedKids.join(", ")}.
- Show at least 2 Chitrilets and at most ${CHITRILET_COUNT} in frame.

STYLE:
- ${style.art_style}
- Mood: ${style.mood}
- Colors: ${style.color_palette}
- Lines: ${style.line_style}

COMPOSITION RULES:
- Keep Chitri visually consistent and identifiable as the guide.
- Kids should look curious and engaged, with varied reactions.
- Show Chitrilets generally smaller/younger than Chitri in most scenes, while allowing natural perspective variation.
- Background must fit this specific topic scene and vary meaningfully from other panels.
- Keep continuity with this lesson's story arc.
- Avoid repeating a forest-only background across the series unless the topic truly requires it.
- Prefer topic-fit settings such as classroom corner, rooftop, courtyard, library, simple lab table, park, night sky, water edge, or city scene when appropriate.
- Scene must be logically useful for teaching this exact panel concept (not decorative only).
- Include concrete visual cues that help explain the idea (for example objects, process steps, comparisons, or cause-effect elements tied to the topic).
- Allow moderate creative freedom in environment details and mood as long as physical/context logic is preserved.
- Do not collapse diverse scene descriptions into the same generic classroom look.
- If the scene description specifies non-classroom context, reflect it clearly in location, props, lighting, and composition.
- Within one topic sequence, similar scenes are acceptable when they support continuity.
- Across different topics, adapt scene language and setting logic to the topic instead of reusing a fixed template.
- Prioritize teaching clarity: topic visuals/diagram should be the main focus.
- Character size ratio is flexible; Chitri and kids can occupy a smaller portion if it helps explain the concept better.

TEXT BUBBLE RULES:
- Include ${dialogueLines.length} speech bubbles in this order:
${dialogueLineBlock}
- Use 2 or 3 bubbles in most panels; 4 only as an edge case for clarity.
- Bubbles must alternate speakers by order (kid, guide, kid, guide).
- Bubble tails should point to the correct speaker for each line.
- Do NOT add extra bubbles beyond the listed lines.
- Keep the text spelling exactly as provided, no paraphrasing.
- Use high-contrast readable lettering (dark text on light bubble).
- Do NOT use any character names in bubble text.
- Do NOT use the word "Chitrilets" in any bubble text.
- Do NOT use direct address words like teacher/sir/maam in bubble text.
- Do not add any other random text, labels, or extra words.

FRAMING RULE:
- If there are 3 or more bubbles, use a wider shot/composition so all bubbles are readable and non-overlapping.

GOAL:
- Scientific idea should be represented accurately through visuals.
- Explanation should feel clear, not naive.`;

  console.log(`\nGenerating ${VARIANTS_PER_PANEL} variants for Panel ${panel.panel_number}...`);
  console.log(`   Scene: ${panel.scene_description.substring(0, 100)}...`);

  const chitriRefPath = path.join(CHARACTER_REF_DIR, "chitri.png");
  const chitriletsRefPath = path.join(CHARACTER_REF_DIR, "chitrilets.png");
  const referenceImages: string[] = [];
  if (fs.existsSync(chitriRefPath)) {
    const chitriImage = fs.readFileSync(chitriRefPath);
    referenceImages.push(chitriImage.toString("base64"));
  }
  if (fs.existsSync(chitriletsRefPath)) {
    const chitriletsImage = fs.readFileSync(chitriletsRefPath);
    referenceImages.push(chitriletsImage.toString("base64"));
  }

  const variants: PanelVariant[] = [];
  const maxAttempts = PANEL_TEXT_VERIFICATION_ENABLED
    ? Math.max(1, PANEL_MAX_GENERATION_ATTEMPTS)
    : 1;

  for (let i = 0; i < VARIANTS_PER_PANEL; i++) {
    console.log(`   Generating variant ${i + 1}/${VARIANTS_PER_PANEL}...`);

    let bestImageBase64 = "";
    let bestScore = -1;
    let bestExtracted = "";
    let lastGenerationError = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let candidateImage = "";
      try {
        candidateImage = await generateImageWithREST(
          prompt,
          referenceImages.length > 0 ? referenceImages : undefined
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        lastGenerationError = message;
        console.log(`      Generation attempt ${attempt}/${maxAttempts} failed: ${message}`);

        if (attempt < maxAttempts) {
          const backoffMs = Math.min(6000, 700 * attempt);
          await sleep(backoffMs);
        }
        continue;
      }

      if (!PANEL_TEXT_VERIFICATION_ENABLED) {
        bestImageBase64 = candidateImage;
        bestScore = 1;
        break;
      }

      let extractedText = "";
      try {
        extractedText = await extractTextFromImageWithREST(candidateImage);
      } catch {
        extractedText = "";
      }

      const score = computeTextMatchScore(expectedDialogueText, extractedText);
      console.log(
        `      Text check attempt ${attempt}/${maxAttempts}: score=${score.toFixed(2)}`
      );

      if (score > bestScore) {
        bestScore = score;
        bestImageBase64 = candidateImage;
        bestExtracted = extractedText;
      }

      if (score >= PANEL_TEXT_MIN_MATCH_SCORE) {
        break;
      }

      if (attempt < maxAttempts) {
        await sleep(250);
      }
    }

    if (!bestImageBase64) {
      throw new Error(
        `Failed to generate image for panel ${panel.panel_number}, variant ${i}. Last error: ${lastGenerationError}`
      );
    }

    if (PANEL_TEXT_VERIFICATION_ENABLED) {
      console.log(
        `      Selected text score=${bestScore.toFixed(2)} OCR="${bestExtracted.substring(0, 80)}"`
      );
    }

    const variant: PanelVariant = {
      variant_id: i,
      image_base64: bestImageBase64,
      prompt,
    };

    variants.push(variant);

    if (!fs.existsSync(PANELS_DIR)) {
      fs.mkdirSync(PANELS_DIR, { recursive: true });
    }

    const variantDir = path.join(PANELS_DIR, panelSetId);
    if (!fs.existsSync(variantDir)) {
      fs.mkdirSync(variantDir, { recursive: true });
    }

    const variantPath = path.join(variantDir, `panel${panel.panel_number}_variant${i}.png`);
    fs.writeFileSync(variantPath, Buffer.from(bestImageBase64, "base64"));
    console.log(`   Saved variant ${i + 1}: ${variantPath}`);
  }

  return variants;
}

export async function saveSelectedPanel(
  panel: ComicPanel,
  variant: PanelVariant,
  panelSetId: string,
  selectedIndex: number
): Promise<string> {
  const finalDir = path.join(PANELS_DIR, panelSetId, "final");
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
  }

  const finalPath = path.join(finalDir, `panel${panel.panel_number}.png`);
  fs.writeFileSync(finalPath, Buffer.from(variant.image_base64, "base64"));

  console.log(`Saved Panel ${panel.panel_number} to: ${finalPath} (variant ${selectedIndex})`);
  return finalPath;
}

if (require.main === module) {
  console.log("This module should be run via pipeline.ts or test-run.ts");
}
