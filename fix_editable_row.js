const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Rename the constant
  content = content.replace(/const EditableRow = \(\{([\s\S]*?)\}: \{(.*?)\}\) => \{/g, 'const renderEditableRow = ({\n    $1\n  }: {\n$2\n  }) => {');

  // 2. Replace JSX usages
  // This is a basic regex. A better way is to avoid regex for JSX attributes, 
  // but let's try a simple approach: matching <EditableRow ...Props />
  // We can just use a simple regex replacing <EditableRow and />
  
  // Actually, we can write a regex that matches <EditableRow ... />
  // and converts it. But multiline JSX is tricky.
}

