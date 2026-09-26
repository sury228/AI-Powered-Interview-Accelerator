/**
 * Landing Page — Hero section with features and how-it-works
 */

const LandingPage = {
    render() {
        return `
            <div class="page page-enter">
                <div class="container">
                    <!-- Hero -->
                    <section class="landing-hero">
                        <div class="landing-hero-badge fade-in-up">
                            <span>Powered by AI</span>
                        </div>
                        <h1 class="landing-title fade-in-up">
                            Ace Your Next Interview with<br>
                            <span class="text-gradient">AI-Powered Preparation</span>
                        </h1>
                        <p class="landing-subtitle fade-in-up">
                            You're not underqualified — you're under-evidenced. Our AI analyses your resume against any job description, 
                            then conducts a realistic 3-level adaptive interview to reveal exactly what to prepare.
                        </p>
                        <div class="landing-cta-group fade-in-up">
                            <button class="btn btn-primary btn-lg" onclick="App.navigate('input')" id="cta-get-started">
                                Get Started Free →
                            </button>
                            <button class="btn btn-secondary btn-lg" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">
                                Learn More ↓
                            </button>
                        </div>
                    </section>

                    <!-- Features -->
                    <section id="features" class="landing-features">
                        ${this.renderFeatures()}
                    </section>

                    <!-- How it works -->
                    <section class="landing-how-it-works">
                        <h2 class="fade-in-up">How It Works</h2>
                        <p class="fade-in-up" style="color: var(--text-tertiary); margin-top: var(--space-2)">Four simple steps to interview readiness</p>
                        <div class="how-steps">
                            ${this.renderHowSteps()}
                        </div>
                    </section>

                    <!-- Bottom CTA -->
                    <section style="text-align: center; padding: var(--space-16) 0">
                        <h2 class="fade-in-up" style="margin-bottom: var(--space-4)">Ready to <span class="text-gradient">accelerate</span> your prep?</h2>
                        <p class="fade-in-up" style="color: var(--text-tertiary); margin-bottom: var(--space-8)">
                            Paste a job description and your resume — your personalised AI interview starts in seconds.
                        </p>
                        <button class="btn btn-primary btn-lg fade-in-up" onclick="App.navigate('input')">
                            Start Now →
                        </button>
                    </section>
                </div>
            </div>
        `;
    },

    renderFeatures() {
        const features = [
            {
                title: 'JD Analysis',
                desc: 'AI breaks down any job description into skills, competencies, responsibilities, and keywords you need to know.'
            },
            {
                title: 'Resume Fit Score',
                desc: 'See exactly how your profile matches: strong, partial, and missing skills with a calculated fit percentage.'
            },
            {
                title: '3-Level AI Interview',
                desc: 'Screening → Competency → Deep-Dive. Each question adapts based on your previous answers.'
            },
            {
                title: 'Voice & Video',
                desc: 'Speak your answers naturally with real-time transcription. Practice with camera to build confidence.'
            },
            {
                title: 'Adaptive Intelligence',
                desc: 'The AI remembers every answer and probes weak areas deeper while increasing complexity on strengths.'
            },
            {
                title: 'Detailed Report',
                desc: 'Get scores across 7 competencies, question-by-question feedback, and a prioritised preparation plan.'
            }
        ];

        return features.map(f => `
            <div class="card card-hover feature-card fade-in-up">
                <h4 class="feature-title">${f.title}</h4>
                <p class="feature-desc">${f.desc}</p>
            </div>
        `).join('');
    },

    renderHowSteps() {
        const steps = [
            { num: 1, title: 'Upload', desc: 'Paste or upload your JD and resume' },
            { num: 2, title: 'Analyse', desc: 'AI extracts skills, gaps, and fit score' },
            { num: 3, title: 'Interview', desc: '15 adaptive questions across 3 levels' },
            { num: 4, title: 'Report', desc: 'Get detailed scores and prep plan' }
        ];

        return steps.map((s, i) => `
            <div class="how-step fade-in-up">
                <div class="how-step-number">${s.num}</div>
                <h4 class="how-step-title">${s.title}</h4>
                <p class="how-step-desc">${s.desc}</p>
            </div>
            ${i < steps.length - 1 ? '<div class="how-step-arrow fade-in-up">→</div>' : ''}
        `).join('');
    }
};
