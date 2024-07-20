document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById("api-key");
    const generateButton = document.getElementById("generate-button");
    const promptInput = document.getElementById("prompt-input");
    const conversationHistory = document.getElementById("conversation-history");
    const spinner = document.getElementById("spinner");
    const audioElement = document.getElementById("tts-audio");
    const tokenUsageElement = document.getElementById("token-usage");
    const voiceSelect = document.getElementById("voice-select");
    const voiceSelectionDiv = document.getElementById("voice-selection");

    let messages = [
        {role: "system", content: "You are a helpful assistant."}
    ];
    let isGenerating = false;
    let lastGeneratedText = "";

    /**
     * Handles the click event on the generate button.
     * Prevents double-clicking by checking if the generating flag is set.
     * If the API key or prompt is missing, it displays an alert and returns.
     * Otherwise, it calls the generateText function with the API key and prompt.
     */
    function handleGenerateText() {
        // Prevent double-clicking
        if (isGenerating) return;
        
        // Get the API key and prompt from the input fields
        const apiKey = apiKeyInput?.value;
        const promptText = promptInput?.value;
        
        // Check if the API key or prompt is missing
        if (!apiKey || !promptText) {
            // Display an alert and return
            alert("Please enter your API key and a prompt.");
            return;
        }
        
        // Call the generateText function with the API key and prompt
        generateText(apiKey, promptText);
    }
    
    if (generateButton) {
        generateButton.addEventListener("click", handleGenerateText);
    }

    if (promptInput) {
        promptInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter" && !isGenerating) {
                event.preventDefault();
                handleGenerateText();
            }
        });
    }

    if (voiceSelect) {
        voiceSelect.addEventListener("change", function() {
            const apiKey = apiKeyInput?.value;
            if (apiKey && lastGeneratedText) {
                convertToSpeech(apiKey, lastGeneratedText);
            }
        });
    }

    async function generateText(apiKey, promptText) {
        try {
            isGenerating = true;
            if (generateButton) generateButton.disabled = true;
            if (spinner) spinner.style.display = "block";
            if (audioElement) audioElement.style.display = "none";
            if (voiceSelectionDiv) voiceSelectionDiv.style.display = "none";

            messages.push({role: "user", content: promptText});
            updateConversationDisplay();

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const generatedText = data.choices[0].message.content;
            const textTokens = data.usage.total_tokens;
            
            messages.push({role: "assistant", content: generatedText});
            updateConversationDisplay();
            
            if (promptInput) promptInput.value = '';
            
            lastGeneratedText = generatedText;
            const audioTokens = await convertToSpeech(apiKey, generatedText);
            
            updateTokenUsageDisplay(textTokens, audioTokens);
        } catch (error) {
            console.error("Error generating text:", error);
            alert("Failed to generate text. Please check your API key and prompt.");
        } finally {
            isGenerating = false;
            if (generateButton) generateButton.disabled = false;
            if (spinner) spinner.style.display = "none";
        }
    }

    async function convertToSpeech(apiKey, text) {
        try {
            if (spinner) spinner.style.display = "block";
            if (audioElement) audioElement.style.display = "none";

            const selectedVoice = voiceSelect.value;

            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "tts-1",
                    input: text,
                    voice: selectedVoice
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioElement) {
                audioElement.src = audioUrl;
                audioElement.style.display = "block";
            }
            if (voiceSelectionDiv) voiceSelectionDiv.style.display = "block";

            return text.length; // For TTS, we'll use character count as an approximation
        } catch (error) {
            console.error("Error converting to speech:", error);
            alert("Failed to convert text to speech. Please check your API key.");
            return 0;
        } finally {
            if (spinner) spinner.style.display = "none";
        }
    }

    function updateConversationDisplay() {
        if (!conversationHistory) return;
        
        conversationHistory.innerHTML = '';
        messages.forEach(message => {
            if (message.role !== 'system') {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message', `${message.role}-message`);
                const roleLabel = message.role === 'user' ? 'User: ' : 'Agent: ';
                messageElement.textContent = `${roleLabel}${message.content}`;
                conversationHistory.appendChild(messageElement);
            }
        });
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    }

    function updateTokenUsageDisplay(textTokens, audioTokens) {
        if (tokenUsageElement) {
            tokenUsageElement.textContent = `Tokens used for this call - Text: ${textTokens}, Audio: ${audioTokens}`;
        }
    }
});