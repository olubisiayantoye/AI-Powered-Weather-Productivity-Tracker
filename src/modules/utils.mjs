import localforage from 'localforage';

// Configure local storage
localforage.config({
    name: 'WeatherProductivityTracker',
    storeName: 'productivity_weather_data'
});

export async function storeWeatherData(data) {
    try {
        // Get existing history
        const history = (await localforage.getItem('weatherHistory')) || [];
        // Add new data (limit to 30 entries)
        const newHistory = [...history, data].slice(-30);
        await localforage.setItem('weatherHistory', newHistory);
    } catch (err) {
        console.error('Error saving weather data:', err);
    }
}

export async function storeProductivityData(data) {
    try {
        const history = (await localforage.getItem('productivityHistory')) || [];
        const newHistory = [...history, data].slice(-30);
        await localforage.setItem('productivityHistory', newHistory);
    } catch (err) {
        console.error('Error saving productivity data:', err);
    }
}

export async function getStoredData(key) {
    try {
        return await localforage.getItem(key);
    } catch (err) {
        console.error(`Error loading ${key}:`, err);
        return null;
    }
}

export function formatTime(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
}

// Add to existing utils.mjs
export async function storePomodoroSession(session) {
    try {
        const history = (await localforage.getItem('pomodoroHistory')) || [];
        const newHistory = [...history, session].slice(-100); // Keep last 100 sessions
        await localforage.setItem('pomodoroHistory', newHistory);
    } catch (err) {
        console.error('Error saving Pomodoro session:', err);
    }
}

export async function getPomodoroHistory() {
    try {
        return await localforage.getItem('pomodoroHistory') || [];
    } catch (err) {
        console.error('Error loading Pomodoro history:', err);
        return [];
    }
}