import { getProductivityData } from './productivityTracker.mjs';
import { getCurrentWeather } from './weatherTracker.mjs';
import { generateAISuggestions } from './aiAnalyzer.mjs';

// Task categories for contextual suggestions
const TASK_CATEGORIES = {
  focus: ['Deep work session', 'Code review', 'Write documentation'],
  creative: ['Brainstorm ideas', 'Design mockups', 'Plan project'],
  admin: ['Reply to emails', 'Organize files', 'Schedule meetings'],
  break: ['Take a walk', 'Meditate', 'Hydrate']
};

export function initTodoManager() {
    renderTodoUI();
    loadTodos();
    setupEventListeners();
}

function renderTodoUI() {
    const html = `
        <div class="todo-container">
            <h2>Smart To-Do List</h2>
            <div class="todo-input">
                <input type="text" id="new-todo" placeholder="Add a task...">
                <button id="add-todo">Add</button>
                <button id="ai-suggest">Get Smart Suggestions</button>
            </div>
            <div class="suggestion-filters">
                <select id="task-category">
                    <option value="auto">Auto-suggest</option>
                    <option value="focus">Focus Tasks</option>
                    <option value="creative">Creative Work</option>
                    <option value="admin">Administrative</option>
                    <option value="break">Break Activities</option>
                </select>
            </div>
            <ul id="todo-list"></ul>
            <div class="todo-stats">
                <p>Completed: <span id="completed-count">0</span>/<span id="total-count">0</span></p>
            </div>
        </div>
    `;
    document.getElementById('app').insertAdjacentHTML('beforeend', html);
}

async function suggestAITasks() {
    const category = document.getElementById('task-category').value;
    const weather = await getCurrentWeather();
    const productivity = await getProductivityData();
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    // Build context with existing tasks
    const context = {
        weather: {
            conditions: weather?.conditions || 'unknown',
            temp: weather?.temp || 20
        },
        productivity: {
            score: productivity?.productivityScore || 50,
            focusedTime: productivity?.focusedTime || 0,
            currentTasks: todos.map(t => t.text)
        },
        time: new Date().toLocaleTimeString(),
        preferredCategory: category !== 'auto' ? category : null
    };

    try {
        let suggestions;
        
        if (category !== 'auto') {
            // Use predefined categories for consistent suggestions
            suggestions = TASK_CATEGORIES[category] || [];
        } else {
            // Get AI suggestions with context about existing tasks
            const result = await generateAISuggestions(context);
            suggestions = result.suggestions;
            
            // Filter out tasks already in the list
            suggestions = suggestions.filter(suggestion => 
                !todos.some(todo => 
                    todo.text.toLowerCase().includes(suggestion.toLowerCase())
                )
            );
        }

        if (suggestions.length > 0) {
            showAISuggestions(suggestions);
        } else {
            alert("No new suggestions available. Try a different category.");
        }
    } catch (error) {
        console.error("AI suggestion failed:", error);
        // Fallback to category-based suggestions
        const fallbackCategory = category === 'auto' ? 'focus' : category;
        showAISuggestions(TASK_CATEGORIES[fallbackCategory] || []);
    }
}

// Enhanced suggestion display with task type icons
function showAISuggestions(suggestions) {
    const modal = document.createElement('div');
    modal.className = 'ai-suggest-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="icon-bulb"></i> Suggested Tasks</h3>
            <ul class="suggestion-list">
                ${suggestions.map((suggestion, index) => `
                    <li>
                        <input type="checkbox" id="suggestion-${index}">
                        <label for="suggestion-${index}">
                            <span class="task-text">${suggestion}</span>
                        </label>
                    </li>
                `).join('')}
            </ul>
            <div class="modal-actions">
                <button id="add-suggestions">Add Selected</button>
                <button id="close-modal">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal handler
    modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());

    // Add selected tasks handler
    modal.querySelector('#add-suggestions').addEventListener('click', () => {
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const text = checkbox.nextElementSibling.querySelector('.task-text').textContent;
                if (!todos.some(todo => todo.text === text)) {
                    todos.push({ text, completed: false });
                }
            }
        });

        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodoList(todos);
        modal.remove();
    });
}

// ... (keep existing loadTodos, renderTodoList, setupEventListeners, 
// addTodo, and handleTodoActions functions unchanged)


















































// In todoManager.mjs





async function loadTodos() {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    renderTodoList(todos);
}

function renderTodoList(todos) {
    const list = document.getElementById('todo-list');
    list.innerHTML = todos.map((todo, index) => `
        <li class="${todo.completed ? 'completed' : ''}">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${index}">
            <span>${todo.text}</span>
            <button class="delete-btn" data-id="${index}">×</button>
        </li>
    `).join('');
    
    document.getElementById('completed-count').textContent = 
        todos.filter(t => t.completed).length;
    document.getElementById('total-count').textContent = todos.length;
}

function setupEventListeners() {
    document.getElementById('add-todo').addEventListener('click', addTodo);
    document.getElementById('new-todo').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    document.getElementById('ai-suggest').addEventListener('click', suggestAITasks);
    document.getElementById('todo-list').addEventListener('click', handleTodoActions);
}

async function addTodo() {
    const input = document.getElementById('new-todo');
    const text = input.value.trim();
    if (!text) return;
    
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos.push({ text, completed: false });
    localStorage.setItem('todos', JSON.stringify(todos));
    
    input.value = '';
    renderTodoList(todos);
}

function handleTodoActions(e) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    
    if (e.target.matches('input[type="checkbox"]')) {
        const id = parseInt(e.target.dataset.id);
        todos[id].completed = e.target.checked;
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodoList(todos);
    }
    
    if (e.target.matches('.delete-btn')) {
        const id = parseInt(e.target.dataset.id);
        todos.splice(id, 1);
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodoList(todos);
    }
}


