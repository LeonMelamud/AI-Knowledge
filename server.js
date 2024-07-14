const express = require('express');
const fs = require('fs').promises;
const yaml = require('js-yaml');
const app = express();
const port = process.env.PORT || 8085;

app.use(express.static('public'));

app.get('/data', async (req, res) => {
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
        
        res.json(data);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});