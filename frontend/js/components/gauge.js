/**
 * Gauge Component — SVG circular score gauge
 */

const Gauge = {
    /**
     * Create an SVG circular gauge
     * @param {number} score - Score value (0-100)
     * @param {number} size - Size in pixels
     * @param {string} id - Element ID
     */
    create(score, size = 200, id = 'gauge') {
        const strokeWidth = 10;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        const color = Helpers.getScoreColor(score);

        return `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" id="${id}" class="scale-in">
                <defs>
                    <linearGradient id="gauge-gradient-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color: #6366f1" />
                        <stop offset="50%" style="stop-color: #8b5cf6" />
                        <stop offset="100%" style="stop-color: ${color}" />
                    </linearGradient>
                </defs>
                <!-- Background circle -->
                <circle
                    cx="${size / 2}" cy="${size / 2}" r="${radius}"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.06)"
                    stroke-width="${strokeWidth}"
                />
                <!-- Score arc -->
                <circle
                    cx="${size / 2}" cy="${size / 2}" r="${radius}"
                    fill="none"
                    stroke="url(#gauge-gradient-${id})"
                    stroke-width="${strokeWidth}"
                    stroke-linecap="round"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${circumference}"
                    transform="rotate(-90 ${size / 2} ${size / 2})"
                    style="transition: stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    id="${id}-arc"
                />
                <!-- Glow effect -->
                <circle
                    cx="${size / 2}" cy="${size / 2}" r="${radius}"
                    fill="none"
                    stroke="url(#gauge-gradient-${id})"
                    stroke-width="${strokeWidth + 6}"
                    stroke-linecap="round"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${circumference}"
                    transform="rotate(-90 ${size / 2} ${size / 2})"
                    opacity="0.15"
                    filter="blur(6px)"
                    style="transition: stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    id="${id}-glow"
                />
            </svg>
        `;
    },

    /**
     * Animate the gauge to the target score
     */
    animate(id, score) {
        const size = 200;
        const strokeWidth = 10;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;

        setTimeout(() => {
            const arc = document.getElementById(`${id}-arc`);
            const glow = document.getElementById(`${id}-glow`);
            if (arc) arc.style.strokeDashoffset = offset;
            if (glow) glow.style.strokeDashoffset = offset;
        }, 200);
    }
};
