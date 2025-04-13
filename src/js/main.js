import { loadProductivity } from './api/activityWatchAPI.mjs';
import { loadWeatherByCoords } from './api/weatherAPI.mjs';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  // Request user's location
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const weather = await loadWeatherByCoords(latitude, longitude);

      app.innerHTML = `
        <div class="weather-widget">
          <h2>Weather in ${weather.city}</h2>
          <img src="${weather.icon}" alt="Weather icon" />
          <p>${weather.summary}, ${weather.temp}°C</p>
          <p>Humidity: ${weather.humidity}%</p>
          <p>Wind: ${weather.wind} m/s</p>
        </div>
      `;
    }, (error) => {
      app.innerHTML = `<p>Unable to access location: ${error.message}</p>`;
    });
  } else {
    app.innerHTML = `<p>Geolocation is not supported in your browser.</p>`;
  }
});


