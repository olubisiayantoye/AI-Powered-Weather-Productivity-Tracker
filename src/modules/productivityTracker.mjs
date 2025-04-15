import { displayProductivityData } from './dashboardView.mjs';
import { storeProductivityData } from './utils.mjs';

const ACTIVITY_WATCH_API = 'http://localhost:5600/api/0/';
let currentProductivity = null;

// Enhanced app categorization
const APP_CATEGORIES = {
    productive: [
        'code', 'vscode', 'visual studio code', 'pycharm', 'webstorm',
        'sublime', 'atom', 'terminal', 'cmd', 'powershell', 'notepad++',
        'intellij', 'eclipse', 'xcode', 'android studio'
    ],
    distracting: [
        'youtube', 'facebook', 'twitter', 'reddit', 'instagram',
        'netflix', 'game', 'discord', 'twitch', 'tiktok', 'prime video',
        'spotify', 'steam', 'minecraft', 'whatsapp'
    ],
    neutral: [
        'chrome', 'firefox', 'edge', 'safari', 'explorer',
        'notepad', 'wordpad', 'calculator', 'mail', 'calendar'
    ]
};

export async function initProductivityTracker() {
    try {
        const buckets = await fetchBuckets();
        const windowEvents = await fetchWindowEvents(buckets);
        currentProductivity = calculateProductivity(windowEvents);
        console.log("checking souce:", currentProductivity);
        displayProductivityData(currentProductivity);
        storeProductivityData(currentProductivity);
    } catch (error) {
        console.error("ActivityWatch error:", error);
        currentProductivity = getMockProductivityData();
        displayProductivityData(currentProductivity);
    }
}

function calculateProductivity(events) {
    let focusedMinutes = 0;
    let distractedMinutes = 0;
    const appUsage = {};

    events.forEach(event => {
        const appName = cleanAppName(event.data?.app || 'unknown');
        const durationMinutes = event.duration / 60000; // ms to minutes
        
        // Track all app usage
        appUsage[appName] = (appUsage[appName] || 0) + durationMinutes;
        
        // Categorize time
        if (isProductiveApp(appName)) {
            focusedMinutes += durationMinutes;
        } else if (isDistractingApp(appName)) {
            distractedMinutes += durationMinutes;
        }
    });

    // Get top 3 apps by usage time
    const topApps = Object.entries(appUsage)
        .filter(([app]) => !isNeutralApp(app)) // Exclude neutral apps
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([app]) => app);

    // Calculate productivity score
    const totalTrackedTime = focusedMinutes + distractedMinutes;
    const productivityScore = totalTrackedTime > 0
        ? Math.round((focusedMinutes / totalTrackedTime) * 100)
        : 0;

    return {
        focusedTime: Math.round(focusedMinutes),
        distractedTime: Math.round(distractedMinutes),
        appsUsed: topApps.length ? topApps : getDefaultTopApps(appUsage),
        productivityScore,
        timestamp: Date.now()
    };
}

// Helper functions
function cleanAppName(name) {
    return name.toLowerCase()
        .replace('.exe', '')
        .replace('.app', '')
        .trim();
}

function isProductiveApp(appName) {
    return APP_CATEGORIES.productive.some(prodApp => 
        appName.includes(prodApp)
    );
}

function isDistractingApp(appName) {
    return APP_CATEGORIES.distracting.some(distApp => 
        appName.includes(distApp)
    );
}

function isNeutralApp(appName) {
    return APP_CATEGORIES.neutral.some(neutralApp => 
        appName.includes(neutralApp)
    );
}

function getDefaultTopApps(appUsage) {
    // Fallback if all apps are neutral
    return Object.entries(appUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([app]) => app);
}



async function fetchBuckets() {
    const response = await fetch(`${ACTIVITY_WATCH_API}buckets`);
    if (!response.ok) throw new Error('Failed to fetch buckets');
    return await response.json();
}

async function fetchWindowEvents(buckets) {
    const windowBucket = Object.keys(buckets).find(key => 
        buckets[key].type === 'currentwindow'
    );
    if (!windowBucket) throw new Error('No window bucket found');
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000).toISOString();
    const response = await fetch(
        `${ACTIVITY_WATCH_API}buckets/${windowBucket}/events?start=${yesterday}`
    );
    if (!response.ok) throw new Error('Failed to fetch window events');
    return await response.json();
}


export function getProductivityData() {
    return currentProductivity || getMockProductivityData();
}

function getMockProductivityData() {
    return {
        focusedTime: 180, // 3 hours
        distractedTime: 45, // 45 minutes
        appsUsed: ['chrome', 'code', 'notepad'],
        productivityScore: 80,
        timestamp: Date.now()
    };
}