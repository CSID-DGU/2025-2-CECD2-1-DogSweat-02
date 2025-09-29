document.addEventListener('DOMContentLoaded', () => {
    const getEl = role => document.querySelector(`[data-role="${role}"]`);

    function getCameraIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') || 'cam-01';
    }

    function render(camera) {
        if (!camera) {
            document.body.innerHTML = '<h1>카메라 정보를 찾을 수 없습니다.</h1>';
            return;
        }

        // Render header
        getEl('camera-name').textContent = camera.name;
        getEl('camera-location').textContent = camera.location;
        const statusEl = getEl('camera-status');
        statusEl.textContent = camera.status.label;
        statusEl.className = `analysis-header__status analysis-header__status--${camera.status.tone}`;

        // Render video caption
        getEl('video-caption').textContent = camera.live.caption;

        // Render initial layers
        renderBboxLayer(camera.live.overlay);
        setupLayerControls();
        setupChartControls();
    }

    function renderBboxLayer(overlayData) {
        const bboxLayer = document.querySelector('[data-layer="bbox"]');
        bboxLayer.innerHTML = '';
        (overlayData || []).forEach(box => {
            const span = document.createElement('span');
            span.className = `bbox bbox--${box.type}`;
            span.style.setProperty('--x', box.x);
            span.style.setProperty('--y', box.y);
            span.style.setProperty('--w', box.w);
            span.style.setProperty('--h', box.h);
            span.textContent = box.text;
            bboxLayer.appendChild(span);
        });
    }

    function setupLayerControls() {
        const toggles = document.querySelectorAll('[data-layer-toggle]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const layerName = e.target.dataset.layerToggle;
                const layerEl = document.querySelector(`[data-layer="${layerName}"]`);
                if (layerEl) {
                    layerEl.style.display = e.target.checked ? '' : 'none';
                }
            });
        });
    }

    function setupChartControls() {
        const controls = getEl('chart-controls');
        const placeholder = getEl('chart-placeholder');
        controls.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                controls.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                const range = e.target.dataset.range;
                let text = '시계열 차트 영역';
                if (range === 'today') text += ' (오늘)';
                if (range === 'yesterday') text += ' (어제)';
                if (range === 'average') text += ' (주중 평균)';
                placeholder.textContent = text;
            }
        });
    }

    function init() {
        const camera = cameraDataMap.get(CAMERA_ID);
        render(camera);
    }

    init();
});
