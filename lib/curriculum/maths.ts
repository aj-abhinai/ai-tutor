/**
 * NCERT Class 7 Maths Knowledge Base (selected chapters)
 */

import { SubjectCurriculum } from "./types";

export const MATHS_CURRICULUM: SubjectCurriculum = {
    subject: "Maths",
    chapters: [
        {
            id: "fractions-decimals",
            title: "Fractions and Decimals",
            overview: "Understand fractions, decimals, and how to work with them.",
            topics: [
                {
                    id: "fractions-basics",
                    title: "Fractions Basics",
                    overview: "Equivalent fractions and comparing fractions.",
                    subtopics: [
                        {
                            id: "equivalent-fractions",
                            title: "Equivalent Fractions",
                            learningObjectives: [
                                "Identify equivalent fractions",
                                "Create equivalent fractions by multiplying or dividing",
                            ],
                            keyConcepts: [
                                "Equivalent fractions represent the same value",
                                "Multiply or divide numerator and denominator by the same number",
                            ],
                            keyTerms: {
                                Equivalent: "Having the same value even if written differently",
                                Numerator: "Top number of a fraction",
                                Denominator: "Bottom number of a fraction",
                            },
                            examples: ["1/2 = 2/4 = 3/6", "3/5 = 6/10"],
                            questionBank: [
                                {
                                    id: "equiv-q1",
                                    question: "Which fraction is equivalent to 2/3?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "4/6" },
                                        { label: "B", text: "2/5" },
                                        { label: "C", text: "3/5" },
                                        { label: "D", text: "6/5" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Multiply top and bottom by 2: 2/3 = 4/6.",
                                    },
                                },
                                {
                                    id: "equiv-q2",
                                    question: "Make an equivalent fraction for 3/4.",
                                    type: "short",
                                    answer: {
                                        correct: "6/8 (or 9/12, 12/16).",
                                        explanation: "Multiply numerator and denominator by the same number.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "comparing-fractions",
                            title: "Comparing Fractions",
                            learningObjectives: [
                                "Compare fractions with same denominator",
                                "Compare fractions with different denominators",
                            ],
                            keyConcepts: [
                                "With same denominator, bigger numerator means bigger fraction",
                                "For different denominators, use equivalent fractions",
                            ],
                            keyTerms: {
                                Compare: "Decide which value is greater or smaller",
                                Denominator: "Bottom number of a fraction",
                            },
                            examples: ["3/7 > 2/7", "1/2 = 2/4, so 1/2 > 1/3"],
                            questionBank: [
                                {
                                    id: "compare-q1",
                                    question: "Which is bigger: 3/8 or 5/8?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "3/8" },
                                        { label: "B", text: "5/8" },
                                        { label: "C", text: "They are equal" },
                                        { label: "D", text: "Cannot compare" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Same denominator, bigger numerator is bigger.",
                                    },
                                },
                                {
                                    id: "compare-q2",
                                    question: "Which is bigger: 2/3 or 3/5?",
                                    type: "short",
                                    answer: {
                                        correct: "2/3 is bigger.",
                                        explanation: "Compare 10/15 and 9/15; 10/15 is bigger.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "fraction-operations",
                    title: "Operations on Fractions",
                    overview: "Add, subtract, multiply, and divide fractions.",
                    subtopics: [
                        {
                            id: "add-sub-fractions",
                            title: "Add and Subtract Fractions",
                            learningObjectives: [
                                "Add and subtract fractions with same denominator",
                                "Use LCM for different denominators",
                            ],
                            keyConcepts: [
                                "With same denominator, add or subtract numerators",
                                "With different denominators, make equivalent fractions",
                            ],
                            keyTerms: {
                                LCM: "Least common multiple",
                                Equivalent: "Same value written differently",
                            },
                            examples: ["2/7 + 3/7 = 5/7", "1/2 + 1/3 = 5/6"],
                            questionBank: [
                                {
                                    id: "addsub-q1",
                                    question: "2/5 + 1/5 =",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "3/5" },
                                        { label: "B", text: "3/10" },
                                        { label: "C", text: "2/10" },
                                        { label: "D", text: "1/25" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Same denominator, add numerators.",
                                    },
                                },
                                {
                                    id: "addsub-q2",
                                    question: "1/3 + 1/6 =",
                                    type: "short",
                                    answer: {
                                        correct: "1/2",
                                        explanation: "Convert to 2/6 + 1/6 = 3/6 = 1/2.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "multiply-divide-fractions",
                            title: "Multiply and Divide Fractions",
                            learningObjectives: [
                                "Multiply fractions by multiplying numerators and denominators",
                                "Divide fractions using reciprocal",
                            ],
                            keyConcepts: [
                                "To multiply, multiply tops and bottoms",
                                "To divide, multiply by the reciprocal",
                            ],
                            keyTerms: {
                                Reciprocal: "Flip of a fraction, like 2/3 becomes 3/2",
                                Product: "Result of multiplication",
                            },
                            examples: ["2/3 x 1/4 = 1/6", "1/2 divided by 1/4 = 2"],
                            questionBank: [
                                {
                                    id: "muldiv-q1",
                                    question: "2/3 x 3/5 =",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "6/15" },
                                        { label: "B", text: "1/5" },
                                        { label: "C", text: "5/6" },
                                        { label: "D", text: "3/8" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Multiply tops and bottoms: 6/15.",
                                    },
                                },
                                {
                                    id: "muldiv-q2",
                                    question: "Explain how you divide 3/4 by 2/3.",
                                    type: "reasoning",
                                    answer: {
                                        correct: "Multiply 3/4 by 3/2 to get 9/8.",
                                        explanation: "Dividing by a fraction means multiply by its reciprocal.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "decimals",
                    title: "Decimals",
                    overview: "Place value, reading, and operations with decimals.",
                    subtopics: [
                        {
                            id: "decimal-place-value",
                            title: "Place Value and Reading Decimals",
                            learningObjectives: [
                                "Read decimals using place value",
                                "Compare decimals with same length",
                            ],
                            keyConcepts: [
                                "Digits after the decimal show tenths, hundredths, and so on",
                                "Compare from left to right like whole numbers",
                            ],
                            keyTerms: {
                                Decimal: "A number with a decimal point",
                                "Place value": "Value of a digit based on its position",
                            },
                            examples: ["0.5 means five tenths", "0.75 is greater than 0.7"],
                            questionBank: [
                                {
                                    id: "decplace-q1",
                                    question: "Which is greater: 0.6 or 0.56?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "0.6" },
                                        { label: "B", text: "0.56" },
                                        { label: "C", text: "They are equal" },
                                        { label: "D", text: "Cannot compare" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "0.60 is greater than 0.56.",
                                    },
                                },
                                {
                                    id: "decplace-q2",
                                    question: "What is the place value of 7 in 0.57?",
                                    type: "short",
                                    answer: {
                                        correct: "Hundredths",
                                        explanation: "The 7 is in the hundredths place.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "decimal-operations",
                            title: "Operations and Conversion",
                            learningObjectives: [
                                "Add and subtract decimals",
                                "Convert fractions to decimals",
                            ],
                            keyConcepts: [
                                "Line up decimal points when adding or subtracting",
                                "Some fractions convert to terminating decimals",
                            ],
                            keyTerms: {
                                Convert: "Change from one form to another",
                                Terminating: "A decimal that ends",
                            },
                            examples: ["2.3 + 1.45 = 3.75", "1/4 = 0.25"],
                            questionBank: [
                                {
                                    id: "decops-q1",
                                    question: "2.5 + 0.7 =",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "3.2" },
                                        { label: "B", text: "2.12" },
                                        { label: "C", text: "2.57" },
                                        { label: "D", text: "3.25" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Line up decimals: 2.5 + 0.7 = 3.2.",
                                    },
                                },
                                {
                                    id: "decops-q2",
                                    question: "Convert 3/10 to a decimal.",
                                    type: "short",
                                    answer: {
                                        correct: "0.3",
                                        explanation: "Three tenths is 0.3.",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: "simple-equations",
            title: "Simple Equations",
            overview: "Form and solve equations using balance methods.",
            topics: [
                {
                    id: "understanding-equations",
                    title: "Understanding Equations",
                    overview: "Equation as a balance and forming equations.",
                    subtopics: [
                        {
                            id: "equation-balance",
                            title: "Equation as a Balance",
                            learningObjectives: [
                                "Explain the balance idea of equations",
                                "State that both sides are equal",
                            ],
                            keyConcepts: [
                                "An equation shows two equal expressions",
                                "Whatever you do to one side, do to the other",
                            ],
                            keyTerms: {
                                Equation: "A statement that two expressions are equal",
                                Balance: "A model that shows both sides are equal",
                            },
                            examples: ["x + 3 = 7 means x is 4", "Add 2 to both sides"],
                            questionBank: [
                                {
                                    id: "balance-q1",
                                    question: "In x + 5 = 9, x equals",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "4" },
                                        { label: "B", text: "5" },
                                        { label: "C", text: "9" },
                                        { label: "D", text: "14" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Subtract 5 from both sides: x = 4.",
                                    },
                                },
                                {
                                    id: "balance-q2",
                                    question: "What does the equal sign mean?",
                                    type: "short",
                                    answer: {
                                        correct: "Both sides have the same value.",
                                        explanation: "An equation shows balance.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "forming-equations",
                            title: "Forming Equations from Statements",
                            learningObjectives: [
                                "Translate word statements into equations",
                                "Identify the unknown as a variable",
                            ],
                            keyConcepts: [
                                "Use a letter to stand for the unknown",
                                "Words like sum and equals guide the equation",
                            ],
                            keyTerms: {
                                Variable: "A letter used to represent an unknown",
                                Sum: "The result of addition",
                            },
                            examples: ["A number plus 7 is 20: x + 7 = 20", "Twice a number is 14: 2x = 14"],
                            questionBank: [
                                {
                                    id: "forming-q1",
                                    question: "Write an equation: A number plus 7 is 20.",
                                    type: "short",
                                    answer: {
                                        correct: "x + 7 = 20",
                                        explanation: "Let x be the number.",
                                    },
                                },
                                {
                                    id: "forming-q2",
                                    question: "Twice a number is 16. The equation is",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "x + 2 = 16" },
                                        { label: "B", text: "2x = 16" },
                                        { label: "C", text: "x/2 = 16" },
                                        { label: "D", text: "2 + x = 16" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Twice means 2 times the number.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "solve-equations",
                    title: "Solving Equations",
                    overview: "Solve one-step and two-step equations.",
                    subtopics: [
                        {
                            id: "one-step-equations",
                            title: "One-Step Equations",
                            learningObjectives: [
                                "Solve equations with one operation",
                                "Use inverse operations",
                            ],
                            keyConcepts: [
                                "Use inverse operations to isolate the variable",
                                "Add, subtract, multiply, or divide on both sides",
                            ],
                            keyTerms: {
                                Inverse: "An operation that undoes another operation",
                                Isolate: "Get the variable alone",
                            },
                            examples: ["x - 4 = 9 gives x = 13", "3x = 15 gives x = 5"],
                            questionBank: [
                                {
                                    id: "one-step-q1",
                                    question: "Solve: x - 6 = 10",
                                    type: "short",
                                    answer: {
                                        correct: "x = 16",
                                        explanation: "Add 6 to both sides.",
                                    },
                                },
                                {
                                    id: "one-step-q2",
                                    question: "Solve: 4x = 28",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "7" },
                                        { label: "B", text: "8" },
                                        { label: "C", text: "24" },
                                        { label: "D", text: "32" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Divide both sides by 4.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "two-step-equations",
                            title: "Two-Step Equations",
                            learningObjectives: [
                                "Solve equations with two operations",
                                "Check solutions by substitution",
                            ],
                            keyConcepts: [
                                "Undo operations in reverse order",
                                "Check by putting the answer back in the equation",
                            ],
                            keyTerms: {
                                Substitute: "Put a value in place of a variable",
                                Solution: "A value that makes the equation true",
                            },
                            examples: ["2x + 3 = 11 gives x = 4", "5x - 10 = 20 gives x = 6"],
                            questionBank: [
                                {
                                    id: "two-step-q1",
                                    question: "Solve: 2x + 5 = 17",
                                    type: "short",
                                    answer: {
                                        correct: "x = 6",
                                        explanation: "Subtract 5, then divide by 2.",
                                    },
                                },
                                {
                                    id: "two-step-q2",
                                    question: "Solve: 3x - 4 = 11",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "3" },
                                        { label: "B", text: "5" },
                                        { label: "C", text: "7" },
                                        { label: "D", text: "9" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Add 4, then divide by 3.",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
