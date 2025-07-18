# 🤖 AI File Manager

> An intelligent conversational AI agent for automated file and project structure management

AI File Manager is a powerful tool that combines the intelligence of Google's Gemini 2.0 Flash with intuitive file management capabilities. Instead of manually creating project structures or using command-line tools, simply describe what you need in natural language, and the AI agent will create the entire file structure for you.

## 🌟 Features

### 🧠 **Intelligent Project Structure Generation**
- Describe any project type (React, Node.js, Python, etc.) and get a complete folder structure
- Automatically generates appropriate configuration files, folder hierarchies, and starter files
- Understands development best practices and creates industry-standard project layouts

### 💬 **Natural Language Interface**
- No need to remember complex commands or folder structures
- Simply type: *"Create a React project with components, utils, and styles folders"*
- Conversational AI that understands context and provides helpful responses

### 📁 **Advanced File Operations**
- Create, delete, and organize files and folders
- Set custom working directories anywhere on your system
- Browse and explore file contents with an intuitive interface
- Bulk operations and complex nested structure creation

### 🔒 **Security & Safety**
- Controlled access with configurable allowed root directories
- Path validation to prevent unauthorized file system access
- Safe directory traversal with built-in security checks

### 🎨 **Modern User Interface**
- Clean, responsive web interface with dark theme
- Real-time file explorer with breadcrumb navigation
- Interactive chat interface with loading indicators and error handling
- Quick action buttons for common tasks

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RahulRmCoder/AI-File-Manager.git
   cd ai-file-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage Examples

### Creating Project Structures

**React Project:**
```
"Create a React project structure with components, hooks, utils, and styling folders"
```

**Node.js API:**
```
"Set up a Node.js Express API with routes, controllers, middleware, and models folders"
```

**Python Project:**
```
"Create a Python project with src, tests, docs folders and setup.py"
```

### File Management

**Individual Files:**
```
"Create a README.md file"
"Create a config.json with basic settings"
```

**Organizing Files:**
```
"Create folders for images, documents, and scripts"
"Delete all .tmp files"
```

### Directory Management

**Setting Working Directory:**
```
"Set working directory to C:\Users\YourName\Desktop\MyProject"
"Change to my Documents folder"
```

## 🏗️ Architecture

### Backend Components

- **`server.js`** - Express.js server with CORS and routing
- **`routes/ai.js`** - AI processing endpoints and Gemini integration
- **`routes/files.js`** - File system operation endpoints
- **`utils/gemini.js`** - Gemini AI agent with conversation management
- **`utils/fileOperations.js`** - Secure file system operations with path validation

### Frontend Components

- **`public/app.js`** - Main application logic and UI management
- **`public/index.html`** - Modern responsive web interface
- **`public/styles/main.css`** - Dark theme styling with animations

### Key Technologies

- **Backend**: Node.js, Express.js, Google Generative AI SDK
- **Frontend**: Vanilla JavaScript, CSS3, Font Awesome
- **AI Model**: Google Gemini 2.0 Flash Experimental
- **File System**: fs-extra for enhanced file operations

## 🔧 Configuration

### Working Directory
- Default: `~/ai-file-manager-workspace`
- Configurable through the UI or direct API calls
- Supports common directories (Desktop, Documents, Downloads)

### Allowed Roots
The system includes security measures with pre-configured allowed roots:
- User home directory
- Desktop, Documents, Downloads folders
- Current working directory
- Custom directories can be added as needed

### API Configuration
```javascript
// Gemini Model Configuration
model: 'gemini-2.0-flash-exp'
temperature: 0.7
maxOutputTokens: 2048
```

## 📡 API Reference

### AI Processing
```http
POST /api/ai/process
Content-Type: application/json

{
  "message": "Create a React project structure",
  "context": {
    "currentPath": "",
    "workingDirectory": "/path/to/workspace"
  }
}
```

### File Operations
```http
# List directory contents
GET /api/files/list?path=subfolder

# Create file
POST /api/files/create-file
{
  "path": "filename.txt",
  "content": "file content"
}

# Set working directory
POST /api/files/set-directory
{
  "directory": "/path/to/new/workspace"
}
```

## 🛡️ Security Features

- **Path Validation**: Prevents directory traversal attacks
- **Allowed Roots**: Restricts operations to safe directories
- **Input Sanitization**: Validates all user inputs and file paths
- **API Safety**: Gemini API configured with safety filters

## 🎨 Customization

### Adding Custom Project Templates
Extend the AI's knowledge by modifying the prompt in `utils/gemini.js`:

```javascript
// Add your custom project structure templates
const customTemplates = {
  "flutter": {
    "lib": {
      "screens": {},
      "widgets": {},
      "models": {}
    },
    "assets": {
      "images": {},
      "fonts": {}
    }
  }
};
```

### Styling
Customize the interface by modifying `public/styles/main.scss`:

```scss
// Change color scheme
:root {
  --primary-color: #your-color;
  --background-color: #your-background;
}
```

## 🔄 Development

### Available Scripts
```bash
npm run dev      # Start with nodemon for development
npm run start    # Start production server
npm run sass     # Watch and compile SASS files
```

### File Structure
```
ai-file-manager/
├── public/
│   ├── index.html      # Main web interface
│   ├── app.js          # Frontend JavaScript
│   └── styles/         # SCSS and compiled CSS
├── routes/
│   ├── ai.js           # AI processing routes
│   └── files.js        # File operation routes
├── utils/
│   ├── gemini.js       # Gemini AI integration
│   └── fileOperations.js # File system utilities
├── server.js           # Express server
└── package.json        # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for providing the intelligent language processing capabilities
- **Express.js** for the robust web framework
- **Font Awesome** for the beautiful icons
- All the developers who create amazing project structures that inspired this tool

## 📞 Support

- Create an issue for bug reports or feature requests
- Check existing issues before creating new ones
- Provide clear reproduction steps for bugs

---

**Made with ❤️ for developers who want to focus on code, not file management.**
