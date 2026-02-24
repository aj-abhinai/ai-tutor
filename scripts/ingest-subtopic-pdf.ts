import { readFile } from "node:fs/promises";
import { ingestSubtopicPdf } from "../lib/rag-pipeline";
import type { SubjectName } from "../lib/learning-types";

type CliArgs = {
  subject: SubjectName;
  chapterId: string;
  topicId: string;
  subtopicId: string;
  title: string;
  pdfPath: string;
  sourceName?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    map.set(key, value);
    i += 1;
  }

  const subject = map.get("subject");
  const chapterId = map.get("chapterId");
  const topicId = map.get("topicId");
  const subtopicId = map.get("subtopicId");
  const title = map.get("title");
  const pdfPath = map.get("pdfPath");
  const sourceName = map.get("sourceName");

  if (subject !== "Science" && subject !== "Maths") {
    throw new Error("subject must be Science or Maths");
  }
  if (!chapterId || !topicId || !subtopicId || !title || !pdfPath) {
    throw new Error(
      "Required args: --subject --chapterId --topicId --subtopicId --title --pdfPath",
    );
  }

  return {
    subject,
    chapterId,
    topicId,
    subtopicId,
    title,
    pdfPath,
    sourceName,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = await readFile(args.pdfPath);

  const result = await ingestSubtopicPdf({
    subject: args.subject,
    chapterId: args.chapterId,
    topicId: args.topicId,
    subtopicId: args.subtopicId,
    title: args.title,
    sourceName: args.sourceName ?? args.pdfPath.split(/[\\/]/).pop() ?? "source.pdf",
    pdfBytes: new Uint8Array(file),
  });

  // Keep CLI output simple for copy/paste logs.
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        ...result,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
