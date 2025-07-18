const express = require('express');
const GeminiAgent = require('../utils/gemini');
const FileOperations = require('../utils/fileOperations');

const router = express.Router();
const aiAgent = new GeminiAgent();
let fileOps = new FileOperations(); // Global instance that can be updated

// Function to update fileOps instance (called from files.js)
function updateFileOps(newFileOps) {
    fileOps = newFileOps;
}

// Process AI command
router.post('/process', async (req, res) => {
    try {
        const { message, context = {} } = req.body;
        
        console.log('Received AI request:', { message, context });
        console.log('Current working directory:', fileOps.getCurrentDirectory());
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }
        
        // Check if this is a directory change request
        if (message.toLowerCase().includes('set directory') || 
            message.toLowerCase().includes('change directory') ||
            message.toLowerCase().includes('working directory')) {
            
            return res.json({
                success: true,
                response: {
                    type: 'directory_request',
                    message: 'I can help you set a working directory! Please provide the full path to the directory where you want to create files. For example: "Set directory to C:\\Users\\rahul\\Desktop\\MyProject" or "Change working directory to C:\\Users\\rahul\\Documents\\Projects"',
                    action: null
                }
            });
        }

        // Check if this contains a directory path
        const directoryMatch = message.match(/(?:set directory to|change directory to|working directory to|work in)\s+(.+)/i);
        if (directoryMatch) {
            try {
                const requestedPath = directoryMatch[1].trim().replace(/['"]/g, ''); // Remove quotes
                console.log('Attempting to set directory to:', requestedPath);
                
                const newDirectory = fileOps.setWorkingDirectory(requestedPath);
                console.log('Directory successfully set to:', newDirectory);
                
                return res.json({
                    success: true,
                    response: {
                        type: 'directory_set',
                        message: `Great! I've set the working directory to: ${newDirectory}. Now I can create files and folders in this location. What would you like me to create?`,
                        action: null,
                        actionResult: {
                            message: `Working directory changed to: ${newDirectory}`,
                            directory: newDirectory
                        }
                    }
                });
            } catch (error) {
                console.error('Error setting directory:', error);
                return res.json({
                    success: true,
                    response: {
                        type: 'error',
                        message: `I couldn't set the directory: ${error.message}. Please make sure the path exists and you have permission to access it.`,
                        action: null
                    }
                });
            }
        }
        
        // Get current directory context
        let currentFiles = [];
        let currentDirectory = '';
        try {
            currentFiles = await fileOps.listDirectory(context.currentPath || '');
            currentDirectory = fileOps.getCurrentDirectory();
            console.log('Context - Current directory:', currentDirectory);
            console.log('Context - Current files:', currentFiles.length, 'items');
        } catch (error) {
            console.warn('Could not load current files:', error.message);
        }
        
        const enhancedContext = {
            ...context,
            currentFiles: currentFiles,
            workingDirectory: currentDirectory
        };
        
        console.log('Enhanced context:', enhancedContext);
        
        const response = await aiAgent.processCommand(message, enhancedContext);
        
        console.log('AI response:', response);
        
        // Execute the action if provided
        let actionResult = null;
        if (response.action && response.type !== 'error') {
            try {
                actionResult = await executeAction(response.action);
                console.log('Action result:', actionResult);
            } catch (actionError) {
                console.error('Action execution error:', actionError);
                actionResult = { 
                    error: `Failed to execute action: ${actionError.message}` 
                };
            }
        }
        
        res.json({ 
            success: true, 
            response: {
                ...response,
                actionResult,
                workingDirectory: fileOps.getCurrentDirectory()
            }
        });
        
    } catch (error) {
        console.error('AI processing error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
});

// Get conversation history
router.get('/history', (req, res) => {
    try {
        const history = aiAgent.getConversationHistory();
        res.json({ success: true, history });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current working directory info
router.get('/working-directory', (req, res) => {
    try {
        const currentDir = fileOps.getCurrentDirectory();
        const allowedRoots = fileOps.getAllowedRoots();
        
        res.json({ 
            success: true, 
            currentDirectory: currentDir,
            allowedRoots: allowedRoots
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

async function executeAction(action) {
    try {
        console.log('Executing action:', action);
        console.log('Using working directory:', fileOps.getCurrentDirectory());
        
        switch (action.operation) {
            case 'create_file':
                if (!action.targets || action.targets.length === 0) {
                    throw new Error('No file path specified');
                }
                const filePath = action.targets[0];
                const content = action.content || '';
                const result = await fileOps.createFile(filePath, content);
                console.log('File created at:', result);
                return { 
                    message: `File created successfully: ${result}`,
                    path: result 
                };
            
            case 'create_folder':
                if (!action.targets || action.targets.length === 0) {
                    throw new Error('No folder path specified');
                }
                const folderPath = action.targets[0];
                const folderResult = await fileOps.createFolder(folderPath);
                console.log('Folder created at:', folderResult);
                return { 
                    message: `Folder created successfully: ${folderResult}`,
                    path: folderResult 
                };
            
            case 'delete':
                if (!action.targets || action.targets.length === 0) {
                    throw new Error('No targets specified for deletion');
                }
                const results = [];
                for (const target of action.targets) {
                    await fileOps.deleteItem(target);
                    results.push(target);
                }
                return { 
                    message: `Successfully deleted: ${results.join(', ')}`,
                    deleted: results 
                };
            
            case 'create_structure':
                if (!action.structure) {
                    throw new Error('No structure specified');
                }
                const structureResults = await fileOps.createStructure(
                    action.structure, 
                    action.basePath || ''
                );
                const currentDir = fileOps.getCurrentDirectory();
                console.log('Structure created in:', currentDir);
                return { 
                    message: `Project structure created with ${structureResults.length} items in ${currentDir}`,
                    created: structureResults,
                    location: currentDir
                };
            
            case 'list':
                const listPath = action.targets && action.targets[0] ? action.targets[0] : '';
                const items = await fileOps.listDirectory(listPath);
                return { 
                    message: `Found ${items.length} items in ${listPath || 'current directory'}`,
                    items: items 
                };
            
            default:
                return { 
                    message: `Action '${action.operation}' completed`,
                    note: 'Action type not fully implemented yet' 
                };
        }
    } catch (error) {
        console.error('Action execution error:', error);
        throw error;
    }
}

module.exports = router;
module.exports.updateFileOps = updateFileOps;