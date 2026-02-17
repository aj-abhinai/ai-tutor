/**
 * Tests for /api/explain route
 *
 * These tests call the route handler directly (no running server required).
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/explain/route";
import { getSubtopicFromDB } from "@/lib/rag";
import { MOCK_SUBTOPIC } from "./fixtures/subtopic";

jest.mock("@/lib/rag", () => ({
  getSubtopicFromDB: jest.fn(),
}));

const getSubtopicFromDBMock = getSubtopicFromDB as jest.MockedFunction<typeof getSubtopicFromDB>;

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
    getSubtopicFromDBMock.mockReset();
    getSubtopicFromDBMock.mockResolvedValue(MOCK_SUBTOPIC);
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
});
