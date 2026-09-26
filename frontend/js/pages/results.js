/**
 * Results Page — Comprehensive performance report
 */

const ResultsPage = {
    render() {
        const report = App.state.report;
        if (!report) {
            return `<div class="page page-enter"><div class="container text-center" style="padding: var(--space-20) 0">
                <h2>No report available</h2><p style="margin-top:var(--space-4)">Complete an interview to see your results.</p>
                <button class="btn btn-primary" onclick="App.navigate('input')" style="margin-top:var(--space-6)">← Start Over</button>
            </div></div>`;
        }

        return `
            <div class="page page-enter">
                <div class="results-page container">
                    <!-- Header -->
                    <div class="results-header fade-in-up">
                        <div class="badge badge-primary" style="margin-bottom: var(--space-3)">Performance Report</div>
                        <h1>Your Interview <span class="text-gradient">Results</span></h1>
                        ${report.summary ? `<p style="margin-top: var(--space-4); max-width: 600px; margin-left: auto; margin-right: auto">${Helpers.escapeHtml(report.summary)}</p>` : ''}
                    </div>

                    <!-- Overall Score + Radar -->
                    <div class="results-overall fade-in-up">
                        <div class="overall-score-container">
                            <div class="fit-score-gauge">
                                ${Gauge.create(report.overall_score, 200, 'results-gauge')}
                                <div class="fit-score-value">
                                    <span class="fit-score-number" id="results-score-counter">0</span>
                                    <span class="fit-score-label">Overall Score</span>
                                </div>
                            </div>
                            <div class="readiness-badge ${Helpers.getReadinessClass(report.readiness_level)}" style="margin-top: var(--space-4)">
                                ${report.readiness_level}
                            </div>
                        </div>

                        <!-- Radar Chart -->
                        <div class="radar-chart-container">
                            <canvas id="competency-radar" width="300" height="300"></canvas>
                        </div>
                    </div>

                    <!-- Speaking Metrics -->
                    ${report.speaking_metrics ? `
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">Speaking Metrics</h3>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4)">
                            <div class="card text-center">
                                <div style="font-size: var(--text-3xl); font-weight: 700; font-family: var(--font-display); color: var(--text-primary)">${report.speaking_metrics.average_wpm || 0}</div>
                                <div style="font-size: var(--text-sm); color: var(--text-tertiary)">Avg. Words/Min</div>
                            </div>
                            <div class="card text-center">
                                <div style="font-size: var(--text-3xl); font-weight: 700; font-family: var(--font-display); color: var(--text-primary)">${report.speaking_metrics.total_filler_words || 0}</div>
                                <div style="font-size: var(--text-sm); color: var(--text-tertiary)">Filler Words</div>
                            </div>
                            <div class="card text-center">
                                <div style="font-size: var(--text-3xl); font-weight: 700; font-family: var(--font-display); color: var(--text-primary)">${report.speaking_metrics.average_response_time || 0}s</div>
                                <div style="font-size: var(--text-sm); color: var(--text-tertiary)">Avg. Response Time</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Competency Scores -->
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">Competency Scores</h3>
                        <div class="competency-scores-grid">
                            ${(report.competency_scores || []).map(cs => `
                                <div class="card competency-card">
                                    <div class="competency-card-header">
                                        <span class="competency-card-name">${Helpers.escapeHtml(cs.name)}</span>
                                        <span class="competency-card-score" style="color: ${Helpers.getScoreColor(cs.score)}">${cs.score}</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-bar-fill animate-fill" style="width: ${cs.score}%; background: ${cs.score >= 80 ? 'var(--color-success)' : cs.score >= 60 ? 'var(--gradient-primary)' : cs.score >= 40 ? 'var(--color-warning)' : 'var(--color-error)'}"></div>
                                    </div>
                                    <p class="competency-card-feedback">${Helpers.escapeHtml(cs.feedback || '')}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Question-Level Feedback -->
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">Question-by-Question Feedback</h3>
                        ${(report.question_feedback || []).map((qf, i) => {
                            const assessColors = { 'Good': 'var(--color-success)', 'Average': 'var(--color-warning)', 'Weak': 'var(--color-error)' };
                            const assessColor = assessColors[qf.assessment] || 'var(--text-tertiary)';
                            const levelName = { 1: 'Screening', 2: 'Competency', 3: 'Deep-Dive' }[qf.level] || '';

                            return `
                                <div class="accordion-item" id="q-accordion-${i}">
                                    <button class="accordion-header" onclick="ResultsPage.toggleAccordion('q-accordion-${i}')">
                                        <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1; text-align: left">
                                            <span class="badge" style="background: ${assessColor}20; color: ${assessColor}; border: 1px solid ${assessColor}40; flex-shrink: 0">
                                                ${qf.assessment}
                                            </span>
                                            <span style="flex: 1; font-size: var(--text-sm)">${Helpers.escapeHtml(qf.question).substring(0, 80)}${qf.question.length > 80 ? '...' : ''}</span>
                                            ${levelName ? `<span class="badge badge-info" style="flex-shrink: 0">${levelName}</span>` : ''}
                                        </div>
                                        <span class="accordion-icon">▼</span>
                                    </button>
                                    <div class="accordion-body">
                                        <div class="accordion-content">
                                            <div style="margin-bottom: var(--space-4)">
                                                <p style="font-size: var(--text-sm); font-weight: 600; color: var(--text-tertiary); margin-bottom: var(--space-1)">Question:</p>
                                                <p style="font-size: var(--text-sm)">${Helpers.escapeHtml(qf.question)}</p>
                                            </div>
                                            <div style="margin-bottom: var(--space-4)">
                                                <p style="font-size: var(--text-sm); font-weight: 600; color: var(--text-tertiary); margin-bottom: var(--space-1)">Your Answer:</p>
                                                <p style="font-size: var(--text-sm); color: var(--text-secondary)">${Helpers.escapeHtml(qf.answer)}</p>
                                            </div>
                                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-4)">
                                                <div class="card card-success" style="padding: var(--space-3)">
                                                    <p style="font-size: var(--text-xs); font-weight: 600; color: var(--color-success); margin-bottom: var(--space-2)">What Was Good</p>
                                                    <p style="font-size: var(--text-xs); color: var(--text-secondary)">${Helpers.escapeHtml(qf.what_was_good || 'N/A')}</p>
                                                </div>
                                                <div class="card card-warning" style="padding: var(--space-3)">
                                                    <p style="font-size: var(--text-xs); font-weight: 600; color: var(--color-warning); margin-bottom: var(--space-2)">Could Be Better</p>
                                                    <p style="font-size: var(--text-xs); color: var(--text-secondary)">${Helpers.escapeHtml(qf.what_could_be_better || 'N/A')}</p>
                                                </div>
                                                <div class="card card-gradient" style="padding: var(--space-3)">
                                                    <p style="font-size: var(--text-xs); font-weight: 600; color: var(--accent-indigo); margin-bottom: var(--space-2)">Ideal Direction</p>
                                                    <p style="font-size: var(--text-xs); color: var(--text-secondary)">${Helpers.escapeHtml(qf.ideal_direction || 'N/A')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Strengths & Weaknesses -->
                    <div class="strengths-weaknesses fade-in-up">
                        <div class="analysis-section">
                            <h3 class="analysis-section-title" style="color: var(--color-success)">Strengths</h3>
                            <div class="sw-list">
                                ${(report.strengths || []).map(s => `
                                    <div class="sw-item card card-success">
                                        <span class="sw-item-icon" style="color: var(--color-success)">•</span>
                                        <span>${Helpers.escapeHtml(s)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="analysis-section">
                            <h3 class="analysis-section-title" style="color: var(--color-warning)">Weaknesses</h3>
                            <div class="sw-list">
                                ${(report.weaknesses || []).map(w => `
                                    <div class="sw-item card card-warning">
                                        <span class="sw-item-icon" style="color: var(--color-warning)">•</span>
                                        <span>${Helpers.escapeHtml(w)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Preparation Gaps -->
                    ${report.preparation_gaps && report.preparation_gaps.length ? `
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">Preparation Plan</h3>
                        <div class="prep-gaps">
                            ${report.preparation_gaps.map(pg => `
                                <div class="card prep-gap-card">
                                    <div class="prep-gap-priority priority-${pg.priority}">${pg.priority}</div>
                                    <div class="prep-gap-content">
                                        <div class="prep-gap-topic">${Helpers.escapeHtml(pg.topic)}</div>
                                        <div class="prep-gap-reason">${Helpers.escapeHtml(pg.reason || '')}</div>
                                        <div class="prep-gap-subtopics">
                                            ${(pg.subtopics || []).map(st => `
                                                <span class="chip" style="font-size: var(--text-xs)">${Helpers.escapeHtml(st)}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="results-actions fade-in-up">
                        <button class="btn btn-primary btn-lg" onclick="window.print()" id="download-report-btn">
                            Download Report
                        </button>
                        <button class="btn btn-secondary btn-lg" onclick="App.navigate('input')" id="retry-btn">
                            Try Another
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        const report = App.state.report;
        if (!report) return;

        // Animate gauge and counter
        setTimeout(() => {
            Gauge.animate('results-gauge', report.overall_score);
            const counter = document.getElementById('results-score-counter');
            if (counter) Helpers.animateCounter(counter, report.overall_score);
        }, 300);

        // Draw radar chart
        setTimeout(() => {
            if (report.competency_scores && report.competency_scores.length) {
                RadarChart.draw('competency-radar', report.competency_scores, 300);
            }
        }, 500);
    },

    toggleAccordion(id) {
        const item = document.getElementById(id);
        if (item) {
            item.classList.toggle('open');
        }
    }
};
