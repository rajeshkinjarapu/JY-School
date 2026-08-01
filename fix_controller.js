const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'controllers', 'attendance.controller.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Delete lines 136 to 283 (0-indexed: 135 to 282)
lines.splice(135, 283 - 136 + 1);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed attendance.controller.ts');
