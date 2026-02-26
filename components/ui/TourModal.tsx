"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TourStep {
  title: string;
  description: string;
  targetId?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to AI Tutor!",
    description: "Your personal learning companion for Class 7 Science and Maths. Let's show you around!",
  },
  {
    title: "Choose Your Subject",
    description: "Click here to select Science or Maths",
    targetId: "tour-subject-buttons",
    position: "bottom",
  },
  {
    title: "Pick a Chapter & Topic",
    description: "Select any chapter and topic to start learning",
    targetId: "tour-chapter-select",
    position: "bottom",
  },
  {
    title: "Learn with Explain Cards",
    description: "Three levels: Simple, Standard, and Deep explanations",
    targetId: "tour-explain-section",
    position: "top",
  },
  {
    title: "Quick Revision",
    description: "Review key terms with flashcards",
    targetId: "tour-quick-revision",
    position: "left",
  },
  {
    title: "Unit Test",
    description: "Take chapter-wise MCQ tests",
    targetId: "tour-unit-test",
    position: "left",
  },
  {
    title: "Story Comics",
    description: "Fun visual stories - coming soon!",
    targetId: "tour-story",
    position: "top",
  },
  {
    title: "You're All Set!",
    description: "Start exploring and happy learning!",
  },
];

const TOUR_STORAGE_KEY = "ai-tutor-tour-completed";

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TourModal({ isOpen, onClose }: TourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  useEffect(() => {
    if (!isOpen || !step.targetId) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const targetId = step.targetId;
      if (!targetId) {
        setTargetRect(null);
        return;
      }
      const element = document.getElementById(targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [isOpen, currentStep, step.targetId]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  const modalStyle = useMemo(() => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const padding = 16;
    const modalWidth = 320;
    const modalHeight = 220;

    switch (step.position) {
      case "top":
        return {
          top: Math.max(targetRect.top - modalHeight - padding, 20),
          left: Math.max(targetRect.left + (targetRect.width - modalWidth) / 2, 20),
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: Math.max(targetRect.left + (targetRect.width - modalWidth) / 2, 20),
        };
      case "left":
        return {
          top: targetRect.top + (targetRect.height - modalHeight) / 2,
          left: Math.max(targetRect.left - modalWidth - padding, 20),
        };
      case "right":
        return {
          top: targetRect.top + (targetRect.height - modalHeight) / 2,
          left: targetRect.right + padding,
        };
      default:
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
  }, [targetRect, step.position]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Highlight overlay */}
      {targetRect && (
        <div
          className="absolute border-2 border-accent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Modal */}
      <div
        className="absolute z-50 animate-in fade-in zoom-in-95 duration-300"
        style={modalStyle}
      >
        <Card variant="highlight" padding="lg" className="w-80">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>Step {currentStep + 1} of {TOUR_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">
              {currentStep === 0 && "👋"}
              {currentStep === 1 && "📚"}
              {currentStep === 2 && "📖"}
              {currentStep === 3 && "💡"}
              {currentStep === 4 && "🎴"}
              {currentStep === 5 && "✅"}
              {currentStep === 6 && "📖"}
              {currentStep === 7 && "🚀"}
            </div>
            <h2 className="text-lg font-bold text-text mb-1">{step.title}</h2>
            <p className="text-sm text-text-muted">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="rounded-full text-xs"
            >
              Skip
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  className="rounded-full text-xs"
                >
                  ←
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                className="rounded-full text-xs"
              >
                {isLastStep ? "Start!" : "→"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Pointer arrow */}
        {targetRect && step.position === "bottom" && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rotate-45" />
        )}
        {targetRect && step.position === "top" && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rotate-45" />
        )}
      </div>
    </div>
  );
}

export function useTour() {
  const [showTour, setShowTour] = useState(false);
  const [tourReady, setTourReady] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasSeenTour) {
      setShowTour(true);
    }
    setTourReady(true);
  }, []);

  const closeTour = useCallback(() => {
    setShowTour(false);
  }, []);

  return { showTour, closeTour, tourReady };
}
