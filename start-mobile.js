const { spawn } = require('child_process');

console.log('🚀 Запуск WebAR для мобильных устройств...');
console.log('📡 Запуск сервера...');

const server = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  shell: true
});

setTimeout(() => {
  console.log('\n🌐 Сервер запущен! Теперь запустите туннель:');
  console.log('   npx localtunnel --port 8080');
  console.log('   ИЛИ');
  console.log('   ssh -R 80:localhost:8080 serveo.net');
}, 3000);

process.on('SIGINT', () => {
  console.log('\n👋 Остановка сервера...');
  server.kill();
  process.exit(0);
});