const express = require('express');
const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');
const app = express();
const port = process.env.PORT || 8085;

app.use(express.static('public'));

app.get('/data', async (req, res) => {
    try {
        const conceptsPath = path.join(__dirname, 'public', 'concepts.yaml');
        const linksPath = path.join(__dirname, 'public', 'links.yaml');

        console.log('Attempting to read:', conceptsPath);
        console.log('Attempting to read:', linksPath);

        const [conceptsYaml, linksYaml] = await Promise.all([
            fs.readFile(conceptsPath, 'utf8'),
            fs.readFile(linksPath, 'utf8')
        ]);

        console.log('YAML files read successfully');

        const concepts = yaml.load(conceptsYaml);
        const links = yaml.load(linksYaml);

 

        const data = {
            concepts: concepts,
            links: links,
            timestamp: Date.now()
        };


        res.json(data);
    } catch (error) {
        console.error('Detailed error in /data route:', error);
        res.status(500).json({ error: 'Failed to load data', details: error.message });
    }
});
app.get('/proxy-rss', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).send('URL parameter is required');
        }
        const response = await fetch(url);
        const text = await response.text();
        res.set('Content-Type', 'text/xml');
        res.send(text);
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        res.status(500).send('Error fetching RSS feed');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});