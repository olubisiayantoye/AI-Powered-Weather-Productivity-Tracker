// In todoManager.mjs
import { getProductivityData } from './productivityTracker.mjs';
import { getCurrentWeather } from './weatherTracker.mjs';
import { generateAISuggestions } from './aiAnalyzer.mjs';

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
                <button id="ai-suggest">AI Suggest Tasks</button>
            </div>
            <ul id="todo-list"></ul>
            <div class="todo-stats">
                <p>Completed: <span id="completed-count">0</span>/<span id="total-count">0</span></p>
            </div>
        </div>
    `;
    document.getElementById('app').insertAdjacentHTML('beforeend', html);
}

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

async function suggestAITasks() {
    const weather = getCurrentWeather();
    const productivity = getProductivityData();
    
    const context = {
        weather: {
            conditions: weather?.conditions || 'unknown',
            temp: weather?.temp || 20
        },
        productivity: {
            score: productivity?.productivityScore || 50,
            focusedTime: productivity?.focusedTime || 0
        },
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
    };
    
    try {
        const { suggestions } = await generateAISuggestions(context);
        showAISuggestions(suggestions);
    } catch (error) {
        alert("AI suggestions unavailable. Using fallback suggestions.");
        const { suggestions } = generateLocalSuggestions(context);
        showAISuggestions(suggestions);
    }
}

function showAISuggestions(suggestions) {
    const modal = document.createElement('div');
    modal.className = 'ai-suggest-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>AI Task Suggestions</h3>
            <ul>
                ${suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
            <div class="modal-actions">
                <button id="add-suggestions">Add Selected</button>
                <button id="close-modal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('#close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#add-suggestions').addEventListener('click', () => {
        const selected = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
            .map(el => el.parentElement.textContent.trim());
        
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        selected.forEach(text => {
            if (!todos.some(t => t.text === text)) {
                todos.push({ text, completed: false });
            }
        });
        
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodoList(todos);
        modal.remove();
    });
    
    // Add checkboxes to each suggestion
    modal.querySelectorAll('li').forEach(li => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        li.prepend(checkbox);
    });
}