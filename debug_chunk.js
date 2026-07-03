const fs = require('fs');
const content = fs.readFileSync('.next/server/chunks/6353.js', 'utf8');
const lines = content.split('\n');
if (lines.length > 0) {
  const line = lines[0]; // Assuming it's line 1
  const offset = 16363;
  console.log(line.substring(offset - 200, offset + 200));
}
