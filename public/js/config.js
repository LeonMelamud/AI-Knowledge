const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isGitHubPages = window.location.hostname === 'leonmelamud.github.io';

export const config = {
  apiUrl:  'https://o0rmue7xt0.execute-api.il-central-1.amazonaws.com/dev',
  proxyUrl: isLocal
    ? 'http://localhost:8085/proxy-rss'
    : 'https://cors-anywhere.herokuapp.com/',
  isLocal: isLocal,
  isGitHubPages: isGitHubPages
};