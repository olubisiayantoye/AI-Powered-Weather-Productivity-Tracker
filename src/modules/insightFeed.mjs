import { getStoredData } from './utils.mjs';
import { getCurrentWeather } from './weatherTracker.mjs';
import { getProductivityData } from './productivityTracker.mjs';

export async function generateInsights() {
    try {
        // Get all relevant data
        const [weatherHistory, productivityHistory] = await Promise.all([
            getStoredData('weatherHistory') || [],
            getStoredData('productivityHistory') || []
        ]);
        
        const currentWeather = await getCurrentWeather();
        const currentProductivity = await getProductivityData();

        // Generate insights in parallel
        const [timeInsights, weatherInsights, currentTips] = await Promise.all([
            generateTimeBasedInsights(productivityHistory),
            generateWeatherBasedInsights(weatherHistory, productivityHistory),
            generateCurrentTips(currentWeather, currentProductivity)
        ]);

        return {
            timeInsights,
            weatherInsights,
            currentTips,
            lastUpdated: new Date().toLocaleTimeString()
        };
    } catch (error) {
        console.error('Error generating insights:', error);
        return {
            timeInsights: ["Could not generate time insights"],
            weatherInsights: ["Could not generate weather insights"],
            currentTips: ["Could not generate current tips"],
            lastUpdated: new Date().toLocaleTimeString()
        };
    }
}

function generateTimeBasedInsights(productivityData) {
    if (!productivityData || productivityData.length < 3) {
        return ["Collect more data for time-based insights"];
    }
    
    const byHour = Array(24).fill().map(() => ({ focused: 0, distracted: 0 }));
    
    productivityData.forEach(entry => {
        if (!entry || !entry.timestamp) return;
        const hour = new Date(entry.timestamp).getHours();
        byHour[hour].focused += entry.focusedTime || 0;
        byHour[hour].distracted += entry.distractedTime || 0;
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
    if (!weatherData || !productivityData || weatherData.length < 5 || productivityData.length < 5) {
        return ["Collect more data for weather insights"];
    }

    const conditionsMap = {};
    const minDataPoints = 3;
    
    // Group productivity by weather conditions
    for (let i = 0; i < Math.min(weatherData.length, productivityData.length); i++) {
        const weather = weatherData[i];
        const productivity = productivityData[i];
        if (!weather || !productivity || !weather.conditions) continue;
        
        const condition = weather.conditions.toLowerCase();
        if (!conditionsMap[condition]) {
            conditionsMap[condition] = {
                focused: 0,
                distracted: 0,
                count: 0
            };
        }
        
        conditionsMap[condition].focused += productivity.focusedTime || 0;
        conditionsMap[condition].distracted += productivity.distractedTime || 0;
        conditionsMap[condition].count++;
    }

    const insights = [];
    
    // Generate insights for each weather condition
    for (const [condition, data] of Object.entries(conditionsMap)) {
        if (data.count < minDataPoints) continue;
        
        const total = data.focused + data.distracted;
        if (total === 0) continue;
        
        const score = (data.focused / total) * 100;
        
        if (score > 75) {
            insights.push(`You're very productive during ${condition} weather (${Math.round(score)}% focus)`);
        } else if (score < 50) {
            insights.push(`You struggle to focus during ${condition} weather (${Math.round(score)}% focus)`);
        }
    }

    return insights.length > 0 ? insights : ["No weather patterns detected yet"];
}

function generateCurrentTips(currentWeather, currentProductivity) {
    const tips = [];
    const now = new Date();
    const hour = now.getHours();

    // Time-based tips
    if (hour < 7) {
        tips.push("Early morning is great for undisturbed deep work");
    } else if (hour < 12) {
        tips.push("Morning hours are ideal for tackling important tasks");
    } else if (hour >= 12 && hour < 14) {
        tips.push("Consider a short walk after lunch to boost afternoon productivity");
    } else if (hour >= 14 && hour < 17) {
        tips.push("Afternoons work well for meetings and collaborative tasks");
    } else {
        tips.push("Evenings might be better for creative thinking and planning");
    }

    // Weather-based tips
    if (currentWeather) {
        const temp = currentWeather.temp;
        const condition = (currentWeather.conditions || '').toLowerCase();

        if (temp > 25) {
            tips.push("It's warm - stay hydrated and consider working in shorter bursts");
        } else if (temp < 15) {
            tips.push("It's cool - keep your workspace warm for better comfort");
        }

        if (condition.includes('rain') || condition.includes('cloud')) {
            tips.push("Overcast conditions can be excellent for maintaining focus");
        } else if (condition.includes('sun') || condition.includes('clear')) {
            tips.push("Consider adjusting your lighting to reduce glare from bright conditions");
        }
    }

    // Productivity-based tips
    if (currentProductivity) {
        const score = currentProductivity.productivityScore || 50;
        const focusRatio = (currentProductivity.focusedTime || 0) / 
                         ((currentProductivity.focusedTime || 0) + 
                          (currentProductivity.distractedTime || 1));

        if (focusRatio < 0.4) {
            tips.push("Try the 25-minute focus technique to improve concentration");
        } else if (focusRatio > 0.75) {
            tips.push("You're in flow state! Minimize interruptions to maintain focus");
        }
    }

    return tips.length > 0 ? tips : ["No specific recommendations right now. Trust your instincts!"];
}

function formatHour(hour) {
    return hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`;
}

export function displayInsights(insights) {
    //const insightsContainer = document.getElementById('insights-container');
    const app = document.getElementById('app');
    
    if (!app) {
        console.error('Insights container not found - creating one');
        const newContainer = document.createElement('div');
        newContainer.id = 'insights-container';
        document.body.appendChild(newContainer);
        return displayInsights(insights); // Try again
    }

    // Ensure we have valid insights data
    const safeInsights = {
        timeInsights: insights?.timeInsights || ["No time insights available"],
        weatherInsights: insights?.weatherInsights || ["No weather insights available"],
        currentTips: insights?.currentTips || ["No current tips available"],
        lastUpdated: insights?.lastUpdated || new Date().toLocaleTimeString()
    };

    app.innerHTML = `
        <div class="insights-card">
            <div class="insights-section">
                <h3><i class="icon-clock">⏱</i> Time Patterns</h3>
                <ul>
                    ${safeInsights.timeInsights.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
            <div class="insights-section">
                <h3><i class="icon-cloud">🌤</i> Weather Patterns</h3>
                <ul>
                    ${safeInsights.weatherInsights.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
            <div class="insights-section">
                <h3><i class="icon-bulb">💡</i> Current Tips</h3>
                <ul>
                    ${safeInsights.currentTips.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
            <div class="insights-footer">
                <small>Last updated: ${safeInsights.lastUpdated}</small>
            </div>
        </div>
    `;
}