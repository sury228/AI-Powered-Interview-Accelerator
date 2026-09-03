/**
 * Helpers — Shared utility functions
 */

const Helpers = {
    /**
     * Show a toast notification
     */
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `
            <span style="font-size: 1.2em">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show/hide loading overlay
     */
    showLoading(text = 'Processing...', subtext = '') {
        const overlay = document.getElementById('loading-overlay');
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-subtext').textContent = subtext;
        overlay.classList.remove('hidden');
    },

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    },

    /**
     * Animate a number counting up
     */
    animateCounter(element, target, duration = 1500) {
        let start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * eased);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    /**
     * Generate a UUID
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Format seconds to MM:SS
     */
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    /**
     * Count filler words in text
     */
    countFillerWords(text) {
        const fillers = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'actually', 'literally', 'right'];
        const lower = text.toLowerCase();
        let total = 0;
        const detail = {};

        fillers.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = lower.match(regex);
            if (matches) {
                detail[filler] = matches.length;
                total += matches.length;
            }
        });

        return { total, detail };
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Get readiness emoji
     */
    getReadinessEmoji(level) {
        const map = {
            'Not Ready': '🔴',
            'Needs Preparation': '🟠',
            'Interview Ready': '🟡',
            'Strong Candidate': '🟢'
        };
        return map[level] || '⚪';
    },

    /**
     * Get readiness CSS class
     */
    getReadinessClass(level) {
        const map = {
            'Not Ready': 'readiness-not-ready',
            'Needs Preparation': 'readiness-needs-prep',
            'Interview Ready': 'readiness-ready',
            'Strong Candidate': 'readiness-strong'
        };
        return map[level] || '';
    },

    /**
     * Get score color based on value
     */
    getScoreColor(score) {
        if (score >= 80) return '#22c55e';
        if (score >= 61) return '#eab308';
        if (score >= 41) return '#f59e0b';
        return '#ef4444';
    }
};
