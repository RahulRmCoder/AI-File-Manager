const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class FileOperations {
    constructor(baseDir = null) {
        this.baseDir = baseDir || path.join(os.homedir(), 'ai-file-manager-workspace');
        this.allowedRoots = new Set();
        this.initializeDefaultRoots();
    }

    initializeDefaultRoots() {
        // Add common safe directories
        this.allowedRoots.add(os.homedir());
        this.allowedRoots.add(path.join(os.homedir(), 'Desktop'));
        this.allowedRoots.add(path.join(os.homedir(), 'Documents'));
        this.allowedRoots.add(path.join(os.homedir(), 'Downloads'));
        this.allowedRoots.add(process.cwd()); // Current working directory
        
        // Add workspace directory
        this.allowedRoots.add(this.baseDir);
    }

    setWorkingDirectory(newBaseDir) {
        // Validate the directory exists and is accessible
        if (!fs.existsSync(newBaseDir)) {
            throw new Error(`Directory does not exist: ${newBaseDir}`);
        }
        
        const stats = fs.statSync(newBaseDir);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${newBaseDir}`);
        }

        // Security check - ensure it's an allowed root or subdirectory
        const resolvedPath = path.resolve(newBaseDir);
        const isAllowed = Array.from(this.allowedRoots).some(allowedRoot => {
            const resolvedRoot = path.resolve(allowedRoot);
            return resolvedPath.startsWith(resolvedRoot);
        });

        if (!isAllowed) {
            // Allow user to add new root if they confirm
            this.allowedRoots.add(resolvedPath);
        }

        this.baseDir = resolvedPath;
        return this.baseDir;
    }

    addAllowedRoot(rootPath) {
        const resolvedPath = path.resolve(rootPath);
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            this.allowedRoots.add(resolvedPath);
            return true;
        }
        return false;
    }

    getCurrentDirectory() {
        return this.baseDir;
    }

    getAllowedRoots() {
        return Array.from(this.allowedRoots);
    }

    async ensureBaseDir() {
        await fs.ensureDir(this.baseDir);
    }

    async createFile(filePath, content = '') {
        const fullPath = path.resolve(this.baseDir, filePath);
        
        // Security check
        if (!fullPath.startsWith(path.resolve(this.baseDir))) {
            throw new Error('Cannot create files outside of working directory');
        }

        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
        return fullPath;
    }

    async createFolder(folderPath) {
        const fullPath = path.resolve(this.baseDir, folderPath);
        
        // Security check
        if (!fullPath.startsWith(path.resolve(this.baseDir))) {
            throw new Error('Cannot create folders outside of working directory');
        }

        await fs.ensureDir(fullPath);
        return fullPath;
    }

    async deleteItem(itemPath) {
        const fullPath = path.resolve(this.baseDir, itemPath);
        
        // Security check
        if (!fullPath.startsWith(path.resolve(this.baseDir))) {
            throw new Error('Cannot delete items outside of working directory');
        }

        await fs.remove(fullPath);
        return fullPath;
    }

    async listDirectory(dirPath = '') {
        const fullPath = path.resolve(this.baseDir, dirPath);
        
        // Security check
        if (!fullPath.startsWith(path.resolve(this.baseDir))) {
            throw new Error('Cannot list directories outside of working directory');
        }

        if (!fs.existsSync(fullPath)) {
            return [];
        }

        const items = await fs.readdir(fullPath, { withFileTypes: true });
        
        return items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'folder' : 'file',
            path: path.join(dirPath, item.name),
            fullPath: path.join(fullPath, item.name)
        }));
    }

    async createStructure(structure, basePath = '') {
        const results = [];
        
        for (const [name, content] of Object.entries(structure)) {
            const itemPath = path.join(basePath, name);
            
            if (typeof content === 'object' && content !== null) {
                // It's a folder
                await this.createFolder(itemPath);
                results.push({ type: 'folder', path: itemPath });
                
                // Recursively create contents
                const subResults = await this.createStructure(content, itemPath);
                results.push(...subResults);
            } else {
                // It's a file
                const fileContent = typeof content === 'string' ? content : '';
                await this.createFile(itemPath, fileContent);
                results.push({ type: 'file', path: itemPath });
            }
        }
        
        return results;
    }

    async getFileContent(filePath) {
        const fullPath = path.resolve(this.baseDir, filePath);
        
        // Security check
        if (!fullPath.startsWith(path.resolve(this.baseDir))) {
            throw new Error('Cannot read files outside of working directory');
        }

        return await fs.readFile(fullPath, 'utf8');
    }

    // New method to explore system directories
    async exploreSystemDirectory(absolutePath) {
        const resolvedPath = path.resolve(absolutePath);
        
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Directory does not exist: ${resolvedPath}`);
        }

        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${resolvedPath}`);
        }

        const items = await fs.readdir(resolvedPath, { withFileTypes: true });
        
        return items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'folder' : 'file',
            fullPath: path.join(resolvedPath, item.name)
        }));
    }
}

module.exports = FileOperations;