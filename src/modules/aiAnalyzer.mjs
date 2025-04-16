import { getStoredData } from './utils.mjs';

// API Configuration
const AI_CONFIG = {
  cohere: {
    apiKey: import.meta.env.VITE_COHERE_API_KEY,
    endpoint: "https://api.cohere.ai/v1/generate",
    model: "command"
  },
  huggingface: {
    apiKey: import.meta.env.VITE_HF_API_KEY,
    endpoint: "https://api-inference.huggingface.co/models/gpt2"
  }
};

// Main Exports
export async function generateInsights() {
  try {
    const [weatherData, productivityData] = await Promise.all([
      getStoredData('weatherHistory') || [],
      getStoredData('productivityHistory') || []
    ]);

    if (weatherData.length < 3 || productivityData.length < 3) {
      return insufficientDataResponse();
    }

    return formatInsights(
      findCorrelations(weatherData, productivityData)
    );
  } catch (error) {
    console.error("Insight generation failed:", error);
    return fallbackResponse("Error generating insights");
  }
}

export async function analyzePomodoroSessions() {
  try {
    const [pomodoroData, weatherData] = await Promise.all([
      getStoredData('pomodoroHistory') || [],
      getStoredData('weatherHistory') || []
    ]);

    if (!pomodoroData.length) {
      return { 
        message: "Complete Pomodoro sessions to get analysis", 
        patterns: [] 
      };
    }

    const patterns = findPomodoroPatterns(pomodoroData, weatherData);
    return {
      message: patterns.length 
        ? "We found patterns in your Pomodoro sessions" 
        : "Keep using Pomodoros to discover patterns",
      patterns
    };
  } catch (error) {
    console.error("Pomodoro analysis failed:", error);
    return fallbackResponse("Error analyzing Pomodoro sessions");
  }
}

export async function generateAISuggestions(context) {
  try {
    // Validate context structure
    if (!context?.weather || !context?.productivity) {
      throw new Error("Invalid context format");
    }

    // Try APIs in order of preference
    if (AI_CONFIG.cohere.apiKey) {
      return await callAIAPI('cohere', context);
    }
    if (AI_CONFIG.huggingface.apiKey) {
      return await callAIAPI('huggingface', context);
    }
    return generateLocalSuggestions(context);
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return generateLocalSuggestions(context);
  }
}

// API Communication
async function callAIAPI(provider, context) {
  const config = AI_CONFIG[provider];
  if (!config?.apiKey) throw new Error(`${provider} API not configured`);

  const payload = provider === 'cohere'
    ? buildCoherePayload(context)
    : buildHuggingFacePayload(context);

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(provider === 'cohere' ? {
      ...payload,
      max_tokens: 100,
      temperature: 0.7
    } : payload)
  });

  if (!response.ok) {
    throw new Error(`${provider} API request failed: ${response.status}`);
  }

  const data = await response.json();
  return parseAISuggestions(
    provider === 'cohere' ? data.generations[0].text : data[0].generated_text
  );
}

// Data Processing
function findCorrelations(weather = [], productivity = []) {
  const validPairs = weather
    .map((w, i) => ({ weather: w, productivity: productivity[i] }))
    .filter(pair => pair.weather && pair.productivity);

  if (validPairs.length < 3) return [];

  const correlations = [
    ...analyzeTemperaturePatterns(validPairs),
    ...analyzeConditionPatterns(validPairs),
    ...analyzeTimePatterns(validPairs)
  ];

  return correlations.length ? correlations : ["No strong correlations found"];
}

function analyzeTemperaturePatterns(data) {
  const groups = {
    'cold (<10°C)': { sum: 0, count: 0 },
    'cool (10-20°C)': { sum: 0, count: 0 },
    'warm (20-30°C)': { sum: 0, count: 0 },
    'hot (>30°C)': { sum: 0, count: 0 }
  };

  data.forEach(({ weather, productivity }) => {
    const temp = weather.temp;
    if (temp < 10) updateGroup(groups['cold (<10°C)'], productivity);
    else if (temp <= 20) updateGroup(groups['cool (10-20°C)'], productivity);
    else if (temp <= 30) updateGroup(groups['warm (20-30°C)'], productivity);
    else updateGroup(groups['hot (>30°C)'], productivity);
  });

  return Object.entries(groups)
    .filter(([_, { count }]) => count >= 3)
    .map(([range, { sum, count }]) => {
      const avg = Math.round(sum / count);
      return avg > 75 ? `High productivity (${avg}%) at ${range}`
           : avg < 50 ? `Low productivity (${avg}%) at ${range}`
           : null;
    })
    .filter(Boolean);
}

// Helper Functions
function updateGroup(group, { productivityScore = 0 }) {
  group.sum += productivityScore;
  group.count++;
}

function buildCoherePayload(context) {
  return {
    prompt: `Give 3 productivity suggestions based on:
- Current weather: ${context.weather.conditions} (${context.weather.temp}°C)
- Recent productivity: ${context.productivity.score}/100
- Focus duration: ${context.productivity.focusedTime} minutes
Suggestions:`,
    model: AI_CONFIG.cohere.model
  };
}

function buildHuggingFacePayload(context) {
  return {
    inputs: `Provide 3 concise tips for ${context.timeOfDay} work during ${context.weather.conditions} weather:`
  };
}

function insufficientDataResponse() {
  return {
    message: "Collect more data to generate insights",
    tips: ["Use the app for a few days to see patterns"],
    correlations: []
  };
}

function fallbackResponse(message) {
  return {
    message,
    tips: ["Try refreshing your data", "Check your network connection"],
    correlations: []
  };
}

// ... (keep existing groupDataByCondition, groupDataByTime, 
// findPomodoroPatterns, and other utility functions)


























// Helper functions


function findPomodoroPatterns(pomodoroData, weatherData) {
    const patterns = [];
    const byWeather = {};
    const byHour = {};
    
    pomodoroData.forEach(session => {
        // Group by weather
        const weather = findClosestWeather(session.timestamp, weatherData);
        if (weather) {
            const condition = weather.conditions.toLowerCase();
            byWeather[condition] = byWeather[condition] || [];
            byWeather[condition].push(session);
        }
        
        // Group by time of day
        const hour = new Date(session.timestamp).getHours();
        const timeGroup = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        byHour[timeGroup] = byHour[timeGroup] || [];
        byHour[timeGroup].push(session);
    });
    
    // Weather patterns
    for (const [condition, sessions] of Object.entries(byWeather)) {
        if (sessions.length >= 5) {
            const completionRate = calculateAverage(sessions, 'completed');
            if (completionRate > 0.8) {
                patterns.push(`You complete ${Math.round(completionRate * 100)}% of Pomodoros during ${condition} weather`);
            } else if (completionRate < 0.5) {
                patterns.push(`Only ${Math.round(completionRate * 100)}% Pomodoro completion during ${condition} weather`);
            }
        }
    }
    
    // Time patterns
    for (const [time, sessions] of Object.entries(byHour)) {
        if (sessions.length >= 5) {
            const completionRate = calculateAverage(sessions, 'completed');
            if (completionRate > 0.8 || completionRate < 0.5) {
                patterns.push(`${Math.round(completionRate * 100)}% completion rate in the ${time}`);
            }
        }
    }
    
    return patterns;
}

function groupDataByTemperature(weather, productivity) {
    const groups = {
        'cold (<10°C)': [],
        'cool (10-20°C)': [],
        'warm (20-30°C)': [],
        'hot (>30°C)': []
    };
    
    weather.forEach((w, i) => {
        const prod = productivity[i];
        if (!w || !prod) return;
        
        if (w.temp < 10) groups['cold (<10°C)'].push(prod);
        else if (w.temp <= 20) groups['cool (10-20°C)'].push(prod);
        else if (w.temp <= 30) groups['warm (20-30°C)'].push(prod);
        else groups['hot (>30°C)'].push(prod);
    });
    
    return groups;
}

function groupDataByCondition(weather, productivity) {
    const groups = {};
    
    weather.forEach((w, i) => {
        const prod = productivity[i];
        if (!w || !prod) return;
        
        const condition = w.conditions.toLowerCase();
        groups[condition] = groups[condition] || [];
        groups[condition].push(prod);
    });
    
    return groups;
}

function groupDataByTime(productivity) {
    const groups = {
        'morning (5-12)': [],
        'afternoon (12-17)': [],
        'evening (17-24)': []
    };
    
    productivity.forEach(prod => {
        if (!prod.timestamp) return;
        const hour = new Date(prod.timestamp).getHours();
        
        if (hour >= 5 && hour < 12) groups['morning (5-12)'].push(prod);
        else if (hour >= 12 && hour < 17) groups['afternoon (12-17)'].push(prod);
        else groups['evening (17-24)'].push(prod);
    });
    
    return groups;
}

function findClosestWeather(timestamp, weatherData) {
    if (!weatherData.length) return null;
    return weatherData.reduce((closest, current) => {
        const closestDiff = Math.abs(closest.timestamp - timestamp);
        const currentDiff = Math.abs(current.timestamp - timestamp);
        return currentDiff < closestDiff ? current : closest;
    });
}

function calculateAverage(data, key) {
    const sum = data.reduce((total, item) => total + (item[key] ? 1 : 0), 0);
    return sum / data.length;
}

function formatInsights(correlations) {
    const tips = [];
    
    if (correlations.some(c => c.includes('Higher productivity') && c.includes('cool'))) {
        tips.push("Consider working during cooler parts of the day");
    }
    
    if (correlations.some(c => c.includes('drops') && c.includes('Rain'))) {
        tips.push("On rainy days, try focus techniques like Pomodoro");
    }
    
    if (correlations.some(c => c.includes('peaks') && c.includes('morning'))) {
        tips.push("Schedule important tasks for your productive morning hours");
    }
    
    return {
        message: correlations.length > 0 
            ? "We've found some interesting patterns" 
            : "Keep using the app to discover patterns",
        correlations,
        tips: tips.length > 0 ? tips : [
            "Take regular breaks to maintain focus",
            "Stay hydrated for better concentration"
        ]
    };
}

async function generateWithCohere(context) {
    const prompt = `Based on this context, provide 3 concise productivity suggestions:
Context: ${JSON.stringify(context, null, 2)}
Suggestions:`;
    
    const response = await fetch("https://api.cohere.ai/v1/generate", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${COHERE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "command",
            prompt,
            max_tokens: 100,
            temperature: 0.7
        })
    });
    
    if (!response.ok) throw new Error("Cohere API failed");
    const data = await response.json();
    return parseAISuggestions(data.generations[0].text);
}

async function generateWithHuggingFace(context) {
    const prompt = `Provide 3 productivity tips based on:
- Weather: ${context.weather.conditions} (${context.weather.temp}°C)
- Time: ${new Date(context.timestamp).toLocaleTimeString()}
- Productivity: ${context.productivity.score}/100
- Focus: ${context.productivity.focusedTime} minutes`;
    
    const response = await fetch(
        "https://api-inference.huggingface.co/models/gpt2",
        {
            method: "POST",
            headers: { "Authorization": `Bearer ${HF_API_KEY}` },
            body: JSON.stringify({ inputs: prompt })
        }
    );
    
    if (!response.ok) throw new Error("Hugging Face API failed");
    const data = await response.json();
    return parseAISuggestions(data[0].generated_text);
}

function generateLocalSuggestions(context) {
    const suggestions = [];
    
    if (context.weather?.temp > 25) {
        suggestions.push("It's warm - stay hydrated and take cooling breaks");
    }
    
    if (context.productivity?.score < 60) {
        suggestions.push("Try the Pomodoro technique (25min work, 5min break)");
    }
    
    if (context.productivity?.focusedTime > 180) {
        suggestions.push("You've been focused for 3+ hours - consider a longer break");
    }
    
    return {
        source: "local-heuristics",
        suggestions: suggestions.length > 0 ? suggestions : [
            "Start with your most important task first",
            "Remove distractions for better focus",
            "Take a short walk to refresh your mind"
        ]
    };
}

function parseAISuggestions(text) {
    return {
        source: "ai",
        suggestions: text.split('\n')
            .map(line => line.replace(/^[\d\-•]+/, '').trim())
            .filter(line => line.length > 10)
            .slice(0, 3)
    };
}