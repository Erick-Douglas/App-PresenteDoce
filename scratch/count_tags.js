const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;

console.log(`Open Divs: ${openDivs}`);
console.log(`Close Divs: ${closeDivs}`);

if (openDivs !== closeDivs) {
  console.log(`Imbalance: ${openDivs - closeDivs}`);
} else {
  console.log('Balanced!');
}
