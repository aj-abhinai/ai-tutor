import { NextRequest } from "next/server";
import { GET } from "@/app/api/unittest/questions/route";
import { getFirestoreClient } from "@/lib/firebase-admin";
import { getRequestUserId } from "@/lib/api/shared";

jest.mock("@/lib/firebase-admin", () => ({
  getFirestoreClient: jest.fn(),
}));

jest.mock("@/lib/api/shared", () => {
  const actual = jest.requireActual("@/lib/api/shared");
  return {
    ...actual,
    getRequestUserId: jest.fn(),
  };
});

const getFirestoreClientMock = getFirestoreClient as jest.MockedFunction<typeof getFirestoreClient>;
const getRequestUserIdMock = getRequestUserId as jest.MockedFunction<typeof getRequestUserId>;

const mockQuestion = {
  id: "q1",
  question: "What is the chemical symbol for water?",
  type: "mcq" as const,
  options: [
    { label: "A" as const, text: "H2O" },
    { label: "B" as const, text: "CO2" },
    { label: "C" as const, text: "NaCl" },
    { label: "D" as const, text: "O2" },
  ],
  answer: {
    correct: "A",
    explanation: "Water is H2O - two hydrogen atoms bonded to one oxygen atom.",
  },
};

const makeRequest = (subject: string) =>
  new NextRequest(`http://localhost/api/unittest/questions?subject=${subject}`);

describe("/api/unittest/questions", () => {
  let mockCollection: {
    where: jest.Mock;
  };
  let mockQuerySnapshot: {
    docs: Array<{
      data: () => {
        chapterId: string;
        chapterTitle: string;
        topicId: string;
        subtopicId: string;
        content?: {
          questionBank: Array<{
            id: string;
            question: string;
            type: string;
            options?: Array<{ label: string; text: string }>;
            answer: { correct: string; explanation: string };
          }>;
        };
      };
    }>;
  };

  beforeEach(() => {
    getRequestUserIdMock.mockReset();
    getRequestUserIdMock.mockResolvedValue("student-1");

    mockQuerySnapshot = {
      docs: [
        {
          data: () => ({
            chapterId: "ch1",
            chapterTitle: "Introduction to Physics",
            topicId: "t1",
            subtopicId: "st1",
            content: {
              questionBank: [mockQuestion],
            },
          }),
        },
        {
          data: () => ({
            chapterId: "ch2",
            chapterTitle: "Newton's Laws",
            topicId: "t1",
            subtopicId: "st2",
            content: {
              questionBank: [
                {
                  ...mockQuestion,
                  id: "q2",
                  question: "What is Newton's first law also known as?",
                  answer: { correct: "A", explanation: "Law of inertia." },
                },
              ],
            },
          }),
        },
      ],
    };

    mockCollection = {
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockQuerySnapshot),
      }),
    };

    getFirestoreClientMock.mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as unknown as ReturnType<typeof getFirestoreClient>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      getRequestUserIdMock.mockResolvedValue(null);

      const request = makeRequest("Science");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Login required");
    });

    it("allows authenticated user to access questions", async () => {
      getRequestUserIdMock.mockResolvedValue("student-1");

      const request = makeRequest("Science");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Input validation", () => {
    it("returns 401 when user is not authenticated even with valid subject", async () => {
      getRequestUserIdMock.mockResolvedValue(null);

      const request = makeRequest("Science");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("rejects missing subject query param", async () => {
      const request = new NextRequest("http://localhost/api/unittest/questions");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Subject");
    });

    it("rejects invalid subject", async () => {
      const request = makeRequest("History");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Science or Maths");
    });

    it("accepts valid subject Science", async () => {
      const request = makeRequest("Science");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("accepts valid subject Maths", async () => {
      const request = makeRequest("Maths");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Response structure", () => {
    it("returns questions array in response", async () => {
      const request = makeRequest("Science");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("questions");
      expect(Array.isArray(data.questions)).toBe(true);
    });

    it("returns chapter info with each question", async () => {
      const request = makeRequest("Science");
      const response = await GET(request);
      const data = await response.json();

      expect(data.questions[0]).toHaveProperty("chapterId");
      expect(data.questions[0]).toHaveProperty("chapterTitle");
      expect(data.questions[0]).toHaveProperty("question");
    });
  });

  describe("Question extraction", () => {
    it("extracts only mcq type questions", async () => {
      const request = makeRequest("Science");
      const response = await GET(request);
      const data = await response.json();

      data.questions.forEach((q: { question: { type: string } }) => {
        expect(q.question.type).toBe("mcq");
      });
    });

    it("limits questions to 5", async () => {
      const manyDocs = Array.from({ length: 10 }, (_, i) => ({
        data: () => ({
          chapterId: `ch${i}`,
          chapterTitle: `Chapter ${i}`,
          topicId: "t1",
          subtopicId: `st${i}`,
          content: {
            questionBank: [mockQuestion],
          },
        }),
      }));

      mockQuerySnapshot.docs = manyDocs as typeof mockQuerySnapshot.docs;

      const request = makeRequest("Science");
      const response = await GET(request);
      const data = await response.json();

      expect(data.questions.length).toBeLessThanOrEqual(5);
    });

    it("skips chapters without questionBank", async () => {
      mockQuerySnapshot.docs = [
        {
          data: () => ({
            chapterId: "ch1",
            chapterTitle: "Chapter Without Questions",
            topicId: "t1",
            subtopicId: "st1",
            content: {},
          }),
        },
      ] as typeof mockQuerySnapshot.docs;

      const request = makeRequest("Science");
      const response = await GET(request);
      const data = await response.json();

      expect(data.questions).toHaveLength(0);
    });

    it("skips duplicate chapters", async () => {
      mockQuerySnapshot.docs = [
        {
          data: () => ({
            chapterId: "ch1",
            chapterTitle: "Chapter 1",
            topicId: "t1",
            subtopicId: "st1",
            content: { questionBank: [mockQuestion] },
          }),
        },
        {
          data: () => ({
            chapterId: "ch1",
            chapterTitle: "Chapter 1 Duplicate",
            topicId: "t1",
            subtopicId: "st2",
            content: { questionBank: [mockQuestion] },
          }),
        },
      ] as typeof mockQuerySnapshot.docs;

      const request = makeRequest("Science");
      const response = await GET(request);
      const data = await response.json();

      const chapterIds = data.questions.map((q: { chapterId: string }) => q.chapterId);
      const uniqueIds = new Set(chapterIds);
      expect(uniqueIds.size).toBe(chapterIds.length);
    });

    it("skips chapters without chapterTitle", async () => {
      mockQuerySnapshot.docs = [
        {
          data: () => ({
            chapterId: "ch1",
            chapterTitle: undefined,
            topicId: "t1",
            subtopicId: "st1",
            content: { questionBank: [mockQuestion] },
          }),
        },
      ] as unknown as typeof mockQuerySnapshot.docs;

      const request = makeRequest("Science");
      const response = await GET(request);
      const data = await response.json();

      expect(data.questions).toHaveLength(0);
    });
  });

  describe("Error handling", () => {
    it("returns error when Firestore fails", async () => {
      const mockCollectionError = {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error("Firestore error")),
        }),
      };

      getFirestoreClientMock.mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollectionError),
      } as unknown as ReturnType<typeof getFirestoreClient>);

      const request = makeRequest("Science");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
