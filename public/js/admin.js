class WebARAdmin {
    constructor() {
        this.markers = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadMarkers();
        this.populateMarkerSelects();
    }

    setupEventListeners() {
        // Переключение вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Форма загрузки маркера
        document.getElementById('markerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadMarker();
        });

        // Форма загрузки контента
        document.getElementById('contentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadContent();
        });

        // Кнопка предпросмотра
        document.getElementById('startPreview').addEventListener('click', () => {
            this.startPreview();
        });
    }

    switchTab(tabName) {
        // Деактивируем все кнопки и контент
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Активируем выбранные
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    async loadMarkers() {
        try {
            const response = await fetch('/api/markers');
            this.markers = await response.json();
            this.renderMarkers();
        } catch (error) {
            console.error('Ошибка загрузки маркеров:', error);
        }
    }

    renderMarkers() {
        const grid = document.getElementById('markersGrid');
        grid.innerHTML = '';

        this.markers.forEach(marker => {
            const card = document.createElement('div');
            card.className = 'marker-card';
            card.innerHTML = `
                <img src="${marker.imageUrl}" alt="${marker.name}">
                <div class="marker-info">
                    <h3>${marker.name}</h3>
                    <p>${marker.description || 'Без описания'}</p>
                    <div class="marker-actions">
                        <button class="btn-secondary" onclick="admin.viewMarker(${marker.id})">Просмотр</button>
                        <button class="btn-danger" onclick="admin.deleteMarker(${marker.id})">Удалить</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    populateMarkerSelects() {
        const selects = document.querySelectorAll('select[id$="Marker"]');
        
        selects.forEach(select => {
            select.innerHTML = '<option value="">Выберите маркер</option>';
            this.markers.forEach(marker => {
                const option = document.createElement('option');
                option.value = marker.id;
                option.textContent = marker.name;
                select.appendChild(option);
            });
        });
    }

    async uploadMarker() {
        const formData = new FormData();
        formData.append('name', document.getElementById('markerName').value);
        formData.append('description', document.getElementById('markerDescription').value);
        formData.append('markerImage', document.getElementById('markerImage').files[0]);

        try {
            const response = await fetch('/api/upload/marker', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Маркер успешно загружен!');
                document.getElementById('markerForm').reset();
                await this.loadMarkers();
                this.populateMarkerSelects();
            } else {
                alert('Ошибка: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            alert('Ошибка загрузки маркера');
        }
    }

    async uploadContent() {
        const formData = new FormData();
        formData.append('markerId', document.getElementById('contentMarker').value);
        formData.append('contentType', document.getElementById('contentType').value);
        formData.append('contentFile', document.getElementById('contentFile').files[0]);
        formData.append('position', document.getElementById('contentPosition').value);
        formData.append('scale', document.getElementById('contentScale').value);
        formData.append('rotation', document.getElementById('contentRotation').value);

        try {
            const response = await fetch('/api/upload/content', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Контент успешно добавлен!');
                document.getElementById('contentForm').reset();
            } else {
                alert('Ошибка: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            alert('Ошибка загрузки контента');
        }
    }

    startPreview() {
        const markerId = document.getElementById('previewMarker').value;
        if (!markerId) {
            alert('Выберите маркер для просмотра');
            return;
        }

        window.open(`/ar-viewer.html?marker=${markerId}`, '_blank');
    }

    viewMarker(markerId) {
        window.open(`/ar-viewer.html?marker=${markerId}`, '_blank');
    }

    async deleteMarker(markerId) {
        if (!confirm('Удалить этот маркер?')) return;
        
        // Здесь должна быть реализация удаления
        console.log('Удаление маркера:', markerId);
    }
}

// Инициализация при загрузке страницы
const admin = new WebARAdmin();