/**
 * Tests for /api/quick-revision/flashcards route
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/quick-revision/flashcards/route";
import { getFirestoreClient } from "@/lib/firebase-admin";

jest.mock("@/lib/firebase-admin", () => ({
  getFirestoreClient: jest.fn(),
}));

const getFirestoreClientMock = getFirestoreClient as jest.MockedFunction<typeof getFirestoreClient>;

const makeRequest = (subject: string) =>
  new NextRequest(`http://localhost/api/quick-revision/flashcards?subject=${subject}`);

describe("/api/quick-revision/flashcards - GET", () => {
  let mockCollection: {
    where: jest.Mock;
  };
  let mockGet: jest.Mock;

  beforeEach(() => {
    mockGet = jest.fn();
    mockCollection = {
      where: jest.fn().mockReturnValue({
        get: mockGet,
      }),
    };
    getFirestoreClientMock.mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as unknown as ReturnType<typeof getFirestoreClient>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when subject query param is missing", async () => {
    const request = new NextRequest("http://localhost/api/quick-revision/flashcards");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Subject");
  });

  it("returns 400 when subject is invalid", async () => {
    const response = await GET(makeRequest("History"));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Subject");
  });

  it("returns flashcards for valid Science subject", async () => {
    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          chapterId: "chapter-1",
          chapterTitle: "Physics: Forces",
          content: {
            keyTerms: {
              Force: "A push or pull acting on an object",
              Mass: "The quantity of matter in an object",
            },
          },
        }),
      },
      {
        id: "doc-2",
        data: () => ({
          chapterId: "chapter-2",
          chapterTitle: "Chemistry: Elements",
          content: {
            keyConcepts: ["Atoms", "Molecules"],
          },
        }),
      },
    ];

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    const response = await GET(makeRequest("Science"));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.flashcards).toBeDefined();
    expect(Array.isArray(data.flashcards)).toBe(true);
    expect(data.flashcards.length).toBeGreaterThan(0);
    expect(data.flashcards[0]).toHaveProperty("id");
    expect(data.flashcards[0]).toHaveProperty("chapterId");
    expect(data.flashcards[0]).toHaveProperty("chapterTitle");
    expect(data.flashcards[0]).toHaveProperty("term");
    expect(data.flashcards[0]).toHaveProperty("definition");
  });

  it("returns flashcards for valid Maths subject", async () => {
    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          chapterId: "math-chapter-1",
          chapterTitle: "Fractions",
          content: {
            keyTerms: {
              Numerator: "The top number in a fraction",
              Denominator: "The bottom number in a fraction",
            },
          },
        }),
      },
    ];

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    const response = await GET(makeRequest("Maths"));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.flashcards).toBeDefined();
    expect(Array.isArray(data.flashcards)).toBe(true);
  });

  it("excludes duplicate terms across chapters", async () => {
    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          chapterId: "chapter-1",
          chapterTitle: "Chapter One",
          content: {
            keyTerms: {
              Force: "A push or pull",
            },
          },
        }),
      },
      {
        id: "doc-2",
        data: () => ({
          chapterId: "chapter-2",
          chapterTitle: "Chapter Two",
          content: {
            keyTerms: {
              Force: "Should be excluded as duplicate",
            },
          },
        }),
      },
    ];

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    const response = await GET(makeRequest("Science"));
    const data = await response.json();

    const forceCards = data.flashcards.filter(
      (card: { term: string }) => card.term === "Force"
    );
    expect(forceCards.length).toBe(1);
  });

  it("skips chapters without content", async () => {
    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          chapterId: "chapter-1",
          chapterTitle: "Chapter One",
          content: null,
        }),
      },
      {
        id: "doc-2",
        data: () => ({
          chapterId: "chapter-2",
          chapterTitle: "Chapter Two",
          content: {
            keyTerms: {
              Term: "Definition",
            },
          },
        }),
      },
    ];

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    const response = await GET(makeRequest("Science"));
    const data = await response.json();

    expect(data.flashcards.length).toBe(1);
    expect(data.flashcards[0].term).toBe("Term");
  });

  it("skips chapters without chapterTitle", async () => {
    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          chapterId: "chapter-1",
          chapterTitle: undefined,
          content: {
            keyTerms: {
              Term: "Definition",
            },
          },
        }),
      },
    ];

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    const response = await GET(makeRequest("Science"));
    const data = await response.json();

    expect(data.flashcards.length).toBe(0);
  });

  it("creates flashcards from keyConcepts when keyTerms is empty", async () => {
    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          chapterId: "chapter-1",
          chapterTitle: "Biology: Cells",
          content: {
            keyTerms: {},
            keyConcepts: ["Mitochondria", "DNA"],
          },
        }),
      },
    ];

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    const response = await GET(makeRequest("Science"));
    const data = await response.json();

    expect(data.flashcards.length).toBe(2);
    expect(data.flashcards[0].term).toBe("Mitochondria");
    expect(data.flashcards[0].definition).toContain("Mitochondria");
  });

  it("returns 500 when Firestore throws an error", async () => {
    mockGet.mockRejectedValue(new Error("Firestore error"));

    const response = await GET(makeRequest("Science"));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Failed to load flashcards");
  });

  it("limits flashcards to 10 per request", async () => {
    const mockDocs = Array.from({ length: 15 }, (_, i) => ({
      id: `doc-${i}`,
      data: () => ({
        chapterId: `chapter-${i}`,
        chapterTitle: `Chapter ${i}`,
        content: {
          keyTerms: {
            [`Term${i}`]: `Definition ${i}`,
          },
        },
      }),
    }));

    mockGet.mockResolvedValue({
      docs: mockDocs,
    });

    const response = await GET(makeRequest("Science"));
    const data = await response.json();

    expect(data.flashcards.length).toBeLessThanOrEqual(10);
  });
});
