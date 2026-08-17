const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const startMarker = '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">';
const endMarker = '<div className="space-y-4 pt-4 border-t border-border">';

// Find the *first* occurrence of startMarker that comes after "Price (USD)"
const priceIndex = code.indexOf('Price (USD)');
let startIndex = code.lastIndexOf(startMarker, priceIndex);

// Find the *last* occurrence of endMarker before "Cover Image (Required)"
const coverIndex = code.indexOf('Cover Image (Required)');
let endIndex = code.lastIndexOf(endMarker, coverIndex);

console.log(startIndex, endIndex);
