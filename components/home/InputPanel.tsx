"use client";

import { Card, Select, SubjectButton } from "@/components/ui";
import { SubjectName } from "@/lib/curriculum";

interface InputPanelProps {
  subject: SubjectName;
  chapterTitle: string;
  topicId: string;
  subtopicId: string;
  chapterOptions: { value: string; label: string }[];
  topicOptions: { value: string; label: string }[];
  subtopicOptions: { value: string; label: string }[];
  onSubjectChange: (subject: SubjectName) => void;
  onChapterChange: (chapterTitle: string) => void;
  onTopicChange: (topicId: string) => void;
  onSubtopicChange: (subtopicId: string) => void;
  isTopicDisabled: boolean;
  isSubtopicDisabled: boolean;
  showChapterWarning: boolean;
}

export function InputPanel({
  subject,
  chapterTitle,
  topicId,
  subtopicId,
  chapterOptions,
  topicOptions,
  subtopicOptions,
  onSubjectChange,
  onChapterChange,
  onTopicChange,
  onSubtopicChange,
  isTopicDisabled,
  isSubtopicDisabled,
  showChapterWarning,
}: InputPanelProps) {
  return (
    <Card>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
        <div className="flex gap-4">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
        <Select
          value={chapterTitle}
          onChange={(e) => onChapterChange(e.target.value)}
          options={chapterOptions}
          placeholder="-- Choose a Chapter --"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
        <Select
          value={topicId}
          onChange={(e) => onTopicChange(e.target.value)}
          options={topicOptions}
          placeholder="-- Choose a Topic --"
          disabled={isTopicDisabled}
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
        <Select
          value={subtopicId}
          onChange={(e) => onSubtopicChange(e.target.value)}
          options={subtopicOptions}
          placeholder="-- Choose a Subtopic --"
          disabled={isSubtopicDisabled}
        />
        <p className="text-sm text-gray-500 mt-2">
          Pick a chapter, topic, and subtopic, then choose a card below to load the lesson.
        </p>
        {showChapterWarning && (
          <p className="text-xs text-amber-700 mt-2">
            Detailed topics are coming soon for this chapter. Please pick a chapter without the
            "Coming soon" tag.
          </p>
        )}
      </div>
    </Card>
  );
}
