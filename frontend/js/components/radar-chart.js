/**
 * Radar Chart Component — Canvas-based spider/radar chart for competency scores
 */

const RadarChart = {
    /**
     * Draw a radar chart on a canvas
     * @param {string} canvasId - Canvas element ID
     * @param {Array} data - Array of { name, score } objects
     * @param {number} size - Canvas size
     */
    draw(canvasId, data, size = 300) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        canvas.width = size * 2;  // Retina
        canvas.height = size * 2;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2); // Retina scaling

        const center = size / 2;
        const maxRadius = (size / 2) - 40;
        const numAxes = data.length;
        const angleStep = (2 * Math.PI) / numAxes;

        // Draw grid circles
        const levels = 5;
        for (let i = 1; i <= levels; i++) {
            const r = (maxRadius / levels) * i;
            ctx.beginPath();
            ctx.arc(center, center, r, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axis lines and labels
        data.forEach((item, i) => {
            const angle = (angleStep * i) - Math.PI / 2;
            const x = center + maxRadius * Math.cos(angle);
            const y = center + maxRadius * Math.sin(angle);

            // Axis line
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label
            const labelX = center + (maxRadius + 25) * Math.cos(angle);
            const labelY = center + (maxRadius + 25) * Math.sin(angle);
            ctx.fillStyle = '#a0a0c8';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Wrap long labels
            const words = item.name.split(' ');
            if (words.length > 1) {
                ctx.fillText(words[0], labelX, labelY - 7);
                ctx.fillText(words.slice(1).join(' '), labelX, labelY + 7);
            } else {
                ctx.fillText(item.name, labelX, labelY);
            }
        });

        // Draw data polygon
        ctx.beginPath();
        data.forEach((item, i) => {
            const angle = (angleStep * i) - Math.PI / 2;
            const r = (item.score / 100) * maxRadius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, maxRadius);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw data points
        data.forEach((item, i) => {
            const angle = (angleStep * i) - Math.PI / 2;
            const r = (item.score / 100) * maxRadius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);

            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.fill();

            // Inner dot
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
        });
    }
};
