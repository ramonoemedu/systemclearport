const fs = require('fs');
const path = require('path');

const FILE_NAME = 'extracted_names.txt';

// Helper to format name: FIRSTNAME lastname
function formatName(name) {
  if (!name) return '';
  
  // 1. Clean up common OCR garbage and suffixes
  // Remove starting symbols like ©, A™L, numbers, etc.
  let cleanName = name.replace(/^[^A-Z]+/, '') // Remove leading non-letters
                      .replace(/Credit[\s_]*Report/i, '') // Remove Credit Report (with space or underscore)
                      .replace(/\.(jpg|png|jpeg|gif)$/i, '')
                      .replace(/\s*\(\d+\)$/, '') // Remove trailing (1), (2)
                      .trim();

  // 2. Extract potential name part if there's still junk
  // Look for patterns like "NAME_NAME" or "NAME NAME"
  cleanName = cleanName.replace(/[©®™]/g, '')
                       .replace(/^(AL|AX|AY:|A"K?|A"|cBC|PDF)\s*/i, '') // Remove ALL starting OCR artifacts
                       .trim();

  // Split by underscore or space
  const parts = cleanName.split(/[\s_]+/).filter(p => p.length > 0);
  
  if (parts.length === 0) return '';
  
  // Filter out tiny parts that might be noise
  const validParts = parts.filter(p => p.length > 2 || (p.length === 2 && /^[A-Z]{2}$/.test(p)));
  
  if (validParts.length === 0) return '';
  
  const firstName = validParts[0].toUpperCase();
  const rest = validParts.slice(1).map(p => p.toLowerCase()).join(' ');
  
  if (!rest) return firstName;
  // Capitalize first character of first name
  const capitalizedRest = rest.charAt(0).toUpperCase() + rest.slice(1);
  return `${firstName} ${capitalizedRest}`;
}

try {
  const filePath = path.join(__dirname, FILE_NAME);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File ${FILE_NAME} not found.`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

  const seenNames = new Set();
  console.log('--- Formatted Names ---');
  lines.forEach(line => {
    const rawName = line.trim();
    if (rawName) {
      // Remove © and special symbols, then split by patterns like "Credit Report" to separate entries
      let cleaned = rawName.replace(/©/g, '|').replace(/^[|]/g, ''); // Replace © with | separator
      const potentialNames = cleaned.split('|').filter(s => s.trim().length > 0);
      
      potentialNames.forEach(potential => {
        const formatted = formatName(potential.trim());
        // Filter out:
        // - Names shorter than 3 chars
        // - Names that contain "credit report"
        // - Names that are just "PDF", "CBC", etc. (single word names that are OCR junk)
        if (formatted && formatted.length > 2 && 
            !seenNames.has(formatted) &&
            !/credit\s+report/i.test(formatted) &&
            !(/^[A-Z]{1,3}$/.test(formatted))) { // Filter out 1-3 letter all-caps words
          console.log(`- ${formatted}`);
          seenNames.add(formatted);
        }
      });
    }
  });

} catch (err) {
  console.error('An error occurred:', err.message);
}
