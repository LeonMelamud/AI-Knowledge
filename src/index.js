console.log('Hello, Webpack!');

// AEO (Answer Engine Optimization) Enhancement Functions

/**
 * Adds website-level schema.org structured data
 */
function addGlobalSchemaMarkup() {
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "AI Knowledge Base",
        "description": "Comprehensive knowledge base about artificial intelligence concepts, techniques, and tools",
        "url": window.location.origin,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${window.location.origin}/#/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    };

    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(websiteSchema);
    document.head.appendChild(schemaScript);
}

/**
 * Adds organization schema markup
 */
function addOrganizationSchema() {
    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "AI Knowledge Base",
        "url": window.location.origin,
        "logo": `${window.location.origin}/css/images/logo.png`,
        "sameAs": [
            "https://github.com/LeonMelamud/AI-Knowledge"
        ]
    };

    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(orgSchema);
    document.head.appendChild(schemaScript);
}

/**
 * Adds metadata tags for SEO and AEO
 */
function addMetaTags() {
    // Title and description
    const metaTags = [
        { name: "description", content: "Comprehensive knowledge base for artificial intelligence concepts, techniques, and tools." },
        { name: "keywords", content: "AI, artificial intelligence, machine learning, deep learning, neural networks, AI tools" },
        
        // Open Graph tags for social sharing
        { property: "og:title", content: "AI Knowledge Base" },
        { property: "og:description", content: "Explore artificial intelligence concepts, techniques, and tools." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: window.location.href },
        { property: "og:image", content: `${window.location.origin}/css/images/og-image.png` },
        
        // Twitter Card tags
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "AI Knowledge Base" },
        { name: "twitter:description", content: "Comprehensive AI knowledge and resources." },
        { name: "twitter:image", content: `${window.location.origin}/css/images/twitter-card.png` },
        
        // Technical metadata
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { name: "robots", content: "index, follow" },
        { name: "canonical", content: window.location.href.split('#')[0] }
    ];

    metaTags.forEach(tagInfo => {
        const existingTag = document.querySelector(`meta[${tagInfo.name ? 'name' : 'property'}="${tagInfo.name || tagInfo.property}"]`);
        
        if (existingTag) {
            existingTag.content = tagInfo.content;
        } else {
            const metaTag = document.createElement('meta');
            if (tagInfo.name) {
                metaTag.name = tagInfo.name;
            } else {
                metaTag.setAttribute('property', tagInfo.property);
            }
            metaTag.content = tagInfo.content;
            document.head.appendChild(metaTag);
        }
    });
}

/**
 * Updates page metadata based on current route/content
 */
function updateMetadataForRoute(route, contentTitle) {
    // Get the concept title or use default
    const pageTitle = contentTitle || 'AI Knowledge Base';
    
    // Update document title
    document.title = `${pageTitle} | AI Knowledge Base`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = `Learn about ${pageTitle} - comprehensive explanation and resources for artificial intelligence concepts.`;
    }
    
    // Update canonical URL
    const canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) {
        canonicalTag.href = `${window.location.origin}/#/${route}`;
    } else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = `${window.location.origin}/#/${route}`;
        document.head.appendChild(link);
    }
    
    // Update Open Graph and Twitter tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    
    if (ogTitle) ogTitle.content = `${pageTitle} | AI Knowledge Base`;
    if (twitterTitle) twitterTitle.content = `${pageTitle} | AI Knowledge Base`;
}

/**
 * Initialize AEO enhancements once DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add global schema markup
    addGlobalSchemaMarkup();
    addOrganizationSchema();
    
    // Add SEO/AEO meta tags
    addMetaTags();
    
    // Update metadata on route change
    window.addEventListener('hashchange', () => {
        const route = window.location.hash.slice(2) || 'ai-basics';
        const heading = document.querySelector('h2');
        updateMetadataForRoute(route, heading?.textContent);
    });
});
