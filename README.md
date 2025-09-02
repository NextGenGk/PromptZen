# AI Chat Assistant Chrome Extension

A Chrome extension that enhances AI chat platforms (ChatGPT, Claude, Gemini, etc.) with helpful buttons for prompt perfection, grammar checking, saving prompts, and page summarization.

## Features

- **✨ Perfect**: Improve your prompts using Gemini AI for better clarity and effectiveness
- **💾 Save**: Save your current prompts for later use
- **📝 Grammar**: Check and fix grammar, spelling, and punctuation errors
- **📄 Summary**: Summarize the current webpage content

## Installation

1. Clone or download this repository
2. Load the extension in Chrome (see instructions below)
3. Configure your Gemini API key through the extension popup

**Quick Setup:**
1. Load the extension in Chrome
2. Click the extension icon in the toolbar
3. Enter your Gemini API key in the popup
4. Click "Save API Key"

## Supported Platforms

- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Google Bard (bard.google.com)

## How to Use

1. Visit any supported AI chat platform
2. Look for the button bar that appears above text input areas
3. Type your message and use the buttons:
   - **Perfect**: Enhances your prompt for better AI responses
   - **Save**: Stores your prompt in the extension for later use
   - **Grammar**: Fixes any grammar or spelling mistakes
   - **Summary**: Adds a summary of the current page to your prompt

## Setup Instructions

### Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### Configuring the Extension

1. After loading the extension, click the extension icon in Chrome's toolbar
2. In the popup that opens, paste your API key in the "API Configuration" section
3. Click "Save API Key"
4. You should see "✅ API key configured" status

### Loading the Extension

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Toggle "Developer mode" ON (top right corner)
4. Click "Load unpacked"
5. Select the folder containing these extension files
6. The extension should now appear in your extensions list

## File Structure

```
├── manifest.json          # Extension configuration
├── content.js            # Main functionality script
├── styles.css            # Button styling
├── popup.html            # Settings popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
└── README.md             # This file
```

## Privacy & Security

- Your API key is stored securely in Chrome's sync storage (syncs across your Chrome browsers)
- No data is sent to external servers except direct Gemini API calls
- Saved prompts are stored locally in your browser
- The extension only activates on supported AI chat platforms
- Your API key never leaves your browser except for direct API calls to Google

## Troubleshooting

**Buttons not appearing?**
- Refresh the page after installing the extension
- Make sure you're on a supported platform
- Check that the extension is enabled in Chrome

**API calls failing?**
- Verify your Gemini API key is correct in the extension popup
- Check your internet connection
- Ensure you haven't exceeded API rate limits
- Try clicking the extension icon and re-entering your API key

**Grammar/Perfect features not working?**
- Make sure you've entered a valid Gemini API key
- Try refreshing the page
- Check the browser console for error messages

## Development

To modify or extend this extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on supported platforms

## License

This project is open source and available under the MIT License.