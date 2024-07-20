// Function to fetch and parse RSS feed
async function fetchRSSFeed(url) {
    try {
        const response = await fetch(`/proxy-rss?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        return xmlDoc;
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        return null;
    }
}

// Function to render RSS feed items in the sidebar
function renderRSSFeed(xmlDoc) {
    const sidebar = document.getElementById('sidebar');
    const items = xmlDoc.getElementsByTagName('item');
    let html = `
        <h2>AI Articles</h2>
        <ul class="rss-feed">
    `;
    
    for (let i = 0; i < Math.min(items.length, 5); i++) {
        const item = items[i];
        const title = item.getElementsByTagName('title')[0].textContent;
        const link = item.getElementsByTagName('link')[0].textContent;
        const pubDate = item.getElementsByTagName('pubDate')[0].textContent;
        
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
async function initRSSFeed() {
    const rssUrl = 'https://www.nasdaq.com/feed/rssoutbound?category=Artificial+Intelligence';
    const xmlDoc = await fetchRSSFeed(rssUrl);
    if (xmlDoc) {
        renderRSSFeed(xmlDoc);
    }
}

// Make initRSSFeed available globally
window.initRSSFeed = initRSSFeed;