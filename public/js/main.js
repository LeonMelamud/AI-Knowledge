
let linksData;
let conceptsData;
let lastLoadTime = 0;

async function loadData() {
    try {
        let data;
        let response =null;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Local development: fetch from Express server
             response = await fetch('/data');
            data = await response.json();
        } else {
            // Production: fetch from static JSON file
             response = await fetch('data.json');
            data = await response.json();
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Received data:', data);
        if (!linksData || data.timestamp > lastLoadTime) {
            linksData = data.links;
        conceptsData = data.concepts.concepts; // Access the nested 'concepts' array
        lastLoadTime = data.timestamp || Date.now();
            console.log('Data reloaded');
        }
        if (!Array.isArray(conceptsData)) {
            console.error('conceptsData is not an array:', conceptsData);
            conceptsData = []; // Fallback to empty array to prevent errors
        }
        
        if (!Array.isArray(linksData?.tools)) {
            console.error('linksData.tools is not an array:', linksData?.tools);
            linksData = { tools: [] }; // Fallback to empty array to prevent errors
        }
        
        buildNavigation();
        handleRoute();
        console.log('Data reloaded successfully');

        // Initialize RSS feed
        await initRSSFeed();
        console.log('Data loaded and RSS feed initialized');
        

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('mainContent').innerHTML = `<p>Error loading data: ${error.message}. Please check the console for more details and refresh the page.</p>`;
    }
}


function buildNavigation() {
    const navUl = document.getElementById('main-nav');
    navUl.innerHTML = ''; // Clear existing navigation

    // Add concepts to navigation
    if (Array.isArray(conceptsData)) {
        conceptsData.forEach(concept => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#/${concept.id}">${concept.title}</a>`;
            navUl.appendChild(li);
        });
    }

    // Add links to navigation
    if (Array.isArray(linksData?.tools)) {
        linksData.tools.forEach(tool => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#/${tool.id}">${tool.title}</a>`;
            navUl.appendChild(li);
        });
    }

   // Add special sections
   navUl.innerHTML += `
   <li><a href="#/text-generation">יצירת פרומטים וקול</a></li>
`;
    // Add event listeners for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const route = this.getAttribute('href').slice(2); // Remove '#/' from href
            window.location.hash = '/' + route;
        });
    });
}


function handleRoute() {
    const hash = window.location.hash.slice(2) || 'ai-basics';
    updateContent(hash);
}

function updateContent(route) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';

    let content = '';

    if (route === 'useful-links') {
        content = buildContentSection(linksData.tools, 'tool');
    } else {
        const concept = conceptsData.find(c => c.id === route);
        const tool = linksData.tools.find(t => t.id === route);
        
        if (concept) {
            content = buildContentSection([concept], 'concept');
        } else if (tool) {
            content = buildContentSection([tool], 'tool');
        } else if (route === 'text-generation') {
            content = buildTextGenerationSection();
        } else {
            content = '<p>לא נמצא תוכן מתאים.</p>';
        }
    }

    mainContent.innerHTML = content;
    Prism.highlightAll();
    attachEventListeners();
}

function buildContentSection(items, type) {
    return `
        ${items.map(item => `
            <section id="${item.id}">
                <h2>${item.title}</h2>
                <div class="${type === 'tool' ? 'useful-links' : 'concepts'}">
                    ${item.items.map(subItem => `
                        <div class="${type}-link">
                            <div class="${type}-main-info">
                                ${type === 'tool' 
                                    ? `<a href="${subItem.url}" target="_blank" class="${type}-name">${subItem.name}</a>
                                       <span class="company-name">${subItem.company}</span>`
                                    : `<h3>${subItem.name}</h3>
                                       <p>${subItem.shortDescription}</p>`
                                }
                                <button class="info-button">מידע נוסף</button>
                            </div>
                            <div class="additional-info" style="display: none;">
                                ${formatFullDescription(type === 'tool' ? subItem.description : subItem.fullDescription)}
                                ${type === 'tool' && subItem.recentUpdates 
                                    ? `<div>${formatFullDescription(subItem.recentUpdates)}</div>` 
                                    : ''}
                                ${type === 'concept' && subItem.imageUrl 
                                    ? `<img src="${subItem.imageUrl}" alt="${subItem.name}" class="concept-image">` 
                                    : ''}
                                ${type === 'concept' && subItem.codeExample 
                                    ? `<h4>דוגמת קוד:</h4>
                                       <pre><code class="language-python">${escapeHtml(subItem.codeExample)}</code></pre>` 
                                    : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `).join('')}
    `;
}

function buildTextGenerationSection() {
    return `
        <h2>יצירת פרומטים וקול</h2>
        <div id="text-generation-section">
            <h3>GPT-3.5 Text Generator</h3>
            <div class="input-group">
                <input type="text" id="api-key" placeholder="Enter your API key">
            </div>
            <div class="input-group">
                <input type="text" id="prompt-input" placeholder="Enter your prompt">
            </div>
            <div class="button-container">
                <button id="generate-button">Generate Text</button>
            </div>
            <div id="conversation-history" class="conversation-box"></div>
            <div id="spinner" class="spinner" style="display: none;"></div>
            <audio id="tts-audio" controls style="display: none;"></audio>
            <div id="voice-selection" style="display: none;">
                <label for="voice-select">Select Voice:</label>
                <select id="voice-select">
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="nova">Nova</option>
                    <option value="shimmer">Shimmer</option>
                </select>
            </div>
            <div id="token-usage" class="token-usage"></div>
        </div>
    `;
}
function formatFullDescription(description) {
    if(description === undefined) return '';
    return description.split('\n').map(line => `<p>${line}</p>`).join('');
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}


function attachEventListeners() {
    const infoButtons = document.querySelectorAll('.info-button');
    infoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const parentElement = this.closest('.tool-link, .concept-link');
            if (parentElement) {
                const additionalInfo = parentElement.querySelector('.additional-info');
                if (additionalInfo) {
                    if (additionalInfo.style.display === 'none' || additionalInfo.style.display === '') {
                        additionalInfo.style.display = 'block';
                        this.textContent = 'הסתר מידע';
                    } else {
                        additionalInfo.style.display = 'none';
                        this.textContent = parentElement.classList.contains('concept-link') ? 'הצג מידע מורחב' : 'מידע נוסף';
                    }
                }
            }
        });
    });

    // Add event listeners for text generation if it's present
    const generateButton = document.getElementById('generate-button');
    if (generateButton) {
        if (typeof handleGenerateText === 'function') {
            generateButton.addEventListener('click', handleGenerateText);
        } else {
            console.warn('handleGenerateText function is not defined');
            generateButton.addEventListener('click', () => alert('Text generation is not available at the moment.'));
        }
    }
}

async function handleGenerateText() {
    const apiKey = document.getElementById('api-key').value;
    const prompt = document.getElementById('prompt-input').value;
    const spinner = document.getElementById('spinner');
    const conversationHistory = document.getElementById('conversation-history');
    const tokenUsage = document.getElementById('token-usage');

    if (!apiKey || !prompt) {
        alert('Please enter both API key and prompt.');
        return;
    }

    spinner.style.display = 'block';
    try {
        const response = await fetch('/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ apiKey, prompt })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Add the new message to the conversation history
        conversationHistory.innerHTML += `
            <div class="message user-message">${prompt}</div>
            <div class="message assistant-message">${data.text}</div>
        `;

        // Update token usage information
        tokenUsage.textContent = `Tokens used: ${data.usage.total_tokens} (Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens})`;

        // Clear the prompt input
        document.getElementById('prompt-input').value = '';

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating text. Please check the console for more details.');
    } finally {
        spinner.style.display = 'none';
    }
}

function insertContent(content) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `<div class="full-width">${content}</div>`;
}

document.addEventListener('DOMContentLoaded', loadData);
window.addEventListener('hashchange', handleRoute);
