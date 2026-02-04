/**
 * Tests for /api/explain route
 * 
 * These tests verify the API behavior for the Standard 7 NCERT tutor.
 * Following TDD approach - tests written before implementation changes.
 */

// Mock response structure we expect from the new tutor API
interface TutorResponse {
    content: {
        quickExplanation: string;    // 2-3 sentences in simple language
        stepByStep: string;           // Breakdown with daily-life examples
        practiceQuestion: {
            question: string;
            options?: { label: string; text: string }[];  // Optional for short answer
            type: 'mcq' | 'short';
        };
        answer: {
            correct: string;
            explanation: string;
        };
    };
}

// Expected input structure
interface TutorInput {
    subject: 'Science' | 'Maths';
    topic: string;
}

describe('/api/explain - Standard 7 Tutor API', () => {
    const API_URL = 'http://localhost:3000/api/explain';

    describe('Input Validation', () => {
        it('should reject request without topic', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Science' })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Topic');
        });

        it('should reject request without subject', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: 'Photosynthesis' })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Subject');
        });

        it('should reject empty topic', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Science', topic: '   ' })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('empty');
        });

        it('should reject invalid subject', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'History', topic: 'Some topic' })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Subject');
        });
    });

    describe('Response Structure', () => {
        it('should return quickExplanation in response', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Science', topic: 'Photosynthesis' })
            });

            expect(response.status).toBe(200);
            const data = await response.json() as TutorResponse;
            expect(data.content.quickExplanation).toBeDefined();
            expect(typeof data.content.quickExplanation).toBe('string');
        });

        it('should return stepByStep explanation', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Maths', topic: 'Fractions' })
            });

            expect(response.status).toBe(200);
            const data = await response.json() as TutorResponse;
            expect(data.content.stepByStep).toBeDefined();
        });

        it('should include a practice question', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Science', topic: 'Acids and Bases' })
            });

            expect(response.status).toBe(200);
            const data = await response.json() as TutorResponse;
            expect(data.content.practiceQuestion).toBeDefined();
            expect(data.content.practiceQuestion.question).toBeDefined();
        });

        it('should include answer with explanation', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Maths', topic: 'Simple Equations' })
            });

            expect(response.status).toBe(200);
            const data = await response.json() as TutorResponse;
            expect(data.content.answer).toBeDefined();
            expect(data.content.answer.correct).toBeDefined();
            expect(data.content.answer.explanation).toBeDefined();
        });
    });
});
