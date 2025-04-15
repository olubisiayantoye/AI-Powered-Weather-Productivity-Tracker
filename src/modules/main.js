// Updated main.js with correct import paths
import { initializeDashboard } from './dashboardView.mjs';
import { setupThemeToggle } from './settingsView.mjs';
import { initProductivityTracker } from './productivityTracker.mjs';
import { initWeatherTracker } from './weatherTracker.mjs';
import { initPomodoroTimer } from './pomodoroTimer.mjs';
import { initTodoManager } from './todoManager.mjs';

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupThemeToggle();
    initProductivityTracker();
    initWeatherTracker();
    initPomodoroTimer();
    initTodoManager();
    
    const savedTheme = localStorage.getItem('themePreference') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});