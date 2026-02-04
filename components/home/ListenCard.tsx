"use client";

import { Card } from "@/components/ui";

interface ListenCardProps {
  isPlaying: boolean;
  ttsSupported: boolean;
  onPlayAudio: () => void;
}

export function ListenCard({ isPlaying, ttsSupported, onPlayAudio }: ListenCardProps) {
  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Listen and Learn</h2>

      <div className="bg-teal-50 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center border-2 border-teal-100">
        <button
          onClick={onPlayAudio}
          disabled={!ttsSupported}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all transform ${
            isPlaying
              ? "bg-red-500 text-white animate-pulse scale-105"
              : "bg-teal-600 text-white hover:scale-110"
          } ${!ttsSupported ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-disabled={!ttsSupported}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <p className="mt-4 text-gray-600 font-medium">
          {ttsSupported
            ? isPlaying
              ? "Reading aloud..."
              : "Tap to play narration"
            : "Text-to-speech is not supported in this browser."}
        </p>
      </div>

      <div className="text-sm text-gray-600">
        Tip: You can go back to the Learn card to read the text version.
      </div>
    </Card>
  );
}
