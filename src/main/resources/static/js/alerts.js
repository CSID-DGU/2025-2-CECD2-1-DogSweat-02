document.addEventListener('DOMContentLoaded', () => {
    // cameradata.js에서 카메라 정보 로드
    const cameras = window.cameraData || [];

    // 알림 이력 목업 데이터 생성
    const mockAlerts = generateMockAlerts(cameras, 200);

    const alertsTableBody = document.querySelector('#alertsTable tbody');
    const paginationContainer = document.getElementById('pagination');
    const cameraFilter = document.getElementById('cameraFilter');

    const levelFilter = document.getElementById('levelFilter');
    const searchFilter = document.getElementById('searchFilter');

    let currentPage = 1;
    const itemsPerPage = 15;
    let sortColumn = 'timestamp';
    let sortDirection = 'desc';
    let dateRange = { start: null, end: null };

    // 카메라 필터 옵션 채우기
    function populateCameraFilter() {
        cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.id;
            option.textContent = camera.name;
            cameraFilter.appendChild(option);
        });
    }

    function renderTable(alerts) {
        alertsTableBody.innerHTML = '';
        if (alerts.length === 0) {
            alertsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">표시할 알림이 없습니다.</td></tr>`;
            return;
        }

        alerts.forEach(alert => {
            const levelInfo = {
                danger: { className: 'danger', text: '위험' },
                warning: { className: 'warning', text: '주의' },
            }[alert.level];

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(alert.timestamp).toLocaleString()}</td>
                <td>${alert.cameraName}</td>
                <td>${alert.location}</td>
                <td>${alert.type}</td>
                <td>${alert.details}</td>
                <td><span class="level-chip level-chip--${levelInfo.className}">${levelInfo.text}</span></td>
            `;
            alertsTableBody.appendChild(row);
        });
    }

    function renderPagination(totalItems) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return;

        const createButton = (text, page, isDisabled = false, isActive = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.dataset.page = page;
            button.disabled = isDisabled;
            if (isActive) button.classList.add('is-active');
            return button;
        };

        paginationContainer.appendChild(createButton('이전', currentPage - 1, currentPage === 1));

        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.appendChild(createButton(i, i, false, i === currentPage));
        }

        paginationContainer.appendChild(createButton('다음', currentPage + 1, currentPage === totalPages));
    }

    function updateView() {
        // 1. 필터링
        let filteredAlerts = mockAlerts.filter(alert => {
            const alertDate = new Date(alert.timestamp);
            const dateMatch = (!dateRange.start || alertDate >= dateRange.start) && 
                              (!dateRange.end || alertDate <= dateRange.end);

            const levelMatch = levelFilter.value === 'all' || alert.level === levelFilter.value;
            const cameraMatch = cameraFilter.value === 'all' || alert.cameraId == cameraFilter.value;
            const searchMatch = !searchFilter.value || 
                                alert.cameraName.includes(searchFilter.value) || 
                                alert.location.includes(searchFilter.value) ||
                                alert.details.includes(searchFilter.value);
            return dateMatch && levelMatch && cameraMatch && searchMatch;
        });

        // 2. 정렬
        filteredAlerts.sort((a, b) => {
            let valA = a[sortColumn];
            let valB = b[sortColumn];
            if (sortColumn === 'timestamp') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }
            
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // 3. 페이지네이션
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage);

        // 4. 렌더링
        renderTable(paginatedAlerts);
        renderPagination(filteredAlerts.length);
    }

    // 이벤트 리스너
    [levelFilter, cameraFilter, searchFilter].forEach(el => {
        el.addEventListener('change', () => {
            currentPage = 1;
            updateView();
        });
    });
    searchFilter.addEventListener('keyup', () => {
        currentPage = 1;
        updateView();
    });

    paginationContainer.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
            currentPage = parseInt(e.target.dataset.page);
            updateView();
        }
    });

    document.querySelector('#alertsTable thead').addEventListener('click', e => {
        const th = e.target.closest('th');
        if (th && th.dataset.sort) {
            const newSortColumn = th.dataset.sort;
            if (sortColumn === newSortColumn) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = newSortColumn;
                sortDirection = 'desc';
            }
            updateView();
        }
    });

    // 초기화
    populateCameraFilter();
    updateView();

    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "Y년 m월 d일",
        locale: "ko", // 한글 지원
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                dateRange.start = selectedDates[0];
                dateRange.end = selectedDates[1];
                // 시간까지 포함하여 정확한 범위 설정
                dateRange.start.setHours(0, 0, 0, 0);
                dateRange.end.setHours(23, 59, 59, 999);
            } else {
                dateRange.start = null;
                dateRange.end = null;
            }
            currentPage = 1;
            updateView();
        }
    });
});

// 목업 데이터 생성 함수
function generateMockAlerts(cameras, count) {
    const alerts = [];
    const alertTypes = ['밀집도 임계값 초과', '변화율 급증', '이상 패턴 감지', '위험 상태 지속'];
    const levels = ['danger', 'warning'];

    for (let i = 0; i < count; i++) {
        const camera = cameras[Math.floor(Math.random() * cameras.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];
        const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(); // 최근 30일

        alerts.push({
            id: i + 1,
            timestamp,
            cameraId: camera.id,
            cameraName: camera.name,
            location: camera.location,
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
            level,
            details: `혼잡도 ${Math.floor(Math.random() * 50 + 50)}%`
        });
    }
    return alerts;
}
