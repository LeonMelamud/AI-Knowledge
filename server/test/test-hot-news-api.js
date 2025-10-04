// TODO: Add setup and teardown for test server
// FIXME: Hardcoded BASE_URL should be configurable via environment variables
const fetch = require('node-fetch');
const assert = require('assert');
const path = require('path'); // TODO: Remove unused import if not needed

const BASE_URL = 'http://localhost:8085'; // FIXME: Should be configurable

describe('Hot News API', function() {
    // TODO: Make timeout configurable based on environment
    this.timeout(5000); // Set timeout to 5 seconds

    describe('GET /api/hot-news/:lang', function() {
        // TODO: Add more comprehensive validation of response structure
        it('should return English news', async function() {
            const response = await fetch(`${BASE_URL}/api/hot-news/en`);
            const data = await response.json();
            assert(response.ok, 'GET request for English news failed');
            assert(data.hot_news, 'English news data is missing');
            // TODO: Add validation for news data structure and content
        });

        // TODO: Add test for response time and performance
        it('should return Hebrew news', async function() {
            const response = await fetch(`${BASE_URL}/api/hot-news/he`);
            const data = await response.json();
            assert(response.ok, 'GET request for Hebrew news failed');
            assert(data.hot_news, 'Hebrew news data is missing');
            // TODO: Validate Hebrew-specific content encoding
        });
        

        it('should fail for invalid language', async function() {
            const response = await fetch(`${BASE_URL}/api/hot-news/fr`);
            assert(!response.ok, 'GET request with invalid language should fail');
        });
    });

    describe('POST /api/hot-news/:lang', function() {
        it('should add multiple sections and topics to English news', async function() {
            const newSections = {
                sections: [
                    {
                        section: "Test Section 1",
                        topics: [
                            {
                                title: "Test Topic 1",
                                images: ["test-image1.jpg"],
                                description: "This is test topic 1",
                                links: [{ name: "Test Link 1", url: "https://example1.com" }]
                            },
                            {
                                title: "Test Topic 2",
                                images: ["test-image2.jpg"],
                                description: "This is test topic 2",
                                links: [{ name: "Test Link 2", url: "https://example2.com" }]
                            }
                        ]
                    },
                    {
                        section: "Test Section 2",
                        topics: [
                            {
                                title: "Test Topic 3",
                                images: ["test-image3.jpg"],
                                description: "This is test topic 3",
                                links: [{ name: "Test Link 3", url: "https://example3.com" }]
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(`${BASE_URL}/api/hot-news/en`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSections)
            });
            const data = await response.json();
            assert(response.ok, 'POST request for multiple English news items failed');
            assert(data.message.includes('successfully'), 'Multiple English news items not added successfully');
        });

        it('should fail for empty sections array', async function() {
            const response = await fetch(`${BASE_URL}/api/hot-news/en`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sections: [] })
            });
            assert(!response.ok, 'POST request with empty sections array should fail');
        });
    });
});

// TODO: Add tests for edge cases like very large payloads, invalid data types, etc.
// TODO: Add tests for malformed JSON requests
// TODO: Add tests for concurrent requests
// TODO: Add performance benchmarking tests
// TODO: Add integration tests with actual YAML file operations
// FIXME: Tests should clean up any test data created during execution