import fs from 'fs';
console.log('demo-before.png:', fs.statSync('public/demo-before.png').size);
console.log('demo-after.png:', fs.statSync('public/demo-after.png').size);
