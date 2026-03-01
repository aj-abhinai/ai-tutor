// Generates character reference images for comic characters
import { generateImageWithREST } from "./gemini-client";
import { characterConfig } from "./config";
import fs from "fs";
import path from "path";

const CHARACTER_REF_DIR = path.join(__dirname, "data", "character-refs");

export async function generateCharacterReference(characterId: string): Promise<string> {
  const character = characterConfig.characters[characterId];
  if (!character) {
    throw new Error(`Character '${characterId}' not found in config`);
  }

  const style = characterConfig.style;

  const prompt = `Create a friendly cartoon illustration of ${character.name}, a ${character.species}.
  
APPEARANCE:
- Size: ${character.appearance.size}
- Feathers: ${character.appearance.feathers}
- Beak: ${character.appearance.beak}
- Eyes: ${character.appearance.eyes}
- Distinctive feature: ${character.appearance.distinguishing_feature}

STYLE:
- Art style: ${style.art_style}
- Mood: ${style.mood}
- Colors: ${style.color_palette}
- Line style: ${style.line_style}

Show ${character.name} in a friendly pose, perhaps perched on a small branch or floating gently, with a warm, welcoming expression. Make it look like an educational mascot/teacher character.`;

  console.log(`\n🎨 Generating character reference for '${characterId}'...`);
  console.log(`Prompt: ${prompt.substring(0, 200)}...\n`);

  const base64Image = await generateImageWithREST(prompt);

  if (!base64Image) {
    throw new Error("No image data returned");
  }

  if (!fs.existsSync(CHARACTER_REF_DIR)) {
    fs.mkdirSync(CHARACTER_REF_DIR, { recursive: true });
  }

  const imagePath = path.join(CHARACTER_REF_DIR, `${characterId}.png`);
  fs.writeFileSync(imagePath, Buffer.from(base64Image, "base64"));

  console.log(`✅ Character reference saved to: ${imagePath}`);
  
  return imagePath;
}

export async function ensureCharacterReference(characterId: string): Promise<string> {
  const imagePath = path.join(CHARACTER_REF_DIR, `${characterId}.png`);
  
  if (fs.existsSync(imagePath)) {
    console.log(`📄 Using existing character reference: ${imagePath}`);
    return imagePath;
  }

  return generateCharacterReference(characterId);
}

if (require.main === module) {
  (async () => {
    try {
      const characterId = process.argv[2] || "chitri";
      await generateCharacterReference(characterId);
      console.log("\n✨ Done! Character reference created.");
    } catch (error) {
      console.error("Error generating character:", error);
      process.exit(1);
    }
  })();
}
