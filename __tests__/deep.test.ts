/**
 * Tests for /api/deep route
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/deep/route";
import { getRequestUserId } from "@/lib/api/shared";
import { getSubtopicFromDB } from "@/lib/rag";
import { MOCK_SUBTOPIC } from "./fixtures/subtopic";

const generateContentMock = jest.fn();
const generateContentStreamMock = jest.fn();

jest.mock("@/lib/rag", () => ({
  getSubtopicFromDB: jest.fn(),
}));
jest.mock("@/lib/api/shared", () => {
  const actual = jest.requireActual("@/lib/api/shared");
  return {
    ...actual,
    getRequestUserId: jest.fn(),
  };
});

const getSubtopicFromDBMock = getSubtopicFromDB as jest.MockedFunction<typeof getSubtopicFromDB>;
const getRequestUserIdMock = getRequestUserId as jest.MockedFunction<typeof getRequestUserId>;

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: generateContentMock,
      generateContentStream: generateContentStreamMock,
    }),
  })),
}));

const VALID_BODY = {
  subject: "Science" as const,
  chapterId: "electricity-circuits",
  topicId: "circuits-and-switches",
  subtopicId: "closed-open-circuits",
};

const makeJsonRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/deep", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

describe("/api/deep - Deep explanation API", () => {
  beforeEach(() => {
    generateContentMock.mockReset();
    generateContentStreamMock.mockReset();
    getSubtopicFromDBMock.mockReset();
    getSubtopicFromDBMock.mockResolvedValue(MOCK_SUBTOPIC);
    getRequestUserIdMock.mockReset();
    getRequestUserIdMock.mockResolvedValue("student-1");
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("rejects missing subject", async () => {
    const response = await POST(
      makeJsonRequest({
        chapterId: VALID_BODY.chapterId,
        topicId: VALID_BODY.topicId,
        subtopicId: VALID_BODY.subtopicId,
      })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Subject");
  });

  it("rejects invalid subject", async () => {
    const response = await POST(makeJsonRequest({ ...VALID_BODY, subject: "History" }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Subject");
  });

  it("rejects ids longer than 120 characters", async () => {
    const response = await POST(
      makeJsonRequest({ ...VALID_BODY, chapterId: "a".repeat(121) })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("120");
  });

  it("returns deepEssay when the model succeeds", async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => JSON.stringify({ deepEssay: "<p>Deep</p>" }) },
    });

    const response = await POST(makeJsonRequest(VALID_BODY));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(typeof data.deepEssay).toBe("string");
    expect(data.deepEssay).toContain("<p>");
  });

  it("returns 502 when model returns invalid JSON", async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => "not json" },
    });

    const response = await POST(makeJsonRequest(VALID_BODY));

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toContain("invalid JSON");
  });

  it("streams NDJSON events when x-ai-stream is enabled", async () => {
    generateContentStreamMock.mockResolvedValue({
      stream: (async function* () {
        yield { text: () => "<p>Definition</p>" };
        yield { text: () => "<p>Applications</p>" };
      })(),
    });

    const response = await POST(makeJsonRequest(VALID_BODY, { "x-ai-stream": "1" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");

    const body = await response.text();
    const events = body
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { type: string; deepEssay?: string });

    expect(events.some((event) => event.type === "chunk")).toBe(true);
    const done = events.find((event) => event.type === "done");
    expect(done?.deepEssay).toContain("<p>Definition</p>");
  });
});
