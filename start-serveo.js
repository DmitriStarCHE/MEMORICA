const { spawn } = require('child_process');

console.log('🚀 Запуск WebAR с Serveo туннелем...');
console.log('📡 Убедитесь что сервер запущен на порту 8080');
console.log('🌐 Запуск туннеля...\n');

const serveo = spawn('ssh', [
  '-o', 'ServerAliveInterval=60',
  '-R', '80:localhost:8080',
  'serveo.net'
], { stdio: 'inherit' });

serveo.on('close', (code) => {
  console.log(`\n🔻 Туннель закрыт с кодом: ${code}`);
});