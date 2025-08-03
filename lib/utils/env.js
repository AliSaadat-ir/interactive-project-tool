// === ENVIRONMENT UTILITIES ===
// Handles .env file loading and template creation

const fs = require('fs');
const path = require('path');
const { print } = require('../core/terminal');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    try {
      let content = fs.readFileSync(envPath, 'utf8');
      
      // Remove BOM if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      
      const lines = content.split(/\r?\n/);
      
      lines.forEach((line) => {
        line = line.trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) {
          return;
        }
        
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
          return;
        }
        
        const key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();
        
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        env[key] = value;
      });
      
    } catch (error) {
      print(`⚠️ Error reading .env file: ${error.message}`, 'yellow');
    }
  }
  
  return env;
}

// Create .env template if it doesn't exist
function createEnvTemplate() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath) && !fs.existsSync(envExamplePath)) {
    const template = `# Translation API Keys
# Copy this file to .env and add your API keys

# OpenAI API Key (recommended for best quality)
# Get your key from: https://platform.openai.com/api-keys
# Supports batch translation for better performance
OPENAI_API_KEY=sk-your-api-key-here

# Google Translate API Key (alternative)
# Get your key from: https://console.cloud.google.com/apis/credentials
# GOOGLE_TRANSLATE_API_KEY=your-google-api-key-here

# Without API keys, the tool will use MyMemory (free but limited)
# MyMemory has rate limits and may not provide high-quality translations
`;
    
    fs.writeFileSync(envExamplePath, template);
    print('📝 Created .env.example file with API key template', 'green');
    print('💡 Copy it to .env and add your API keys for better translations', 'dim');
  }
}

module.exports = {
  loadEnvFile,
  createEnvTemplate
};