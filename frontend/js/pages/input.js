/**
 * Input Page — JD + Resume input with file upload and API key management
 */

const InputPage = {
    jdText: '',
    resumeText: '',
    jdMethod: 'paste',   // 'paste' or 'upload'
    resumeMethod: 'paste',

    render() {
        return `
            <div class="page page-enter">
                <div class="input-page container">
                    <h2 class="input-page-title fade-in-up">
                        <span class="text-gradient">Provide Your Details</span>
                    </h2>
                    <p class="input-page-subtitle fade-in-up">
                        Paste or upload your job description and resume to get started
                    </p>

                    <!-- API Key section (if not set) -->
                    <div id="api-key-section" class="api-key-section fade-in-up">
                        <div class="card" style="margin-bottom: var(--space-6)">
                            <div class="form-group">
                                <label class="form-label">🔑 Gemini API Key</label>
                                <p style="font-size: var(--text-sm); color: var(--text-tertiary); margin-bottom: var(--space-3)">
                                    Get a free key from <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>. 
                                    Stored locally, never shared.
                                </p>
                                <div style="display: flex; gap: var(--space-3)">
                                    <input type="password" class="form-input" id="api-key-input" 
                                           placeholder="Enter your Gemini API key"
                                           style="flex: 1">
                                    <button class="btn btn-secondary" onclick="InputPage.saveApiKey()" id="save-api-key-btn">
                                        Save Key
                                    </button>
                                </div>
                                <div id="api-key-status" class="hidden" style="margin-top: var(--space-2)">
                                    <span class="badge badge-success">✓ API Key configured</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Input panels -->
                    <div class="input-panels">
                        <!-- JD Panel -->
                        <div class="input-panel fade-in-up">
                            <div class="input-panel-header">
                                <span class="input-panel-icon">📄</span>
                                <span class="input-panel-title">Job Description</span>
                            </div>
                            <div class="input-method-tabs">
                                <button class="input-method-tab ${this.jdMethod === 'paste' ? 'active' : ''}" 
                                        onclick="InputPage.setJdMethod('paste')">Paste Text</button>
                                <button class="input-method-tab ${this.jdMethod === 'upload' ? 'active' : ''}" 
                                        onclick="InputPage.setJdMethod('upload')">Upload File</button>
                            </div>
                            <div class="card">
                                <div id="jd-paste-area" class="${this.jdMethod !== 'paste' ? 'hidden' : ''}">
                                    <textarea class="form-textarea" id="jd-textarea" 
                                              placeholder="Paste the full job description here..."
                                              style="min-height: 250px"
                                              oninput="InputPage.jdText = this.value">${this.jdText}</textarea>
                                </div>
                                <div id="jd-upload-area" class="${this.jdMethod !== 'upload' ? 'hidden' : ''}">
                                    ${FileUpload.create('jd-upload')}
                                </div>
                            </div>
                        </div>

                        <!-- Resume Panel -->
                        <div class="input-panel fade-in-up">
                            <div class="input-panel-header">
                                <span class="input-panel-icon">👤</span>
                                <span class="input-panel-title">Your Resume</span>
                            </div>
                            <div class="input-method-tabs">
                                <button class="input-method-tab ${this.resumeMethod === 'paste' ? 'active' : ''}" 
                                        onclick="InputPage.setResumeMethod('paste')">Paste Text</button>
                                <button class="input-method-tab ${this.resumeMethod === 'upload' ? 'active' : ''}" 
                                        onclick="InputPage.setResumeMethod('upload')">Upload File</button>
                            </div>
                            <div class="card">
                                <div id="resume-paste-area" class="${this.resumeMethod !== 'paste' ? 'hidden' : ''}">
                                    <textarea class="form-textarea" id="resume-textarea" 
                                              placeholder="Paste your resume content here..."
                                              style="min-height: 250px"
                                              oninput="InputPage.resumeText = this.value">${this.resumeText}</textarea>
                                </div>
                                <div id="resume-upload-area" class="${this.resumeMethod !== 'upload' ? 'hidden' : ''}">
                                    ${FileUpload.create('resume-upload')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Analyse button -->
                    <div class="input-actions fade-in-up" style="margin-top: var(--space-6)">
                        <button class="btn btn-primary btn-lg" onclick="InputPage.analyse()" id="analyse-btn">
                            ⚡ Analyse with AI
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        // Listen for file uploads
        document.addEventListener('file-uploaded', (e) => {
            if (e.detail.id === 'jd-upload') {
                this.jdText = e.detail.text;
            } else if (e.detail.id === 'resume-upload') {
                this.resumeText = e.detail.text;
            }
        });

        // Check API key status
        this.checkApiKey();
    },

    async checkApiKey() {
        try {
            const health = await API.healthCheck();
            if (health.has_api_key) {
                const status = document.getElementById('api-key-status');
                if (status) status.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Health check failed:', e);
        }
    },

    async saveApiKey() {
        const input = document.getElementById('api-key-input');
        const key = input.value.trim();
        if (!key || key === '••••••••••') {
            Helpers.showToast('Please enter a valid API key.', 'warning');
            return;
        }

        try {
            await API.setApiKey(key);
            document.getElementById('api-key-status').classList.remove('hidden');
            Helpers.showToast('API key saved successfully!', 'success');
        } catch (e) {
            Helpers.showToast(`Failed to set API key: ${e.message}`, 'error');
        }
    },

    setJdMethod(method) {
        this.jdMethod = method;
        document.getElementById('jd-paste-area').classList.toggle('hidden', method !== 'paste');
        document.getElementById('jd-upload-area').classList.toggle('hidden', method !== 'upload');
        // Update tab styles
        document.querySelectorAll('.input-panel:first-child .input-method-tab').forEach((tab, i) => {
            tab.classList.toggle('active', (i === 0 && method === 'paste') || (i === 1 && method === 'upload'));
        });
    },

    setResumeMethod(method) {
        this.resumeMethod = method;
        document.getElementById('resume-paste-area').classList.toggle('hidden', method !== 'paste');
        document.getElementById('resume-upload-area').classList.toggle('hidden', method !== 'upload');
        document.querySelectorAll('.input-panel:last-child .input-method-tab').forEach((tab, i) => {
            tab.classList.toggle('active', (i === 0 && method === 'paste') || (i === 1 && method === 'upload'));
        });
    },

    async analyse() {
        // Get text from textareas if using paste mode
        const jdEl = document.getElementById('jd-textarea');
        const resumeEl = document.getElementById('resume-textarea');
        if (jdEl && this.jdMethod === 'paste') this.jdText = jdEl.value;
        if (resumeEl && this.resumeMethod === 'paste') this.resumeText = resumeEl.value;

        if (!this.jdText.trim()) {
            Helpers.showToast('Please provide a job description.', 'warning');
            return;
        }
        if (!this.resumeText.trim()) {
            Helpers.showToast('Please provide your resume.', 'warning');
            return;
        }

        try {
            // Step 1: Analyse JD
            Helpers.showLoading('Analysing Job Description...', 'Extracting skills, competencies, and requirements');
            const jdAnalysis = await API.analyzeJD(this.jdText);
            App.state.jdAnalysis = jdAnalysis;
            App.state.jdText = this.jdText;

            // Step 2: Analyse Resume
            Helpers.showLoading('Analysing Your Resume...', 'Cross-referencing with job requirements');
            const candidateAnalysis = await API.analyzeResume(this.resumeText, jdAnalysis);
            App.state.candidateAnalysis = candidateAnalysis;
            App.state.resumeText = this.resumeText;

            Helpers.hideLoading();
            Helpers.showToast('Analysis complete!', 'success');

            // Navigate to role analysis
            App.navigate('role-analysis');

        } catch (error) {
            Helpers.hideLoading();
            Helpers.showToast(`Analysis failed: ${error.message}`, 'error');
        }
    }
};
