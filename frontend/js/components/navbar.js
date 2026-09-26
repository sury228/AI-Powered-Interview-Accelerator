/**
 * Navbar Component — Navigation with step progress
 */

const Navbar = {
    steps: [
        { id: 'landing', label: 'Home' },
        { id: 'input', label: 'Input' },
        { id: 'role-analysis', label: 'Role' },
        { id: 'candidate-analysis', label: 'Candidate' },
        { id: 'interview', label: 'Interview' },
        { id: 'results', label: 'Results' },
    ],

    render(currentPage) {
        const navbar = document.getElementById('navbar');
        const completedSteps = this.getCompletedSteps(currentPage);

        navbar.innerHTML = `
            <div class="navbar-inner">
                <div class="navbar-brand" onclick="App.navigate('landing')">
                    <span>Interview <span class="text-gradient">Accelerator</span></span>
                </div>
                <div class="navbar-steps">
                    ${this.steps.slice(1).map((step, i) => `
                        <div class="navbar-step ${currentPage === step.id ? 'active' : ''} ${completedSteps.includes(step.id) ? 'completed' : ''}"
                             onclick="App.navigate('${step.id}')"
                             style="cursor: pointer">
                            <span class="navbar-step-dot"></span>
                            <span>${step.label}</span>
                        </div>
                        ${i < this.steps.length - 2 ? '<div class="navbar-step-connector"></div>' : ''}
                    `).join('')}
                </div>
            </div>
        `;
    },

    getCompletedSteps(currentPage) {
        const order = this.steps.map(s => s.id);
        const currentIndex = order.indexOf(currentPage);
        return order.slice(0, currentIndex);
    }
};
