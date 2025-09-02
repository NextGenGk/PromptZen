class AIAssistant {
  constructor() {
    this.apiKey = null;
    this.config = null;
    this.buttonContainer = null;
    this.currentTextarea = null;
    this.safetyFilter = new SafetyFilter();
    this.init();
  }

  async init() {
    // Wait for config to load
    await this.loadConfig();

    // Wait for page to load and then inject buttons
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.injectButtons());
    } else {
      this.injectButtons();
    }

    // Watch for dynamic content changes
    this.observeChanges();
  }

  async loadConfig() {
    // Wait for config to be available
    let attempts = 0;
    while (!window.AppConfig && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.AppConfig) {
      this.config = window.AppConfig;
      this.apiKey = await this.config.getApiKey();
      console.log(
        "Config loaded, API key available:",
        this.apiKey && this.apiKey !== "YOUR_GEMINI_API_KEY_HERE"
      );
    } else {
      console.error("Failed to load config");
      this.apiKey = "YOUR_GEMINI_API_KEY_HERE";
    }
  }

  observeChanges() {
    const observer = new MutationObserver(() => {
      // Add delay for ChatGPT's dynamic loading
      if (
        window.location.hostname.includes("openai.com") ||
        window.location.hostname.includes("chatgpt.com")
      ) {
        setTimeout(() => this.injectButtons(), 500);
      } else {
        this.injectButtons();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also try injection periodically for ChatGPT
    if (
      window.location.hostname.includes("openai.com") ||
      window.location.hostname.includes("chatgpt.com")
    ) {
      setInterval(() => {
        if (!document.querySelector(".ai-assistant-buttons")) {
          this.injectButtons();
        }
      }, 2000);
    }
  }

  findTextarea() {
    // Platform-specific selectors
    const platformSelectors = {
      "chat.openai.com": [
        "#prompt-textarea",
        'textarea[data-id="root"]',
        'textarea[placeholder*="Message"]',
        'div[contenteditable="true"][data-id="root"]',
        'div[contenteditable="true"]',
        "textarea[rows]",
        "textarea",
        '[data-testid="composer-text-input"]',
        '[data-testid="composer"] textarea',
        "form textarea",
        "main textarea",
      ],
      "claude.ai": ['div[contenteditable="true"]', "textarea", ".ProseMirror"],
      "gemini.google.com": [
        'textarea[aria-label*="Enter a prompt"]',
        'div[contenteditable="true"]',
        "textarea",
      ],
      "chat.mistral.ai": [
        'textarea[placeholder*="Ask"]',
        'div[contenteditable="true"]',
        "textarea",
      ],
      "www.perplexity.ai": [
        'textarea[placeholder*="Ask"]',
        'div[contenteditable="true"]',
        "textarea",
      ],
      "poe.com": [
        'textarea[placeholder*="Talk"]',
        'div[contenteditable="true"]',
        "textarea",
      ],
      "copilot.microsoft.com": [
        'textarea[placeholder*="Ask"]',
        'div[contenteditable="true"]',
        "textarea",
      ],
      "you.com": [
        'textarea[placeholder*="Ask"]',
        'div[contenteditable="true"]',
        "textarea",
      ],
      "character.ai": [
        'textarea[placeholder*="Type"]',
        'div[contenteditable="true"]',
        "textarea",
      ],
      "chatgpt.com": [
        "#prompt-textarea",
        'textarea[data-id="root"]',
        'textarea[placeholder*="Message"]',
        'div[contenteditable="true"][data-id="root"]',
        'div[contenteditable="true"]',
        "textarea[rows]",
        "textarea",
        '[data-testid="composer-text-input"]',
        '[data-testid="composer"] textarea',
        "form textarea",
        "main textarea",
      ],
    };

    // Get current domain
    const domain = window.location.hostname;

    // Try platform-specific selectors first
    if (platformSelectors[domain]) {
      for (const selector of platformSelectors[domain]) {
        const element = document.querySelector(selector);
        if (element && this.isVisible(element)) {
          return element;
        }
      }
    }

    // Special handling for ChatGPT
    if (domain.includes("openai.com") || domain.includes("chatgpt.com")) {
      console.log("Searching for ChatGPT textarea...");
      // Try all possible textarea elements
      const allTextareas = document.querySelectorAll("textarea");
      console.log(`Found ${allTextareas.length} textareas`);

      for (const textarea of allTextareas) {
        if (this.isVisible(textarea) && this.isInputElement(textarea)) {
          console.log("Selected ChatGPT textarea:", textarea);
          return textarea;
        }
      }

      // Try contenteditable divs
      const allContentEditable = document.querySelectorAll(
        'div[contenteditable="true"]'
      );
      console.log(`Found ${allContentEditable.length} contenteditable divs`);

      for (const div of allContentEditable) {
        if (this.isVisible(div) && this.isInputElement(div)) {
          console.log("Selected ChatGPT contenteditable:", div);
          return div;
        }
      }
    }

    // Fallback to generic selectors
    const genericSelectors = [
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="type" i]',
      'textarea[placeholder*="chat" i]',
      'textarea[placeholder*="talk" i]',
      'div[contenteditable="true"]',
      "textarea:not([type])",
      '[role="textbox"]',
      "textarea",
    ];

    for (const selector of genericSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (this.isVisible(element) && this.isInputElement(element)) {
          return element;
        }
      }
    }

    return null;
  }

  isInputElement(element) {
    // Check if element is likely an input field
    const rect = element.getBoundingClientRect();
    const isLargeEnough = rect.width > 100 && rect.height > 20;
    const isNotHidden = !element.hidden && element.style.display !== "none";
    const isNotReadonly = !element.readOnly && !element.disabled;

    return isLargeEnough && isNotHidden && isNotReadonly;
  }

  isVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  injectButtons() {
    // Skip if buttons already exist
    if (document.querySelector(".ai-assistant-buttons")) return;

    const textarea = this.findTextarea();
    if (!textarea) {
      console.log("No textarea found on", window.location.hostname);
      return;
    }

    if (textarea.dataset.aiAssistantInjected) return;

    console.log("Found textarea:", textarea);
    textarea.dataset.aiAssistantInjected = "true";
    this.currentTextarea = textarea;

    // Create button container
    this.buttonContainer = document.createElement("div");
    this.buttonContainer.className = "ai-assistant-buttons";

    // Create buttons with enhanced safety
    const buttons = [
      {
        id: "perfect",
        text: "✨ Enhance",
        action: this.enhancePrompt.bind(this),
      },
      { id: "save", text: "💾 Save", action: this.savePrompt.bind(this) },
      {
        id: "grammar",
        text: "📝 Grammar",
        action: this.checkGrammar.bind(this),
      },
      {
        id: "summary",
        text: "📄 Summary",
        action: this.summarizePage.bind(this),
      },
      {
        id: "translate",
        text: "🌐 Translate",
        action: this.translateText.bind(this),
      },
      {
        id: "tone",
        text: "🎯 Professional",
        action: this.adjustTone.bind(this),
      },
    ];

    buttons.forEach((button) => {
      const btn = document.createElement("button");
      btn.className = "ai-assistant-btn";
      btn.textContent = button.text;
      btn.onclick = button.action;
      this.buttonContainer.appendChild(btn);
    });

    // Find the best place to insert buttons
    this.insertButtonContainer(textarea);
  }

  insertButtonContainer(textarea) {
    try {
      // Try different insertion strategies based on the platform
      const domain = window.location.hostname;

      if (domain.includes("openai.com") || domain.includes("chatgpt.com")) {
        // ChatGPT specific insertion - try multiple strategies
        console.log("ChatGPT detected, trying insertion strategies...");

        // Strategy 1: Look for the composer container
        let container = textarea.closest('[data-testid="composer"]');
        if (container) {
          console.log("Found composer container");
          container.insertBefore(this.buttonContainer, container.firstChild);
          return;
        }

        // Strategy 2: Look for form container
        container = textarea.closest("form");
        if (container) {
          console.log("Found form container");
          container.insertBefore(this.buttonContainer, container.firstChild);
          return;
        }

        // Strategy 3: Look for main chat container
        container =
          textarea.closest("main") || textarea.closest('[role="main"]');
        if (container) {
          const chatInput =
            container.querySelector('form, [data-testid="composer"]') ||
            textarea.parentElement;
          if (chatInput) {
            console.log("Found main container, inserting before chat input");
            chatInput.parentElement.insertBefore(
              this.buttonContainer,
              chatInput
            );
            return;
          }
        }

        // Strategy 4: Look for any parent with sufficient height
        let parent = textarea.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          if (parent.offsetHeight > 100 && parent.offsetWidth > 300) {
            console.log(`Found suitable parent at level ${i}`);
            parent.insertBefore(this.buttonContainer, parent.firstChild);
            return;
          }
          parent = parent.parentElement;
        }

        // Strategy 5: Direct insertion above textarea
        console.log("Using direct insertion strategy");
        textarea.parentElement.insertBefore(this.buttonContainer, textarea);
        return;
      }

      if (domain.includes("claude.ai")) {
        // Claude specific insertion
        const chatContainer =
          textarea.closest(".relative") || textarea.parentElement;
        if (chatContainer) {
          chatContainer.insertBefore(this.buttonContainer, textarea);
          return;
        }
      }

      // Generic insertion strategy
      let parent = textarea.parentElement;
      let insertionPoint = textarea;

      // Try to find a better container
      for (let i = 0; i < 3 && parent; i++) {
        if (parent.offsetHeight > textarea.offsetHeight * 1.5) {
          insertionPoint = parent.children[0] || textarea;
          break;
        }
        parent = parent.parentElement;
      }

      // Insert the buttons
      if (insertionPoint.parentElement) {
        insertionPoint.parentElement.insertBefore(
          this.buttonContainer,
          insertionPoint
        );
      } else {
        textarea.parentElement.insertBefore(this.buttonContainer, textarea);
      }
    } catch (error) {
      console.log("Button insertion error:", error);
      // Fallback: just insert before textarea
      try {
        textarea.parentElement.insertBefore(this.buttonContainer, textarea);
      } catch (fallbackError) {
        console.log("Fallback insertion failed:", fallbackError);
      }
    }
  }

  async callGeminiAPI(prompt, systemPrompt = "", isUserGenerated = true) {
    // Pre-filter user input for safety
    if (isUserGenerated && !this.safetyFilter.isContentSafe(prompt)) {
      alert("Content contains potentially harmful material. Please modify your input and try again.");
      return null;
    }

    // Get fresh API key in case it was updated
    if (this.config) {
      this.apiKey = await this.config.getApiKey();
    }

    if (!this.apiKey || this.apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      alert(
        "Please configure your Gemini API key in the extension popup first!"
      );
      return null;
    }

    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const model = this.config
        ? await this.config.getModel()
        : "gemini-1.5-flash-latest";
      const temperature = Math.min(this.config
        ? await this.config.getTemperature()
        : 0.3, 0.3); // Cap temperature at 0.3 for more predictable outputs
      const maxTokens = Math.min(this.config ? await this.config.getMaxTokens() : 1024, 2048);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: temperature,
              topK: 1,
              topP: 0.8, // Reduce randomness
              maxOutputTokens: maxTokens,
              stopSequences: ["<END>", "STOP", "###"], // Add stop sequences
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_LOW_AND_ABOVE", // Stricter filtering
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_LOW_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_LOW_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_LOW_AND_ABOVE",
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        alert(`API Error: ${errorData.error?.message || "Unknown error"}`);
        return null;
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (
          candidate.content &&
          candidate.content.parts &&
          candidate.content.parts.length > 0
        ) {
          const generatedText = candidate.content.parts[0].text;
          
          // Post-filter the generated content
          if (!this.safetyFilter.isContentSafe(generatedText)) {
            console.warn("Generated content filtered for safety");
            alert("Generated content was filtered for safety. Please try rephrasing your request.");
            return null;
          }
          
          return generatedText;
        }
      }

      // Check if content was blocked
      if (data.candidates && data.candidates[0]?.finishReason === "SAFETY") {
        alert(
          "Content was blocked by safety filters. Please try rephrasing your request in a more neutral way."
        );
        return null;
      }

      console.error("Unexpected API response structure:", data);
      alert("Unexpected response from API. Please try again.");
      return null;
    } catch (error) {
      console.error("Gemini API error:", error);
      alert(`Error calling AI service: Please try again later.`);
      return null;
    }
  }

  async enhancePrompt() {
    const text = this.getTextareaValue();
    if (!text.trim()) {
      alert("Please enter some text first");
      return;
    }

    console.log("Enhancing prompt:", text);
    this.showLoading("perfect");

    const systemPrompt = `You are a helpful writing assistant. Improve the following text to be more clear, professional, and well-structured. Focus on clarity, proper grammar, and constructive communication. Do not include any harmful, offensive, or inappropriate content. Return only the improved text without explanations or additional commentary.

Guidelines:
- Make the text more professional and clear
- Correct any grammar or spelling errors  
- Ensure the tone is respectful and constructive
- Keep the original meaning and intent
- Do not add controversial or sensitive topics`;

    const improvedPrompt = await this.callGeminiAPI(text, systemPrompt);
    console.log("Enhanced prompt result:", improvedPrompt);

    if (improvedPrompt) {
      this.setTextareaValue(improvedPrompt);
    } else {
      alert("Failed to enhance text. Please try again.");
    }

    this.hideLoading("perfect");
  }

  async checkGrammar() {
    const text = this.getTextareaValue();
    if (!text.trim()) {
      alert("Please enter some text first");
      return;
    }

    this.showLoading("grammar");

    const systemPrompt = `You are a professional grammar checker. Correct any grammar, spelling, punctuation, or syntax errors in the following text. Maintain the original meaning and tone while making it grammatically correct and well-structured. Return only the corrected text without explanations.

Guidelines:
- Fix grammar, spelling, and punctuation errors
- Improve sentence structure and clarity  
- Maintain the original meaning and intent
- Keep the tone appropriate and professional
- Do not add new content or change the core message`;

    const correctedText = await this.callGeminiAPI(text, systemPrompt);

    if (correctedText) {
      this.setTextareaValue(correctedText);
    }

    this.hideLoading("grammar");
  }

  async adjustTone() {
    const text = this.getTextareaValue();
    if (!text.trim()) {
      alert("Please enter some text first");
      return;
    }

    this.showLoading("tone");

    const systemPrompt = `You are a professional communication specialist. Rewrite the following text in a professional, respectful, and constructive tone suitable for business or formal communication. Maintain the core message while making it more polished and appropriate.

Guidelines:
- Use professional and respectful language
- Remove any casual or informal expressions
- Ensure the tone is constructive and positive
- Maintain clarity and directness
- Keep the original intent and key information
- Make it suitable for professional environments`;

    const professionalText = await this.callGeminiAPI(text, systemPrompt);

    if (professionalText) {
      this.setTextareaValue(professionalText);
    }

    this.hideLoading("tone");
  }

  async summarizePage() {
    this.showLoading("summary");

    // Get page content safely
    const pageContent = this.safetyFilter.sanitizeContent(
      document.body.innerText.slice(0, 3000)
    ); 
    const pageTitle = document.title;

    const systemPrompt = `You are a helpful content summarizer. Create a concise, professional summary of the webpage content provided. Focus on key information and main points. Keep the summary factual, neutral, and informative.

Guidelines:
- Summarize in 2-3 clear, concise sentences
- Focus on factual information and main points
- Use professional and neutral language
- Avoid speculation or personal opinions
- Keep it informative and helpful`;

    const prompt = `Page Title: ${pageTitle}\n\nContent: ${pageContent}`;

    const summary = await this.callGeminiAPI(prompt, systemPrompt, false);

    if (summary) {
      const currentText = this.getTextareaValue();
      const newText = currentText
        ? `${currentText}\n\nPage Summary: ${summary}`
        : `Page Summary: ${summary}`;
      this.setTextareaValue(newText);
    }

    this.hideLoading("summary");
  }

  savePrompt() {
    const text = this.getTextareaValue();
    if (!text.trim()) {
      alert("No text to save");
      return;
    }

    // Safety check before saving
    if (!this.safetyFilter.isContentSafe(text)) {
      alert("Cannot save content that contains potentially harmful material.");
      return;
    }

    // Get existing saved prompts
    chrome.storage.sync.get(["savedPrompts"], (result) => {
      const savedPrompts = result.savedPrompts || [];
      const timestamp = new Date().toLocaleString();

      savedPrompts.unshift({
        text: text,
        timestamp: timestamp,
        url: window.location.href,
      });

      // Keep only last 25 prompts (reduced from 50 for better performance)
      if (savedPrompts.length > 25) {
        savedPrompts.splice(25);
      }

      chrome.storage.sync.set({ savedPrompts }, () => {
        alert("Text saved successfully!");
      });
    });
  }

  getTextareaValue() {
    if (!this.currentTextarea) return "";
    
    if (this.currentTextarea.tagName === "TEXTAREA") {
      return this.currentTextarea.value;
    } else {
      return this.currentTextarea.textContent || this.currentTextarea.innerText || "";
    }
  }

  setTextareaValue(value) {
    if (!this.currentTextarea || !value) return;

    try {
      if (this.currentTextarea.tagName === "TEXTAREA") {
        this.currentTextarea.value = value;
        this.currentTextarea.focus();
      } else {
        // For contenteditable divs
        this.currentTextarea.textContent = value;
        this.currentTextarea.focus();

        // Try to set cursor at end
        if (window.getSelection && document.createRange) {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(this.currentTextarea);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }

      // Trigger multiple events to ensure the page detects the change
      const events = ["input", "change", "keyup", "paste"];
      events.forEach((eventType) => {
        this.currentTextarea.dispatchEvent(
          new Event(eventType, {
            bubbles: true,
            cancelable: true,
          })
        );
      });

      // Also try InputEvent for modern browsers
      if (typeof InputEvent !== "undefined") {
        this.currentTextarea.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            cancelable: true,
            inputType: "insertText",
            data: value,
          })
        );
      }
    } catch (error) {
      console.log("Error setting textarea value:", error);
      // Fallback: just set the value
      if (this.currentTextarea.tagName === "TEXTAREA") {
        this.currentTextarea.value = value;
      } else {
        this.currentTextarea.textContent = value;
      }
    }
  }

  showLoading(buttonId) {
    const button = this.buttonContainer.querySelector(
      `button:nth-child(${this.getButtonIndex(buttonId)})`
    );
    if (button) {
      button.disabled = true;
      button.classList.add('loading');
      button.textContent = "⏳ Processing...";
    }
  }

  hideLoading(buttonId) {
    const button = this.buttonContainer.querySelector(
      `button:nth-child(${this.getButtonIndex(buttonId)})`
    );
    if (!button) return;
    
    button.disabled = false;
    button.classList.remove('loading');

    const buttonTexts = {
      perfect: "✨ Enhance",
      save: "💾 Save",
      grammar: "📝 Grammar",
      summary: "📄 Summary",
      translate: "🌐 Translate",
      tone: "🎯 Professional",
    };

    button.textContent = buttonTexts[buttonId];
  }

  async translateText() {
    const text = this.getTextareaValue();
    if (!text.trim()) {
      alert("Please enter some text to translate");
      return;
    }

    this.showLoading('translate');
    
    try {
      // Detect language (simple check for English/Hindi)
      const isEnglish = /^[\x00-\x7F]*$/.test(text.replace(/\s/g, ''));
      const targetLanguage = isEnglish ? 'Hindi' : 'English';
      
      const systemPrompt = `You are a professional translator. Translate the following text accurately to ${targetLanguage}. Maintain the original meaning, tone, and context. Provide only the translated text without explanations.

Guidelines:
- Provide accurate, natural translation
- Preserve the original meaning and tone
- Use appropriate formal/informal language based on context
- Return only the translated text
- Ensure cultural sensitivity and appropriateness`;

      const prompt = `Please translate this text to ${targetLanguage}:\n\n${text}`;
      
      const translatedText = await this.callGeminiAPI(prompt, systemPrompt);
      if (translatedText) {
        this.setTextareaValue(translatedText);
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Please try again.');
    } finally {
      this.hideLoading('translate');
    }
  }

  getButtonIndex(buttonId) {
    const indices = { 
      perfect: 1, 
      save: 2, 
      grammar: 3, 
      summary: 4, 
      translate: 5,
      tone: 6
    };
    return indices[buttonId];
  }
}

// Safety Filter Class for content moderation
class SafetyFilter {
  constructor() {
    // Comprehensive patterns for harmful content detection
    this.harmfulPatterns = [
      // Hate speech and discrimination
      /\b(hate|kill|murder|terrorism|terrorist|bomb|weapon|gun|violence)\b/i,
      // Harassment and bullying
      /\b(harass|bully|threaten|stalk|intimidate)\b/i,
      // Sexual content
      /\b(sexual|porn|nude|explicit|adult)\b/i,
      // Self-harm
      /\b(suicide|self.?harm|cut|hurt.?myself)\b/i,
      // Illegal activities
      /\b(drug|illegal|criminal|fraud|scam|hack)\b/i,
      // Personal information patterns
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN pattern
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card pattern
    ];

    // Positive patterns that should be allowed
    this.allowedPatterns = [
      /\b(help|assist|support|learn|study|work|professional|business)\b/i,
      /\b(question|answer|explain|tutorial|guide|advice)\b/i,
    ];
  }

  isContentSafe(text) {
    if (!text || typeof text !== 'string') return true;

    const normalizedText = text.toLowerCase().trim();
    
    // Check for empty or very short content
    if (normalizedText.length < 3) return true;

    // Check for allowed patterns first
    const hasAllowedContent = this.allowedPatterns.some(pattern => pattern.test(text));
    
    // Check for harmful patterns
    const hasHarmfulContent = this.harmfulPatterns.some(pattern => pattern.test(text));
    
    // If has harmful content but no clearly allowed content, block it
    if (hasHarmfulContent && !hasAllowedContent) {
      console.warn("Content blocked by safety filter:", text.substring(0, 100));
      return false;
    }

    // Additional checks for context
    return this.contextualSafetyCheck(normalizedText);
  }

  contextualSafetyCheck(text) {
    // Check for excessive caps (might indicate shouting/aggression)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.6 && text.length > 20) {
      return false;
    }

    // Check for repeated characters (might indicate spam or trolling)
    if (/(.)\1{4,}/.test(text)) {
      return false;
    }

    // Check for excessive punctuation
    if (/[!?]{3,}/.test(text)) {
      return false;
    }

    return true;
  }

  sanitizeContent(text) {
    if (!text) return "";
    
    // Remove potentially harmful patterns while preserving readability
    return text
      .replace(/[^\w\s\.,!?;:()\-'"]/g, '') // Remove special characters
      .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[REDACTED]') // Remove SSN-like patterns
      .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[REDACTED]') // Remove credit card patterns
      .trim();
  }
}

// Initialize the assistant with error handling
try {
  new AIAssistant();
} catch (error) {
  console.error("Failed to initialize AI Assistant:", error);
}