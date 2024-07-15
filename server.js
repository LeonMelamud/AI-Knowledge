const express = require('express');
const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');
const app = express();
const port = process.env.PORT || 8085;

const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.get('/data', async (req, res) => {
    try {
        const linksPath = path.join(publicDir, 'links.yaml');
        const conceptsPath = path.join(publicDir, 'concepts.yaml');

        console.log('Attempting to read from:', linksPath);
        console.log('Attempting to read from:', conceptsPath);

        const [linksYaml, conceptsYaml] = await Promise.all([
            fs.readFile(linksPath, 'utf8'),
            fs.readFile(conceptsPath, 'utf8')
        ]);
        
        const data = {
            links: yaml.load(linksYaml),
            concepts: yaml.load(conceptsYaml),
            timestamp: Date.now()
        };
        
        res.json(data);
    } catch (error) {
        console.error('Error loading data:', error);
        if (error.code === 'ENOENT') {
            console.error('File not found:', error.path);
        }
        res.status(500).json({ error: 'Failed to load data', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Public directory:', publicDir);
});