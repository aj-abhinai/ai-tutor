// Iterates through panel variants for manual selection
import path from "path";
import fs from "fs";
import readline from "readline";

function findLatestPanelSet(topicPrefix: string): string | null {
  const panelsDir = path.join(__dirname, "data", "panels");
  if (!fs.existsSync(panelsDir)) return null;

  const dirs = fs.readdirSync(panelsDir)
    .filter(d => d.startsWith(topicPrefix))
    .sort()
    .reverse();
  
  return dirs[0] || null;
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function prompt(question: string): Promise<string> {
  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function iterate(topic: string) {
  const topicPrefix = topic.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
  const panelSetId = findLatestPanelSet(topicPrefix);

  if (!panelSetId) {
    console.log(`❌ No panel set found for topic: "${topic}"`);
    console.log(`   Run test-run.ts first to generate panels`);
    return;
  }

  const variantDir = path.join(__dirname, "data", "panels", panelSetId, "final");

  console.log("\n" + "=".repeat(60));
  console.log("🔄 ITERATE & SELECT BEST VARIANTS");
  console.log("=".repeat(60));
  console.log(`📁 Panel set: ${panelSetId}`);
  console.log("=".repeat(60));

  const pngFiles = fs.readdirSync(path.join(__dirname, "data", "panels", panelSetId))
    .filter(f => f.endsWith(".png") && f.includes("variant"));

  const panelNumbers = [...new Set(pngFiles.map(f => {
    const match = f.match(/panel(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }))].sort();

  const selections: { [key: number]: number } = {};

  for (const panelNum of panelNumbers) {
    console.log(`\n📊 Panel ${panelNum}:`);
    console.log(`   Images:`);
    
    for (let v = 0; v < 2; v++) {
      const variantPath = path.join(__dirname, "data", "panels", panelSetId, `panel${panelNum}_variant${v}.png`);
      if (fs.existsSync(variantPath)) {
        console.log(`   - Variant ${v}: ${variantPath}`);
      }
    }

    const answer = await prompt(`   Select variant (0 or 1) or 'r' to regenerate: `);
    
    if (answer.toLowerCase() === "r") {
      console.log(`   🔄 Regeneration requested for panel ${panelNum}`);
      console.log(`   (Regeneration not yet implemented - please run pipeline again)`);
      selections[panelNum] = 0;
    } else {
      const selected = parseInt(answer);
      if (!isNaN(selected) && (selected === 0 || selected === 1)) {
        selections[panelNum] = selected;
        
        const srcPath = path.join(__dirname, "data", "panels", panelSetId, `panel${panelNum}_variant${selected}.png`);
        const destPath = path.join(variantDir, `panel${panelNum}.png`);
        
        if (!fs.existsSync(variantDir)) {
          fs.mkdirSync(variantDir, { recursive: true });
        }
        
        fs.copyFileSync(srcPath, destPath);
        console.log(`   ✅ Selected variant ${selected} -> final/panel${panelNum}.png`);
      } else {
        console.log(`   ⚠️ Invalid selection, defaulting to 0`);
        selections[panelNum] = 0;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ SELECTION COMPLETE");
  console.log("=".repeat(60));
  console.log(`\n📁 Final panels saved to: ${variantDir}`);
  console.log("\n📋 Selections:");
  for (const [panel, variant] of Object.entries(selections)) {
    console.log(`   Panel ${panel}: Variant ${variant}`);
  }
}

async function main() {
  const topic = process.argv[2] || await prompt('📚 Enter topic to iterate: ');
  
  if (!topic.trim()) {
    console.log("Usage: npx tsx scripts/comic-generator/iterate.ts <topic>");
    console.log("Example: npx tsx scripts/comic-generator/iterate.ts photosynthesis");
    process.exit(1);
  }

  await iterate(topic.trim());
}

if (require.main === module) {
  main();
}
