
    let messages = [
        {role: "system", content: "You are a helpful assistant."}
    ];

    let isGenerating = false;
    let lastGeneratedText = "";
    let promptInput;

    export async function handleGenerateText() {
        console.log("handleGenerateText function called");
        const apiKeyInput = document.getElementById('api-key');
        promptInput = document.getElementById('prompt-input');
        
        if (!apiKeyInput || !promptInput) {
            console.error("not found");
            return;
        }

        if (isGenerating) return;
        
        const apiKey = apiKeyInput?.value;
        const promptText = promptInput?.value;
        
        console.log("API Key:", apiKey ? "exists" : "missing");
        console.log("Prompt:", promptText);

        if (!apiKey || !promptText) {
            alert("Please enter your API key and a prompt.");
            return;
        }
        
        await generateText(apiKey, promptText);
    }

    async function generateText(apiKey, promptText) {
    const voiceSelectionDiv = document.getElementById("voice-selection");

        promptInput = document.getElementById('prompt-input');
        const spinner = document.getElementById("spinner");
        let generateButton = document.getElementById("generate-button");
        let audioElement = document.getElementById("tts-audio");
        console.log("generateText function called");
        try {
            isGenerating = true;
            if (generateButton) generateButton.disabled = true;
            if (spinner) spinner.style.display = "block";
            if (audioElement) audioElement.style.display = "none";
            if (voiceSelectionDiv) voiceSelectionDiv.style.display = "none";

            messages.push({role: "user", content: promptText});
            updateConversationDisplay();

            console.log("Sending request to server");
            const response = await fetch(`${config.serverUrl}/generate-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey, prompt: promptText })
            });
            console.log("Server response received:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Data received from server:", data);
            const generatedText = data.text;
            const textTokens = data.usage.total_tokens;
            
            messages.push({role: "assistant", content: generatedText});
            updateConversationDisplay();
            
            if (promptInput) promptInput.value = '';
            
            lastGeneratedText = generatedText;
            //const audioTokens = await convertToSpeech(apiKey, generatedText);
            
            //updateTokenUsageDisplay(textTokens, audioTokens);
        } catch (error) {
            console.error("Error generating text:", error);
            alert("Failed to generate text. Please check your API key and prompt.");
        } finally {
            isGenerating = false;
            if (generateButton) generateButton.disabled = false;
            if (spinner) spinner.style.display = "none";
            console.log("generateText function finished");
        }
    }

    async function convertToSpeech(apiKey, text) {
        const voiceSelect = document.getElementById("voice-select");

        const audioElement = document.getElementById("tts-audio");
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
        let conversationHistory = document.getElementById("conversation-history");
        
        console.log("updateConversationDisplay function called");
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
        console.log("updateConversationDisplay function finished");
    }

    function updateTokenUsageDisplay(textTokens, audioTokens) {
        const tokenUsageElement = document.getElementById("token-usage");

        if (tokenUsageElement) {
            tokenUsageElement.textContent = `Tokens used for this call - Text: ${textTokens}, Audio: ${audioTokens}`;
        }
    }