/**
 * NCERT Class 7 Science - Chapter Index
 */

import { SubjectCurriculum } from "./types";
import { SCIENCE_CHAPTER_2 } from "./science-7-2";
import { SCIENCE_CHAPTER_3 } from "./science-7-3";
import { SCIENCE_CHAPTER_10 } from "./science-7-10";
import { SCIENCE_CHAPTER_11 } from "./science-7-11";

export const SCIENCE_CURRICULUM: SubjectCurriculum = {
    subject: "Science",
    chapters: [
        ...SCIENCE_CHAPTER_2.chapters,
        ...SCIENCE_CHAPTER_3.chapters,
        ...SCIENCE_CHAPTER_10.chapters,
        ...SCIENCE_CHAPTER_11.chapters,
    ],
};