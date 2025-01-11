import { currentLanguage, hotNewsData } from './main.js';

// Initialize Intersection Observer
const observeImages = () => {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px 0px', // Start loading images 50px before they enter viewport
        threshold: 0.1
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
};

export function buildHotNewsSection(uiTranslations) {
    const newsData = hotNewsData;

    if (!newsData || !newsData.hot_news) {
        console.warn(`loading hot news...`);
        return 'loading ...';
    }

    let content = '<div class="hot-news-container">';
    content += `<h2 class="hot-news-title">${uiTranslations.hotNewsTitle || 'Hot News'}</h2>`;

    newsData.hot_news.forEach(section => {
        if (section.section) {
            content += `<h3 class="hot-news-section-title">${section.section}</h3>`;
        }
        content += '<div class="news-grid">';
        section.topics.forEach(topic => {
            content += '<div class="news-item">';
            if (topic.title) {
                content += `<h4 class="news-title">${topic.title}</h4>`;
            }
            if (topic.images && topic.images.length > 0) {
                content += '<div class="news-images">';
                topic.images.forEach(img => {
                    const imgPath = `css/images/${img}`;
                    content += `
                        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                             data-src="${imgPath}" 
                             alt="${topic.title || 'News image'}" 
                             class="news-image lazy" 
                             onerror="this.style.display='none'"
                             loading="lazy"
                        >
                    `;
                });
                content += '</div>';
            }
            if (topic.description) {
                content += `<p class="news-description">${topic.description}</p>`;
            }
            if (topic.links && topic.links.length > 0) {
                content += '<div class="news-links">';
                topic.links.forEach(link => {
                    if (link.url && link.name) {
                        content += `<a data-href="${link.url}" class="news-link">${link.name}</a>`;
                    }
                });
                content += '</div>';
            }
            content += '</div>';
        });
        content += '</div>';
    });

    content += '</div>'; // Close hot-news-container
    content += `<p class="disclaimer">${uiTranslations.hotNewsDisclaimer || 'Information sourced from AI-powered news aggregators.'}</p>`;
    
    // Schedule observer initialization after the content is added to DOM
    setTimeout(() => observeImages(), 0);
    
    return content;
}
