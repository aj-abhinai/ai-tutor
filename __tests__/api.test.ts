/**
 * Tests for /api/explain route
 *
 * These tests call the route handler directly (no running server required).
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/explain/route";
import {
  createGeminiModel,
  getRequestUserId,
  hasAiRouteAccess,
} from "@/lib/api/shared";
import { getSubtopicFromDB } from "@/lib/rag";
import { MOCK_SUBTOPIC } from "./fixtures/subtopic";

const generateContentMock = jest.fn();

jest.mock("@/lib/api/shared", () => {
  const actual = jest.requireActual("@/lib/api/shared");
  return {
    ...actual,
    createGeminiModel: jest.fn(),
    getRequestUserId: jest.fn(),
    hasAiRouteAccess: jest.fn(),
  };
});

jest.mock("@/lib/rag", () => ({
  getSubtopicFromDB: jest.fn(),
}));

const getSubtopicFromDBMock = getSubtopicFromDB as jest.MockedFunction<typeof getSubtopicFromDB>;
const getRequestUserIdMock = getRequestUserId as jest.MockedFunction<typeof getRequestUserId>;
const hasAiRouteAccessMock = hasAiRouteAccess as jest.MockedFunction<typeof hasAiRouteAccess>;
const createGeminiModelMock = createGeminiModel as jest.MockedFunction<typeof createGeminiModel>;

interface TutorResponse {
  content: {
    quickExplanation: string;
    bulletPoints: {
      simple: string[];
      standard: string[];
      deep: string[];
    };
    curiosityQuestion?: string;
  };
  subtopic: {
    id: string;
    questionBank: unknown[];
  };
}

const VALID_BODY = {
  subject: "Science" as const,
  chapterId: "electricity-circuits",
  topicId: "circuits-and-switches",
  subtopicId: "closed-open-circuits",
};

const makeJsonRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const makeRawRequest = (rawBody: string, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: rawBody,
  });

describe("/api/explain - Standard 7 Tutor API", () => {
  beforeEach(() => {
    createGeminiModelMock.mockReset();
    createGeminiModelMock.mockReturnValue({
      generateContent: generateContentMock,
    } as unknown as ReturnType<typeof createGeminiModel>);
    generateContentMock.mockReset();
    getSubtopicFromDBMock.mockReset();
    getSubtopicFromDBMock.mockResolvedValue(MOCK_SUBTOPIC);
    getRequestUserIdMock.mockReset();
    getRequestUserIdMock.mockResolvedValue("student-1");
    hasAiRouteAccessMock.mockReset();
    hasAiRouteAccessMock.mockReturnValue(true);
  });

  describe("Input validation", () => {
    it("rejects an invalid JSON body", async () => {
      const response = await POST(makeRawRequest("{"));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid JSON");
    });

    it("rejects request without subject", async () => {
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
      const response = await POST(
        makeJsonRequest({ ...VALID_BODY, subject: "History" })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Subject");
    });

    it("rejects request without chapter", async () => {
      const response = await POST(
        makeJsonRequest({
          subject: VALID_BODY.subject,
          topicId: VALID_BODY.topicId,
          subtopicId: VALID_BODY.subtopicId,
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Chapter");
    });

    it("rejects request without topic", async () => {
      const response = await POST(
        makeJsonRequest({
          subject: VALID_BODY.subject,
          chapterId: VALID_BODY.chapterId,
          subtopicId: VALID_BODY.subtopicId,
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Topic");
    });

    it("rejects empty subtopic", async () => {
      const response = await POST(
        makeJsonRequest({ ...VALID_BODY, subtopicId: "   " })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Subtopic");
    });

    it("rejects ids longer than 120 characters", async () => {
      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          chapterId: "a".repeat(121),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("120");
    });

    it("rejects unknown chapter/topic/subtopic combo", async () => {
      getSubtopicFromDBMock.mockResolvedValueOnce(null);

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          subtopicId: "not-a-real-subtopic",
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("not found");
    });

    it("requires student answer in feedback mode", async () => {
      const response = await POST(
        makeJsonRequest({ ...VALID_BODY, mode: "feedback" })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Student answer");
    });
  });

  describe("Response structure", () => {
    it("returns a lesson payload with explanation + bullet points", async () => {
      const response = await POST(makeJsonRequest(VALID_BODY));

      expect(response.status).toBe(200);
      const data = (await response.json()) as TutorResponse;
      expect(typeof data.content.quickExplanation).toBe("string");
      expect(Array.isArray(data.content.bulletPoints.simple)).toBe(true);
      expect(Array.isArray(data.content.bulletPoints.standard)).toBe(true);
      expect(Array.isArray(data.content.bulletPoints.deep)).toBe(true);
      expect(data.content.bulletPoints.simple.length).toBeGreaterThan(0);
      expect(data.subtopic.id).toBe(MOCK_SUBTOPIC.id);
      expect(Array.isArray(data.subtopic.questionBank)).toBe(true);
    });

    it("allows curiosityQuestion in response", async () => {
      const response = await POST(makeJsonRequest(VALID_BODY));

      expect(response.status).toBe(200);
      const data = (await response.json()) as TutorResponse;
      expect(data.content.curiosityQuestion).toBeDefined();
    });
  });

  describe("Feedback mode", () => {
    it("rejects feedback requests without AI route access", async () => {
      hasAiRouteAccessMock.mockReturnValueOnce(false);

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "feedback",
          studentAnswer: "Current flows through a closed loop.",
        })
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.code).toBe("UNAUTHORIZED");
      expect(createGeminiModelMock).not.toHaveBeenCalled();
    });

    it("rejects too-long feedback answers", async () => {
      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "feedback",
          studentAnswer: "a".repeat(601),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("600 characters or less");
      expect(createGeminiModelMock).not.toHaveBeenCalled();
    });

    it("returns 500 when Gemini model is unavailable", async () => {
      createGeminiModelMock.mockReturnValueOnce(null);

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "feedback",
          studentAnswer: "Current flows through a closed loop.",
        })
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.code).toBe("AI_UNAVAILABLE");
    });

    it("returns 502 with details in non-production on model failure", async () => {
      generateContentMock.mockRejectedValueOnce(new Error("gemini boom"));

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "feedback",
          studentAnswer: "Current flows through a closed loop.",
        })
      );

      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.code).toBe("AI_FAILURE");
      expect(data.details).toContain("gemini boom");
    });

    it("returns 502 without details in production on model failure", async () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        generateContentMock.mockRejectedValueOnce(new Error("prod boom"));

        const response = await POST(
          makeJsonRequest({
            ...VALID_BODY,
            mode: "feedback",
            studentAnswer: "Current flows through a closed loop.",
          })
        );

        expect(response.status).toBe(502);
        const data = await response.json();
        expect(data.code).toBe("AI_FAILURE");
        expect(data.details).toBeUndefined();
      } finally {
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it("returns 502 when model output is invalid JSON", async () => {
      generateContentMock.mockResolvedValueOnce({
        response: { text: () => "not json" },
      });

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "feedback",
          studentAnswer: "Current flows through a closed loop.",
        })
      );

      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.error).toContain("invalid JSON");
    });

    it("returns 502 when model JSON shape is missing fields", async () => {
      generateContentMock.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              rating: "good start",
              praise: "Nice effort",
              fix: "Add what happens in open circuits",
            }),
        },
      });

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "feedback",
          studentAnswer: "Current flows through a closed loop.",
        })
      );

      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.error).toContain("unexpected response");
    });

    it("returns normalized feedback in success path", async () => {
      generateContentMock.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              rating: " great ",
              praise: " Right: You explained current flow. ",
              fix: " Add that open circuits stop current. ",
              rereadTip: " Re-read closed and open circuits. ",
            }),
        },
      });

      const response = await POST(
        makeJsonRequest({
          ...VALID_BODY,
          mode: "feedback",
          studentAnswer: " Current flows through a closed loop. ",
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.feedback).toEqual({
        rating: "great",
        praise: "Right: You explained current flow.",
        fix: "Add that open circuits stop current.",
        rereadTip: "Re-read closed and open circuits.",
      });
    });
  });
});
