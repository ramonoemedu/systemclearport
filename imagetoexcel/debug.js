function formatName(name) {
  if (!name) return '';
  
  let cleanName = name.replace(/^[^A-Z]+/, '')
                      .replace(/Credit\s*Report/i, '')
                      .replace(/\.(jpg|png|jpeg|gif)$/i, '')
                      .replace(/\s*\(\d+\)$/, '')
                      .trim();

  console.log('After first clean:', JSON.stringify(cleanName));

  cleanName = cleanName.replace(/[©®™]/g, '')
                       .replace(/^(AL|AX|AY:|A"K?|A"|cBC|PDF)\s*/i, '')
                       .trim();

  console.log('After second clean:', JSON.stringify(cleanName));

  const parts = cleanName.split(/[\s_]+/).filter(p => p.length > 0);
  console.log('Parts:', parts);
  
  if (parts.length === 0) return '';
  
  const validParts = parts.filter(p => p.length > 2 || (p.length === 2 && /^[A-Z]{2}$/.test(p)));
  console.log('Valid parts:', validParts);
  
  if (validParts.length === 0) return '';
  
  const firstName = validParts[0].toUpperCase();
  const rest = validParts.slice(1).map(p => p.toLowerCase()).join(' ');
  
  if (!rest) return firstName;
  const capitalizedRest = rest.charAt(0).toUpperCase() + rest.slice(1);
  return `${firstName} ${capitalizedRest}`;
}

console.log('=== CHEA_SREYLIN ===');
console.log('Result:', formatName('© AL CHEA_SREYLIN_Credit_Report'));
console.log('\n=== KHOV_DALIN ===');
console.log('Result:', formatName('© AL KHOV_DALIN_Credit_Report'));
