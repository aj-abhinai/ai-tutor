/**
 * Science Class 7 Chapter 11
 */

import { SubjectCurriculum } from "./types";

export const SCIENCE_CHAPTER_11: SubjectCurriculum = {
    subject: "Science",
    chapters: [
        {
            id: "science-7-11",
            title: "Light: Shadows and Reflections",
            overview: "Understanding sources of light, how light travels, shadows, and reflections in mirrors.",
            topics: [
                {
                    id: "11.1-sources-of-light",
                    title: "Sources of Light",
                    overview: "The Sun gives out or emits its own light and is the main source",
                    subtopics: [
                        {
                            id: "11.1-sources-of-light",
                            title: "Sources of Light",
                            learningObjectives: [
                                "Identify the Sun as the main natural source of light.",
                                "Distinguish between natural and man-made sources of light.",
                                "Define and provide examples of luminous and non-luminous objects.",
                                "Recognize the advantages of modern electric light sources like LED lamps.",
                            ],
                            keyConcepts: [
                                "The Sun is the primary natural source of light, emitting its own light.",
                                "Sources of light can be natural (like the Sun and certain animals) or man-made (like fire and electric lamps).",
                                "Luminous objects are objects that emit their own light.",
                                "Non-luminous objects do not emit their own light but reflect light from luminous objects.",
                                "LED lamps are modern electric light sources that consume less power, are brighter, and last longer, making them environmentally friendly.",
                            ],
                            keyTerms: {
                                "Luminous objects": "Objects that emit their own light.",
                                "Non-luminous objects": "Objects that do not emit their own light.",
                                "LED lamps": "Modern electric light sources that consume less power, are brighter, and last longer.",
                            },
                            examples: [
                                "The Sun, certain animals, fire, and electric lamps are examples of luminous objects.",
                                "The Moon is an example of a non-luminous object because it reflects light from the Sun.",
                            ],
                            misconceptions: [
                                "The Moon emits its own light. (The Moon is a non-luminous object; it only reflects light from the Sun.)",
                            ],
                            questionBank: [
                                {
                                    id: "sources-of-light-q1",
                                    question: "What is the main natural source of light mentioned in the text?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "The Moon",
                                        },
                                        {
                                            label: "B",
                                            text: "Fire",
                                        },
                                        {
                                            label: "C",
                                            text: "The Sun",
                                        },
                                        {
                                            label: "D",
                                            text: "LED lamps",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The text states, 'The Sun gives out or emits its own light and is the main source'.",
                                    },
                                },
                                {
                                    id: "sources-of-light-q2",
                                    question: "Which of the following is an example of a non-luminous object?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "The Sun",
                                        },
                                        {
                                            label: "B",
                                            text: "Fire",
                                        },
                                        {
                                            label: "C",
                                            text: "The Moon",
                                        },
                                        {
                                            label: "D",
                                            text: "Certain animals that emit light",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The text explicitly states, 'The Moon is a non-luminous object. It does not emit its own light. It only reflects the light given out by the Sun that falls on it'.",
                                    },
                                },
                                {
                                    id: "sources-of-light-q3",
                                    question: "What is a key advantage of LED lamps mentioned in the text?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "They are made from animal fat.",
                                        },
                                        {
                                            label: "B",
                                            text: "They consume much less power.",
                                        },
                                        {
                                            label: "C",
                                            text: "They were used in ancient times.",
                                        },
                                        {
                                            label: "D",
                                            text: "They only reflect light.",
                                        },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The text mentions, 'Light Emitting Diode (LED) lamps are modern light sources that consume much less power, are brighter and last longer than traditional lamps'.",
                                    },
                                },
                                {
                                    id: "sources-of-light-q4",
                                    question: "Define a luminous object.",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Objects that emit their own light are called luminous objects.",
                                        explanation: "The text defines luminous objects as 'Objects that emit their own light'.",
                                    },
                                },
                                {
                                    id: "sources-of-light-q5",
                                    question: "Name two man-made sources of light mentioned in the text.",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Fire and electric light sources (like LED lamps) are two man-made sources of light.",
                                        explanation: "The text mentions humans creating fire and later, electric light sources.",
                                    },
                                },
                                {
                                    id: "sources-of-light-q6",
                                    question: "Why are LED lamps considered better for the environment, according to the text?",
                                    type: "reasoning",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "LED lamps are considered better for the environment because they consume much less power, which reduces electricity bills and is beneficial for the environment. They also need to be appropriately disposed of or recycled.",
                                        explanation: "The text states that LED lamps 'consume much less power... This not only reduces electricity bills but is also better for environment.' It also adds that they 'must be appropriately disposed or recycled'.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "11.2-does-light-travel-in-a-straight-line",
                    title: "Does Light Travel in a Straight Line?",
                    overview: "Screen Hole",
                    subtopics: [
                        {
                            id: "11.2-does-light-travel-in-a-straight-line",
                            title: "Does Light Travel in a Straight Line?",
                            learningObjectives: [
                                "Describe experimental setups to demonstrate that light travels in a straight line.",
                                "Explain observations from activities that support the straight-line propagation of light.",
                                "State that light generally travels in a straight path.",
                            ],
                            keyConcepts: [
                                "Light travels in a straight line, meaning it follows a direct path.",
                                "If the straight path of light is blocked or bent, light cannot reach the observer or screen.",
                                "Experiments using aligned holes, straight pipes, and laser beams in water provide evidence that light travels in a straight line.",
                            ],
                            keyTerms: {
                                "Screen": "A surface, like cardboard, used to display a spot of light or an image.",
                                "Laser beam": "A narrow, focused beam of light, often used in experiments to show light's path.",
                            },
                            examples: [
                                "A bright spot of light appearing on a screen when holes in three matchboxes are perfectly aligned.",
                                "Being able to see a candle flame when looking through a straight pipe.",
                                "A laser beam following a straight path when passed through water containing a drop of milk.",
                            ],
                            misconceptions: [
                                "Light can easily bend around corners in all situations, rather than generally traveling in a straight line.",
                            ],
                            questionBank: [
                                {
                                    id: "light-straight-line-q1",
                                    question: "What happens to the light spot on the screen in the matchbox activity if one matchbox is moved slightly out of line?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "The light spot becomes brighter.",
                                        },
                                        {
                                            label: "B",
                                            text: "The light spot disappears from the screen.",
                                        },
                                        {
                                            label: "C",
                                            text: "The light spot changes color.",
                                        },
                                        {
                                            label: "D",
                                            text: "The light spot moves to a different position but remains visible.",
                                        },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "When the holes are not in the same line, the light cannot pass through all of them in a straight path, so the light spot cannot be obtained on the screen.",
                                    },
                                },
                                {
                                    id: "light-straight-line-q2",
                                    question: "Which observation supports the idea that light travels in a straight line?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Seeing a candle flame through a bent pipe.",
                                        },
                                        {
                                            label: "B",
                                            text: "Not being able to see a candle flame through a straight pipe.",
                                        },
                                        {
                                            label: "C",
                                            text: "Seeing a candle flame through a straight pipe.",
                                        },
                                        {
                                            label: "D",
                                            text: "A laser beam bending around a corner in water.",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The activity shows that you can see the candle through a straight pipe but not a bent one, indicating light travels straight.",
                                    },
                                },
                                {
                                    id: "light-straight-line-q3",
                                    question: "What is the main conclusion drawn from the activities involving matchboxes and pipes?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Light can pass through any material.",
                                        },
                                        {
                                            label: "B",
                                            text: "Light travels in a straight line.",
                                        },
                                        {
                                            label: "C",
                                            text: "Light always bends around obstacles.",
                                        },
                                        {
                                            label: "D",
                                            text: "Light is only visible in the dark.",
                                        },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "Both activities demonstrate that light travels in a straight line, as it cannot be seen if its path is blocked or bent.",
                                    },
                                },
                                {
                                    id: "light-straight-line-q4",
                                    question: "How can you make a laser beam easily visible when passing it through water?",
                                    type: "short",
                                    answer: {
                                        correct: "You can add a drop of milk to the water to make the laser beam easily visible.",
                                        explanation: "Adding milk particles to water scatters the light, making the beam's path visible.",
                                    },
                                },
                                {
                                    id: "light-straight-line-q5",
                                    question: "Describe one way to demonstrate that light travels in a straight line using simple materials.",
                                    type: "short",
                                    answer: {
                                        correct: "One way is to look at a lighted candle through a straight pipe. You will see the candle. If you then bend the pipe, you will no longer be able to see the candle, showing that light travels in a straight line.",
                                        explanation: "The inability to see through a bent pipe confirms light's straight path.",
                                    },
                                },
                                {
                                    id: "light-straight-line-q6",
                                    question: "Imagine you are trying to see a small object placed behind a wall. You cannot see it directly. If you try to use a mirror to see it, you need to position the mirror carefully. Why can't you see the object directly, and why does the mirror need careful positioning, based on how light travels?",
                                    type: "reasoning",
                                    answer: {
                                        correct: "You cannot see the object directly because light travels in a straight line. The wall blocks the straight path of light from the object to your eyes. The mirror needs careful positioning because light from the object must travel in a straight line to the mirror, and then reflect off the mirror in another straight line path to your eyes.",
                                        explanation: "Light's straight-line travel means direct vision is blocked by obstacles. Mirrors work by reflecting light, but the reflected light also travels in a straight line, requiring precise alignment.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "11.3-light-through-transparent",
                    title: "Light through Transparent,",
                    overview: "Translucent, and Opaque Materials",
                    subtopics: [
                        {
                            id: "11.3-light-through-transparent",
                            title: "Light through Transparent,",
                            learningObjectives: [
                                "Define transparent materials based on how light passes through them.",
                                "Define translucent materials based on how light passes through them.",
                                "Define opaque materials based on how light passes through them.",
                                "Classify different materials as transparent, translucent, or opaque.",
                            ],
                            keyConcepts: [
                                "Transparent materials allow light to pass almost completely through them.",
                                "Translucent materials allow light to pass partially through them.",
                                "Opaque materials do not allow light to pass through them.",
                                "Materials can be tested by observing how much light passes through them when placed in the path of a light source.",
                            ],
                            keyTerms: {
                                Transparent: "Materials through which light passes almost completely.",
                                Translucent: "Materials through which light passes partially.",
                                Opaque: "Materials through which light does not pass.",
                            },
                            examples: [
                                "Glass is a transparent material because light passes almost completely through it.",
                                "Tracing paper is a translucent material because light passes partially through it.",
                                "Cardboard is an opaque material because light does not pass through it.",
                            ],
                            misconceptions: [
                                "Students might think that if they can see any image through a material, it is transparent, not understanding that translucent materials also allow some visibility but only partial light passage.",
                                "Students might confuse translucent materials with opaque materials, believing that any material that isn't perfectly clear blocks all light.",
                            ],
                            questionBank: [
                                {
                                    id: "transparent-translucent-opaque-q1",
                                    question: "Which type of material allows light to pass almost completely through it?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Opaque",
                                        },
                                        {
                                            label: "B",
                                            text: "Translucent",
                                        },
                                        {
                                            label: "C",
                                            text: "Transparent",
                                        },
                                        {
                                            label: "D",
                                            text: "Reflective",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text states, 'Light passes almost completely through transparent materials.'",
                                    },
                                },
                                {
                                    id: "transparent-translucent-opaque-q2",
                                    question: "If light passes partially through a material, what is that material called?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Transparent",
                                        },
                                        {
                                            label: "B",
                                            text: "Opaque",
                                        },
                                        {
                                            label: "C",
                                            text: "Translucent",
                                        },
                                        {
                                            label: "D",
                                            text: "Solid",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text states, 'Light passes partially through translucent materials.'",
                                    },
                                },
                                {
                                    id: "transparent-translucent-opaque-q3",
                                    question: "What happens when you place an opaque object in the path of light?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Light passes almost completely through it.",
                                        },
                                        {
                                            label: "B",
                                            text: "Light passes partially through it.",
                                        },
                                        {
                                            label: "C",
                                            text: "Light does not pass through it.",
                                        },
                                        {
                                            label: "D",
                                            text: "Light becomes brighter.",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text states, 'Light does not pass through opaque materials.'",
                                    },
                                },
                                {
                                    id: "transparent-translucent-opaque-q4",
                                    question: "According to the source text, how can you classify materials into transparent, translucent, and opaque categories?",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Materials can be classified based on whether light passes fully, partially, or not at all through them.",
                                        explanation: "The text describes that materials are classified depending on if light passes fully, partially, or not at all.",
                                    },
                                },
                                {
                                    id: "transparent-translucent-opaque-q5",
                                    question: "Name one material from Activity 11.3 that is likely an opaque material.",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Cardboard.",
                                        explanation: "Cardboard is listed in Activity 11.3 and is a common example of an opaque material, meaning light does not pass through it.",
                                    },
                                },
                                {
                                    id: "transparent-translucent-opaque-q6",
                                    question: "Imagine you are in a dark room with a torch and a screen. You place a piece of tracing paper between the torch and the screen. What would you observe on the screen, and why?",
                                    type: "reasoning",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "You would observe a spot of light on the screen, but it might not be as clear or bright as without the paper. This is because tracing paper is a translucent material, meaning light passes partially through it.",
                                        explanation: "The source text defines translucent materials as those through which light passes partially, and tracing paper is given as an example in the activity.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "11.4-shadow-formation",
                    title: "Shadow Formation",
                    overview: "What did you see on the screen in Activity 11.3 when an opaque object was placed in the path of light? Did you see a dark patch on the wall? Why was this dark patch formed?",
                    subtopics: [
                        {
                            id: "11.4-shadow-formation",
                            title: "Shadow Formation",
                            learningObjectives: [
                                "Define a shadow as a dark patch formed when light is blocked.",
                                "Identify the three essential components required for shadow formation.",
                                "Explain how different types of objects (opaque, translucent, transparent) affect the darkness of a shadow.",
                                "Describe how the position of an object relative to the light source and screen influences its shadow.",
                                "State that the color of an object does not change the color of its shadow.",
                            ],
                            keyConcepts: [
                                "Light travels in a straight line, and shadows are formed when an object blocks this path.",
                                "A shadow is a dark patch where light does not reach.",
                                "To observe a shadow, a source of light, an object, and a screen are necessary.",
                                "Opaque objects form darker shadows, translucent objects form lighter shadows, and transparent objects can form faint shadows.",
                                "The size and shape of a shadow depend on the relative positions of the light source, the object, and the screen.",
                                "The color of an opaque object does not affect the color of its shadow.",
                            ],
                            keyTerms: {
                                "Shadow": "A dark patch formed when an object blocks the path of light, preventing it from reaching a surface.",
                                "Opaque object": "An object that completely blocks light, forming a dark shadow.",
                                "Translucent object": "An object that allows some light to pass through, forming a lighter shadow.",
                                "Transparent object": "An object that allows most light to pass through, but can still create faint shadows.",
                                "Screen": "A surface (like a wall or the ground) on which a shadow is observed.",
                            },
                            examples: [
                                "Shadows of people and objects seen in the Sun or under a light.",
                                "Shadow puppetry, where puppets are placed between a light source and a screen to create moving shadows.",
                            ],
                            misconceptions: [
                                "Shadows are always the same size and shape as the object that forms them.",
                                "Only opaque objects can form shadows.",
                                "The color of an object determines the color of its shadow.",
                            ],
                            questionBank: [
                                {
                                    id: "shadow-formation-q1",
                                    question: "What is formed when an opaque object blocks the path of light?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "A bright spot",
                                        },
                                        {
                                            label: "B",
                                            text: "A reflection",
                                        },
                                        {
                                            label: "C",
                                            text: "A dark patch",
                                        },
                                        {
                                            label: "D",
                                            text: "A rainbow",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The text states, 'The dark patch, where light does not reach, is the shadow.'",
                                    },
                                },
                                {
                                    id: "shadow-formation-q2",
                                    question: "Which of the following is NOT required to observe a shadow?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "A source of light",
                                        },
                                        {
                                            label: "B",
                                            text: "An opaque object",
                                        },
                                        {
                                            label: "C",
                                            text: "A screen",
                                        },
                                        {
                                            label: "D",
                                            text: "A mirror",
                                        },
                                    ],
                                    answer: {
                                        correct: "D",
                                        explanation: "The text lists 'a source of light, an opaque object, and a screen' as necessary components for observing a shadow. A mirror is not listed as a requirement for shadow formation.",
                                    },
                                },
                                {
                                    id: "shadow-formation-q3",
                                    question: "What happens to the color of a shadow when the color of the opaque object is changed?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "The shadow's color also changes.",
                                        },
                                        {
                                            label: "B",
                                            text: "The shadow becomes brighter.",
                                        },
                                        {
                                            label: "C",
                                            text: "The shadow remains dark.",
                                        },
                                        {
                                            label: "D",
                                            text: "The shadow disappears.",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The text states, 'Changing the colour of opaque objects does not change the colour of the shadows.' Shadows are always dark.",
                                    },
                                },
                                {
                                    id: "shadow-formation-q4",
                                    question: "List the three essential components needed to observe a shadow.",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "A source of light, an opaque object, and a screen.",
                                        explanation: "The text explicitly states that 'We need a source of light, an opaque object, and a screen' to observe a shadow.",
                                    },
                                },
                                {
                                    id: "shadow-formation-q5",
                                    question: "How do translucent objects affect the shadows they form compared to opaque objects?",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Translucent objects make lighter shadows, while opaque objects form darker shadows.",
                                        explanation: "The text states, 'Opaque objects form darker shadows. Translucent objects make lighter shadows.'",
                                    },
                                },
                                {
                                    id: "shadow-formation-q6",
                                    question: "Why might a shadow not always give clear information about the exact shape of the object that formed it?",
                                    type: "reasoning",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "The size and shape of a shadow depend on the position of the object relative to the light source and the screen. Tilting the object can also change the shadow's appearance, making it difficult to guess the object's true shape.",
                                        explanation: "The text mentions that 'The shadows may give information about the object or we may not be able to guess the object at all' and that the 'position of the object relative to the light source and the screen' affects the shadow. It also notes that if 'The object is tilted', the shadow changes.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "11.6-images-formed-in-a-plane-mirror",
                    title: "Images Formed in a Plane Mirror",
                    overview: "Look into the mirror. Do you see your face in it? What you see is",
                    subtopics: [
                        {
                            id: "11.6-images-formed-in-a-plane-mirror",
                            title: "Images Formed in a Plane Mirror",
                            learningObjectives: [
                                "Define an object and an image in the context of a plane mirror.",
                                "Identify the characteristics of an image formed by a plane mirror, such as being erect and not obtainable on a screen.",
                                "Explain the phenomenon of lateral inversion in images formed by a plane mirror.",
                                "Describe how the distance of an image from a plane mirror relates to the distance of the object.",
                            ],
                            keyConcepts: [
                                "An object is the item placed in front of a mirror, while an image is its appearance formed by the mirror, seemingly behind it.",
                                "Images formed by a plane mirror are always erect, meaning they appear upright.",
                                "Images formed by a plane mirror cannot be projected onto a screen.",
                                "Plane mirrors exhibit lateral inversion, where the left side of the object appears as the right side in the image, and vice versa.",
                                "The apparent distance of the image from a plane mirror changes in relation to the object's distance from the mirror.",
                            ],
                            keyTerms: {
                                "Object": "The actual item placed in front of a mirror.",
                                "Image": "The appearance of an object formed by a mirror, which appears to be behind the mirror.",
                                "Erect": "A characteristic of an image that means it is upright, with the top appearing on top.",
                                "Lateral inversion": "The perceived left-right reversal in an image formed by a plane mirror.",
                            },
                            examples: [
                                "Seeing your own face when you look into a plane mirror.",
                                "Placing a pen in front of a plane mirror and seeing a similar pen appear behind it.",
                                "Raising your left arm while standing in front of a plane mirror and observing your image raise its right arm.",
                                "Touching your right ear while looking in a plane mirror and seeing your image touch its left ear.",
                            ],
                            misconceptions: [
                                "An image formed by a plane mirror can be captured or projected onto a screen.",
                                "The image formed by a plane mirror is an exact replica of the object in every aspect, including its left-right orientation.",
                            ],
                            questionBank: [
                                {
                                    id: "plane-mirror-q1",
                                    question: "What is an upright image called?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Inverted",
                                        },
                                        {
                                            label: "B",
                                            text: "Erect",
                                        },
                                        {
                                            label: "C",
                                            text: "Lateral",
                                        },
                                        {
                                            label: "D",
                                            text: "Reversed",
                                        },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The source text states that an upright image is called erect.",
                                    },
                                },
                                {
                                    id: "plane-mirror-q2",
                                    question: "Where does the image formed by a plane mirror appear to be located?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "In front of the mirror",
                                        },
                                        {
                                            label: "B",
                                            text: "On the surface of the mirror",
                                        },
                                        {
                                            label: "C",
                                            text: "Behind the mirror",
                                        },
                                        {
                                            label: "D",
                                            text: "On a screen",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The text describes the image of a pen appearing 'behind the mirror'.",
                                    },
                                },
                                {
                                    id: "plane-mirror-q3",
                                    question: "Which of the following is a characteristic of an image formed by a plane mirror?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "It can be obtained on a screen.",
                                        },
                                        {
                                            label: "B",
                                            text: "It is always inverted.",
                                        },
                                        {
                                            label: "C",
                                            text: "It shows lateral inversion.",
                                        },
                                        {
                                            label: "D",
                                            text: "It is smaller than the object.",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text explicitly mentions, 'There is lateral inversion in the images formed by a plane mirror'.",
                                    },
                                },
                                {
                                    id: "plane-mirror-q4",
                                    question: "What is the term for the perceived left-right reversal in an image formed by a plane mirror?",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Lateral inversion.",
                                        explanation: "The text states, 'This type of perceived left-right reversal is called lateral inversion'.",
                                    },
                                },
                                {
                                    id: "plane-mirror-q5",
                                    question: "Can an image formed by a plane mirror be obtained on a screen?",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "No, the image formed by a plane mirror cannot be obtained on a screen.",
                                        explanation: "The source text clearly states, 'The image formed by a plane mirror cannot be obtained on a screen'.",
                                    },
                                },
                                {
                                    id: "plane-mirror-q6",
                                    question: "How does the distance of your image from a plane mirror change if you move closer to the mirror?",
                                    type: "reasoning",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "If you move closer to the plane mirror, your image also appears closer to the mirror. This is because the image's apparent distance from the mirror changes with the object's distance.",
                                        explanation: "The text explains, 'when you stand close to the plane mirror, the image also appears to be close to the mirror. The image appears to be far from the mirror when you stand far from the plane mirror'.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "11.7-pinhole-camera",
                    title: "Pinhole Camera",
                    overview: "A pinhole camera is a device in which the light rays from an object pass through a tiny hole (a pinhole) and form an image on a screen.",
                    subtopics: [
                        {
                            id: "11.7-pinhole-camera",
                            title: "Pinhole Camera",
                            learningObjectives: [
                                "Define a pinhole camera as a device that forms an image using light passing through a tiny hole.",
                                "Describe the characteristics of the image formed by a pinhole camera, specifically that it is inverted.",
                                "Explain the basic steps to construct a simple pinhole camera using cardboard boxes and translucent paper.",
                            ],
                            keyConcepts: [
                                "A pinhole camera uses a tiny hole (pinhole) for light rays to pass through.",
                                "Light rays from an object pass through the pinhole and form an image on a screen.",
                                "The image formed by a pinhole camera is inverted (upside down).",
                            ],
                            keyTerms: {
                                "Pinhole camera": "A device in which light rays from an object pass through a tiny hole and form an image on a screen.",
                                "Pinhole": "A tiny hole through which light rays pass in a pinhole camera.",
                                "Screen": "A surface inside a pinhole camera where the image is formed, often made of translucent paper.",
                                "Inverted image": "An image that appears upside down compared to the original object.",
                            },
                            examples: [
                                "Observing an inverted image of a lighted candle on a screen by passing its light through a small hole in a piece of cardboard.",
                                "Constructing a sliding pinhole camera using two cardboard boxes, a pinhole, and translucent paper to view distant objects like trees or buildings.",
                            ],
                            misconceptions: [
                                "The image formed by a pinhole camera is always erect (right-side up).",
                                "The image formed by a pinhole camera shows lateral inversion, similar to a mirror.",
                            ],
                            questionBank: [
                                {
                                    id: "pinhole-camera-q1",
                                    question: "What passes through the tiny hole in a pinhole camera to form an image?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Sound waves",
                                        },
                                        {
                                            label: "B",
                                            text: "Heat rays",
                                        },
                                        {
                                            label: "C",
                                            text: "Light rays",
                                        },
                                        {
                                            label: "D",
                                            text: "Air particles",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text states that 'light rays from an object pass through a tiny hole' to form an image.",
                                    },
                                },
                                {
                                    id: "pinhole-camera-q2",
                                    question: "What is a characteristic of the image formed by a pinhole camera?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "It is always erect.",
                                        },
                                        {
                                            label: "B",
                                            text: "It is laterally inverted.",
                                        },
                                        {
                                            label: "C",
                                            text: "It is upside down.",
                                        },
                                        {
                                            label: "D",
                                            text: "It is magnified.",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text explicitly states, 'A pinhole camera gives an upside down image.' and 'Light coming on the screen is, inverted.'",
                                    },
                                },
                                {
                                    id: "pinhole-camera-q3",
                                    question: "What material is suggested for the screen in the sliding pinhole camera activity?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Opaque cardboard",
                                        },
                                        {
                                            label: "B",
                                            text: "Transparent glass",
                                        },
                                        {
                                            label: "C",
                                            text: "Thin translucent paper",
                                        },
                                        {
                                            label: "D",
                                            text: "Reflective foil",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text instructs to 'Cover this opening with a thin translucent paper (like a tracing paper) to form a screen'.",
                                    },
                                },
                                {
                                    id: "pinhole-camera-q4",
                                    question: "What is a pinhole camera?",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "A pinhole camera is a device in which light rays from an object pass through a tiny hole and form an image on a screen.",
                                        explanation: "This is the direct definition provided in the source text.",
                                    },
                                },
                                {
                                    id: "pinhole-camera-q5",
                                    question: "What two actions are suggested to clearly see a distant object's image when using a sliding pinhole camera outdoors?",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "To clearly see a distant object's image, one should move the smaller box forward or backward until an image appears, and cover their head and the camera with a dark cloth.",
                                        explanation: "The text advises to 'move the smaller box forward or backward until an image appears on the tracing paper' and 'Cover your head and the camera with a dark cloth'.",
                                    },
                                },
                                {
                                    id: "pinhole-camera-q6",
                                    question: "Why is it important to use a dark cloth to cover your head and the camera when viewing distant objects with a sliding pinhole camera outdoors?",
                                    type: "reasoning",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Using a dark cloth helps to block out external light, making the inverted image formed on the translucent screen clearer and easier to see, especially in bright sunlight.",
                                        explanation: "The text suggests covering the head and camera with a dark cloth when looking at a distant object 'in bright sunlight', implying it's to enhance visibility of the image by reducing ambient light interference.",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "11.8-making-some-useful-items",
                    title: "Making Some Useful Items",
                    overview: "After having learnt that light travels in a straight line and is",
                    subtopics: [
                        {
                            id: "11.8.1-periscope",
                            title: "Periscope",
                            learningObjectives: [],
                            keyConcepts: [],
                            keyTerms: {},
                            examples: [],
                            misconceptions: [],
                            questionBank: [],
                        },
                        {
                            id: "11.8.2-kaleidoscope",
                            title: "Kaleidoscope",
                            learningObjectives: [
                                "Describe the components used to construct a kaleidoscope",
                                "Explain how multiple reflections within a kaleidoscope create patterns",
                                "Identify the practical use of a kaleidoscope by designers and artists",
                            ],
                            keyConcepts: [
                                "A kaleidoscope is constructed using three rectangular plane mirror strips joined to form a triangle.",
                                "Small, colourful objects like broken bangles or beads are placed inside a kaleidoscope to form patterns.",
                                "The patterns seen in a kaleidoscope are formed by multiple reflections of these objects from the plane mirrors.",
                                "An interesting feature of a kaleidoscope is that it always produces new and unique patterns.",
                                "Designers and artists use kaleidoscopes as a source of inspiration for new patterns.",
                            ],
                            keyTerms: {
                                "Kaleidoscope": "An optical instrument that uses multiple reflections from mirrors to create beautiful, symmetrical, and ever-changing patterns.",
                                "Plane mirror": "A flat mirror that reflects light without distortion.",
                                "Multiple images": "The formation of several images of an object due to successive reflections from multiple mirrors.",
                            },
                            examples: [
                                "Peeping through a kaleidoscope to see beautiful, changing patterns formed by internal coloured pieces.",
                                "Designers using a kaleidoscope to generate new design ideas for textiles or artwork.",
                            ],
                            misconceptions: [
                                "A kaleidoscope generates light or creates patterns from nothing; instead, it reflects and rearranges existing light and objects.",
                                "A kaleidoscope shows the same pattern every time; however, it always produces new patterns.",
                            ],
                            questionBank: [
                                {
                                    id: "kaleidoscope-q1",
                                    question: "What type of mirrors are used in a kaleidoscope?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Concave mirrors",
                                        },
                                        {
                                            label: "B",
                                            text: "Convex mirrors",
                                        },
                                        {
                                            label: "C",
                                            text: "Plane mirrors",
                                        },
                                        {
                                            label: "D",
                                            text: "Spherical mirrors",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text states that a kaleidoscope is made using 'three rectangular plane mirror strips'.",
                                    },
                                },
                                {
                                    id: "kaleidoscope-q2",
                                    question: "What is placed inside a kaleidoscope to create patterns?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "Lenses",
                                        },
                                        {
                                            label: "B",
                                            text: "Broken pieces of coloured bangles or beads",
                                        },
                                        {
                                            label: "C",
                                            text: "Small light bulbs",
                                        },
                                        {
                                            label: "D",
                                            text: "Magnets",
                                        },
                                    ],
                                    answer: {
                                        correct: "B",
                                        explanation: "The text mentions, 'Place several broken pieces of coloured bangles or beads on the plastic sheet' inside the kaleidoscope.",
                                    },
                                },
                                {
                                    id: "kaleidoscope-q3",
                                    question: "What is a unique characteristic of the patterns seen in a kaleidoscope?",
                                    type: "mcq",
                                    options: [
                                        {
                                            label: "A",
                                            text: "They are always the same.",
                                        },
                                        {
                                            label: "B",
                                            text: "They are always inverted.",
                                        },
                                        {
                                            label: "C",
                                            text: "One always gets new patterns.",
                                        },
                                        {
                                            label: "D",
                                            text: "They are only visible in the dark.",
                                        },
                                    ],
                                    answer: {
                                        correct: "C",
                                        explanation: "The source text states, 'An interesting feature of the kaleidoscope is that one always gets new patterns'.",
                                    },
                                },
                                {
                                    id: "kaleidoscope-q4",
                                    question: "Name two professions that use kaleidoscopes to get ideas for new patterns.",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Designers and artists.",
                                        explanation: "The source text explicitly states, 'Designers and artists often use kaleidoscopes to get ideas for new patterns.'",
                                    },
                                },
                                {
                                    id: "kaleidoscope-q5",
                                    question: "How many mirror strips are typically joined together to form a kaleidoscope?",
                                    type: "short",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "Three.",
                                        explanation: "The source text instructs to 'Get three rectangular plane mirror strips' for constructing a kaleidoscope.",
                                    },
                                },
                                {
                                    id: "kaleidoscope-q6",
                                    question: "Why does a kaleidoscope always produce new patterns even if the internal objects are the same?",
                                    type: "reasoning",
                                    options: [
                                        {
                                            label: "A",
                                            text: "",
                                        },
                                        {
                                            label: "B",
                                            text: "",
                                        },
                                        {
                                            label: "C",
                                            text: "",
                                        },
                                        {
                                            label: "D",
                                            text: "",
                                        },
                                    ],
                                    answer: {
                                        correct: "A kaleidoscope uses multiple plane mirrors that create multiple images of the internal objects. Even a slight movement or change in viewing angle causes these multiple reflections to rearrange, resulting in a continuously new pattern.",
                                        explanation: "The text mentions 'multiple images (due to 3 mirrors)' and that 'one always gets new patterns', indicating that the arrangement of reflections constantly changes.",
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
