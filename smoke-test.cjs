const http = require('http');

const req = http.get('http://localhost:3000/api/health', (res) => {
  if (res.statusCode !== 200) {
    console.error(`Smoke test failed: ${res.statusCode}`);
    process.exit(1);
  }
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (!data.includes('ok')) {
      console.error(`Smoke test failed: invalid response ${data}`);
      process.exit(1);
    }
    console.log('Smoke test passed!');
    process.exit(0);
  });
}).on('error', (e) => {
  console.error(`Smoke test failed: ${e.message}`);
  process.exit(1);
});
req.setTimeout(5000, () => {
  req.destroy();
  console.error('Smoke test timeout');
  process.exit(1);
});
