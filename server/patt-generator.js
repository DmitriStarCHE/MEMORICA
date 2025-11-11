const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class PattGenerator {
    constructor() {
        this.validator = new MarkerValidator();
    }

    /**
     * Генерирует .patt файл из изображения маркера
     */
    async generatePattFile(imagePath, markerId) {
        try {
            // 1. Валидация изображения
            const validation = await this.validator.validateImage(imagePath);
            if (!validation.valid) {
                throw new Error(`Изображение не подходит для маркера: ${validation.message}`);
            }

            // 2. Оптимизация изображения для AR.js
            const optimizedPath = await this.optimizeImage(imagePath, markerId);
            
            // 3. Создание .patt файла
            const pattPath = await this.createPattDescriptor(optimizedPath, markerId);
            
            return pattPath;

        } catch (error) {
            console.error('Ошибка генерации .patt файла:', error);
            throw error;
        }
    }

    /**
     * Оптимизирует изображение для лучшего распознавания
     */
    async optimizeImage(imagePath, markerId) {
        const outputPath = path.join('public/assets', `marker-${markerId}-optimized.png`);
        
        await sharp(imagePath)
            .grayscale() // Конвертация в градации серого
            .normalize() // Улучшение контраста
            .resize(512, 512) // Стандартный размер для маркеров
            .png()
            .toFile(outputPath);

        return outputPath;
    }

    /**
     * Создает .patt файл (упрощенная версия)
     * В реальном проекте используйте AR.js Marker Training
     */
    async createPattDescriptor(imagePath, markerId) {
        const pattPath = path.join('public/assets', `marker-${markerId}.patt`);
        
        // Упрощенное создание .patt файла
        // В реальности здесь должен быть сложный алгоритм анализа изображения
        const pattContent = this.generateSimplifiedPattContent();
        
        fs.writeFileSync(pattPath, pattContent);
        return `/assets/marker-${markerId}.patt`;
    }

    /**
     * Генерирует упрощенное содержимое .patt файла
     */
    generateSimplifiedPattContent() {
        // Это очень упрощенная версия!
        // В реальном проекте используйте:
        // 1. AR.js Marker Training tool (https://jeromeetienne.github.io/AR.js/three.js/examples/marker-training/examples/generator.html)
        // 2. Или серверную реализацию на C++/Python
        return `# Simplified PATT file - replace with real generation
# For real projects, use AR.js Marker Training
24
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0
 0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0`;
    }
}

class MarkerValidator {
    /**
     * Проверяет, подходит ли изображение для использования как маркер
     */
    async validateImage(imagePath) {
        const metadata = await sharp(imagePath).metadata();
        
        const issues = [];
        
        // Проверка размера
        if (metadata.width < 256 || metadata.height < 256) {
            issues.push('Изображение слишком маленькое (мин. 256x256)');
        }
        
        // Проверка соотношения сторон
        if (metadata.width !== metadata.height) {
            issues.push('Изображение должно быть квадратным');
        }
        
        // Проверка формата
        if (!['jpeg', 'png', 'jpg'].includes(metadata.format)) {
            issues.push('Поддерживаются только JPEG и PNG форматы');
        }
        
        return {
            valid: issues.length === 0,
            message: issues.join(', '),
            metadata: metadata
        };
    }
}

module.exports = PattGenerator;