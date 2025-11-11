const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Объявляем PORT только ОДИН РАЗ здесь
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
  res.json(markers);
});

// Загрузка нового маркера
app.post('/api/upload/marker', upload.single('markerImage'), (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Файл изображения не загружен' 
      });
    }

    const imageUrl = '/assets/' + req.file.filename;
    const pattUrl = imageUrl; // Упрощенная версия

    const marker = {
      id: currentId++,
      name: name || 'Новый маркер',
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
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Получение данных для AR сцены
app.get('/api/ar-scene/:markerId', (req, res) => {
  const markerId = parseInt(req.params.markerId);
  const marker = markers.find(m => m.id === markerId);
  
  if (!marker) {
    return res.status(404).json({ error: 'Маркер не найден' });
  }
  
  const markerContents = contents.filter(c => c.markerId === markerId);
  res.json({ marker, contents: markerContents });
});

// Health check для Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    markers: markers.length,
    contents: contents.length
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    serverTime: new Date().toISOString(),
    markersCount: markers.length,
    contentsCount: contents.length,
    port: PORT
  });
});

// Инициализация
ensureDirectories();

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 WebAR Server started on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Ready for production!`);
});

module.exports = app;