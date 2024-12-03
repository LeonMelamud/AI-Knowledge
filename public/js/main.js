import { initRSSFeed } from './rss.js';
import { buildCalculatorSection, setupCalculator } from './calculator.js';
import { handleGenerateText } from './llm-apis.js';
import { buildHotNewsSection } from './hot-news.js'; // Add this import
let linksData;
let conceptsData;
let lastLoadTime = 0;
export let currentLanguage = 'en'; // Default language set to English
export let hotNewsData = {};
let uiTranslations = {};


async function loadInitialData() {
    try {
        await loadLanguageData(currentLanguage);      
        console.log('Initial data loaded successfully');
        buildNavigation(); 
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('mainContent').innerHTML = `<p>Error loading data: ${error.message}. Please check the console for more details and refresh the page.</p>`;
    }
}

async function loadLanguageData(lang) {
    try {
        const [conceptsResponse, translationsResponse, linksResponse, hotNewsResponse ] = await Promise.all([
            fetch(`./data/concepts_${lang}.yaml`),
            fetch(`./data/ui_translations_${lang}.json`),
            fetch(`./data/links_${lang}.yaml`),
            fetch(`./data/news_${lang}.yaml`)
        ]);

        if (!conceptsResponse.ok || !translationsResponse.ok || !linksResponse.ok || !hotNewsResponse.ok) {
             new Error(`HTTP error! Concepts status: ${conceptsResponse.status}, Translations status: ${translationsResponse.status}, Links status: ${linksResponse.status}, Hot News status: ${hotNewsResponse.status}`);
            return;
            }

        const conceptsYaml = await conceptsResponse.text();
        const linksYaml = await linksResponse.text();
        const hotNewsYaml = await hotNewsResponse.text();

        if (!linksYaml.trim()) {
            console.error('Links YAML is empty');
            return;
        }
        conceptsData = jsyaml.load(conceptsYaml).concepts;
        linksData = jsyaml.load(linksYaml);
        hotNewsData = jsyaml.load(hotNewsYaml);

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
        console.error('msin nav not found');
        return; 
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
            <li><a href="#/calculator">${uiTranslations.tokenCalculator}</a></li>
        </ul>
    `;

    navUl.appendChild(specialSection);

    // Add event listeners for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const route = this.getAttribute('href').slice(2); 
            window.location.hash = '/' + route;
        });
    });

    const hotNewsSection = document.createElement('div');
    hotNewsSection.className = 'nav-category';
    hotNewsSection.innerHTML = `
        <h3>${uiTranslations.hotNews}</h3>
        <ul>
            <li><a href="#/hot-news">${uiTranslations.viewHotNews}</a></li>
        </ul>
    `;
    navUl.appendChild(hotNewsSection);
}


function handleRoute() {
    const hash = window.location.hash.slice(2) || 'hot-news';
    updateContent(hash);
}

function updateContent(route) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';

    let content = '';

    console.log('Current route:', route);

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
        } else if (route === 'calculator') {
            content = buildCalculatorSection(uiTranslations);
        } else if (route === 'hot-news') {
            content = buildHotNewsSection(uiTranslations);
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
                                            <button class="hide-image-button" onclick="toggleImage(${index}, this)">${uiTranslations.hideImage}</button>
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

    if (window.location.hostname != 'localhost' && window.location.hostname != '127.0.0.1') {
        return `
            <div class="maintenance-message">
                ${uiTranslations.maintenanceMessage || 'Server is under maintenance for new future LLM services, fork the project from git to play with it locally.'} 
                <a href="https://github.com/LeonMelamud/AI-Knowledge" target="_blank">https://github.com/LeonMelamud/AI-Knowledge</a>
            </div>
        `;
    }
    return `
        <h2>${uiTranslations.generatePromptsAndVoice}</h2>
        <div id="text-generation-section">
            <h3>GPT-4o-mini Text Generator</h3>
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

    const generateButton = document.getElementById('generate-button');
    if (generateButton) {
        generateButton.addEventListener('click', function() {
            if (typeof handleGenerateText === 'function') {
                handleGenerateText();
            } else {
                console.error('handleGenerateText function not found. Make sure llm-apis.js is loaded correctly.');
            }
        });
    }

    const calcButton = document.getElementById('calculate-button');
    if (calcButton) {
        if (typeof setupCalculator === 'function') {
            calcButton.addEventListener('click', setupCalculator(uiTranslations));
        } else {
            console.warn('setupCalculator function is not defined');
            calcButton.addEventListener('click', () => alert("calculator not available "));
        }
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




window.addEventListener('hashchange', handleRoute);

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navContent = document.querySelector('.nav-content');

    menuToggle.addEventListener('click', function() {
        navContent.classList.toggle('active');
    });
});

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();

    if (!window.location.hash) {
        window.location.hash = '#/hot-news';
        handleRoute(); // Ensure the route is handled after setting the default hash
    }

    // Add event listener for language selector
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = currentLanguage;
        languageSelector.addEventListener('change', function() {
            const newLanguage = this.value;
            if (newLanguage !== currentLanguage) {
                loadLanguageData(newLanguage);
            }
        });
    }

    const hotNewsContainer = document.getElementById('hot-news-container');
    if (hotNewsContainer) {
        hotNewsContainer.innerHTML = buildHotNewsSection(uiTranslations);
    }

    // Add event listener for news links
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('news-link')) {
            const url = event.target.getAttribute('data-href');
            if (url && isValidUrl(url)) {
                window.open(url, '_blank');
            } else {
                console.warn(`Invalid URL: ${url}`);
            }
        }
    });
});
