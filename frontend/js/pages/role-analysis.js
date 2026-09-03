/**
 * Role Analysis Page — Dashboard showing JD analysis results
 */

const RoleAnalysisPage = {
    render() {
        const jd = App.state.jdAnalysis;
        if (!jd) {
            return `<div class="page page-enter"><div class="container text-center" style="padding: var(--space-20) 0">
                <h2>No analysis data</h2><p style="margin-top:var(--space-4)">Please go back and analyse a job description first.</p>
                <button class="btn btn-primary" onclick="App.navigate('input')" style="margin-top:var(--space-6)">← Go to Input</button>
            </div></div>`;
        }

        return `
            <div class="page page-enter">
                <div class="analysis-page container">
                    <!-- Header -->
                    <div class="analysis-header fade-in-up">
                        <div class="badge badge-primary" style="margin-bottom: var(--space-3)">📊 Role Analysis</div>
                        <h1 class="analysis-role-title">${Helpers.escapeHtml(jd.role_title)}</h1>
                        ${jd.company ? `<p class="analysis-company">at ${Helpers.escapeHtml(jd.company)}</p>` : ''}
                    </div>

                    <!-- Required Skills -->
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">🎯 Required Skills</h3>
                        <div class="skills-grid">
                            ${(jd.required_skills || []).map(s => `
                                <span class="chip"><span class="chip-icon">●</span>${Helpers.escapeHtml(s)}</span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Preferred Skills -->
                    ${jd.preferred_skills && jd.preferred_skills.length ? `
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">⭐ Preferred Skills</h3>
                        <div class="skills-grid">
                            ${jd.preferred_skills.map(s => `
                                <span class="chip" style="border-color: rgba(245,158,11,0.2)"><span class="chip-icon" style="color:var(--color-warning)">○</span>${Helpers.escapeHtml(s)}</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Key Responsibilities -->
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">📋 Key Responsibilities</h3>
                        <ul class="responsibilities-list">
                            ${(jd.key_responsibilities || []).map((r, i) => `
                                <li><span class="num">${i + 1}</span><span>${Helpers.escapeHtml(r)}</span></li>
                            `).join('')}
                        </ul>
                    </div>

                    <!-- Technical Competencies -->
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">⚙️ Technical Competencies</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4)">
                            ${(jd.technical_competencies || []).map(c => `
                                <div class="card card-gradient">
                                    <h5 style="margin-bottom: var(--space-2)">${Helpers.escapeHtml(c.name)}</h5>
                                    <p style="font-size: var(--text-sm); color: var(--text-tertiary)">${Helpers.escapeHtml(c.description || '')}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Behavioural Competencies -->
                    ${jd.behavioural_competencies && jd.behavioural_competencies.length ? `
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">🤝 Behavioural Competencies</h3>
                        <div class="skills-grid">
                            ${jd.behavioural_competencies.map(c => `
                                <span class="badge badge-info">${Helpers.escapeHtml(c)}</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Experience & Qualifications -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6)">
                        ${jd.experience_expectations ? `
                        <div class="analysis-section fade-in-up">
                            <h3 class="analysis-section-title">💼 Experience</h3>
                            <div class="card">
                                <p style="color: var(--text-secondary)">${Helpers.escapeHtml(jd.experience_expectations)}</p>
                            </div>
                        </div>
                        ` : ''}
                        ${jd.qualifications && jd.qualifications.length ? `
                        <div class="analysis-section fade-in-up">
                            <h3 class="analysis-section-title">🎓 Qualifications</h3>
                            <div class="card">
                                <ul style="list-style: none; display: flex; flex-direction: column; gap: var(--space-2)">
                                    ${jd.qualifications.map(q => `<li style="color: var(--text-secondary); font-size: var(--text-sm)">• ${Helpers.escapeHtml(q)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Keywords -->
                    ${jd.important_keywords && jd.important_keywords.length ? `
                    <div class="analysis-section fade-in-up">
                        <h3 class="analysis-section-title">🔑 Important Keywords</h3>
                        <div class="skills-grid">
                            ${jd.important_keywords.map(k => `
                                <span class="badge badge-primary">${Helpers.escapeHtml(k)}</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Continue button -->
                    <div style="text-align: center; margin-top: var(--space-10)" class="fade-in-up">
                        <button class="btn btn-primary btn-lg" onclick="App.navigate('candidate-analysis')" id="continue-to-candidate-btn">
                            Continue to Candidate Analysis →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};
