/**
 * Voice Controls Component — Microphone button with waveform visualizer
 */

const VoiceControls = {
    /**
     * Create voice control UI
     */
    create() {
        return `
            <div class="voice-controls-wrapper">
                <button class="mic-btn" id="mic-btn" onclick="VoiceControls.toggleMic()"
                        data-tooltip="Hold or click to speak" aria-label="Microphone">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
                <div class="waveform hidden" id="waveform">
                    <div class="waveform-bar"></div>
                    <div class="waveform-bar"></div>
                    <div class="waveform-bar"></div>
                    <div class="waveform-bar"></div>
                    <div class="waveform-bar"></div>
                    <div class="waveform-bar"></div>
                    <div class="waveform-bar"></div>
                </div>
            </div>
        `;
    },

    isRecording: false,
    onTranscript: null,
    startTime: null,

    /**
     * Toggle microphone recording
     */
    toggleMic() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    },

    /**
     * Start recording
     */
    startRecording() {
        const micBtn = document.getElementById('mic-btn');
        const waveform = document.getElementById('waveform');

        Speech.onResult = (transcript, isFinal) => {
            // Update live transcript display
            const liveEl = document.getElementById('live-transcript');
            if (liveEl) {
                liveEl.textContent = transcript;
            }
        };

        const started = Speech.startListening();
        if (started) {
            this.isRecording = true;
            this.startTime = Date.now();
            micBtn.classList.add('recording');
            micBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>';
            if (waveform) waveform.classList.remove('hidden');
        }
    },

    /**
     * Stop recording and return results
     */
    stopRecording() {
        const micBtn = document.getElementById('mic-btn');
        const waveform = document.getElementById('waveform');

        const transcript = Speech.stopListening();
        const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;

        this.isRecording = false;
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
        if (waveform) waveform.classList.add('hidden');

        if (this.onTranscript && transcript.trim()) {
            const wordCount = transcript.trim().split(/\s+/).length;
            const fillers = Helpers.countFillerWords(transcript);

            this.onTranscript({
                transcript: transcript.trim(),
                duration,
                wordCount,
                fillerWordCount: fillers.total,
                fillerDetail: fillers.detail,
            });
        }
    }
};
