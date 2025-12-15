// Code Editor Module
let monacoEditor = null;
let currentFile = null;
let currentProject = null;

// Initialize Monaco Editor
function initMonacoEditor() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function () {
        console.log('✅ Monaco Editor נטען בהצלחה!');
    });
}

// Open Code Editor
function openCodeEditor(file, projectId) {
    currentFile = file;
    currentProject = projectId;
    
    const modal = document.getElementById('code-editor-modal');
    modal.style.display = 'flex';
    
    // Update header
    document.getElementById('editor-file-name').textContent = file.name;
    document.getElementById('editor-file-type').textContent = file.extension.toUpperCase();
    
    // Show/hide run button based on file type
    const runBtn = document.getElementById('run-code-btn');
    const fileExt = file.extension.toLowerCase();
    console.log('🔍 סוג קובץ:', fileExt);
    
    if (['.html', '.htm'].includes(fileExt)) {
        runBtn.style.display = 'inline-block';
        console.log('✅ כפתור הרצה מוצג');
    } else {
        runBtn.style.display = 'none';
        console.log('❌ כפתור הרצה מוסתר (לא HTML)');
    }
    
    // Load file content and create editor
    loadFileContent(file, projectId);
}

// Load file content
async function loadFileContent(file, projectId) {
    try {
        // Request file content from server
        const response = await fetch(`${API_URL}/projects/${projectId}/files/${file.id}/content`);
        
        if (!response.ok) {
            throw new Error('Failed to load file content');
        }
        
        const data = await response.json();
        const content = data.content || '';
        
        // Create Monaco Editor with content
        createMonacoEditor(content);
        
    } catch (error) {
        console.error('Error loading file:', error);
        showMessage('❌ שגיאה בטעינת הקובץ', 'error');
        
        // Create editor with empty content as fallback
        createMonacoEditor('');
    }
}

// Create Monaco Editor
function createMonacoEditor(content) {
    require(['vs/editor/editor.main'], function () {
        // Destroy existing editor if any
        if (monacoEditor) {
            monacoEditor.dispose();
        }
        
        // Determine language from file extension
        const language = getLanguageFromExtension(currentFile.extension);
        
        // Create new editor
        monacoEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: content,
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            folding: true,
            bracketPairColorization: { enabled: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            tabCompletion: 'on'
        });
        
        console.log(`✅ עורך נטען עבור ${currentFile.name} (${language})`);
    });
}

// Get language from file extension
function getLanguageFromExtension(ext) {
    const languageMap = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.html': 'html',
        '.htm': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.json': 'json',
        '.py': 'python',
        '.php': 'php',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.cs': 'csharp',
        '.sql': 'sql',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.md': 'markdown',
        '.vue': 'html',
        '.sh': 'shell',
        '.bat': 'bat',
        '.ps1': 'powershell'
    };
    
    return languageMap[ext.toLowerCase()] || 'plaintext';
}

// Save code file
async function saveCodeFile() {
    if (!monacoEditor || !currentFile || !currentProject) {
        showMessage('❌ אין קובץ פתוח לשמירה', 'error');
        return;
    }
    
    const content = monacoEditor.getValue();
    
    try {
        showMessage('💾 שומר קובץ...', 'info');
        
        const response = await fetch(`${API_URL}/projects/${currentProject}/files/${currentFile.id}/content`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        
        if (!response.ok) {
            throw new Error('Save failed');
        }
        
        const result = await response.json();
        showMessage('✅ הקובץ נשמר בהצלחה!', 'success');
        console.log('✅ File saved:', currentFile.name);
        
    } catch (error) {
        console.error('Error saving file:', error);
        showMessage('❌ שגיאה בשמירת הקובץ', 'error');
    }
}

// Run code (for HTML files)
function runCode() {
    if (!monacoEditor || !currentFile) {
        showMessage('❌ אין קובץ פתוח להרצה', 'error');
        return;
    }
    
    const fileExt = currentFile.extension.toLowerCase();
    if (!['.html', '.htm'].includes(fileExt)) {
        showMessage('⚠️ ניתן להריץ רק קבצי HTML', 'warning');
        return;
    }
    
    const content = monacoEditor.getValue();
    
    // Open code runner
    const runnerModal = document.getElementById('code-runner-modal');
    runnerModal.style.display = 'flex';
    
    document.getElementById('runner-file-name').textContent = currentFile.name;
    
    // Load content into iframe
    const iframe = document.getElementById('code-runner-iframe');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    try {
        iframeDoc.open();
        iframeDoc.write(content);
        iframeDoc.close();
        console.log('✅ קוד רץ בהצלחה');
    } catch (error) {
        console.error('Error running code:', error);
        showMessage('❌ שגיאה בהרצת הקוד', 'error');
    }
}

// Close code editor
function closeCodeEditor() {
    const modal = document.getElementById('code-editor-modal');
    modal.style.display = 'none';
    
    if (monacoEditor) {
        monacoEditor.dispose();
        monacoEditor = null;
    }
    
    currentFile = null;
    currentProject = null;
    
    console.log('✅ עורך נסגר');
}

// Close code runner
function closeCodeRunner() {
    const modal = document.getElementById('code-runner-modal');
    modal.style.display = 'none';
    
    // Clear iframe
    const iframe = document.getElementById('code-runner-iframe');
    iframe.src = 'about:blank';
    
    console.log('✅ חלון הרצה נסגר');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const editorModal = document.getElementById('code-editor-modal');
        if (editorModal && editorModal.style.display === 'flex') {
            e.preventDefault();
            saveCodeFile();
        }
    }
    
    // Escape to close editor
    if (e.key === 'Escape') {
        const editorModal = document.getElementById('code-editor-modal');
        const runnerModal = document.getElementById('code-runner-modal');
        
        if (runnerModal && runnerModal.style.display === 'flex') {
            closeCodeRunner();
        } else if (editorModal && editorModal.style.display === 'flex') {
            closeCodeEditor();
        }
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initMonacoEditor();
    console.log('🚀 Code Editor Module מוכן');
});
