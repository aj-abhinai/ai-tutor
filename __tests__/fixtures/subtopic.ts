import type { SubtopicKnowledge } from "@/lib/learning-types";

export const MOCK_SUBTOPIC: SubtopicKnowledge = {
  id: "closed-open-circuits",
  title: "Closed and Open Circuits",
  learningObjectives: ["Define closed and open circuits"],
  keyConcepts: ["A closed circuit allows current to flow."],
  keyTerms: {
    "Closed circuit": "A complete path for current.",
  },
  examples: ["A torch glows when the switch is on."],
  misconceptions: ["Current can flow in a broken path."],
  questionBank: [
    {
      id: "q1",
      question: "A bulb glows when the circuit is?",
      type: "mcq",
      options: [
        { label: "A", text: "open" },
        { label: "B", text: "closed" },
        { label: "C", text: "broken" },
        { label: "D", text: "damaged" },
      ],
      answer: {
        correct: "B",
        explanation: "Current flows in a closed circuit.",
      },
    },
  ],
};

