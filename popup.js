document.addEventListener('DOMContentLoaded', function() {
    const savedPromptsDiv = document.getElementById('savedPrompts');
    const clearPromptsButton = document.getElementById('clearPrompts');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const apiStatusDiv = document.getElementById('apiStatus');
  
    // Load saved prompts
    function loadSavedPrompts() {
      chrome.storage.sync.get(['savedPrompts'], function(result) {
        const prompts = result.savedPrompts || [];
        
        if (prompts.length === 0) {
          savedPromptsDiv.innerHTML = '<div class="status">No saved prompts yet</div>';
          return;
        }
  
        savedPromptsDiv.innerHTML = '';
        prompts.forEach((prompt, index) => {
          const promptDiv = document.createElement('div');
          promptDiv.className = 'prompt-item';
          promptDiv.innerHTML = `
            <div class="prompt-text">${prompt.text}</div>
            <div class="prompt-meta">${prompt.timestamp}</div>
          `;
          
          promptDiv.addEventListener('click', function() {
            // Copy to clipboard
            navigator.clipboard.writeText(prompt.text).then(function() {
              promptDiv.style.background = 'rgba(144, 238, 144, 0.3)';
              setTimeout(() => {
                promptDiv.style.background = 'rgba(255, 255, 255, 0.1)';
              }, 500);
            });
          });
          
          savedPromptsDiv.appendChild(promptDiv);
        });
      });
    }
  
    // Clear all prompts
    clearPromptsButton.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all saved prompts?')) {
        chrome.storage.sync.set({ savedPrompts: [] }, function() {
          loadSavedPrompts();
        });
      }
    });
  
    // Load API key status
    function loadApiKeyStatus() {
      chrome.storage.sync.get(['GEMINI_API_KEY'], function(result) {
        const apiKey = result.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
          apiStatusDiv.textContent = '✅ API key configured';
          apiStatusDiv.style.color = '#90EE90';
        } else {
          apiStatusDiv.textContent = '❌ No API key configured';
          apiStatusDiv.style.color = '#FFB6C1';
        }
      });
    }
  
    // Save API key
    saveApiKeyButton.addEventListener('click', function() {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        chrome.storage.sync.set({ GEMINI_API_KEY: apiKey }, function() {
          apiKeyInput.value = '';
          loadApiKeyStatus();
          apiStatusDiv.textContent = '✅ API key saved successfully!';
          apiStatusDiv.style.color = '#90EE90';
        });
      }
    });
  
    // Load initial data
    loadSavedPrompts();
    loadApiKeyStatus();
  
    // Listen for storage changes
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (changes.savedPrompts) {
        loadSavedPrompts();
      }
      if (changes.GEMINI_API_KEY) {
        loadApiKeyStatus();
      }
    });
  });