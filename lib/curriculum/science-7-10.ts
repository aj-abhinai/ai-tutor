/**
 * Science Class 7 Chapter 10
 */

import { SubjectCurriculum } from "./types";

export const SCIENCE_CHAPTER_10: SubjectCurriculum = {
    subject: "Science",
    chapters: [
        {
            id: "life-processes-plants",
            title: "Life Processes in Plants",
            overview: "How plants make food, transport water, and exchange gases.",
            topics: [
                {
                    id: "photosynthesis",
                    title: "Photosynthesis",
                    overview: "How plants make food using sunlight.",
                    subtopics: [
                        {
                            id: "raw-materials-products",
                            title: "Raw Materials and Products",
                            learningObjectives: [
                                "List the raw materials needed for photosynthesis",
                                "State the products of photosynthesis",
                                "Explain why photosynthesis is important",
                            ],
                            keyConcepts: [
                                "Plants use carbon dioxide and water to make food",
                                "The food made is glucose and stored as starch",
                                "Oxygen is released during photosynthesis",
                            ],
                            keyTerms: {
                                Photosynthesis: "Process by which plants make food using light",
                                Glucose: "Simple sugar made by plants",
                                Starch: "Stored form of food in plants",
                            },
                            examples: [
                                "Leaves make food during the day",
                                "Plants release oxygen that we breathe",
                            ],
                            misconceptions: [
                                "Plants only take in oxygen and give out carbon dioxide",
                            ],
                            questionBank: [
                                {
                                    id: "photosynthesis-q1",
                                    question: "Which two raw materials are used in photosynthesis?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Oxygen and glucose" },
                                        { label: "B", text: "Carbon dioxide and water" },
                                        { label: "C", text: "Nitrogen and water" },
                                        { label: "D", text: "Water and oxygen" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Photosynthesis uses carbon dioxide and water.",
                                    },
                                },
                                {
                                    id: "photosynthesis-q2",
                                    question: "A product of photosynthesis is",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Oxygen" },
                                        { label: "B", text: "Nitrogen" },
                                        { label: "C", text: "Smoke" },
                                        { label: "D", text: "Salt" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Oxygen is released during photosynthesis.",
                                    },
                                },
                                {
                                    id: "photosynthesis-q3",
                                    question: "Why is photosynthesis important?",
                                    type: "short",
                                    answer: {
                                        correct: "It makes food for the plant and gives oxygen to the air.",
                                        explanation: "Plants use the food to grow and we use oxygen.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "chlorophyll-sunlight",
                            title: "Chlorophyll and Sunlight",
                            learningObjectives: [
                                "Describe the role of chlorophyll",
                                "Explain why sunlight is needed",
                                "Identify where photosynthesis happens most",
                            ],
                            keyConcepts: [
                                "Chlorophyll is the green pigment that traps sunlight",
                                "Sunlight provides energy to make food",
                                "Photosynthesis mostly happens in green leaves",
                            ],
                            keyTerms: {
                                Chlorophyll: "Green pigment that absorbs sunlight",
                                Sunlight: "Energy source for photosynthesis",
                            },
                            examples: [
                                "Green leaves are the main food factories",
                                "Plants kept in darkness do not make food well",
                            ],
                            questionBank: [
                                {
                                    id: "chlorophyll-q1",
                                    question: "Chlorophyll helps plants by",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "absorbing sunlight" },
                                        { label: "B", text: "absorbing water only" },
                                        { label: "C", text: "making oxygen at night" },
                                        { label: "D", text: "storing soil" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Chlorophyll traps sunlight for photosynthesis.",
                                    },
                                },
                                {
                                    id: "chlorophyll-q2",
                                    question: "Photosynthesis happens mostly in",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "roots" },
                                        { label: "B", text: "green leaves" },
                                        { label: "C", text: "flowers" },
                                        { label: "D", text: "fruits" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Leaves have chlorophyll and get sunlight.",
                                    },
                                },
                                {
                                    id: "chlorophyll-q3",
                                    question: "Why do plants kept in the dark grow weak?",
                                    type: "short",
                                    answer: {
                                        correct: "They cannot make enough food without sunlight.",
                                        explanation: "Sunlight provides the energy for photosynthesis.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "transport-exchange",
                    title: "Transport and Exchange",
                    overview: "How water moves and gases exchange in leaves.",
                    subtopics: [
                        {
                            id: "xylem-transport",
                            title: "Xylem and Water Transport",
                            learningObjectives: [
                                "Explain how roots absorb water",
                                "Describe the function of xylem",
                                "State the direction of water movement",
                            ],
                            keyConcepts: [
                                "Roots absorb water and minerals from soil",
                                "Xylem carries water upward from roots to leaves",
                                "Water moves through stems to all parts",
                            ],
                            keyTerms: {
                                Xylem: "Tissue that carries water and minerals upward",
                                "Root hair": "Tiny root structures that absorb water",
                            },
                            examples: [
                                "Plants need regular watering to stay fresh",
                                "Water rises from roots to leaves in tall plants",
                            ],
                            questionBank: [
                                {
                                    id: "xylem-q1",
                                    question: "Which tissue carries water in plants?",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "Phloem" },
                                        { label: "B", text: "Xylem" },
                                        { label: "C", text: "Epidermis" },
                                        { label: "D", text: "Stomata" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Xylem carries water and minerals upward.",
                                    },
                                },
                                {
                                    id: "xylem-q2",
                                    question: "Water moves in a plant mostly from",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "leaves to roots" },
                                        { label: "B", text: "roots to leaves" },
                                        { label: "C", text: "flowers to fruits" },
                                        { label: "D", text: "stem to soil" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Water is absorbed by roots and moves upward.",
                                    },
                                },
                                {
                                    id: "xylem-q3",
                                    question: "How do roots absorb water?",
                                    type: "short",
                                    answer: {
                                        correct: "Through tiny root hairs from the soil.",
                                        explanation: "Root hairs increase surface area for absorption.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "transpiration-stomata",
                            title: "Transpiration and Stomata",
                            learningObjectives: [
                                "Define transpiration",
                                "State where gas exchange happens",
                                "Explain how transpiration helps plants",
                            ],
                            keyConcepts: [
                                "Transpiration is loss of water vapor from leaves",
                                "Stomata are tiny pores for gas exchange",
                                "Transpiration cools the plant and helps pull water",
                            ],
                            keyTerms: {
                                Transpiration: "Loss of water as vapor from leaves",
                                Stomata: "Tiny pores on leaves",
                            },
                            examples: [
                                "Leaves feel cooler after water evaporates",
                                "Stomata close to save water on hot days",
                            ],
                            questionBank: [
                                {
                                    id: "transpiration-q1",
                                    question: "Transpiration is the loss of",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "food from roots" },
                                        { label: "B", text: "water vapor from leaves" },
                                        { label: "C", text: "oxygen from roots" },
                                        { label: "D", text: "seeds from fruits" },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "It is loss of water vapor from leaves.",
                                    },
                                },
                                {
                                    id: "transpiration-q2",
                                    question: "Where do gases enter and leave a leaf?",
                                    type: "short",
                                    answer: {
                                        correct: "Through stomata on the leaf surface.",
                                        explanation: "Stomata are tiny pores for gas exchange.",
                                    },
                                },
                                {
                                    id: "transpiration-q3",
                                    question: "How does transpiration help a plant?",
                                    type: "reasoning",
                                    answer: {
                                        correct:
                                            "It cools the plant and helps pull water up from the roots.",
                                        explanation: "Water loss creates a pull that moves water upward.",
                                    },
                                },
                            ],
                        },
                        {
                            id: "respiration-plants",
                            title: "Respiration in Plants",
                            learningObjectives: [
                                "Explain that plants respire day and night",
                                "State the gases used and released in respiration",
                            ],
                            keyConcepts: [
                                "Respiration uses oxygen and releases carbon dioxide",
                                "Respiration happens all the time in plants",
                                "Energy is released when food is broken down",
                            ],
                            keyTerms: {
                                Respiration: "Process of breaking down food to release energy",
                                Energy: "Power needed for growth and life processes",
                            },
                            examples: [
                                "Seeds respire while germinating",
                                "Plants respire even at night",
                            ],
                            questionBank: [
                                {
                                    id: "respiration-q1",
                                    question: "In respiration, plants use",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "oxygen" },
                                        { label: "B", text: "carbon dioxide" },
                                        { label: "C", text: "sunlight" },
                                        { label: "D", text: "nitrogen" },
                                    ],
                                    answer: {
                                        correct: "A",
                                        explanation: "Respiration uses oxygen to release energy.",
                                    },
                                },
                                {
                                    id: "respiration-q2",
                                    question: "Plant respiration happens",
                                    type: "mcq",
                                    options: [
                                        { label: "A", text: "only in the day" },
                                        { label: "B", text: "only at night" },
                                        { label: "C", text: "day and night" },
                                        { label: "D", text: "only in winter" },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "Respiration is continuous in plants.",
                                    },
                                },
                                {
                                    id: "respiration-q3",
                                    question: "Why do plants need respiration?",
                                    type: "short",
                                    answer: {
                                        correct: "To release energy for growth and life processes.",
                                        explanation: "Energy from food is needed for all activities.",
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
