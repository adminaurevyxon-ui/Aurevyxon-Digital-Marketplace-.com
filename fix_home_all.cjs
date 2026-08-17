const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// The original SelectContent didn't have <SelectItem value="All">All</SelectItem> after I deleted it.
// I should add it back for filters!

content = content.replace(
  /<SelectContent>\s*\{extraFilters\.platform\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {extraFilters.platform.map`
);
content = content.replace(
  /<SelectContent>\s*\{extraFilters\.framework\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {extraFilters.framework.map`
);
content = content.replace(
  /<SelectContent>\s*\{extraFilters\.license\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {extraFilters.license.map`
);
content = content.replace(
  /<SelectContent>\s*\{extraFilters\.fileType\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {extraFilters.fileType.map`
);
content = content.replace(
  /<SelectContent>\s*\{extraFilters\.language\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {extraFilters.language.map`
);
content = content.replace(
  /<SelectContent>\s*\{extraFilters\.compatibility\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {extraFilters.compatibility.map`
);
content = content.replace(
  /<SelectContent>\s*\{extraFilters\.support\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {extraFilters.support.map`
);
content = content.replace(
  /<SelectContent>\s*\{Object\.keys\(categories\)\.map/g,
  `<SelectContent>\n                 <SelectItem value="All">All</SelectItem>\n                 {Object.keys(categories).map`
);

fs.writeFileSync('src/pages/Home.tsx', content);
