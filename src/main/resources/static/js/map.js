document.addEventListener('DOMContentLoaded', () => {
    // Mock 데이터 (cameradata.js에서 실제 데이터 로드)
    const cameras = window.cameraData || [];

    const markerContainer = document.getElementById('markerContainer');
    const cameraList = document.getElementById('cameraList');
    const infoPanel = document.getElementById('infoPanel');
    const infoPanelClose = document.getElementById('infoPanelClose');
    const listSummary = document.getElementById('listSummary');
    const filterButtons = document.querySelector('.filter-buttons');

    let activeCameraId = null;

    function getStatusInfo(status) {
        switch (status) {
            case 'danger': return { className: 'danger', text: '위험' };
            case 'warning': return { className: 'warning', text: '주의' };
            case 'normal': return { className: 'normal', text: '정상' };
            default: return { className: 'normal', text: '정상' };
        }
    }

    function renderMarkers(filteredCameras) {
        markerContainer.innerHTML = '';
        filteredCameras.forEach(camera => {
            const statusInfo = getStatusInfo(camera.status);
            const marker = document.createElement('div');
            marker.className = `cctv-marker cctv-marker--${statusInfo.className}`;
            marker.style.left = `${camera.coords.x}%`;
            marker.style.top = `${camera.coords.y}%`;
            marker.dataset.cameraId = camera.id;
            marker.title = camera.name;
            markerContainer.appendChild(marker);
        });
    }

    function renderList(filteredCameras) {
        cameraList.innerHTML = '';
        filteredCameras.forEach(camera => {
            const statusInfo = getStatusInfo(camera.status);
            const item = document.createElement('li');
            item.className = 'camera-list-item';
            item.dataset.cameraId = camera.id;
            item.innerHTML = `
                <span class="camera-list-item__status-dot cctv-marker--${statusInfo.className}"></span>
                <span class="camera-list-item__name">${camera.name}</span>
                <span class="chip chip--${statusInfo.className}">${statusInfo.text}</span>
            `;
            cameraList.appendChild(item);
        });
        listSummary.textContent = `총 ${filteredCameras.length}대`;
    }

    function showInfoPanel(camera) {
        document.getElementById('infoPanelName').textContent = camera.name;
        document.getElementById('infoPanelLocation').textContent = camera.location;
        document.getElementById('infoPanelCongestion').textContent = `${camera.congestion}%`;
        
        const statusInfo = getStatusInfo(camera.status);
        const chip = document.getElementById('infoPanelChip');
        chip.className = `chip chip--${statusInfo.className}`;
        chip.textContent = statusInfo.text;

        document.getElementById('infoPanelImage').src = camera.thumbnail;
        document.getElementById('infoPanelLink').href = `/analysis?id=${camera.id}`;

        infoPanel.hidden = false;
    }

    function updateActiveState(cameraId) {
        activeCameraId = cameraId;

        // 마커 활성 상태 업데이트
        document.querySelectorAll('.cctv-marker').forEach(m => {
            m.classList.toggle('is-active', m.dataset.cameraId == cameraId);
        });

        // 목록 활성 상태 업데이트
        document.querySelectorAll('.camera-list-item').forEach(item => {
            item.classList.toggle('is-active', item.dataset.cameraId == cameraId);
        });
    }

    function handleCameraSelection(cameraId) {
        const camera = cameras.find(c => c.id == cameraId);
        if (camera) {
            showInfoPanel(camera);
            updateActiveState(cameraId);
        }
    }

    function filterAndRender(filter) {
        const filteredCameras = filter === 'all' ? cameras : cameras.filter(c => c.status === filter);
        renderMarkers(filteredCameras);
        renderList(filteredCameras);
    }

    // 이벤트 리스너 설정
    markerContainer.addEventListener('click', (e) => {
        const marker = e.target.closest('.cctv-marker');
        if (marker) {
            handleCameraSelection(marker.dataset.cameraId);
        }
    });

    cameraList.addEventListener('click', (e) => {
        const item = e.target.closest('.camera-list-item');
        if (item) {
            handleCameraSelection(item.dataset.cameraId);
        }
    });

    infoPanelClose.addEventListener('click', () => {
        infoPanel.hidden = true;
        updateActiveState(null);
    });

    filterButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.filter-btn');
        if (button) {
            filterButtons.querySelector('.is-active').classList.remove('is-active');
            button.classList.add('is-active');
            filterAndRender(button.dataset.filter);
        }
    });

    // 초기 렌더링
    filterAndRender('all');
});
