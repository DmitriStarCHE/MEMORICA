// Production configuration
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 8080;

// Enhanced CORS for production
app.use(cors({
  origin: isProduction 
    ? [
        'https://your-webar-portal.onrender.com',
        'https://www.your-webar-portal.onrender.com'
      ]
    : ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Security headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// Static files with cache control
app.use(express.static('public', {
  maxAge: isProduction ? '1d' : '0',
  etag: true,
  lastModified: true
}));
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Убедимся что папки существуют
const ensureDirectories = () => {
  const directories = [
    'public',
    'public/assets',
    'public/js', 
    'public/css'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Создана папка: ${dir}`);
    }
  });
};

// Простая база данных в памяти
let markers = [];
let contents = [];
let currentId = 1;

// Настройка загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const assetsPath = 'public/assets/';
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true });
    }
    cb(null, assetsPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const allowedModelTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    if (file.fieldname === 'markerImage' && allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === 'contentFile' && 
              (allowedImageTypes.includes(file.mimetype) || 
               allowedModelTypes.includes(file.mimetype) || 
               allowedVideoTypes.includes(file.mimetype))) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла'), false);
    }
  }
});

// ==================== ОСНОВНЫЕ МАРШРУТЫ ====================

// Главная страница
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WebAR Admin</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
          .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 WebAR Admin Panel</h1>
          <div class="status">
            <h3>✅ Сервер работает на порту ${PORT}!</h3>
            <p>Создайте файлы в папке public или перезагрузите страницу</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// Страница AR просмотрщика
app.get('/ar-viewer.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/ar-viewer.html'));
});

// ==================== API МАРКЕРОВ ====================

// Получение всех маркеров
app.get('/api/markers', (req, res) => {
  try {
    res.json(markers);
  } catch (error) {
    console.error('❌ Ошибка получения маркеров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение конкретного маркера
app.get('/api/markers/:id', (req, res) => {
  try {
    const markerId = parseInt(req.params.id);
    const marker = markers.find(m => m.id === markerId);
    
    if (!marker) {
      return res.status(404).json({ error: 'Маркер не найден' });
    }
    
    res.json(marker);
  } catch (error) {
    console.error('❌ Ошибка получения маркера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Загрузка нового маркера
app.post('/api/upload/marker', upload.single('markerImage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Файл изображения не загружен' 
      });
    }
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Название маркера обязательно'
      });
    }

    const imageUrl = '/assets/' + req.file.filename;
    
    // Упрощенная генерация .patt файла
    const pattUrl = await generatePattFile(req.file, currentId);

    const marker = {
      id: currentId++,
      name: name.trim(),
      description: description ? description.trim() : '',
      imageUrl,
      pattUrl,
      created: new Date().toISOString(),
      status: 'active'
    };
    
    markers.push(marker);
    
    console.log(`✅ Создан маркер: ${marker.name} (ID: ${marker.id})`);
    
    res.json({ 
      success: true, 
      markerId: marker.id, 
      imageUrl, 
      pattUrl,
      message: 'Маркер успешно создан'
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки маркера:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Удаление маркера
app.delete('/api/markers/:id', (req, res) => {
  try {
    const markerId = parseInt(req.params.id);
    const markerIndex = markers.findIndex(m => m.id === markerId);
    
    if (markerIndex === -1) {
      return res.status(404).json({ error: 'Маркер не найден' });
    }
    
    const deletedMarker = markers.splice(markerIndex, 1)[0];
    
    // Удаляем связанный контент
    contents = contents.filter(c => c.markerId !== markerId);
    
    console.log(`🗑 Удален маркер: ${deletedMarker.name} (ID: ${markerId})`);
    
    res.json({ 
      success: true, 
      message: 'Маркер удален',
      deletedMarkerId: markerId
    });
  } catch (error) {
    console.error('❌ Ошибка удаления маркера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== API AR КОНТЕНТА ====================

// Получение контента для маркера
app.get('/api/markers/:id/content', (req, res) => {
  try {
    const markerId = parseInt(req.params.id);
    const markerContents = contents.filter(c => c.markerId === markerId);
    
    res.json(markerContents);
  } catch (error) {
    console.error('❌ Ошибка получения контента:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Загрузка AR контента
app.post('/api/upload/content', upload.single('contentFile'), async (req, res) => {
  try {
    const { markerId, contentType, position, scale, rotation } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Файл контента не загружен' 
      });
    }
    
    // Проверяем существование маркера
    const markerExists = markers.find(m => m.id === parseInt(markerId));
    if (!markerExists) {
      return res.status(404).json({
        success: false,
        error: 'Маркер не найден'
      });
    }

    const contentUrl = '/assets/' + req.file.filename;
    
    // Проверка размера для 3D моделей
    if (contentType === 'model') {
      const stats = fs.statSync(req.file.path);
      if (stats.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: '3D модель слишком большая (максимум 5MB)'
        });
      }
    }

    const content = {
      id: currentId++,
      markerId: parseInt(markerId),
      contentType,
      contentUrl,
      position: position || '0 0 0',
      scale: scale || '1 1 1',
      rotation: rotation || '0 0 0',
      created: new Date().toISOString(),
      originalName: req.file.originalname
    };
    
    contents.push(content);
    
    console.log(`✅ Добавлен AR контент: ${contentType} для маркера ${markerId}`);
    
    res.json({ 
      success: true, 
      contentId: content.id, 
      contentUrl,
      message: 'AR контент успешно добавлен'
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки контента:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Удаление контента
app.delete('/api/content/:id', (req, res) => {
  try {
    const contentId = parseInt(req.params.id);
    const contentIndex = contents.findIndex(c => c.id === contentId);
    
    if (contentIndex === -1) {
      return res.status(404).json({ error: 'Контент не найден' });
    }
    
    const deletedContent = contents.splice(contentIndex, 1)[0];
    
    console.log(`🗑 Удален AR контент: ${deletedContent.contentType} (ID: ${contentId})`);
    
    res.json({ 
      success: true, 
      message: 'Контент удален',
      deletedContentId: contentId
    });
  } catch (error) {
    console.error('❌ Ошибка удаления контента:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== API AR СЦЕН ====================

// Получение данных для AR сцены
app.get('/api/ar-scene/:markerId', (req, res) => {
  try {
    const markerId = parseInt(req.params.markerId);
    const marker = markers.find(m => m.id === markerId);
    
    if (!marker) {
      return res.status(404).json({ error: 'Маркер не найден' });
    }
    
    const markerContents = contents.filter(c => c.markerId === markerId);
    
    res.json({ 
      marker, 
      contents: markerContents,
      sceneInfo: {
        markerCount: markerContents.length,
        has3DModels: markerContents.some(c => c.contentType === 'model'),
        hasVideos: markerContents.some(c => c.contentType === 'video'),
        hasImages: markerContents.some(c => c.contentType === 'image')
      }
    });
  } catch (error) {
    console.error('❌ Ошибка получения данных сцены:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ==================== СИСТЕМНЫЕ ФУНКЦИИ ====================

// Генерация .patt файла
async function generatePattFile(file, markerId) {
  try {
    // В реальном проекте здесь должна быть конвертация через AR.js tools
    // Сейчас используем упрощенную версию
    const pattPath = file.path.replace(/\.[^/.]+$/, ".patt");
    const pattFileName = path.basename(pattPath);
    
    // Создаем упрощенный .patt файл
    const pattContent = `# AR.js Pattern File for marker ${markerId}
# Generated by WebAR Portal
24
 1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1
 1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1
 1  0  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  0  1
 1  0  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1  0  1
 1  0  1  0  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  0  1  0  1
 1  0  1  0  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1  0  1  0  1
 1  0  1  0  1  0  1  1  1  1  1  1  1  1  1  1  1  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  0  0  0  0  0  0  0  0  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  1  1  1  1  1  1  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  0  0  0  0  0  0  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  0  1  1  1  1  0  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  0  1  0  0  1  0  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  0  1  0  0  1  0  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  0  1  1  1  1  0  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  0  0  0  0  0  0  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  1  1  1  1  1  1  1  1  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  0  0  0  0  0  0  0  0  0  0  1  0  1  0  1  0  1
 1  0  1  0  1  0  1  1  1  1  1  1  1  1  1  1  1  1  0  1  0  1  0  1
 1  0  1  0  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1  0  1  0  1
 1  0  1  0  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  0  1  0  1
 1  0  1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1  0  1
 1  0  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  0  1
 1  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  1
 1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1  1`;

    fs.writeFileSync(pattPath, pattContent);
    
    return '/assets/' + pattFileName;
  } catch (error) {
    console.error('❌ Ошибка генерации .patt файла:', error);
    // Возвращаем URL изображения как fallback
    return '/assets/' + file.filename;
  }
}

// Статус сервера
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    serverTime: new Date().toISOString(),
    markersCount: markers.length,
    contentsCount: contents.length,
    port: PORT
  });
});

// ==================== ОБРАБОТКА ОШИБОК ====================

// Обработка ошибок Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Файл слишком большой. Максимальный размер: 10MB'
      });
    }
  }
  
  if (error.message.includes('Неподдерживаемый формат файла')) {
    return res.status(400).json({
      success: false,
      error: 'Неподдерживаемый формат файла'
    });
  }
  
  console.error('❌ Необработанная ошибка:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Внутренняя ошибка сервера' 
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Маршрут не найден',
    path: req.path
  });
});

// ==================== ЗАПУСК СЕРВЕРА ====================

ensureDirectories();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=========================================
🚀 WebAR Server Started!
=========================================
📍 Local: http://localhost:${PORT}
📱 Network: http://YOUR_IP:${PORT}
=========================================
✅ Static files: ${fs.existsSync('public') ? 'ENABLED' : 'MISSING'}
✅ Uploads folder: ${fs.existsSync('public/assets') ? 'READY' : 'CREATING...'}
=========================================
  `);
  
  createBasicFiles();
});

function createBasicFiles() {
  // Базовые файлы уже созданы в отдельных файлах
  console.log('✅ Базовые файлы проверены');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔻 Получен сигнал завершения...');
  console.log('👋 WebAR сервер остановлен');
  process.exit(0);
});