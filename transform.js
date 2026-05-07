const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const files = [
  'frontend/components/modules/pets/profile/PetGeneralInfo.tsx',
  'frontend/app/org/[orgId]/(dashboard)/organization/page.tsx'
];

files.forEach(filePath => {
  const code = fs.readFileSync(filePath, 'utf8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });

  traverse(ast, {
    VariableDeclarator(path) {
      if (path.node.id.name === 'EditableRow' || path.node.id.name === 'EditableBreedRow') {
        // Change from Component case to function case
        if (path.node.id.name === 'EditableRow') {
          path.node.id.name = 'renderEditableRow';
        } else if (path.node.id.name === 'EditableBreedRow') {
          path.node.id.name = 'renderEditableBreedRow';
        }
      }
    },
    JSXElement(path) {
      const opening = path.node.openingElement;
      if (t.isJSXIdentifier(opening.name) && opening.name.name === 'EditableRow') {
        // Convert to {renderEditableRow({ ...attrs })}
        const properties = opening.attributes.map(attr => {
          if (t.isJSXAttribute(attr)) {
            const key = t.identifier(attr.name.name);
            let value = attr.value;
            if (value === null) {
              value = t.booleanLiteral(true);
            } else if (t.isJSXExpressionContainer(value)) {
              if (t.isJSXEmptyExpression(value.expression)) {
                 value = t.booleanLiteral(true);
              } else {
                 value = value.expression;
              }
            }
            return t.objectProperty(key, value);
          } else if (t.isJSXSpreadAttribute(attr)) {
             return t.spreadElement(attr.argument);
          }
          return null;
        }).filter(Boolean);

        const call = t.callExpression(t.identifier('renderEditableRow'), [t.objectExpression(properties)]);
        path.replaceWith(t.jsxExpressionContainer(call));
      }
      
      if (t.isJSXIdentifier(opening.name) && opening.name.name === 'EditableBreedRow') {
        const call = t.callExpression(t.identifier('renderEditableBreedRow'), []);
        path.replaceWith(t.jsxExpressionContainer(call));
      }
    }
  });

  const output = generate(ast, {}, code);
  fs.writeFileSync(filePath, output.code);
});

console.log("Transformation completed successfully.");
