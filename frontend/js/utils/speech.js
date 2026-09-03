/**
 * Speech Utilities — Web Speech API integration for STT + TTS
 */

const Speech = {
    recognition: null,
    synthesis: window.speechSynthesis,
    isListening: false,
    isSpeaking: false,
    transcript: '',
    onResult: null,
    onEnd: null,
    onError: null,
    supported: false,

    /**
     * Initialize speech recognition
     */
    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.supported = true;

            this.recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript;
                    } else {
                        interim += transcript;
                    }
                }

                if (final) {
                    this.transcript += final;
                }

                if (this.onResult) {
                    this.onResult(this.transcript + interim, !!final);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech' && this.onError) {
                    this.onError(event.error);
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.onEnd) {
                    this.onEnd(this.transcript);
                }
            };
        } else {
            console.warn('Speech recognition not supported in this browser.');
            this.supported = false;
        }
    },

    /**
     * Start listening
     */
    startListening() {
        if (!this.recognition) {
            this.init();
        }
        if (!this.supported) {
            Helpers.showToast('Speech recognition not supported. Please use Chrome or Edge.', 'warning');
            return false;
        }

        this.transcript = '';
        this.isListening = true;

        try {
            this.recognition.start();
            return true;
        } catch (e) {
            console.error('Failed to start recognition:', e);
            return false;
        }
    },

    /**
     * Stop listening and return transcript
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
        return this.transcript;
    },

    /**
     * Speak text using TTS
     */
    speak(text, rate = 1.0) {
        return new Promise((resolve) => {
            if (!this.synthesis) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Try to use a natural sounding voice
            const voices = this.synthesis.getVoices();
            const preferred = voices.find(v =>
                v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
            ) || voices.find(v => v.lang.startsWith('en'));

            if (preferred) {
                utterance.voice = preferred;
            }

            utterance.onstart = () => { this.isSpeaking = true; };
            utterance.onend = () => {
                this.isSpeaking = false;
                resolve();
            };
            utterance.onerror = () => {
                this.isSpeaking = false;
                resolve();
            };

            this.synthesis.speak(utterance);
        });
    },

    /**
     * Stop speaking
     */
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    },

    /**
     * Check if speech APIs are supported
     */
    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
};

// Initialize speech on load
if (typeof window !== 'undefined') {
    // Load voices (they may load asynchronously)
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
}
