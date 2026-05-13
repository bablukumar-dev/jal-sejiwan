const fs = require('fs');

function removeDarkClasses(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = content.replace(/dark:[a-zA-Z0-9_/-]+/g, '');
  content = content.replace(/  +/g, ' ');
  content = content.replace(/ "/g, '"');
  content = content.replace(/ `/g, '`');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned ${filePath}`);
  }
}

removeDarkClasses('./app/login/page.tsx');
