const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

function init() {
  db = new sqlite3.Database('webar.db');
  
  db.serialize(() => {
    // Таблица маркеров
    db.run(`CREATE TABLE IF NOT EXISTS markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      imageUrl TEXT NOT NULL,
      pattUrl TEXT NOT NULL,
      created DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Таблица AR контента
    db.run(`CREATE TABLE IF NOT EXISTS ar_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      markerId INTEGER,
      contentType TEXT NOT NULL,
      contentUrl TEXT NOT NULL,
      position TEXT DEFAULT '0 0 0',
      scale TEXT DEFAULT '1 1 1',
      rotation TEXT DEFAULT '0 0 0',
      FOREIGN KEY(markerId) REFERENCES markers(id)
    )`);
  });
}

function addMarker(marker) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO markers (name, description, imageUrl, pattUrl, created) 
                             VALUES (?, ?, ?, ?, ?)`);
    stmt.run([marker.name, marker.description, marker.imageUrl, marker.pattUrl, marker.created], 
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            });
    stmt.finalize();
  });
}

function addContent(content) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO ar_content (markerId, contentType, contentUrl, position, scale, rotation) 
                             VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run([content.markerId, content.contentType, content.contentUrl, 
              content.position, content.scale, content.rotation], 
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            });
    stmt.finalize();
  });
}

function getMarkers() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM markers ORDER BY created DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getSceneData(markerId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM markers WHERE id = ?`, [markerId], (err, marker) => {
      if (err) {
        reject(err);
        return;
      }
      
      db.all(`SELECT * FROM ar_content WHERE markerId = ?`, [markerId], (err, contents) => {
        if (err) reject(err);
        else resolve({ marker, contents });
      });
    });
  });
}

module.exports = { init, addMarker, addContent, getMarkers, getSceneData };