"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface TourStep {
  title: string;
  description: string;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to AI Tutor!",
    description: "Your personal learning companion for Class 7 Science and Maths. Let's show you around!",
  },
  {
    title: "Choose Your Subject",
    description: "Select Science or Maths to get started. You can switch anytime using the subject buttons.",
  },
  {
    title: "Pick a Chapter & Topic",
    description: "Choose any chapter and topic to start learning. Each topic has detailed explanations.",
  },
  {
    title: "Learn with Explain Cards",
    description: "Three levels of explanation: Simple, Standard, and Deep. Pick what works for you!",
  },
  {
    title: "Quick Revision",
    description: "Review key terms and concepts with flashcards. Select a chapter and test your memory!",
  },
  {
    title: "Unit Test",
    description: "Take chapter-wise MCQ tests to check your understanding. Track your progress!",
  },
  {
    title: "Story Comics",
    description: "Fun visual stories for each topic - coming soon! Enjoy learning with pictures.",
  },
  {
    title: "You're All Set!",
    description: "Start exploring and happy learning! Remember, practice makes perfect.",
  },
];

const TOUR_STORAGE_KEY = "ai-tutor-tour-completed";

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TourModal({ isOpen, onClose }: TourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

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

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <Card variant="highlight" padding="lg" className="w-full max-w-md">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-text-muted mb-2">
              <span>Step {currentStep + 1} of {TOUR_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div 
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">
              {currentStep === 0 && "👋"}
              {currentStep === 1 && "📚"}
              {currentStep === 2 && "📖"}
              {currentStep === 3 && "💡"}
              {currentStep === 4 && "🎴"}
              {currentStep === 5 && "✅"}
              {currentStep === 6 && "📖"}
              {currentStep === 7 && "🚀"}
            </div>
            <h2 className="text-xl font-bold text-text mb-2">{step.title}</h2>
            <p className="text-sm text-text-muted">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="rounded-full"
            >
              Skip
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  className="rounded-full"
                >
                  ← Back
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                className="rounded-full"
              >
                {isLastStep ? "Get Started!" : "Next →"}
              </Button>
            </div>
          </div>
        </Card>
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
