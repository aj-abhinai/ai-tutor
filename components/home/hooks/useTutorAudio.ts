"use client";

import { useCallback, useEffect, useState } from "react";
import { cleanTextForSpeech } from "@/components/home/lesson-utils";
import type { ExplainLevel, TutorLessonResponse } from "@/components/home/types";

type UseTutorAudioArgs = {
  data: TutorLessonResponse | null;
  explainLevel: ExplainLevel;
  deepEssay: string | null;
};

export function useTutorAudio({ data, explainLevel, deepEssay }: UseTutorAudioArgs) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Stop active speech and reset UI playback state.
  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  // Initialize browser voices list and clean up speech resources.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTtsSupported(false);
      return;
    }

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Toggle between speaking current lesson content and stopping playback.
  const handlePlayAudio = useCallback(() => {
    if (!data || !ttsSupported) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    const deepNarrationSource =
      explainLevel === "deep"
        ? deepEssay || (data.bulletPoints?.deep ?? []).join(" ")
        : "";
    const bulletNarrationSource =
      explainLevel === "deep"
        ? deepNarrationSource
        : (data.bulletPoints?.[explainLevel] ?? []).join(" ");
    const bulletNarration = bulletNarrationSource
      .split(/\n+/)
      .map((point, index) => {
        const cleaned = cleanTextForSpeech(point);
        return cleaned ? `Point ${index + 1}. ${cleaned}` : "";
      })
      .filter(Boolean)
      .join(" ");
    const textToRead = `Quick Explanation. ${cleanTextForSpeech(
      data.quickExplanation,
    )}. Key points. ${bulletNarration}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const preferredVoice =
      availableVoices.find((voice) => voice.lang.toLowerCase().includes("en-in")) ||
      availableVoices.find((voice) => voice.lang.toLowerCase().includes("en-us"));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [data, deepEssay, explainLevel, isPlaying, stopAudio, ttsSupported, voices]);

  return {
    isPlaying,
    ttsSupported,
    stopAudio,
    handlePlayAudio,
  };
}
