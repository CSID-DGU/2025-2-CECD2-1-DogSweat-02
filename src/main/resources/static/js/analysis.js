const toneColors = {
    danger: '#ef4444',
    warning: '#f97316',
    neutral: '#2563eb'
};

const gaugeLength = 2 * Math.PI * 48; // circle circumference for gauge arcs

const formatDensity = (value) => (typeof value === 'number' ? value.toFixed(2) : '--');

const formatTimestamp = (value) => {
    if (!value) return '데이터 없음';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString('ko-KR', { hour12: false });
};

const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00:00';
    const s = Math.floor(seconds);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
};

const minutesFromSeconds = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    return Math.ceil(seconds / 60);
};

const toNumber = (value, fallback = 0) => (typeof value === 'number' && !Number.isNaN(value) ? value : fallback);

document.addEventListener('DOMContentLoaded', () => {
    const cameras = Array.isArray(window.analysisCameraData) ? window.analysisCameraData : [];
    const selectEl = document.querySelector('[data-role="camera-select"]');
    const nameEl = document.querySelector('[data-role="camera-name"]');
    const statusChip = document.querySelector('[data-role="camera-status"]');
    const locationEl = document.querySelector('[data-role="camera-location"]');
    const liveCaptionEl = document.querySelector('[data-role="live-caption"]');
    const chartCanvas = document.getElementById('interactiveTimeSeriesChart');
    const chartPlaceholder = document.getElementById('analysisChartPlaceholder');
    const statusTimestampEl = document.getElementById('statusTimestamp');
    const currentDensityEl = document.getElementById('currentCongestion');
    const durationEl = document.getElementById('duration');
    const rocEl = document.getElementById('roc');
    const accEl = document.getElementById('acc');
    const etaEl = document.getElementById('etaValue');
    const gaugeArc = document.getElementById('gaugeArc');
    const gaugeText = document.getElementById('gaugeText');
    const gradeEl = document.getElementById('grade');
    const riskArc = document.getElementById('riskArc');
    const riskText = document.getElementById('riskText');
    const riskGradeEl = document.getElementById('riskGrade');
    const factorCongestionValue = document.querySelector('#factorCongestion .factor-value');
    const factorCongestionStatus = document.querySelector('#factorCongestion .factor-status');
    const factorRocValue = document.querySelector('#factorRoc .factor-value');
    const factorRocStatus = document.querySelector('#factorRoc .factor-status');
    const factorDurationValue = document.querySelector('#factorDuration .factor-value');
    const factorAnomalyStatus = document.querySelector('#factorAnomaly .factor-status');
    const alertTableBody = document.querySelector('#alertTable tbody');
    const sparkSvg = document.getElementById('statusSpark');
    const sparkDelta = document.getElementById('sparkDelta');

    let trendChart = null;

    if (!cameras.length) {
        if (selectEl) {
            selectEl.disabled = true;
        }
        return;
    }

    populateSelect();
    renderCamera(Number(selectEl.value || cameras[0].cameraId));

    selectEl.addEventListener('change', (event) => {
        const nextId = Number(event.target.value);
        renderCamera(Number.isNaN(nextId) ? cameras[0].cameraId : nextId);
    });

    function populateSelect() {
        if (!selectEl) {
            return;
        }
        selectEl.innerHTML = '';
        cameras.forEach((camera, index) => {
            const option = document.createElement('option');
            option.value = camera.cameraId;
            option.textContent = `${camera.cameraName} (${camera.location || '위치 정보 없음'})`;

            if (index === 0) {
                option.selected = true;
            }
            selectEl.appendChild(option);
        });
    }

    function renderCamera(cameraId) {
        const camera = cameras.find((item) => item.cameraId === cameraId) || cameras[0];
        if (!camera) {
            return;
        }
        if (selectEl) {
            selectEl.value = camera.cameraId;
        }

        nameEl.textContent = camera.cameraName;
        locationEl.textContent = camera.location || '위치 정보 없음';
        statusChip.textContent = camera.congestionLabel;
        statusChip.className = `chip status-chip chip--${camera.statusTone || 'neutral'}`;
        liveCaptionEl.textContent = camera.latestTimestamp
            ? `마지막 분석 ${formatTimestamp(camera.latestTimestamp)}`
            : '분석 대기 중';

        updateStatusSummary(camera);
        updateChart(camera);
        updateAlerts(camera);
    }

    function updateStatusSummary(camera) {
        statusTimestampEl.textContent = formatTimestamp(camera.latestTimestamp);
        currentDensityEl.textContent = formatDensity(camera.latestDensity);
        durationEl.textContent = formatDuration(camera.timeInDangerSeconds);

        const velocity = toNumber(camera.densityVelocityPerMin, 0);
        const acceleration = toNumber(camera.densityAccelerationPerMin2, 0);
        rocEl.textContent = `${(velocity * 100).toFixed(2)}`;
        accEl.textContent = `${(acceleration * 100).toFixed(2)}`;

        if (etaEl) {\n            const etaMinutes = minutesFromSeconds(camera.etaSeconds);\n            if (etaMinutes && camera.etaType === 'ENTERING_DANGER') {\n                etaEl.textContent = 약 분 후 '위험' 진입 예상;\n            } else if (etaMinutes && camera.etaType === 'EXITING_DANGER') {\n                etaEl.textContent = 약 분 후 '주의' 복귀 예상;\n            } else if (camera.etaMessage) {\n                etaEl.textContent = camera.etaMessage;\n            } else {\n                etaEl.textContent = '추세 정보를 가져올 수 없습니다.';\n            }\n        }\n\n        const densityValue = toNumber(camera.latestDensity, 0);
        const toneColor = toneColors[camera.statusTone] || toneColors.neutral;
        applyArc(gaugeArc, densityValue, toneColor);
        gaugeText.textContent = `${Math.round(Math.min(Math.max(densityValue, 0), 1) * 100)}%`;
        gradeEl.textContent = camera.congestionLabel;

        applyArc(riskArc, densityValue, '#ef4444');
        riskText.textContent = `${Math.round(Math.min(Math.max(densityValue, 0), 1) * 100)}`;
        riskGradeEl.textContent = camera.congestionLabel;

        if (factorCongestionValue) {
            factorCongestionValue.textContent = `${Math.round(Math.min(Math.max(densityValue, 0), 1) * 100)}%`;
        }
        if (factorCongestionStatus) {
            factorCongestionStatus.textContent = camera.congestionLabel;
        }
        if (factorRocValue) {
            factorRocValue.textContent = `${(velocity * 100).toFixed(2)}%/분`;
        }
        if (factorRocStatus) {
            factorRocStatus.textContent = velocity >= 0 ? '증가' : '완화';
        }
        if (factorDurationValue) {
            factorDurationValue.textContent = formatDuration(camera.timeInDangerSeconds);
        }
        if (factorAnomalyStatus) {
            factorAnomalyStatus.textContent = '데이터 준비 중';
        }

        renderSpark(camera);
    }

    function applyArc(element, value, color) {
        if (!element) {
            return;
        }
        const normalized = Math.min(Math.max(value || 0, 0), 1);
        element.setAttribute('stroke-dasharray', `${normalized * gaugeLength} ${gaugeLength}`);
        element.style.stroke = color;
    }

    function updateChart(camera) {
        if (!chartCanvas || !Chart) {
            return;
        }
        const hasSeries = camera.hasData && Array.isArray(camera.densitySeries) && camera.densitySeries.length;
        if (!hasSeries) {
            if (trendChart) {
                trendChart.destroy();
                trendChart = null;
            }
            chartCanvas.style.display = 'none';
            if (chartPlaceholder) {
                chartPlaceholder.hidden = false;
            }
            return;
        }

        const labels = camera.densitySeries.map((point) => formatTimeLabel(point.timestamp));
        const values = camera.densitySeries.map((point) => toNumber(point.density, 0));
        chartCanvas.style.display = 'block';
        if (chartPlaceholder) {
            chartPlaceholder.hidden = true;
        }

        if (trendChart) {
            trendChart.data.labels = labels;
            trendChart.data.datasets[0].data = values;
            trendChart.update();
            return;
        }

        trendChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        data: values,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.08)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, suggestedMax: 1 },
                    x: { ticks: { autoSkip: true } }
                }
            }
        });
    }

    function updateAlerts(camera) {
        if (!alertTableBody) {
            return;
        }
        const alerts = Array.isArray(camera.stageAlerts) ? camera.stageAlerts : [];
        alertTableBody.innerHTML = '';
        if (!alerts.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = '표시할 경보가 없습니다.';
            row.appendChild(cell);
            alertTableBody.appendChild(row);
            return;
        }

        alerts.forEach((alert) => {
            const row = document.createElement('tr');
            const timeCell = document.createElement('td');
            timeCell.textContent = alert.timestamp ? formatTimestamp(alert.timestamp) : '-';
            const typeCell = document.createElement('td');
            typeCell.textContent = alert.title || '-';
            const messageCell = document.createElement('td');
            messageCell.textContent = alert.message || '-';
            row.append(timeCell, typeCell, messageCell);
            alertTableBody.appendChild(row);
        });
    }

    function renderSpark(camera) {
        if (!sparkSvg || !sparkDelta) {
            return;
        }
        const dataPoints = (camera.recentDensitySnapshots && camera.recentDensitySnapshots.length)
            ? camera.recentDensitySnapshots
            : camera.densitySeries;
        if (!Array.isArray(dataPoints) || !dataPoints.length) {
            sparkSvg.innerHTML = '';
            sparkDelta.textContent = '0p 변화';
            return;
        }
        const values = dataPoints.map((point) => toNumber(point.density, 0));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const width = 120;
        const height = 40;
        const step = values.length > 1 ? width / (values.length - 1) : width;
        const path = values.map((value, index) => {
            const x = index * step;
            const normalized = (value - min) / range;
            const y = height - normalized * height;
            return `${index === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ');
        sparkSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        sparkSvg.innerHTML = `<path d="${path}" fill="none" stroke="#2563eb" stroke-width="2"/>`;
        const delta = values[values.length - 1] - values[0];
        sparkDelta.textContent = `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}p 변화`;
        sparkDelta.className = `delta ${delta === 0 ? 'flat' : delta > 0 ? 'positive' : 'negative'}`;
    }

    function formatTimeLabel(value) {
        if (!value) {
            return '';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
});



