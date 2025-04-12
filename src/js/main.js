import { loadWeather } from './api/weatherAPI.mjs';
import { loadProductivity } from './api/activityWatchAPI.mjs';

document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app');
  const weather = await loadWeather();
  const productivity = await loadProductivity();

  app.innerHTML = `
    <h2>Today’s Weather: ${weather.summary}</h2>
    <h2>Focus Time Today: ${productivity.focusMinutes} mins</h2>
  `;
});
