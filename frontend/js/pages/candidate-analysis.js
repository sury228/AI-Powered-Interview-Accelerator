/**
 * Candidate Analysis Page — Job fit score, match breakdown, strengths/weaknesses
 */

const CandidateAnalysisPage = {
    render() {
        const ca = App.state.candidateAnalysis;
        const jd = App.state.jdAnalysis;
        if (!ca || !jd) {
            return `<div class="page page-enter"><div class="container text-center" style="padding: var(--space-20) 0">
                <h2>No analysis data</h2><p style="margin-top:var(--space-4)">Please analyse a JD and resume first.</p>
                <button class="btn btn-primary" onclick="App.navigate('input')" style="margin-top:var(--space-6)">← Go to Input</button>
            </div></div>`;
        }

        const strong = (ca.skill_matches || []).filter(m => m.level === 'strong');
        const partial = (ca.skill_matches || []).filter(m => m.level === 'partial');
        const missing = (ca.skill_matches || []).filter(m => m.level === 'missing');

        return `
            <div class="page page-enter">
                <div class="analysis-page container">
                    <!-- Header -->
                    <div class="analysis-header fade-in-up">
                        <div class="badge badge-primary" style="margin-bottom: var(--space-3)">👤 Candidate Analysis</div>
                        <h2>Your Profile vs <span class="text-gradient">${Helpers.escapeHtml(jd.role_title)}</span></h2>
                    </div>

                    <!-- Fit Score -->
                    <div class="fit-score-section fade-in-up">
                        <div class="fit-score-gauge">
                            ${Gauge.create(ca.job_fit_score, 200, 'fit-gauge')}
                            <div class="fit-score-value">
                                <span class="fit-score-number" id="fit-score-counter">0</span>
                                <span class="fit-score-label">Job Fit Score</span>
                            </div>
                        </div>
                    </div>

                    <!-- Match Breakdown -->
                    <div class="match-breakdown fade-in-up">
                        <div class="match-column">
                            <div class="match-column-title">
                                <span style="color: var(--color-success)">🟢</span> Strong Match (${strong.length})
                            </div>
                            <div class="match-items">
                                ${strong.map(m => `
                                    <div class="match-item card card-success">
                                        <strong>${Helpers.escapeHtml(m.skill)}</strong>
                                        ${m.evidence ? `<p style="font-size:var(--text-xs); color:var(--text-tertiary); margin-top:4px">${Helpers.escapeHtml(m.evidence)}</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="match-column">
                            <div class="match-column-title">
                                <span style="color: var(--color-warning)">🟡</span> Partial Match (${partial.length})
                            </div>
                            <div class="match-items">
                                ${partial.map(m => `
                                    <div class="match-item card card-warning">
                                        <strong>${Helpers.escapeHtml(m.skill)}</strong>
                                        ${m.evidence ? `<p style="font-size:var(--text-xs); color:var(--text-tertiary); margin-top:4px">${Helpers.escapeHtml(m.evidence)}</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="match-column">
                            <div class="match-column-title">
                                <span style="color: var(--color-error)">🔴</span> Missing (${missing.length})
                            </div>
                            <div class="match-items">
                                ${missing.map(m => `
                                    <div class="match-item card card-error">
                                        <strong>${Helpers.escapeHtml(m.skill)}</strong>
                                        ${m.evidence ? `<p style="font-size:var(--text-xs); color:var(--text-tertiary); margin-top:4px">${Helpers.escapeHtml(m.evidence)}</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Strengths & Weaknesses -->
                    <div class="strengths-weaknesses">
                        <div class="analysis-section fade-in-up">
                            <h3 class="analysis-section-title" style="color: var(--color-success)">💪 Strengths</h3>
                            <div class="sw-list">
                                ${(ca.strengths || []).map(s => `
                                    <div class="sw-item card card-success">
                                        <span class="sw-item-icon">✓</span>
                                        <span>${Helpers.escapeHtml(s)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="analysis-section fade-in-up">
                            <h3 class="analysis-section-title" style="color: var(--color-warning)">⚠️ Areas to Improve</h3>
                            <div class="sw-list">
                                ${(ca.weaknesses || []).map(w => `
                                    <div class="sw-item card card-warning">
                                        <span class="sw-item-icon">!</span>
                                        <span>${Helpers.escapeHtml(w)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Claims to probe -->
                    ${ca.claims_to_probe && ca.claims_to_probe.length ? `
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">🔍 Items the AI Will Probe</h3>
                        <div class="card card-gradient">
                            <ul style="list-style: none; display: flex; flex-direction: column; gap: var(--space-3)">
                                ${ca.claims_to_probe.map(c => `
                                    <li style="display: flex; align-items: flex-start; gap: var(--space-3); color: var(--text-secondary); font-size: var(--text-sm)">
                                        <span style="color: var(--accent-violet)">⬥</span>
                                        ${Helpers.escapeHtml(c)}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Resume improvement suggestions -->
                    ${ca.resume_improvement_suggestions && ca.resume_improvement_suggestions.length ? `
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">📝 Resume Improvement Suggestions</h3>
                        <div class="card">
                            <ul style="list-style: none; display: flex; flex-direction: column; gap: var(--space-3)">
                                ${ca.resume_improvement_suggestions.map(s => `
                                    <li style="display: flex; align-items: flex-start; gap: var(--space-3); color: var(--text-secondary); font-size: var(--text-sm)">
                                        <span style="color: var(--accent-cyan)">💡</span>
                                        ${Helpers.escapeHtml(s)}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Start interview CTA -->
                    <div style="text-align: center; margin-top: var(--space-10); padding: var(--space-10) 0" class="fade-in-up">
                        <h3 style="margin-bottom: var(--space-3)">Ready to test your <span class="text-gradient">interview readiness</span>?</h3>
                        <p style="color: var(--text-tertiary); margin-bottom: var(--space-6)">
                            The AI will conduct a personalised 3-level interview based on your profile
                        </p>
                        <button class="btn btn-primary btn-lg glow-pulse" onclick="CandidateAnalysisPage.startInterview()" id="start-interview-btn">
                            🎤 Start AI Interview
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        // Animate the gauge and counter after render
        setTimeout(() => {
            const ca = App.state.candidateAnalysis;
            if (ca) {
                Gauge.animate('fit-gauge', ca.job_fit_score);
                const counter = document.getElementById('fit-score-counter');
                if (counter) Helpers.animateCounter(counter, ca.job_fit_score);
            }
        }, 300);
    },

    async startInterview() {
        try {
            Helpers.showLoading('Preparing Interview...', 'Setting up your personalised AI interview session');

            const result = await API.createSession(
                App.state.jdText,
                App.state.resumeText,
                App.state.jdAnalysis,
                App.state.candidateAnalysis
            );

            App.state.sessionId = result.session_id;
            Helpers.hideLoading();
            App.navigate('interview');

        } catch (error) {
            Helpers.hideLoading();
            Helpers.showToast(`Failed to create session: ${error.message}`, 'error');
        }
    }
};
