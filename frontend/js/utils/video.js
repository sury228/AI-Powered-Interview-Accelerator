/**
 * Video Utilities — Camera control using getUserMedia
 */

const Video = {
    stream: null,
    videoElement: null,
    isActive: false,

    /**
     * Start the camera and attach to a video element
     */
    async startCamera(videoElementId = 'camera-preview') {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
                audio: false
            });

            this.videoElement = document.getElementById(videoElementId);
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                this.videoElement.play();
            }

            this.isActive = true;
            return true;
        } catch (err) {
            console.error('Camera access error:', err);
            Helpers.showToast('Camera access denied or unavailable.', 'warning');
            return false;
        }
    },

    /**
     * Stop the camera
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.isActive = false;
    },

    /**
     * Toggle camera on/off
     */
    async toggleCamera(videoElementId) {
        if (this.isActive) {
            this.stopCamera();
            return false;
        } else {
            return await this.startCamera(videoElementId);
        }
    },

    /**
     * Check if camera is supported
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
};
