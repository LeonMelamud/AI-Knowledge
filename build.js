const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');

async function createDataJson() {
    try {
        const [linksYaml, conceptsYaml] = await Promise.all([
            fs.readFile('links.yaml', 'utf8'),
            fs.readFile('concepts.yaml', 'utf8')
        ]);

        const data = {
            links: yaml.load(linksYaml),
            concepts: yaml.load(conceptsYaml),
            timestamp: Date.now()
        };

        await fs.writeFile(path.join('public', 'data.json'), JSON.stringify(data));
        console.log('data.json created successfully');
    } catch (error) {
        console.error('Error creating data.json:', error);
    }
}

createDataJson();