const LEVEL_CLASS_MAP = {
    DANGER: 'danger',
    WARNING: 'warning',
    INFO: 'info',
};

document.addEventListener('DOMContentLoaded', () => {
    const cameras = Array.isArray(window.cameraData) ? window.cameraData : [];

    const alertsTableBody = document.querySelector('#alertsTable tbody');
    const paginationContainer = document.getElementById('pagination');
    const cameraFilter = document.getElementById('cameraFilter');
    const levelFilter = document.getElementById('levelFilter');
    const searchFilter = document.getElementById('searchFilter');
    const dateRangeInput = document.getElementById('dateRange');

    const state = {
        page: 1,
        size: 15,
        totalPages: 1,
        sortColumn: 'timestamp',
        sortDirection: 'desc',
        level: 'all',
        cameraId: 'all',
        search: '',
        dateRange: { start: null, end: null },
        loading: false,
    };

    populateCameraFilter();
    attachEventHandlers();
    initializeDatePicker();
    fetchAndRenderAlerts();

    function populateCameraFilter() {
        cameras.forEach((camera) => {
            const option = document.createElement('option');
            option.value = camera.id;
            option.textContent = camera.name;
            cameraFilter.appendChild(option);
        });
    }

    function attachEventHandlers() {
        [levelFilter, cameraFilter].forEach((element) => {
            element.addEventListener('change', () => {
                state.level = levelFilter.value;
                state.cameraId = cameraFilter.value;
                state.page = 1;
                fetchAndRenderAlerts();
            });
        });

        searchFilter.addEventListener('input', debounce(() => {
            state.search = searchFilter.value.trim();
            state.page = 1;
            fetchAndRenderAlerts();
        }, 300));

        document.querySelector('#alertsTable thead').addEventListener('click', (event) => {
            const header = event.target.closest('th');
            if (!header || !header.dataset.sort) {
                return;
            }
            const newSortColumn = header.dataset.sort;
            if (state.sortColumn === newSortColumn) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortColumn = newSortColumn;
                state.sortDirection = 'desc';
            }
            state.page = 1;
            fetchAndRenderAlerts();
        });

        paginationContainer.addEventListener('click', (event) => {
            if (event.target.tagName !== 'BUTTON' || event.target.disabled) {
                return;
            }
            const page = Number(event.target.dataset.page);
            if (!Number.isNaN(page) && page !== state.page) {
                state.page = page;
                fetchAndRenderAlerts();
            }
        });
    }

    function initializeDatePicker() {
        flatpickr(dateRangeInput, {
            mode: 'range',
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'Y년 m월 d일',
            locale: flatpickr.l10ns.ko,
            onChange: (selectedDates) => {
                if (selectedDates.length === 2) {
                    state.dateRange.start = new Date(selectedDates[0].setHours(0, 0, 0, 0));
                    state.dateRange.end = new Date(selectedDates[1].setHours(23, 59, 59, 999));
                } else {
                    state.dateRange.start = null;
                    state.dateRange.end = null;
                }
                state.page = 1;
                fetchAndRenderAlerts();
            },
        });
    }

    async function fetchAndRenderAlerts() {
        if (state.loading) {
            return;
        }
        state.loading = true;
        renderLoadingRow();

        try {
            const params = new URLSearchParams();
            params.set('page', state.page - 1);
            params.set('size', state.size);
            params.set('sort', `${state.sortColumn},${state.sortDirection}`);
            if (state.level && state.level !== 'all') {
                params.set('level', state.level);
            }
            if (state.cameraId && state.cameraId !== 'all') {
                params.set('cameraId', state.cameraId);
            }
            if (state.search) {
                params.set('search', state.search);
            }
            if (state.dateRange.start) {
                params.set('start', state.dateRange.start.toISOString());
            }
            if (state.dateRange.end) {
                params.set('end', state.dateRange.end.toISOString());
            }

            const response = await fetch(`/api/v1/alerts/history?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch alerts: ${response.status}`);
            }

            const data = await response.json();
            state.totalPages = data.totalPages ?? 1;
            renderTable(data.content ?? []);
            renderPagination(state.totalPages, (data.page ?? 0) + 1);
        } catch (error) {
            console.error(error);
            renderErrorRow();
        } finally {
            state.loading = false;
        }
    }

    function renderTable(alerts) {
        alertsTableBody.innerHTML = '';
        if (!alerts.length) {
            alertsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">표시할 알림이 없습니다.</td></tr>';
            return;
        }

        alerts.forEach((alert) => {
            const tone = alert.severityTone || LEVEL_CLASS_MAP[alert.severity] || 'info';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatTimestamp(alert.timestamp)}</td>
                <td>${alert.cameraName || '-'}</td>
                <td>${alert.cameraLocation || '-'}</td>
                <td>${alert.title || '-'}</td>
                <td>${alert.message || '-'}</td>
                <td><span class="level-chip level-chip--${tone}">${alert.severityLabel || alert.severity || '-'}</span></td>
            `;
            alertsTableBody.appendChild(row);
        });
    }

    function renderPagination(totalPages, currentPageFromServer) {
        paginationContainer.innerHTML = '';
        const total = Math.max(totalPages, 1);
        const current = Math.min(Math.max(currentPageFromServer, 1), total);
        state.page = current;

        if (total <= 1) {
            return;
        }

        const createButton = (label, page, disabled = false, active = false) => {
            const button = document.createElement('button');
            button.textContent = label;
            button.dataset.page = page;
            button.disabled = disabled;
            if (active) {
                button.classList.add('is-active');
            }
            return button;
        };

        paginationContainer.appendChild(createButton('이전', current - 1, current === 1));

        for (let page = 1; page <= total; page += 1) {
            paginationContainer.appendChild(createButton(String(page), page, false, page === current));
        }

        paginationContainer.appendChild(createButton('다음', current + 1, current === total));
    }

    function renderLoadingRow() {
        alertsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">데이터를 불러오는 중...</td></tr>';
    }

    function renderErrorRow() {
        alertsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#b91c1c;">알림 데이터를 불러오는 중 오류가 발생했습니다.</td></tr>';
    }
});

function formatTimestamp(value) {
    if (!value) {
        return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString('ko-KR', { hour12: false });
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

