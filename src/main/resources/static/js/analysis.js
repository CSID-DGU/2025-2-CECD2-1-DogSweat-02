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
        <g fill='#dbeafe' stroke='#c7d2fe' stroke-width='3' opacity='0.85'>
          <rect x='80' y='96' width='320' height='190' rx='16'/>
          <rect x='440' y='120' width='360' height='210' rx='18'/>
          <rect x='880' y='170' width='220' height='260' rx='20'/>
          <rect x='280' y='380' width='640' height='200' rx='26'/>
        </g>
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

  const cameras = window.cameraData.map(cam => {
    const statusMap = {
        danger: { label: '위험', tone: 'danger' },
        warning: { label: '주의', tone: 'warning' },
        normal: { label: '정상', tone: 'neutral' }
    };
    const congestion = cam.congestion / 100;
    return {
        ...cam,
        status: statusMap[cam.status],
        posterAccent: cam.status === 'danger' ? '#ef4444' : cam.status === 'warning' ? '#f59e0b' : '#10b981',
        live: { overlays: { boxes: [], hotspots: [] } },
        metrics: {
            timestamp: new Date().toLocaleString('ko-KR'),
            congestion: congestion,
            yesterday: clamp(congestion - 0.1 + Math.random() * 0.1, 0.05, 0.98),
            lastWeek: clamp(congestion - 0.15 + Math.random() * 0.2, 0.05, 0.98),
            roc: (Math.random() * 5 - 2.5),
            acc: (Math.random() * 2 - 1),
            durationSec: Math.floor(Math.random() * 3600),
            allTimeHigh: clamp(congestion + 0.1 + Math.random() * 0.1, congestion, 1),
            athMeta: '최고 기록 대비 데이터',
            predictiveAlert: cam.status === 'danger' ? '혼잡도 급증 예측' : '',
            anomaly: { normalMin: 0.3, normalMax: 0.6 },
            riskIndex: cam.congestion,
            riskGrade: statusMap[cam.status].label,
            alerts: [
                { ts: '14:00:00', type: '주의', message: '테스트 알림 1' },
                { ts: '13:30:00', type: '경고', message: '테스트 알림 2' },
            ]
        },
        // Time series data for different periods
        series: {
            '2h': generateSeries(24, 1, 0), // 5-min intervals for 2 hours
            '24h': generateSeries(96, 1, 0), // 15-min intervals for 24 hours
            '7d': generateSeries(168, 1, 0), // 1-hour intervals for 7 days
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
    chartState: {
        period: '2h',
        compare: []
    }
  };

  let interactiveChart; // To hold the Chart.js instance

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
    renderPage();
  }

  // --- Event Binding ---
  function bindEvents() {
    if (selectEl) {
      selectEl.addEventListener('change', (event) => {
        setCamera(event.target.value);
      });
    }
    if (toggleBBox) {
      toggleBBox.addEventListener('click', () => {
        state.showBBox = !state.showBBox;
        syncOverlayControls();
        renderOverlays();
      });
    }
    if (toggleHeat) {
      toggleHeat.addEventListener('click', () => {
        state.showHeat = !state.showHeat;
        syncOverlayControls();
        renderOverlays();
      });
    }
    
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
            if (index > -1) {
                state.chartState.compare.splice(index, 1);
            } else {
                state.chartState.compare.push(compareKey);
            }
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
    renderAlerts();
    renderAnomaly();
    updateInteractiveChart(); // Replaces renderSeries()
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
    if (selectEl) selectEl.value = camera.id;
  }

  // (Keep renderKPIs, renderAlerts, renderAnomaly, etc. from the original file, they are mostly fine)
  // NOTE: The following functions are simplified for brevity but should be copied from the original file if full functionality is needed.
  function renderKPIs() {
    const { metrics } = state.current;
    const pct = Math.round(metrics.congestion * 100);
    $('#currentCongestion').textContent = `${pct}%`;
    // ... and so on for all other KPIs
  }
  function renderAlerts() { /* ... */ }
  function renderAnomaly() { /* ... */ }
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
    if (value >= 0.72) return '#fecaca';
    if (value >= 0.55) return '#fde68a';
    if (value >= 0.35) return '#dbeafe';
    return '#f3f4f6';
  }
  function renderPoster() {
    if (mediaPoster) mediaPoster.src = createPoster(state.current.posterAccent);
  }
  function renderOverlays() { /* ... */ }
  function syncOverlayControls() {
    if (toggleBBox) toggleBBox.classList.toggle('is-active', state.showBBox);
    if (toggleHeat) toggleHeat.classList.toggle('is-active', state.showHeat);
  }
  function populateSelect() {
    if (!selectEl) return;
    selectEl.innerHTML = state.cameras.map((camera) => `<option value="${camera.id}">${camera.name}</option>`).join('');
    selectEl.value = state.current.id;
  }


  // --- NEW: Interactive Chart Logic ---
  function initInteractiveChart() {
    const ctx = $('#interactiveTimeSeriesChart').getContext('2d');
    const chartConfig = {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: '시간' },
                    grid: { display: false }
                },
                y: {
                    title: { display: true, text: '혼잡도 (%)' },
                    beginAtZero: true,
                    max: 1.0, // Set max to 1.0 for 0-1 data range
                    ticks: {
                        // Format ticks as percentages
                        callback: value => (value * 100).toFixed(0) + '%'
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        // Format tooltips as percentages
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += (context.parsed.y * 100).toFixed(1) + '%';
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            elements: {
                point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
                line: { tension: 0.1 }
            }
        }
    };
    interactiveChart = new Chart(ctx, chartConfig);
  }

  function updateInteractiveChart() {
    if (!interactiveChart) return;

    let { period, compare } = state.chartState;
    const cameraSeries = state.current.series;

    // If a comparison is active, force the period to '24h' for data alignment
    if (compare.length > 0) {
        period = '24h';
    }

    // 1. Update button active states
    $$('.control-btn[data-period]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.period === period));
    $$('.control-btn[data-compare]').forEach(btn => btn.classList.toggle('is-active', state.chartState.compare.includes(btn.dataset.compare)));

    // 2. Generate data based on state
    const datasets = [];
    
    // Main dataset (Today)
    datasets.push({
        label: '오늘',
        data: cameraSeries[period],
        borderColor: '#2b6ef2',
        backgroundColor: 'rgba(43, 110, 242, 0.1)',
        fill: true,
        borderWidth: 2
    });

    // Comparison datasets
    compare.forEach(key => {
        if (cameraSeries[key]) {
            let label = '';
            let color = '';
            if (key === 'yesterday') {
                label = '어제';
                color = '#6b7280';
            } else if (key === 'lastWeek') {
                label = '지난주';
                color = '#16a34a';
            }
            
            datasets.push({
                label: label,
                data: cameraSeries[key], // This data is always 24h long
                borderColor: color,
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false
            });
        }
    });

    // 3. Generate labels based on the (potentially forced) period
    const now = new Date();
    let labels;
    const numPoints = cameraSeries[period].length;

    switch (period) {
        case '2h':
            labels = Array.from({ length: numPoints }, (_, i) => {
                const date = new Date(now.getTime() - (numPoints - 1 - i) * 5 * 60 * 1000);
                return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            });
            break;
        case '7d':
            labels = Array.from({ length: numPoints }, (_, i) => {
                const date = new Date(now.getTime() - (numPoints - 1 - i) * 60 * 60 * 1000);
                return `${date.getMonth()+1}/${date.getDate()}`;
            });
            break;
        case '24h':
        default:
            // Use a generic 00:00 to 23:45 timeline for 24h view
            labels = Array.from({ length: numPoints }, (_, i) => {
                const hour = String(Math.floor(i * 15 / 60)).padStart(2, '0');
                const minute = String((i * 15) % 60).padStart(2, '0');
                return `${hour}:${minute}`;
            });
            break;
    }

    // 4. Update chart instance
    interactiveChart.data.labels = labels;
    interactiveChart.data.datasets = datasets;
    interactiveChart.update();
  }

  init();
});
