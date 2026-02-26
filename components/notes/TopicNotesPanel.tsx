"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/TextArea";
import type { SubjectName } from "@/lib/learning-types";
import {
  deleteTopicNote,
  downloadNoteAsTextFile,
  getTopicNote,
  saveTopicNote,
} from "@/components/notes/client-api";

type TopicNotesPanelProps = {
  open: boolean;
  onClose: () => void;
  context: {
    subject: SubjectName;
    chapterId: string;
    chapterTitle: string;
    topicId: string;
    topicTitle: string;
  } | null;
};

export function TopicNotesPanel({ open, onClose, context }: TopicNotesPanelProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedValue, setSavedValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasContext = Boolean(context);
  const hasUnsavedChanges = draft !== savedValue;

  useEffect(() => {
    const panelContext = context;
    if (!open || !panelContext) return;
    const { subject, chapterId, topicId } = panelContext;

    let cancelled = false;
    async function loadNote() {
      setLoading(true);
      setError("");
      setSuccess("");
      const { note, error: loadError } = await getTopicNote({
        subject,
        chapterId,
        topicId,
      });
      if (cancelled) return;
      if (loadError) {
        setError(loadError);
        setDraft("");
        setSavedValue("");
      } else {
        const content = note?.content ?? "";
        setDraft(content);
        setSavedValue(content);
      }
      setLoading(false);
    }

    void loadNote();
    return () => {
      cancelled = true;
    };
  }, [open, context?.subject, context?.chapterId, context?.topicId]);

  useEffect(() => {
    if (!open || !hasUnsavedChanges) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [open, hasUnsavedChanges]);

  const fileName = useMemo(() => {
    if (!context) return "note.txt";
    const safeTopic = context.topicTitle.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
    return `${safeTopic || context.topicId}.txt`;
  }, [context]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm("You have unsaved note changes. Close anyway?");
      if (!shouldClose) return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!context) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const { note, error: saveError } = await saveTopicNote(context, draft);
    if (saveError || !note) {
      setError(saveError || "Failed to save note");
    } else {
      setSavedValue(note.content);
      setSuccess("Note saved.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!context) return;
    const shouldDelete = window.confirm("Delete this note permanently?");
    if (!shouldDelete) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    const { deleted, error: deleteError } = await deleteTopicNote({
      subject: context.subject,
      chapterId: context.chapterId,
      topicId: context.topicId,
    });

    if (deleteError) {
      setError(deleteError);
    } else if (deleted) {
      setDraft("");
      setSavedValue("");
      setSuccess("Note deleted.");
    } else {
      setSuccess("No note existed for this topic.");
    }

    setDeleting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm">
      <div className="ml-auto h-full w-full max-w-xl overflow-y-auto p-4 sm:p-6">
        <Card className="h-full rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <Badge variant="teal" className="uppercase">Topic Notes</Badge>
              <h2 className="mt-2 text-xl font-semibold text-text">{context?.topicTitle ?? "Select a Topic"}</h2>
              {context && (
                <p className="text-xs text-text-muted">{context.subject} / {context.chapterTitle}</p>
              )}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="rounded-full">
              Close
            </Button>
          </div>

          {!hasContext && (
            <Alert variant="warning">Pick a chapter and topic first, then open notes.</Alert>
          )}

          {hasContext && (
            <>
              <TextArea
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setSuccess("");
                }}
                rows={16}
                disabled={loading}
                placeholder="Write your note for this topic..."
                className="min-h-[320px]"
                maxLength={10000}
              />
              <div className="mt-2 text-xs text-text-muted">{draft.length} / 10000 characters</div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleSave} disabled={saving || loading}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => downloadNoteAsTextFile(fileName, draft)} disabled={!draft.trim()}>
                  Download TXT
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={deleting || loading}>
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </>
          )}

          {error && <Alert variant="error" className="mt-4 text-xs">{error}</Alert>}
          {success && <Alert variant="success" className="mt-4 text-xs">{success}</Alert>}
        </Card>
      </div>
    </div>
  );
}
