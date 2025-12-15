const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const projectId = req.params.id || 'temp';
        const uploadDir = path.join(__dirname, 'uploads', 'projects', projectId.toString());
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, `${timestamp}-${originalName}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'business_data.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

if (!fs.existsSync(path.join(__dirname, 'uploads', 'projects'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads', 'projects'));
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        clients: [],
        projects: [],
        income: [],
        expenses: [],
        tasks: [],
        leads: [],
        quotes: [],
        settings: {
            business_name: "מאסטר קוד",
            owner: "יאיר",
            phone: "052-209-1733",
            email: "przyyryair@gmail.com",
            website: "https://yairmaster.info"
        }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper functions
function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getCurrentTimestamp() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

// Routes

// Get all data
app.get('/api/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Get dashboard stats
app.get('/api/dashboard', (req, res) => {
    try {
        const data = readData();
        const stats = {
            total_clients: data.clients.length,
            active_projects: data.projects.filter(p => p.status === 'בתהליך').length,
            completed_projects: data.projects.filter(p => p.status === 'הושלם').length,
            active_leads: data.leads.filter(l => ['חדש', 'בטיפול'].includes(l.status)).length,
            total_income: data.income.reduce((sum, i) => sum + i.amount, 0),
            total_expenses: data.expenses.reduce((sum, e) => sum + e.amount, 0),
            pending_payments: data.projects.filter(p => !p.paid).reduce((sum, p) => sum + p.price, 0),
            open_tasks: data.tasks.filter(t => t.status === 'פתוח').length
        };
        stats.net_profit = stats.total_income - stats.total_expenses;
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
});

// Clients
app.get('/api/clients', (req, res) => {
    try {
        const data = readData();
        res.json(data.clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get clients' });
    }
});

app.post('/api/clients', (req, res) => {
    try {
        const data = readData();
        const newClient = {
            id: data.clients.length > 0 ? Math.max(...data.clients.map(c => c.id)) + 1 : 1,
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            source: req.body.source || '',
            date_added: getCurrentTimestamp(),
            total_paid: 0,
            projects_count: 0,
            notes: req.body.notes || ''
        };
        data.clients.push(newClient);
        writeData(data);
        res.json(newClient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add client' });
    }
});

app.delete('/api/clients/:id', (req, res) => {
    try {
        const data = readData();
        const clientId = parseInt(req.params.id);
        
        // Check if client has projects
        const hasProjects = data.projects.some(p => p.client_id === clientId);
        if (hasProjects) {
            return res.status(400).json({ error: 'Cannot delete client with existing projects' });
        }
        
        data.clients = data.clients.filter(c => c.id !== clientId);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

// Projects
app.get('/api/projects', (req, res) => {
    try {
        const data = readData();
        res.json(data.projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get projects' });
    }
});

app.post('/api/projects', (req, res) => {
    try {
        const data = readData();
        const client = data.clients.find(c => c.id === req.body.client_id);
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        const newProject = {
            id: data.projects.length > 0 ? Math.max(...data.projects.map(p => p.id)) + 1 : 1,
            client_id: req.body.client_id,
            client_name: client.name,
            type: req.body.type,
            price: parseFloat(req.body.price),
            description: req.body.description || '',
            deadline: req.body.deadline || '',
            status: 'בתהליך',
            date_created: getCurrentTimestamp(),
            date_completed: '',
            paid: false,
            payment_date: '',
            files: []
        };
        
        data.projects.push(newProject);
        client.projects_count++;
        writeData(data);
        res.json(newProject);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add project' });
    }
});

app.put('/api/projects/:id/status', (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.id);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        project.status = req.body.status;
        if (req.body.status === 'הושלם') {
            project.date_completed = getCurrentTimestamp();
        }
        
        writeData(data);
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project status' });
    }
});

app.put('/api/projects/:id/paid', (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.id);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        project.paid = true;
        project.payment_date = getCurrentTimestamp();
        
        // Update client total paid
        const client = data.clients.find(c => c.id === project.client_id);
        if (client) {
            client.total_paid += project.price;
        }
        
        // Add to income
        data.income.push({
            id: data.income.length > 0 ? Math.max(...data.income.map(i => i.id)) + 1 : 1,
            amount: project.price,
            source: `פרויקט #${project.id} - ${project.client_name}`,
            category: 'פרויקט',
            date: getCurrentTimestamp()
        });
        
        writeData(data);
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark project as paid' });
    }
});

app.delete('/api/projects/:id', (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.id);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Delete project files
        const projectDir = path.join(__dirname, 'uploads', 'projects', projectId.toString());
        if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
        
        // Update client projects count
        const client = data.clients.find(c => c.id === project.client_id);
        if (client && client.projects_count > 0) {
            client.projects_count--;
        }
        
        data.projects = data.projects.filter(p => p.id !== projectId);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// File upload for projects
app.post('/api/projects/:id/upload', upload.array('files', 10), (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.id);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        if (!project.files) {
            project.files = [];
        }
        
        const uploadedFiles = req.files.map(file => {
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const extension = path.extname(originalName).toLowerCase();
            
            return {
                id: Date.now() + Math.random(),
                name: originalName,
                path: file.path.replace(/\\/g, '/'),
                size: file.size,
                mimetype: file.mimetype,
                extension: extension,
                isCode: ['.js', '.html', '.css', '.json', '.py', '.php', '.java', '.cpp', '.c', '.ts', '.jsx', '.tsx', '.vue', '.sql'].includes(extension),
                uploadDate: getCurrentTimestamp()
            };
        });
        
        project.files.push(...uploadedFiles);
        writeData(data);
        
        res.json({ 
            success: true, 
            files: uploadedFiles,
            message: `הועלו ${uploadedFiles.length} קבצים בהצלחה`
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// Get project files
app.get('/api/projects/:id/files', (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.id);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json(project.files || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get files' });
    }
});

// Delete project file
app.delete('/api/projects/:projectId/files/:fileId', (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.projectId);
        const fileId = parseFloat(req.params.fileId);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const fileIndex = project.files.findIndex(f => f.id === fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const file = project.files[fileIndex];
        
        // Delete physical file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        
        project.files.splice(fileIndex, 1);
        writeData(data);
        
        res.json({ success: true, message: 'הקובץ נמחק בהצלחה' });
    } catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Get file content (for code editing)
app.get('/api/projects/:projectId/files/:fileId/content', (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.projectId);
        const fileId = parseFloat(req.params.fileId);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const file = project.files.find(f => f.id === fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Read file content
        let content = '';
        if (fs.existsSync(file.path)) {
            content = fs.readFileSync(file.path, 'utf8');
        }
        
        res.json({ 
            success: true, 
            content: content,
            file: {
                name: file.name,
                extension: file.extension,
                size: file.size
            }
        });
    } catch (error) {
        console.error('File read error:', error);
        res.status(500).json({ error: 'Failed to read file' });
    }
});

// Save file content (for code editing)
app.put('/api/projects/:projectId/files/:fileId/content', (req, res) => {
    try {
        const data = readData();
        const projectId = parseInt(req.params.projectId);
        const fileId = parseFloat(req.params.fileId);
        const project = data.projects.find(p => p.id === projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const file = project.files.find(f => f.id === fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const newContent = req.body.content;
        
        // Write content to file
        fs.writeFileSync(file.path, newContent, 'utf8');
        
        // Update file size
        const stats = fs.statSync(file.path);
        file.size = stats.size;
        writeData(data);
        
        res.json({ 
            success: true, 
            message: 'הקובץ נשמר בהצלחה',
            size: file.size 
        });
    } catch (error) {
        console.error('File save error:', error);
        res.status(500).json({ error: 'Failed to save file' });
    }
});

// AI Chat endpoint
app.post('/api/ai-chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        const data = readData();
        
        // Build context for AI
        const systemContext = `
אתה עוזר AI חכם למערכת ניהול עסקים של חברת MasterCode.
אתה מסייע בניתוח נתונים, מתן המלצות, ומענה על שאלות על העסק.

סטטיסטיקות נוכחיות:
- לקוחות: ${data.clients.length}
- פרויקטים פעילים: ${data.projects.filter(p => p.status === 'בתהליך').length}
- פרויקטים שהושלמו: ${data.projects.filter(p => p.status === 'הושלם').length}
- הכנסות כוללות: ₪${data.income.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
- הוצאות כוללות: ₪${data.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
- משימות פתוחות: ${data.tasks.filter(t => t.status === 'פתוח').length}
- לידים פעילים: ${data.leads.filter(l => ['חדש', 'בטיפול'].includes(l.status)).length}

ענה בעברית, בצורה ברורה ומקצועית. תן המלצות מעשיות ומבוססות נתונים.
`;

        // Here you would integrate with an AI service like OpenAI
        // For now, we'll return a mock response
        const aiResponse = generateAIResponse(message, data, systemContext);
        
        res.json({ 
            success: true, 
            response: aiResponse,
            timestamp: getCurrentTimestamp()
        });
    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

// Simple AI response generator (mock - replace with real AI integration)
function generateAIResponse(message, data, context) {
    const lowerMessage = message.toLowerCase();
    
    // Statistics queries
    if (lowerMessage.includes('כמה לקוחות') || lowerMessage.includes('מספר לקוחות')) {
        return `יש לך ${data.clients.length} לקוחות במערכת. ${data.clients.filter(c => c.projects_count > 0).length} מהם עם פרויקטים פעילים.`;
    }
    
    if (lowerMessage.includes('הכנסות') || lowerMessage.includes('רווחים')) {
        const totalIncome = data.income.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
        const profit = totalIncome - totalExpenses;
        return `סה"כ הכנסות: ₪${totalIncome.toLocaleString()}\nסה"כ הוצאות: ₪${totalExpenses.toLocaleString()}\nרווח נקי: ₪${profit.toLocaleString()}`;
    }
    
    if (lowerMessage.includes('פרויקטים')) {
        const active = data.projects.filter(p => p.status === 'בתהליך').length;
        const completed = data.projects.filter(p => p.status === 'הושלם').length;
        return `יש לך ${active} פרויקטים פעילים ו-${completed} פרויקטים שהושלמו. ${data.projects.filter(p => !p.paid).length} פרויקטים ממתינים לתשלום.`;
    }
    
    if (lowerMessage.includes('משימות')) {
        const open = data.tasks.filter(t => t.status === 'פתוח').length;
        const completed = data.tasks.filter(t => t.status === 'הושלם').length;
        return `יש לך ${open} משימות פתוחות ו-${completed} משימות שהושלמו.`;
    }
    
    if (lowerMessage.includes('המלצות') || lowerMessage.includes('שיפור')) {
        const recommendations = [];
        
        if (data.tasks.filter(t => t.status === 'פתוח').length > 5) {
            recommendations.push('📌 יש לך מעל 5 משימות פתוחות - כדאי לסדר עדיפויות');
        }
        
        if (data.projects.filter(p => !p.paid).length > 0) {
            recommendations.push('💰 יש פרויקטים שטרם שולמו - כדאי לעקוב אחרי התשלומים');
        }
        
        if (data.leads.filter(l => l.status === 'חדש').length > 3) {
            recommendations.push('🎯 יש לידים חדשים שממתינים לטיפול');
        }
        
        if (recommendations.length === 0) {
            return '✨ הכל נראה מצוין! המשך בעבודה הטובה!';
        }
        
        return 'המלצות לשיפור:\n\n' + recommendations.join('\n');
    }
    
    // Default response
    return `אני כאן לעזור! תוכל לשאול אותי על:
📊 סטטיסטיקות (לקוחות, פרויקטים, הכנסות)
💡 המלצות לשיפור
📈 ניתוח ביצועים
🎯 סטטוס משימות ופרויקטים

פשוט תשאל ואני אענה על בסיס הנתונים במערכת!`;
}

// Finance
app.get('/api/income', (req, res) => {
    try {
        const data = readData();
        res.json(data.income);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get income' });
    }
});

app.post('/api/income', (req, res) => {
    try {
        const data = readData();
        const newIncome = {
            id: data.income.length > 0 ? Math.max(...data.income.map(i => i.id)) + 1 : 1,
            amount: parseFloat(req.body.amount),
            source: req.body.source,
            category: req.body.category || '',
            date: getCurrentTimestamp()
        };
        data.income.push(newIncome);
        writeData(data);
        res.json(newIncome);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add income' });
    }
});

app.get('/api/expenses', (req, res) => {
    try {
        const data = readData();
        res.json(data.expenses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get expenses' });
    }
});

app.post('/api/expenses', (req, res) => {
    try {
        const data = readData();
        const newExpense = {
            id: data.expenses.length > 0 ? Math.max(...data.expenses.map(e => e.id)) + 1 : 1,
            amount: parseFloat(req.body.amount),
            description: req.body.description,
            category: req.body.category || '',
            date: getCurrentTimestamp()
        };
        data.expenses.push(newExpense);
        writeData(data);
        res.json(newExpense);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

// Tasks
app.get('/api/tasks', (req, res) => {
    try {
        const data = readData();
        res.json(data.tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const data = readData();
        const newTask = {
            id: data.tasks.length > 0 ? Math.max(...data.tasks.map(t => t.id)) + 1 : 1,
            title: req.body.title,
            description: req.body.description || '',
            priority: req.body.priority || 'רגילה',
            due_date: req.body.due_date || '',
            status: 'פתוח',
            date_created: getCurrentTimestamp(),
            date_completed: ''
        };
        data.tasks.push(newTask);
        writeData(data);
        res.json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add task' });
    }
});

app.put('/api/tasks/:id/complete', (req, res) => {
    try {
        const data = readData();
        const taskId = parseInt(req.params.id);
        const task = data.tasks.find(t => t.id === taskId);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        task.status = 'הושלם';
        task.date_completed = getCurrentTimestamp();
        writeData(data);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete task' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    try {
        const data = readData();
        const taskId = parseInt(req.params.id);
        data.tasks = data.tasks.filter(t => t.id !== taskId);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Leads
app.get('/api/leads', (req, res) => {
    try {
        const data = readData();
        res.json(data.leads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get leads' });
    }
});

app.post('/api/leads', (req, res) => {
    try {
        const data = readData();
        const newLead = {
            id: data.leads.length > 0 ? Math.max(...data.leads.map(l => l.id)) + 1 : 1,
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            source: req.body.source || '',
            interest: req.body.interest || '',
            notes: req.body.notes || '',
            status: 'חדש',
            date_added: getCurrentTimestamp(),
            follow_up_date: ''
        };
        data.leads.push(newLead);
        writeData(data);
        res.json(newLead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add lead' });
    }
});

app.post('/api/leads/:id/convert', (req, res) => {
    try {
        const data = readData();
        const leadId = parseInt(req.params.id);
        const lead = data.leads.find(l => l.id === leadId);
        
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Create new client from lead
        const newClient = {
            id: data.clients.length > 0 ? Math.max(...data.clients.map(c => c.id)) + 1 : 1,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            source: lead.source,
            date_added: getCurrentTimestamp(),
            total_paid: 0,
            projects_count: 0,
            notes: lead.notes
        };
        
        data.clients.push(newClient);
        lead.status = 'הומר ללקוח';
        
        writeData(data);
        res.json(newClient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to convert lead' });
    }
});

app.delete('/api/leads/:id', (req, res) => {
    try {
        const data = readData();
        const leadId = parseInt(req.params.id);
        data.leads = data.leads.filter(l => l.id !== leadId);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Settings
app.get('/api/settings', (req, res) => {
    try {
        const data = readData();
        res.json(data.settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Quotes
app.get('/api/quotes', (req, res) => {
    try {
        const data = readData();
        res.json(data.quotes || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get quotes' });
    }
});

app.post('/api/quotes', (req, res) => {
    try {
        const data = readData();
        if (!data.quotes) data.quotes = [];
        
        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19).replace('T', '_');
        const quoteNumber = `QT-${timestamp}`;
        
        const newQuote = {
            id: data.quotes.length > 0 ? Math.max(...data.quotes.map(q => q.id)) + 1 : 1,
            quote_number: quoteNumber,
            client_name: req.body.client_name,
            client_email: req.body.client_email,
            client_phone: req.body.client_phone,
            items: req.body.items,
            notes: req.body.notes || '',
            validity_days: req.body.validity_days || 30,
            date_created: getCurrentTimestamp(),
            subtotal: req.body.subtotal,
            discount: req.body.discount,
            total: req.body.total,
            html_content: req.body.html_content
        };
        
        data.quotes.push(newQuote);
        writeData(data);
        res.json(newQuote);
    } catch (error) {
        console.error('Quote error:', error);
        res.status(500).json({ error: 'Failed to create quote' });
    }
});

app.delete('/api/quotes/:id', (req, res) => {
    try {
        const data = readData();
        const quoteId = parseInt(req.params.id);
        data.quotes = data.quotes.filter(q => q.id !== quoteId);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete quote' });
    }
});

app.delete('/api/income/:id', (req, res) => {
    try {
        const data = readData();
        const incomeId = parseInt(req.params.id);
        data.income = data.income.filter(i => i.id !== incomeId);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete income' });
    }
});

app.delete('/api/expenses/:id', (req, res) => {
    try {
        const data = readData();
        const expenseId = parseInt(req.params.id);
        data.expenses = data.expenses.filter(e => e.id !== expenseId);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// Backup
app.post('/api/backup', (req, res) => {
    try {
        const data = readData();
        const backupData = JSON.stringify(data, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.json`);
        res.send(backupData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
