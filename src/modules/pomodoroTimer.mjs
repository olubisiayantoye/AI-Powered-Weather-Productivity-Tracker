import { displayProductivityData } from './dashboardView.mjs';
import { storePomodoroSession } from './utils.mjs';
import { generateAISuggestions } from './aiAnalyzer.mjs';

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;
const CYCLES_BEFORE_LONG_BREAK = 4;

let timer;
let isRunning = false;
let currentCycle = 0;
let remainingTime = POMODORO_DURATION;
let currentPhase = 'work';

export function initPomodoroTimer() {
    // Ensure DOM elements exist before setting up
    if (!document.getElementById('timer-display')) {
        renderPomodoroUI();
    }
    setupEventListeners();
    updateTimerDisplay();
}

function renderPomodoroUI() {
    const pomodoroHTML = `
        <div class="pomodoro-container">
            <div class="pomodoro-display">
                <div id="timer-display">25:00</div>
                <div class="pomodoro-controls">
                    <button id="start-pomodoro">Start</button>
                    <button id="pause-pomodoro">Pause</button>
                    <button id="reset-pomodoro">Reset</button>
                </div>
                <div class="pomodoro-info">
                    <p>Cycle: <span id="cycle-count">0</span>/${CYCLES_BEFORE_LONG_BREAK}</p>
                    <p>Status: <span id="pomodoro-status">Ready</span></p>
                </div>
            </div>
            <div class="pomodoro-suggestions">
                <h3>AI Suggestions</h3>
                <div id="pomodoro-suggestions-content">
                    <p>Start a Pomodoro session to get suggestions</p>
                </div>
            </div>
        </div>
    `;
    
    // Insert into main app container
    const app = document.getElementById('app');
    if (app) {
        app.insertAdjacentHTML('beforeend', pomodoroHTML);
    }
}

function setupEventListeners() {
    document.getElementById('start-pomodoro')?.addEventListener('click', startTimer);
    document.getElementById('pause-pomodoro')?.addEventListener('click', pauseTimer);
    document.getElementById('reset-pomodoro')?.addEventListener('click', resetTimer);
}

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    updateStatusDisplay();
    
    timer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        if (remainingTime <= 0) {
            completePhase();
        }
    }, 1000);
    
    generatePomodoroSuggestions();
}

function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isRunning = false;
    updateStatusDisplay('Paused');
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    currentCycle = 0;
    remainingTime = POMODORO_DURATION;
    currentPhase = 'work';
    updateTimerDisplay();
    updateStatusDisplay('Ready');
    updateCycleDisplay();
}

function completePhase() {
    clearInterval(timer);
    isRunning = false;
    
    // Show notification if allowed
    showCompletionNotification();
    
    // Store completed work session
    if (currentPhase === 'work') {
        storeCompletedSession();
        currentCycle++;
    }
    
    // Move to next phase
    setNextPhase();
    
    // Update displays
    updateTimerDisplay();
    updateStatusDisplay('Ready');
    updateCycleDisplay();
    
    // Generate new suggestions
    generatePomodoroSuggestions();
}

function setNextPhase() {
    if (currentPhase === 'work') {
        remainingTime = (currentCycle % CYCLES_BEFORE_LONG_BREAK === 0) 
            ? LONG_BREAK_DURATION 
            : SHORT_BREAK_DURATION;
        currentPhase = 'break';
    } else {
        remainingTime = POMODORO_DURATION;
        currentPhase = 'work';
    }
}

function storeCompletedSession() {
    storePomodoroSession({
        timestamp: Date.now(),
        duration: POMODORO_DURATION,
        completed: true,
        cycle: currentCycle
    });
}

function showCompletionNotification() {
    if (!('Notification' in window)) return;
    
    const message = currentPhase === 'work' 
        ? 'Pomodoro completed! Time for a break.' 
        : 'Break is over! Ready for next session.';
    
    if (Notification.permission === 'granted') {
        new Notification(message);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(message);
            }
        });
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;
    
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateStatusDisplay(status) {
    const statusDisplay = document.getElementById('pomodoro-status');
    if (!statusDisplay) return;
    
    statusDisplay.textContent = status || (currentPhase === 'work' ? 'Focusing' : 'On Break');
}

function updateCycleDisplay() {
    const cycleDisplay = document.getElementById('cycle-count');
    if (!cycleDisplay) return;
    
    cycleDisplay.textContent = currentCycle;
}

async function generatePomodoroSuggestions() {
    const suggestionsContainer = document.getElementById('pomodoro-suggestions-content');
    if (!suggestionsContainer) return;
    
    try {
        const weather = await getCurrentWeather();
        const productivity = await getProductivityData();
        
        const { suggestions } = await generateAISuggestions({
            weather,
            productivity,
            phase: currentPhase,
            cycle: currentCycle,
            timestamp: Date.now()
        });
        
        suggestionsContainer.innerHTML = `
            <ul>
                ${suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
        `;
    } catch (error) {
        console.error("Error generating suggestions:", error);
        suggestionsContainer.innerHTML = `<p>Suggestions unavailable</p>`;
    }
}

// Mock functions if not imported
async function getCurrentWeather() {
    return { temp: 20, conditions: 'Clear' };
}

async function getProductivityData() {
    return { productivityScore: 75, focusedTime: 120 };
}