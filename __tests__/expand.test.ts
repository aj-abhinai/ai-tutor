/**
 * Tests for /api/expand route
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/expand/route";
import { getSubtopicFromDB } from "@/lib/rag";
import { MOCK_SUBTOPIC } from "./fixtures/subtopic";

const generateContentMock = jest.fn();

jest.mock("@/lib/rag", () => ({
  getSubtopicFromDB: jest.fn(),
}));

const getSubtopicFromDBMock = getSubtopicFromDB as jest.MockedFunction<typeof getSubtopicFromDB>;

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: generateContentMock,
    }),
  })),
}));

const VALID_BODY = {
  subject: "Maths" as const,
  chapterId: "fractions-decimals",
  topicId: "fractions-basics",
  subtopicId: "equivalent-fractions",
  level: "standard",
};

const makeJsonRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/expand", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

describe("/api/expand - Expanded explanation API", () => {
  beforeEach(() => {
    generateContentMock.mockReset();
    getSubtopicFromDBMock.mockReset();
    getSubtopicFromDBMock.mockResolvedValue(MOCK_SUBTOPIC);
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

  it("rejects invalid explanation level", async () => {
    const response = await POST(
      makeJsonRequest({ ...VALID_BODY, level: "advanced" })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Level");
  });

  it("returns expanded explanation payload", async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            expandedExplanation: "Short explanation.",
            analogy: "Like sharing pizza slices.",
            whyItMatters: "Fractions show parts of a whole.",
            commonConfusion: "Bigger denominator means smaller parts.",
          }),
      },
    });

    const response = await POST(makeJsonRequest(VALID_BODY));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(typeof data.expandedExplanation).toBe("string");
    expect(typeof data.analogy).toBe("string");
    expect(typeof data.whyItMatters).toBe("string");
    expect(typeof data.commonConfusion).toBe("string");
  });

  it("returns 502 when model returns invalid JSON", async () => {
    generateContentMock.mockResolvedValue({
      response: { text: () => "not json" },
    });

    const response = await POST(makeJsonRequest(VALID_BODY));

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toContain("unexpected response");
  });
});
