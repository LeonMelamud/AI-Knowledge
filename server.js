const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');  // Add this line to import cors

const yaml = require('js-yaml');
const path = require('path');
const app = express();
const port = process.env.PORT || 8085;
// TODO: Move allowed origins to environment variables for better security
const allowedOrigins = ['http://localhost:8085', 'https://leonmelamud.github.io'];

const { getEncoding } = require('js-tiktoken');

// FIXME: CORS policy is too permissive - allows any origin if none is provided
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));


const staticPath = 'public';
app.use(express.static(path.join(__dirname, staticPath)));

app.use(express.json()); // Add this line to parse JSON bodies

const assert = require('assert');

// TODO: Add rate limiting to prevent abuse
// HACK: Simple RSS proxy without URL validation - potential security risk
app.get('/proxy-rss', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).send('URL parameter is required');
        }
        // TODO: Add URL validation to only allow trusted RSS sources
        // FIXME: No timeout handling for external requests
        const response = await fetch(url);
        const text = await response.text();
        res.set('Content-Type', 'text/xml');
        res.send(text);
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        res.status(500).send('Error fetching RSS feed');
    }
});

// TODO: Add input validation and sanitization
// FIXME: Hebrew comments should be in English for better maintainability
app.get('/assert-test', (req, res) => {
    try {
        const input = req.query.input || 'hello world';
        // TODO: Add input length limits to prevent excessive token counting
        // HACK: Using GPT2 encoding for all models - might not be accurate for newer models
        const enc = getEncoding("gpt2");
        const tokens = enc.encode(input);
        const numTokens = tokens.length;
        console.log(`Number of tokens for "${input}": ${numTokens}`); // Hebrew: הדפסה ללוג
        res.json({ success: true, numTokens });
    } catch (error) {
            res.status(500).json({ success: false, message: error.message });
      
    }
});

// TODO: Add rate limiting per API key to prevent abuse
// FIXME: API key is passed through request body - should validate or hash for logging
// BUG: No timeout handling for OpenAI API requests
app.post('/generate-text', async (req, res) => {
    console.log("Received POST request to /generate-text");
    try {
        const { apiKey, prompt } = req.body;
        if (!apiKey || !prompt) {
            return res.status(400).json({ success: false, message: 'API key and prompt are required' });
        }
        // TODO: Add prompt length validation to prevent excessive costs
        // TODO: Add content filtering to prevent harmful prompts
        console.log("Forwarding request to OpenAI API");
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // TODO: Make model configurable
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7 // TODO: Make temperature configurable
            })
        });

        if (!openaiResponse.ok) {
            // TODO: Add better error handling for different OpenAI error types
            throw new Error(`OpenAI API error! status: ${openaiResponse.status}`);
        }

        const data = await openaiResponse.json();
        console.log("Response received from OpenAI API");
        // HACK: Assuming choices[0] exists without validation
        res.json({
            success: true,
            text: data.choices[0].message.content,
            usage: data.usage
        });
    } catch (error) {
        console.error('Error generating text:', error);
        // FIXME: Exposing internal error messages to client
        res.status(500).json({ success: false, message: error.message });
    }
});


// TODO: Add authentication/authorization for news updates
// FIXME: No backup mechanism before modifying YAML files
// BUG: Race condition possible when multiple requests modify same file simultaneously
app.post('/api/hot-news/:lang', express.json(), async (req, res) => {
    const lang = req.params.lang;
    // TODO: Use a constants file for supported languages
    if (lang !== 'en' && lang !== 'he') {
        return res.status(400).json({ error: 'Invalid language. Use "en" or "he".' });
    }

    try {
        const { sections } = req.body;
        if (!Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({ error: 'Sections array is required and must not be empty' });
        }
        // TODO: Add input sanitization and validation for sections data
        const newsFilePath = path.join(__dirname, `public/data/news_${lang}.yaml`);
        // FIXME: No check if file exists before reading
        const newsData = await fs.readFile(newsFilePath, 'utf8');
        const parsedNews = yaml.load(newsData);
        // HACK: Assuming hot_news property exists in YAML structure
        sections.forEach(({ section, topics }) => {
            if (!section || !Array.isArray(topics) || topics.length === 0) {
                throw new Error('Each section must have a name and a non-empty topics array');
            }
            // TODO: Add duplicate detection to prevent adding same content multiple times
            const sectionIndex = parsedNews.hot_news.findIndex(s => s.section === section);
            if (sectionIndex === -1) {
                // If the section doesn't exist, create a new one
                parsedNews.hot_news.push({ section, topics });
            } else {
                // If the section exists, append new topics
                // FIXME: No limit on number of topics per section
                parsedNews.hot_news[sectionIndex].topics.push(...topics);
            }
        });
        // TODO: Add file locking mechanism to prevent concurrent writes
        await fs.writeFile(newsFilePath, yaml.dump(parsedNews), 'utf8');
        res.json({ message: `News items added successfully to ${lang} news` });
    } catch (error) {
        console.error(`Error adding news items to ${lang} news:`, error);
        // FIXME: Exposing internal error details to client
        res.status(500).json({ error: `Error adding news items to ${lang} news: ${error.message}` });
    }
});






// TODO: Move this artifact mapping logic to a separate module
// FIXME: This artifact functionality seems unrelated to AI Knowledge Base - possibly legacy code
// HACK: Hardcoded artifact types should be moved to configuration or database
const mapArtifactData = (data) => {
    // Validate required fields
    if (!data.institution_id) {
        throw new Error('institution_id is required');
    }
    // TODO: Add validation for institution_id format (numeric, length, etc.)
    // Validate enum type if provided
    const validTypes = ['Web Logo', 'PDF Backer', '501R PDF', 'Custom Statement Insert PDF', 'QR Code'];
    if (data.type && !validTypes.includes(data.type)) {
        throw new Error('Invalid artifact type');
    }
    // TODO: Add input sanitization for all string fields
    // Create the mapped object with all possible fields
    const mappedArtifact = {
        institution_id: data.institution_id,
        type: data.type || null,
        artifact_name: data.artifact_name || null,
        artifact_description: data.artifact_description || '', // Required, defaults to empty string
        deleted: data.deleted !== undefined ? data.deleted : 0,
        create_timestamp: data.create_timestamp || new Date().toISOString().slice(0, 19).replace('T', ' '), // Format: YYYY-MM-DD HH:MM:SS
        marked_for_delete: data.marked_for_delete !== undefined ? data.marked_for_delete : 0
    };
    // HACK: Using delete operator in forEach - inefficient approach
    Object.keys(mappedArtifact).forEach(key => 
        mappedArtifact[key] === undefined && delete mappedArtifact[key]
    );

    return mappedArtifact;
};

// Example usage:
/*
const artifactData = {
    institution_id: 123,
    type: 'Web Logo',
    artifact_name: 'Company Logo',
    artifact_description: 'Main logo for the website'
};
const mappedData = mapArtifactData(artifactData);
*/

// TODO: Remove this artifact endpoint if not used in AI Knowledge Base
// FIXME: This endpoint doesn't actually persist data - just validates and returns it
app.post('/api/artifacts', async (req, res) => {
    try {
        // Map and validate the incoming data
        const artifactData = mapArtifactData(req.body);
        // TODO: Implement actual database persistence
        // Here you would typically insert the data into your MySQL database
        // For example using a MySQL client:
        /*
        const result = await db.query(
            'INSERT INTO artifact SET ?',
            artifactData
        );
        */
        // HACK: Returning success without actually saving anything
        // For now, we'll just return the mapped data
        res.status(201).json({
            success: true,
            message: 'Artifact mapped successfully',
            data: artifactData
        });
    } catch (error) {
        console.error('Error creating artifact:', error);
        // FIXME: Exposing internal validation errors to client
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// TODO: Add graceful shutdown handling
// TODO: Add health check endpoint
// TODO: Add request logging middleware
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    // TODO: Add environment-based logging (development vs production)
});
