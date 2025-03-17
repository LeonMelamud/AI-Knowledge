/**
 * AEO Schema Generator
 * Dynamically generates and updates schema.org markup for AEO optimization
 */

// Define a global AEO namespace to hold our functions
window.AEO = window.AEO || {};

// Initialize AEO schema when content is loaded
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAeoMode = urlParams.get('aeo') === 'true';
    
    if (isAeoMode) {
        // Get the language to load appropriate content
        const lang = document.documentElement.lang || 'he';
        
        // Fetch the content data
        fetch(`data/${lang}.yml`)
            .then(response => response.text())
            .then(yamlText => {
                // Parse YAML
                const contentData = jsyaml.load(yamlText);
                
                // Generate and update schema
                AEO.generateSchema(contentData);
            })
            .catch(error => {
                console.error('Error loading content for schema:', error);
            });
    }
});

/**
 * Generates schema.org markup from the content data
 * @param {Object} contentData - The content data from YAML
 */
AEO.generateSchema = function(contentData) {
    try {
        // Start with base schema
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": document.title,
            "description": document.querySelector('meta[name="description"]')?.content || "",
            "publisher": {
                "@type": "Organization",
                "name": "מערכת AEO לדוגמה"
            }
        };
        
        // Create FAQs from questions
        const faqs = [];
        
        // Process sections and their topics
        if (contentData.sections) {
            contentData.sections.forEach(section => {
                if (section.topics) {
                    section.topics.forEach(topic => {
                        if (topic.questions) {
                            topic.questions.forEach(question => {
                                if (question.title && (question.direct_answer || question.full_answer)) {
                                    faqs.push({
                                        "@type": "Question",
                                        "name": question.title,
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": question.direct_answer || 
                                                   AEO.stripHtmlTags(question.full_answer) || ""
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        
        // Add FAQs to schema
        if (faqs.length > 0) {
            schemaData.mainEntity = {
                "@type": "FAQPage",
                "mainEntity": faqs
            };
        }
        
        // Add breadcrumbs for better navigation understanding
        const breadcrumbList = {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "דף בית",
                    "item": window.location.origin
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "דף AEO",
                    "item": window.location.href
                }
            ]
        };
        
        schemaData.breadcrumb = breadcrumbList;
        
        // Update the schema tag
        const schemaElement = document.getElementById('aeo-schema');
        if (schemaElement) {
            schemaElement.textContent = JSON.stringify(schemaData, null, 2);
        } else {
            // Create new schema tag if not exists
            const newSchemaTag = document.createElement('script');
            newSchemaTag.id = 'aeo-schema';
            newSchemaTag.type = 'application/ld+json';
            newSchemaTag.textContent = JSON.stringify(schemaData, null, 2);
            document.head.appendChild(newSchemaTag);
        }
        
        console.log('AEO Schema generated successfully');
    } catch (error) {
        console.error('Error generating schema:', error);
    }
};

/**
 * Strips HTML tags from a string
 * @param {string} html - The HTML string
 * @returns {string} Text without HTML tags
 */
AEO.stripHtmlTags = function(html) {
    if (!html) return '';
    
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Return text content
    return tempDiv.textContent || tempDiv.innerText || '';
}; 