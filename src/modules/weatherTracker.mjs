import axios from 'axios';
import { displayWeatherData } from './dashboardView.mjs';
import { storeWeatherData } from './utils.mjs';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
console.log('seeeodddddo', import.meta.env.VITE_OPENWEATHER_API_KEY);
let currentWeather = null;

export async function initWeatherTracker() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await fetchWeatherData(latitude, longitude);
            },
            (error) => {
                console.error("Geolocation error:", error);
                // Default to a major city if geolocation fails
                fetchWeatherData(40.7128, -74.0060); // New York
            }
        );
    } else {
        fetchWeatherData(40.7128, -74.0060); // Fallback
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        currentWeather = processWeatherData(response.data);
        displayWeatherData(currentWeather);
        storeWeatherData(currentWeather);
    } catch (error) {
        console.error("Weather API error:", error);
    }
}

function processWeatherData(data) {
    return {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        conditions: data.weather[0].main,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        location: data.name,
        timestamp: Date.now()
    };
}

export function getCurrentWeather() {
    return currentWeather;
}