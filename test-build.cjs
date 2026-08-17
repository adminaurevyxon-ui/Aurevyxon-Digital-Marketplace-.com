const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build OK');
} catch (e) {
  console.log('Build Failed');
}
