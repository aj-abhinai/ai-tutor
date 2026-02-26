"use client";

import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { SubjectButton } from "@/components/ui/SubjectButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { useAuth } from "@/components/auth/AuthProvider";
import type { SubjectName } from "@/lib/learning-types";

interface InputPanelProps {
  subject: SubjectName;
  chapterTitle: string;
  topicId: string;
  chapterOptions: { value: string; label: string }[];
  topicOptions: { value: string; label: string }[];
  onSubjectChange: (subject: SubjectName) => void;
  onChapterChange: (chapterTitle: string) => void;
  onTopicChange: (topicId: string) => void;
  isTopicDisabled: boolean;
  showChapterWarning: boolean;
  onRequireLogin?: (action: string) => void;
}

export function InputPanel({
  subject,
  chapterTitle,
  topicId,
  chapterOptions,
  topicOptions,
  onSubjectChange,
  onChapterChange,
  onTopicChange,
  isTopicDisabled,
  showChapterWarning,
  onRequireLogin,
}: InputPanelProps) {
  const { user } = useAuth();
  
  return (
    <Card variant="subtle" className="relative z-20 overflow-visible backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Subject
            </label>
            <div className="flex gap-3">
              {(["Science", "Maths"] as const).map((value) => (
                <SubjectButton
                  key={value}
                  subject={value}
                  isActive={subject === value}
                  onClick={() => onSubjectChange(value)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                Chapter
              </label>
              <Select
                value={chapterTitle}
                onChange={(e) => onChapterChange(e.target.value)}
                options={chapterOptions}
                placeholder="-- Choose a Chapter --"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                Topic
              </label>
              <Select
                value={topicId}
                onChange={(e) => onTopicChange(e.target.value)}
                options={topicOptions}
                placeholder="-- Choose a Topic --"
                disabled={isTopicDisabled}
              />
            </div>
          </div>

          <p className="text-sm text-text-muted mt-4">
            Pick a chapter and topic, then choose a card below to load the lesson.
          </p>
          {showChapterWarning && (
            <p className="text-xs text-warning mt-2">
              Detailed topics are coming soon for this chapter. Please pick a chapter without the
              &quot;Coming soon&quot; tag.
            </p>
          )}
        </div>

        <div className="flex-shrink-0 pt-8">
          <LinkButton
            href={user ? "/unittest" : "#"}
            onClick={(event) => {
              if (user) return;
              event.preventDefault();
              onRequireLogin?.("Unit Test");
            }}
            onMouseEnter={() => void import("@/app/unittest/page")}
            onFocus={() => void import("@/app/unittest/page")}
            variant="neutral"
            size="md"
            className="rounded-full bg-white border border-border text-text hover:bg-surface whitespace-nowrap"
          >
            Unit Test
          </LinkButton>
        </div>
      </div>
    </Card>
  );
}
