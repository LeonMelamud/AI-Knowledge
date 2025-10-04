---
description: Execute AI Chat Assistant quick functionality test without language switching or navigation.
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

Execute the AI Chat Assistant quick test following these steps:

## Test Overview
Fast test focusing only on AI Chat Assistant functionality without language switching or navigation.

## Test Steps

### 1. Activate Chat Widget
- Click the FastBots "Push to talk" button (ref=e1649)

### 2. Test Question 1: General AI Query
- Type: "What is machine learning?"
- Click send button (ref=f1e37)
- Verify AI responds with Nordic/Odin personality

### 3. Test Question 2: Technical AI Query  
- Type: "How do neural networks work?"
- Click send button (ref=f1e37)
- Verify AI provides technical explanation in character

## Expected Results
- ✅ Chat widget activates with Nordic greeting
- ✅ AI responds to both questions maintaining Odin persona
- ✅ Responses reference knowledge base appropriately
- ✅ Fast response times with no errors

## Implementation Instructions

1. If browser automation is available, execute these commands:

```javascript
// 1. Activate chat widget
await page.locator('button[data-testid="fastbots-trigger"]').click();

// 2. First question
await page.locator('iframe').contentFrame().locator('input[placeholder=""]').fill("What is machine learning?");
await page.locator('iframe').contentFrame().getByRole('button', { name: 'send message' }).click();

// 3. Second question  
await page.locator('iframe').contentFrame().locator('input[placeholder=""]').fill("How do neural networks work?");
await page.locator('iframe').contentFrame().getByRole('button', { name: 'send message' }).click();
```

2. If manual testing, provide step-by-step instructions for user to follow

3. Record test results:
- [ ] Chat activation successful
- [ ] Question 1 response received
- [ ] Question 2 response received
- [ ] Nordic personality maintained
- [ ] Performance acceptable

4. Report any issues found with specific details about failures

Context for test execution: $ARGUMENTS