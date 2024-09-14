const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const config = {
  apiUrl: 'https://www.nasdaq.com/feed/rssoutbound?category=Artificial+Intelligence',
  proxyUrl: isLocal 
    ? 'http://localhost:8085/proxy-rss' 
    : 'https://corsproxy.io/?',
  isLocal: isLocal,
  serverUrl: isLocal
    ? window.location.origin
    : 'https://leonmelamud.github.io' 
};