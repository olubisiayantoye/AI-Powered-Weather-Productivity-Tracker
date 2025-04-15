export function setupThemeToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'theme-toggle';
    toggle.innerHTML = `
        <button id="theme-switcher">Toggle Dark Mode</button>
    `;
    document.body.appendChild(toggle);
    
    document.getElementById('theme-switcher').addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('themePreference', newTheme);
}

export function renderSettings() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="settings-container">
            <h1>Settings</h1>
            <div class="setting-option">
                <h3>Theme</h3>
                <button id="theme-switch">Switch Theme</button>
            </div>
            <div class="setting-option">
                <h3>ActivityWatch Setup</h3>
                <p>Ensure ActivityWatch is running on your computer</p>
                <a href="http://localhost:5600" target="_blank">Open ActivityWatch</a>
            </div>
            <button id="back-to-dashboard">Back to Dashboard</button>
        </div>
    `;
    
    document.getElementById('theme-switch').addEventListener('click', toggleTheme);
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        import('./dashboardView.mjs').then(module => module.initializeDashboard());
    });
}