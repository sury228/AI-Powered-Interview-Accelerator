/**
 * API Client — Communicates with the FastAPI backend
 */

const API = {
    baseUrl: '',

    /**
     * Generic fetch wrapper with error handling
     */
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || `Request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API error [${endpoint}]:`, error);
            throw error;
        }
    },

    /**
     * Health check
     */
    async healthCheck() {
        return this.request('/api/health');
    },

    /**
     * Set Gemini API key
     */
    async setApiKey(apiKey) {
        return this.request('/api/set-api-key', {
            method: 'POST',
            body: JSON.stringify({ api_key: apiKey }),
        });
    },

    /**
     * Upload a file and extract text
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/api/upload-file`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || 'Upload failed');
        }

        return response.json();
    },

    /**
     * Analyze a job description
     */
    async analyzeJD(text) {
        return this.request('/api/analyze-jd', {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
    },

    /**
     * Analyze a resume against a JD analysis
     */
    async analyzeResume(text, jdAnalysis) {
        return this.request('/api/analyze-resume', {
            method: 'POST',
            body: JSON.stringify({ text, jd_analysis: jdAnalysis }),
        });
    },

    /**
     * Create an interview session
     */
    async createSession(jdText, resumeText, jdAnalysis, candidateAnalysis) {
        const formData = new FormData();
        formData.append('jd_text', jdText);
        formData.append('resume_text', resumeText);
        formData.append('jd_analysis', JSON.stringify(jdAnalysis));
        formData.append('candidate_analysis', JSON.stringify(candidateAnalysis));

        const response = await fetch(`${this.baseUrl}/api/interview/create-session`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || 'Session creation failed');
        }

        return response.json();
    },

    /**
     * Start the interview
     */
    async startInterview(sessionId) {
        return this.request('/api/interview/start', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId }),
        });
    },

    /**
     * Submit an answer and get next question
     */
    async respondToQuestion(sessionId, answer, durationSeconds = 0, wordCount = 0, fillerWordCount = 0) {
        return this.request('/api/interview/respond', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                answer,
                duration_seconds: durationSeconds,
                word_count: wordCount,
                filler_word_count: fillerWordCount,
            }),
        });
    },

    /**
     * Get the evaluation report
     */
    async getReport(sessionId) {
        return this.request('/api/interview/evaluate', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId }),
        });
    },
};
