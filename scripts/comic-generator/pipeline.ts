// Main pipeline orchestrating the entire comic generation flow
import { ensureCharacterReference } from "./character-creator";
import { generateComicScript } from "./script-generator";
import { generatePanelVariants } from "./panel-generator";
import type { ComicScript, PanelWithVariants, ComicOutput } from "./types";
import { PANELS_PER_COMIC, VARIANTS_PER_PANEL } from "./config";
import readline from "readline";
import path from "path";
import fs from "fs";

function generatePanelSetId(topic: string): string {
  const timestamp = Date.now();
  const slug = topic.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
  return `${slug}-${timestamp}`;
}

export async function runPipeline(topic: string): Promise<ComicOutput> {
  console.log("\n" + "=".repeat(60));
  console.log("COMIC GENERATION PIPELINE");
  console.log("=".repeat(60));
  console.log(`Topic: "${topic}"`);
  console.log(`Panels: ${PANELS_PER_COMIC}, Variants per panel: ${VARIANTS_PER_PANEL}`);
  console.log("=".repeat(60) + "\n");

  const panelSetId = generatePanelSetId(topic);
  const outputDir = path.join(__dirname, "data", "panels", panelSetId);

  console.log("Step 1: Ensuring character references...");

  const chitriRefPath = await ensureCharacterReference("chitri");
  console.log(`   Chitri reference ready: ${chitriRefPath}`);

  const chitriletsRefPath = await ensureCharacterReference("chitrilets");
  console.log(`   Chitrilets reference ready: ${chitriletsRefPath}`);
  console.log("");

  console.log("Step 2: Generating comic script...");
  const script: ComicScript = await generateComicScript(topic);
  console.log(`   Script generated with ${script.panels.length} panels\n`);

  const scriptPath = path.join(outputDir, "script.json");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
  console.log(`   Script saved to: ${scriptPath}\n`);

  console.log("Step 3: Generating panel variants...");
  console.log("   Generating panels with readable speech bubbles from script dialogue\n");

  const panelsWithVariants: PanelWithVariants[] = [];

  for (let i = 0; i < script.panels.length; i++) {
    const panel = script.panels[i];
    console.log(`\n   Processing Panel ${i + 1}/${script.panels.length}...`);

    const variants = await generatePanelVariants(panel, panelSetId);

    panelsWithVariants.push({
      panel_number: panel.panel_number,
      variants,
      selected_variant: null,
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("ALL PANELS GENERATED");
  console.log("=".repeat(60));
  console.log("\nOutput directory:");
  console.log(`   ${outputDir}`);
  console.log("");

  return {
    topic,
    character_id: "chitri-family",
    panels: panelsWithVariants.map((p, idx) => ({
      panel_number: p.panel_number,
      image_url: "",
      scene_description: script.panels[idx].scene_description,
      dialogue: script.panels[idx].dialogue,
      selected_variant: -1,
    })),
    created_at: new Date().toISOString(),
  };
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function main() {
  const rl = createInterface();

  const cliTopic = process.argv.slice(2).join(" ").trim();
  const topic = cliTopic || await new Promise<string>((resolve) => {
    rl.question("Enter topic for comic: ", (answer) => {
      resolve(answer.trim() || "photosynthesis");
    });
  });

  rl.close();

  try {
    const result = await runPipeline(topic);
    console.log("\nPipeline complete.");
    console.log("   Run this to select best variants:");
    console.log(`   npx tsx scripts/comic-generator/iterate.ts ${result.topic}`);
  } catch (error) {
    console.error("\nPipeline failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
