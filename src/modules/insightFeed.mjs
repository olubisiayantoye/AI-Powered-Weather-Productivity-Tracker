import { getStoredData } from './utils.mjs';
import { getCurrentWeather } from './weatherTracker.mjs';
import { getProductivityData } from './productivityTracker.mjs';

export async function generateInsights() {
    // Get all relevant data
    const weatherHistory = await getStoredData('weatherHistory') || [];
    const productivityHistory = await getStoredData('productivityHistory') || [];
    const currentWeather = getCurrentWeather();
    const currentProductivity = getProductivityData();

    // Generate time-based insights
    const timeInsights = generateTimeBasedInsights(productivityHistory);
    
    // Generate weather-based insights
    const weatherInsights = generateWeatherBasedInsights(
        weatherHistory, 
        productivityHistory
    );
    
    // Generate current condition tips
    const currentTips = generateCurrentTips(
        currentWeather,
        currentProductivity
    );

    return {
        timeInsights,
        weatherInsights,
        currentTips,
        lastUpdated: new Date().toLocaleTimeString()
    };
}

function generateTimeBasedInsights(productivityData) {
    if (productivityData.length < 3) return ["Collect more data for time-based insights"];
    
    const byHour = Array(24).fill().map(() => ({ focused: 0, distracted: 0 }));
    
    productivityData.forEach(entry => {
        const hour = new Date(entry.timestamp).getHours();
        byHour[hour].focused += entry.focusedTime;
        byHour[hour].distracted += entry.distractedTime;
    });

    // Find best and worst hours
    let bestHour, worstHour;
    let bestScore = 0, worstScore = 100;
    
    byHour.forEach((hourData, hour) => {
        const total = hourData.focused + hourData.distracted;
        if (total === 0) return;
        
        const score = (hourData.focused / total) * 100;
        if (score > bestScore) {
            bestScore = score;
            bestHour = hour;
        }
        if (score < worstScore) {
            worstScore = score;
            worstHour = hour;
        }
    });

    const insights = [];
    
    if (bestHour !== undefined) {
        insights.push(`Your most productive time: ${formatHour(bestHour)} (${Math.round(bestScore)}% focus)`);
    }
    
    if (worstHour !== undefined) {
        insights.push(`Your least productive time: ${formatHour(worstHour)} (${Math.round(worstScore)}% focus)`);
    }

    return insights.length > 0 ? insights : ["No time patterns detected yet"];
}

function generateWeatherBasedInsights(weatherData, productivityData) {
    if (weatherData.length < 5 || productivityData.length < 5) {
        return ["Collect more data for weather insights"];
    }

    const conditionsMap = {};
    
    // Group productivity by weather conditions
    weatherData.forEach((weather, index) => {
        const productivity = productivityData[index];
        if (!weather || !productivity) return;
        
        const condition = weather.conditions.toLowerCase();
        if (!conditionsMap[condition]) {
            conditionsMap[condition] = {
                focused: 0,
                distracted: 0,
                count: 0
            };
        }
        
        conditionsMap[condition].focused += productivity.focusedTime;
        conditionsMap[condition].distracted += productivity.distractedTime;
        conditionsMap[condition].count++;
    });

    const insights = [];
    
    // Generate insights for each weather condition
    Object.entries(conditionsMap).forEach(([condition, data]) => {
        if (data.count < 3) return; // Need at least 3 data points
        
        const total = data.focused + data.distracted;
        const score = (data.focused / total) * 100;
        
        if (score > 75) {
            insights.push(`You're very productive during ${condition} weather (${Math.round(score)}% focus)`);
        } else if (score < 50) {
            insights.push(`You struggle to focus during ${condition} weather (${Math.round(score)}% focus)`);
        }
    });

    return insights.length > 0 ? insights : ["No weather patterns detected yet"];
}

function generateCurrentTips(currentWeather, currentProductivity) {
    const tips = [];
    const now = new Date();
    const hour = now.getHours();

    // Time-based tips
    if (hour < 12) {
        tips.push("Morning hours are great for deep work");
    } else if (hour >= 12 && hour < 14) {
        tips.push("Consider a short break after lunch to avoid the afternoon slump");
    } else if (hour >= 14 && hour < 17) {
        tips.push("Afternoons are good for collaborative work and meetings");
    }

    // Weather-based tips
    if (currentWeather) {
        const temp = currentWeather.temp;
        const condition = currentWeather.conditions.toLowerCase();

        if (temp > 25) {
            tips.push("It's warm - stay hydrated and take cooling breaks");
        } else if (temp < 15) {
            tips.push("It's cool - a warm drink might help maintain focus");
        }

        if (condition.includes('rain')) {
            tips.push("Rainy weather can be great for focused work");
        } else if (condition.includes('sun')) {
            tips.push("Bright sunlight? Consider adjusting your screen brightness");
        }
    }

    // Productivity-based tips
    if (currentProductivity) {
        const score = currentProductivity.productivityScore;

        if (score < 40) {
            tips.push("Try the Pomodoro technique to boost your focus");
        } else if (score > 75) {
            tips.push("You're in the zone! Protect this focused time");
        }
    }

    return tips.length > 0 ? tips : ["No specific tips right now. Keep working!"];
}

function formatHour(hour) {
    return hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`;
}

// Display function for your dashboard
export function displayInsights(insights) {
    const insightsContainer = document.getElementById('insights-container');
    if (!insightsContainer) return;

    insightsContainer.innerHTML = `
        <div class="insights-section">
            <h3>⏱ Time Patterns</h3>
            <ul>
                ${insights.timeInsights.map(i => `<li>${i}</li>`).join('')}
            </ul>
        </div>
        <div class="insights-section">
            <h3>🌤 Weather Patterns</h3>
            <ul>
                ${insights.weatherInsights.map(i => `<li>${i}</li>`).join('')}
            </ul>
        </div>
        <div class="insights-section">
            <h3>💡 Current Tips</h3>
            <ul>
                ${insights.currentTips.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>
        <p class="insights-footer">Last updated: ${insights.lastUpdated}</p>
    `;
}