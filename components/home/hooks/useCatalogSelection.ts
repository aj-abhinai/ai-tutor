"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CurriculumCatalog, SubtopicKnowledge, SubjectName } from "@/lib/learning-types";

const ALL_SUBJECTS: SubjectName[] = ["Science", "Maths"];

type UseCatalogSelectionArgs = {
  initialCatalog: CurriculumCatalog | null;
  initialSubject: SubjectName;
  setError: (message: string) => void;
};

function pickDefaultChapterId(subject: SubjectName, catalog: CurriculumCatalog | null): string {
  const chapters = catalog?.chapters ?? [];
  if (chapters.length === 0) return "";

  if (subject !== "Science") {
    return chapters[0].id;
  }

  let bestId = chapters[0].id;
  let bestScore = -1;

  for (const chapter of chapters) {
    const text = `${chapter.id} ${chapter.title}`.toLowerCase();
    let score = 0;

    if (text.includes("electricity") || text.includes("electric")) score += 3;
    if (text.includes("circuit") || text.includes("circuits")) score += 3;
    if (text.includes("component") || text.includes("components")) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestId = chapter.id;
    }
  }

  // Only enforce special default if we found a meaningful match.
  return bestScore > 0 ? bestId : chapters[0].id;
}

export function useCatalogSelection({
  initialCatalog,
  initialSubject,
  setError,
}: UseCatalogSelectionArgs) {
  const [subject, setSubject] = useState<SubjectName>(initialSubject);
  const [catalog, setCatalog] = useState<CurriculumCatalog | null>(initialCatalog);
  const [catalogBySubject, setCatalogBySubject] = useState<Partial<Record<SubjectName, CurriculumCatalog>>>(
    initialCatalog ? { [initialSubject]: initialCatalog } : {},
  );
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [physicsLabChapterIds, setPhysicsLabChapterIds] = useState<string[]>([]);

  const chapterOptions = useMemo(
    () =>
      (catalog?.chapters ?? []).map((chapter) => ({
        value: chapter.id,
        label: chapter.title,
      })),
    [catalog],
  );

  const selectedChapter = chapterTitle
    ? (catalog?.chapters.find((chapter) => chapter.id === chapterTitle) ?? null)
    : null;

  const topicOptions = useMemo(() => {
    if (!selectedChapter) {
      return [{ value: "", label: "N/A (coming soon)" }];
    }
    return selectedChapter.topics.map((topic) => ({
      value: topic.id,
      label: topic.title,
    }));
  }, [selectedChapter]);

  const selectedTopic = selectedChapter
    ? selectedChapter.topics.find((topic) => topic.id === topicId) ?? null
    : null;

  const selectedSubtopicRef = selectedTopic
    ? (selectedTopic.subtopics.find((subtopic) => subtopic.id === subtopicId) ??
      selectedTopic.subtopics[0] ??
      null) as SubtopicKnowledge | null
    : null;

  async function fetchCatalogForSubject(targetSubject: SubjectName): Promise<CurriculumCatalog> {
    const res = await fetch(`/api/catalog?subject=${encodeURIComponent(targetSubject)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load catalog");
    return data.catalog as CurriculumCatalog;
  }

  // On first client load, fetch both subjects in parallel and cache them.
  const prefetchedBothRef = useRef(false);
  useEffect(() => {
    if (prefetchedBothRef.current) return;
    prefetchedBothRef.current = true;

    let cancelled = false;
    async function prefetchBothCatalogs() {
      const missingSubjects = ALL_SUBJECTS.filter((value) => !catalogBySubject[value]);
      if (missingSubjects.length === 0) return;

      try {
        const results = await Promise.all(
          missingSubjects.map(async (value) => [value, await fetchCatalogForSubject(value)] as const),
        );
        if (cancelled) return;
        setCatalogBySubject((prev) => {
          const next = { ...prev };
          for (const [value, loadedCatalog] of results) {
            next[value] = loadedCatalog;
          }
          return next;
        });
      } catch {
        // Keep the current subject usable even if background prefetch fails.
      }
    }

    void prefetchBothCatalogs();
    return () => {
      cancelled = true;
    };
  }, [catalogBySubject]);

  // On subject change, use cache first; fetch only if cache is missing.
  useEffect(() => {
    const cached = catalogBySubject[subject];
    if (cached) {
      setCatalog(cached);
      setCatalogLoading(false);
      return;
    }

    let cancelled = false;
    async function loadCatalog() {
      setCatalogLoading(true);
      setError("");
      try {
        const loadedCatalog = await fetchCatalogForSubject(subject);
        if (!cancelled) {
          setCatalog(loadedCatalog);
          setCatalogBySubject((prev) => ({ ...prev, [subject]: loadedCatalog }));
        }
      } catch (err) {
        if (!cancelled) {
          setCatalog(null);
          setError(err instanceof Error ? err.message : "Failed to load catalog");
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [catalogBySubject, setError, subject]);

  // Fetch lab chapter metadata used by chapter-level lab deep-link.
  useEffect(() => {
    let cancelled = false;

    async function loadPhysicsLabChapterIds() {
      if (subject !== "Science") {
        setPhysicsLabChapterIds([]);
        return;
      }

      try {
        const { getAuthHeaders } = await import("@/lib/auth-client");
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/physics/lab-chapters", { headers: authHeaders });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load physics lab chapters");

        if (!cancelled) {
          const chapterIds = Array.isArray(data?.chapterIds)
            ? data.chapterIds.filter((id: unknown) => typeof id === "string")
            : [];
          setPhysicsLabChapterIds(chapterIds);
        }
      } catch {
        if (!cancelled) {
          setPhysicsLabChapterIds([]);
        }
      }
    }

    void loadPhysicsLabChapterIds();
    return () => {
      cancelled = true;
    };
  }, [subject]);

  // Ensure a valid chapter is selected whenever catalog changes.
  useEffect(() => {
    const chapters = catalog?.chapters ?? [];
    if (chapters.length === 0) {
      setChapterTitle("");
      return;
    }
    if (!chapterTitle || !chapters.some((chapter) => chapter.id === chapterTitle)) {
      setChapterTitle(pickDefaultChapterId(subject, catalog));
    }
  }, [catalog, chapterTitle, subject]);

  // Keep topic/subtopic aligned with active chapter.
  useEffect(() => {
    if (!chapterTitle) {
      setTopicId("");
      setSubtopicId("");
      return;
    }
    const chapter = catalog?.chapters.find((item) => item.id === chapterTitle);
    if (!chapter) {
      setTopicId("");
      setSubtopicId("");
      return;
    }
    const firstTopicId = chapter.topics[0]?.id ?? "";
    const firstSubtopicId = chapter.topics[0]?.subtopics[0]?.id ?? "";
    setTopicId(firstTopicId);
    setSubtopicId(firstSubtopicId);
  }, [chapterTitle, catalog]);

  // Keep subtopic aligned with active topic.
  useEffect(() => {
    if (!selectedTopic) {
      setSubtopicId("");
      return;
    }
    const firstSubtopicId = selectedTopic.subtopics[0]?.id ?? "";
    setSubtopicId(firstSubtopicId);
  }, [selectedTopic, topicId]);

  return {
    subject,
    setSubject,
    catalogLoading,
    chapterTitle,
    setChapterTitle,
    topicId,
    setTopicId,
    subtopicId,
    setSubtopicId,
    chapterOptions,
    topicOptions,
    selectedChapter,
    selectedTopic,
    selectedSubtopicRef,
    physicsLabChapterIds,
  };
}
