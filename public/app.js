// MASTERCODE Business Manager - JavaScript Application

const API_URL = 'http://localhost:3000/api';

// Global data
let allData = {
    clients: [],
    projects: [],
    income: [],
    expenses: [],
    tasks: [],
    leads: [],
    quotes: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupMenuNavigation();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    loadAllData();
});

// Menu Navigation
function setupMenuNavigation() {
    const menuButtons = document.querySelectorAll('.menu-btn');
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            switchPage(page);
            
            // Update active button
            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load page-specific data
        switch(pageName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'clients':
                loadClients();
                break;
            case 'projects':
                loadProjects();
                break;
            case 'finance':
                loadFinance();
                break;
            case 'tasks':
                loadTasks();
                break;
            case 'leads':
                loadLeads();
                break;
            case 'quotes':
                loadQuotes();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    }
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const timeEl = document.getElementById('currentTime');
    if (timeEl) timeEl.textContent = timeStr;
}

// API calls
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        showMessage('שגיאה בטעינת נתונים', 'error');
        return null;
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error('Error posting data:', error);
        showMessage('שגיאה בשמירת נתונים', 'error');
        return null;
    }
}

async function putData(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.error('Error updating data:', error);
        showMessage('שגיאה בעדכון נתונים', 'error');
        return null;
    }
}

async function deleteData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Delete failed');
        }
        return await response.json();
    } catch (error) {
        console.error('Error deleting data:', error);
        showMessage(`❌ ${error.message}`, 'error');
        return null;
    }
}

// Load all data
async function loadAllData() {
    allData.clients = await fetchData('/clients') || [];
    allData.projects = await fetchData('/projects') || [];
    allData.income = await fetchData('/income') || [];
    allData.expenses = await fetchData('/expenses') || [];
    allData.tasks = await fetchData('/tasks') || [];
    allData.leads = await fetchData('/leads') || [];
    allData.quotes = await fetchData('/quotes') || [];
    
    loadDashboard();
}

// Dashboard
async function loadDashboard() {
    const stats = await fetchData('/dashboard');
    if (!stats) return;
    
    document.getElementById('stat-clients').textContent = stats.total_clients;
    document.getElementById('stat-projects').textContent = stats.active_projects;
    document.getElementById('stat-leads').textContent = stats.active_leads;
    document.getElementById('stat-income').textContent = `₪${stats.total_income.toLocaleString()}`;
    document.getElementById('stat-expenses').textContent = `₪${stats.total_expenses.toLocaleString()}`;
    document.getElementById('stat-profit').textContent = `₪${stats.net_profit.toLocaleString()}`;
    
    // Load recent projects
    const projects = await fetchData('/projects');
    const recentProjects = projects.slice(-5).reverse();
    const recentProjectsEl = document.getElementById('recent-projects');
    
    if (recentProjects.length === 0) {
        recentProjectsEl.innerHTML = '<div class="empty-state">אין פרויקטים עדיין</div>';
        return;
    }
    
    recentProjectsEl.innerHTML = recentProjects.map(project => `
        <div class="item">
            <div class="item-header">
                <span class="item-title">
                    ${project.status === 'הושלם' ? '🟢' : '🟡'} ${project.type} - ${project.client_name}
                </span>
                <span class="status-badge ${project.paid ? 'status-completed' : 'status-active'}">
                    ${project.paid ? '✅ שולם' : '⏳ ממתין'}
                </span>
            </div>
            <div class="item-details">
                💰 ₪${project.price.toLocaleString()} • 📅 ${project.date_created}
            </div>
        </div>
    `).join('');
}

// Clients
async function loadClients() {
    allData.clients = await fetchData('/clients') || [];
    const clientsList = document.getElementById('clients-list');
    const clientsCount = document.getElementById('clients-count');
    
    clientsCount.textContent = `(${allData.clients.length})`;
    
    if (allData.clients.length === 0) {
        clientsList.innerHTML = '<div class="empty-state">אין לקוחות עדיין. לחץ על "+ Add Client" להתחלה!</div>';
        return;
    }
    
    clientsList.innerHTML = allData.clients.map(client => `
        <div class="item">
            <div class="item-header">
                <span class="item-title">🆔 ${client.id} | ${client.name}</span>
                <button class="btn btn-danger btn-small" onclick="deleteClient(${client.id})">
                    🗑️ מחק
                </button>
            </div>
            <div class="item-details">
                📞 ${client.phone} • 📧 ${client.email || 'לא צוין'}
            </div>
            <div class="item-stats">
                💰 ₪${client.total_paid.toLocaleString()} • 📊 ${client.projects_count} פרויקטים
            </div>
        </div>
    `).join('');
}

async function deleteClient(clientId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הלקוח? פעולה זו לא ניתנת לביטול!')) return;
    
    const result = await deleteData(`/clients/${clientId}`);
    if (result) {
        showMessage('✅ הלקוח נמחק בהצלחה!', 'success');
        loadClients();
        loadDashboard();
    }
}

async function addClient(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const clientData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        source: formData.get('source')
    };
    
    const result = await postData('/clients', clientData);
    if (result) {
        showMessage('✅ לקוח נוסף בהצלחה!', 'success');
        closeModal();
        form.reset();
        loadClients();
        loadDashboard();
    }
}

// Projects
async function loadProjects() {
    allData.projects = await fetchData('/projects') || [];
    allData.clients = await fetchData('/clients') || [];
    
    const projectsList = document.getElementById('projects-list');
    
    if (allData.projects.length === 0) {
        projectsList.innerHTML = '<div class="empty-state">אין פרויקטים עדיין. לחץ על "+ Add Project" להתחלה!</div>';
        return;
    }
    
    const sortedProjects = allData.projects.sort((a, b) => 
        new Date(b.date_created) - new Date(a.date_created)
    );
    
    // Generate HTML for each project with files section
    const projectsHTML = await Promise.all(sortedProjects.map(async (project) => {
        const files = project.files || [];
        const hasFiles = files.length > 0;
        
        // Create files section if there are files
        const filesSection = hasFiles ? `
            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin-bottom: 10px; color: #2c3e50;">📁 קבצים (${files.length})</h4>
                <div class="files-grid">
                    ${files.map(file => createFileCard(file, project.id)).join('')}
                </div>
            </div>
        ` : '';
        
        // File upload section
        const uploadSection = `
            <div class="upload-area" 
                 onclick="document.getElementById('file-input-${project.id}').click()"
                 ondragover="event.preventDefault(); event.currentTarget.classList.add('dragover')"
                 ondragleave="event.currentTarget.classList.remove('dragover')"
                 ondrop="handleFileDrop(event, ${project.id})">
                <div class="upload-icon">📄</div>
                <div class="upload-text">
                    <h3>גרור קבצים לכאן</h3>
                    <p>או לחץ לבחירת קבצים</p>
                </div>
                <input type="file" 
                       id="file-input-${project.id}" 
                       multiple 
                       onchange="uploadProjectFiles(${project.id}, this.files)"
                       style="display: none;">
            </div>
        `;
        
        return `
            <div class="item" style="margin-bottom: 25px;">
                <div class="item-header">
                    <span class="item-title">
                        ${project.status === 'הושלם' ? '🟢' : '🟡'} #${project.id} - ${project.type}
                    </span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-weight: bold; color: var(--success)">
                            ${project.paid ? '✅' : '⏳'} ₪${project.price.toLocaleString()}
                        </span>
                        <button class="btn btn-danger btn-small" onclick="deleteProject(${project.id})">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="item-details">
                    👤 ${project.client_name} • 📅 ${project.date_created}
                </div>
                ${!project.paid ? `
                    <div class="item-actions">
                        <button class="btn btn-success btn-small" onclick="markProjectPaid(${project.id})">
                            ✓ סמן כשולם
                        </button>
                    </div>
                ` : ''}
                ${filesSection}
                ${uploadSection}
            </div>
        `;
    }));
    
    projectsList.innerHTML = projectsHTML.join('');
}

async function deleteProject(projectId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפרויקט? פעולה זו לא ניתנת לביטול!')) return;
    
    const result = await deleteData(`/projects/${projectId}`);
    if (result) {
        showMessage('✅ הפרויקט נמחק בהצלחה!', 'success');
        loadProjects();
        loadClients();
        loadDashboard();
    }
}

async function markProjectPaid(projectId) {
    if (!confirm('האם לסמן את הפרויקט כשולם?')) return;
    
    const result = await putData(`/projects/${projectId}/paid`, {});
    if (result) {
        showMessage('✅ הפרויקט סומן כשולם!', 'success');
        loadProjects();
        loadDashboard();
    }
}

async function addProject(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const projectData = {
        client_id: parseInt(formData.get('client_id')),
        type: formData.get('type'),
        price: parseFloat(formData.get('price')),
        description: formData.get('description'),
        deadline: formData.get('deadline')
    };
    
    const result = await postData('/projects', projectData);
    if (result) {
        showMessage('✅ פרויקט נוסף בהצלחה!', 'success');
        closeModal();
        form.reset();
        loadProjects();
        loadDashboard();
    }
}

// Finance
async function loadFinance() {
    allData.income = await fetchData('/income') || [];
    allData.expenses = await fetchData('/expenses') || [];
    
    const totalIncome = allData.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = allData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = totalIncome - totalExpenses;
    
    document.getElementById('finance-income').textContent = `₪${totalIncome.toLocaleString()}`;
    document.getElementById('finance-expenses').textContent = `₪${totalExpenses.toLocaleString()}`;
    document.getElementById('finance-profit').textContent = `₪${profit.toLocaleString()}`;
    
    // Income list
    const incomeList = document.getElementById('income-list');
    const recentIncome = allData.income.slice(-10).reverse();
    
    if (recentIncome.length === 0) {
        incomeList.innerHTML = '<div class="empty-state">אין הכנסות עדיין</div>';
    } else {
        incomeList.innerHTML = recentIncome.map(income => `
            <div class="item">
                <div class="item-header">
                    <span class="item-title">₪${income.amount.toLocaleString()}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 12px; color: var(--text-secondary)">${income.date}</span>
                        <button class="btn btn-danger btn-small" onclick="deleteIncome(${income.id})">🗑️</button>
                    </div>
                </div>
                <div class="item-details">${income.source}</div>
                ${income.category ? `<div style="font-size: 12px; color: var(--text-secondary)">🏷️ ${income.category}</div>` : ''}
            </div>
        `).join('');
    }
    
    // Expenses list
    const expensesList = document.getElementById('expenses-list');
    const recentExpenses = allData.expenses.slice(-10).reverse();
    
    if (recentExpenses.length === 0) {
        expensesList.innerHTML = '<div class="empty-state">אין הוצאות עדיין</div>';
    } else {
        expensesList.innerHTML = recentExpenses.map(expense => `
            <div class="item">
                <div class="item-header">
                    <span class="item-title">₪${expense.amount.toLocaleString()}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="font-size: 12px; color: var(--text-secondary)">${expense.date}</span>
                        <button class="btn btn-danger btn-small" onclick="deleteExpense(${expense.id})">🗑️</button>
                    </div>
                </div>
                <div class="item-details">${expense.description}</div>
                ${expense.category ? `<div style="font-size: 12px; color: var(--text-secondary)">🏷️ ${expense.category}</div>` : ''}
            </div>
        `).join('');
    }
}

async function deleteIncome(incomeId) {
    if (!confirm('האם למחוק את ההכנסה?')) return;
    
    const result = await deleteData(`/income/${incomeId}`);
    if (result) {
        showMessage('✅ ההכנסה נמחקה בהצלחה!', 'success');
        loadFinance();
        loadDashboard();
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('האם למחוק את ההוצאה?')) return;
    
    const result = await deleteData(`/expenses/${expenseId}`);
    if (result) {
        showMessage('✅ ההוצאה נמחקה בהצלחה!', 'success');
        loadFinance();
        loadDashboard();
    }
}

async function addIncome(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const incomeData = {
        amount: parseFloat(formData.get('amount')),
        source: formData.get('source'),
        category: formData.get('category')
    };
    
    const result = await postData('/income', incomeData);
    if (result) {
        showMessage('✅ הכנסה נוספה בהצלחה!', 'success');
        closeModal();
        form.reset();
        loadFinance();
        loadDashboard();
    }
}

async function addExpense(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const expenseData = {
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description'),
        category: formData.get('category')
    };
    
    const result = await postData('/expenses', expenseData);
    if (result) {
        showMessage('✅ הוצאה נוספה בהצלחה!', 'success');
        closeModal();
        form.reset();
        loadFinance();
        loadDashboard();
    }
}

// Tasks
async function loadTasks() {
    allData.tasks = await fetchData('/tasks') || [];
    const tasksList = document.getElementById('tasks-list');
    
    const activeTasks = allData.tasks.filter(t => t.status === 'פתוח');
    
    if (activeTasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state">אין משימות פעילות</div>';
        return;
    }
    
    tasksList.innerHTML = activeTasks.map(task => {
        const priorityIcon = task.priority === 'גבוהה' ? '🔴' : task.priority === 'בינונית' ? '🟡' : '🟢';
        return `
            <div class="item">
                <div class="item-header">
                    <span class="item-title">${priorityIcon} ${task.title}</span>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-success btn-small" onclick="completeTask(${task.id})">
                            ✓ השלם
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteTask(${task.id})">
                            🗑️
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="item-details">${task.description}</div>` : ''}
                ${task.due_date ? `<div style="font-size: 12px; color: var(--warning); margin-top: 5px">⏰ ${task.due_date}</div>` : ''}
            </div>
        `;
    }).join('');
}

async function deleteTask(taskId) {
    if (!confirm('האם למחוק את המשימה?')) return;
    
    const result = await deleteData(`/tasks/${taskId}`);
    if (result) {
        showMessage('✅ המשימה נמחקה בהצלחה!', 'success');
        loadTasks();
        loadDashboard();
    }
}

async function completeTask(taskId) {
    if (!confirm('האם להשלים את המשימה?')) return;
    
    const result = await putData(`/tasks/${taskId}/complete`, {});
    if (result) {
        showMessage('✅ המשימה הושלמה!', 'success');
        loadTasks();
        loadDashboard();
    }
}

async function addTask(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        due_date: formData.get('due_date')
    };
    
    const result = await postData('/tasks', taskData);
    if (result) {
        showMessage('✅ משימה נוספה בהצלחה!', 'success');
        closeModal();
        form.reset();
        loadTasks();
        loadDashboard();
    }
}

// Leads
async function loadLeads() {
    allData.leads = await fetchData('/leads') || [];
    const leadsList = document.getElementById('leads-list');
    
    const activeLeads = allData.leads.filter(l => ['חדש', 'בטיפול'].includes(l.status));
    
    if (activeLeads.length === 0) {
        leadsList.innerHTML = '<div class="empty-state">אין לידים פעילים</div>';
        return;
    }
    
    leadsList.innerHTML = activeLeads.map(lead => {
        const statusIcon = lead.status === 'חדש' ? '🆕' : '📞';
        return `
            <div class="item">
                <div class="item-header">
                    <span class="item-title">${statusIcon} ${lead.name}</span>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-success btn-small" onclick="convertLead(${lead.id})">
                            המר ללקוח
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteLead(${lead.id})">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="item-details">
                    📞 ${lead.phone} • 📧 ${lead.email || 'לא צוין'}
                </div>
                ${lead.interest ? `<div style="font-size: 12px; color: var(--warning); margin-top: 5px">💡 ${lead.interest}</div>` : ''}
                ${lead.notes ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px">📝 ${lead.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

async function deleteLead(leadId) {
    if (!confirm('האם למחוק את הליד?')) return;
    
    const result = await deleteData(`/leads/${leadId}`);
    if (result) {
        showMessage('✅ הליד נמחק בהצלחה!', 'success');
        loadLeads();
        loadDashboard();
    }
}

async function convertLead(leadId) {
    if (!confirm('האם להמיר את הליד ללקוח?')) return;
    
    const result = await postData(`/leads/${leadId}/convert`, {});
    if (result) {
        showMessage('✅ הליד הומר ללקוח בהצלחה!', 'success');
        loadLeads();
        loadClients();
        loadDashboard();
    }
}

async function addLead(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const leadData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        source: formData.get('source'),
        interest: formData.get('interest'),
        notes: formData.get('notes')
    };
    
    const result = await postData('/leads', leadData);
    if (result) {
        showMessage('✅ ליד נוסף בהצלחה!', 'success');
        closeModal();
        form.reset();
        loadLeads();
        loadDashboard();
    }
}

// Settings
async function loadSettings() {
    const settings = await fetchData('/settings');
    if (!settings) return;
    
    const settingsInfo = document.getElementById('settings-info');
    settingsInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">🏢 שם העסק</span>
            <span class="info-value">${settings.business_name}</span>
        </div>
        <div class="info-item">
            <span class="info-label">👤 בעלים</span>
            <span class="info-value">${settings.owner}</span>
        </div>
        <div class="info-item">
            <span class="info-label">📞 טלפון</span>
            <span class="info-value">${settings.phone}</span>
        </div>
        <div class="info-item">
            <span class="info-label">📧 אימייל</span>
            <span class="info-value">${settings.email}</span>
        </div>
    `;
}

async function backupData() {
    const result = await postData('/backup', {});
    if (result) {
        showMessage(`✅ גיבוי נוצר בהצלחה: ${result.filename}`, 'success');
    }
}

// Modal functions
function showAddClientModal() {
    showModal('add-client-modal');
}

async function showAddProjectModal() {
    // Load clients for dropdown
    if (allData.clients.length === 0) {
        showMessage('אין לקוחות! הוסף לקוח קודם', 'error');
        return;
    }
    
    const select = document.getElementById('project-client-select');
    select.innerHTML = '<option value="">בחר לקוח...</option>' +
        allData.clients.map(c => `<option value="${c.id}">${c.id} - ${c.name}</option>`).join('');
    
    showModal('add-project-modal');
}

function showAddIncomeModal() {
    showModal('add-income-modal');
}

function showAddExpenseModal() {
    showModal('add-expense-modal');
}

function showAddTaskModal() {
    showModal('add-task-modal');
}

function showAddLeadModal() {
    showModal('add-lead-modal');
}

function showAddQuoteModal() {
    showModal('add-quote-modal');
}

function addQuoteItem() {
    const container = document.getElementById('quote-items');
    const itemHtml = `
        <div class="quote-item">
            <div class="form-row">
                <div class="form-group">
                    <label>Service Name *</label>
                    <input type="text" name="item_name[]" required>
                </div>
                <div class="form-group">
                    <label>Quantity *</label>
                    <input type="number" name="item_qty[]" value="1" min="1" required>
                </div>
                <div class="form-group">
                    <label>Price (₪) *</label>
                    <input type="number" name="item_price[]" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label>Discount (₪)</label>
                    <input type="number" name="item_discount[]" value="0" step="0.01" min="0">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="item_desc[]" rows="2"></textarea>
            </div>
            <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">Remove</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', itemHtml);
}

function showModal(modalId) {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Quotes
async function loadQuotes() {
    allData.quotes = await fetchData('/quotes') || [];
    const quotesList = document.getElementById('quotes-list');
    
    if (allData.quotes.length === 0) {
        quotesList.innerHTML = '<div class="empty-state">אין הצעות מחיר עדיין</div>';
        return;
    }
    
    const sortedQuotes = allData.quotes.sort((a, b) => 
        new Date(b.date_created) - new Date(a.date_created)
    );
    
    quotesList.innerHTML = sortedQuotes.map(quote => `
        <div class="item">
            <div class="item-header">
                <span class="item-title">💼 ${quote.quote_number}</span>
                <span style="font-weight: bold; color: var(--success)">₪${quote.total.toLocaleString()}</span>
            </div>
            <div class="item-details">
                👤 ${quote.client_name} • 📞 ${quote.client_phone} • 📅 ${quote.date_created}
            </div>
            <div class="item-actions">
                <button class="btn btn-success btn-small" onclick="viewQuote(${quote.id})">
                    👁️ צפה
                </button>
                <button class="btn btn-secondary btn-small" onclick="downloadQuote(${quote.id})">
                    💾 הורד
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteQuote(${quote.id})">
                    🗑️ מחק
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteQuote(quoteId) {
    if (!confirm('האם למחוק את הצעת המחיר? פעולה זו לא ניתנת לביטול!')) return;
    
    const result = await deleteData(`/quotes/${quoteId}`);
    if (result) {
        showMessage('✅ הצעת המחיר נמחקה בהצלחה!', 'success');
        loadQuotes();
    }
}

function viewQuote(quoteId) {
    const quote = allData.quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    const blob = new Blob([quote.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

function downloadQuote(quoteId) {
    const quote = allData.quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    const blob = new Blob([quote.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quote.quote_number}.html`;
    a.click();
}

async function createQuote(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Get client info
    const clientName = formData.get('client_name');
    const clientEmail = formData.get('client_email');
    const clientPhone = formData.get('client_phone');
    const notes = formData.get('notes');
    const validityDays = parseInt(formData.get('validity_days'));
    
    // Get items
    const itemNames = formData.getAll('item_name[]');
    const itemQtys = formData.getAll('item_qty[]');
    const itemPrices = formData.getAll('item_price[]');
    const itemDiscounts = formData.getAll('item_discount[]');
    const itemDescs = formData.getAll('item_desc[]');
    
    const items = itemNames.map((name, i) => ({
        name: name,
        description: itemDescs[i],
        quantity: parseInt(itemQtys[i]),
        price: parseFloat(itemPrices[i]),
        discount: parseFloat(itemDiscounts[i])
    }));
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    const total = subtotal - discount;
    
    // Generate HTML
    const settings = await fetchData('/settings');
    const htmlContent = generateQuoteHTML({
        clientName, clientEmail, clientPhone,
        items, notes, validityDays,
        subtotal, discount, total,
        settings
    });
    
    const quoteData = {
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        items, notes, validity_days: validityDays,
        subtotal, discount, total,
        html_content: htmlContent
    };
    
    const result = await postData('/quotes', quoteData);
    if (result) {
        showMessage('✅ הצעת מחיר נוצרה בהצלחה!', 'success');
        closeModal();
        form.reset();
        loadQuotes();
        
        // Open quote in new window
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
}

function generateQuoteHTML(data) {
    const { clientName, clientEmail, clientPhone, items, notes, validityDays, subtotal, discount, total, settings } = data;
    
    const issueDate = new Date().toLocaleDateString('he-IL');
    const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL');
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19).replace('T', '_');
    const quoteNumber = `QT-${timestamp}`;
    
    const itemsHTML = items.map((item, i) => {
        const itemTotal = item.price * item.quantity;
        const discountHTML = item.discount > 0 ? `<br><small style='color: #e74c3c;'>הנחה: -₪${item.discount.toFixed(2)}</small>` : '';
        return `
            <tr>
                <td style="padding: 15px; text-align: center; border-bottom: 1px solid #ecf0f1;">${i + 1}</td>
                <td style="padding: 15px; border-bottom: 1px solid #ecf0f1;">
                    <strong>${item.name}</strong>
                    ${item.description ? `<br><small style="color: #7f8c8d;">${item.description}</small>` : ''}
                    ${discountHTML}
                </td>
                <td style="padding: 15px; text-align: center; border-bottom: 1px solid #ecf0f1;">${item.quantity}</td>
                <td style="padding: 15px; text-align: center; border-bottom: 1px solid #ecf0f1;">₪${item.price.toFixed(2)}</td>
                <td style="padding: 15px; text-align: center; border-bottom: 1px solid #ecf0f1; font-weight: bold;">₪${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    
    const discountRow = discount > 0 ? `<div class="totals-row discount"><span>הנחה:</span><span>-₪${discount.toFixed(2)}</span></div>` : '';
    const notesSection = notes ? `
        <div class="notes">
            <h3>📝 הערות והבהרות</h3>
            <p>${notes}</p>
        </div>
    ` : '';
    
    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>הצעת מחיר - ${quoteNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .header .subtitle { font-size: 1.2em; opacity: 0.9; }
        .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 40px; background: #f8f9fa; }
        .info-box { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .info-box h3 { color: #667eea; margin-bottom: 15px; font-size: 1.3em; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .info-box p { margin: 8px 0; color: #2c3e50; }
        .info-box strong { color: #34495e; display: inline-block; width: 100px; }
        .quote-details { background: #fff3cd; padding: 20px 40px; display: flex; justify-content: space-between; border-top: 3px solid #ffc107; border-bottom: 3px solid #ffc107; }
        .quote-details div { text-align: center; }
        .quote-details strong { display: block; color: #856404; margin-bottom: 5px; }
        .quote-details span { font-size: 1.2em; color: #212529; font-weight: bold; }
        .items-table { padding: 40px; }
        .items-table h2 { color: #2c3e50; margin-bottom: 20px; font-size: 1.8em; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        thead th { padding: 15px; text-align: center; font-size: 1.1em; }
        tbody tr:hover { background: #f8f9fa; }
        .totals { margin-top: 30px; background: #f8f9fa; padding: 25px; border-radius: 10px; }
        .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 1.1em; }
        .totals-row.subtotal { color: #7f8c8d; }
        .totals-row.discount { color: #e74c3c; }
        .totals-row.total { border-top: 2px solid #667eea; margin-top: 10px; padding-top: 15px; font-size: 1.5em; font-weight: bold; color: #667eea; }
        .notes { padding: 40px; background: #fff9e6; border-top: 3px solid #ffc107; }
        .notes h3 { color: #856404; margin-bottom: 15px; }
        .notes p { color: #212529; line-height: 1.8; white-space: pre-line; }
        .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; }
        .footer p { margin: 5px 0; }
        .footer a { color: #3498db; text-decoration: none; }
        .cta-button { display: inline-block; margin-top: 20px; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 1.1em; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.3s; }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        @media print { body { background: white; padding: 0; } .container { box-shadow: none; } .cta-button { display: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💼 ${settings.business_name}</h1>
            <p class="subtitle">הצעת מחיר מקצועית</p>
        </div>
        <div class="quote-details">
            <div><strong>מספר הצעה:</strong><span>${quoteNumber}</span></div>
            <div><strong>תאריך הנפקה:</strong><span>${issueDate}</span></div>
            <div><strong>תקף עד:</strong><span>${validUntil}</span></div>
        </div>
        <div class="info-section">
            <div class="info-box">
                <h3>📤 ספק השירות</h3>
                <p><strong>שם:</strong> ${settings.business_name}</p>
                <p><strong>טלפון:</strong> ${settings.phone}</p>
                <p><strong>אימייל:</strong> ${settings.email}</p>
                <p><strong>אתר:</strong> <a href="${settings.website}" target="_blank">${settings.website}</a></p>
            </div>
            <div class="info-box">
                <h3>📥 לקוח</h3>
                <p><strong>שם:</strong> ${clientName}</p>
                <p><strong>טלפון:</strong> ${clientPhone}</p>
                <p><strong>אימייל:</strong> ${clientEmail}</p>
            </div>
        </div>
        <div class="items-table">
            <h2>📋 פירוט השירותים</h2>
            <table><thead><tr><th>#</th><th>שירות</th><th>כמות</th><th>מחיר ליחידה</th><th>סה"כ</th></tr></thead><tbody>${itemsHTML}</tbody></table>
            <div class="totals">
                <div class="totals-row subtotal"><span>סכום ביניים:</span><span>₪${subtotal.toFixed(2)}</span></div>
                ${discountRow}
                <div class="totals-row total"><span>סה"כ לתשלום:</span><span>₪${total.toFixed(2)}</span></div>
            </div>
        </div>
        ${notesSection}
        <div class="footer">
            <p><strong>${settings.business_name}</strong></p>
            <p>📞 ${settings.phone} | 📧 ${settings.email}</p>
            <p>🌐 <a href="${settings.website}">${settings.website}</a></p>
            <a href="https://wa.me/972${settings.phone.replace(/[^0-9]/g, '')}?text=היי%20${encodeURIComponent(settings.business_name)},%20אני%20מעוניין%20לאשר%20את%20הצעת%20המחיר%20${quoteNumber}" class="cta-button" target="_blank">💬 אשר הצעת מחיר בוואטסאפ</a>
        </div>
    </div>
</body>
</html>`;
}

// Messages
function showMessage(text, type = 'success') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// AI Chat Functions
function toggleAIChat() {
    const chatWindow = document.getElementById('ai-chat-window');
    chatWindow.classList.toggle('active');
    
    if (chatWindow.classList.contains('active')) {
        document.getElementById('ai-input').focus();
    }
}

function addUserMessage(text) {
    const messagesDiv = document.getElementById('ai-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.innerHTML = `
        <div class="user-avatar">👤</div>
        <div class="user-text">${text}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addAIMessage(text) {
    const messagesDiv = document.getElementById('ai-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message';
    messageDiv.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="ai-text">${text}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('ai-chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="ai-text">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

async function sendAIMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addUserMessage(message);
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        if (data.success) {
            // Format response with line breaks
            const formattedResponse = data.response.replace(/\n/g, '<br>');
            addAIMessage(formattedResponse);
        } else {
            addAIMessage('⚠️ מצטער, נתקלתי בבעיה. נסה שוב.');
        }
    } catch (error) {
        console.error('AI Chat error:', error);
        hideTypingIndicator();
        addAIMessage('❌ שגיאה בחיבור לשרת. נסה שוב מאוחר יותר.');
    }
}

// File Management Functions
function getFileIcon(extension) {
    const icons = {
        '.html': '🌐', '.htm': '🌐',
        '.css': '🎨',
        '.js': '⚡', '.jsx': '⚡',
        '.ts': '📘', '.tsx': '📘',
        '.json': '📋',
        '.py': '🐍',
        '.php': '🐘',
        '.java': '☕',
        '.cpp': '➕', '.c': '©️',
        '.sql': '🗄️',
        '.md': '📝',
        '.xml': '📄',
        '.txt': '📄',
        '.pdf': '📕',
        '.doc': '📘', '.docx': '📘',
        '.xls': '📗', '.xlsx': '📗',
        '.zip': '📦', '.rar': '📦',
        '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️',
        '.mp4': '🎬', '.avi': '🎬',
        '.mp3': '🎵', '.wav': '🎵'
    };
    return icons[extension.toLowerCase()] || '📄';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Store file data globally for code editor access
window.projectFiles = window.projectFiles || {};

function createFileCard(file, projectId) {
    const isCode = file.isCode;
    const codeClass = isCode ? 'code-file' : '';
    
    // Store file in global object
    const fileKey = `file_${projectId}_${file.id}`;
    window.projectFiles[fileKey] = file;
    
    const editBtn = isCode ? `<button class="btn btn-primary" onclick="openCodeEditorByKey('${fileKey}', ${projectId})">✏️ ערוך</button>` : '';
    const downloadBtn = `<a href="http://localhost:3000/${file.path}" download class="btn btn-secondary">⬇️ הורד</a>`;
    
    return `
        <div class="file-card ${codeClass}">
            <div class="file-icon">${getFileIcon(file.extension)}</div>
            <div class="file-name">${file.name}</div>
            <div class="file-info">גודל: ${formatFileSize(file.size)}</div>
            <div class="file-info">הועלה: ${new Date(file.uploadDate).toLocaleDateString('he-IL')}</div>
            ${isCode ? '<div class="file-info" style="color: #007acc; font-weight: bold;">📝 קובץ קוד</div>' : ''}
            <div class="file-actions">
                ${editBtn}
                ${downloadBtn}
                <button class="btn btn-danger btn-small" onclick="deleteProjectFile(${projectId}, ${file.id})">🗑️</button>
            </div>
        </div>
    `;
}

// Helper function to open code editor
function openCodeEditorByKey(fileKey, projectId) {
    const file = window.projectFiles[fileKey];
    if (file) {
        openCodeEditor(file, projectId);
    } else {
        showMessage('❌ שגיאה: קובץ לא נמצא', 'error');
    }
}

async function deleteProjectFile(projectId, fileId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק קובץ זה?')) return;
    
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('✅ הקובץ נמחק בהצלחה', 'success');
            loadProjects();
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showMessage('❌ שגיאה במחיקת הקובץ', 'error');
    }
}

// Upload files to project
async function uploadProjectFiles(projectId, files) {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        showMessage(`🔄 מעלה ${files.length} קבצים...`, 'success');
        
        const response = await fetch(`${API_URL}/projects/${projectId}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage(`✅ ${result.message}`, 'success');
            loadProjects();
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        showMessage('❌ שגיאה בהעלאת קבצים', 'error');
    }
}

// Handle file drop
function handleFileDrop(event, projectId) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    uploadProjectFiles(projectId, files);
}
