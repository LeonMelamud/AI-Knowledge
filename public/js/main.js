// AEO schema functions now available globally via the AEO object
// Any previously imported { generateSchemas } should now use AEO.generateSchema instead

import { initRSSFeed } from './rss.js';
import { buildCalculatorSection, setupCalculator } from './calculator.js';
import { handleGenerateText } from './llm-apis.js';
import { buildHotNewsSection, renderHotNews, addHotNewsStyles } from './hot-news.js';
import { config } from './config.js';
let linksData;
let conceptsData;
let lastLoadTime = 0;
export let currentLanguage = 'he';
export let hotNewsData = {};
let uiTranslations = {};
let contentData = null;
let hasLoadedData = false;

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
            console.error(`HTTP error! Concepts status: ${conceptsResponse.status}, Translations status: ${translationsResponse.status}, Links status: ${linksResponse.status}, Hot News status: ${hotNewsResponse.status}`);
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
        
        // Apply hot news styles
        addHotNewsStyles();
    } catch (error) {
        console.error('Error loading language data:', error);
    }
}

function updatePageContent() {
    document.querySelector('.hero-section h1').textContent = uiTranslations.heroTitle;
    document.querySelector('footer p').textContent = uiTranslations.footerText;
    
    // Update footer links
    const privacyLink = document.getElementById('privacy-policy-link');
    const termsLink = document.getElementById('terms-of-service-link');
    if (privacyLink) privacyLink.textContent = uiTranslations.privacyPolicy;
    if (termsLink) termsLink.textContent = uiTranslations.termsOfService;
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
    
    // Enhance with AEO metadata and schema updates
    updateAEOMetadata(hash);
}

// New function to update AEO metadata and schema
function updateAEOMetadata(route) {
    // Get content information
    const concept = conceptsData?.find(c => c.id === route);
    const tool = linksData?.tools?.find(t => t.id === route);
    
    let title, description, type, keywords;
    
    if (concept) {
        title = concept.title;
        description = `Learn about ${concept.title}: ${concept.items[0]?.shortDescription || ''}`;
        type = 'concept';
        keywords = concept.items.map(item => item.name).join(', ');
    } else if (tool) {
        title = tool.title;
        description = `Explore ${tool.title}: Tools and resources for AI development`;
        type = 'tool';
        keywords = tool.items.map(item => item.name).join(', ');
    } else if (route === 'text-generation') {
        title = uiTranslations.generatePromptsAndVoice;
        description = 'Generate AI text with our powerful text generation tools';
        type = 'tool';
        keywords = 'text generation, AI writing, prompts, GPT';
    } else if (route === 'calculator') {
        title = uiTranslations.tokenCalculator;
        description = 'Calculate token usage for AI models';
        type = 'tool';
        keywords = 'token calculator, GPT, token count, AI model tokens';
    } else if (route === 'hot-news') {
        title = uiTranslations.hotNews;
        description = 'Latest AI news and updates';
        type = 'news';
        keywords = 'AI news, artificial intelligence updates, latest AI developments';
    } else if (route === 'privacy-policy') {
        title = uiTranslations.privacyPolicyTitle;
        description = 'Privacy Policy for AI Knowledge Guide - data collection, usage, and protection policies';
        type = 'legal';
        keywords = 'privacy policy, data protection, GDPR compliance, personal information';
    } else if (route === 'terms-of-service') {
        title = uiTranslations.termsOfServiceTitle;
        description = 'Terms of Service for AI Knowledge Guide - rules and guidelines for using our website';
        type = 'legal';
        keywords = 'terms of service, user agreement, website rules, legal terms';
    } else {
        title = 'AI Knowledge Base';
        description = 'Comprehensive resource for artificial intelligence concepts and tools';
        type = 'general';
        keywords = 'AI, artificial intelligence, machine learning, neural networks';
    }
    
    // Update document title
    document.title = `${title} | AI Knowledge Base`;
    
    // Update metadata if the function exists (from index.js)
    if (typeof updateMetadataForRoute === 'function') {
        updateMetadataForRoute(route, title);
    } else {
        // Fallback: update basic metadata directly
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = description;
        }
        
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            metaKeywords.content = keywords;
        }
        
        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        
        if (ogTitle) ogTitle.content = `${title} | AI Knowledge Base`;
        if (ogDescription) ogDescription.content = description;
    }
    
    // Generate AEO-friendly breadcrumbs schema
    generateBreadcrumbsSchema(route, title);
}

// Add function to generate breadcrumbs schema
function generateBreadcrumbsSchema(route, pageTitle) {
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": window.location.origin
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": pageTitle,
                "item": `${window.location.origin}/#/${route}`
            }
        ]
    };
    
    // Remove existing breadcrumb schema if present
    const existingBreadcrumbSchema = document.querySelector('script[data-breadcrumbs="true"]');
    if (existingBreadcrumbSchema) {
        existingBreadcrumbSchema.remove();
    }
    
    // Add new breadcrumb schema
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.dataset.breadcrumbs = 'true';
    schemaScript.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(schemaScript);
}

// Helper function to get the title of the current content
function getContentTitle(route) {
    const concept = conceptsData?.find(c => c.id === route);
    const tool = linksData?.tools?.find(t => t.id === route);
    
    if (concept) return concept.title;
    if (tool) return tool.title;
    
    // Special routes
    if (route === 'text-generation') return uiTranslations.generatePromptsAndVoice;
    if (route === 'calculator') return uiTranslations.tokenCalculator;
    if (route === 'hot-news') return uiTranslations.hotNews;
    
    return 'AI Knowledge Base';
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
            
            // Debug hot news data before rendering
            console.log('Hot news data before rendering:', hotNewsData);
            if (hotNewsData.hot_news) {
                console.log('Hot news array found:', hotNewsData.hot_news.length, 'items');
                if (hotNewsData.hot_news.length > 0) {
                    console.log('First item structure:', hotNewsData.hot_news[0]);
                }
            }
            
            // Render hot news data after rendering the section
            // Increase timeout slightly to ensure DOM is ready
            setTimeout(() => {
                try {
                    renderHotNews(hotNewsData);
                } catch (error) {
                    console.error('Error rendering hot news:', error);
                    const container = document.getElementById('hotNewsContainer');
                    if (container) {
                        container.innerHTML = `<p>Error rendering news: ${error.message}. Check console for details.</p>`;
                    }
                }
            }, 200);
        } else if (route === 'privacy-policy') {
            content = buildPrivacyPolicySection();
        } else if (route === 'terms-of-service') {
            content = buildTermsOfServiceSection();
        } else {
            content = `<p>${uiTranslations.noMatchingContent}</p>`;
        }
    }

    mainContent.innerHTML = content;
    Prism.highlightAll();
    attachEventListeners();
}

function formatFullDescription(description) {
    if(description === undefined) return '';
    
    // AEO Enhancement: Identify question-answer patterns in text
    let formattedContent = '';
    const lines = description.split('\n');
    
    // Group content by sections for better structure
    let inList = false;
    let listType = null;
    
    // Identify potential questions and format them appropriately
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Skip empty lines to reduce excessive spacing
        if (line === '') {
            // Add a small space between sections but not within lists
            if (!inList && formattedContent && !formattedContent.endsWith('</ul>') && 
                !formattedContent.endsWith('</ol>') && !formattedContent.endsWith('</div>')) {
                formattedContent += '<div class="content-spacer" style="height:0.5em"></div>';
            }
            continue;
        }
        
        // Handle Markdown heading format: Remove # characters
        if (line.startsWith('#')) {
            if (inList) {
                // Close any open lists before starting a new section
                formattedContent += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
                listType = null;
            }
            
            const headingMatch = line.match(/^(#+)\s+(.*)/);
            if (headingMatch) {
                const level = Math.min(Math.max(headingMatch[1].length, 1), 6);
                const headingText = headingMatch[2].trim();
                formattedContent += `<h${level} class="aeo-heading">${headingText}</h${level}>`;
                continue;
            }
        }
        
        // Handle bold text: Convert **text** to <strong>text</strong>
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle h2-like elements with ## prefix
        if (line.match(/^##\s+/)) {
            if (inList) {
                // Close any open lists before starting a new section
                formattedContent += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
                listType = null;
            }
            
            const subheadingText = line.replace(/^##\s+/, '').trim();
            formattedContent += `<h3 class="aeo-subheading">${subheadingText}</h3>`;
            continue;
        }
        
        // Check if line starts with question words or contains a question mark
        const isQuestion = (line.match(/^(What|How|Why|When|Where|Which|Who|Can|Is|Are|Do|Does|Will)/i) || line.includes('?'));
        
        if (isQuestion) {
            if (inList) {
                // Close any open lists before starting a new question
                formattedContent += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
                listType = null;
            }
            
            // Format as a question for AEO
            formattedContent += `<div class="aeo-question">${line}</div>`;
            
            // If there's a next line, treat it as the beginning of the answer
            if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
                formattedContent += `<div class="aeo-answer">`;
                
                // Collect the answer (which may span multiple lines)
                let j = i + 1;
                let answerContent = '';
                let answerInList = false;
                let answerListType = null;
                
                while (j < lines.length && 
                       !lines[j].match(/^(What|How|Why|When|Where|Which|Who|Can|Is|Are|Do|Does|Will)/i) && 
                       !lines[j].includes('?') && 
                       !lines[j].trim().startsWith('#') && 
                       lines[j].trim() !== '') {
                    
                    let answerLine = lines[j].trim();
                    answerLine = answerLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    
                    if (answerLine.startsWith('-')) {
                        if (!answerInList || answerListType !== 'ul') {
                            if (answerInList) {
                                answerContent += answerListType === 'ul' ? '</ul>' : '</ol>';
                            }
                            answerContent += '<ul>';
                            answerInList = true;
                            answerListType = 'ul';
                        }
                        
                        const listItemText = answerLine.substring(1).trim();
                        answerContent += `<li>${listItemText}</li>`;
                    } else if (answerLine.match(/^\d+\./)) {
                        if (!answerInList || answerListType !== 'ol') {
                            if (answerInList) {
                                answerContent += answerListType === 'ul' ? '</ul>' : '</ol>';
                            }
                            answerContent += '<ol>';
                            answerInList = true;
                            answerListType = 'ol';
                        }
                        
                        const listItemText = answerLine.substring(answerLine.indexOf('.')+1).trim();
                        answerContent += `<li>${listItemText}</li>`;
                    } else {
                        if (answerInList) {
                            answerContent += answerListType === 'ul' ? '</ul>' : '</ol>';
                            answerInList = false;
                            answerListType = null;
                        }
                        
                        answerContent += `<p>${answerLine}</p>`;
                    }
                    
                    j++;
                }
                
                // Close any open lists in the answer
                if (answerInList) {
                    answerContent += answerListType === 'ul' ? '</ul>' : '</ol>';
                }
                
                formattedContent += answerContent;
                formattedContent += `</div>`;
                i = j - 1; // Skip processed answer lines
            }
        } else if (line.startsWith('-')) {
            // Format list items
            if (!inList || listType !== 'ul') {
                if (inList) {
                    formattedContent += listType === 'ul' ? '</ul>' : '</ol>';
                }
                formattedContent += '<ul>';
                inList = true;
                listType = 'ul';
            }
            
            // Clean up the list item text
            const listItemText = line.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formattedContent += `<li>${listItemText}</li>`;
            
            // Check if this is the last list item
            if (i + 1 >= lines.length || 
                (!lines[i + 1].trim().startsWith('-') && lines[i + 1].trim() !== '')) {
                formattedContent += '</ul>';
                inList = false;
                listType = null;
            }
        } else if (line.match(/^\d+\./)) {
            // Format numbered lists
            if (!inList || listType !== 'ol') {
                if (inList) {
                    formattedContent += listType === 'ul' ? '</ul>' : '</ol>';
                }
                formattedContent += '<ol>';
                inList = true;
                listType = 'ol';
            }
            
            // Clean up the list item text
            const listItemText = line.substring(line.indexOf('.')+1).trim()
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formattedContent += `<li>${listItemText}</li>`;
            
            // Check if this is the last list item
            if (i + 1 >= lines.length || 
                (!lines[i + 1].trim().match(/^\d+\./) && lines[i + 1].trim() !== '')) {
                formattedContent += '</ol>';
                inList = false;
                listType = null;
            }
        } else {
            // Close any open lists before adding a regular paragraph
            if (inList) {
                formattedContent += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
                listType = null;
            }
            
            // Regular paragraph
            formattedContent += `<p>${line}</p>`;
        }
    }
    
    // Close any open lists at the end
    if (inList) {
        formattedContent += listType === 'ul' ? '</ul>' : '</ol>';
    }
    
    return formattedContent;
}

// New function: Generate schema.org structured data for AEO
function generateSchemaMarkup(item, type) {
    if (!item) return '';
    
    // Extract questions and answers from the description
    const extractQAPairs = (description) => {
        if (!description) return [];
        
        const qaPairs = [];
        const lines = description.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const isQuestion = (line.match(/^(What|How|Why|When|Where|Which|Who|Can|Is|Are|Do|Does|Will)/i) || line.includes('?'));
            
            if (isQuestion) {
                let answer = '';
                let j = i + 1;
                
                // Collect the answer (may span multiple lines)
                while (j < lines.length && 
                       !lines[j].match(/^(What|How|Why|When|Where|Which|Who|Can|Is|Are|Do|Does|Will)/i) && 
                       !lines[j].includes('?') && 
                       lines[j].trim() !== '') {
                    answer += lines[j] + ' ';
                    j++;
                }
                
                if (answer) {
                    qaPairs.push({
                        question: line,
                        answer: answer.trim()
                    });
                }
                
                i = j - 1; // Skip processed answer lines
            }
        }
        
        return qaPairs;
    };
    
    let schema;
    
    if (type === 'concept') {
        // Create TechArticle schema
        const qaPairs = extractQAPairs(item.fullDescription);
        
        schema = {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": item.name,
            "description": item.shortDescription,
            "articleBody": item.fullDescription?.replace(/\n/g, ' ').substring(0, 500) + '...',
            "keywords": item.name.split(' ').filter(w => w.length > 3)
        };
        
        // If we have Q&A pairs, add FAQPage schema as well
        if (qaPairs.length > 0) {
            schema = [
                schema,
                {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": qaPairs.map(qa => ({
                        "@type": "Question",
                        "name": qa.question,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": qa.answer
                        }
                    }))
                }
            ];
        }
    } else if (type === 'tool') {
        // Create SoftwareApplication schema for tools
        schema = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": item.name,
            "description": item.description,
            "applicationCategory": "AIApplication",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            }
        };
    }
    
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// Add this function to inject schema markup into the page
function injectSchemaMarkup(item, type) {
    const schemaMarkup = generateSchemaMarkup(item, type);
    if (schemaMarkup) {
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            existingScript.remove();
        }
        document.head.insertAdjacentHTML('beforeend', schemaMarkup);
    }
}

// Modify the buildContentSection function to include schema markup and improve layout
function buildContentSection(items, type) {
    // Generate schema markup for the first item (main content)
    if (items && items.length > 0 && items[0].items && items[0].items.length > 0) {
        injectSchemaMarkup(items[0].items[0], type);
    }
    
    return `
        ${items.map(item => `
            <section id="${item.id}" class="aeo-section">
                <h2 class="aeo-heading">${item.title}</h2>
                <div class="${type === 'tool' ? 'useful-links' : 'concepts'}">
                    ${item.items.map(subItem => `
                        <div class="${type}-link aeo-item" itemscope itemtype="${type === 'tool' ? 'https://schema.org/SoftwareApplication' : 'https://schema.org/TechArticle'}">
                            <div class="${type}-main-info">
                                ${type === 'tool' 
                                    ? `<a href="${subItem.url}" target="_blank" class="${type}-name" itemprop="name">${subItem.name}</a>
                                       <span class="company-name" itemprop="author">${subItem.company}</span>`
                                    : `<h3 itemprop="name">${subItem.name}</h3>
                                       <div class="concept-intro">
                                         <p itemprop="description" class="aeo-summary">${subItem.shortDescription}</p>
                                       </div>`
                                }
                                <button class="info-button">${uiTranslations.moreInfo}</button>
                            </div>
                            <div class="additional-info" style="display: none;" itemprop="articleBody">
                                <div class="content-wrapper">
                                    ${formatFullDescription(type === 'tool' ? subItem.description : subItem.fullDescription)}
                                </div>
                                ${type === 'tool' && subItem.recentUpdates 
                                    ? `<div class="updates-section">
                                        <h4>Recent Updates</h4>
                                        <div class="content-wrapper">
                                            ${formatFullDescription(subItem.recentUpdates)}
                                        </div>
                                       </div>` 
                                    : ''}
                                ${type === 'concept' && subItem.images && subItem.images.length > 0 
                                    ? `<div class="images-section">
                                        <h4>Visualizations</h4>
                                        <div class="image-gallery">
                                            ${subItem.images.map((image, index) => `
                                                <div class="concept-image-container">
                                                    <img class="concept-image lazy-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${image.url}" alt="${image.alt}" style="max-width: 400px; margin: 10px;" itemprop="image">
                                                    ${image.alt ? `<div class="image-caption">${image.alt}</div>` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                      </div>` 
                                    : ''}
                                ${type === 'concept' && subItem.codeExample 
                                    ? `<div class="code-section">
                                        <h4>${uiTranslations.codeExample}</h4>
                                        <pre><code class="language-python">${escapeHtml(subItem.codeExample)}</code></pre>
                                       </div>` 
                                    : ''}
                                ${type === 'concept' && subItem.commonQuestions && subItem.commonQuestions.length > 0
                                    ? `<div class="faq-section">
                                        <h4>Frequently Asked Questions</h4>
                                        <div class="faq-list">
                                            ${subItem.commonQuestions.map(qa => `
                                                <div class="faq-item">
                                                    <div class="aeo-question">${qa.question}</div>
                                                    <div class="aeo-answer"><p>${qa.answer}</p></div>
                                                </div>
                                            `).join('')}
                                        </div>
                                      </div>`
                                    : ''}
                                ${type === 'concept' && subItem.relatedConcepts && subItem.relatedConcepts.length > 0
                                    ? `<div class="related-concepts">
                                        <h4>Related Concepts</h4>
                                        <ul class="related-list">
                                            ${subItem.relatedConcepts.map(concept => `
                                                <li><a href="#/${concept}" class="related-link">${concept.replace(/-/g, ' ')}</a></li>
                                            `).join('')}
                                        </ul>
                                      </div>`
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

function checkRSSAvailability() {
    // Check if we're in production where RSS fails
    const isProduction = window.location.hostname === 'ai-know.org' || 
                        !window.location.hostname.includes('localhost');
    
    // Check for any cached RSS data
    const cachedFeed = sessionStorage.getItem('rssFeedCache');
    const cacheTimestamp = sessionStorage.getItem('rssFeedCacheTime');
    
    // If we're in production and have no cache, preemptively adjust layout
    if (isProduction && (!cachedFeed || !cacheTimestamp)) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            console.log('Preemptively removing RSS section in production environment');
            
            // Add a class to the body to indicate no sidebar
            document.body.classList.add('no-sidebar-layout');
            
            // Remove the sidebar completely
            sidebar.remove();
            
            // Find and adjust the container
            const container = document.querySelector('.container') || document.querySelector('.main-container');
            if (container) {
                container.classList.remove('with-sidebar');
                container.classList.add('no-sidebar');
            }
            
            // Adjust the main content
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.classList.add('full-width');
                mainContent.style.width = '100%';
                mainContent.style.maxWidth = '1200px';
                mainContent.style.margin = '0 auto';
            }
        }
    }
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

    // Check RSS availability immediately
    checkRSSAvailability();
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set language based on URL or default
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('lang')) {
        const langParam = urlParams.get('lang');
        if (document.getElementById('language-selector')) {
            document.getElementById('language-selector').value = langParam;
        }
        // Use loadContent with the URL parameter
        loadContent(langParam);
    } else {
        // Use default language (Hebrew)
        loadContent('he');
    }

    // Setup language selector
    if (document.getElementById('language-selector')) {
        document.getElementById('language-selector').addEventListener('change', function() {
            const selectedLang = this.value;
            loadContent(selectedLang);
            // Update URL to reflect language change
            const url = new URL(window.location);
            url.searchParams.set('lang', selectedLang);
            window.history.pushState({}, '', url);
        });
    }

    // Setup navigation toggle for mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navContent = document.querySelector('.nav-content');
    
    if (menuToggle && navContent) {
        menuToggle.addEventListener('click', function() {
            navContent.classList.toggle('show');
            menuToggle.classList.toggle('active');
        });
    }
});

// Add a loading flag to prevent duplicate loads
let isLoadingContent = false;

/**
 * Load content based on the selected language
 */
async function loadContent(language) {
    // Prevent multiple simultaneous loads
    if (isLoadingContent) return;
    
    try {
        isLoadingContent = true;
        
        // Show loading indicator
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = '<div class="loading-indicator">טוען תוכן...</div>';
        }
        
        // Load YAML data
        const response = await fetch(`/data/news_${language}.yaml`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const yamlText = await response.text();
        const content = jsyaml.load(yamlText);
        
        // Process and display the content
        displayContent(content);
        
        // Update navigation
        updateNavigation(content);
        
        // Generate schema.org markup for AEO
        AEO.generateSchema(content);
        
    } catch (error) {
        console.error('Error loading content:', error);
        document.getElementById('mainContent').innerHTML = `<p>Error loading content: ${error.message}</p>`;
    } finally {
        isLoadingContent = false;
    }
}

/**
 * Display content in an AEO-friendly structure
 */
function displayContent(content) {
    if (!content || !content.hot_news) {
        document.getElementById('mainContent').innerHTML = '<p>No content available</p>';
        return;
    }

    // Create main content HTML with AEO-friendly structure
    let html = `<h1>Latest Artificial Intelligence News</h1>`;
    
    // Process each section
    content.hot_news.forEach(section => {
        const sectionSlug = createSlug(section.section);
        
        html += `
        <section id="${sectionSlug}" class="news-section">
            <h2>${section.section}</h2>
        `;
        
        // Process topics within the section
        if (section.topics && section.topics.length > 0) {
            section.topics.forEach(topic => {
                const topicSlug = createSlug(topic.title);
                
                html += `
                <article id="${topicSlug}" class="news-topic">
                    <h3>${topic.title}</h3>
                `;
                
                // If this topic has questions, display them in an AEO-friendly format
                if (topic.questions && topic.questions.length > 0) {
                    html += `<div class="questions-section">`;
                    
                    topic.questions.forEach(q => {
                        html += `
                        <div class="question-answer-pair">
                            <h4 class="question-header">${q.question}</h4>
                            <p class="direct-answer" data-question="${q.question}">${q.answer}</p>
                        </div>
                        `;
                    });
                    
                    html += `</div>`;
                }
                
                // Display full description with proper formatting
                html += `<div class="full-description">`;
                
                // Process description text - convert markdown-style formatting
                if (topic.description) {
                    const formattedDescription = formatDescription(topic.description);
                    html += formattedDescription;
                }
                
                // Display images with proper alt text
                if (topic.images && topic.images.length > 0) {
                    html += `<div class="image-gallery">`;
                    topic.images.forEach(img => {
                        if (img && img !== 's') { // Skip placeholder images
                            // Try different image paths to find the correct one
                            html += `
                            <figure>
                                <img src="/images/${img}" alt="${topic.title}" class="lightbox-image" loading="lazy" onerror="this.onerror=null; this.src='/img/${img}';">
                                <figcaption>${topic.title}</figcaption>
                            </figure>
                            `;
                        }
                    });
                    html += `</div>`;
                }
                
                // Display links
                if (topic.links && topic.links.length > 0) {
                    html += `<div class="resource-links"><h5>קישורים נוספים:</h5><ul>`;
                    topic.links.forEach(link => {
                        html += `<li><a href="${link.url}" target="_blank" rel="noopener">${link.name}</a></li>`;
                    });
                    html += `</ul></div>`;
                }
                
                html += `</div></article>`;
            });
        }
        
        html += `</section>`;
    });
    
    // Insert content into main container
    document.getElementById('mainContent').innerHTML = html;
    
    // Now that content is loaded, add the AEO navigation
    addAEONavigation(content);
    
    // Add event listeners for lightbox images
    setupLightboxImages();
}

/**
 * Format description text, converting markdown-style content to HTML
 * Using a different name to avoid conflict with existing functions
 */
function formatDescription(description) {
    if (!description) return '';
    
    let html = '';
    const paragraphs = description.split('\n\n');
    
    paragraphs.forEach(paragraph => {
        paragraph = paragraph.trim();
        
        if (!paragraph) return;
        
        // Check if this is a list
        if (paragraph.includes('\n- ')) {
            const listItems = paragraph.split('\n');
            let listTitle = '';
            
            // Check if first line is a title
            if (!listItems[0].startsWith('- ')) {
                listTitle = `<h5>${listItems[0]}</h5>`;
                listItems.shift();
            }
            
            html += listTitle + '<ul>';
            listItems.forEach(item => {
                if (item.startsWith('- ')) {
                    html += `<li>${item.substring(2)}</li>`;
                }
            });
            html += '</ul>';
        } else {
            html += `<p>${paragraph}</p>`;
        }
    });
    
    return html;
}

/**
 * Update navigation based on content
 * Modified to use the addAEONavigation function
 */
function updateNavigation(content) {
    // No longer modifies main nav, just ensures it's intact
    const navElement = document.getElementById('main-nav');
    if (navElement && navElement.children.length === 0) {
        // Only add default items if nav is empty
        navElement.innerHTML = `
            <li><a href="#/hot-news">חדשות</a></li>
            <li><a href="#/models">מודלים</a></li>
            <li><a href="#/tools">כלים</a></li>
            <li><a href="#/articles">מאמרים</a></li>
        `;
    }
}

/**
 * Add AEO navigation after content is loaded
 */
function addAEONavigation(content) {
    if (!content || !content.hot_news) return;
    
    // Create the AEO section nav HTML
    let aeoNavHtml = '<div class="aeo-section-nav"><h4>מדורי חדשות</h4><ul>';
    
    // Create navigation items for each section
    content.hot_news.forEach(section => {
        const sectionSlug = createSlug(section.section);
        aeoNavHtml += `<li><a href="#${sectionSlug}" class="section-link">${section.section}</a></li>`;
    });
    
    // Add FAQ link specifically for AEO if it doesn't exist
    if (!content.hot_news.some(section => section.section.includes("FAQ"))) {
        aeoNavHtml += `<li><a href="#faq" class="faq-link">שאלות נפוצות</a></li>`;
    }
    
    aeoNavHtml += '</ul></div>';
    
    // Create a container for the AEO nav
    const aeoNavContainer = document.createElement('div');
    aeoNavContainer.className = 'aeo-navigation';
    aeoNavContainer.innerHTML = aeoNavHtml;
    
    // Find where to insert the navigation
    const mainContent = document.getElementById('mainContent');
    const firstHeading = mainContent.querySelector('h1');
    
    if (firstHeading) {
        firstHeading.insertAdjacentElement('afterend', aeoNavContainer);
    } else {
        mainContent.insertAdjacentElement('afterbegin', aeoNavContainer);
    }
    
    // Add event listeners for smooth scrolling
    document.querySelectorAll('.aeo-navigation a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Setup lightbox functionality for images
 */
function setupLightboxImages() {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeLightbox = document.querySelector('.close-lightbox');
    
    // Add click event to all images with lightbox-image class
    document.querySelectorAll('.lightbox-image').forEach(img => {
        img.addEventListener('click', function() {
            lightboxImg.src = this.src;
            lightboxCaption.innerHTML = this.alt;
            lightbox.style.display = 'block';
        });
    });
    
    // Close lightbox when clicking X
    closeLightbox.addEventListener('click', function() {
        lightbox.style.display = 'none';
    });
    
    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
        }
    });
}

/**
 * Create a URL-friendly slug from a string
 */
function createSlug(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Export functions only if not already defined in window scope
if (typeof window.createSlug !== 'function') {
    window.createSlug = function(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };
}

// Ensure export does not overwrite existing exports
export { loadContent, createSlug };

// Add a separate initialization function for AEO
function initializeAEO() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAeoMode = urlParams.get('aeo') === 'true';
    
    if (isAeoMode) {
        // Create the AEO page
        createAEOPage();
        
        // Add indicator that we're in AEO mode
        const aeoIndicator = document.createElement('div');
        aeoIndicator.className = 'aeo-mode-indicator';
        aeoIndicator.innerHTML = 'מצב AEO <a href="/" class="aeo-toggle">צא ממצב AEO</a>';
        document.body.appendChild(aeoIndicator);
        
        // Intercept regular site navigation links to maintain AEO mode
        document.addEventListener('click', function(e) {
            // Check if clicked element is a link
            if (e.target.tagName === 'A' && e.target.className !== 'aeo-toggle') {
                const href = e.target.getAttribute('href');
                // Only process internal links
                if (href && href.startsWith('/') && !href.startsWith('//')) {
                    e.preventDefault();
                    // Add AEO parameter to the URL
                    window.location.href = href + (href.includes('?') ? '&' : '?') + 'aeo=true';
                }
            }
        });
    }
}

/**
 * Creates a dedicated AEO page with structured content
 */
function createAEOPage() {
    // Get the current language from the HTML lang attribute
    const lang = document.documentElement.lang || 'he';
    
    // Hide the regular page content
    const mainContent = document.querySelector('.container');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Create the AEO page container
    const aeoPage = document.createElement('div');
    aeoPage.className = 'aeo-page';
    document.body.appendChild(aeoPage);
    
    // Create header
    const aeoHeader = document.createElement('header');
    aeoHeader.className = 'aeo-header';
    aeoHeader.innerHTML = `
        <h1>מרכז המידע AEO</h1>
        <p class="aeo-description">מרכז מידע מובנה ומותאם למנועי תשובות. בחר נושא מהניווט למטה לקבלת מידע מפורט ותשובות לשאלות נפוצות.</p>
    `;
    aeoPage.appendChild(aeoHeader);
    
    // Load AEO content
    loadAEOContent(lang, aeoPage);
}

/**
 * Loads AEO optimized content based on the selected language
 * @param {string} lang - The language code
 * @param {HTMLElement} aeoPage - The AEO page container
 */
function loadAEOContent(lang, aeoPage) {
    // Log that we're loading AEO content
    console.log(`Loading AEO content for language: ${lang}`);
    
    // Fetch the content data - specifically load from a separate AEO file
    fetch(`data/aeo_${lang}.yml`)
        .then(response => {
            if (!response.ok) {
                // Fallback to regular content file if AEO-specific file doesn't exist
                console.log('AEO-specific file not found, falling back to standard content');
                return fetch(`data/${lang}.yml`);
            }
            return response;
        })
        .then(response => response.text())
        .then(yamlText => {
            // Parse YAML
            const contentData = jsyaml.load(yamlText);
            
            // Create AEO navigation - but exclude hot news sections
            createAEONavigation(contentData, aeoPage);
            
            // Create AEO content sections - but exclude hot news
            createAEOContentSections(contentData, aeoPage);
            
            // Add footer
            const aeoFooter = document.createElement('footer');
            aeoFooter.className = 'aeo-footer';
            aeoFooter.innerHTML = `
                <p>© ${new Date().getFullYear()} דף מותאם AEO | <a href="/">חזרה לדף הראשי</a></p>
                <div class="aeo-info">
                    <details>
                        <summary>מהו AEO?</summary>
                        <p>AEO (Answer Engine Optimization) הוא תהליך של מיטוב תוכן כך שיוכל להיות מוצג בצורה אופטימלית במנועי תשובות ובמערכות AI. בדף זה תוכן מובנה בצורה שמותאמת במיוחד למערכות AI מודרניות.</p>
                    </details>
                </div>
            `;
            aeoPage.appendChild(aeoFooter);
        })
        .catch(error => {
            console.error('Error loading AEO content:', error);
            aeoPage.innerHTML = `
                <div style="text-align: center; margin-top: 50px;">
                    <h2>שגיאה בטעינת תוכן AEO</h2>
                    <p>לא ניתן לטעון את תוכן ה-AEO. אנא נסה שוב מאוחר יותר.</p>
                    <p><a href="/">חזרה לדף הראשי</a></p>
                </div>
            `;
        });
}

/**
 * Creates the AEO main navigation
 * @param {Object} contentData - The content data from YAML
 * @param {HTMLElement} aeoPage - The AEO page container
 */
function createAEONavigation(contentData, aeoPage) {
    const navigation = document.createElement('nav');
    navigation.className = 'aeo-main-navigation';
    navigation.innerHTML = '<h2>ניווט נושאים</h2>';
    
    const navList = document.createElement('ul');
    navList.className = 'aeo-main-nav-list';
    
    // Filter sections to exclude hot news and only include AEO-appropriate content
    const aeoSections = contentData.sections ? contentData.sections.filter(section => {
        // Exclude sections that might be hot news or shouldn't be in AEO mode
        return !section.exclude_from_aeo && 
               section.title.toLowerCase() !== 'hot news' && 
               section.section?.toLowerCase() !== 'hot news';
    }) : [];
    
    // Add FAQ section first if it exists
    const faqSection = aeoSections.find(section => 
        section.title.toLowerCase().includes('faq') || 
        section.title.includes('שאלות נפוצות')
    );
    
    if (faqSection) {
        const listItem = document.createElement('li');
        const faqLink = document.createElement('a');
        faqLink.href = `#faq-section`;
        faqLink.className = 'aeo-section-link';
        faqLink.textContent = faqSection.title;
        listItem.appendChild(faqLink);
        navList.appendChild(listItem);
    }
    
    // Add items for each regular section (excluding the FAQ we already added)
    aeoSections.forEach((section, index) => {
        // Skip if this is the FAQ section we already added
        if (section === faqSection) return;
        
        const listItem = document.createElement('li');
        const sectionLink = document.createElement('a');
        sectionLink.href = `#section-${index}`;
        sectionLink.className = 'aeo-section-link';
        sectionLink.textContent = section.title || section.section;
        listItem.appendChild(sectionLink);
        navList.appendChild(listItem);
    });
    
    navigation.appendChild(navList);
    aeoPage.appendChild(navigation);
    
    // Add a separate "AEO Resources" section with curated links
    const resourcesNav = document.createElement('div');
    resourcesNav.className = 'aeo-resources-navigation';
    resourcesNav.innerHTML = '<h2>משאבי AEO</h2>';
    
    const resourcesList = document.createElement('ul');
    resourcesList.className = 'aeo-resources-list';
    
    // Add curated AEO-specific resources
    const aeoResources = [
        { name: 'מדריך מקיף ל-AEO', url: '#aeo-guide' },
        { name: 'שאלות נפוצות', url: '#aeo-faq' },
        { name: 'דוגמאות למבנה תוכן', url: '#aeo-examples' }
    ];
    
    aeoResources.forEach(resource => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = resource.url;
        link.className = 'aeo-resource-link';
        link.textContent = resource.name;
        listItem.appendChild(link);
        resourcesList.appendChild(listItem);
    });
    
    resourcesNav.appendChild(resourcesList);
    aeoPage.appendChild(resourcesNav);
}

/**
 * Creates content sections for AEO page
 * @param {Object} contentData - The content data from YAML
 * @param {HTMLElement} aeoPage - The AEO page container
 */
function createAEOContentSections(contentData, aeoPage) {
    const contentContainer = document.createElement('main');
    contentContainer.className = 'aeo-content';
    aeoPage.appendChild(contentContainer);
    
    // First, check if we have an FAQ section and prioritize it
    let faqSection = null;
    
    if (contentData.sections) {
        faqSection = contentData.sections.find(section => 
            (section.title && section.title.toLowerCase().includes('faq')) || 
            (section.section && section.section.toLowerCase().includes('faq')) ||
            (section.title && section.title.includes('שאלות נפוצות'))
        );
        
        // If we found a FAQ section, create it first
        if (faqSection) {
            const sectionElement = createAEOSectionElement(faqSection, 'faq-section');
            contentContainer.appendChild(sectionElement);
        }
    }
    
    // Create regular sections (excluding hot news and the FAQ we already processed)
    if (contentData.sections) {
        contentData.sections.forEach((section, sectionIndex) => {
            // Skip hot news sections and the FAQ section we already processed
            if (section === faqSection || 
                section.exclude_from_aeo || 
                (section.title && section.title.toLowerCase().includes('hot news')) ||
                (section.section && section.section.toLowerCase().includes('hot news'))) {
                return;
            }
            
            const sectionElement = createAEOSectionElement(section, `section-${sectionIndex}`);
            contentContainer.appendChild(sectionElement);
        });
    }
    
    // Add AEO specific guide section
    addAEOGuideSection(contentContainer);
}

/**
 * Creates an AEO section element from a section object
 * @param {Object} section - The section data
 * @param {string} sectionId - The ID to assign to the section
 * @returns {HTMLElement} The created section element
 */
function createAEOSectionElement(section, sectionId) {
    const sectionElement = document.createElement('section');
    sectionElement.className = 'aeo-section';
    sectionElement.id = sectionId;
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'aeo-section-title';
    sectionTitle.textContent = section.title || section.section;
    sectionElement.appendChild(sectionTitle);
    
    // Create topics within section
    if (section.topics) {
        section.topics.forEach((topic, topicIndex) => {
            const topicElement = document.createElement('div');
            topicElement.className = 'aeo-topic';
            
            const topicTitle = document.createElement('h3');
            topicTitle.className = 'aeo-topic-title';
            topicTitle.textContent = topic.title;
            topicElement.appendChild(topicTitle);
            
            // Add questions and answers
            if (topic.questions) {
                const questionsSection = document.createElement('div');
                questionsSection.className = 'aeo-questions-section';
                
                topic.questions.forEach(question => {
                    const qaPair = document.createElement('div');
                    qaPair.className = 'aeo-question-answer-pair';
                    
                    const questionHeader = document.createElement('h4');
                    questionHeader.className = 'aeo-question-header';
                    questionHeader.textContent = question.title;
                    qaPair.appendChild(questionHeader);
                    
                    if (question.direct_answer) {
                        const directAnswer = document.createElement('p');
                        directAnswer.className = 'aeo-direct-answer';
                        directAnswer.textContent = question.direct_answer;
                        qaPair.appendChild(directAnswer);
                    }
                    
                    if (question.full_answer) {
                        const fullAnswer = document.createElement('div');
                        fullAnswer.className = 'aeo-full-description';
                        fullAnswer.innerHTML = formatContent(question.full_answer);
                        qaPair.appendChild(fullAnswer);
                    }
                    
                    questionsSection.appendChild(qaPair);
                });
                
                topicElement.appendChild(questionsSection);
            }
            
            // Add description if available
            if (topic.description) {
                const description = document.createElement('div');
                description.className = 'aeo-topic-description';
                description.innerHTML = formatContent(topic.description);
                topicElement.appendChild(description);
            }
            
            // Add images if available
            if (topic.images && topic.images.length > 0) {
                const imageGallery = document.createElement('div');
                imageGallery.className = 'aeo-image-gallery';
                
                topic.images.forEach(image => {
                    // Skip if image is just a string
                    const imageSrc = typeof image === 'string' ? image : image.src;
                    const imageAlt = typeof image === 'string' ? topic.title : (image.alt || topic.title);
                    const imageCaption = typeof image === 'string' ? '' : image.caption;
                    
                    const figure = document.createElement('figure');
                    
                    const img = document.createElement('img');
                    img.src = getImagePath(imageSrc);
                    img.alt = imageAlt;
                    img.loading = 'lazy';
                    figure.appendChild(img);
                    
                    if (imageCaption) {
                        const caption = document.createElement('figcaption');
                        caption.textContent = imageCaption;
                        figure.appendChild(caption);
                    }
                    
                    figure.addEventListener('click', () => {
                        openImageLightbox(getImagePath(imageSrc), imageAlt);
                    });
                    
                    imageGallery.appendChild(figure);
                });
                
                topicElement.appendChild(imageGallery);
            }
            
            // Add external resources/links
            if ((topic.links && topic.links.length > 0) || (topic.resources && topic.resources.length > 0)) {
                const resourcesSection = document.createElement('div');
                resourcesSection.className = 'aeo-resource-links';
                
                const resourcesTitle = document.createElement('h5');
                resourcesTitle.textContent = 'קישורים ומקורות נוספים';
                resourcesSection.appendChild(resourcesTitle);
                
                const resourcesList = document.createElement('ul');
                
                // Process links array
                if (topic.links) {
                    topic.links.forEach(link => {
                        const listItem = document.createElement('li');
                        const linkElement = document.createElement('a');
                        linkElement.href = link.url;
                        linkElement.textContent = link.name;
                        if (isExternalUrl(link.url)) {
                            linkElement.target = '_blank';
                            linkElement.rel = 'noopener noreferrer';
                        }
                        listItem.appendChild(linkElement);
                        resourcesList.appendChild(listItem);
                    });
                }
                
                // Process resources array
                if (topic.resources) {
                    topic.resources.forEach(resource => {
                        const listItem = document.createElement('li');
                        const link = document.createElement('a');
                        link.href = resource.url;
                        link.textContent = resource.title;
                        if (resource.external || isExternalUrl(resource.url)) {
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                        }
                        listItem.appendChild(link);
                        resourcesList.appendChild(listItem);
                    });
                }
                
                resourcesSection.appendChild(resourcesList);
                topicElement.appendChild(resourcesSection);
            }
            
            sectionElement.appendChild(topicElement);
        });
    }
    
    return sectionElement;
}

/**
 * Adds a dedicated AEO guide section to the content
 * @param {HTMLElement} contentContainer - The content container
 */
function addAEOGuideSection(contentContainer) {
    const guideSection = document.createElement('section');
    guideSection.className = 'aeo-section';
    guideSection.id = 'aeo-guide';
    
    const guideTitle = document.createElement('h2');
    guideTitle.className = 'aeo-section-title';
    guideTitle.textContent = 'מדריך מקיף ל-AEO';
    guideSection.appendChild(guideTitle);
    
    const guideTopic = document.createElement('div');
    guideTopic.className = 'aeo-topic';
    
    const guideContent = document.createElement('div');
    guideContent.className = 'aeo-topic-description';
    guideContent.innerHTML = `
        <p>מדריך זה מסביר כיצד לבנות תוכן אופטימלי למנועי תשובות ומערכות AI מודרניות.</p>
        
        <h4>מהו AEO?</h4>
        <p>AEO (Answer Engine Optimization) הוא תהליך אופטימיזציה של תוכן למנועי תשובות ומערכות AI. בעוד ש-SEO (Search Engine Optimization) מתמקד בשיפור דירוג אתרים במנועי חיפוש, AEO מתמקד ביכולת של מערכות AI להבין תוכן, לחלץ ממנו תשובות, ולהציג אותן בצורה יעילה למשתמשים.</p>
        
        <h4>עקרונות מפתח ב-AEO</h4>
        <ul>
            <li><strong>מבנה סמנטי:</strong> ארגון תוכן במבנה היררכי ברור עם כותרות, תת-כותרות ותגיות סמנטיות</li>
            <li><strong>Schema.org:</strong> שימוש בסימון סכמה כדי לספק הקשר ומשמעות לתוכן</li>
            <li><strong>שאלות ותשובות:</strong> מתן תשובות ישירות וברורות לשאלות נפוצות</li>
            <li><strong>נתונים מובנים:</strong> הצגת מידע בפורמטים מובנים כמו טבלאות, רשימות ופורמטים מובנים אחרים</li>
            <li><strong>קשרים והקשר:</strong> הצגת קשרים בין רעיונות ומושגים שונים והספקת הקשר מספק</li>
        </ul>
        
        <h4>יישום AEO באתר שלך</h4>
        <ol>
            <li>ארגן את התוכן שלך במבנה היררכי ברור עם כותרות משמעותיות</li>
            <li>השתמש בסימון schema.org כדי לספק הקשר סמנטי</li>
            <li>הכן תשובות ישירות לשאלות שעשויות להישאל על ידי משתמשים</li>
            <li>ארגן נתונים בפורמטים מובנים כמו רשימות וטבלאות</li>
            <li>השתמש בקישורים פנימיים כדי לחבר נושאים קשורים</li>
            <li>הוסף תוכן עשיר כמו תמונות, סרטונים וגרפיקה עם תיאורים מפורטים</li>
        </ol>
    `;
    
    guideTopic.appendChild(guideContent);
    guideSection.appendChild(guideTopic);
    contentContainer.appendChild(guideSection);
    
    // Add AEO FAQ section
    const faqSection = document.createElement('section');
    faqSection.className = 'aeo-section';
    faqSection.id = 'aeo-faq';
    
    const faqTitle = document.createElement('h2');
    faqTitle.className = 'aeo-section-title';
    faqTitle.textContent = 'שאלות נפוצות על AEO';
    faqSection.appendChild(faqTitle);
    
    const faqTopic = document.createElement('div');
    faqTopic.className = 'aeo-topic';
    
    const faqContent = document.createElement('div');
    faqContent.className = 'aeo-questions-section';
    
    // Add some common AEO FAQs
    const aeoFaqs = [
        {
            question: "מה ההבדל בין SEO ל-AEO?",
            answer: "SEO (Search Engine Optimization) מתמקד בשיפור הדירוג של אתרים במנועי חיפוש, בעוד AEO (Answer Engine Optimization) מתמקד באופטימיזציה של תוכן למנועי תשובות ומערכות AI, כך שיוכלו להבין את התוכן ולספק תשובות ישירות למשתמשים."
        },
        {
            question: "איך אני יכול לשפר את AEO באתר שלי?",
            answer: "שפר את AEO באתר שלך על ידי שימוש בסימון schema.org, ארגון תוכן במבנה היררכי ברור, יצירת תוכן בפורמט שאלות ותשובות, ושימוש בנתונים מובנים כמו טבלאות ורשימות."
        },
        {
            question: "האם AEO ישפיע על הדירוג שלי במנועי חיפוש?",
            answer: "כן, AEO יכול לשפר את הדירוג שלך בעקיפין, מכיוון שאסטרטגיות טובות ל-AEO גם תורמות ל-SEO, וכן עשויות להגדיל את הסיכוי שהתוכן שלך יוצג כתשובה מובהקת בתוצאות חיפוש."
        }
    ];
    
    aeoFaqs.forEach(faq => {
        const qaPair = document.createElement('div');
        qaPair.className = 'aeo-question-answer-pair';
        
        const questionHeader = document.createElement('h4');
        questionHeader.className = 'aeo-question-header';
        questionHeader.textContent = faq.question;
        qaPair.appendChild(questionHeader);
        
        const directAnswer = document.createElement('p');
        directAnswer.className = 'aeo-direct-answer';
        directAnswer.textContent = faq.answer;
        qaPair.appendChild(directAnswer);
        
        faqContent.appendChild(qaPair);
    });
    
    faqTopic.appendChild(faqContent);
    faqSection.appendChild(faqTopic);
    contentContainer.appendChild(faqSection);
    
    // Add AEO examples section
    const examplesSection = document.createElement('section');
    examplesSection.className = 'aeo-section';
    examplesSection.id = 'aeo-examples';
    
    const examplesTitle = document.createElement('h2');
    examplesTitle.className = 'aeo-section-title';
    examplesTitle.textContent = 'דוגמאות למבנה תוכן AEO';
    examplesSection.appendChild(examplesTitle);
    
    const examplesTopic = document.createElement('div');
    examplesTopic.className = 'aeo-topic';
    
    const examplesContent = document.createElement('div');
    examplesContent.className = 'aeo-topic-description';
    examplesContent.innerHTML = `
        <h4>דוגמה למבנה שאלות ותשובות</h4>
        <pre>
&lt;div itemscope itemtype="https://schema.org/FAQPage"&gt;
  &lt;div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"&gt;
    &lt;h3 itemprop="name"&gt;מהו AEO?&lt;/h3&gt;
    &lt;div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"&gt;
      &lt;div itemprop="text"&gt;
        &lt;p&gt;AEO הוא תהליך אופטימיזציה של תוכן למנועי תשובות ומערכות AI.&lt;/p&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;
        </pre>
        
        <h4>דוגמה למבנה מאמר</h4>
        <pre>
&lt;article itemscope itemtype="https://schema.org/Article"&gt;
  &lt;h1 itemprop="headline"&gt;כותרת המאמר&lt;/h1&gt;
  &lt;div itemprop="author" itemscope itemtype="https://schema.org/Person"&gt;
    &lt;span itemprop="name"&gt;שם המחבר&lt;/span&gt;
  &lt;/div&gt;
  &lt;div itemprop="articleBody"&gt;
    &lt;p&gt;תוכן המאמר...&lt;/p&gt;
  &lt;/div&gt;
&lt;/article&gt;
        </pre>
        
        <h4>דוגמה למבנה מוצר</h4>
        <pre>
&lt;div itemscope itemtype="https://schema.org/Product"&gt;
  &lt;h1 itemprop="name"&gt;שם המוצר&lt;/h1&gt;
  &lt;img itemprop="image" src="image.jpg" alt="תיאור המוצר"&gt;
  &lt;div itemprop="description"&gt;תיאור המוצר...&lt;/div&gt;
  &lt;div itemprop="offers" itemscope itemtype="https://schema.org/Offer"&gt;
    &lt;span itemprop="price"&gt;100&lt;/span&gt;
    &lt;meta itemprop="priceCurrency" content="ILS"&gt;
  &lt;/div&gt;
&lt;/div&gt;
        </pre>
    `;
    
    examplesTopic.appendChild(examplesContent);
    examplesSection.appendChild(examplesTopic);
    contentContainer.appendChild(examplesSection);
}

/**
 * Build Privacy Policy content section
 * @returns {string} HTML content for privacy policy
 */
function buildPrivacyPolicySection() {
    const t = uiTranslations;
    
    // Fallback content if translations aren't loaded yet
    if (!t || !t.privacyPolicyTitle) {
        return `
            <div class="legal-page-content">
                <h1>Privacy Policy - מדיניות פרטיות</h1>
                <div class="legal-content-body">
                    <p>Loading translations...</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="legal-page-content">
            <h1>${t.privacyPolicyTitle}</h1>
            <div class="legal-content-body">
                <p class="effective-date"><strong>${t.effectiveDate}</strong></p>

                <h2>${t.privacyIntroTitle}</h2>
                <p>${t.privacyIntro}</p>

                <h2>${t.infoCollectTitle}</h2>
                <h3>${t.infoProvidedTitle}</h3>
                <ul>
                    ${Array.isArray(t.infoProvidedList) ? t.infoProvidedList.map(item => `<li>${item}</li>`).join('') : ''}
                </ul>

                <h3>${t.infoAutoTitle}</h3>
                <ul>
                    ${Array.isArray(t.infoAutoList) ? t.infoAutoList.map(item => `<li>${item}</li>`).join('') : ''}
                </ul>

                <h2>${t.howWeUseTitle}</h2>
                <ul>
                    ${Array.isArray(t.howWeUseList) ? t.howWeUseList.map(item => `<li>${item}</li>`).join('') : ''}
                </ul>

                <h2>${t.contactUsTitle}</h2>
                <p>${t.contactUsText}</p>
                <ul>
                    <li>${t.contactEmail}</li>
                    <li>${t.contactLinkedIn} <a href="https://www.linkedin.com/in/leon-melamud" target="_blank">Leon Melamud</a></li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Build Terms of Service content section
 * @returns {string} HTML content for terms of service
 */
function buildTermsOfServiceSection() {
    const t = uiTranslations;
    
    // Fallback content if translations aren't loaded yet
    if (!t || !t.termsOfServiceTitle) {
        return `
            <div class="legal-page-content">
                <h1>Terms of Service - תנאי שימוש</h1>
                <div class="legal-content-body">
                    <p>Loading translations...</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="legal-page-content">
            <h1>${t.termsOfServiceTitle}</h1>
            <div class="legal-content-body">
                <p class="effective-date"><strong>${t.effectiveDate}</strong></p>

                <h2>${t.tosAcceptanceTitle}</h2>
                <p>${t.tosAcceptanceText}</p>

                <h2>${t.tosPermittedTitle}</h2>
                <p>${t.tosPermittedText}</p>
                <ul>
                    ${Array.isArray(t.tosPermittedList) ? t.tosPermittedList.map(item => `<li>${item}</li>`).join('') : ''}
                </ul>

                <h2>${t.tosProhibitedTitle}</h2>
                <p>${t.tosProhibitedText}</p>
                <ul>
                    ${Array.isArray(t.tosProhibitedList) ? t.tosProhibitedList.map(item => `<li>${item}</li>`).join('') : ''}
                </ul>

                <h2>${t.tosContactTitle}</h2>
                <p>${t.tosContactText}</p>
                <ul>
                    <li>${t.tosContactEmail}</li>
                    <li>${t.contactLinkedIn} <a href="https://www.linkedin.com/in/leon-melamud" target="_blank">Leon Melamud</a></li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Check if URL is external
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL is external
 */
function isExternalUrl(url) {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('//');
}
