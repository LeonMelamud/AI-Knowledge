import { config } from './config.js';

let parser;

// Detect if we're in production environment
const isProduction = window.location.hostname === 'ai-know.org' || 
                     !window.location.hostname.includes('localhost');

// List of public CORS proxies we can try in production - prioritizing the one that works
const publicProxies = [
  'https://api.allorigins.win/raw?url=', // This one works based on testing
  'https://thingproxy.freeboard.io/fetch/', // Alternative option
  'https://api.codetabs.com/v1/proxy?quest=', // Another alternative
  'https://corsproxy.io/?', // Not working currently, but keep as last resort
  'https://cors-anywhere.herokuapp.com/' // Requires registration, last resort
];

async function initParser() {
    if (!parser) {
        // Load the browser version of rss-parser
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/rss-parser@3.13.0/dist/rss-parser.min.js';
            script.onload = () => {
                parser = new window.RSSParser();
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Track failed attempts to avoid unnecessary retries
let rssFailureCount = 0;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 3000; // 3 seconds

/**
 * Constructs appropriate URL based on environment
 * @param {string} feedUrl - The original RSS feed URL
 * @returns {string} - The proxied URL
 */
function getProxyUrl(feedUrl) {
    if (!isProduction) {
        // Use local proxy in development
        return `/proxy-rss?url=${encodeURIComponent(feedUrl)}`;
    } else {
        // In production, try public CORS proxies
        // Start with the first proxy, will try others on failure
        return `${publicProxies[0]}${encodeURIComponent(feedUrl)}`;
    }
}

/**
 * Attempts to fetch using different proxies in production
 * @param {string} feedUrl - The original RSS feed URL
 * @param {number} proxyIndex - Index of the proxy to try
 * @returns {Promise<Object>} - The parsed RSS feed
 */
async function fetchWithProxy(feedUrl, proxyIndex = 0) {
    if (proxyIndex >= publicProxies.length) {
        throw new Error('All proxies failed');
    }
    
    try {
        const proxyUrl = isProduction
            ? `${publicProxies[proxyIndex]}${encodeURIComponent(feedUrl)}`
            : `/proxy-rss?url=${encodeURIComponent(feedUrl)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(proxyUrl, { 
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.text();
        return parseRSSFeed(data);
    } catch (error) {
        console.warn(`Proxy ${proxyIndex} failed: ${error.message}`);
        
        if (isProduction && proxyIndex < publicProxies.length - 1) {
            // Try the next proxy in production with small staggered delay
            console.log(`Trying next proxy (${proxyIndex + 1}/${publicProxies.length})`);
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(fetchWithProxy(feedUrl, proxyIndex + 1));
                }, 500 * proxyIndex); // Increase delay with each retry
            });
        }
        
        throw error; // Let the caller handle the final failure
    }
}

/**
 * Fetches RSS feed with error handling and timeout
 * @param {string} url - The RSS feed URL
 * @returns {Promise<Object>} - The parsed RSS feed or empty feed object
 */
async function fetchRSSFeed(url) {
    // If we've failed too many times, return empty feed immediately
    if (rssFailureCount >= MAX_RETRY_ATTEMPTS) {
        console.warn('Maximum RSS retry attempts reached, skipping further attempts');
        return { items: [] };
    }
    
    try {
        const feed = await fetchWithProxy(url);
        rssFailureCount = 0; // Reset failure count on success
        return feed;
    } catch (error) {
        rssFailureCount++;
        console.warn(`Error fetching RSS feed (attempt ${rssFailureCount}): ${error.message}`);
        
        if (error.name === 'AbortError') {
            console.warn('RSS feed request timed out');
        }
        
        // If we haven't reached max retries, try alternative feed
        if (rssFailureCount < MAX_RETRY_ATTEMPTS) {
            console.log(`Trying alternative feed in ${RETRY_DELAY/1000} seconds...`);
            return new Promise(resolve => {
                setTimeout(async () => {
                    resolve(await fetchAlternativeFeed());
                }, RETRY_DELAY);
            });
        }
        
        // Return empty feed structure that won't break the application
        return { items: [] };
    }
}

/**
 * Fallback feed fetcher for when primary feed fails
 */
async function fetchAlternativeFeed() {
    try {
        // Try these alternative feeds that might be more reliable
        const alternativeFeedUrls = [
            'https://techcrunch.com/feed/',
            'https://news.google.com/rss/search?q=technology',
            'https://www.wired.com/feed/rss'
        ];
        
        // Try each alternative feed in sequence
        for (let i = 0; i < alternativeFeedUrls.length; i++) {
            try {
                const feed = await fetchWithProxy(alternativeFeedUrls[i]);
                return feed;
            } catch (err) {
                console.warn(`Alternative feed ${i+1} failed: ${err.message}`);
                // Continue to next feed
            }
        }
        
        throw new Error('All alternative feeds failed');
    } catch (error) {
        console.warn(`All alternative feeds failed: ${error.message}`);
        return { items: [] }; // Return empty but valid feed structure
    }
}

/**
 * Parse XML RSS feed into JavaScript object
 */
function parseRSSFeed(xmlText) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parsing error');
        }
        
        const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => {
            return {
                title: getElementText(item, 'title'),
                link: getElementText(item, 'link'),
                description: getElementText(item, 'description'),
                pubDate: getElementText(item, 'pubDate')
            };
        });
        
        return { 
            title: getElementText(xmlDoc, 'channel > title'),
            description: getElementText(xmlDoc, 'channel > description'),
            items
        };
    } catch (error) {
        console.error('Error parsing RSS feed:', error);
        return { items: [] }; // Return valid but empty feed
    }
}

/**
 * Safely get element text content with fallback
 */
function getElementText(parent, selector) {
    const element = parent.querySelector(selector);
    return element ? element.textContent : '';
}

// Function to render RSS feed items in the sidebar
function renderRSSFeed(feed) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        console.warn('Sidebar element not found for RSS feed');
        return;
    }
    
    // Handle empty feed gracefully
    if (!feed || !feed.items || !Array.isArray(feed.items) || feed.items.length === 0) {
        sidebar.innerHTML = `
            <h2>Tech News</h2>
            <p class="feed-error">News feed temporarily unavailable.</p>
        `;
        return;
    }
    
    let html = `
        <div class="sidebar-header">
            <h2>Tech News</h2>
            <button id="close-rss-btn" class="close-rss-btn" title="Hide news section">✕</button>
        </div>
        <ul class="rss-feed">
    `;
    
    for (let i = 0; i < Math.min(feed.items.length, 5); i++) {
        const item = feed.items[i];
        const title = item.title || 'No title';
        const link = item.link || '#';
        const pubDate = item.pubDate;
        
        // Parse and format the date, safely
        let formattedDate = '';
        try {
            const date = new Date(pubDate);
            formattedDate = !isNaN(date.getTime()) 
                ? date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
                : '';
        } catch (e) {
            console.warn('Date parsing error:', e);
        }
        
        html += `
            <li>
                <a href="${link}" target="_blank">${title}</a>
                ${formattedDate ? `<span class="pub-date">${formattedDate}</span>` : ''}
            </li>
        `;
    }
    
    html += '</ul>';
    sidebar.innerHTML = html;
    
    // Add event listener to the close button
    const closeBtn = document.getElementById('close-rss-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('Manually hiding RSS section');
            hideRSSSection();
        });
    }
}

/**
 * Refresh RSS feed data in the background
 */
async function refreshRSSFeed() {
    try {
        const feedUrl = 'https://feeds.bbci.co.uk/news/technology/rss.xml';
        const feed = await fetchRSSFeed(feedUrl);
        
        // Only render the feed if we have items
        if (feed && feed.items && feed.items.length > 0) {
            renderRSSFeed(feed);
            
            // Cache the feed for faster loading next time
            try {
                sessionStorage.setItem('rssFeedCache', JSON.stringify(feed));
                sessionStorage.setItem('rssFeedCacheTime', new Date().getTime().toString());
            } catch (e) {
                console.warn('Failed to cache RSS feed:', e);
            }
        } else {
            // Hide the sidebar element if feed is empty
            hideRSSSection();
        }
    } catch (error) {
        console.warn('RSS feed refresh failed, site will continue without news section:', error.message);
        hideRSSSection();
    }
}

/**
 * Hide the RSS feed section completely and adjust layout
 */
function hideRSSSection() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Remove the sidebar completely from DOM instead of just hiding it
        sidebar.remove();
        
        // Find the container that holds the layout
        const container = document.querySelector('.container') || document.querySelector('.main-container');
        if (container) {
            // Remove the grid or flex layout classes
            container.classList.remove('with-sidebar');
            container.classList.add('no-sidebar');
        }
        
        // Adjust the main content
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            // Remove any width constraints
            mainContent.classList.add('full-width');
            
            // Direct style adjustments
            mainContent.style.gridColumn = '1 / -1'; // Span all grid columns if using grid
            mainContent.style.width = '100%';
            mainContent.style.maxWidth = '1200px';
            mainContent.style.margin = '0 auto';
            mainContent.style.padding = '0 20px';
        }
        
        // Add CSS to handle the layout adjustment
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            /* Override grid/flex layouts when sidebar is removed */
            .no-sidebar {
                display: block !important;
                grid-template-columns: 1fr !important;
            }
            
            .full-width {
                grid-column: 1 / -1 !important;
                width: 100% !important;
                max-width: 1200px !important;
                margin: 0 auto !important;
            }
            
            @media (max-width: 768px) {
                .full-width {
                    padding: 0 15px !important;
                }
            }
        `;
        document.head.appendChild(styleEl);
        
        // Add a class to the body to track RSS removal
        document.body.classList.add('rss-removed');
        
        // Add a restore button for testing purposes
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'restore-rss-btn';
        restoreBtn.textContent = 'Restore News';
        restoreBtn.title = 'Restore news feed';

        // Set direct inline styles to ensure positioning
        restoreBtn.style.position = 'fixed';
        restoreBtn.style.left = '20px';
        restoreBtn.style.right = 'auto'; // Override any 'right' property
        restoreBtn.style.top = '50%';
        restoreBtn.style.transform = 'translateY(-50%)';
        restoreBtn.style.zIndex = '999';

        restoreBtn.addEventListener('click', function() {
            // Reload the page to restore original layout
            window.location.reload();
        });
        document.body.appendChild(restoreBtn);
    }
}

// Function to initialize RSS feed
export async function initRSSFeed() {
    try {
        // First try to show cached feed if available
        const cachedFeed = sessionStorage.getItem('rssFeedCache');
        const cacheTimestamp = sessionStorage.getItem('rssFeedCacheTime');
        
        if (cachedFeed && cacheTimestamp) {
            const now = new Date().getTime();
            const cacheTime = parseInt(cacheTimestamp, 10);
            
            // Use cache if it's less than 2 hours old (extended cache time)
            if (now - cacheTime < 2 * 60 * 60 * 1000) {
                try {
                    const parsedFeed = JSON.parse(cachedFeed);
                    if (parsedFeed && parsedFeed.items && parsedFeed.items.length > 0) {
                        renderRSSFeed(parsedFeed);
                        console.log('Rendered RSS feed from cache');
                        
                        // Refresh in background after rendering cached version
                        setTimeout(() => refreshRSSFeed(), 1000);
                        return;
                    }
                } catch (e) {
                    console.warn('Error rendering cached feed:', e);
                    // Fall through to fetch fresh feed
                }
            }
        }
        
        // No valid cache, fetch fresh but don't block the app
        setTimeout(() => refreshRSSFeed(), 100);
    } catch (error) {
        console.warn('RSS feed initialization error:', error);
        // Don't show error messages, just hide the section completely
        hideRSSSection();
    }
}

// Export the functions
export { renderRSSFeed, fetchRSSFeed };

// Make initRSSFeed available globally
window.initRSSFeed = initRSSFeed;