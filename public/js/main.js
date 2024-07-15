let linksData;
let conceptsData;
let lastLoadTime = 0;

async function loadData() {
    try {
        let data;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Local development: fetch from Express server
            const response = await fetch('/data');
            data = await response.json();
        } else {
            // Production: fetch from static JSON file
            const response = await fetch('data.json');
            data = await response.json();
        }
        
        if (!linksData || data.timestamp > lastLoadTime) {
            linksData = data.links;
            conceptsData = data.concepts;
            lastLoadTime = data.timestamp;
            buildContent();
            console.log('Data reloaded');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadData();
        attachEventListeners();
    } catch (error) {
        console.error('Error during DOMContentLoaded:', error);
    }
});

function buildContent() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && linksData && linksData.tools) {
        sidebar.innerHTML = buildToolLinks(linksData.tools);
    }

    if (mainContent && conceptsData && conceptsData.concepts) {
        mainContent.innerHTML = buildConcepts(conceptsData.concepts);
    }

    // Initialize Prism.js after content is built
    Prism.highlightAll();
}

function buildToolLinks(tools) {
    return tools.map(tool => `
        <section id="${tool.id}">
        <h3>${tool.title}</h3>
        <div class="useful-links">
            ${tool.items.map(tool => `
                <div class="tool-link">
                    <div class="tool-main-info">
                        <a href="${tool.url}" target="_blank" class="tool-name">${tool.name}</a>
                        <span class="company-name">${tool.company}</span>
                        <div class="info-button-container">
                            <button class="info-button">מידע נוסף</button>
                        </div>
                    </div>
                    <div class="additional-info" style="display: none;">
                    ${formatFullDescription(tool.description)}
                    <div>${formatFullDescription(tool.recentUpdates)} </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}



function buildConcepts(concepts) {
    return concepts.map(concept => `
        <section id="${concept.id}">
            <h2>${concept.title}</h2>
            ${concept.items.map(item => `
                <div class="concept">
                    <h3>
                        ${item.url 
                            ? `<a href="${escapeHtml(item.url)}" target="_blank" class="concept-name">${escapeHtml(item.name)}</a>`
                            : escapeHtml(item.name)}
                    </h3>
                    <p>${item.shortDescription}</p>
                    <button class="info-button">הצג מידע מורחב</button>
                    <div class="additional-info" style="display: none;">
                        ${formatFullDescription(item.fullDescription)}
                        ${item.imageUrl ? `<div class="image-container"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" class="concept-image"></div>` : ''}
                        ${item.codeExample ? `
                            <h4>דוגמת קוד:</h4>
                            <pre class="code-block"><code class="language-python">${escapeHtml(item.codeExample)}</code></pre>
                        ` : ''}
                        <hr class="info-separator">
                    </div>
                </div>
            `).join('')}
        </section>
    `).join('');
}

function formatFullDescription(description) {
    if(description === undefined)
        return '';
    return description.split('\n').map(line => `<p>${line}</p>`).join('');
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function attachEventListeners() {
    document.querySelectorAll('.info-button').forEach(button => {
        button.addEventListener('click', function() {
            const additionalInfo = this.closest('.tool-link, .concept').querySelector('.additional-info');
            if (additionalInfo.style.display === 'none' || additionalInfo.style.display === '') {
                additionalInfo.style.display = 'block';
                this.textContent = 'הסתר מידע';
            } else {
                additionalInfo.style.display = 'none';
                if (this.closest('.concept')) {
                    this.textContent = 'הצג מידע מורחב';
                } else {
                    this.textContent = 'מידע נוסף';
                }
            }
        });
    });
}
