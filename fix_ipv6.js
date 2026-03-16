const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Not available by default, we'll use a simple recursive func
function findFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const filesToFix = findFiles('frontend/app', '.ts');
filesToFix.push('frontend/lib/urls.ts');

for (const f of filesToFix) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes("process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'") && f.includes('route.ts')) {
    content = content.replace(
      "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'",
      "(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1')"
    );
    changed = true;
  }
  if (content.includes("process.env.ADMIN_API_URL || 'http://localhost:8000'") && f.includes('route.ts')) {
    content = content.replace(
      "process.env.ADMIN_API_URL || 'http://localhost:8000'",
      "(process.env.ADMIN_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1')"
    );
    changed = true;
  }
  if (content.includes("process.env.NEXT_PUBLIC_API_URL || process.env.ADMIN_API_URL || 'http://localhost:8000'") && f.includes('route.ts')) {
     content = content.replace(
      "process.env.NEXT_PUBLIC_API_URL || process.env.ADMIN_API_URL || 'http://localhost:8000'",
      "(process.env.NEXT_PUBLIC_API_URL || process.env.ADMIN_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1')"
    );
    changed = true;
  }
  if (f.endsWith('urls.ts') && content.includes("process.env.ADMIN_API_URL || 'http://localhost:8000'")) {
    content = content.replace(
      "process.env.ADMIN_API_URL || 'http://localhost:8000'",
      "(process.env.ADMIN_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1')"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
}
