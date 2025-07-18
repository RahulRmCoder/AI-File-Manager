const express = require('express');
const FileOperations = require('../utils/fileOperations');
const path = require('path');
const os = require('os');

const router = express.Router();
let fileOps = new FileOperations(); // Global instance

// Set working directory
router.post('/set-directory', async (req, res) => {
    try {
        const { directory } = req.body;
        
        if (!directory) {
            return res.status(400).json({ 
                success: false, 
                error: 'Directory path is required' 
            });
        }

        // Update the global fileOps instance
        const newDirectory = fileOps.setWorkingDirectory(directory);
        
        // Also update the AI routes fileOps instance
        const aiRoutes = require('./ai');
        aiRoutes.updateFileOps(fileOps);
        
        res.json({ 
            success: true, 
            directory: newDirectory,
            message: `Working directory set to: ${newDirectory}`
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get current working directory
router.get('/current-directory', (req, res) => {
    try {
        const currentDir = fileOps.getCurrentDirectory();
        const allowedRoots = fileOps.getAllowedRoots();
        
        res.json({ 
            success: true, 
            currentDirectory: currentDir,
            allowedRoots: allowedRoots,
            homeDirectory: os.homedir(),
            desktopDirectory: path.join(os.homedir(), 'Desktop'),
            documentsDirectory: path.join(os.homedir(), 'Documents')
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Explore system directory (for directory picker)
router.post('/explore-directory', async (req, res) => {
    try {
        const { directory } = req.body;
        
        if (!directory) {
            return res.status(400).json({ 
                success: false, 
                error: 'Directory path is required' 
            });
        }

        const items = await fileOps.exploreSystemDirectory(directory);
        
        res.json({ 
            success: true, 
            directory: directory,
            items: items.filter(item => item.type === 'folder') // Only return folders for selection
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get directory listing
router.get('/list', async (req, res) => {
    try {
        const { path: dirPath = '' } = req.query;
        const items = await fileOps.listDirectory(dirPath);
        const currentDir = fileOps.getCurrentDirectory();
        
        res.json({ 
            success: true, 
            items,
            currentDirectory: currentDir,
            fullPath: path.resolve(currentDir, dirPath)
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create file
router.post('/create-file', async (req, res) => {
    try {
        const { path: filePath, content = '' } = req.body;
        const result = await fileOps.createFile(filePath, content);
        res.json({ 
            success: true, 
            path: result,
            message: `File created: ${result}`
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create folder
router.post('/create-folder', async (req, res) => {
    try {
        const { path: folderPath } = req.body;
        const result = await fileOps.createFolder(folderPath);
        res.json({ 
            success: true, 
            path: result,
            message: `Folder created: ${result}`
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Delete item
router.delete('/delete', async (req, res) => {
    try {
        const { path: itemPath } = req.body;
        await fileOps.deleteItem(itemPath);
        res.json({ 
            success: true, 
            message: `Item deleted successfully: ${itemPath}` 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create structure
router.post('/create-structure', async (req, res) => {
    try {
        const { structure, basePath = '' } = req.body;
        const results = await fileOps.createStructure(structure, basePath);
        const currentDir = fileOps.getCurrentDirectory();
        
        res.json({ 
            success: true, 
            results,
            createdIn: path.resolve(currentDir, basePath),
            message: `Structure created with ${results.length} items`
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get file content
router.get('/content', async (req, res) => {
    try {
        const { path: filePath } = req.query;
        const content = await fileOps.getFileContent(filePath);
        res.json({ 
            success: true, 
            content,
            filePath: filePath
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Export the fileOps instance so it can be shared
module.exports = router;
module.exports.getFileOps = () => fileOps;
module.exports.setFileOps = (newFileOps) => { fileOps = newFileOps; };