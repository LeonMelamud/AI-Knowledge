// FIXME: Commented import suggests circular dependency issues
// Remove the import that might be causing conflicts
// import { currentLanguage, hotNewsData } from './main.js';

// TODO: Consider moving image observation logic to a separate utility module
// Initialize Intersection Observer for lazy loading images
const observeImages = () => {
    console.log('Setting up image observers for lazy loading');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    // Get the primary source
                    const src = img.dataset.src;
                    console.log('Loading image:', src);
                    
                    // Get alternative paths if available
                    let altPaths = [];
                    try {
                        if (img.dataset.altPaths) {
                            altPaths = JSON.parse(img.dataset.altPaths);
                            console.log('Alternative paths available:', altPaths);
                        }
                    } catch (e) {
                        console.error('Error parsing alternative paths:', e);
                    }
                    
                    // TODO: Add exponential backoff for retry attempts
                    // HACK: Relying on external service (placehold.co) for fallback images
                    const tryLoadingImage = (pathIndex = 0) => {
                        // If we've tried all paths, use placeholder
                        if (pathIndex >= altPaths.length) {
                            console.warn(`All image paths failed for ${img.alt}`);
                            const title = img.alt || 'AI News';
                            const words = title.split(' ').slice(0, 2).join(' ');
                            // FIXME: External dependency on placehold.co service
                            img.src = `https://placehold.co/100x100/2196F3/FFFFFF?text=${encodeURIComponent(words)}`;
                            img.classList.add('error');
                            observer.unobserve(img);
                            return;
                        }
                        
                        // Try current path
                        const currentPath = altPaths[pathIndex];
                        console.log(`Trying path ${pathIndex + 1}/${altPaths.length}: ${currentPath}`);
                        
                        const tempImg = new Image();
                        
                        tempImg.onload = () => {
                            // This path worked
                            console.log(`Image loaded successfully from: ${currentPath}`);
                            img.src = currentPath;
                            img.classList.add('loaded');
                            img.removeAttribute('data-src');
                            img.removeAttribute('data-alt-paths');
                            observer.unobserve(img);
                        };
                        
                        tempImg.onerror = () => {
                            // Try next path
                            console.warn(`Failed to load image from: ${currentPath}`);
                            tryLoadingImage(pathIndex + 1);
                        };
                        
                        tempImg.src = currentPath;
                    };
                    
                    // Start trying paths
                    if (altPaths.length > 0) {
                        tryLoadingImage(0);
                    } else {
                        // No alternative paths, just try the main source
                        const tempImg = new Image();
                        
                        tempImg.onload = () => {
                            img.src = src;
                            img.classList.add('loaded');
                            img.removeAttribute('data-src');
                            img.removeAttribute('data-alt-paths');
                            observer.unobserve(img);
                        };
                        
                        tempImg.onerror = () => {
                            console.warn(`Failed to load image: ${src}`);
                            const title = img.alt || 'AI News';
                            const words = title.split(' ').slice(0, 2).join(' ');
                            img.src = `https://placehold.co/100x100/2196F3/FFFFFF?text=${encodeURIComponent(words)}`;
                            img.classList.add('error');
                            observer.unobserve(img);
                        };
                        
                        tempImg.src = src;
                    }
                }
            }
        });
    }, {
        rootMargin: '100px 0px', // Load images 100px before they enter viewport
        threshold: 0.1
    });

    // Observe all news images
    const images = document.querySelectorAll('.news-image[data-src]');
    console.log(`Found ${images.length} images to lazy load`);
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
};

/**
 * Hot News functionality for AI Knowledge Base
 * Handles rendering of hot news items with structured question-answer support
 */

// TODO: Move styles to separate CSS file instead of injecting via JavaScript
// HACK: Injecting styles via JavaScript instead of using proper CSS files
export function addHotNewsStyles() {
    if (document.getElementById('hotNewsStyles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'hotNewsStyles';
    styleElement.textContent = `
        .hot-news-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .news-section-title {
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            font-size: 1.8rem;
            color: var(--primary-color, #2196F3);
            border-bottom: 2px solid var(--primary-color, #2196F3);
            text-transform: capitalize;
        }
        
        .news-item {
            background-color: var(--card-bg, #ffffff);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .news-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
        }
        
        .news-header {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .news-image {
            width: 100px;
            height: 100px;
            border-radius: 8px;
            object-fit: cover;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            background-color: rgba(0, 0, 0, 0.03);
            transition: opacity 0.3s ease;
        }
        
        .news-image.loaded {
            opacity: 1;
        }
        
        .news-image:not(.loaded):not(.error) {
            opacity: 0.5;
        }
        
        .news-image.error {
            opacity: 0.8;
            border: 1px dashed rgba(0, 0, 0, 0.1);
        }
        
        .news-title {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--primary-color, #2196F3);
        }
        
        .news-date {
            font-size: 0.85rem;
            color: var(--text-muted, #777777);
            margin-top: 5px;
        }
        
        .news-description {
            margin-bottom: 15px;
            line-height: 1.6;
            color: var(--text-color, #333333);
        }
        
        .news-description p {
            margin-bottom: 0.8em;
        }
        
        .news-description ul, .news-description ol {
            margin-bottom: 1em;
            padding-left: 1.5em;
        }
        
        .news-description li {
            margin-bottom: 0.5em;
        }
        
        .news-description .content-spacer {
            height: 0.5em;
        }
        
        /* Image Gallery Styles */
        .news-image-gallery {
            margin: 20px 0;
            padding: 15px;
            background-color: var(--secondary-bg, #f8f8f8);
            border-radius: 8px;
        }
        
        .gallery-title {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1.1rem;
            color: var(--text-color, #333333);
            font-weight: 500;
        }
        
        .gallery-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: flex-start;
        }
        
        .gallery-item {
            width: calc(33.333% - 10px);
            max-width: 200px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease;
        }
        
        .gallery-item:hover {
            transform: scale(1.03);
        }
        
        .gallery-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
            display: block;
            border-radius: 6px;
        }
        
        @media (max-width: 768px) {
            .gallery-item {
                width: calc(50% - 10px);
            }
        }
        
        @media (max-width: 480px) {
            .gallery-item {
                width: 100%;
                max-width: 100%;
            }
        }
        
        /* Modal Image Viewer */
        .image-viewer-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            padding-top: 50px;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.9);
        }
        
        .modal-content {
            margin: auto;
            display: block;
            width: 80%;
            max-width: 900px;
            position: relative;
        }
        
        .modal-image {
            max-width: 100%;
            max-height: 80vh;
            display: block;
            margin: 0 auto;
            border-radius: 4px;
        }
        
        .modal-caption {
            margin: 15px auto;
            display: block;
            width: 80%;
            max-width: 700px;
            text-align: center;
            color: #ccc;
            padding: 10px 0;
            height: auto;
        }
        
        .close-button {
            position: absolute;
            top: -40px;
            right: 15px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            transition: 0.3s;
            cursor: pointer;
        }
        
        .close-button:hover,
        .close-button:focus {
            color: #bbb;
            text-decoration: none;
            cursor: pointer;
        }
        
        /* Animation for Modal */
        .modal-content, .modal-caption {
            animation-name: zoom;
            animation-duration: 0.6s;
        }
        
        @keyframes zoom {
            from {transform:scale(0)}
            to {transform:scale(1)}
        }
        
        .news-links {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .news-link {
            display: inline-block;
            padding: 6px 12px;
            background-color: var(--secondary-bg, #f5f5f5);
            border-radius: 20px;
            text-decoration: none;
            color: var(--primary-color, #2196F3);
            font-size: 0.9rem;
            transition: background-color 0.2s ease;
        }
        
        .news-link:hover {
            background-color: var(--hover-bg, #e0e0e0);
        }
        
        .news-questions {
            margin-top: 20px;
            border-top: 1px solid var(--border-color, #eeeeee);
            padding-top: 15px;
        }
        
        .question-item {
            margin-bottom: 15px;
            border-left: 3px solid var(--primary-color, #2196F3);
            padding-left: 15px;
        }
        
        .question {
            font-weight: 600;
            color: var(--primary-color, #2196F3);
            margin-bottom: 8px;
            font-size: 1.1rem;
        }
        
        .answer {
            line-height: 1.6;
            color: var(--text-color, #333333);
        }
        
        /* Fix for RTL languages */
        html[dir="rtl"] .question-item {
            border-left: none;
            border-right: 3px solid var(--primary-color, #2196F3);
            padding-left: 0;
            padding-right: 15px;
        }
        
        /* Loading state */
        .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
        }
        
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid var(--primary-color, #2196F3);
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Fix white-space pre-line issue */
        .news-description {
            white-space: normal;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Build the hot news section
export function buildHotNewsSection(translations) {
    return `
        <div class="section-container">
            <h2 class="section-title">${translations.hotNewsTitle || 'Hot AI News'}</h2>
            <p class="section-description">${translations.hotNewsDescription || 'Latest advancements and updates in AI technology'}</p>
            <div id="hotNewsContainer" class="hot-news-container">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>${translations.loading || 'Loading...'}</p>
                </div>
            </div>
        </div>
    `;
}

// Format questions from structured data
function formatQuestions(questions) {
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return '';
    }
    
    let questionsHtml = '<div class="news-questions">';
    
    questions.forEach(item => {
        if (item.question && item.answer) {
            questionsHtml += `
                <div class="question-item">
                    <div class="question">${item.question}</div>
                    <div class="answer">${item.answer}</div>
                </div>
            `;
        }
    });
    
    questionsHtml += '</div>';
    return questionsHtml;
}

// TODO: Add error boundaries for rendering failures
// FIXME: Too much console logging in production code
export function renderHotNews(newsData) {
    console.log("Rendering hot news with data structure:", typeof newsData, newsData);
    const container = document.getElementById('hotNewsContainer');
    
    if (!container) {
        console.error('Hot news container not found');
        return;
    }
    
    // HACK: Flexible data structure handling without proper validation
    // Handle nested structure - extract the array from hot_news property if it exists
    const newsArray = newsData && newsData.hot_news ? newsData.hot_news : newsData;
    
    console.log('Processed news array:', Array.isArray(newsArray), newsArray?.length);
    
    if (!newsArray || !Array.isArray(newsArray)) {
        console.error('Invalid news data format:', newsData);
        container.innerHTML = '<p>No news data available</p>';
        return;
    }
    
    if (newsArray.length === 0) {
        console.warn('News array is empty');
        container.innerHTML = '<p>No news data available</p>';
        return;
    }
    
    // Debug logging for structure
    console.log('First news item structure:', newsArray[0]);
    if (newsArray[0].section && newsArray[0].topics) {
        console.log('News has section > topics structure');
        console.log('First topic:', newsArray[0].topics[0]);
    }
    
    let newsHtml = '';
    
    // Check if the news items have a nested structure with topics
    if (newsArray[0].section && newsArray[0].topics && Array.isArray(newsArray[0].topics)) {
        // Handle section > topics structure
        newsArray.forEach(section => {
            if (section.section && section.topics && Array.isArray(section.topics)) {
                // Add section header
                newsHtml += `<h3 class="news-section-title">${section.section}</h3>`;
                
                // Process each topic in the section
                section.topics.forEach(news => {
                    newsHtml += createNewsItemHtml(news);
                });
            }
        });
    } else {
        // Handle flat array of news items
        newsArray.forEach(news => {
            newsHtml += createNewsItemHtml(news);
        });
    }
    
    // Add modal container for image viewer at the end
    newsHtml += `
        <div id="imageViewerModal" class="image-viewer-modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <img id="modalImage" class="modal-image">
                <div class="modal-caption"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = newsHtml || '<p>No news data available</p>';
    
    // Initialize lazy loading for images
    console.log('News HTML generated, initializing image observers');
    setTimeout(() => {
        // Make sure all images have proper fallbacks
        document.querySelectorAll('.news-image').forEach(img => {
            if (!img.getAttribute('onerror')) {
                img.onerror = function() {
                    this.onerror = null;
                    const title = this.alt || 'AI News';
                    const words = title.split(' ').slice(0, 2).join(' ');
                    this.src = `https://placehold.co/100x100/2196F3/FFFFFF?text=${encodeURIComponent(words)}`;
                    this.classList.add('error');
                };
            }
        });
        
        // Setup image gallery click handlers
        setupGalleryInteractions();
        
        // Set up lazy loading
        observeImages();
    }, 200);
}

// Setup gallery interactions
function setupGalleryInteractions() {
    // Get the modal
    const modal = document.getElementById('imageViewerModal');
    if (!modal) return;
    
    // Get the modal image tag
    const modalImg = document.getElementById('modalImage');
    const captionText = document.querySelector('.modal-caption');
    
    // Get the close button
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    // Get all gallery images
    const galleryImages = document.querySelectorAll('.gallery-image');
    galleryImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.onclick = function() {
            modal.style.display = 'block';
            modalImg.src = this.src;
            captionText.innerHTML = this.alt;
        };
    });
    
    // Also make header images clickable
    const headerImages = document.querySelectorAll('.news-header .news-image');
    headerImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.onclick = function() {
            modal.style.display = 'block';
            modalImg.src = this.src;
            captionText.innerHTML = this.alt;
        };
    });
    
    // When the user clicks anywhere outside of the modal content, close it
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Format description with proper markdown-style handling
function formatDescription(description) {
    if (!description) return '';
    
    // Replace markdown bullet points with HTML list
    let formattedText = description;
    
    // Check if we have bullet points
    if (description.includes('\n- ')) {
        const lines = description.split('\n');
        let inList = false;
        let result = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('- ')) {
                // Start a list if not already in one
                if (!inList) {
                    inList = true;
                    result += '<ul>';
                }
                
                // Add list item
                result += `<li>${line.substring(2)}</li>`;
            } else {
                // Close list if we were in one
                if (inList) {
                    inList = false;
                    result += '</ul>';
                }
                
                // Add normal paragraph if not empty
                if (line) {
                    result += `<p>${line}</p>`;
                } else {
                    // Add a spacer for empty lines
                    result += '<div class="content-spacer"></div>';
                }
            }
        }
        
        // Close any open list
        if (inList) {
            result += '</ul>';
        }
        
        formattedText = result;
    } else {
        // If no bullet points, just replace newlines with paragraphs
        formattedText = description.split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p>${p.trim()}</p>`)
            .join('');
    }
    
    return formattedText;
}

// Helper function to create HTML for a single news item
function createNewsItemHtml(news) {
    // Default to a placeholder image
    let imagePlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="%23888888"%3ELoading...%3C/text%3E%3C/svg%3E';
    
    // Create an array of possible paths to try for the main image
    let possiblePaths = [];
    
    // Create an array to store all images for the gallery
    let allImages = [];
    
    // Try to get images from the news data
    if (news.images && Array.isArray(news.images) && news.images.length > 0) {
        // Process each image and add to allImages array
        news.images.forEach(imageName => {
            let imagePaths = [];
            
            if (imageName.startsWith('http')) {
                // External URL - use as is
                imagePaths = [imageName];
            } else {
                // Strip any directory info for consistent handling
                const cleanName = imageName.replace(/^\.\/|^\.\\|^\/|^\\/g, '').replace(/^img\//g, '').replace(/^images\//g, '');
                
                // Add different possible paths to try
                imagePaths = [
                    `./img/${cleanName}`,
                    `./css/images/${cleanName}`,
                    `./images/${cleanName}`,
                    `./${cleanName}`
                ];
                
                // If the original name had a specific path, prioritize it
                if (imageName.includes('/')) {
                    imagePaths.unshift(imageName.startsWith('./') ? imageName : `./${imageName}`);
                }
            }
            
            allImages.push({
                paths: imagePaths,
                primary: imagePaths[0],
                pathsJson: JSON.stringify(imagePaths)
            });
        });
        
        // Set the possible paths for the main (first) image
        if (allImages.length > 0) {
            possiblePaths = allImages[0].paths;
        }
    } else {
        // No images specified, use default placeholder
        possiblePaths = ['./img/default-news.jpg'];
        
        // Add a default image to allImages
        allImages.push({
            paths: possiblePaths,
            primary: possiblePaths[0],
            pathsJson: JSON.stringify(possiblePaths)
        });
    }
        
    const date = news.date || '';
    
    let linksHtml = '';
    if (news.links && Array.isArray(news.links)) {
        news.links.forEach(link => {
            const linkTitle = link.title || link.name || 'Read more';
            linksHtml += `<a href="${link.url}" target="_blank" class="news-link">${linkTitle}</a>`;
        });
    }
    
    // Format questions using structured data
    const questionsHtml = formatQuestions(news.questions);
    
    // Format description with proper handling of markdown-style text
    const formattedDescription = news.description 
        ? `<div class="news-description">${formatDescription(news.description)}</div>`
        : '';
    
    // Extract the first 2-3 words from the title for the placeholder image text
    const titleWords = news.title.split(' ').slice(0, 2).join(' ');
    const placeholderImageUrl = `https://placehold.co/100x100/2196F3/FFFFFF?text=${encodeURIComponent(titleWords)}`;
    
    // Create HTML for the image gallery (if there are multiple images)
    let galleryHtml = '';
    if (allImages.length > 1) {
        galleryHtml = `
            <div class="news-image-gallery">
                <h4 class="gallery-title">Additional Images</h4>
                <div class="gallery-container">
                    ${allImages.slice(1).map((img, index) => `
                        <div class="gallery-item">
                            <img src="${imagePlaceholder}" 
                                 data-src="${img.primary}" 
                                 data-alt-paths='${img.pathsJson}'
                                 alt="${news.title} - Image ${index + 2}" 
                                 class="gallery-image news-image" 
                                 onerror="this.onerror=null; const title = this.alt || 'AI News'; const words = title.split(' ').slice(0, 2).join(' '); this.src='https://placehold.co/200x150/2196F3/FFFFFF?text=' + encodeURIComponent(words); this.classList.add('error');">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Create JSON string of possible paths for the main image loader to try
    const pathsJSON = JSON.stringify(possiblePaths);
    
    return `
        <div class="news-item">
            <div class="news-header">
                <img src="${imagePlaceholder}" 
                     data-src="${possiblePaths[0]}" 
                     data-alt-paths='${pathsJSON}'
                     alt="${news.title}" 
                     class="news-image" 
                     onerror="this.onerror=null; const title = this.alt || 'AI News'; const words = title.split(' ').slice(0, 2).join(' '); this.src='https://placehold.co/100x100/2196F3/FFFFFF?text=' + encodeURIComponent(words); this.classList.add('error');">
                <div>
                    <h3 class="news-title">${news.title}</h3>
                    ${date ? `<div class="news-date">${date}</div>` : ''}
                </div>
            </div>
            ${formattedDescription}
            ${galleryHtml}
            ${linksHtml ? `<div class="news-links">${linksHtml}</div>` : ''}
            ${questionsHtml}
        </div>
    `;
}

function formatImages(images) {
    if (!images || !Array.isArray(images) || images.length === 0) {
        return '';
    }
    
    return `
        <div class="image-gallery">
            ${images.map(image => `
                <div class="news-image-container">
                    <img class="lazy-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                         data-src="./images/${image}" alt="Image for ${image}" 
                         loading="lazy">
                </div>
            `).join('')}
        </div>
    `;
}

function formatLinks(links) {
    if (!links || !Array.isArray(links) || links.length === 0) {
        return '';
    }
    
    return `
        <ul class="news-links-list">
            ${links.map(link => `
                <li>
                    <a href="${link.url}" class="news-link" data-href="${link.url}" target="_blank">${link.name}</a>
                </li>
            `).join('')}
        </ul>
    `;
}

function sanitizeId(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function setupNewsInteractions() {
    // Setup lazy loading for images
    document.querySelectorAll('.hot-news-container .lazy-image').forEach(img => {
        if (!img.classList.contains('loaded')) {
            setupLazyLoading(img, img.getAttribute('data-src'), img.alt);
        }
    });
    
    // Add any other interactions needed
}

// Simple implementation of lazy loading if not available from main.js
function setupLazyLoading(img, src, alt) {
    if (typeof window.setupLazyLoading === 'function') {
        // Use the main.js implementation if available
        window.setupLazyLoading(img, src, alt);
        return;
    }
    
    // Fallback basic implementation
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    observer.observe(img);
}

// Call this when the module is loaded
addHotNewsStyles();
