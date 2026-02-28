import { CharacterDefinition } from "./types";

export const CHITRILET_COUNT = 4;

export const characterConfig: CharacterDefinition = {
  characters: {
    chitri: {
      id: "chitri",
      name: "Chitri",
      species: "Older House Sparrow (Passer domesticus)",
      description:
        "An older house sparrow teacher with authentic sparrow markings: streaked brown back, buff-gray chest, pale eyebrow stripe, and a stout conical beak. She has gentle elder energy, kind eyes, and tiny round glasses while teaching. Slightly larger than the young birds, calm and reassuring.",
      appearance: {
        size: "about 16-17cm tall, mature and slightly larger than the young ones",
        feathers:
          "true house-sparrow pattern: warm brown streaked wings, buff-gray underparts, pale eyebrow stripe, subtle weathered gray around face",
        beak: "short stout conical seed-eating beak, yellowish-horn tone",
        eyes: "dark warm eyes, expressive but wise, with tiny teaching glasses",
        distinguishing_feature:
          "elder house-sparrow look with softly worn feathers and tiny round glasses",
      },
      clothing: "none (natural bird)",
      accessories: "tiny round glasses when teaching, sometimes a small leaf pointer",
      personality: "wise, patient, gentle, loving teacher; speaks clearly and encourages questions",
      pose: "often perched slightly above the kids, one wing raised in a guiding teaching gesture",
    },
    chitrilets: {
      id: "chitrilets",
      name: "The Chitrilets",
      species: "Young House Sparrow Chicks",
      description:
        "Four young house sparrow siblings who learn from Chitri in every panel. They are fluffy, small, and curious, with downy brown-gray feathers and bright questioning eyes. Their reactions should vary: one inquisitive, one surprised, one excited, one thoughtful.",
      appearance: {
        size: "tiny, about 8-9cm tall each, clearly smaller than Chitri",
        feathers: "soft downy brown-gray sparrow feathers, fluffier and less defined than adults",
        beak: "tiny short conical beaks, soft yellowish tone",
        eyes: "large bright curious eyes with varied emotional expressions",
        distinguishing_feature:
          "always shown as exactly four siblings together with distinct moods: curious, surprised, excited, thoughtful",
      },
      clothing: "none (natural birds)",
      accessories: "none",
      personality: "curious, eager learners, energetic, sometimes confused but always engaged",
      pose: "gathered around Chitri, looking up, hopping, and raising tiny wings with questions",
    },
  },
  style: {
    art_style: "cartoon illustration, Disney/Pixar-inspired, friendly educational style",
    mood: "warm, loving, curious, family-oriented, educational",
    color_palette: "warm earth tones - browns, soft grays, with bright green nature accents, cozy warm feeling",
    line_style: "smooth clean outlines, soft shading, children's book quality",
  },
};

export const PANELS_PER_COMIC = 4;
export const VARIANTS_PER_PANEL = 2;
export const CURRICULUM_CONTEXT = "NCERT Science, Class 7 (India)";
export const PANEL_TEXT_VERIFICATION_ENABLED = true;
export const PANEL_TEXT_MIN_MATCH_SCORE = 0.82;
export const PANEL_MAX_GENERATION_ATTEMPTS = 6;
export const OCR_MODEL = "gemini-2.5-flash";

export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";
