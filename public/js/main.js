import { initRSSFeed } from './rss.js';
let linksData;
let conceptsData;
let lastLoadTime = 0;
let currentLanguage = 'en'; // Default language set to English
let uiTranslations = {};

document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
});

async function loadInitialData() {
    try {
        await loadLanguageData(currentLanguage,'.');      
        console.log('Initial data loaded successfully');
        buildNavigation(); // קריאה לבניית התפריט רק לאחר טעינת הנתונים
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('mainContent').innerHTML = `<p>Error loading data: ${error.message}. Please check the console for more details and refresh the page.</p>`;
    }
}

async function loadLanguageData(lang, path = '.') {
    try {
        const [conceptsResponse, translationsResponse, linksResponse ] = await Promise.all([
            fetch(`${path}/concepts_${lang}.yaml`),
            fetch(`${path}/ui_translations_${lang}.json`),
            fetch(`${path}/links_${lang}.yaml`)
        ]);

        if (!conceptsResponse.ok || !translationsResponse.ok || !linksResponse.ok) {
            throw new Error(`HTTP error! Concepts status: ${conceptsResponse.status}, Translations status: ${translationsResponse.status} Links status: ${linksResponse.status}`);
        }

        const conceptsYaml = await conceptsResponse.text();
        const linksYaml = await linksResponse.text();
        if (!linksYaml.trim()) {
            console.error('Links YAML is empty');
            return;
        }
        conceptsData = jsyaml.load(conceptsYaml).concepts;
        linksData = jsyaml.load(linksYaml);
        
        uiTranslations = await translationsResponse.json();

        currentLanguage = lang;

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
        

        buildNavigation();
        console.log('Data reloaded successfully');

        // Initialize RSS feed
        await initRSSFeed();
        console.log('Data loaded and RSS feed initialized');
        updatePageContent();
        handleRoute();
    } catch (error) {
        console.error('Error loading language data:', error);
    }
}

function updatePageContent() {
    // Update static text elements
    document.querySelector('.hero-section h1').textContent = uiTranslations.heroTitle;
    document.querySelector('footer p').textContent = uiTranslations.footerText;
    
}

function buildNavigation() {
    const navUl = document.getElementById('main-nav');
    if (!navUl) {
        console.error('האלמנט main-nav לא נמצא בדף');
        return; // יציאה מהפונקציה אם האלמנט לא קיים
    }
    navUl.innerHTML = ''; // Clear existing navigation

    // Create knowledge category
    const knowledgeCategory = document.createElement('div');
    knowledgeCategory.className = 'nav-category';
    knowledgeCategory.innerHTML = `<h3>${uiTranslations.knowledge}</h3>`;
    const knowledgeUl = document.createElement('ul');

    // Add concepts to knowledge category
    if (Array.isArray(conceptsData)) {
        conceptsData.forEach(concept => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#/${concept.id}">${concept.title}</a>`;
            knowledgeUl.appendChild(li);
        });
    }
    knowledgeCategory.appendChild(knowledgeUl);
    navUl.appendChild(knowledgeCategory);

    // Create links category
    const linksCategory = document.createElement('div');
    linksCategory.className = 'nav-category';
    linksCategory.innerHTML = `<h3>${uiTranslations.links}</h3>`;
    const linksUl = document.createElement('ul');

    // Add links to links category
    if (Array.isArray(linksData?.tools)) {
        linksData.tools.forEach(tool => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#/${tool.id}">${tool.title}</a>`;
            linksUl.appendChild(li);
        });
    }
    linksCategory.appendChild(linksUl);
    navUl.appendChild(linksCategory);

    // Add special sections
    const specialSection = document.createElement('div');
    specialSection.className = 'nav-category';
    specialSection.innerHTML = `
        <h3>${uiTranslations.specialSections}</h3>
        <ul>
            <li><a href="#/text-generation">${uiTranslations.generatePromptsAndVoice}</a></li>
        </ul>
    `;
    navUl.appendChild(specialSection);

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
        content = buildContentSection(linksData, 'tool');
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
            content = `<p>${uiTranslations.noMatchingContent}</p>`;
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
                                <button class="info-button">${uiTranslations.moreInfo}</button>
                            </div>
                            <div class="additional-info" style="display: none;">
                                ${formatFullDescription(type === 'tool' ? subItem.description : subItem.fullDescription)}
                                ${type === 'tool' && subItem.recentUpdates 
                                    ? `<div>${formatFullDescription(subItem.recentUpdates)}</div>` 
                                    : ''}
                                ${type === 'concept' && subItem.images && subItem.images.length > 0 
                                    ? subItem.images.map((image, index) => `
                                        <div class="concept-image-container" id="image-container-${index}">
                                            <img src="${image.url}" alt="${image.alt}" class="concept-image">
                                        </div>
                                    `).join('') 
                                    : ''}
                                ${type === 'concept' && subItem.codeExample 
                                    ? `<h4>${uiTranslations.codeExample}</h4>
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
        <h2>${uiTranslations.generatePromptsAndVoice}</h2>
        <div id="text-generation-section">
            <h3>GPT-3.5 Text Generator</h3>
            <div class="input-group">
                <input type="text" id="api-key" placeholder="${uiTranslations.enterApiKey}">
            </div>
            <div class="input-group">
                <input type="text" id="prompt-input" placeholder="${uiTranslations.enterPrompt}">
            </div>
            <div class="button-container">
                <button id="generate-button">${uiTranslations.generateText}</button>
            </div>
            <div id="conversation-history" class="conversation-box"></div>
            <div id="spinner" class="spinner" style="display: none;"></div>
            <audio id="tts-audio" controls style="display: none;"></audio>
            <div id="voice-selection" style="display: none;">
                <label for="voice-select">${uiTranslations.selectVoice}</label>
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
                        this.textContent = uiTranslations.hideInfo;
                    } else {
                        additionalInfo.style.display = 'none';
                        this.textContent = parentElement.classList.contains('concept-link') 
                            ? uiTranslations.showMoreInfo
                            : uiTranslations.moreInfo;
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
            generateButton.addEventListener('click', () => alert(uiTranslations.textGenerationUnavailable));
        }
    }

    // Add event listener for language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.addEventListener('change', function() {
            const newLanguage = this.value; // הוסף שורה זו
            if (newLanguage !== currentLanguage) {
                loadLanguageData(newLanguage);
            }
        });
    }

    // Add event listeners for hide image buttons
    const hideImageButtons = document.querySelectorAll('.hide-image-button');
    hideImageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const imageContainer = this.closest('.concept-image-container');
            if (imageContainer) {
                imageContainer.style.display = 'none';
            }
        });
    });
}

async function handleGenerateText() {
    const apiKey = document.getElementById('api-key').value;
    const prompt = document.getElementById('prompt-input').value;
    const spinner = document.getElementById('spinner');
    const conversationHistory = document.getElementById('conversation-history');
    const tokenUsage = document.getElementById('token-usage');

    if (!apiKey || !prompt) {
        alert(uiTranslations.enterApiKeyAndPrompt);
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
        tokenUsage.textContent = formatString(uiTranslations.tokensUsed, {
            total: data.usage.total_tokens,
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens
        });

        // Clear the prompt input
        document.getElementById('prompt-input').value = '';

    } catch (error) {
        console.error('Error:', error);
        alert(uiTranslations.textGenerationError);
    } finally {
        spinner.style.display = 'none';
    }
}

function formatString(template, values) {
    return template.replace(/{(\w+)}/g, (_, key) => values[key] || '');
}

function insertContent(content) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `<div class="full-width">${content}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    // Add event listener for language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = currentLanguage;
        languageSelector.addEventListener('change', function() {
            const newLanguage = this.value; // הוסף שורה זו
            if (newLanguage !== currentLanguage) {
                loadLanguageData(newLanguage);
            }
        });
    }
});

window.addEventListener('hashchange', handleRoute);

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navContent = document.querySelector('.nav-content');

    menuToggle.addEventListener('click', function() {
        navContent.classList.toggle('active');
    });
});

function toggleImage(index, button) {
    const imageContainer = document.getElementById(`image-container-${index}`);
    const image = imageContainer.querySelector('.concept-image');
    
    if (image.style.display === 'none') {
        image.style.display = 'block';
        button.textContent = '${uiTranslations.hideImage}';
    } else {
        image.style.display = 'none';
        button.textContent = '${uiTranslations.showImage}';
    }
}
