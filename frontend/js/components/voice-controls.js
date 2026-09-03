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
                        data-tooltip="Hold or click to speak">
                    🎤
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
            micBtn.innerHTML = '⏹';
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
        micBtn.innerHTML = '🎤';
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
