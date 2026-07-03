const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes("from 'motion/react'")) {
        fs.writeFileSync(fullPath, content.replace(/from 'motion\/react'/g, "from 'framer-motion'"), 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir('app');
replaceInDir('components');
