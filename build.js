const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');

// async function createDataJson() {
//     try {
//         const rootDir = process.cwd();
//         const publicDir = path.join(rootDir, 'public');

//         console.log('Reading YAML files from:', publicDir);

//         // Read YAML files
//         const [linksYaml, conceptsYaml] = await Promise.all([
//             fs.readFile(path.join(publicDir, 'links_en.yaml'), 'utf8'),
//             fs.readFile(path.join(publicDir, 'concepts_en.yaml'), 'utf8')
//         ]);

//         // Create data.json
//         const data = {
//             links: yaml.load(linksYaml),
//             concepts: yaml.load(conceptsYaml),
//             timestamp: Date.now()
//         };

//         // Write data.json
//         const outputPath = path.join(publicDir, 'data.json');
//         await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
//         console.log('data.json created successfully at:', outputPath);
//     } catch (error) {
//         console.error('Error creating data.json:', error);
//         if (error.code === 'ENOENT') {
//             console.error('File not found:', error.path);
//         }
//     }
// }

// createDataJson();