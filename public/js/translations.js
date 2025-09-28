/**
 * Translation loader for standalone legal pages
 */

let uiTranslations = {};
let currentLanguage = 'he'; // Default to Hebrew

/**
 * Load translations based on browser language or default
 */
async function loadTranslations() {
    try {
        // Detect language from URL parameter or browser language
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        const browserLang = navigator.language.startsWith('he') ? 'he' : 'en';
        currentLanguage = langParam || browserLang;
        
        // Load translation file
        const response = await fetch(`data/ui_translations_${currentLanguage}.json`);
        if (!response.ok) {
            // Fallback to Hebrew if English fails
            currentLanguage = 'he';
            const fallbackResponse = await fetch(`data/ui_translations_he.json`);
            uiTranslations = await fallbackResponse.json();
        } else {
            uiTranslations = await response.json();
        }
        
        // Update page content
        updatePageContent();
        
    } catch (error) {
        console.error('Error loading translations:', error);
        // Use default Hebrew translations if loading fails
        currentLanguage = 'he';
        setDefaultTranslations();
    }
}

/**
 * Set default Hebrew translations as fallback
 */
function setDefaultTranslations() {
    uiTranslations = {
        privacyPolicyTitle: "מדיניות פרטיות",
        termsOfServiceTitle: "תנאי שימוש",
        effectiveDate: "תוקף החל מ: 1 בינואר 2025",
        privacyPolicy: "מדיניות פרטיות",
        termsOfService: "תנאי שימוש"
    };
    updatePageContent();
}

/**
 * Update page content with translations
 */
function updatePageContent() {
    // Update page title and main heading based on page type
    const isPrivacyPage = window.location.pathname.includes('privacy-policy');
    const isTermsPage = window.location.pathname.includes('terms-of-service');
    
    if (isPrivacyPage && uiTranslations.privacyPolicyTitle) {
        document.title = uiTranslations.privacyPolicyTitle;
        const mainHeading = document.querySelector('h1');
        if (mainHeading) {
            mainHeading.textContent = uiTranslations.privacyPolicyTitle;
        }
    } else if (isTermsPage && uiTranslations.termsOfServiceTitle) {
        document.title = uiTranslations.termsOfServiceTitle;
        const mainHeading = document.querySelector('h1');
        if (mainHeading) {
            mainHeading.textContent = uiTranslations.termsOfServiceTitle;
        }
    }
    
    // Update footer links
    const privacyLink = document.querySelector('a[href="privacy-policy.html"]');
    const termsLink = document.querySelector('a[href="terms-of-service.html"]');
    
    if (privacyLink && uiTranslations.privacyPolicy) {
        privacyLink.textContent = uiTranslations.privacyPolicy;
    }
    if (termsLink && uiTranslations.termsOfService) {
        termsLink.textContent = uiTranslations.termsOfService;
    }
    
    // Set page direction based on language
    document.documentElement.dir = currentLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
}

// Load translations when page loads
document.addEventListener('DOMContentLoaded', loadTranslations);