// Generates vignettes/P01-calm.html through vignettes/P15-pushy.html
// as copies of vignettes/holding.html. Run with: node scripts/create-vignette-slots.js

const fs   = require('fs');
const path = require('path');

const vignettesDir = path.join(__dirname, '..', 'vignettes');
const holdingPath   = path.join(vignettesDir, 'holding.html');

// P01,P03... calm first; P02,P04... pushy first
for (let i = 1; i <= 15; i++) {
  const pid = `P${String(i).padStart(2, '0')}`;
  ['calm', 'pushy'].forEach(cond => {
    const filename = path.join(vignettesDir, `${pid}-${cond}.html`);
    fs.copyFileSync(holdingPath, filename);
  });
}

console.log('30 vignette slots created.');
