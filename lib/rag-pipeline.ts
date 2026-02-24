import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { getFirestoreClient } from "@/lib/firebase-admin";
import { parseJsonFromModel } from "@/lib/api/shared";
import type { QuestionItem, SubjectName } from "@/lib/learning-types";

export type ContentLane = "facts" | "activities";

export type SubtopicScope = {
  subject: SubjectName;
  chapterId: string;
  topicId: string;
  subtopicId: string;
};

export type SubtopicIngestInput = SubtopicScope & {
  title: string;
  pdfBytes: Uint8Array;
  sourceName?: string;
};

export type RagDocumentDoc = SubtopicScope & {
  docId: string;
  title: string;
  sourceName: string;
  markdown: string;
  extractedAtMs: number;
  chunkCount: number;
  factChunkCount: number;
  activityChunkCount: number;
  questionCount: number;
};

export type RagChunkDoc = SubtopicScope & {
  docId: string;
  chunkId: string;
  lane: ContentLane;
  heading: string;
  text: string;
  embedding: number[];
  sourceOrder: number;
  createdAtMs: number;
};

export type RagQuestionDoc = SubtopicScope & {
  docId: string;
  questionId: string;
  type: QuestionItem["type"];
  question: string;
  options?: QuestionItem["options"];
  answer: QuestionItem["answer"];
  hint?: string;
  sourceChunkIds: string[];
  createdAtMs: number;
};

export type IngestResult = {
  docId: string;
  markdownLength: number;
  factChunkCount: number;
  activityChunkCount: number;
  questionCount: number;
};

export type QueryInput = SubtopicScope & {
  question: string;
  topK?: number;
  lane?: "facts" | "activities" | "both";
};

export type QueryResult = {
  answer: string;
  citations: Array<{
    chunkId: string;
    lane: ContentLane;
    score: number;
    heading: string;
    textPreview: string;
  }>;
};

type RawChunk = {
  heading: string;
  text: string;
  lane: ContentLane;
  sourceOrder: number;
};

const DOC_COLLECTION = "subtopic_documents";
const FACT_COLLECTION = "subtopic_facts";
const ACTIVITY_COLLECTION = "subtopic_activities";
const QUESTION_COLLECTION = "subtopic_questions";

const MAX_CHUNK_CHARS = 1100;
const CHUNK_OVERLAP_CHARS = 160;
const DEFAULT_TOP_K = 5;

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenerativeAI(apiKey);
}

function buildSubtopicDocId(scope: SubtopicScope): string {
  return `${scope.subject}__${scope.chapterId}__${scope.topicId}__${scope.subtopicId}`;
}

function stripMarkdownFence(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:markdown|md|text)?/i, "").replace(/```$/i, "").trim();
}

function parseModelJson(text: string): unknown {
  const cleaned = stripMarkdownFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    return parseJsonFromModel(cleaned);
  }
}

function collapseWhitespace(value: string): string {
  return value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function classifyLane(heading: string, body: string): ContentLane {
  const text = `${heading}\n${body}`.toLowerCase();
  const activityHints = [
    "activity",
    "experiment",
    "materials",
    "procedure",
    "steps",
    "observation",
    "safety",
    "lab",
    "aim",
  ];
  return activityHints.some((hint) => text.includes(hint)) ? "activities" : "facts";
}

function splitIntoSections(markdown: string): Array<{ heading: string; body: string; lane: ContentLane }> {
  const lines = markdown.split(/\n/);
  const sections: Array<{ heading: string; body: string; lane: ContentLane }> = [];

  let currentHeading = "General";
  let currentBody: string[] = [];

  const pushCurrent = () => {
    const body = collapseWhitespace(currentBody.join("\n"));
    if (!body) return;
    sections.push({
      heading: currentHeading,
      body,
      lane: classifyLane(currentHeading, body),
    });
  };

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line.trim())) {
      pushCurrent();
      currentHeading = line.replace(/^#{1,6}\s+/, "").trim() || "General";
      currentBody = [];
      continue;
    }
    currentBody.push(line);
  }
  pushCurrent();
  return sections;
}

function chunkSection(heading: string, lane: ContentLane, body: string, startOrder: number): RawChunk[] {
  const chunks: RawChunk[] = [];
  const normalized = collapseWhitespace(body);
  if (!normalized) return chunks;

  if (normalized.length <= MAX_CHUNK_CHARS) {
    chunks.push({ heading, lane, text: normalized, sourceOrder: startOrder });
    return chunks;
  }

  let cursor = 0;
  let order = startOrder;
  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + MAX_CHUNK_CHARS);
    const slice = normalized.slice(cursor, end).trim();
    if (slice) {
      chunks.push({ heading, lane, text: slice, sourceOrder: order });
      order += 1;
    }
    if (end >= normalized.length) break;
    cursor = Math.max(0, end - CHUNK_OVERLAP_CHARS);
  }
  return chunks;
}

function createChunks(markdown: string): RawChunk[] {
  const sections = splitIntoSections(markdown);
  const result: RawChunk[] = [];
  let order = 0;
  for (const section of sections) {
    const sectionChunks = chunkSection(section.heading, section.lane, section.body, order);
    result.push(...sectionChunks);
    order += sectionChunks.length;
  }
  return result;
}

async function extractPdfToMarkdown(pdfBytes: Uint8Array, title: string): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.1,
    },
  });

  const prompt = `
You are extracting textbook content for a Class 7 tutor RAG pipeline.
Convert this PDF to clean markdown.
Rules:
- Preserve section hierarchy with markdown headings.
- Keep formulas and definitions intact.
- Keep activities/experiments with clear labels and steps.
- Do not add external information.
- Output markdown only, no explanation.
Document title: ${title}
`;

  const data = Buffer.from(pdfBytes).toString("base64");
  const response = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: "application/pdf",
        data,
      },
    },
  ]);

  return collapseWhitespace(stripMarkdownFence(response.response.text()));
}

async function embedText(text: string): Promise<number[]> {
  const model = getGeminiClient().getGenerativeModel({ model: "text-embedding-004" });
  const embedded = await model.embedContent({
    content: {
      role: "user",
      parts: [{ text }],
    },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return embedded.embedding.values;
}

async function embedQuery(text: string): Promise<number[]> {
  const model = getGeminiClient().getGenerativeModel({ model: "text-embedding-004" });
  const embedded = await model.embedContent({
    content: {
      role: "user",
      parts: [{ text }],
    },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return embedded.embedding.values;
}

function normalizeQuestionType(value: string): QuestionItem["type"] {
  const lowered = value.toLowerCase();
  if (lowered === "mcq" || lowered === "short" || lowered === "reasoning") return lowered;
  return "short";
}

function normalizeGeneratedQuestions(raw: unknown): QuestionItem[] {
  if (!Array.isArray(raw)) return [];
  const result: QuestionItem[] = [];

  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const row = entry as Record<string, unknown>;
    const question = typeof row.question === "string" ? row.question.trim() : "";
    const type = normalizeQuestionType(typeof row.type === "string" ? row.type : "short");
    const hint = typeof row.hint === "string" && row.hint.trim() ? row.hint.trim() : undefined;
    const answerRaw = row.answer as Record<string, unknown> | undefined;
    const correct =
      typeof answerRaw?.correct === "string" ? answerRaw.correct.trim() : "";
    const explanation =
      typeof answerRaw?.explanation === "string" ? answerRaw.explanation.trim() : "";
    if (!question || !correct || !explanation) return;

    let options: QuestionItem["options"] | undefined;
    if (Array.isArray(row.options)) {
      const parsed = row.options
        .map((option) => {
          if (!option || typeof option !== "object") return null;
          const opt = option as Record<string, unknown>;
          const label = typeof opt.label === "string" ? opt.label.trim().toUpperCase() : "";
          const text = typeof opt.text === "string" ? opt.text.trim() : "";
          if (!["A", "B", "C", "D"].includes(label) || !text) return null;
          return { label: label as "A" | "B" | "C" | "D", text };
        })
        .filter(Boolean) as NonNullable<QuestionItem["options"]>;
      if (parsed.length >= 2) {
        options = parsed;
      }
    }

    result.push({
      id: `q-${index + 1}`,
      question,
      type,
      options,
      answer: { correct, explanation },
      hint,
    });
  });

  return result;
}

async function generateSubtopicQuestions(input: {
  scope: SubtopicScope;
  title: string;
  facts: RawChunk[];
  activities: RawChunk[];
}): Promise<QuestionItem[]> {
  const model = getGeminiClient().getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const factContext = input.facts
    .slice(0, 14)
    .map((chunk, idx) => `[F${idx + 1}] ${chunk.text}`)
    .join("\n\n");
  const activityContext = input.activities
    .slice(0, 8)
    .map((chunk, idx) => `[A${idx + 1}] ${chunk.text}`)
    .join("\n\n");

  const prompt = `
Generate 10 exam-style Class 7 questions only from the provided subtopic context.
Subtopic scope:
- Subject: ${input.scope.subject}
- Chapter: ${input.scope.chapterId}
- Topic: ${input.scope.topicId}
- Subtopic: ${input.scope.subtopicId}
- Title: ${input.title}

Rules:
- Do not use outside knowledge.
- Keep language simple for Class 7.
- Include a mix of mcq, short, reasoning.
- For mcq, provide 4 options labelled A/B/C/D.
- Ensure answer.correct matches exactly one option label for mcq.
- Every question must have a short explanation.
- Return JSON array only.

JSON shape:
[
  {
    "question": "string",
    "type": "mcq | short | reasoning",
    "options": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
    "answer": {"correct":"...", "explanation":"..."},
    "hint": "optional string"
  }
]

Facts Context:
${factContext || "No factual chunks available."}

Activities Context:
${activityContext || "No activity chunks available."}
`;

  const result = await model.generateContent([{ text: prompt }]);
  const parsed = parseModelJson(result.response.text());
  return normalizeGeneratedQuestions(parsed).slice(0, 10);
}

async function deleteByScope(collectionName: string, scope: SubtopicScope): Promise<void> {
  const db = getFirestoreClient();
  let done = false;
  while (!done) {
    const snapshot = await db
      .collection(collectionName)
      .where("subject", "==", scope.subject)
      .where("chapterId", "==", scope.chapterId)
      .where("topicId", "==", scope.topicId)
      .where("subtopicId", "==", scope.subtopicId)
      .limit(300)
      .get();

    if (snapshot.empty) {
      done = true;
      continue;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function writeChunksAndQuestions(params: {
  scope: SubtopicScope;
  docId: string;
  markdown: string;
  title: string;
  sourceName: string;
  chunks: RawChunk[];
  questions: QuestionItem[];
}): Promise<IngestResult> {
  const db = getFirestoreClient();
  const now = Date.now();

  await Promise.all([
    deleteByScope(FACT_COLLECTION, params.scope),
    deleteByScope(ACTIVITY_COLLECTION, params.scope),
    deleteByScope(QUESTION_COLLECTION, params.scope),
  ]);

  const chunkDocs: RagChunkDoc[] = [];
  for (let i = 0; i < params.chunks.length; i += 1) {
    const chunk = params.chunks[i];
    const embedding = await embedText(chunk.text);
    const lanePrefix = chunk.lane === "facts" ? "f" : "a";
    const chunkId = `${params.docId}__${lanePrefix}__${i + 1}`;
    chunkDocs.push({
      ...params.scope,
      docId: params.docId,
      chunkId,
      lane: chunk.lane,
      heading: chunk.heading,
      text: chunk.text,
      embedding,
      sourceOrder: chunk.sourceOrder,
      createdAtMs: now,
    });
  }

  const factChunks = chunkDocs.filter((chunk) => chunk.lane === "facts");
  const activityChunks = chunkDocs.filter((chunk) => chunk.lane === "activities");

  const questionDocs: RagQuestionDoc[] = params.questions.map((question, index) => ({
    ...params.scope,
    docId: params.docId,
    questionId: `${params.docId}__q__${index + 1}`,
    type: question.type,
    question: question.question,
    options: question.options,
    answer: question.answer,
    hint: question.hint,
    sourceChunkIds: chunkDocs.slice(0, 5).map((chunk) => chunk.chunkId),
    createdAtMs: now,
  }));

  const docRecord: RagDocumentDoc = {
    ...params.scope,
    docId: params.docId,
    title: params.title,
    sourceName: params.sourceName,
    markdown: params.markdown,
    extractedAtMs: now,
    chunkCount: chunkDocs.length,
    factChunkCount: factChunks.length,
    activityChunkCount: activityChunks.length,
    questionCount: questionDocs.length,
  };

  const writeRows = async (rows: Array<{ id: string; data: Record<string, unknown> }>, collection: string) => {
    const pageSize = 400;
    for (let cursor = 0; cursor < rows.length; cursor += pageSize) {
      const page = rows.slice(cursor, cursor + pageSize);
      const batch = db.batch();
      page.forEach((row) => {
        const ref = db.collection(collection).doc(row.id);
        batch.set(ref, row.data);
      });
      await batch.commit();
    }
  };

  await db.collection(DOC_COLLECTION).doc(params.docId).set(docRecord);
  await writeRows(
    factChunks.map((chunk) => ({ id: chunk.chunkId, data: chunk })),
    FACT_COLLECTION,
  );
  await writeRows(
    activityChunks.map((chunk) => ({ id: chunk.chunkId, data: chunk })),
    ACTIVITY_COLLECTION,
  );
  await writeRows(
    questionDocs.map((question) => ({ id: question.questionId, data: question })),
    QUESTION_COLLECTION,
  );

  return {
    docId: params.docId,
    markdownLength: params.markdown.length,
    factChunkCount: factChunks.length,
    activityChunkCount: activityChunks.length,
    questionCount: questionDocs.length,
  };
}

export async function ingestSubtopicPdf(input: SubtopicIngestInput): Promise<IngestResult> {
  const scope: SubtopicScope = {
    subject: input.subject,
    chapterId: input.chapterId.trim(),
    topicId: input.topicId.trim(),
    subtopicId: input.subtopicId.trim(),
  };
  const docId = buildSubtopicDocId(scope);
  const markdown = await extractPdfToMarkdown(input.pdfBytes, input.title);
  const chunks = createChunks(markdown);
  const facts = chunks.filter((chunk) => chunk.lane === "facts");
  const activities = chunks.filter((chunk) => chunk.lane === "activities");
  const questions = await generateSubtopicQuestions({
    scope,
    title: input.title,
    facts,
    activities,
  });

  return writeChunksAndQuestions({
    scope,
    docId,
    markdown,
    title: input.title,
    sourceName: input.sourceName ?? "unknown.pdf",
    chunks,
    questions,
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function loadChunks(scope: SubtopicScope, lane: "facts" | "activities" | "both"): Promise<RagChunkDoc[]> {
  const db = getFirestoreClient();
  const fetchCollection = async (collection: string): Promise<RagChunkDoc[]> => {
    const snap = await db
      .collection(collection)
      .where("subject", "==", scope.subject)
      .where("chapterId", "==", scope.chapterId)
      .where("topicId", "==", scope.topicId)
      .where("subtopicId", "==", scope.subtopicId)
      .get();
    return snap.docs.map((doc) => doc.data() as RagChunkDoc);
  };

  if (lane === "facts") return fetchCollection(FACT_COLLECTION);
  if (lane === "activities") return fetchCollection(ACTIVITY_COLLECTION);
  const [facts, activities] = await Promise.all([
    fetchCollection(FACT_COLLECTION),
    fetchCollection(ACTIVITY_COLLECTION),
  ]);
  return [...facts, ...activities];
}

export async function answerSubtopicQuestion(input: QueryInput): Promise<QueryResult> {
  const lane = input.lane ?? "both";
  const topK = Math.max(1, Math.min(10, input.topK ?? DEFAULT_TOP_K));
  const chunks = await loadChunks(
    {
      subject: input.subject,
      chapterId: input.chapterId,
      topicId: input.topicId,
      subtopicId: input.subtopicId,
    },
    lane,
  );

  if (chunks.length === 0) {
    return {
      answer: "I do not have enough context for this subtopic yet. Please ask your teacher to ingest the textbook section first.",
      citations: [],
    };
  }

  const queryVector = await embedQuery(input.question);
  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const context = ranked
    .map(
      (row, index) =>
        `[${index + 1}] chunkId=${row.chunk.chunkId}; lane=${row.chunk.lane}; heading=${row.chunk.heading}\n${row.chunk.text}`,
    )
    .join("\n\n");

  const model = getGeminiClient().getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { temperature: 0.2 },
  });

  const prompt = `
You are a Class 7 tutor.
Use ONLY the provided context.
If the context does not clearly answer the question, say: "I don't have enough context from this subtopic to answer confidently."
Keep answer concise and student-friendly.
Do not use external knowledge.

Question:
${input.question}

Context:
${context}
`;

  const generated = await model.generateContent([{ text: prompt }]);
  const answer = generated.response.text().trim();

  return {
    answer,
    citations: ranked.map((row) => ({
      chunkId: row.chunk.chunkId,
      lane: row.chunk.lane,
      score: Number(row.score.toFixed(4)),
      heading: row.chunk.heading,
      textPreview: row.chunk.text.slice(0, 200),
    })),
  };
}

export async function getSubtopicQuestions(scope: SubtopicScope, limit = 10): Promise<QuestionItem[]> {
  const db = getFirestoreClient();
  const snap = await db
    .collection(QUESTION_COLLECTION)
    .where("subject", "==", scope.subject)
    .where("chapterId", "==", scope.chapterId)
    .where("topicId", "==", scope.topicId)
    .where("subtopicId", "==", scope.subtopicId)
    .limit(Math.max(1, Math.min(30, limit)))
    .get();

  return snap.docs.map((doc, index) => {
    const row = doc.data() as RagQuestionDoc;
    return {
      id: row.questionId || `q-${index + 1}`,
      question: row.question,
      type: row.type,
      options: row.options,
      answer: row.answer,
      hint: row.hint,
    };
  });
}
