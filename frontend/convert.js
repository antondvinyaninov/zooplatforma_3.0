const sharp = require('sharp');
const path = require('path');

const inputObj = process.argv[2];
const basename = path.basename(inputObj, '.webp');
const outputObj = path.join(path.dirname(inputObj), basename + '.gif');

sharp(inputObj, { animated: true })
  .gif()
  .toFile(outputObj)
  .then(() => {
    console.log('SUCCESS: ' + outputObj);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
