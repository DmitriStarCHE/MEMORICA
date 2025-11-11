const fs = require('fs');
const path = require('path');

console.log('🚀 Настройка проекта для развертывания на Render.com...\n');

// Проверяем необходимые файлы
const requiredFiles = [
  'package.json',
  'server/index.js',
  'public/index.html',
  'public/ar-viewer.html',
  'render.yaml'
];

console.log('📁 Проверка файлов проекта...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - НЕ НАЙДЕН`);
  }
});

// Создаем папки если их нет
const directories = ['public/assets', 'public/js', 'public/css'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Создана папка: ${dir}`);
  }
});

// Создаем базовые файлы если их нет
if (!fs.existsSync('public/ar-viewer.html')) {
  console.log('⚠️ AR просмотрщик не найден, создаем базовую версию...');
  // Здесь можно создать минимальную версию AR просмотрщика
}

console.log('\n🎯 ИНСТРУКЦИЯ ПО РАЗВЕРТЫВАНИЮ:');
console.log(`
1. 📝 Создайте аккаунт на Render.com
   • Перейдите на https://render.com
   • Зарегистрируйтесь через GitHub (рекомендуется)

2. 📂 Загрузите проект в GitHub
   • Создайте новый репозиторий на GitHub
   • Загрузите файлы проекта:
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/yourusername/webar-portal.git
     git push -u origin main

3. 🚀 Создайте Web Service на Render
   • В Dashboard Render нажмите "New +"
   • Выберите "Web Service"
   • Подключите ваш GitHub репозиторий
   • Настройте сервис:
     - Name: webar-portal (или ваше название)
     - Environment: Node
     - Region: Ohio (или ближайший к вам)
     - Branch: main
     - Build Command: npm install
     - Start Command: npm start

4. ⚙️ Настройка окружения (опционально)
   • В настройках сервиса добавьте Environment Variables:
     - NODE_ENV: production
     - PORT: 10000 (Render автоматически устанавливает порт)

5. 🎉 Запуск
   • Нажмите "Create Web Service"
   • Render автоматически запустит сборку и деплой
   • После успешного деплоя получите URL вида:
     https://webar-portal.onrender.com

6. 📱 Тестирование
   • Откройте полученный URL в браузере
   • Проверьте работу Admin панели
   • Протестируйте AR на мобильном устройстве
`);

console.log('\n💡 СОВЕТЫ ДЛЯ УСПЕШНОГО ДЕПЛОЯ:');
console.log(`
• Убедитесь, что все файлы закоммичены в Git
• Проверьте, что package.json содержит правильные скрипты
• На Render используйте Node.js версии 18+
• Для файлов используйте облачное хранилище (опционально)
• Бесплатный инстанс "засыпает" после 15 минут неактивности
`);

// Проверяем package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts || !packageJson.scripts.start) {
    console.log('\n⚠️ ВНИМАНИЕ: В package.json отсутствует скрипт "start"');
  }
  
  if (packageJson.engines && packageJson.engines.node) {
    console.log(`✅ Версия Node.js: ${packageJson.engines.node}`);
  } else {
    console.log('⚠️ Рекомендуется указать версию Node.js в package.json');
  }
  
} catch (error) {
  console.log('❌ Ошибка чтения package.json:', error.message);
}

console.log('\n✨ Настройка завершена! Следуйте инструкции выше для развертывания.');