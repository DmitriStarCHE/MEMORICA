const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Убедимся что папки существуют
const ensureDirectories = () => {
  const directories = ['public', 'public/assets'];
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
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
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== МАРШРУТЫ ====================

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
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
    console.error('Error getting markers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение конкретного маркера
app.get('/api/markers/:id', (req, res) => {
  try {
    const markerId = parseInt(req.params.id);
    const marker = markers.find(m => m.id === markerId);
    
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }
    
    res.json(marker);
  } catch (error) {
    console.error('Error getting marker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Загрузка нового маркера
app.post('/api/upload/marker', upload.single('markerImage'), (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const imageUrl = '/assets/' + req.file.filename;
    const pattUrl = imageUrl; // Упрощенная версия

    const marker = {
      id: currentId++,
      name: name || 'New Marker',
      description: description || '',
      imageUrl,
      pattUrl,
      created: new Date().toISOString()
    };
    
    markers.push(marker);
    
    res.json({ 
      success: true, 
      markerId: marker.id, 
      imageUrl, 
      pattUrl 
    });
  } catch (error) {
    console.error('Error uploading marker:', error);
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
      return res.status(404).json({ error: 'Marker not found' });
    }
    
    const deletedMarker = markers.splice(markerIndex, 1)[0];
    
    // Удаляем связанный контент
    contents = contents.filter(c => c.markerId !== markerId);
    
    res.json({ 
      success: true, 
      message: 'Marker deleted',
      deletedMarkerId: markerId
    });
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('Error getting content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Загрузка AR контента
app.post('/api/upload/content', upload.single('contentFile'), (req, res) => {
  try {
    const { markerId, contentType, position, scale, rotation } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No content file uploaded' 
      });
    }
    
    // Проверяем существование маркера
    const markerExists = markers.find(m => m.id === parseInt(markerId));
    if (!markerExists) {
      return res.status(404).json({
        success: false,
        error: 'Marker not found'
      });
    }

    const contentUrl = '/assets/' + req.file.filename;

    const content = {
      id: currentId++,
      markerId: parseInt(markerId),
      contentType: contentType || 'image',
      contentUrl,
      position: position || '0 0 0',
      scale: scale || '1 1 1',
      rotation: rotation || '0 0 0',
      created: new Date().toISOString(),
      originalName: req.file.originalname
    };
    
    contents.push(content);
    
    res.json({ 
      success: true, 
      contentId: content.id, 
      contentUrl,
      message: 'AR content successfully added'
    });
  } catch (error) {
    console.error('Error uploading content:', error);
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
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const deletedContent = contents.splice(contentIndex, 1)[0];
    
    res.json({ 
      success: true, 
      message: 'Content deleted',
      deletedContentId: contentId
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== API AR СЦЕН ====================

// Получение данных для AR сцены
app.get('/api/ar-scene/:markerId', (req, res) => {
  try {
    const markerId = parseInt(req.params.markerId);
    const marker = markers.find(m => m.id === markerId);
    
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }
    
    const markerContents = contents.filter(c => c.markerId === markerId);
    
    res.json({ 
      marker, 
      contents: markerContents
    });
  } catch (error) {
    console.error('Error getting AR scene:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== СИСТЕМНЫЕ МАРШРУТЫ ====================

// Health check для Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    markers: markers.length,
    contents: contents.length
  });
});

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

// Обработка 404 для API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Обработка 404 для остальных маршрутов
app.use('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ 
      error: 'Endpoint not found',
      path: req.url
    });
  } else {
    // Для не-API маршрутов возвращаем основную страницу
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Инициализация
ensureDirectories();

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 WebAR Server started on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Production: Ready for use`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
});

module.exports = app;