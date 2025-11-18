document.addEventListener('DOMContentLoaded', () => {
    const gridEl = document.querySelector('[data-selected-camera-id]');
    if (!gridEl) {
        console.log('No selected camera found on this page. Analysis scripts will not run.');
        return;
    }

    const cameraId = gridEl.dataset.selectedCameraId;

    // --- Element Selectors ---
    const chartCanvas = document.getElementById('interactiveTimeSeriesChart');
    const chartPlaceholder = document.getElementById('analysisChartPlaceholder');
    const periodControls = document.querySelector('.interactive-chart-controls .control-buttons');
    const compareControls = document.getElementById('compare-buttons-container');
    const heatmapContainer = document.getElementById('congestion-heatmap');
    const alertTableBody = document.querySelector('#alertTable tbody');
    const anomalyStatusEl = document.getElementById('anomalyStatus');
    const anomalyGraphEl = document.querySelector('.anomaly-graph');
    const anomalyRangeEl = document.getElementById('anomalyRange');
    const anomalyValueEl = document.getElementById('anomalyValue');
    const anomalyInfoEl = document.getElementById('anomalyInfo');
    const anomalyDeviationEl = document.getElementById('anomalyDeviation');


    // --- State ---
    let trendChart = null;
    let activePeriod = '2h';
    let activeCompare = null;

    // --- Helper ---
    const toISOStringWithTimezone = (date) => {
        const pad = (num) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    // --- Chart Functions ---
    const fetchDataForPeriod = async (start, end) => {
        const url = `/api/v1/cameras/${cameraId}/density-history?start=${toISOStringWithTimezone(start)}&end=${toISOStringWithTimezone(end)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
        return response.json();
    };

    const updateChart = async () => {
        if (!chartCanvas || !periodControls || !compareControls) return;
        chartPlaceholder.textContent = '분석 데이터를 불러오는 중입니다...';
        chartPlaceholder.hidden = false;
        chartCanvas.style.display = 'none';

        const now = new Date();
        let primaryStart = new Date();
        let periodLabel = "현재";

        switch (activePeriod) {
            case '24h': primaryStart.setDate(now.getDate() - 1); periodLabel = "오늘"; break;
            case '7d': primaryStart.setDate(now.getDate() - 7); periodLabel = "이번 주"; break;
            default: primaryStart.setHours(now.getHours() - 2); break;
        }

        const promises = [fetchDataForPeriod(primaryStart, now)];
        let compareLabel = null;

        if (activeCompare) {
            let compareStart = new Date(primaryStart);
            let compareEnd = new Date(now);
            if (activeCompare === 'yesterday') {
                compareStart.setDate(compareStart.getDate() - 1);
                compareEnd.setDate(compareEnd.getDate() - 1);
                compareLabel = "어제";
            } else if (activeCompare === 'lastWeek') {
                compareStart.setDate(compareStart.getDate() - 7);
                compareEnd.setDate(compareEnd.getDate() - 7);
                compareLabel = "지난 주";
            }
            promises.push(fetchDataForPeriod(compareStart, compareEnd));
        }

        try {
            const [primaryData, compareData] = await Promise.all(promises);
            if (!primaryData || primaryData.length === 0) {
                chartPlaceholder.textContent = '해당 기간에 대한 분석 데이터가 없습니다.';
                return;
            }
            const datasets = [{
                label: periodLabel,
                data: processDataWithGaps(primaryData),
                borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.08)',
                tension: 0.1, fill: true, pointRadius: 0, borderWidth: 2
            }];
            if (compareData) {
                datasets.push({
                    label: compareLabel,
                    data: processDataWithGaps(compareData),
                    borderColor: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.05)',
                    tension: 0.1, borderDash: [5, 5], fill: false, pointRadius: 0, borderWidth: 2
                });
            }
            renderChart(datasets, primaryData);
            chartPlaceholder.hidden = true;
            chartCanvas.style.display = 'block';
        } catch (error) {
            console.error('Failed to fetch or render chart:', error);
            chartPlaceholder.textContent = '차트 데이터를 불러오는 데 실패했습니다.';
        }
    };

    const processDataWithGaps = (data) => {
        if (!data || data.length < 2) return data.map(p => p.density);
        const GAP_THRESHOLD_SECONDS = 120;
        const processed = [data[0].density];
        for (let i = 1; i < data.length; i++) {
            const prevTime = new Date(data[i - 1].timestamp);
            const currTime = new Date(data[i].timestamp);
            if (((currTime - prevTime) / 1000) > GAP_THRESHOLD_SECONDS) processed.push(null);
            processed.push(data[i].density);
        }
        return processed;
    };

    const renderChart = (datasets, primaryData) => {
        const labels = primaryData.map(point => new Date(point.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
        if (trendChart) trendChart.destroy();
        const dataMax = isFinite(Math.max(...primaryData.map(p => p.density))) ? Math.max(...primaryData.map(p => p.density)) : 0;
        const suggestedCeiling = Math.max(dataMax * 1.2, 0.5);

        trendChart = new Chart(chartCanvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: datasets.length > 1 },
                    tooltip: { callbacks: { label: (c) => `${c.dataset.label || ''}: 밀집도 ${c.parsed.y.toFixed(3)}` } }
                },
                scales: { y: { beginAtZero: true, suggestedMax: suggestedCeiling }, x: { ticks: { autoSkip: true, maxTicksLimit: 10 } } }
            }
        });
    };

    // --- Heatmap Functions ---
    const createTooltip = () => {
        const tooltip = document.createElement('div');
        tooltip.className = 'heatmap-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    };

    const tooltip = createTooltip();

    const getColorForDensity = (density) => {
        if (density <= 0) return '#ebedf0';
        const maxDensity = 0.8;
        const normalized = Math.min(density, maxDensity) / maxDensity;
        const hue = Math.round(150 * (1 - normalized));
        const saturation = 70 + (normalized * 25);
        const lightness = 65 - (normalized * 20);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const fetchAndRenderHeatmap = async () => {
        if (!heatmapContainer) return;
        const url = `/api/v1/cameras/${cameraId}/congestion-heatmap`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
            const data = await response.json();
            if (data) {
                data.forEach(dayData => {
                    dayData.hourlyAverageDensities.forEach((density, hour) => {
                        const cell = heatmapContainer.querySelector(`[data-day="${dayData.dayOfWeekIndex}"][data-hour="${hour}"]`);
                        if (cell) {
                            cell.style.backgroundColor = getColorForDensity(density);
                            cell.dataset.tooltipContent = `${dayData.dayOfWeek}요일 ${hour}시 평균: ${density.toFixed(3)}`;
                        }
                    });
                });
            }

            // Forcefully remove any lingering title attributes to prevent native tooltips
            heatmapContainer.querySelectorAll('.cal-cell').forEach(cell => {
                cell.removeAttribute('title');
            });

        } catch (error) {
            console.error('Failed to fetch or render heatmap:', error);
        }
    };

    const setupHeatmapEventListeners = () => {
        if (!heatmapContainer) return;

        heatmapContainer.addEventListener('mouseover', (event) => {
            const cell = event.target.closest('[data-tooltip-content]');
            if (cell) {
                tooltip.textContent = cell.dataset.tooltipContent;
                tooltip.style.display = 'block';
            }
        });

        heatmapContainer.addEventListener('mouseout', (event) => {
            const cell = event.target.closest('[data-tooltip-content]');
            if (cell) {
                tooltip.style.display = 'none';
            }
        });

        heatmapContainer.addEventListener('mousemove', (event) => {
            if (tooltip.style.display === 'block') {
                // Position the tooltip near the cursor
                tooltip.style.left = `${event.clientX + 15}px`;
                tooltip.style.top = `${event.clientY}px`;
            }
        });
    };


    // --- Alerts Functions ---
    const fetchAndRenderAlerts = async () => {
        if (!alertTableBody) return;
        const url = `/api/v1/cameras/${cameraId}/alerts?limit=10`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
            const alerts = await response.json();
            alertTableBody.innerHTML = '';
            if (!alerts || alerts.length === 0) {
                alertTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center;">표시할 경보가 없습니다.</td></tr>`;
                return;
            }
            alerts.forEach(alert => {
                const row = document.createElement('tr');
                row.classList.add(`alert-row--${alert.severity}`);
                row.innerHTML = `<td>${new Date(alert.timestamp).toLocaleTimeString('ko-KR')}</td><td>${alert.title}</td><td>${alert.message}</td>`;
                alertTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Failed to fetch or render alerts:', error);
            alertTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--risk);">알림을 불러오는 데 실패했습니다.</td></tr>`;
        }
    };

    // --- Statistical Anomaly Functions ---
    const fetchAndRenderStatisticalAnomaly = async () => {
        const elements = [anomalyStatusEl, anomalyGraphEl, anomalyRangeEl, anomalyValueEl, anomalyInfoEl, anomalyDeviationEl];
        if (elements.some(el => !el)) return;

        const url = `/api/v1/cameras/${cameraId}/statistical-anomaly`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
            const data = await response.json();

            anomalyStatusEl.textContent = data.message;
            if (!data.isAnalyzable) {
                anomalyGraphEl.style.display = 'none';
                anomalyInfoEl.textContent = data.message;
                anomalyDeviationEl.textContent = `현재 밀집도: ${data.currentDensity ? data.currentDensity.toFixed(3) : '--'}`;
                anomalyStatusEl.className = 'chip chip--neutral';
                return;
            }

            anomalyGraphEl.style.display = 'block';
            const { currentDensity, averageDensity, stdDeviation, zScore } = data;

            // Visualization logic
            const graphMin = Math.max(0, averageDensity - 3 * stdDeviation);
            const graphMax = averageDensity + 3 * stdDeviation;
            const graphRange = graphMax - graphMin;

            if (graphRange > 0) {
                const rangeLeft = ((averageDensity - stdDeviation - graphMin) / graphRange) * 100;
                const rangeWidth = ((2 * stdDeviation) / graphRange) * 100;
                const valueLeft = ((currentDensity - graphMin) / graphRange) * 100;

                anomalyRangeEl.style.left = `${Math.max(0, rangeLeft)}%`;
                anomalyRangeEl.style.width = `${Math.min(100, rangeWidth)}%`;
                anomalyValueEl.style.left = `clamp(0%, ${valueLeft}%, 100%)`;
            }

            // Update text
            anomalyInfoEl.innerHTML = `현재 값 <strong>${currentDensity.toFixed(3)}</strong> (정상 범위: ${(averageDensity - stdDeviation).toFixed(2)} ~ ${(averageDensity + stdDeviation).toFixed(2)})`;
            anomalyDeviationEl.textContent = `평균(${averageDensity.toFixed(2)})으로부터 ${zScore.toFixed(1)} 표준편차`;

            // Update status chip color
            if (zScore > 2.5) anomalyStatusEl.className = 'chip chip--danger';
            else if (zScore > 1.5) anomalyStatusEl.className = 'chip chip--warning';
            else anomalyStatusEl.className = 'chip chip--neutral';
            anomalyValueEl.classList.toggle('is-anomaly', zScore > 1.5);

        } catch (error) {
            console.error('Failed to fetch or render statistical anomaly:', error);
            anomalyStatusEl.textContent = '오류';
            anomalyInfoEl.textContent = '데이터를 불러오는 데 실패했습니다.';
            anomalyDeviationEl.textContent = '';
        }
    };


    // --- Initial Setup ---
    const init = () => {
        if (!cameraId) return;
        updateChart();
        fetchAndRenderHeatmap();
        fetchAndRenderAlerts();
        fetchAndRenderStatisticalAnomaly();
        setupHeatmapEventListeners();
    };

    periodControls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-period]');
        if (!button) return;
        activePeriod = button.dataset.period;
        periodControls.querySelectorAll('[data-period]').forEach(btn => btn.classList.remove('is-active'));
        button.classList.add('is-active');
        updateChart();
    });

    compareControls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-compare]');
        if (!button) return;
        const compareValue = button.dataset.compare;
        if (activeCompare === compareValue) {
            activeCompare = null;
            button.classList.remove('is-active');
        } else {
            activeCompare = compareValue;
            compareControls.querySelectorAll('[data-compare]').forEach(btn => btn.classList.remove('is-active'));
            button.classList.add('is-active');
        }
        updateChart();
    });

    init();
});
