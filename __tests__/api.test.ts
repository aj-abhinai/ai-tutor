/**
 * Tests for /api/explain route
 * 
 * These tests verify the API behavior for the Standard 7 NCERT tutor.
 * Following TDD approach - tests written before implementation changes.
 */

// Mock response structure we expect from the new tutor API
interface TutorResponse {
    content: {
        quickExplanation: string;
        bulletPoints: {
            simple: string[];
            standard: string[];
            deep: string[];
        };
        curiosityQuestion?: string;
    };
}

// Expected input structure
interface TutorInput {
    subject: 'Science' | 'Maths';
    chapterId: string;
    topicId: string;
    subtopicId: string;
}

describe('/api/explain - Standard 7 Tutor API', () => {
    const API_URL = 'http://localhost:3000/api/explain';

    describe('Input Validation', () => {
        it('should reject request without chapter', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'Science', topicId: 'circuits-and-switches', subtopicId: 'closed-open-circuits' })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Chapter');
        });

        it('should reject request without subject', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterId: 'electricity-circuits', topicId: 'circuits-and-switches', subtopicId: 'closed-open-circuits' })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Subject');
        });

        it('should reject empty subtopic', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Science',
                    chapterId: 'electricity-circuits',
                    topicId: 'circuits-and-switches',
                    subtopicId: '   '
                })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Subtopic');
        });

        it('should reject invalid subject', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: 'History', chapterId: 'electricity-circuits', topicId: 'circuits-and-switches', subtopicId: 'closed-open-circuits' })
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
                body: JSON.stringify({
                    subject: 'Science',
                    chapterId: 'electricity-circuits',
                    topicId: 'circuits-and-switches',
                    subtopicId: 'closed-open-circuits'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json() as TutorResponse;
            expect(data.content.quickExplanation).toBeDefined();
            expect(typeof data.content.quickExplanation).toBe('string');
        });

        it('should return bulletPoints explanation', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Maths',
                    chapterId: 'fractions-decimals',
                    topicId: 'fractions-basics',
                    subtopicId: 'equivalent-fractions'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json() as TutorResponse;
            expect(data.content.bulletPoints).toBeDefined();
            expect(Array.isArray(data.content.bulletPoints.simple)).toBe(true);
            expect(Array.isArray(data.content.bulletPoints.standard)).toBe(true);
            expect(Array.isArray(data.content.bulletPoints.deep)).toBe(true);
            if (Array.isArray(data.content.bulletPoints.standard)) {
                expect(data.content.bulletPoints.standard.length).toBeGreaterThan(0);
            }
        });

        it('should allow curiosityQuestion in response', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Maths',
                    chapterId: 'simple-equations',
                    topicId: 'solve-equations',
                    subtopicId: 'one-step-equations'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json() as TutorResponse;
            expect(data.content.curiosityQuestion).toBeDefined();
        });
    });
});
