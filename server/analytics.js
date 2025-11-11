const fs = require('fs');
const path = require('path');

class Analytics {
    constructor() {
        this.analyticsFile = path.join(__dirname, 'analytics.json');
        this.init();
    }

    init() {
        // Создаем файл аналитики если его нет
        if (!fs.existsSync(this.analyticsFile)) {
            fs.writeFileSync(this.analyticsFile, JSON.stringify({
                markerViews: {},
                userSessions: {},
                errors: [],
                dailyStats: {}
            }, null, 2));
        }
    }

    /**
     * Логирование просмотра маркера
     */
    logMarkerView(markerId, userData) {
        const analytics = this.getAnalytics();
        
        const today = new Date().toISOString().split('T')[0];
        
        // Инициализация статистики маркера
        if (!analytics.markerViews[markerId]) {
            analytics.markerViews[markerId] = {
                totalViews: 0,
                dailyViews: {},
                userAgents: {},
                countries: {},
                lastViewed: null
            };
        }
        
        // Обновление статистики
        const marker = analytics.markerViews[markerId];
        marker.totalViews++;
        marker.dailyViews[today] = (marker.dailyViews[today] || 0) + 1;
        marker.lastViewed = new Date().toISOString();
        
        // Статистика по пользовательским агентам
        const browser = this.parseUserAgent(userData.userAgent);
        marker.userAgents[browser] = (marker.userAgents[browser] || 0) + 1;
        
        // Статистика по странам (если есть IP)
        if (userData.ip) {
            const country = this.getCountryFromIP(userData.ip);
            marker.countries[country] = (marker.countries[country] || 0) + 1;
        }
        
        // Общая дневная статистика
        if (!analytics.dailyStats[today]) {
            analytics.dailyStats[today] = {
                totalViews: 0,
                uniqueUsers: 0,
                markersUsed: new Set()
            };
        }
        
        analytics.dailyStats[today].totalViews++;
        analytics.dailyStats[today].markersUsed.add(markerId);
        
        this.saveAnalytics(analytics);
        
        console.log(`Маркер ${markerId} просмотрен. Всего просмотров: ${marker.totalViews}`);
    }

    /**
     * Логирование ошибок AR
     */
    logError(errorType, markerId, userData, errorDetails) {
        const analytics = this.getAnalytics();
        
        analytics.errors.push({
            timestamp: new Date().toISOString(),
            errorType,
            markerId,
            userAgent: userData.userAgent,
            errorDetails,
            ip: userData.ip
        });
        
        // Оставляем только последние 1000 ошибок
        if (analytics.errors.length > 1000) {
            analytics.errors = analytics.errors.slice(-1000);
        }
        
        this.saveAnalytics(analytics);
        
        console.error(`AR ошибка: ${errorType} для маркера ${markerId}`);
    }

    /**
     * Логирование сессии пользователя
     */
    logUserSession(sessionId, userData) {
        const analytics = this.getAnalytics();
        
        analytics.userSessions[sessionId] = {
            startTime: new Date().toISOString(),
            userAgent: userData.userAgent,
            ip: userData.ip,
            markersViewed: []
        };
        
        this.saveAnalytics(analytics);
    }

    /**
     * Получение статистики по маркеру
     */
    getMarkerStats(markerId) {
        const analytics = this.getAnalytics();
        return analytics.markerViews[markerId] || null;
    }

    /**
     * Получение общей статистики
     */
    getOverallStats() {
        const analytics = this.getAnalytics();
        const markers = Object.keys(analytics.markerViews);
        
        return {
            totalMarkers: markers.length,
            totalViews: markers.reduce((sum, id) => sum + analytics.markerViews[id].totalViews, 0),
            popularMarkers: markers
                .map(id => ({
                    id,
                    views: analytics.markerViews[id].totalViews
                }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 10),
            recentErrors: analytics.errors.slice(-10)
        };
    }

    // Вспомогательные методы
    getAnalytics() {
        return JSON.parse(fs.readFileSync(this.analyticsFile, 'utf8'));
    }

    saveAnalytics(data) {
        fs.writeFileSync(this.analyticsFile, JSON.stringify(data, null, 2));
    }

    parseUserAgent(userAgent) {
        // Простой парсинг User-Agent
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Mobile')) return 'Mobile Browser';
        return 'Other';
    }

    getCountryFromIP(ip) {
        // Упрощенная геолокация (в реальном проекте используйте сервис типа ipapi.co)
        return 'Unknown';
    }
}

module.exports = Analytics;