/**
 * Tests for /api/feedback route
 *
 * These tests verify the feedback API behavior for the Standard 7 NCERT tutor.
 */

describe('/api/feedback - Explain-it-back API', () => {
    const API_URL = 'http://localhost:3000/api/feedback';

    describe('Input Validation', () => {
        it('should reject request without subject', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId: 'electricity-circuits',
                    topicId: 'circuit-basics',
                    subtopicId: 'closed-open-circuits',
                    studentAnswer: 'A closed circuit lets current flow.'
                })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Subject');
        });

        it('should reject request without student answer', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Science',
                    chapterId: 'electricity-circuits',
                    topicId: 'circuit-basics',
                    subtopicId: 'closed-open-circuits'
                })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Student answer');
        });

        it('should reject too-long student answer', async () => {
            const longAnswer = 'a'.repeat(601);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Science',
                    chapterId: 'electricity-circuits',
                    topicId: 'circuit-basics',
                    subtopicId: 'closed-open-circuits',
                    studentAnswer: longAnswer
                })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('characters or less');
        });
    });

    describe('Response Structure', () => {
        it('should return feedback fields', async () => {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Science',
                    chapterId: 'electricity-circuits',
                    topicId: 'circuit-basics',
                    subtopicId: 'closed-open-circuits',
                    studentAnswer: 'A closed circuit lets current flow, an open circuit stops it.'
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.feedback).toBeDefined();
            expect(typeof data.feedback.rating).toBe('string');
            expect(typeof data.feedback.praise).toBe('string');
            expect(typeof data.feedback.fix).toBe('string');
            expect(typeof data.feedback.rereadTip).toBe('string');
        });
    });
});
