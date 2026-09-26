/**
 * Interview Page — The core interview room with voice, video, and chat
 */

const InterviewPage = {
    messages: [],
    timer: null,
    elapsedSeconds: 0,
    answerStartTime: null,
    currentLevel: 1,
    totalQuestions: 0,
    questionsInLevel: 0,
    isProcessing: false,
    useVoice: false,

    render() {
        if (!App.state.sessionId) {
            return `<div class="page page-enter"><div class="container text-center" style="padding: var(--space-20) 0">
                <h2>No active session</h2><p style="margin-top:var(--space-4)">Please start an interview from the candidate analysis page.</p>
                <button class="btn btn-primary" onclick="App.navigate('candidate-analysis')" style="margin-top:var(--space-6)">← Go Back</button>
            </div></div>`;
        }

        return `
            <div class="page page-enter">
                <div class="interview-room container">
                    <!-- Top bar -->
                    <div class="interview-topbar fade-in-up">
                        <div class="interview-level-info">
                            <span class="interview-level-badge level-${this.currentLevel}" id="level-badge">
                                Level ${this.currentLevel}: ${this.getLevelName(this.currentLevel)}
                            </span>
                            <div class="interview-progress-dots" id="progress-dots">
                                ${this.renderProgressDots()}
                            </div>
                        </div>
                        <div class="interview-timer" id="interview-timer">00:00</div>
                    </div>

                    <!-- Chat area -->
                    <div class="interview-chat" id="interview-chat">
                        <div class="text-center" style="padding: var(--space-8); color: var(--text-muted)">
                            <div class="typing-indicator" style="justify-content: center; margin-bottom: var(--space-4)">
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                            </div>
                            <p>Starting your interview...</p>
                        </div>
                    </div>

                    <!-- Controls -->
                    <div class="interview-controls fade-in-up">
                        ${VoiceControls.create()}
                        <div class="interview-text-input">
                            <input type="text" class="form-input" id="answer-input"
                                   placeholder="Type your answer or use the microphone..."
                                   onkeydown="if(event.key==='Enter') InterviewPage.submitAnswer()"
                                   style="width: 100%">
                            <div id="live-transcript" class="hidden" 
                                 style="font-size: var(--text-sm); color: var(--text-tertiary); margin-top: var(--space-2); padding: 0 var(--space-2); max-height: 60px; overflow-y: auto">
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="InterviewPage.submitAnswer()" id="send-btn">
                            Send →
                        </button>
                        <button class="camera-btn" onclick="InterviewPage.toggleCamera()" id="camera-toggle-btn"
                                data-tooltip="Toggle camera" aria-label="Toggle camera">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="InterviewPage.endInterview()" 
                                style="color: var(--color-error)" id="end-interview-btn">
                            End
                        </button>
                    </div>
                </div>

                <!-- Video panel (hidden by default) -->
                <div class="video-panel hidden" id="video-panel">
                    <video id="camera-preview" autoplay muted playsinline></video>
                </div>
            </div>
        `;
    },

    async init() {
        // Set up voice transcript callback
        VoiceControls.onTranscript = (data) => {
            const input = document.getElementById('answer-input');
            if (input) input.value = data.transcript;
            // Auto-submit after voice
            this.submitAnswer(data.duration, data.wordCount, data.fillerWordCount);
        };

        // Start timer
        this.elapsedSeconds = 0;
        this.startTimer();

        // Start the interview
        await this.startInterview();
    },

    startTimer() {
        this.timer = setInterval(() => {
            this.elapsedSeconds++;
            const timerEl = document.getElementById('interview-timer');
            if (timerEl) {
                timerEl.textContent = Helpers.formatTime(this.elapsedSeconds);
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    getLevelName(level) {
        return { 1: 'Screening', 2: 'Competency', 3: 'Deep-Dive' }[level] || 'Unknown';
    },

    renderProgressDots() {
        const total = 15; // 5 per level × 3 levels
        let dots = '';
        for (let i = 0; i < total; i++) {
            let cls = 'progress-dot';
            if (i < this.totalQuestions) cls += ' completed';
            else if (i === this.totalQuestions) cls += ' current';
            dots += `<div class="${cls}"></div>`;
        }
        return dots;
    },

    addMessage(role, text, animate = true) {
        const chat = document.getElementById('interview-chat');
        if (!chat) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message chat-message-${role}`;
        if (animate) msgDiv.style.animation = 'fadeInUp 0.4s ease-out';

        const label = role === 'ai' ? 'AI Interviewer' : 'You';
        msgDiv.innerHTML = `
            <div class="chat-message-label">${label}</div>
            <div>${Helpers.escapeHtml(text)}</div>
        `;

        chat.appendChild(msgDiv);
        chat.scrollTop = chat.scrollHeight;
    },

    addTypingIndicator() {
        const chat = document.getElementById('interview-chat');
        if (!chat) return;

        const div = document.createElement('div');
        div.className = 'chat-message chat-message-ai';
        div.id = 'typing-indicator';
        div.innerHTML = `
            <div class="chat-message-label">AI Interviewer</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    },

    removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    },

    updateTopbar(level, questionsInLevel, totalQuestions) {
        this.currentLevel = level;
        this.questionsInLevel = questionsInLevel;
        this.totalQuestions = totalQuestions;

        const badge = document.getElementById('level-badge');
        if (badge) {
            badge.className = `interview-level-badge level-${level}`;
            badge.textContent = `Level ${level}: ${this.getLevelName(level)}`;
        }

        const dots = document.getElementById('progress-dots');
        if (dots) {
            dots.innerHTML = this.renderProgressDots();
        }
    },

    async startInterview() {
        try {
            this.addTypingIndicator();
            const result = await API.startInterview(App.state.sessionId);
            this.removeTypingIndicator();

            if (result.next_question) {
                this.addMessage('ai', result.next_question.question);
                this.updateTopbar(result.current_level, result.questions_in_level, result.total_questions_asked);
                this.answerStartTime = Date.now();

                // Speak the question
                Speech.speak(result.next_question.question);
            }
        } catch (error) {
            this.removeTypingIndicator();
            Helpers.showToast(`Failed to start interview: ${error.message}`, 'error');
        }
    },

    async submitAnswer(duration, wordCount, fillerWordCount) {
        if (this.isProcessing) return;

        const input = document.getElementById('answer-input');
        const answer = input ? input.value.trim() : '';

        if (!answer) {
            Helpers.showToast('Please provide an answer.', 'warning');
            return;
        }

        // Calculate metrics
        const dur = duration || (this.answerStartTime ? (Date.now() - this.answerStartTime) / 1000 : 0);
        const wc = wordCount || answer.split(/\s+/).length;
        const fillers = fillerWordCount || Helpers.countFillerWords(answer).total;

        this.isProcessing = true;
        if (input) input.value = '';
        const liveTranscript = document.getElementById('live-transcript');
        if (liveTranscript) { liveTranscript.textContent = ''; liveTranscript.classList.add('hidden'); }

        // Show user message
        this.addMessage('user', answer);

        // Stop any TTS
        Speech.stopSpeaking();

        // Show typing indicator
        this.addTypingIndicator();

        try {
            const result = await API.respondToQuestion(
                App.state.sessionId, answer, dur, wc, fillers
            );
            this.removeTypingIndicator();

            if (result.is_complete) {
                // Interview complete
                this.addMessage('ai', 'Thank you for completing the interview! Your performance report is being generated...');
                this.stopTimer();

                // Navigate to results
                setTimeout(async () => {
                    try {
                        Helpers.showLoading('Generating Report...', 'Evaluating your performance across all competencies');
                        const report = await API.getReport(App.state.sessionId);
                        App.state.report = report;
                        Helpers.hideLoading();
                        App.navigate('results');
                    } catch (e) {
                        Helpers.hideLoading();
                        Helpers.showToast(`Report generation failed: ${e.message}`, 'error');
                    }
                }, 2000);

            } else if (result.next_question) {
                this.updateTopbar(result.current_level, result.questions_in_level, result.total_questions_asked);
                this.addMessage('ai', result.next_question.question);
                this.answerStartTime = Date.now();

                // Speak the question
                Speech.speak(result.next_question.question);
            }

        } catch (error) {
            this.removeTypingIndicator();
            Helpers.showToast(`Error: ${error.message}`, 'error');
        }

        this.isProcessing = false;
    },

    async toggleCamera() {
        const panel = document.getElementById('video-panel');
        const btn = document.getElementById('camera-toggle-btn');
        const active = await Video.toggleCamera('camera-preview');

        if (active) {
            panel.classList.remove('hidden');
            btn.classList.add('active');
        } else {
            panel.classList.add('hidden');
            btn.classList.remove('active');
        }
    },

    async endInterview() {
        if (!confirm('Are you sure you want to end the interview early? Your progress will still be evaluated.')) {
            return;
        }

        this.stopTimer();
        Video.stopCamera();
        Speech.stopSpeaking();
        Speech.stopListening();

        try {
            Helpers.showLoading('Generating Report...', 'Evaluating your performance based on completed questions');
            const report = await API.getReport(App.state.sessionId);
            App.state.report = report;
            Helpers.hideLoading();
            App.navigate('results');
        } catch (e) {
            Helpers.hideLoading();
            Helpers.showToast(`Report generation failed: ${e.message}`, 'error');
        }
    },

    destroy() {
        this.stopTimer();
        Video.stopCamera();
        Speech.stopSpeaking();
        Speech.stopListening();
        this.messages = [];
        this.isProcessing = false;
    }
};
