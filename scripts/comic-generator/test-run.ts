// Test entry point for comic generation pipeline
﻿import { runPipeline } from "./pipeline";
import path from "path";
import readline from "readline";

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function main() {
  const cliTopic = process.argv.slice(2).join(" ").trim();
  const topic = cliTopic || await new Promise<string>((resolve) => {
    const rl = createInterface();
    rl.question("Enter topic for comic: ", (answer) => {
      rl.close();
      resolve(answer.trim() || "photosynthesis");
    });
  });

  console.log("\n" + "=".repeat(60));
  console.log("COMIC GENERATION TEST RUN");
  console.log("=".repeat(60));
  console.log(`Topic: "${topic}"`);
  console.log("=".repeat(60) + "\n");

  try {
    const result = await runPipeline(topic);

    console.log("\n" + "=".repeat(60));
    console.log("GENERATION COMPLETE");
    console.log("=".repeat(60));
    console.log("\nCheck generated images in:");
    console.log(`   ${path.join(__dirname, "data", "panels")}`);
    console.log("\nScript summary:");
    result.panels.forEach((panel) => {
      console.log(`   Panel ${panel.panel_number}: ${panel.dialogue.substring(0, 60)}...`);
    });

    console.log("\nTest run complete.");
  } catch (error) {
    console.error("\nTest failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
