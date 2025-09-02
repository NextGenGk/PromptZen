// Configuration loader for Chrome Extension
// This file loads configuration from Chrome storage

class Config {
    constructor() {
      this.config = {};
      this.initialized = false;
    }
  
    async loadConfig() {
      try {
        // Load from Chrome storage
        const result = await chrome.storage.sync.get([
          'GEMINI_API_KEY',
          'GEMINI_MODEL',
          'GEMINI_TEMPERATURE',
          'GEMINI_MAX_TOKENS',
          'WEB_APP_URL',
          'migrated_from_env'
        ]);
        
        this.config = result;
        
        // One-time migration from .env file if not already migrated
        if (!this.config.migrated_from_env) {
          await this.migrateFromEnvFile();
        }
        
        this.setDefaults();
        this.initialized = true;
      } catch (error) {
        console.error('Error loading config from storage:', error);
        this.setDefaults();
        this.initialized = true;
      }
    }
  
    async migrateFromEnvFile() {
      try {
        console.log('Attempting to migrate from .env file...');
        const envResponse = await fetch(chrome.runtime.getURL('.env'));
        if (envResponse.ok) {
          const envText = await envResponse.text();
          const envConfig = this.parseEnvFile(envText);
          
          // Only migrate if we found an API key
          if (envConfig.GEMINI_API_KEY && envConfig.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            console.log('Migrating API key from .env file...');
            await chrome.storage.sync.set({
              GEMINI_API_KEY: envConfig.GEMINI_API_KEY.replace(/"/g, ''), // Remove quotes
              GEMINI_MODEL: envConfig.GEMINI_MODEL?.replace(/"/g, '') || 'gemini-1.5-flash-latest',
              GEMINI_TEMPERATURE: envConfig.GEMINI_TEMPERATURE || '0.7',
              GEMINI_MAX_TOKENS: envConfig.GEMINI_MAX_TOKENS || '2048',
              migrated_from_env: true
            });
            
            // Reload config after migration
            const result = await chrome.storage.sync.get([
              'GEMINI_API_KEY',
              'GEMINI_MODEL',
              'GEMINI_TEMPERATURE',
              'GEMINI_MAX_TOKENS',
              'WEB_APP_URL'
            ]);
            this.config = result;
            console.log('Migration completed successfully!');
          }
        }
      } catch (error) {
        console.log('Migration from .env failed (this is normal):', error.message);
        // Mark as migrated even if failed to avoid repeated attempts
        await chrome.storage.sync.set({ migrated_from_env: true });
      }
    }
  
    parseEnvFile(envText) {
      const config = {};
      const lines = envText.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            config[key.trim()] = value;
          }
        }
      }
      return config;
    }
  
    async saveConfig(key, value) {
      try {
        await chrome.storage.sync.set({ [key]: value });
        this.config[key] = value;
      } catch (error) {
        console.error('Error saving config:', error);
      }
    }
  
  
  
    setDefaults() {
      // Set default values if not provided
      if (!this.config.GEMINI_API_KEY) {
        this.config.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
      }
      if (!this.config.GEMINI_MODEL) {
        this.config.GEMINI_MODEL = 'gemini-1.5-flash-latest';
      }
      if (!this.config.GEMINI_TEMPERATURE) {
        this.config.GEMINI_TEMPERATURE = '0.7';
      }
      if (!this.config.GEMINI_MAX_TOKENS) {
        this.config.GEMINI_MAX_TOKENS = '2048';
      }
      if (!this.config.WEB_APP_URL) {
        this.config.WEB_APP_URL = 'http://localhost:3000';
      }
    }
  
    async ensureInitialized() {
      if (!this.initialized) {
        await this.loadConfig();
      }
    }
  
    async get(key) {
      await this.ensureInitialized();
      return this.config[key];
    }
  
    async getApiKey() {
      await this.ensureInitialized();
      return this.config.GEMINI_API_KEY;
    }
  
    async getModel() {
      await this.ensureInitialized();
      return this.config.GEMINI_MODEL;
    }
  
    async getTemperature() {
      await this.ensureInitialized();
      return parseFloat(this.config.GEMINI_TEMPERATURE);
    }
  
    async getMaxTokens() {
      await this.ensureInitialized();
      return parseInt(this.config.GEMINI_MAX_TOKENS);
    }
  
    async getWebAppUrl() {
      await this.ensureInitialized();
      return this.config.WEB_APP_URL;
    }
  }
  
  // Create global config instance
  window.AppConfig = new Config();