const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(
  '<title>AUREVYXON</title>',
  '<link rel="icon" type="image/jpeg" href="/logo.jpg" />\n    <title>AUREVYXON</title>'
);
fs.writeFileSync('index.html', content);
