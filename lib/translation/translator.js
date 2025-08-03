// === TRANSLATION API MODULE ===
// Handles all translation API interactions

const https = require('https');
const { SimpleMenu } = require('../core/menu');
const { print, printHeader, waitForEnter } = require('../core/terminal');

class TranslationTranslator {
  constructor(env) {
    this.env = env;
    this.api = null;
    this.apiConfig = {
      openai: {
        name: 'OpenAI GPT-3.5',
        available: !!(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY),
        batchSize: 50
      },
      google: {
        name: 'Google Translate',
        available: !!(env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY),
        batchSize: 1
      },
      mymemory: {
        name: 'MyMemory (Free)',
        available: true,
        batchSize: 1
      }
    };
  }

  // Setup translation API
  async setupApi() {
    const availableApis = Object.entries(this.apiConfig)
      .filter(([key, config]) => config.available)
      .map(([key, config]) => ({ name: config.name, value: key }));
    
    if (availableApis.length === 1 && availableApis[0].value === 'mymemory') {
      this.api = 'mymemory';
      print('\n⚠️  No API keys found. Using MyMemory (free but limited)', 'yellow');
      print('💡 For better translations, add OPENAI_API_KEY to your .env file', 'dim');
      await waitForEnter();
    } else {
      printHeader();
      const menu = new SimpleMenu(
        '🌐 Select translation API:',
        availableApis
      );
      
      const selected = await menu.show();
      this.api = selected.value;
      
      print(`✅ Using ${this.apiConfig[this.api].name} for translations`, 'green');
      await waitForEnter();
    }
  }

  // Translate multiple keys
  async translateKeys(keys, masterKeys, fromLang, toLang) {
    if (keys.length === 0) return {};
    
    // For English, just return the master values
    if (toLang === 'en') {
      const translations = {};
      keys.forEach(key => {
        translations[key] = masterKeys.get(key)?.en || masterKeys.get(key)?.fallback || key;
      });
      return translations;
    }
    
    const translations = {};
    const batchSize = this.apiConfig[this.api].batchSize;
    
    // Prepare texts to translate
    const textsToTranslate = keys.map(key => {
      const masterValue = masterKeys.get(key);
      return masterValue?.en || masterValue?.fallback || this.keyToText(key);
    });
    
    // Process in batches
    for (let i = 0; i < keys.length; i += batchSize) {
      const batchKeys = keys.slice(i, i + batchSize);
      const batchTexts = textsToTranslate.slice(i, i + batchSize);
      
      if (batchSize > 1) {
        print(`    Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(keys.length/batchSize)}...`, 'dim');
      }
      
      try {
        let batchTranslations;
        
        switch (this.api) {
          case 'openai':
            batchTranslations = await this.translateWithOpenAI(batchTexts, fromLang, toLang);
            break;
          case 'google':
            batchTranslations = await this.translateWithGoogle(batchTexts, fromLang, toLang);
            break;
          default:
            batchTranslations = await this.translateWithMyMemory(batchTexts, fromLang, toLang);
        }
        
        // Map translations back to keys
        batchKeys.forEach((key, index) => {
          translations[key] = batchTranslations[index] || batchTexts[index];
        });
        
      } catch (error) {
        print(`    ⚠️  Translation error: ${error.message}`, 'yellow');
        // Use original text as fallback
        batchKeys.forEach((key, index) => {
          translations[key] = batchTexts[index];
        });
      }
      
      // Rate limiting delay
      if (i + batchSize < keys.length) {
        await new Promise(resolve => setTimeout(resolve, this.api === 'mymemory' ? 100 : 50));
      }
    }
    
    return translations;
  }

  // Translate with OpenAI
  async translateWithOpenAI(texts, fromLang, toLang) {
    return new Promise((resolve, reject) => {
      const apiKey = this.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      
      const prompt = `Translate the following ${texts.length} UI texts from ${this.getLanguageName(fromLang)} to ${this.getLanguageName(toLang)}.
Keep translations concise and appropriate for user interface elements.
Return ONLY the translations, one per line, in the same order:

${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}`;

      const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional UI/UX translator. Translate accurately while keeping text concise for interface elements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: Math.min(2000, texts.length * 50)
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            
            if (result.choices && result.choices[0] && result.choices[0].message) {
              const content = result.choices[0].message.content.trim();
              const translations = content
                .split('\n')
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
                .filter(line => line);
              
              resolve(translations);
            } else if (result.error) {
              reject(new Error(result.error.message || 'OpenAI API error'));
            } else {
              reject(new Error('Invalid response from OpenAI'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  // Translate with Google (placeholder)
  async translateWithGoogle(texts, fromLang, toLang) {
    // Google Translate API implementation
    throw new Error('Google Translate not yet implemented');
  }

  // Translate with MyMemory
  async translateWithMyMemory(texts, fromLang, toLang) {
    const translations = [];
    
    for (const text of texts) {
      try {
        const translation = await this.translateSingleMyMemory(text, fromLang, toLang);
        translations.push(translation);
      } catch (error) {
        translations.push(text); // Fallback to original
      }
    }
    
    return translations;
  }

  // Single translation with MyMemory
  async translateSingleMyMemory(text, fromLang, toLang) {
    return new Promise((resolve, reject) => {
      const query = encodeURIComponent(text);
      const langPair = `${fromLang}|${toLang}`;
      
      const options = {
        hostname: 'api.mymemory.translated.net',
        path: `/get?q=${query}&langpair=${langPair}`,
        method: 'GET',
        headers: {
          'User-Agent': 'TranslationTool/3.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.responseStatus === 200) {
              resolve(result.responseData.translatedText);
            } else {
              reject(new Error('Translation failed'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // Get language name from code
  getLanguageName(code) {
    const languages = {
      en: 'English',
      ar: 'Arabic',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      hi: 'Hindi',
      fa: 'Persian/Farsi',
      ur: 'Urdu'
    };
    
    return languages[code] || code.toUpperCase();
  }

  // Convert key to readable text
  keyToText(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

module.exports = TranslationTranslator;