const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const filesRoutes = require('./routes/files');
const aiRoutes = require('./routes/ai');

// Use routes
app.use('/api/files', filesRoutes);
app.use('/api/ai', aiRoutes);

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 AI File Manager Server running on http://localhost:${PORT}`);
    console.log(`📁 Default workspace: ${require('os').homedir()}\\ai-file-manager-workspace`);
    console.log(`💡 Tip: Use the interface to change your working directory`);
});