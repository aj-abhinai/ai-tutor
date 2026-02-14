"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ListenCardProps {
  isPlaying: boolean;
  ttsSupported: boolean;
  onPlayAudio: () => void;
}

export function ListenCard({ isPlaying, ttsSupported, onPlayAudio }: ListenCardProps) {
  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300 text-center">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Listen and Learn</h2>

      <div className="bg-white/80 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center border border-slate-200">
        <Button
          onClick={onPlayAudio}
          disabled={!ttsSupported}
          variant="primary"
          size="lg"
          className={`w-24 h-24 !rounded-full !px-0 !py-0 text-2xl shadow-[0_16px_30px_rgba(15,23,42,0.15)] transition-all transform ${isPlaying
              ? "!bg-rose-500 !text-white animate-pulse scale-105"
              : "!bg-emerald-600 !text-white hover:scale-110"
            }`}
          aria-disabled={!ttsSupported}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <p className="mt-4 text-slate-600 font-medium">
          {ttsSupported
            ? isPlaying
              ? "Reading aloud..."
              : "Tap to play narration"
            : "Text-to-speech is not supported in this browser."}
        </p>
      </div>

      <div className="text-sm text-slate-600">
        Tip: You can go back to the Learn card to read the text version.
      </div>
    </Card>
  );
}
