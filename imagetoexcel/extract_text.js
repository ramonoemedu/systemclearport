const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const images = ['1.png', '2.png'];
const outputFile = 'extracted_names.txt';

async function processImages() {
  console.log('Starting OCR process...');
  let allText = '';

  for (const image of images) {
    const imagePath = path.join(__dirname, image);
    if (fs.existsSync(imagePath)) {
      console.log(`Processing ${image}...`);
      try {
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
        // Filter out empty lines and trim
        const lines = text.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        console.log(`Extracted ${lines.length} lines from ${image}`);
        allText += lines.join('\n') + '\n';
      } catch (err) {
        console.error(`Error processing ${image}:`, err);
      }
    } else {
      console.warn(`File not found: ${image}`);
    }
  }

  // Write to file
  fs.writeFileSync(outputFile, allText);
  console.log(`\nExtraction complete. Results saved to ${outputFile}`);
  console.log('--- Extracted Content ---');
  console.log(allText);
}

processImages();
