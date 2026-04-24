const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
  fs.writeFileSync('error.log', 'SUCCESS:\n' + output);
} catch (err) {
  fs.writeFileSync('error.log', 'ERROR:\n' + err.stdout + '\n' + err.stderr);
}
