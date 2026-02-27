import { getAuthHeaders } from "@/lib/auth-client";
import * as clientApi from "@/components/notes/client-api";

jest.mock("@/lib/auth-client", () => ({
  getAuthHeaders: jest.fn(),
}));

const getAuthHeadersMock = getAuthHeaders as jest.MockedFunction<typeof getAuthHeaders>;

describe("notes client-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuthHeadersMock.mockResolvedValue({ Authorization: "Bearer token" });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getTopicNote", () => {
    it("returns note when successful", async () => {
      const mockNote = {
        id: "note-1",
        userId: "user-1",
        subject: "Science",
        chapterId: "matter",
        chapterTitle: "Matter",
        topicId: "states",
        topicTitle: "States of Matter",
        content: "Note content",
        createdAt: 1,
        updatedAt: 2,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ note: mockNote }),
      });

      const result = await clientApi.getTopicNote({
        subject: "Science",
        chapterId: "matter",
        topicId: "states",
      });

      expect(result.note).toEqual(mockNote);
      expect(result.error).toBeUndefined();
    });

    it("returns error when API fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });

      const result = await clientApi.getTopicNote({
        subject: "Science",
        chapterId: "matter",
        topicId: "nonexistent",
      });

      expect(result.note).toBeNull();
      expect(result.error).toBe("Not found");
    });

    it("returns null note when response is empty", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await clientApi.getTopicNote({
        subject: "Science",
        chapterId: "matter",
        topicId: "states",
      });

      expect(result.note).toBeNull();
    });
  });

  describe("saveTopicNote", () => {
    it("returns note when save successful", async () => {
      const mockNote = {
        id: "note-1",
        userId: "user-1",
        subject: "Science",
        chapterId: "matter",
        chapterTitle: "Matter",
        topicId: "states",
        topicTitle: "States of Matter",
        content: "New content",
        createdAt: 1,
        updatedAt: 2,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ note: mockNote }),
      });

      const context = {
        subject: "Science" as const,
        chapterId: "matter",
        chapterTitle: "Matter",
        topicId: "states",
        topicTitle: "States of Matter",
      };

      const result = await clientApi.saveTopicNote(context, "New content");

      expect(result.note).toEqual(mockNote);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/notes",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ ...context, content: "New content" }),
        })
      );
    });

    it("returns error when save fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unauthorized" }),
      });

      const context = {
        subject: "Science" as const,
        chapterId: "matter",
        chapterTitle: "Matter",
        topicId: "states",
        topicTitle: "States of Matter",
      };

      const result = await clientApi.saveTopicNote(context, "content");

      expect(result.note).toBeNull();
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("deleteTopicNote", () => {
    it("returns deleted true when successful", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ deleted: true }),
      });

      const result = await clientApi.deleteTopicNote({
        subject: "Science",
        chapterId: "matter",
        topicId: "states",
      });

      expect(result.deleted).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/notes",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({
            subject: "Science",
            chapterId: "matter",
            topicId: "states",
          }),
        })
      );
    });

    it("returns error when delete fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });

      const result = await clientApi.deleteTopicNote({
        subject: "Science",
        chapterId: "matter",
        topicId: "nonexistent",
      });

      expect(result.deleted).toBe(false);
      expect(result.error).toBe("Not found");
    });
  });

  describe("listTopicNotes", () => {
    it("returns notes list when successful", async () => {
      const mockNotes = [
        {
          id: "note-1",
          subject: "Science",
          chapterId: "matter",
          chapterTitle: "Matter",
          topicId: "states",
          topicTitle: "States of Matter",
          contentPreview: "Preview 1",
          updatedAt: 1,
        },
        {
          id: "note-2",
          subject: "Maths",
          chapterId: "algebra",
          chapterTitle: "Algebra",
          topicId: "equations",
          topicTitle: "Linear Equations",
          contentPreview: "Preview 2",
          updatedAt: 2,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ notes: mockNotes }),
      });

      const result = await clientApi.listTopicNotes();

      expect(result.notes).toHaveLength(2);
      expect(result.error).toBeUndefined();
    });

    it("accepts subject filter", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ notes: [] }),
      });

      await clientApi.listTopicNotes("Science");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/notes?subject=Science",
        expect.objectContaining({ headers: { Authorization: "Bearer token" } })
      );
    });

    it("returns empty list when API fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Server error" }),
      });

      const result = await clientApi.listTopicNotes();

      expect(result.notes).toEqual([]);
      expect(result.error).toBe("Server error");
    });

    it("returns empty list when response is empty", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await clientApi.listTopicNotes();

      expect(result.notes).toEqual([]);
    });
  });

  describe("downloadNoteAsTextFile", () => {
    it("function exists and is exported", () => {
      expect(typeof clientApi.downloadNoteAsTextFile).toBe("function");
    });
  });
});
