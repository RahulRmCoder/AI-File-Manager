const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiAgent {
    constructor() {
        // Using Gemini 1.5 Flash for better performance and reliability
        this.model = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.7,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        });
        this.conversationHistory = [];
    }

    async processCommand(userInput, context = {}) {
        console.log('Processing command:', userInput);
        console.log('Context:', context);
        
        const prompt = this.buildPrompt(userInput, context);
        
        try {
            // Validate API key
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY not configured in environment variables');
            }

            const result = await this.model.generateContent(prompt);
            
            if (!result.response) {
                throw new Error('No response from Gemini API');
            }

            const response = result.response.text();
            console.log('Gemini response:', response);
            
            // Store conversation
            this.conversationHistory.push({
                user: userInput,
                assistant: response,
                timestamp: new Date()
            });

            return this.parseResponse(response);
        } catch (error) {
            console.error('Gemini API Error:', error);
            
            // More specific error handling
            if (error.message.includes('API_KEY')) {
                return {
                    type: 'error',
                    message: 'API key configuration error. Please check your GEMINI_API_KEY in the .env file.',
                    action: null
                };
            }
            
            if (error.message.includes('quota') || error.message.includes('limit')) {
                return {
                    type: 'error',
                    message: 'API quota exceeded. Please try again later or check your Gemini API limits.',
                    action: null
                };
            }

            return {
                type: 'error',
                message: `Error processing request: ${error.message}`,
                action: null
            };
        }
    }

    buildPrompt(userInput, context) {
        const currentFiles = context.currentFiles || [];
        const currentPath = context.currentPath || 'root';
        
        const systemPrompt = `You are a helpful file management assistant. You can help users:
1. Create files and folders
2. Delete files and folders  
3. List directory contents
4. Create project structures from code descriptions
5. Organize files

CURRENT CONTEXT:
- Current directory: ${currentPath}
- Current files: ${JSON.stringify(currentFiles)}

USER REQUEST: "${userInput}"

IMPORTANT: Always respond with valid JSON in this exact format:
{
    "type": "create|delete|list|structure|info",
    "message": "A friendly conversational response explaining what you're doing",
    "action": {
        "operation": "create_file|create_folder|delete|create_structure|list",
        "targets": ["filename.ext"] or ["foldername/"],
        "content": "file content if creating a file",
        "structure": {} // only for structure creation
    }
}

EXAMPLES:

For "Create a new file called test.txt":
{
    "type": "create",
    "message": "I'll create a new file called test.txt for you!",
    "action": {
        "operation": "create_file",
        "targets": ["test.txt"],
        "content": ""
    }
}

For "Create a React project structure":
{
    "type": "structure", 
    "message": "I'll create a complete React project structure with all the essential folders and files!",
    "action": {
        "operation": "create_structure",
        "structure": {
            "src": {
                "components": {},
                "utils": {},
                "styles": {}
            },
            "public": {},
            "package.json": "{\n  \"name\": \"react-app\",\n  \"version\": \"1.0.0\"\n}",
            "README.md": "# React Project"
        }
    }
}

For "Create a folder called New Project":
{
    "type": "create",
    "message": "I'll create a new folder called 'New Project' for you!",
    "action": {
        "operation": "create_folder", 
        "targets": ["New Project"]
    }
}

RESPOND ONLY WITH VALID JSON. NO ADDITIONAL TEXT.`;

        return systemPrompt;
    }

    parseResponse(response) {
        try {
            // Clean the response - remove any markdown formatting or extra text
            let cleanResponse = response.trim();
            
            // Extract JSON if it's wrapped in markdown code blocks
            const jsonMatch = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                cleanResponse = jsonMatch[1].trim();
            }
            
            // Try to parse the JSON
            const parsed = JSON.parse(cleanResponse);
            
            // Validate required fields
            if (!parsed.type || !parsed.message) {
                throw new Error('Invalid response format');
            }
            
            return parsed;
        } catch (error) {
            console.error('JSON parsing error:', error);
            console.error('Raw response:', response);
            
            // Fallback - try to extract intent from the response
            const userFriendlyMessage = response || 'I encountered an issue processing your request.';
            
            // Try to detect intent for simple fallback
            if (response.toLowerCase().includes('create') && response.toLowerCase().includes('file')) {
                return {
                    type: 'info',
                    message: userFriendlyMessage + ' (Fallback: Please try being more specific about the file name)',
                    action: null
                };
            }
            
            return {
                type: 'info',
                message: userFriendlyMessage,
                action: null
            };
        }
    }

    getConversationHistory() {
        return this.conversationHistory;
    }
}

module.exports = GeminiAgent;