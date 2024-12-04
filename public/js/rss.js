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

// Function to fetch and parse RSS feed
async function fetchRSSFeed() {
    try {
        await initParser();
        let url = config.isLocal 
            ? `${config.proxyUrl}?url=${encodeURIComponent(config.apiUrl)}`
            : `${config.proxyUrl}${config.apiUrl}`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Origin': window.location.origin
            }
        });

        clearTimeout(timeout);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Basic XML validation before parsing
        if (!text.trim().startsWith('<?xml') && !text.trim().startsWith('<rss')) {
            console.warn('Invalid RSS feed format, falling back to alternative feed');
            return fetchAlternativeFeed();
        }
        
        return parser.parseString(text);
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        return fetchAlternativeFeed();
    }
}

async function fetchAlternativeFeed() {
    try {
        const url = 'https://cors-proxy.fringe.zone/https://feeds.bbci.co.uk/news/technology/rss.xml';
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Origin': window.location.origin
            }
        });

        clearTimeout(timeout);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        return parser.parseString(text);
    } catch (error) {
        console.error('Error fetching alternative feed:', error);
        // Return empty feed structure as last resort
        return {
            rss: {
                channel: [{
                    item: []
                }]
            }
        };
    }
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
    const rssUrl = config.apiUrl;
    const feed = await fetchRSSFeed(rssUrl);
    if (feed) {
        renderRSSFeed(feed);
    }
}

// Make initRSSFeed available globally
window.initRSSFeed = initRSSFeed;