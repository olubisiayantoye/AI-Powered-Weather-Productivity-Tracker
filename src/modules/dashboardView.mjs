import { getCurrentWeather } from './weatherTracker.mjs';
import { generateInsights } from './aiAnalyzer.mjs';

export function initializeDashboard() {
    renderDashboard();
    //setupEventListeners();
}

function renderDashboard() {
    const dashboardHTML = `
        <div class="dashboard-container">
            <div class="weather-card">
                <h2>Current Weather</h2>
                <div id="weather-display">Loading weather...</div>
            </div>
            <div class="productivity-card">
                <h2>Today's Productivity</h2>
                <div id="productivity-display">Loading productivity data...</div>
            </div>
            <div class="insights-card">
                <h2>Insights</h2>
                <div id="insights-display">Analyzing your patterns...</div>
            </div>
        </div>
    `;
    
    document.getElementById('app').innerHTML = dashboardHTML;
}

export function displayWeatherData(weather) {
    const weatherDisplay = document.getElementById('weather-display');
    if (!weatherDisplay) return;
    
    weatherDisplay.innerHTML = `
        <div class="weather-info">
            <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="${weather.conditions}">
            <div class="weather-details">
                <p class="temperature">${weather.temp}°C</p>
                <p>Feels like ${weather.feelsLike}°C</p>
                <p>Humidity: ${weather.humidity}%</p>
                <p>Wind: ${weather.windSpeed} km/h</p>
                <p class="location">${weather.location}</p>
            </div>
        </div>
    `;
}

export function displayProductivityData(data) {
    const productivityDisplay = document.getElementById('productivity-display');
    if (!productivityDisplay) return;
    
    productivityDisplay.innerHTML = `
        <div class="productivity-metrics">
            <div class="metric">
                <h3>${Math.floor(data.focusedTime / 60)}h ${data.focusedTime % 60}m</h3>
                <p>Focused Time</p>
            </div>
            <div class="metric">
                <h3>${Math.floor(data.distractedTime / 60)}h ${data.distractedTime % 60}m</h3>
                <p>Distracted Time</p>
            </div>
            <div class="metric">
                <h3>${data.productivityScore}%</h3>
                <p>Productivity Score</p>
            </div>
        </div>
        <div class="top-apps">
            <h4>Top Applications</h4>
            <ul>
                ${data.appsUsed.map(app => `<li>${app}</li>`).join('')}
            </ul>
        </div>
        <div class="productivity-analysis">
            <h4>Analysis</h4>
            <p>${getProductivityAnalysis(data)}</p>
        </div>
    `;
}

function getProductivityAnalysis(data) {
    if (data.productivityScore >= 80) {
        return "Excellent focus today! You're in the zone.";
    } else if (data.productivityScore >= 60) {
        return "Good productivity level. Some distractions but overall effective.";
    } else if (data.productivityScore >= 40) {
        return "Moderate productivity. Consider eliminating some distractions.";
    } else {
        return "Low productivity detected. Try focusing on one task at a time.";
    }
}

export async function displayInsights() {
    const insightsDisplay = document.getElementById('insights-display');
    if (!insightsDisplay) return;
    
    const insights = await generateInsights();
    insightsDisplay.innerHTML = `
        <div class="insights-content">
            <p class="insight-message">${insights.message}</p>
            ${insights.correlations ? `
                <ul class="correlations">
                    ${insights.correlations.map(c => `<li>${c}</li>`).join('')}
                </ul>
            ` : ''}
            ${insights.tips && insights.tips.length > 0 ? `
                <div class="tips">
                    <h4>Suggestions</h4>
                    <ul>
                        ${insights.tips.map(t => `<li>${t}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

// Add to existing dashboardView.mjs
export async function displayPomodoroSummary() {
    const pomodoroData = await getStoredData('pomodoroHistory') || [];
    
    if (pomodoroData.length === 0) return;
    
    const todaySessions = pomodoroData.filter(session => {
        const sessionDate = new Date(session.timestamp);
        const today = new Date();
        return sessionDate.getDate() === today.getDate() && 
               sessionDate.getMonth() === today.getMonth() && 
               sessionDate.getFullYear() === today.getFullYear();
    });
    
    const completedToday = todaySessions.filter(s => s.completed).length;
    
    const summaryHTML = `
        <div class="pomodoro-summary">
            <h3>Today's Pomodoros</h3>
            <p>Completed: ${completedToday}/${todaySessions.length}</p>
            <button id="view-pomodoro">Open Pomodoro Timer</button>
        </div>
    `;
    
    const dashboard = document.querySelector('.dashboard-container');
    if (dashboard) {
        dashboard.insertAdjacentHTML('beforeend', summaryHTML);
        document.getElementById('view-pomodoro').addEventListener('click', () => {
            import('./pomodoroTimer.mjs').then(module => module.initPomodoroTimer());
        });
    }
}