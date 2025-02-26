import { config } from './config.js';

let parser;

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
        // Use the server proxy endpoint to avoid CORS issues
        const proxyUrl = `/proxy-rss?url=${encodeURIComponent(url)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(proxyUrl, { 
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.text();
        rssFailureCount = 0; // Reset failure count on success
        return parseRSSFeed(data);
    } catch (error) {
        rssFailureCount++;
        console.warn(`Error fetching RSS feed (attempt ${rssFailureCount}): ${error.message}`);
        
        if (error.name === 'AbortError') {
            console.warn('RSS feed request timed out');
        }
        
        // If we haven't reached max retries, try again after delay
        if (rssFailureCount < MAX_RETRY_ATTEMPTS) {
            console.log(`Retrying RSS feed in ${RETRY_DELAY/1000} seconds...`);
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
        // Attempt to fetch a more reliable alternative feed
        const alternativeFeedUrl = 'https://techcrunch.com/feed/';
        const proxyUrl = `/proxy-rss?url=${encodeURIComponent(alternativeFeedUrl)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(proxyUrl, { 
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error with alternative feed! status: ${response.status}`);
        }
        
        const data = await response.text();
        rssFailureCount = 0; // Reset failure count on success with alternative
        return parseRSSFeed(data);
    } catch (error) {
        console.warn(`Alternative feed also failed: ${error.message}`);
        // Return empty but valid feed structure
        return { items: [] };
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
    let html = `
        <h2>Nasdaq AI Articles</h2>
        <ul class="rss-feed">
    `;
    
    for (let i = 0; i < Math.min(feed.items.length, 5); i++) {
        const item = feed.items[i];
        const title = item.title;
        const link = item.link;
        const pubDate = item.pubDate;
        
        // Parse and format the date
        const date = new Date(pubDate);
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
        
        html += `
            <li>
                <a href="${link}" target="_blank">${title}</a>
                <span class="pub-date">${formattedDate}</span>
            </li>
        `;
    }
    
    html += '</ul>';
    sidebar.innerHTML = html;
}

// Function to initialize RSS feed
export async function initRSSFeed() {
    // First try to show cached feed if available
    const cachedFeed = sessionStorage.getItem('rssFeedCache');
    const cacheTimestamp = sessionStorage.getItem('rssFeedCacheTime');
    
    if (cachedFeed && cacheTimestamp) {
        const now = new Date().getTime();
        const cacheTime = parseInt(cacheTimestamp, 10);
        
        // Use cache if it's less than 30 minutes old
        if (now - cacheTime < 30 * 60 * 1000) {
            try {
                renderRSSFeed(JSON.parse(cachedFeed));
                console.log('Rendered RSS feed from cache');
                // Refresh in background after rendering cached version
                setTimeout(() => refreshRSSFeed(), 1000);
                return;
            } catch (e) {
                console.warn('Error rendering cached feed:', e);
                // Fall through to fetch fresh feed
            }
        }
    }
    
    // No valid cache, fetch fresh
    refreshRSSFeed();
}

/**
 * Refresh RSS feed data in the background
 */
async function refreshRSSFeed() {
    try {
        const feedUrl = 'https://feeds.bbci.co.uk/news/technology/rss.xml';
        const feed = await fetchRSSFeed(feedUrl);
        
        renderRSSFeed(feed);
        
        // Cache the feed for faster loading next time
        if (feed && feed.items && feed.items.length > 0) {
            try {
                sessionStorage.setItem('rssFeedCache', JSON.stringify(feed));
                sessionStorage.setItem('rssFeedCacheTime', new Date().getTime().toString());
            } catch (e) {
                console.warn('Failed to cache RSS feed:', e);
            }
        }
    } catch (error) {
        console.warn('RSS feed refresh failed, but site continues:', error.message);
        
        const feedContainer = document.getElementById('rss-feed');
        if (feedContainer) {
            feedContainer.innerHTML = '<p class="feed-error">News feed temporarily unavailable.</p>';
        }
    }
}

// Export the functions
export { renderRSSFeed, fetchRSSFeed };

// Make initRSSFeed available globally
window.initRSSFeed = initRSSFeed;