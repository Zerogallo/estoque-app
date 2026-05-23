const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data');

const readData = (fileName) => {
  try {
    const data = fs.readFileSync(path.join(dataPath, fileName), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeData = (fileName, data) => {
  fs.writeFileSync(path.join(dataPath, fileName), JSON.stringify(data, null, 2));
};

module.exports = { readData, writeData };