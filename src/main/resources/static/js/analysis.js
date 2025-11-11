document.addEventListener('DOMContentLoaded', () => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const formatHMS = (seconds) => {
        const s = Math.max(0, Math.floor(seconds));
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${h}:${m}:${ss}`;
    };
    const createPoster = (accent = '#2b6ef2') => {
        const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='${accent}' stop-opacity='0.15'/>
            <stop offset='100%' stop-color='#f8fafc'/>
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
      </svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace(/\s+/g, ' '));
    };
    const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

    // --- Mock Data ---
    const generateSeries = (length, scale, offset) => {
        return Array.from({ length }, (_, i) => {
            const base = Math.sin(i / (length / 12)) * 0.3 + 0.4;
            return clamp(base * scale + (Math.random() - 0.5) * 0.1 + offset, 0.05, 0.98);
        });
    };

    const cameras = window.cameraData.slice(0, 15).map(cam => {
        const statusMap = {
            danger: { label: '위험', tone: 'danger', color: '#ef4444' },
            warning: { label: '주의', tone: 'warning', color: '#f59e0b' },
            normal: { label: '정상', tone: 'neutral', color: '#16a34a' }
        };
        const congestion = cam.congestion / 100;
        const status = congestion > 0.7 ? 'danger' : congestion > 0.4 ? 'warning' : 'normal';
        const anomalyBase = clamp(congestion + (Math.random() - 0.5) * 0.2, 0, 1);
        return {
            ...cam,
            status: statusMap[status],
            posterAccent: statusMap[status].color,
            live: {
                caption: `RTSP/HLS · ${new Date().toLocaleTimeString('ko-KR')}`,
                overlays: {
                    boxes: Array.from({length: Math.floor(Math.random() * 5)}, () => ({
                        x: Math.random() * 0.8, y: Math.random() * 0.8, w: Math.random() * 0.2 + 0.1, h: Math.random() * 0.2 + 0.1,
                        label: `인물 ${Math.floor(Math.random() * 100)}`,
                        confidence: Math.random()
                    })),
                    hotspots: Array.from({length: 200}, () => ({
                        x: Math.random(), y: Math.random(), weight: Math.random()
                    }))
                }
            },
            metrics: {
                timestamp: new Date().toLocaleString('ko-KR'),
                congestion: congestion,
                yesterday: clamp(congestion - (0.1 + Math.random() * 0.1), 0.05, 0.98),
                lastWeek: clamp(congestion - (0.15 + Math.random() * 0.2), 0.05, 0.98),
                roc: (Math.random() * 10 - 5),
                acc: (Math.random() * 4 - 2),
                durationSec: status === 'normal' ? 0 : Math.floor(Math.random() * 3600),
                allTimeHigh: clamp(congestion + 0.1 + Math.random() * 0.1, congestion, 1),
                athMeta: `2025-10-01 기록`,
                predictiveAlert: status === 'danger' ? '5분 내 혼잡도 90% 초과 예측' : '',
                anomaly: {
                    current: anomalyBase,
                    normalMin: 0.3,
                    normalMax: 0.6,
                },
                riskIndex: Math.round(clamp(congestion * 60 + Math.abs(status === 'danger' ? 20 : 0) + Math.abs(status === 'warning' ? 10 : 0), 0, 100)),
                riskGrade: statusMap[status].label,
                alerts: Array.from({length: Math.floor(Math.random() * 8) + 2}, (_, i) => {
                    const d = new Date(Date.now() - i * 15 * 60000);
                    const alertStatus = ['주의', '경고', '심각'][Math.floor(Math.random()*3)];
                    return {
                        ts: d.toLocaleTimeString('ko-KR'),
                        type: alertStatus,
                        message: `${['밀집도 증가', '군중 형성', '급격한 유입'][Math.floor(Math.random()*3)]} 감지`
                    }
                })
            },
            series: {
                '2h': generateSeries(24, 1, 0),
                '24h': generateSeries(96, 1, 0),
                '7d': generateSeries(168, 1, 0),
                'yesterday': generateSeries(96, 0.9, -0.1),
                'lastWeek': generateSeries(96, 0.8, -0.15)
            },
            heatmap: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => clamp(Math.random(), 0, 1)))
        };
    });

    // --- State Management ---
    const state = {
        cameras,
        current: cameras[0],
        showBBox: false,
        showHeat: false,
        chartState: { period: '2h', compare: [] }
    };

    let interactiveChart;

    // --- DOM Elements ---
    const selectEl = $('[data-role="camera-select"]');
    const mediaPoster = $('#mediaPoster');
    const overlayCanvas = $('#overlay');
    const toggleBBox = $('#toggleBBox');
    const toggleHeat = $('#toggleHeat');

    // --- Initialization ---
    function init() {
        populateSelect();
        initInteractiveChart();
        bindEvents();
        setCamera(state.cameras[0].id);
    }

    // --- Event Binding ---
    function bindEvents() {
        selectEl.addEventListener('change', (event) => setCamera(event.target.value));
        toggleBBox.addEventListener('click', () => {
            state.showBBox = !state.showBBox;
            syncOverlayControls();
            renderOverlays();
        });
        toggleHeat.addEventListener('click', () => {
            state.showHeat = !state.showHeat;
            syncOverlayControls();
            renderOverlays();
        });
        $$('.interactive-chart-controls .control-btn[data-period]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.chartState.period = btn.dataset.period;
                updateInteractiveChart();
            });
        });
        $$('.interactive-chart-controls .control-btn[data-compare]').forEach(btn => {
            btn.addEventListener('click', () => {
                const compareKey = btn.dataset.compare;
                const index = state.chartState.compare.indexOf(compareKey);
                if (index > -1) state.chartState.compare.splice(index, 1);
                else state.chartState.compare.push(compareKey);
                updateInteractiveChart();
            });
        });
        window.addEventListener('resize', () => {
            renderOverlays();
            if (interactiveChart) interactiveChart.resize();
        });
    }

    // --- State & Rendering ---
    function setCamera(id) {
        state.current = state.cameras.find((camera) => camera.id === id) || state.cameras[0];
        renderPage();
    }

    function renderPage() {
        renderHeader();
        renderKPIs();
        renderSparkline();
        renderAlerts();
        renderAnomaly();
        renderRiskIndex();
        renderATH();
        updateInteractiveChart();
        renderCalendar();
        renderPoster();
        syncOverlayControls();
        renderOverlays();
    }

    function renderHeader() {
        const camera = state.current;
        $('[data-role="camera-name"]').textContent = camera.name;
        $('[data-role="camera-location"]').textContent = camera.location;
        const statusEl = $('[data-role="camera-status"]');
        statusEl.textContent = camera.status.label;
        statusEl.className = `chip status-chip chip--${camera.status.tone}`;
        $('[data-role="live-caption"]').textContent = camera.live.caption;
        selectEl.value = camera.id;
    }

    function renderKPIs() {
        const { metrics } = state.current;
        const pct = Math.round(metrics.congestion * 100);

        $('#statusTimestamp').textContent = metrics.timestamp;
        
        const gaugeCircumference = 2 * Math.PI * 48;
        $('#gaugeArc').style.strokeDasharray = `${(pct / 100) * gaugeCircumference} ${gaugeCircumference}`;
        $('#gaugeText').textContent = `${pct}%`;
        
        let gradeText = '정상';
        if (pct > 75) gradeText = '위급';
        else if (pct > 60) gradeText = '심각';
        else if (pct > 40) gradeText = '주의';
        $('#grade').textContent = `${gradeText} — ${pct}%`;

        $('#currentCongestion').textContent = `${pct}%`;

        const renderDelta = (val, el) => {
            const sign = val > 0 ? '▲' : '▼';
            const cls = val > 0 ? 'up' : 'down';
            el.innerHTML = `<span class="delta ${cls}">${sign} ${Math.abs(val).toFixed(1)}%</span>`;
        };

        renderDelta( (metrics.congestion - metrics.yesterday) * 100, $('#deltaYesterday'));
        $('#compYesterday').textContent = `${(metrics.yesterday * 100).toFixed(0)}%`;
        
        renderDelta( (metrics.congestion - metrics.lastWeek) * 100, $('#deltaLastWeek'));
        $('#compLastWeek').textContent = `${(metrics.lastWeek * 100).toFixed(0)}%`;

        $('#duration').textContent = formatHMS(metrics.durationSec);
        $('#roc').textContent = metrics.roc.toFixed(1);
        $('#acc').textContent = metrics.acc.toFixed(1);
        
        const alertEl = $('#predictiveAlert');
        if (metrics.predictiveAlert) {
            alertEl.textContent = metrics.predictiveAlert;
            alertEl.className = 'alert alert--active';
        } else {
            alertEl.textContent = '현재 예측 경보 없음.';
            alertEl.className = 'alert';
        }
    }

    function renderSparkline() {
        const svg = $('#statusSpark');
        if (!svg) return;
    
        const series = state.current.series['2h'].slice(-4); // Last 4 points for ~15 mins
        const deltaEl = $('#sparkDelta');
    
        if (series.length < 2) {
            svg.innerHTML = '';
            deltaEl.textContent = 'N/A';
            return;
        }
    
        const startVal = series[0];
        const endVal = series[series.length - 1];
        const diff = (endVal - startVal) * 100;
        
        let sign = '→';
        let cls = 'flat';
        if (diff > 1) { sign = '▲'; cls = 'up'; }
        else if (diff < -1) { sign = '▼'; cls = 'down'; }
        
        deltaEl.className = `delta ${cls}`;
        deltaEl.innerHTML = `${Math.round(Math.abs(diff))}p ${sign}`;
    
        const width = 120; 
        const height = 30;
        const maxVal = Math.max(...series);
        const minVal = Math.min(...series);
        const range = maxVal - minVal;
    
        const points = series.map((d, i) => {
            const x = (i / (series.length - 1)) * width;
            const y = height - ((d - minVal) / (range || 1)) * (height - 4) - 2;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');
    
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.innerHTML = `<polyline points="${points}" fill="none" stroke="var(--ink-2, #6b7280)" stroke-width="1.5" />`;
    }

    function renderAnomaly() {
        const { anomaly } = state.current.metrics;
        const { current, normalMin, normalMax } = anomaly;
        
        const isAnomaly = current < normalMin || current > normalMax;
        const statusEl = $('#anomalyStatus');
        statusEl.textContent = isAnomaly ? '이상 감지' : '정상';
        statusEl.className = `chip ${isAnomaly ? 'chip--danger' : 'chip--neutral'}`;

        $('#anomalyCurrentVal').textContent = `${(current * 100).toFixed(0)}%`;
        $('#anomalyNormalRange').textContent = `${(normalMin * 100).toFixed(0)}%–${(normalMax * 100).toFixed(0)}%`;

        const deviation = isAnomaly ? (current < normalMin ? current - normalMin : current - normalMax) : 0;
        const devText = deviation !== 0 ? `정상 범위를 ${Math.abs(deviation * 100).toFixed(0)}% ${deviation > 0 ? '초과' : '미달'}했습니다.` : '정상 범위 내에 있습니다.';
        $('#anomalyDeviation').textContent = devText;

        $('#anomalyRange').style.left = `${normalMin * 100}%`;
        $('#anomalyRange').style.width = `${(normalMax - normalMin) * 100}%`;
        $('#anomalyValue').style.left = `${current * 100}%`;
    }

    function renderRiskIndex() {
        const { riskIndex, riskGrade, congestion, roc, durationSec } = state.current.metrics;
        const anomaly = state.current.metrics.anomaly.current > state.current.metrics.anomaly.normalMax || state.current.metrics.anomaly.current < state.current.metrics.anomaly.normalMin;

        const riskCircumference = 2 * Math.PI * 48;
        $('#riskArc').style.strokeDasharray = `${(riskIndex / 100) * riskCircumference} ${riskCircumference}`;
        $('#riskText').textContent = riskIndex;
        $('#riskGrade').textContent = riskGrade;

        const setFactor = (id, value, status) => {
            const el = $(id);
            el.querySelector('.factor-value').textContent = value;
            const statusEl = el.querySelector('.factor-status');
            statusEl.textContent = status;
            statusEl.className = `factor-status ${status === '높음' ? 'up' : status === '보통' ? 'flat' : 'down'}`;
        };
        
        setFactor('#factorCongestion', `${(congestion*100).toFixed(0)}%`, congestion > 0.7 ? '높음' : congestion > 0.4 ? '보통' : '낮음');
        setFactor('#factorRoc', roc.toFixed(1), Math.abs(roc) > 5 ? '높음' : Math.abs(roc) > 2 ? '보통' : '낮음');
        setFactor('#factorDuration', formatHMS(durationSec), durationSec > 600 ? '높음' : durationSec > 120 ? '보통' : '낮음');
        $('#factorAnomaly .factor-status').textContent = anomaly ? '감지' : '없음';
    }

    function renderATH() {
        const { allTimeHigh, athMeta, congestion } = state.current.metrics;
        $('#athMeta').textContent = athMeta;
        $('#allTimeHigh').textContent = `${(allTimeHigh * 100).toFixed(0)}%`;
        $('#athRatio').textContent = `${((congestion / allTimeHigh) * 100).toFixed(0)}%`;
    }

    function renderAlerts() {
        const { alerts } = state.current.metrics;
        const tableBody = $('#alertTable tbody');
        if (!tableBody) return;
        tableBody.innerHTML = alerts.map(alert => `
            <tr>
                <td>${alert.ts}</td>
                <td><span class="chip chip--${alert.type === '심각' ? 'danger' : alert.type === '경고' ? 'warning' : 'neutral'}">${alert.type}</span></td>
                <td>${alert.message}</td>
            </tr>
        `).join('');
    }

    function renderCalendar() {
        const timeLabels = $('#timeLabels');
        const dayLabels = $('#daysLabels');
        const calendar = $('#calendar');
        if (!timeLabels || !dayLabels || !calendar) return;
        timeLabels.innerHTML = '';
        dayLabels.innerHTML = '';
        calendar.innerHTML = '';
        for (let hour = 0; hour < 24; hour += 1) {
            const label = document.createElement('div');
            label.textContent = String(hour).padStart(2, '0');
            timeLabels.appendChild(label);
        }
        state.current.heatmap.forEach((row, dayIndex) => {
            const label = document.createElement('div');
            label.textContent = DAYS[dayIndex];
            dayLabels.appendChild(label);
            row.forEach((value, hour) => {
                const cell = document.createElement('div');
                cell.className = 'cal-cell';
                cell.style.background = heatColor(value);
                cell.title = `${DAYS[dayIndex]} ${String(hour).padStart(2, '0')}:00 · 평균 ${Math.round(value * 100)}%`;
                calendar.appendChild(cell);
            });
        });
    }

    function heatColor(value) {
        if (value >= 0.75) return 'rgb(254, 202, 202)';
        if (value >= 0.5) return 'rgb(253, 230, 138)';
        if (value >= 0.25) return 'rgb(219, 234, 254)';
        return 'rgb(243, 244, 246)';
    }

    function renderPoster() {
        // if (mediaPoster) mediaPoster.src = createPoster(state.current.posterAccent);
    }

    function renderOverlays() {
        const ctx = overlayCanvas.getContext('2d');
        const { width, height } = overlayCanvas.getBoundingClientRect();
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        ctx.clearRect(0, 0, width, height);

        if (state.showBBox) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#ffffff';
            state.current.live.overlays.boxes.forEach(box => {
                ctx.strokeRect(box.x * width, box.y * height, box.w * width, box.h * height);
                ctx.fillText(box.label, box.x * width + 5, box.y * height + 15);
            });
        }
        if (state.showHeat) {
            ctx.globalAlpha = 0.5;
            state.current.live.overlays.hotspots.forEach(spot => {
                const grad = ctx.createRadialGradient(spot.x * width, spot.y * height, 0, spot.x * width, spot.y * height, 30);
                grad.addColorStop(0, 'rgba(255,0,0,1)');
                grad.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(spot.x * width - 30, spot.y * height - 30, 60, 60);
            });
            ctx.globalAlpha = 1.0;
        }
    }

    function syncOverlayControls() {
        toggleBBox.classList.toggle('is-active', state.showBBox);
        toggleHeat.classList.toggle('is-active', state.showHeat);
    }

    function populateSelect() {
        if (!selectEl) return;
        selectEl.innerHTML = state.cameras.map((camera) => `<option value="${camera.id}">${camera.name}</option>`).join('');
    }

    function initInteractiveChart() {
        const ctx = $('#interactiveTimeSeriesChart').getContext('2d');
        interactiveChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { title: { display: false }, grid: { display: false } },
                    y: {
                        title: { display: false }, beginAtZero: true, max: 1.0,
                        ticks: { callback: value => (value * 100).toFixed(0) + '%' }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index', intersect: false,
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${(context.parsed.y * 100).toFixed(1)}%`
                        }
                    },
                    legend: { position: 'bottom', labels: { usePointStyle: true, boxHeight: 8 } }
                },
                interaction: { mode: 'index', intersect: false },
                elements: { point: { radius: 0, hitRadius: 10, hoverRadius: 4 }, line: { tension: 0.1 } }
            }
        });
    }

    function updateInteractiveChart() {
        if (!interactiveChart) return;
        let { period, compare } = state.chartState;
        const cameraSeries = state.current.series;
        if (compare.length > 0) period = '24h';

        $$('.control-btn[data-period]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.period === period));
        $$('.control-btn[data-compare]').forEach(btn => btn.classList.toggle('is-active', state.chartState.compare.includes(btn.dataset.compare)));

        const datasets = [{
            label: '오늘', data: cameraSeries[period], borderColor: '#2b6ef2',
            backgroundColor: 'rgba(43, 110, 242, 0.1)', fill: true, borderWidth: 2
        }];

        compare.forEach(key => {
            if (!cameraSeries[key]) return;
            const options = { yesterday: { label: '어제', color: '#6b7280' }, lastWeek: { label: '지난주', color: '#16a34a' } };
            datasets.push({
                label: options[key].label, data: cameraSeries[key], borderColor: options[key].color,
                borderWidth: 2, borderDash: [5, 5], fill: false
            });
        });

        const now = new Date();
        const numPoints = cameraSeries[period].length;
        let labels;
        switch (period) {
            case '2h':
                labels = Array.from({ length: numPoints }, (_, i) => new Date(now.getTime() - (numPoints - 1 - i) * 5 * 60 * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
                break;
            case '7d':
                labels = Array.from({ length: numPoints }, (_, i) => {
                    const d = new Date(now.getTime() - (numPoints - 1 - i) * 60 * 60 * 1000);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                });
                break;
            default:
                labels = Array.from({ length: numPoints }, (_, i) => `${String(Math.floor(i*15/60)).padStart(2,'0')}:${String((i*15)%60).padStart(2,'0')}`);
        }

        interactiveChart.data.labels = labels;
        interactiveChart.data.datasets = datasets;
        interactiveChart.update();
    }

    init();
});
