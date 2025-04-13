// launcher.js
const { exec } = require('child_process');
const path = require('path');
const open = require('open');

const baseDir = __dirname;

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const child = exec(command, { cwd, shell: true });

    child.stdout.on('data', data => process.stdout.write(data));
    child.stderr.on('data', data => process.stderr.write(data));

    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${command}`));
    });
  });
}

(async () => {
  try {
    console.log('Instalando dependencias...');
    await runCommand('npm install', path.join(baseDir, 'backend'));
    await runCommand('npm install', path.join(baseDir, 'frontend'));

    console.log('Iniciando backend...');
    runCommand('node server.js', path.join(baseDir, 'backend'));

    console.log('Iniciando frontend...');
    runCommand('npm run dev', path.join(baseDir, 'frontend'));

    console.log('Abriendo navegador...');
    await open('http://localhost:5173');

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
