const fs = require('fs');
const glob = require('glob'); // Built-in glob is not in Node, but we can do it manually or just specify files

const files = [
  'frontend/components/modules/pets/profile/PetGeneralInfo.tsx',
  'frontend/app/org/[orgId]/(dashboard)/organization/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Rename declaration
  content = content.replace(/const EditableRow = \(\{/g, 'const renderEditableRow = ({');

  // 2. Replace usages
  // A JSX element <EditableRow prop1="val" prop2={val} />
  // We can write a regex that matches <EditableRow ... />
  // We need to capture the attributes.
  // Because attributes can be multiline, we use [\s\S]*?
  content = content.replace(/<EditableRow([\s\S]*?)\/>/g, (match, p1) => {
    // p1 contains the attributes string like ` field="name" value={1} `
    // We need to convert `key="val"` to `key: "val",` and `key={val}` to `key: val,`
    
    // First, let's normalize newlines inside the attributes string
    let attrs = p1;
    
    // Replace `key="val"` -> `key: "val",`
    attrs = attrs.replace(/([a-zA-Z0-9_]+)="([^"]*)"/g, '$1: "$2",');
    
    // Replace `key={val}` -> `key: val,`
    // This is tricky if `val` contains braces. 
    // Usually it's single level braces like `{org.name || ''}`
    // Let's use a simpler approach:
    // Just find all `key={...}`
    // Since we don't have nested braces in the EditableRow props in these files, we can do:
    attrs = attrs.replace(/([a-zA-Z0-9_]+)=\{([^}]+)\}/g, '$1: $2,');
    
    // Replace `required` -> `required: true,`
    attrs = attrs.replace(/([a-zA-Z0-9_]+)\s*(?=[a-zA-Z0-9_]+:|$)/g, '$1: true, ');

    // For boolean attributes like `required` that don't have a value:
    // This is tricky with simple regex. Let's look at the exact usages.
    // In organization/page.tsx: `required ` at the end before `/>`
    // We can just manually fix those if regex misses, but let's try our best.
    
    return `{renderEditableRow({ ${attrs.trim()} })}`;
  });
  
  fs.writeFileSync(file, content);
});

console.log('Fixed EditableRow');
