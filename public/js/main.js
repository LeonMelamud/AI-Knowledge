import { initRSSFeed } from './rss.js';
import { buildCalculatorSection, setupCalculator } from './calculator.js';
import { handleGenerateText } from './llm-apis.js';
import { buildHotNewsSection } from './hot-news.js';
let linksData;
let conceptsData;
let lastLoadTime = 0;
export let currentLanguage = 'en';
export let hotNewsData = {};
let uiTranslations = {};

// Enhanced lazy loading utility with error handling and progressive loading
function setupLazyLoading(imgElement, src, alt) {
    // Set low-quality image placeholder or blur-up placeholder
    imgElement.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    imgElement.setAttribute('data-src', src);
    imgElement.alt = alt || '';
    imgElement.classList.add('lazy-image');
    
    // Add loading indicator
    imgElement.style.opacity = '0.5';
    imgElement.style.transition = 'opacity 0.3s ease-in-out';
    

    // Preload critical images that are close to viewport
    const preloadIfNeeded = (entry) => {
        const rect = entry.boundingClientRect;
        if (rect.top < window.innerHeight * 2) { // If image is within 2 viewport heights
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = src;
            document.head.appendChild(preloadLink);
        }
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // Load the image
                const tempImage = new Image();
                tempImage.onload = () => {
                    img.src = img.getAttribute('data-src');
                    img.style.opacity = '1';
                    img.classList.add('loaded');
                    
                    // Add fade-in effect
                    requestAnimationFrame(() => {
                        img.style.opacity = '1';
                    });
                };
                
                tempImage.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    img.style.opacity = '1';
                    img.classList.add('error');
                    img.setAttribute('aria-label', 'Image failed to load');
                    
                    // Add fallback/error image or message
                    const errorContainer = document.createElement('div');
                    errorContainer.className = 'image-error';
                    errorContainer.textContent = 'Image failed to load';
                    img.parentNode.insertBefore(errorContainer, img.nextSibling);
                };
                
                tempImage.src = img.getAttribute('data-src');
                
                // Start preloading check
                preloadIfNeeded(entry);
                
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px', // Load images 50px before they enter viewport
        threshold: [0, 0.5, 1], // Track multiple visibility thresholds
        trackVisibility: true, // Enable visibility tracking
        delay: 100 // Minimum time between notifications
    });

    observer.observe(imgElement);
    return imgElement;
}

// Performance monitoring function
function monitorImagePerformance() {
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'largest-contentful-paint') {
                    console.log(`LCP: ${entry.startTime}ms`);
                }
                if (entry.entryType === 'layout-shift') {
                    console.log(`CLS: ${entry.value}`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
    }
}

// Initialize performance monitoring
monitorImagePerformance();

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

        if (!hotNewsYaml.trim()) {
            console.error('Hot News YAML is empty');
            return;
        }

        conceptsData = jsyaml.load(conceptsYaml).concepts;
        linksData = jsyaml.load(linksYaml);
        hotNewsData = jsyaml.load(hotNewsYaml);

        console.log('Loaded hot news data:', hotNewsData);

        uiTranslations = await translationsResponse.json();

        currentLanguage = lang;

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

        buildNavigation();
        console.log('Data reloaded successfully');

        await initRSSFeed();
        console.log('Data loaded and RSS feed initialized');
        updatePageContent();
        handleRoute();
    } catch (error) {
        console.error('Error loading language data:', error);
    }
}

function updatePageContent() {
    document.querySelector('.hero-section h1').textContent = uiTranslations.heroTitle;
    document.querySelector('footer p').textContent = uiTranslations.footerText;
}

function buildNavigation() {
    const navUl = document.getElementById('main-nav');
    if (!navUl) {
        console.error('main nav not found');
        return; 
    }
    navUl.innerHTML = '';

    const knowledgeCategory = document.createElement('div');
    knowledgeCategory.className = 'nav-category';
    knowledgeCategory.innerHTML = `<h3>${uiTranslations.knowledge}</h3>`;
    const knowledgeUl = document.createElement('ul');

    if (Array.isArray(conceptsData)) {
        conceptsData.forEach(concept => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#/${concept.id}">${concept.title}</a>`;
            knowledgeUl.appendChild(li);
        });
    }
    knowledgeCategory.appendChild(knowledgeUl);
    navUl.appendChild(knowledgeCategory);

    const linksCategory = document.createElement('div');
    linksCategory.className = 'nav-category';
    linksCategory.innerHTML = `<h3>${uiTranslations.links}</h3>`;
    const linksUl = document.createElement('ul');

    if (Array.isArray(linksData?.tools)) {
        linksData.tools.forEach(tool => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#/${tool.id}">${tool.title}</a>`;
            linksUl.appendChild(li);
        });
    }
    linksCategory.appendChild(linksUl);
    navUl.appendChild(linksCategory);

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

    const hotNewsSection = document.createElement('div');
    hotNewsSection.className = 'nav-category';
    hotNewsSection.innerHTML = `
        <h3>${uiTranslations.hotNews}</h3>
        <ul>
            <li><a href="#/hot-news">${uiTranslations.viewHotNews}</a></li>
        </ul>
    `;
    navUl.appendChild(hotNewsSection);

    // Add event listeners for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const route = this.getAttribute('href').slice(2);
            window.location.hash = '/' + route;
            
            // Close mobile nav if open
            const navContent = document.querySelector('.nav-content');
            const menuToggle = document.querySelector('.menu-toggle');
            if (navContent && navContent.classList.contains('active')) {
                navContent.classList.remove('active');
                document.body.classList.remove('nav-open');
                menuToggle.classList.remove('active');
            }
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

    console.log('Current route:', route);

    if (route === 'useful-links') {
        content = buildContentSection(linksData, 'tool');
    } else {
        const concept = conceptsData?.find(c => c.id === route);
        const tool = linksData?.tools?.find(t => t.id === route);
        
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
                                        <div class="concept-image-container">
                                            <img class="concept-image lazy-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${image.url}" alt="${image.alt}" style="max-width: 400px; margin: 10px;">
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
                        // Initialize lazy loading for newly visible images
                        additionalInfo.querySelectorAll('img.lazy-image').forEach(img => {
                            if (!img.classList.contains('loaded')) {
                                setupLazyLoading(img, img.getAttribute('data-src'), img.alt);
                            }
                        });
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

    const hideImageButtons = document.querySelectorAll('.hide-image-button');
    hideImageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const imageContainer = this.closest('.concept-image-container');
            if (imageContainer) {
                const isHidden = imageContainer.style.display === 'none';
                imageContainer.style.display = isHidden ? 'block' : 'none';
                this.textContent = isHidden ? uiTranslations.hideImage : uiTranslations.showImage;
            }
        });
    });

    // Initialize lazy loading for all lazy-image elements
    document.querySelectorAll('img.lazy-image:not(.loaded)').forEach(img => {
        setupLazyLoading(img, img.getAttribute('data-src'), img.alt);
    });
}

window.addEventListener('hashchange', handleRoute);

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Initialize mobile menu functionality
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navContent = document.querySelector('.nav-content');

    function closeNav() {
        navContent.classList.remove('active');
        document.body.classList.remove('nav-open');
    }

    menuToggle.addEventListener('click', function() {
        navContent.classList.toggle('active');
        document.body.classList.toggle('nav-open');
        this.classList.toggle('active');
    });

    // Close nav when clicking outside
    document.addEventListener('click', function(e) {
        if (navContent.classList.contains('active') && 
            !navContent.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            navContent.classList.remove('active');
            document.body.classList.remove('nav-open');
            menuToggle.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Immediately load the LinkedIn profile image
    const profilePicture = document.getElementById('profile-picture');
    if (profilePicture && profilePicture.hasAttribute('data-src')) {
        const src = profilePicture.getAttribute('data-src');
        profilePicture.src = src;
        profilePicture.classList.add('loaded');
        profilePicture.style.opacity = '1';
    }

    loadInitialData();
    initializeMobileMenu();

    if (!window.location.hash) {
        window.location.hash = '#/hot-news';
        handleRoute();
    }

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
