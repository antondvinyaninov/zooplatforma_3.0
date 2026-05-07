const fs = require('fs');
const path = require('path');

function wrapWithContext(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Insert context creation right after imports:
  // Assuming imports block ends with const/interface
  
  if (!code.includes('EditContext')) {
    const contextCode = `\nconst EditContext = React.createContext<any>(null);\n`;
    // finding last import
    const lastImportIndex = code.lastIndexOf('import ');
    const nextLineIndex = code.indexOf('\n', lastImportIndex);
    
    code = code.substring(0, nextLineIndex) + contextCode + code.substring(nextLineIndex);
  }
}
