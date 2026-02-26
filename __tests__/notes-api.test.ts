import { NextRequest } from "next/server";
import { DELETE, GET, PUT } from "@/app/api/notes/route";
import { getRequestUserId } from "@/lib/api/shared";
import {
  deleteStudentTopicNote,
  getStudentTopicNote,
  listStudentTopicNotes,
  upsertStudentTopicNote,
} from "@/lib/notes/firestore";

jest.mock("@/lib/api/shared", () => ({
  MAX_ID_LENGTH: 120,
  getRequestUserId: jest.fn(),
  isValidSubject: (subject: string) => subject === "Science" || subject === "Maths",
}));

jest.mock("@/lib/notes/firestore", () => ({
  deleteStudentTopicNote: jest.fn(),
  getStudentTopicNote: jest.fn(),
  listStudentTopicNotes: jest.fn(),
  upsertStudentTopicNote: jest.fn(),
}));

const getRequestUserIdMock = getRequestUserId as jest.MockedFunction<typeof getRequestUserId>;
const getStudentTopicNoteMock = getStudentTopicNote as jest.MockedFunction<typeof getStudentTopicNote>;
const listStudentTopicNotesMock = listStudentTopicNotes as jest.MockedFunction<typeof listStudentTopicNotes>;
const upsertStudentTopicNoteMock = upsertStudentTopicNote as jest.MockedFunction<typeof upsertStudentTopicNote>;
const deleteStudentTopicNoteMock = deleteStudentTopicNote as jest.MockedFunction<typeof deleteStudentTopicNote>;

describe("/api/notes", () => {
  beforeEach(() => {
    getRequestUserIdMock.mockReset();
    getStudentTopicNoteMock.mockReset();
    listStudentTopicNotesMock.mockReset();
    upsertStudentTopicNoteMock.mockReset();
    deleteStudentTopicNoteMock.mockReset();
    getRequestUserIdMock.mockResolvedValue("student-1");
  });

  it("returns notes list when topic params are absent", async () => {
    listStudentTopicNotesMock.mockResolvedValue([
      {
        id: "student-1__Science__matter__states",
        subject: "Science",
        chapterId: "matter",
        chapterTitle: "Matter Around Us",
        topicId: "states",
        topicTitle: "States of Matter",
        contentPreview: "Solid, liquid, gas...",
        updatedAt: 10,
      },
    ]);

    const request = new NextRequest("http://localhost/api/notes");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notes).toHaveLength(1);
    expect(listStudentTopicNotesMock).toHaveBeenCalledWith("student-1", undefined);
  });

  it("returns single note when topic params are present", async () => {
    getStudentTopicNoteMock.mockResolvedValue({
      id: "student-1__Science__matter__states",
      userId: "student-1",
      subject: "Science",
      chapterId: "matter",
      chapterTitle: "Matter Around Us",
      topicId: "states",
      topicTitle: "States of Matter",
      content: "Note body",
      createdAt: 1,
      updatedAt: 2,
    });

    const request = new NextRequest(
      "http://localhost/api/notes?subject=Science&chapterId=matter&topicId=states"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.note?.topicId).toBe("states");
    expect(getStudentTopicNoteMock).toHaveBeenCalledWith("student-1", "Science", "matter", "states");
  });

  it("upserts a topic note", async () => {
    upsertStudentTopicNoteMock.mockResolvedValue({
      id: "student-1__Science__matter__states",
      userId: "student-1",
      subject: "Science",
      chapterId: "matter",
      chapterTitle: "Matter Around Us",
      topicId: "states",
      topicTitle: "States of Matter",
      content: "States can change with temperature.",
      createdAt: 1,
      updatedAt: 2,
    });

    const request = new NextRequest("http://localhost/api/notes", {
      method: "PUT",
      body: JSON.stringify({
        subject: "Science",
        chapterId: "matter",
        chapterTitle: "Matter Around Us",
        topicId: "states",
        topicTitle: "States of Matter",
        content: "States can change with temperature.",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.note?.id).toContain("student-1__Science");
    expect(upsertStudentTopicNoteMock).toHaveBeenCalled();
  });

  it("deletes a topic note", async () => {
    deleteStudentTopicNoteMock.mockResolvedValue(true);

    const request = new NextRequest("http://localhost/api/notes", {
      method: "DELETE",
      body: JSON.stringify({
        subject: "Science",
        chapterId: "matter",
        topicId: "states",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deleted).toBe(true);
    expect(deleteStudentTopicNoteMock).toHaveBeenCalledWith("student-1", "Science", "matter", "states");
  });

  it("requires login", async () => {
    getRequestUserIdMock.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/notes");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
