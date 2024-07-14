let linksData;
let conceptsData;
let lastLoadTime = 0;

async function loadData() {
    try {
        const [linksResponse, conceptsResponse] = await Promise.all([
            fetch('links.yaml'),
            fetch('concepts.yaml')
        ]);

        const [linksYaml, conceptsYaml] = await Promise.all([
            linksResponse.text(),
            conceptsResponse.text()
        ]);

        const data = {
            links: jsyaml.load(linksYaml),
            concepts: jsyaml.load(conceptsYaml),
            timestamp: Date.now()
        };

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
                    <h3>${item.name}</h3>
                    <p>${item.shortDescription}</p>
                    <button class="info-button">הצג ${item.codeExample ? 'דוגמת קוד' : 'מידע מורחב'}</button>
                    <div class="additional-info" style="display: none;">
                        ${item.codeExample ? `<pre><code>${item.codeExample}</code></pre>` : formatFullDescription(item.fullDescription)}
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

function attachEventListeners() {
    document.querySelectorAll('.info-button').forEach(button => {
        button.addEventListener('click', function() {
            const additionalInfo = this.closest('.tool-link, .concept').querySelector('.additional-info');
            if (additionalInfo.style.display === 'none' || additionalInfo.style.display === '') {
                additionalInfo.style.display = 'block';
                this.textContent = 'הסתר מידע';
            } else {
                additionalInfo.style.display = 'none';
                this.textContent = this.closest('.concept') ? 
                    `הצג ${this.closest('.concept').querySelector('.additional-info pre') ? 'דוגמת קוד' : 'מידע מורחב'}` : 
                    'מידע נוסף';
            }
        });
    });
}
