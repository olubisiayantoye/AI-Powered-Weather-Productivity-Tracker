https://ai-powered-weather-productivity-tracker.onrender.com/

https://github.com/olubisiayantoye/AI-Powered-Weather-Productivity-Tracker

AI-Powered Weather & Productivity Tracker:

Project Description
A smart dashboard that correlates weather conditions with user productivity patterns, offering data-driven insights to optimize work/study efficiency. By analyzing environmental factors and activity data, it provides personalized recommendations to enhance focus and time management.

Key Features
1. Core Features
a. Weather-Productivity Correlation: Identifies how temperature, humidity, and weather conditions affect focus levels.

b. AI-Powered Insights: Generates personalized suggestions using heuristic analysis and optional AI APIs (Cohere/Hugging Face).

c. Pomodoro Timer: Integrated focus timer with smart break recommendations based on current conditions.

d. Activity Tracking: Logs app/website usage and idle time via ActivityWatch integration.

2. Dashboard Views
Real-Time Snapshot: Current weather + productivity metrics.

Historical Trends: Charts comparing performance across different weather conditions.

Insight Feed: Actionable recommendations (e.g., "You focus best on cloudy mornings").

3. Privacy-Focused
All data processed locally (optional cloud API for advanced AI).

No user data stored externally.

Technology Framework
Frontend
Framework: Vite + Vanilla JavaScript (ES Modules)

UI: CSS Grid/Flexbox, responsive design (mobile-first)

Visualization: Chart.js or D3.js for data charts

Styling: CSS variables for light/dark theme toggling

Backend & APIs
Weather Data: OpenWeather API (free tier)

Productivity Tracking: ActivityWatch (local self-hosted API)

AI Suggestions:

Primary: Rule-based heuristics (local analysis)

Optional: Cohere AI or Hugging Face (free-tier APIs)

Data Handling
Storage: localStorage for user preferences + session data

Analysis: JavaScript modules for correlation logic

Deployment
Hosting: Netlify (frontend), Render (backend if expanded)

Build Tool: Vite (fast development bundler)

Core Modules
1. main.js
Role: Application entry point.

Responsibilities:

Initializes all modules (weatherTracker, productivityTracker, etc.).

Sets up theme preferences.

Coordinates navigation between views.

2. weatherTracker.mjs
Dependencies: OpenWeather API, utils.mjs.

Functions:

initWeatherTracker(): Fetches real-time weather data via geolocation.

fetchWeatherData(lat, lon): Calls OpenWeather API.

processWeatherData(rawData): Formats API response (temp, humidity, conditions).

3. productivityTracker.mjs
Dependencies: ActivityWatch API, utils.mjs.

Functions:

initProductivityTracker(): Fetches local ActivityWatch data.

calculateFocusedTime(rawData): Analyzes productive vs. distracted time.

getMockProductivityData(): Fallback for development.

4. aiAnalyzer.mjs
Dependencies: Cohere/Hugging Face APIs (optional), utils.mjs.

Functions:

generateInsights(): Correlates weather + productivity data.

findCorrelations(): Identifies patterns (e.g., "Best productivity at 22°C").

generateAISuggestions(context): Uses AI APIs or local heuristics.

5. pomodoroTimer.mjs
Dependencies: aiAnalyzer.mjs (for suggestions).

Functions:

startTimer()/pauseTimer()/resetTimer(): Manages Pomodoro cycles.

completePhase(): Handles work/break transitions and stores sessions.

UI Modules
6. dashboardView.mjs
Functions:

displayWeatherData(weather): Renders current weather widget.

displayProductivityData(data): Shows focus metrics and top apps.

7. logbookView.mjs
Dependencies: Chart.js/D3.js.

Functions:

renderProductivityChart(): Historical trends visualization.

renderCorrelationChart(): Weather vs. productivity scatter plot.

8. insightFeed.mjs
Functions:

generateTimeBasedInsights(): Identifies peak productivity hours.

formatInsights(correlations): Converts data to human-readable tips.

9. settingsView.mjs
Functions:

setupThemeToggle(): Handles light/dark mode.

renderActivityWatchSetup(): Guides local API configuration.

Utility Modules
10. utils.mjs
Shared Functions:

storeData(key, value): Saves to localStorage.

getStoredData(key): Retrieves cached data.

formatTime(minutes): Converts to "Xh Ym" format.

