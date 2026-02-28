interface GeminiModel {
  name?: string;
  supportedGenerationMethods?: string[];
}

interface ListModelsResponse {
  models?: GeminiModel[];
}

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`HTTP ${response.status}: ${details}`);
    }

    const payload = (await response.json()) as ListModelsResponse;
    const models = payload.models ?? [];

    console.log("Available models:");
    for (const model of models) {
      console.log(`  - ${model.name ?? "unknown"}`);
      console.log(
        `    Supported methods: ${(model.supportedGenerationMethods ?? []).join(", ")}`
      );
    }
  } catch (error) {
    console.error("Error listing models:", error);
    process.exit(1);
  }
}

void listModels();
