const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isGitHubPages = window.location.hostname === 'leonmelamud.github.io';

export const config = {
  apiUrl:  'https://www.nasdaq.com/feed/rssoutbound?category=Artificial+Intelligence',
  proxyUrl:  'http://localhost:8085/proxy-rss'
    ,
  isLocal: isLocal,
  isGitHubPages: isGitHubPages
};