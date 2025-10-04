# UI Sanity Testing Guide - AI Knowledge Base

This document provides a comprehensive testing checklist for the AI Knowledge Base application to ensure all interactive functionality works correctly.

## Prerequisites

Before running tests, ensure:
1. The Express server is running on port 8085
2. Playwright browser automation tools are available
3. All dependencies are installed

## Quick Setup Commands

```bash
# Start the server
node server.js

# The application will be available at http://localhost:8085
```

## Test Categories

### 1. 🤖 AI Chat Assistant Sanity Test (Priority Test)

> **Note**: This test should be performed FIRST to ensure the AI assistant is working before testing other features.

#### Test 1.1: Initial AI Chat Activation
- **Action**: Locate and activate the AI chat widget
- **Steps**:
  1. Navigate to `http://localhost:8085`
  2. Look for the AI chat widget (FastBots.ai integration)
  3. Click on the "Push to talk" button or chat icon
- **Expected Results**:
  - ✅ Chat widget opens successfully
  - ✅ AI greeting message appears (Nordic/Odin-themed personality)
  - ✅ Chat input field is functional
  - ✅ Send button is accessible

#### Test 1.2: AI Response Quality Test - Question 1
- **Action**: Test AI understanding with first sanity question
- **Steps**:
  1. Type in chat: "What is this AI Knowledge Base website about?"
  2. Click send button
  3. Wait for response
- **Expected Results**:
  - ✅ Message sends successfully
  - ✅ AI responds within 10 seconds
  - ✅ Response is relevant to the website content
  - ✅ Response mentions AI/artificial intelligence topics
  - ✅ Response quality is appropriate (coherent, helpful)

#### Test 1.3: AI Response Quality Test - Question 2
- **Action**: Test AI knowledge with second sanity question
- **Steps**:
  1. Type in chat: "Can you help me learn about machine learning basics?"
  2. Click send button
  3. Wait for response
- **Expected Results**:
  - ✅ AI provides informative response about machine learning
  - ✅ Response demonstrates knowledge of AI/ML concepts
  - ✅ Response is structured and easy to understand
  - ✅ Chat history maintains previous conversation context
  - ✅ No technical errors in the chat interface

#### Test 1.4: Chat Interface Functionality
- **Action**: Test chat interface features
- **Steps**:
  1. Try copying a message using copy button
  2. Check if chat scrolls properly with multiple messages
  3. Test chat widget closing/reopening
- **Expected Results**:
  - ✅ Copy functionality works
  - ✅ Chat history persists during session
  - ✅ Chat interface remains responsive
  - ✅ Widget can be closed and reopened successfully

> **Critical**: If AI chat tests fail, document the specific failure and continue with other tests. AI chat functionality is essential for user assistance.

### 2. 🌐 Basic Application Loading

#### Test 1.1: Initial Page Load
- **Action**: Navigate to `http://localhost:8085`
- **Expected Results**:
  - ✅ Page loads without errors
  - ✅ Hebrew interface displays correctly (default language)
  - ✅ Navigation sidebar is visible
  - ✅ Hot news section loads
  - ✅ All CSS styles are applied properly
  - ✅ No console errors in browser

#### Test 1.2: Page Title and Meta Tags
- **Action**: Check page metadata
- **Expected Results**:
  - ✅ Page title displays correctly
  - ✅ Meta description is set
  - ✅ Language attribute matches content (`lang="he"`)

### 2. 🔤 Language Switching Functionality

#### Test 2.1: Language Selector Access
- **Action**: Locate and click the language selector dropdown
- **Expected Results**:
  - ✅ Language selector is visible in top-right corner
  - ✅ Dropdown opens showing both English (🇺🇸) and Hebrew (🇮🇱) options
  - ✅ Current language is marked as selected

#### Test 2.2: Language Switch to English
- **Action**: Select English from the language dropdown
- **Expected Results**:
  - ✅ URL updates to include `?lang=en`
  - ✅ Page title changes to English
  - ✅ All navigation elements switch to English
  - ✅ Main content switches to English
  - ✅ English option shows as selected in dropdown

#### Test 2.3: Language Switch Back to Hebrew
- **Action**: Select Hebrew from the language dropdown
- **Expected Results**:
  - ✅ URL updates to include `?lang=he` or removes lang parameter
  - ✅ All content reverts to Hebrew
  - ✅ Hebrew option shows as selected

### 3. 🧭 Navigation System Testing

#### Test 3.1: Knowledge Section Navigation
- **Action**: Click through each Knowledge section link
- **Test Links**:
  - "Fundamentals of Artificial Intelligence" (`#/ai-basics`)
  - "Advanced Concepts" (`#/advanced_concepts`)
  - "Advanced Techniques" (`#/techniques`)
  - "Evaluation Metrics" (`#/evaluation_metrics`)
  - "Tools and Libraries" (`#/tools_and_libraries`)
  - "Key Applications of Artificial Intelligence" (`#/applications`)
  - "Future Trends in Artificial Intelligence" (`#/future_trends`)

- **Expected Results**:
  - ✅ URL updates correctly with hash routing
  - ✅ Page title updates for each section
  - ✅ Active state shows on clicked navigation item
  - ✅ Content loads for each section (or shows "No matching content found" for unimplemented sections)

#### Test 3.2: Links Section Navigation
- **Action**: Test Links section navigation
- **Test Links**:
  - "Language Tools" (`#/chat-tools`)
  - "Open-Source Libraries/Tools" (`#/libraries`)
  - "Graphics Tools" (`#/graphics`)
  - "Articles" (`#/articles`)
  - "Educational Resources" (`#/educational-resources`)
  - "Productivity Tools" (`#/productivity`)

#### Test 3.3: Special Sections Navigation
- **Action**: Test Special Sections navigation
- **Test Links**:
  - "Generate Prompts and Voice" (`#/text-generation`)
  - "Token Calculator" (`#/calculator`)

#### Test 3.4: Hot News Navigation
- **Action**: Click "View Hot News" (`#/hot-news`)
- **Expected Results**:
  - ✅ Navigates to hot news page
  - ✅ Displays comprehensive AI news content
  - ✅ News sections and articles load properly

### 4. 📰 Hot News Interactive Features

#### Test 4.1: News Section Browsing
- **Action**: Navigate to hot news and browse different sections
- **Expected Results**:
  - ✅ Multiple news categories are visible (MCP Ecosystem, LLMs, etc.)
  - ✅ News articles display with titles and content
  - ✅ External links work correctly
  - ✅ Images load properly with lazy loading

#### Test 4.2: News Category Links
- **Action**: Click on different news category links
- **Expected Results**:
  - ✅ Category sections expand/collapse or navigate correctly
  - ✅ Related articles display properly

### 5. 🔢 Token Calculator Testing

#### Test 5.1: Calculator Page Access
- **Action**: Navigate to Token Calculator section
- **Expected Results**:
  - ✅ Calculator page loads (`#/calculator`)
  - ✅ Page title updates to "Token Calculator"
  - ✅ Description text about tokens displays
  - ✅ Input field and "Calculate Tokens" button are visible

#### Test 5.2: Token Calculation Functionality
- **Action**: Test token calculation
- **Steps**:
  1. Enter text in the input field: "Hello, this is a test message to see how many tokens are needed for this text!"
  2. Click "Calculate Tokens" button
- **Expected Results**:
  - ✅ Text is accepted in input field
  - ✅ Button processes the request
  - ✅ Token count is returned (expected: ~18 tokens)
  - ✅ Console shows successful API communication
  - ✅ No errors in the process

#### Test 5.3: Edge Cases for Token Calculator
- **Action**: Test with different inputs
- **Test Cases**:
  - Empty input
  - Very long text (1000+ characters)
  - Special characters and emojis
  - Different languages (Hebrew, English)

### 6. 💬 AI Text Generation Testing

#### Test 6.1: Text Generation Page Access
- **Action**: Navigate to "Generate Prompts and Voice" section
- **Expected Results**:
  - ✅ Page loads (`#/text-generation`)
  - ✅ GPT-4o-mini Text Generator interface displays
  - ✅ API key input field is visible
  - ✅ Prompt input field is visible
  - ✅ "Generate Text" button is visible

#### Test 6.2: Text Generation Interface Validation
- **Action**: Test the interface without API key
- **Steps**:
  1. Enter a prompt without API key
  2. Click "Generate Text"
- **Expected Results**:
  - ✅ Validation message appears requesting API key and prompt
  - ✅ No server request is made without required fields

#### Test 6.3: Text Generation with Valid Inputs (Optional - requires API key)
- **Action**: If API key is available, test text generation
- **Steps**:
  1. Enter valid OpenAI API key
  2. Enter test prompt: "Explain artificial intelligence in simple terms"
  3. Click "Generate Text"
- **Expected Results**:
  - ✅ Request is sent to server
  - ✅ Response is received and displayed
  - ✅ Conversation history is maintained
  - ✅ Token usage is tracked (if implemented)

### 7. 📚 Knowledge Base Interactive Content

#### Test 7.1: AI Fundamentals Expandable Content
- **Action**: Navigate to "Fundamentals of Artificial Intelligence" section
- **Expected Results**:
  - ✅ Page loads with AI topic cards
  - ✅ Each topic shows brief description
  - ✅ "More Info" buttons are visible for each topic

#### Test 7.2: More Info Button Functionality
- **Action**: Test expandable content functionality
- **Steps**:
  1. Click "More Info" button on "Artificial Intelligence (AI)" card
  2. Review expanded content
  3. Click "Hide Info" to collapse
- **Expected Results**:
  - ✅ Content expands showing detailed information
  - ✅ Button text changes to "Hide Info"
  - ✅ FAQ section displays
  - ✅ Related concepts links are functional
  - ✅ Content collapses when "Hide Info" is clicked

#### Test 7.3: Related Concept Navigation
- **Action**: Test related concept links in expanded content
- **Steps**:
  1. Expand AI fundamentals content
  2. Click on related concept links (e.g., "machine learning", "neural networks")
- **Expected Results**:
  - ✅ Navigation works to related pages
  - ✅ URLs update correctly
  - ✅ Related content loads (or shows placeholder if not implemented)

### 8. 🤖 AI Chat Assistant Advanced Testing

> **Note**: Basic AI chat sanity testing should already be completed in Test Category 1. These are additional advanced tests.

#### Test 8.1: Chat Widget Responsiveness
- **Action**: Test chat on different screen sizes
- **Expected Results**:
  - ✅ Chat widget adapts to mobile devices
  - ✅ Chat interface remains functional on tablet screens
  - ✅ Desktop experience is optimal

#### Test 8.2: Extended Conversation Testing
- **Action**: Test extended conversation capabilities
- **Steps**:
  1. Continue from previous chat session (if available)
  2. Ask follow-up questions: "Can you elaborate on neural networks?"
  3. Test context retention with: "What did we discuss earlier?"
- **Expected Results**:
  - ✅ AI maintains conversation context
  - ✅ Responses build upon previous exchanges
  - ✅ Chat history persists throughout testing session
  - ✅ AI provides detailed technical explanations when requested

#### Test 8.3: Chat Widget Integration Testing
- **Action**: Test integration with main application
- **Steps**:
  1. Ask AI: "Can you guide me to the token calculator?"
  2. Ask: "What sections are available on this website?"
  3. Test if AI provides relevant navigation assistance
- **Expected Results**:
  - ✅ AI demonstrates knowledge of website features
  - ✅ AI can provide navigation guidance
  - ✅ Responses are contextually relevant to the AI Knowledge Base
  - ✅ Chat widget doesn't interfere with main application functionality

### 9. 📱 Responsive Design Testing

#### Test 9.1: Mobile View Testing
- **Action**: Resize browser to mobile dimensions (375px width)
- **Expected Results**:
  - ✅ Navigation adapts to mobile (hamburger menu or similar)
  - ✅ Content remains readable and accessible
  - ✅ All interactive elements remain functional
  - ✅ Chat widget functions on mobile

#### Test 9.2: Tablet View Testing
- **Action**: Resize browser to tablet dimensions (768px width)
- **Expected Results**:
  - ✅ Layout adapts appropriately
  - ✅ Navigation remains accessible
  - ✅ All functionality works as expected

### 10. 🔗 External Links and RSS Feed Testing

#### Test 10.1: RSS News Feed
- **Action**: Check the tech news sidebar
- **Expected Results**:
  - ✅ News items load from external RSS feed
  - ✅ News headlines are clickable
  - ✅ External links open in new tabs/windows
  - ✅ News content is recent and relevant

#### Test 10.2: External Resource Links
- **Action**: Test external links throughout the application
- **Expected Results**:
  - ✅ LinkedIn profile link works
  - ✅ External news article links function
  - ✅ Resource links open appropriately

### 11. ⚡ Performance and Loading Testing

#### Test 11.1: Page Load Performance
- **Action**: Monitor initial page load
- **Expected Results**:
  - ✅ Page loads within 3 seconds
  - ✅ Images load progressively (lazy loading)
  - ✅ No excessive console errors or warnings
  - ✅ Memory usage remains reasonable

#### Test 11.2: Navigation Performance
- **Action**: Test navigation speed between sections
- **Expected Results**:
  - ✅ Section transitions are smooth
  - ✅ Hash routing works instantly
  - ✅ No flickering or layout shifts

### 12. 🔧 Error Handling Testing

#### Test 12.1: Network Error Simulation
- **Action**: Test behavior with network issues
- **Steps**:
  1. Disconnect internet temporarily
  2. Try to use token calculator
  3. Try to use text generation
- **Expected Results**:
  - ✅ Appropriate error messages display
  - ✅ Application doesn't crash
  - ✅ Graceful degradation of functionality

#### Test 12.2: Invalid Input Handling
- **Action**: Test with invalid inputs
- **Steps**:
  1. Try submitting empty forms
  2. Test with extremely long inputs
  3. Test with invalid API keys
- **Expected Results**:
  - ✅ Validation messages appear
  - ✅ No application crashes
  - ✅ User is guided to correct inputs

## 🎯 Automated Test Script Template

For automated testing with Playwright, use this basic structure:

```javascript
// Basic Playwright test structure
const { test, expect } = require('@playwright/test');

test('AI Knowledge Base - Full UI Sanity Test', async ({ page }) => {
  // 1. Navigate to application
  await page.goto('http://localhost:8085');
  
  // 2. Test language switching
  await page.click('#language-selector');
  await page.click('option[value="en"]');
  await expect(page).toHaveURL(/lang=en/);
  
  // 3. Test navigation
  await page.click('a[href="#/calculator"]');
  await expect(page.locator('h2')).toContainText('Token Calculator');
  
  // 4. Test token calculator
  await page.fill('#token-input', 'Test message');
  await page.click('#calculate-button');
  await expect(page.locator('#token-result')).toBeVisible();
  
  // 5. Test AI chat (if accessible)
  await page.click('[data-bot-id="clzitjbre0qqhr9bagsfwnq3m"]');
  // Additional chat testing...
  
  // Add more test steps as needed
});
```

## ✅ Test Completion Checklist

When running through all tests, mark completed items:

### Priority Tests (Complete FIRST)
- [ ] AI Chat Assistant - Initial activation and 2 sanity questions
- [ ] AI Chat Assistant - Response quality verification
- [ ] AI Chat Assistant - Chat interface functionality

### Core Functionality
- [ ] Application loads successfully
- [ ] Language switching works (Hebrew ↔ English)
- [ ] Navigation system functions properly
- [ ] Token calculator works and returns results
- [ ] AI text generation interface is accessible
- [ ] Hot news section loads and displays content

### Interactive Features
- [ ] Expandable content (More Info buttons) works
- [ ] Related concept links navigate correctly
- [ ] AI chat widget is functional
- [ ] External links work properly
- [ ] RSS news feed loads

### Technical Requirements
- [ ] Responsive design works on mobile/tablet
- [ ] Performance is acceptable (< 3s load time)
- [ ] Error handling works gracefully
- [ ] No critical console errors
- [ ] All form validations function

### Advanced Features
- [ ] Chat interface responds to messages
- [ ] Voice/speech functionality (if implemented)
- [ ] Complex navigation scenarios work
- [ ] Concurrent usage scenarios handled

## 🚨 Critical Issues to Watch For

1. **Language switching fails** - Check URL parameters and JavaScript execution
2. **Token calculator doesn't return results** - Verify server connection and API endpoints
3. **Chat widget doesn't load** - Check FastBots.ai integration and network requests
4. **Navigation breaks** - Verify hash routing and JavaScript module loading
5. **Mobile layout issues** - Test responsive CSS and touch interactions
6. **RSS feed fails to load** - Check CORS settings and external API connectivity

## 📊 Test Results Documentation

Document test results with:
- **Date and Time** of testing
- **Browser and Version** used
- **Screen Resolution** tested
- **Pass/Fail Status** for each test category
- **Screenshots** of any failures
- **Console Logs** for debugging

---

**Last Updated**: September 30, 2025  
**Test Environment**: Chrome/Firefox/Safari on macOS/Windows/Linux  
**Application Version**: Latest main branch