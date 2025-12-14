#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const SERVER_FILE = path.join(ROOT_DIR, 'server.js');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'data');

let errors = [];
let warnings = [];

// Check if all required documentation files exist
async function checkDocsExist() {
    const requiredDocs = ['README.md', 'API.md', 'DATA_SCHEMAS.md', 'ARCHITECTURE.md', 'CONTRIBUTING.md'];
    
    for (const doc of requiredDocs) {
        const docPath = path.join(DOCS_DIR, doc);
        try {
            await fs.access(docPath);
            console.log(`✅ ${doc} exists`);
        } catch (error) {
            errors.push(`Missing documentation file: ${doc}`);
            console.log(`❌ ${doc} is missing`);
        }
    }
}

// Extract routes from server.js
async function extractRoutesFromServer() {
    const content = await fs.readFile(SERVER_FILE, 'utf8');
    const routes = [];
    
    const routePattern = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = routePattern.exec(content)) !== null) {
        routes.push({
            method: match[1].toUpperCase(),
            path: match[2]
        });
    }
    
    return routes;
}

// Check if all API endpoints are documented
async function checkAPIDocumentation() {
    const apiDocPath = path.join(DOCS_DIR, 'API.md');
    
    try {
        const apiDoc = await fs.readFile(apiDocPath, 'utf8');
        const serverRoutes = await extractRoutesFromServer();
        
        console.log(`\n📝 Checking API documentation...`);
        console.log(`Found ${serverRoutes.length} routes in server.js`);
        
        for (const route of serverRoutes) {
            const routeSignature = `${route.method} ${route.path}`;
            if (apiDoc.includes(routeSignature)) {
                console.log(`✅ ${routeSignature} is documented`);
            } else {
                warnings.push(`API endpoint not documented: ${routeSignature}`);
                console.log(`⚠️  ${routeSignature} might not be fully documented`);
            }
        }
    } catch (error) {
        errors.push(`Cannot read API.md: ${error.message}`);
    }
}

// Check if all YAML files are documented
async function checkDataSchemaDocumentation() {
    const schemaDocPath = path.join(DOCS_DIR, 'DATA_SCHEMAS.md');
    
    try {
        const schemaDoc = await fs.readFile(schemaDocPath, 'utf8');
        const dataFiles = await fs.readdir(DATA_DIR);
        
        console.log(`\n📊 Checking data schema documentation...`);
        
        const yamlAndJsonFiles = dataFiles.filter(f => f.endsWith('.yaml') || f.endsWith('.json'));
        
        for (const file of yamlAndJsonFiles) {
            if (schemaDoc.includes(file)) {
                console.log(`✅ ${file} is documented`);
            } else {
                warnings.push(`Data file not documented: ${file}`);
                console.log(`⚠️  ${file} is not documented`);
            }
        }
    } catch (error) {
        errors.push(`Cannot read DATA_SCHEMAS.md: ${error.message}`);
    }
}

// Check for broken internal links
async function checkInternalLinks() {
    console.log(`\n🔗 Checking internal documentation links...`);
    
    const docFiles = await fs.readdir(DOCS_DIR);
    const markdownFiles = docFiles.filter(f => f.endsWith('.md'));
    
    for (const file of markdownFiles) {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Check for relative markdown links
        const linkPattern = /\[([^\]]+)\]\(\.\/([^)]+\.md)\)/g;
        let match;
        
        while ((match = linkPattern.exec(content)) !== null) {
            const linkedFile = match[2];
            const linkedPath = path.join(DOCS_DIR, linkedFile);
            
            try {
                await fs.access(linkedPath);
                console.log(`✅ Link in ${file} to ${linkedFile} is valid`);
            } catch (error) {
                errors.push(`Broken link in ${file}: ${linkedFile} does not exist`);
                console.log(`❌ Broken link in ${file} to ${linkedFile}`);
            }
        }
    }
}

// Validate YAML files structure
async function validateYAMLFiles() {
    console.log(`\n📋 Validating YAML file structures...`);
    
    const yamlFiles = [
        'news_en.yaml',
        'news_he.yaml',
        'concepts_en.yaml',
        'concepts_he.yaml',
        'links_en.yaml',
        'links_he.yaml'
    ];
    
    for (const file of yamlFiles) {
        const filePath = path.join(DATA_DIR, file);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = yaml.load(content);
            
            // Basic structure validation
            if (file.startsWith('news_') && !data.hot_news) {
                errors.push(`${file}: Missing 'hot_news' root property`);
            } else if (file.startsWith('concepts_') && !data.concepts) {
                errors.push(`${file}: Missing 'concepts' root property`);
            } else if (file.startsWith('links_') && !data.tools) {
                errors.push(`${file}: Missing 'tools' root property`);
            } else {
                console.log(`✅ ${file} has valid structure`);
            }
        } catch (error) {
            errors.push(`${file}: YAML parsing error - ${error.message}`);
            console.log(`❌ ${file} has parsing errors`);
        }
    }
}

// Check if documentation is up to date
async function checkDocumentationFreshness() {
    console.log(`\n⏰ Checking documentation freshness...`);
    
    const apiDocPath = path.join(DOCS_DIR, 'API.md');
    const serverFilePath = SERVER_FILE;
    
    try {
        const apiDocStats = await fs.stat(apiDocPath);
        const serverStats = await fs.stat(serverFilePath);
        
        if (serverStats.mtime > apiDocStats.mtime) {
            warnings.push('API.md may be outdated (server.js was modified more recently)');
            console.log(`⚠️  API.md may need regeneration`);
        } else {
            console.log(`✅ API.md appears up to date`);
        }
    } catch (error) {
        // If files don't exist, other checks will catch it
    }
}

// Main validation function
async function main() {
    console.log('🔍 Validating documentation...\n');
    
    try {
        await checkDocsExist();
        await checkAPIDocumentation();
        await checkDataSchemaDocumentation();
        await checkInternalLinks();
        await validateYAMLFiles();
        await checkDocumentationFreshness();
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 Validation Summary');
        console.log('='.repeat(50));
        
        if (errors.length === 0 && warnings.length === 0) {
            console.log('✅ All checks passed! Documentation is valid and up to date.');
            process.exit(0);
        } else {
            if (errors.length > 0) {
                console.log(`\n❌ Errors (${errors.length}):`);
                errors.forEach(err => console.log(`  - ${err}`));
            }
            
            if (warnings.length > 0) {
                console.log(`\n⚠️  Warnings (${warnings.length}):`);
                warnings.forEach(warn => console.log(`  - ${warn}`));
            }
            
            if (errors.length > 0) {
                console.log('\n❌ Validation failed due to errors.');
                process.exit(1);
            } else {
                console.log('\n⚠️  Validation completed with warnings.');
                process.exit(0);
            }
        }
    } catch (error) {
        console.error('❌ Validation error:', error);
        process.exit(1);
    }
}

main();
