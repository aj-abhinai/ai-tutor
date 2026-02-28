export interface CharacterAppearance {
  size: string;
  feathers: string;
  beak: string;
  eyes: string;
  distinguishing_feature: string;
}

export interface Character {
  id: string;
  name: string;
  species: string;
  description: string;
  appearance: CharacterAppearance;
  clothing: string;
  accessories: string;
  personality: string;
  pose: string;
}

export interface CharacterStyle {
  art_style: string;
  mood: string;
  color_palette: string;
  line_style: string;
}

export interface CharacterDefinition {
  characters: {
    [key: string]: Character;
  };
  style: CharacterStyle;
}

export interface ComicPanel {
  panel_number: number;
  scene_description: string;
  dialogue: string;
  character_action: string;
  kids_present?: string[];
}

export interface ComicScript {
  topic: string;
  panels: ComicPanel[];
}

export interface PanelVariant {
  variant_id: number;
  image_base64: string;
  prompt: string;
}

export interface PanelWithVariants {
  panel_number: number;
  variants: PanelVariant[];
  selected_variant: number | null;
}

export interface ComicOutput {
  topic: string;
  character_id: string;
  panels: {
    panel_number: number;
    image_url: string;
    scene_description: string;
    dialogue: string;
    selected_variant: number;
  }[];
  created_at: string;
}
