/**
 * Tests for /api/feedback route
 *
 * These tests call the route handler directly with mocked Gemini responses.
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/feedback/route";
import { getSubtopicFromDB } from "@/lib/rag";
import { MOCK_SUBTOPIC } from "./fixtures/subtopic";

const generateContentMock = jest.fn();
const generateContentStreamMock = jest.fn();

jest.mock("@/lib/rag", () => ({
  getSubtopicFromDB: jest.fn(),
}));

const getSubtopicFromDBMock = getSubtopicFromDB as jest.MockedFunction<typeof getSubtopicFromDB>;

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
  studentAnswer: "A closed circuit lets current flow.",
};

const makeJsonRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

describe("/api/feedback - Explain-it-back API", () => {
  beforeEach(() => {
    generateContentMock.mockReset();
    generateContentStreamMock.mockReset();
    getSubtopicFromDBMock.mockReset();
    getSubtopicFromDBMock.mockResolvedValue(MOCK_SUBTOPIC);
    process.env.GEMINI_API_KEY = "test-key";
  });

  describe("Input validation", () => {
    it("rejects request without subject", async () => {
      const response = await POST(
        makeJsonRequest({
          chapterId: VALID_BODY.chapterId,
          topicId: VALID_BODY.topicId,
          subtopicId: VALID_BODY.subtopicId,
          studentAnswer: VALID_BODY.studentAnswer,
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Subject");
    });

    it("rejects request without student answer", async () => {
      const response = await POST(
        makeJsonRequest({
          subject: VALID_BODY.subject,
          chapterId: VALID_BODY.chapterId,
          topicId: VALID_BODY.topicId,
          subtopicId: VALID_BODY.subtopicId,
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Student answer");
    });

    it("rejects too-long student answer", async () => {
      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          studentAnswer: "a".repeat(601),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("characters or less");
    });

    it("rejects quiz mode without question", async () => {
      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "quiz",
          expectedAnswer: "Current flows in a closed circuit.",
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Question");
    });

    it("rejects quiz mode without expected answer", async () => {
      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "quiz",
          question: "What is a closed circuit?",
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("expected answer");
    });

    it("returns 500 when API key is missing", async () => {
      const previous = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const response = await POST(makeJsonRequest(VALID_BODY));

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain("Server configuration error");

      process.env.GEMINI_API_KEY = previous;
    });
  });

  describe("Response structure", () => {
    it("returns feedback fields for explain mode", async () => {
      generateContentMock.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              rating: "great",
              praise: "Right: You mentioned current flow.",
              fix: "Wrong or missing: Add that open circuits stop current.",
              rereadTip: "Re-read: closed and open circuits",
            }),
        },
      });

      const response = await POST(makeJsonRequest(VALID_BODY));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data.feedback.rating).toBe("string");
      expect(typeof data.feedback.praise).toBe("string");
      expect(typeof data.feedback.fix).toBe("string");
      expect(typeof data.feedback.rereadTip).toBe("string");
    });

    it("returns isCorrect for quiz mode", async () => {
      generateContentMock.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              isCorrect: true,
              rating: "correct",
              praise: "Right: You named the correct idea.",
              fix: "Missing or incorrect: None.",
              rereadTip: "Re-read: current flow",
            }),
        },
      });

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "quiz",
          question: "What is a closed circuit?",
          expectedAnswer: "A closed circuit lets current flow.",
          answerExplanation: "Current flows only when the circuit is complete.",
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.feedback.isCorrect).toBe(true);
    });

    it("falls back to rule-based feedback on invalid model JSON", async () => {
      generateContentMock.mockResolvedValue({
        response: { text: () => "not json" },
      });

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "quiz",
          question: "What is a closed circuit?",
          expectedAnswer: "A closed circuit lets current flow.",
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data.feedback.rating).toBe("string");
      expect(typeof data.feedback.praise).toBe("string");
      expect(typeof data.feedback.fix).toBe("string");
      expect(typeof data.feedback.rereadTip).toBe("string");
      expect(typeof data.feedback.isCorrect).toBe("boolean");
    });

    it("streams NDJSON feedback events when x-ai-stream is enabled", async () => {
      generateContentStreamMock.mockResolvedValue({
        stream: (async function* () {
          yield { text: () => "RATING: great\nISCORRECT: true\n" };
          yield { text: () => "PRAISE: Good effort.\nFIX: Add open-circuit detail.\nREREADTIP: closed and open circuits\n" };
        })(),
      });

      const response = await POST(makeJsonRequest(VALID_BODY, { "x-ai-stream": "1" }));

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/x-ndjson");

      const body = await response.text();
      const events = body
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { type: string; feedback?: { rating?: string } });

      expect(events.some((event) => event.type === "chunk")).toBe(true);
      const done = events.find((event) => event.type === "done");
      expect(done?.feedback?.rating).toBe("great");
    });
  });
});
