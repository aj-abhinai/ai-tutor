"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import type { SubjectName } from "@/lib/learning-types";
import type { StudentTopicNoteSummary } from "@/lib/notes/types";
import {
  deleteTopicNote,
  downloadNoteAsTextFile,
  getTopicNote,
  listTopicNotes,
  saveTopicNote,
} from "@/components/notes/client-api";

type SubjectFilter = "All" | SubjectName;

export default function NotesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("All");
  const [topicFilter, setTopicFilter] = useState<string>("All");
  const [notes, setNotes] = useState<StudentTopicNoteSummary[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [draft, setDraft] = useState("");
  const [savedValue, setSavedValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  const topicOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notes) {
      if (!map.has(note.topicId)) {
        map.set(note.topicId, note.topicTitle);
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (topicFilter === "All") return notes;
    return notes.filter((note) => note.topicId === topicFilter);
  }, [notes, topicFilter]);

  const selectedNoteMeta = useMemo(
    () => filteredNotes.find((note) => note.id === selectedNoteId) ?? null,
    [filteredNotes, selectedNoteId]
  );
  const hasUnsavedChanges = draft !== savedValue;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function loadNotes() {
      setNotesLoading(true);
      setError("");

      const { notes: fetchedNotes, error: listError } = await listTopicNotes(
        subjectFilter === "All" ? undefined : subjectFilter
      );
      if (cancelled) return;

      if (listError) {
        setError(listError);
        setNotes([]);
        setTopicFilter("All");
      } else {
        setNotes(fetchedNotes);
        if (topicFilter !== "All" && !fetchedNotes.some((note) => note.topicId === topicFilter)) {
          setTopicFilter("All");
        }
        if (fetchedNotes.length === 0) {
          setSelectedNoteId("");
          setDraft("");
          setSavedValue("");
        } else if (!fetchedNotes.some((note) => note.id === selectedNoteId)) {
          setSelectedNoteId(fetchedNotes[0].id);
        }
      }

      setNotesLoading(false);
    }

    void loadNotes();
    return () => {
      cancelled = true;
    };
  }, [subjectFilter, user, selectedNoteId, topicFilter]);

  useEffect(() => {
    if (filteredNotes.length === 0) {
      setSelectedNoteId("");
      return;
    }
    if (!filteredNotes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(filteredNotes[0].id);
    }
  }, [filteredNotes, selectedNoteId]);

  useEffect(() => {
    const noteMeta = selectedNoteMeta;
    if (!noteMeta) {
      setDraft("");
      setSavedValue("");
      return;
    }
    const { subject, chapterId, topicId } = noteMeta;

    let cancelled = false;
    async function loadSelectedNote() {
      setError("");
      const { note, error: loadError } = await getTopicNote({
        subject,
        chapterId,
        topicId,
      });
      if (cancelled) return;
      if (loadError) {
        setError(loadError);
        return;
      }
      const content = note?.content ?? "";
      setDraft(content);
      setSavedValue(content);
      setSuccess("");
    }

    void loadSelectedNote();
    return () => {
      cancelled = true;
    };
  }, [selectedNoteMeta]);

  const handleSave = async () => {
    if (!selectedNoteMeta) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const { note, error: saveError } = await saveTopicNote(
      {
        subject: selectedNoteMeta.subject,
        chapterId: selectedNoteMeta.chapterId,
        chapterTitle: selectedNoteMeta.chapterTitle,
        topicId: selectedNoteMeta.topicId,
        topicTitle: selectedNoteMeta.topicTitle,
      },
      draft
    );

    if (saveError || !note) {
      setError(saveError || "Failed to save note");
    } else {
      setSavedValue(note.content);
      setSuccess("Note updated.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedNoteMeta) return;
    const shouldDelete = window.confirm("Delete this note permanently?");
    if (!shouldDelete) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    const { deleted, error: deleteError } = await deleteTopicNote({
      subject: selectedNoteMeta.subject,
      chapterId: selectedNoteMeta.chapterId,
      topicId: selectedNoteMeta.topicId,
    });

    if (deleteError) {
      setError(deleteError);
    } else if (deleted) {
      const next = notes.filter((note) => note.id !== selectedNoteMeta.id);
      setNotes(next);
      setSelectedNoteId(next[0]?.id ?? "");
      setDraft("");
      setSavedValue("");
      setSuccess("Note deleted.");
    }

    setDeleting(false);
  };

  if (loading || notesLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <Card className="px-5 py-4 text-sm text-text-muted">Loading notes...</Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="indigo" className="uppercase">Student Notes</Badge>
            <h1 className="mt-2 text-2xl font-semibold text-text">My Notes</h1>
          </div>
          <div className="flex items-center gap-2">
            <LinkButton href="/profile" variant="outline" size="sm">Profile</LinkButton>
            <LinkButton href="/" variant="secondary" size="sm">Back to Tutor</LinkButton>
          </div>
        </div>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Subject</label>
            <Select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value as SubjectFilter)}
              options={[
                { value: "All", label: "All" },
                { value: "Science", label: "Science" },
                { value: "Maths", label: "Maths" },
              ]}
            />
          </div>

          {notes.length === 0 ? (
            <Alert variant="info">No notes yet. Open any lesson topic and tap Notes to create one.</Alert>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <div>
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Topic
                  </label>
                  <Select
                    value={topicFilter}
                    onChange={(event) => setTopicFilter(event.target.value)}
                    options={[{ value: "All", label: "All Topics" }, ...topicOptions]}
                  />
                </div>
                <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      selectedNoteId === note.id
                        ? "border-secondary bg-secondary-light/30"
                        : "border-border bg-surface hover:bg-muted-bg"
                    }`}
                  >
                    <div className="text-sm font-semibold text-text">{note.topicTitle}</div>
                    <div className="text-xs text-text-muted">{note.subject} / {note.chapterTitle}</div>
                    <div className="mt-2 text-xs text-text-muted">{note.contentPreview || "(Empty note)"}</div>
                  </button>
                ))}
                </div>
              </div>

              <div>
                {selectedNoteMeta ? (
                  <>
                    <div className="mb-2 text-sm font-semibold text-text">{selectedNoteMeta.topicTitle}</div>
                    <div className="mb-3 text-xs text-text-muted">{selectedNoteMeta.subject} / {selectedNoteMeta.chapterTitle}</div>
                    <TextArea
                      value={draft}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        setSuccess("");
                      }}
                      rows={14}
                      maxLength={10000}
                      className="min-h-[280px]"
                    />
                    <div className="mt-2 text-xs text-text-muted">{draft.length} / 10000 characters</div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => downloadNoteAsTextFile(`${selectedNoteMeta.topicId}.txt`, draft)}
                        disabled={!draft.trim()}
                      >
                        Download TXT
                      </Button>
                      <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert variant="info">Select a note to edit.</Alert>
                )}
              </div>
            </div>
          )}

          {error && <Alert variant="error" className="mt-4 text-xs">{error}</Alert>}
          {success && <Alert variant="success" className="mt-4 text-xs">{success}</Alert>}
        </Card>
      </div>
    </main>
  );
}
