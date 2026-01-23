const testCases = [
  ' A™L THORNG_SREYLEAK Credit Report',
  ' A™L VIN_VATHANA Credit Report',
  ' A™L VOUN_SOKNY _Credit Report'
];

function formatName(name) {
  if (!name) return '';
  
  let cleanName = name.replace(/^[^A-Z]+/, '')
                      .replace(/\.(jpg|png|jpeg|gif)$/i, '')
                      .replace(/\s*\(\d+\)$/, '')
                      .trim();

  cleanName = cleanName.replace(/[©®™]/g, '')
                       .replace(/^(AX|AY:|A"K?|A"|cBC)\s*/i, '')
                       .replace(/^(PDF)\s*/i, '')
                       .trim();

  console.log('  After cleaning:', JSON.stringify(cleanName));

  const parts = cleanName.split(/[\s_]+/).filter(p => p.length > 0);
  console.log('  Parts:', parts);
  
  if (parts.length === 0) return '';
  
  const firstName = parts[0].toUpperCase();
  const rest = parts.slice(1).map(p => p.toLowerCase()).join(' ');
  
  if (!rest) return firstName;
  const capitalizedRest = rest.charAt(0).toUpperCase() + rest.slice(1);
  return `${firstName} ${capitalizedRest}`;
}

testCases.forEach(test => {
  console.log('Testing:', JSON.stringify(test));
  const result = formatName(test);
  console.log('Result:', JSON.stringify(result));
  console.log('---');
});
