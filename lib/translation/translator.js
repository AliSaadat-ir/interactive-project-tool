// === ENHANCED TRANSLATION API MODULE ===
// Handles all translation API interactions with user preferences

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
        batchSize: 50,
        description: 'High-quality translations with context awareness'
      },
      google: {
        name: 'Google Translate',
        available: !!(env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY),
        batchSize: 1,
        description: 'Professional translation service from Google'
      },
      mymemory: {
        name: 'MyMemory (Free)',
        available: true,
        batchSize: 1,
        description: 'Free translation service with rate limits'
      }
    };
  }

  // Setup translation API with user preference
  async setupApi(preferredApi = 'auto') {
    // If user has a preference and it's available, use it
    if (preferredApi !== 'auto' && this.apiConfig[preferredApi] && this.apiConfig[preferredApi].available) {
      this.api = preferredApi;
      print(`✅ Using ${this.apiConfig[this.api].name} (from settings)`, 'green');
      return;
    }
    
    // Auto selection logic
    if (preferredApi === 'auto') {
      // Priority: OpenAI > Google > MyMemory
      if (this.apiConfig.openai.available) {
        this.api = 'openai';
        print(`✅ Auto-selected ${this.apiConfig[this.api].name} (best available)`, 'green');
        return;
      } else if (this.apiConfig.google.available) {
        this.api = 'google';
        print(`✅ Auto-selected ${this.apiConfig[this.api].name}`, 'green');
        return;
      } else {
        this.api = 'mymemory';
        print(`⚠️  Using ${this.apiConfig[this.api].name} (no API keys configured)`, 'yellow');
        print('💡 For better translations, configure API keys in Settings', 'dim');
        return;
      }
    }
    
    // If preferred API is not available, show interactive selection
    const availableApis = Object.entries(this.apiConfig)
      .filter(([key, config]) => config.available)
      .map(([key, config]) => ({ 
        name: config.name + (key === 'mymemory' ? ' (Limited quality)' : ''), 
        value: key 
      }));
    
    if (availableApis.length === 1 && availableApis[0].value === 'mymemory') {
      this.api = 'mymemory';
      print('\n⚠️  No API keys found. Using MyMemory (free but limited)', 'yellow');
      print('💡 For better translations, add API keys in Settings', 'dim');
      await waitForEnter();
    } else {
      printHeader();
      print(`🌐 API Selection (${preferredApi} not available)`, 'yellow');
      console.log();
      
      const menu = new SimpleMenu(
        'Select translation API:',
        availableApis
      );
      
      const selected = await menu.show();
      this.api = selected.value;
      
      print(`✅ Using ${this.apiConfig[this.api].name} for translations`, 'green');
      await waitForEnter();
    }
  }

  // Get API status for display
  getApiStatus() {
    return {
      current: this.api ? this.apiConfig[this.api].name : 'Not configured',
      available: Object.entries(this.apiConfig)
        .filter(([key, config]) => config.available)
        .map(([key, config]) => ({ code: key, name: config.name })),
      recommendations: this.getRecommendations()
    };
  }

  // Get recommendations based on current setup
  getRecommendations() {
    const recommendations = [];
    
    if (!this.apiConfig.openai.available) {
      recommendations.push('Setup OpenAI API key for best translation quality');
    }
    
    if (!this.apiConfig.google.available) {
      recommendations.push('Consider Google Translate API for professional translations');
    }
    
    if (this.api === 'mymemory') {
      recommendations.push('Free API has rate limits and lower quality - consider upgrading');
    }
    
    return recommendations;
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

  // Translate with OpenAI - Enhanced with better prompts
  async translateWithOpenAI(texts, fromLang, toLang) {
    return new Promise((resolve, reject) => {
      const apiKey = this.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      
      const prompt = `Translate the following ${texts.length} UI texts from ${this.getLanguageName(fromLang)} to ${this.getLanguageName(toLang)}.
Keep translations concise and appropriate for user interface elements.
Maintain the same tone and formality level as the original.
For technical terms, use commonly accepted translations in the target language.
Return ONLY the translations, one per line, in the same order:

${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}`;

      const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional UI/UX translator specializing in software interfaces. Translate accurately while keeping text concise and user-friendly. Maintain consistency with common UI patterns and terminology."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: Math.min(4000, texts.length * 100)
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
              
              // Ensure we have the right number of translations
              if (translations.length < texts.length) {
                // Pad with original texts if some translations are missing
                while (translations.length < texts.length) {
                  translations.push(texts[translations.length]);
                }
              }
              
              resolve(translations.slice(0, texts.length));
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

  // Translate with Google (placeholder - would need implementation)
  async translateWithGoogle(texts, fromLang, toLang) {
    // Google Translate API implementation would go here
    // For now, fall back to MyMemory
    print('    ⚠️  Google Translate not yet implemented, using MyMemory', 'yellow');
    return await this.translateWithMyMemory(texts, fromLang, toLang);
  }

  // Translate with MyMemory - Enhanced with better error handling
  async translateWithMyMemory(texts, fromLang, toLang) {
    const translations = [];
    
    for (const text of texts) {
      try {
        const translation = await this.translateSingleMyMemory(text, fromLang, toLang);
        translations.push(translation);
      } catch (error) {
        print(`      ⚠️  Failed to translate: "${text.substring(0, 30)}..."`, 'dim');
        translations.push(text); // Fallback to original
      }
    }
    
    return translations;
  }

  // Single translation with MyMemory - Enhanced
  async translateSingleMyMemory(text, fromLang, toLang) {
    return new Promise((resolve, reject) => {
      // Skip translation if text is too short or seems like code
      if (text.length < 2 || /^[A-Z_]+$/.test(text) || /^\d+$/.test(text)) {
        resolve(text);
        return;
      }
      
      const query = encodeURIComponent(text);
      const langPair = `${fromLang}|${toLang}`;
      
      const options = {
        hostname: 'api.mymemory.translated.net',
        path: `/get?q=${query}&langpair=${langPair}`,
        method: 'GET',
        headers: {
          'User-Agent': 'ProjectTool/4.1 Translation Manager'
        },
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.responseStatus === 200 && result.responseData && result.responseData.translatedText) {
              const translated = result.responseData.translatedText;
              
              // Basic quality check - if translation is identical to original and 
              // languages are different, it might be a poor translation
              if (translated.toLowerCase() === text.toLowerCase() && fromLang !== toLang) {
                // Still accept it, but it might not be a real translation
                resolve(translated);
              } else {
                resolve(translated);
              }
            } else {
              reject(new Error('Translation failed'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Translation request timed out'));
      });
      
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

  // Test API connection
  async testApiConnection(apiType = null) {
    const testApi = apiType || this.api;
    
    if (!testApi || !this.apiConfig[testApi].available) {
      return { success: false, error: 'API not available or configured' };
    }
    
    try {
      print(`🔍 Testing ${this.apiConfig[testApi].name} connection...`, 'cyan');
      
      const testText = ['Hello'];
      let result;
      
      switch (testApi) {
        case 'openai':
          result = await this.translateWithOpenAI(testText, 'en', 'es');
          break;
        case 'google':
          result = await this.translateWithGoogle(testText, 'en', 'es');
          break;
        case 'mymemory':
          result = await this.translateWithMyMemory(testText, 'en', 'es');
          break;
      }
      
      if (result && result.length > 0) {
        print(`✅ ${this.apiConfig[testApi].name} connection successful`, 'green');
        print(`   Test result: "Hello" → "${result[0]}"`, 'dim');
        return { success: true, result: result[0] };
      } else {
        return { success: false, error: 'No translation result received' };
      }
      
    } catch (error) {
      print(`❌ ${this.apiConfig[testApi].name} connection failed: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }

  // Get usage statistics (for future implementation)
  getUsageStats() {
    return {
      totalTranslations: 0, // Would track actual usage
      apiCalls: 0,
      charactersTranslated: 0,
      averageTime: 0
    };
  }
}

module.exports = TranslationTranslator;