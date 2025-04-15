import Chart from 'chart.js/auto';
import { getStoredData } from './utils.mjs';

export function renderLogbook() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="logbook-container">
            <h1>Productivity Logbook</h1>
            <div class="chart-container">
                <canvas id="productivityChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="weatherCorrelationChart"></canvas>
            </div>
            <button id="back-to-dashboard">Back to Dashboard</button>
        </div>
    `;
    
    setupChart();
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        import('./dashboardView.mjs').then(module => module.initializeDashboard());
    });
}

async function setupChart() {
    const productivityData = await getStoredData('productivityHistory') || [];
    const weatherData = await getStoredData('weatherHistory') || [];
    
    if (productivityData.length > 0) {
        renderProductivityChart(productivityData);
    }
    
    if (productivityData.length > 0 && weatherData.length > 0) {
        renderCorrelationChart(productivityData, weatherData);
    }
}

function renderProductivityChart(data) {
    const ctx = document.getElementById('productivityChart').getContext('2d');
    
    const dates = data.map(item => new Date(item.timestamp).toLocaleDateString());
    const scores = data.map(item => item.productivityScore);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Productivity Score',
                data: scores,
                borderColor: '#00B4D8',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: Math.max(0, Math.min(...scores) - 10),
                    max: Math.min(100, Math.max(...scores) + 10)
                }
            }
        }
    });
}

function renderCorrelationChart(prodData, weatherData) {
    // This is a simplified correlation chart
    const ctx = document.getElementById('weatherCorrelationChart').getContext('2d');
    
    // Match productivity data with weather data by timestamp (simplified)
    const combined = prodData.map((prod, i) => {
        const weather = weatherData[i] || {};
        return {
            temp: weather.temp || 20,
            score: prod.productivityScore
        };
    });
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Temperature vs Productivity',
                data: combined.map(item => ({x: item.temp, y: item.score})),
                backgroundColor: '#2D6A4F'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: 'Temperature (°C)' }
                },
                y: {
                    title: { display: true, text: 'Productivity Score' },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}