const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');  // Add this line to import cors

const yaml = require('js-yaml');
const path = require('path');
const app = express();
const port = process.env.PORT || 8085;
const allowedOrigins = ['http://localhost:8085', 'https://leonmelamud.github.io'];

// ייבוא הספריה js-tiktoken
const { getEncoding } = require('js-tiktoken');

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

// הגדרת הנתיב לתיקיית הקבצים הסטטיים בהתאם לסביבה
const staticPath = 'public';
app.use(express.static(path.join(__dirname, staticPath)));

app.use(express.json()); // Add this line to parse JSON bodies

const assert = require('assert');

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

app.get('/assert-test', (req, res) => {
    try {
        const input = req.query.input || 'hello world';

        // קבלת האנקודר עבור המודל gpt3
        const enc = getEncoding("gpt2");
        const tokens = enc.encode(input);
        const numTokens = tokens.length;
        console.log(`Number of tokens for "${input}": ${numTokens}`); // הדפסה ללוג
        res.json({ success: true, numTokens });
    } catch (error) {
            res.status(500).json({ success: false, message: error.message });
      
    }
});

app.post('/generate-text', async (req, res) => {
    console.log("Received POST request to /generate-text");
    try {
        const { apiKey, prompt } = req.body;
        if (!apiKey || !prompt) {
            return res.status(400).json({ success: false, message: 'API key and prompt are required' });
        }

        console.log("Forwarding request to OpenAI API");
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error! status: ${openaiResponse.status}`);
        }

        const data = await openaiResponse.json();
        console.log("Response received from OpenAI API");

        res.json({
            success: true,
            text: data.choices[0].message.content,
            usage: data.usage
        });
    } catch (error) {
        console.error('Error generating text:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});