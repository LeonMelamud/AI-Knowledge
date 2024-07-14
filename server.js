const express = require('express');
const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');
const app = express();

const port = process.env.PORT || 8085;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to serve JSON data from YAML files
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

// Serve 'index.html' for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
