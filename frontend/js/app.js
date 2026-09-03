/**
 * App — Main SPA router and state management
 */

const App = {
    // Global state
    state: {
        jdText: '',
        resumeText: '',
        jdAnalysis: null,
        candidateAnalysis: null,
        sessionId: null,
        report: null,
    },

    // Page registry
    pages: {
        'landing': LandingPage,
        'input': InputPage,
        'role-analysis': RoleAnalysisPage,
        'candidate-analysis': CandidateAnalysisPage,
        'interview': InterviewPage,
        'results': ResultsPage,
    },

    currentPage: null,

    /**
     * Initialize the application
     */
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());

        // Initial route
        this.handleRoute();
    },

    /**
     * Handle URL hash routing
     */
    handleRoute() {
        const hash = window.location.hash.slice(2) || 'landing'; // Remove #/
        this.renderPage(hash);
    },

    /**
     * Navigate to a page
     */
    navigate(page) {
        window.location.hash = `#/${page}`;
    },

    /**
     * Render a page
     */
    renderPage(pageId) {
        const page = this.pages[pageId];
        if (!page) {
            this.navigate('landing');
            return;
        }

        // Cleanup previous page
        if (this.currentPage && this.pages[this.currentPage] && this.pages[this.currentPage].destroy) {
            this.pages[this.currentPage].destroy();
        }

        this.currentPage = pageId;

        // Update navbar
        Navbar.render(pageId);

        // Render page content
        const app = document.getElementById('app');
        app.innerHTML = page.render();

        // Run page init if exists
        if (page.init) {
            page.init();
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }
};

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
