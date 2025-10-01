document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector) => document.querySelector(selector);
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

  const baseSeries = [
    0.17, 0.18, 0.18, 0.19,
    0.17, 0.17, 0.16, 0.16,
    0.16, 0.15, 0.15, 0.16,
    0.15, 0.14, 0.14, 0.15,
    0.15, 0.15, 0.15, 0.16,
    0.16, 0.17, 0.18, 0.19,
    0.21, 0.22, 0.23, 0.25,
    0.28, 0.30, 0.32, 0.34,
    0.35, 0.37, 0.39, 0.41,
    0.44, 0.46, 0.48, 0.50,
    0.52, 0.54, 0.56, 0.57,
    0.58, 0.60, 0.62, 0.63,
    0.64, 0.66, 0.68, 0.70,
    0.68, 0.70, 0.72, 0.73,
    0.71, 0.72, 0.73, 0.74,
    0.66, 0.67, 0.68, 0.69,
    0.60, 0.61, 0.62, 0.63,
    0.54, 0.55, 0.56, 0.57,
    0.46, 0.47, 0.48, 0.49,
    0.38, 0.39, 0.40, 0.41,
    0.32, 0.33, 0.34, 0.35,
    0.29, 0.30, 0.30, 0.31,
    0.25, 0.26, 0.26, 0.27,
    0.21, 0.22, 0.22, 0.23
  ];

  const baseHeatmap = [
    [0.08, 0.07, 0.06, 0.05, 0.05, 0.06, 0.10, 0.16, 0.24, 0.35, 0.48, 0.55, 0.62, 0.68, 0.72, 0.66, 0.58, 0.46, 0.36, 0.28, 0.22, 0.18, 0.14, 0.10],
    [0.09, 0.08, 0.07, 0.06, 0.06, 0.07, 0.11, 0.18, 0.27, 0.38, 0.51, 0.58, 0.65, 0.70, 0.75, 0.69, 0.60, 0.48, 0.38, 0.30, 0.24, 0.19, 0.15, 0.11],
    [0.10, 0.09, 0.08, 0.07, 0.07, 0.08, 0.12, 0.20, 0.30, 0.43, 0.56, 0.63, 0.70, 0.74, 0.78, 0.73, 0.64, 0.51, 0.41, 0.32, 0.26, 0.21, 0.16, 0.12],
    [0.09, 0.08, 0.07, 0.06, 0.06, 0.07, 0.11, 0.19, 0.29, 0.40, 0.53, 0.60, 0.67, 0.71, 0.75, 0.70, 0.61, 0.49, 0.39, 0.31, 0.25, 0.20, 0.16, 0.12],
    [0.11, 0.10, 0.09, 0.08, 0.08, 0.09, 0.14, 0.22, 0.33, 0.46, 0.59, 0.67, 0.74, 0.79, 0.83, 0.78, 0.69, 0.56, 0.45, 0.36, 0.29, 0.23, 0.18, 0.14],
    [0.07, 0.06, 0.05, 0.05, 0.05, 0.06, 0.09, 0.14, 0.20, 0.28, 0.40, 0.46, 0.52, 0.56, 0.58, 0.53, 0.45, 0.35, 0.27, 0.20, 0.16, 0.12, 0.10, 0.08],
    [0.06, 0.05, 0.05, 0.04, 0.04, 0.05, 0.08, 0.13, 0.18, 0.26, 0.36, 0.42, 0.48, 0.51, 0.53, 0.49, 0.41, 0.32, 0.24, 0.18, 0.14, 0.11, 0.09, 0.07]
  ];

  const scaleSeries = (series, factor, bias = 0) => series.map((value) => clamp(value * factor + bias, 0.04, 0.95));
  const scaleHeatmap = (heatmap, factor, bias = 0) => heatmap.map((row) => row.map((value) => clamp(value * factor + bias, 0, 1)));

  const cameras = [
    {
      id: 'cam-entrance',
      name: '공학관 9층 출입구',
      location: '공학관 동측 9F S-구역',
      status: { label: '혼잡', tone: 'danger' },
      posterAccent: '#2b6ef2',
      live: {
        caption: '라이브 영상 14:36:18 기준',
        overlays: {
          boxes: [
            { x: 0.12, y: 0.18, width: 0.28, height: 0.45, label: '주 출입구' },
            { x: 0.52, y: 0.22, width: 0.20, height: 0.38, label: '계단 상단' },
            { x: 0.40, y: 0.62, width: 0.18, height: 0.30, label: '엘리베이터' }
          ],
          hotspots: [
            { x: 0.56, y: 0.32, radius: 0.22, intensity: 0.8 },
            { x: 0.28, y: 0.58, radius: 0.18, intensity: 0.6 },
            { x: 0.68, y: 0.64, radius: 0.16, intensity: 0.5 }
          ]
        }
      },
      metrics: {
        timestamp: '2025-09-30 14:36:18',
        congestion: 0.68,
        yesterday: 0.52,
        lastWeek: 0.41,
        roc: 2.9,
        acc: 1.2,
        durationSec: 1164,
        allTimeHigh: 0.87,
        athMeta: '최고 기록 대비 9%p 여유',
        predictiveAlert: '경고: 동측 출입로 혼잡 증가세 감지 (혼잡도 68%, 가속도 +1.2)',
        anomaly: { normalMin: 0.45, normalMax: 0.60 },
        riskIndex: 78,
        riskGrade: '경고',
        riskMeta: '밀집도 68% · 변동률 +2.9 · 가속도 +1.2 · 위험 지속 00:19:24',
        alerts: [
          { ts: '13:47:30', type: '경고', message: '동측 출입로 혼잡도가 72%까지 급증' },
          { ts: '13:22:14', type: '주의', message: '계단 상단에서 3분 이상 체류 감지' },
          { ts: '12:58:03', type: '주의', message: '양방향 통행 교차 증가로 흐름 저하' },
          { ts: '12:11:49', type: '알림', message: '엘리베이터 대기행렬 길이 9m 도달' },
          { ts: '11:36:22', type: '알림', message: '외부 우회동선으로 유입량 증가' }
        ]
      },
      series: baseSeries,
      heatmap: baseHeatmap,
    },
    {
      id: 'cam-rotunda',
      name: '정문 로터리',
      location: '본관 앞 로터리 광장',
      status: { label: '주의', tone: 'warning' },
      posterAccent: '#f97316',
      live: {
        caption: '라이브 영상 14:34:02 기준',
        overlays: {
          boxes: [
            { x: 0.18, y: 0.26, width: 0.24, height: 0.42, label: '보행자 흐름' },
            { x: 0.58, y: 0.18, width: 0.26, height: 0.34, label: '차량 진입' }
          ],
          hotspots: [
            { x: 0.44, y: 0.36, radius: 0.24, intensity: 0.65 },
            { x: 0.68, y: 0.52, radius: 0.18, intensity: 0.55 }
          ]
        }
      },
      metrics: {
        timestamp: '2025-09-30 14:34:02',
        congestion: 0.54,
        yesterday: 0.47,
        lastWeek: 0.38,
        roc: 1.6,
        acc: 0.6,
        durationSec: 804,
        allTimeHigh: 0.81,
        athMeta: '사상 최고치 대비 27%p 감소',
        predictiveAlert: '주의: 차량 진입 증가로 혼잡도 상승 예상 (혼잡도 54%)',
        anomaly: { normalMin: 0.40, normalMax: 0.55 },
        riskIndex: 58,
        riskGrade: '주의',
        riskMeta: '밀집도 54% · 변동률 +1.6 · 가속도 +0.6 · 위험 지속 00:13:24',
        alerts: [
          { ts: '13:18:11', type: '주의', message: '셔틀버스 도착으로 군집 밀도 상승' },
          { ts: '12:43:05', type: '알림', message: '보행자 대기열이 횡단보도까지 확장' },
          { ts: '12:06:48', type: '알림', message: '차량 회전 대기 3대 이상 감지' }
        ]
      },
      series: scaleSeries(baseSeries, 0.82, -0.04),
      heatmap: scaleHeatmap(baseHeatmap, 0.85, -0.06),
    },
    {
      id: 'cam-library',
      name: '학생회관 남측 로비',
      location: '학생회관 1F 남측 로비',
      status: { label: '안정', tone: 'neutral' },
      posterAccent: '#10b981',
      live: {
        caption: '라이브 영상 14:29:44 기준',
        overlays: {
          boxes: [
            { x: 0.32, y: 0.30, width: 0.22, height: 0.34, label: '무인 안내데스크' },
            { x: 0.60, y: 0.48, width: 0.20, height: 0.28, label: '휴게존' }
          ],
          hotspots: [
            { x: 0.30, y: 0.46, radius: 0.20, intensity: 0.35 },
            { x: 0.62, y: 0.56, radius: 0.16, intensity: 0.28 }
          ]
        }
      },
      metrics: {
        timestamp: '2025-09-30 14:29:44',
        congestion: 0.31,
        yesterday: 0.29,
        lastWeek: 0.34,
        roc: -0.4,
        acc: -0.2,
        durationSec: 216,
        allTimeHigh: 0.62,
        athMeta: '최고 기록 대비 31%p 여유',
        predictiveAlert: '',
        anomaly: { normalMin: 0.25, normalMax: 0.40 },
        riskIndex: 32,
        riskGrade: '안정',
        riskMeta: '밀집도 31% · 변동률 -0.4 · 가속도 -0.2 · 위험 지속 00:03:36',
        alerts: [
          { ts: '13:04:22', type: '알림', message: '무인 안내데스크 앞 대기 2분 이상' },
          { ts: '12:32:08', type: '알림', message: '학생증 인증 지연 3건 발생' }
        ]
      },
      series: scaleSeries(baseSeries, 0.64, -0.18),
      heatmap: scaleHeatmap(baseHeatmap, 0.6, -0.12),
    }
  ];

  const state = {
    cameras,
    current: cameras[0],
    showBBox: false,
    showHeat: false,
  };

  const selectEl = document.querySelector('[data-role="camera-select"]');
  const mediaPoster = $('#mediaPoster');
  const overlayCanvas = $('#overlay');
  const toggleBBox = $('#toggleBBox');
  const toggleHeat = $('#toggleHeat');

  function init() {
    populateSelect();
    bindEvents();
    renderPage();
  }

  function populateSelect() {
    if (!selectEl) return;
    selectEl.innerHTML = state.cameras.map((camera) => `<option value="${camera.id}">${camera.name}</option>`).join('');
    selectEl.value = state.current.id;
  }

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
    window.addEventListener('resize', () => {
      renderOverlays();
    });
  }

  function setCamera(id) {
    const next = state.cameras.find((camera) => camera.id === id) || state.cameras[0];
    state.current = next;
    renderPage();
  }

  function renderPage() {
    renderHeader();
    renderKPIs();
    renderAlerts();
    renderAnomaly();
    renderSeries();
    renderCalendar();
    renderPoster();
    syncOverlayControls();
    renderOverlays();
  }

  function renderHeader() {
    const camera = state.current;
    const nameEl = document.querySelector('[data-role="camera-name"]');
    const locationEl = document.querySelector('[data-role="camera-location"]');
    const statusEl = document.querySelector('[data-role="camera-status"]');
    const captionEl = document.querySelector('[data-role="live-caption"]');
    if (nameEl) nameEl.textContent = camera.name;
    if (locationEl) locationEl.textContent = camera.location;
    if (statusEl) {
      statusEl.textContent = camera.status.label;
      statusEl.className = `chip status-chip chip--${camera.status.tone}`;
    }
    if (captionEl) captionEl.textContent = camera.live.caption;
    if (selectEl) selectEl.value = camera.id;
  }

  function renderPoster() {
    if (mediaPoster) {
      mediaPoster.src = createPoster(state.current.posterAccent);
    }
    const tsEl = $('#statusTimestamp');
    if (tsEl) tsEl.textContent = state.current.metrics.timestamp;
  }

  function renderKPIs() {
    const { metrics, series } = state.current;
    const pct = Math.round(metrics.congestion * 100);
    const gaugeText = $('#gaugeText');
    if (gaugeText) gaugeText.textContent = `${pct}%`;
    const gaugeArc = $('#gaugeArc');
    if (gaugeArc) {
      const circumference = 2 * Math.PI * 48;
      gaugeArc.setAttribute('stroke-dasharray', `${circumference * metrics.congestion} ${circumference}`);
    }
    const currentEl = $('#currentCongestion');
    if (currentEl) currentEl.textContent = `${pct}%`;
    renderSparkline((series || []).slice(-20));
    const gradeEl = $('#grade');
    if (gradeEl) {
      const grade = metrics.congestion >= 0.6 ? '위험' : metrics.congestion >= 0.3 ? '주의' : '안전';
      gradeEl.textContent = `위급 ${grade}`;
    }
    const yesterdayPct = Math.round(metrics.yesterday * 100);
    const lastWeekPct = Math.round(metrics.lastWeek * 100);
    const yesterdayEl = $('#compYesterday');
    if (yesterdayEl) yesterdayEl.textContent = `${yesterdayPct}%`;
    const lastWeekEl = $('#compLastWeek');
    if (lastWeekEl) lastWeekEl.textContent = `${lastWeekPct}%`;
    const deltaYesterday = $('#deltaYesterday');
    if (deltaYesterday) setDelta(deltaYesterday, pct - yesterdayPct);
    const deltaLastWeek = $('#deltaLastWeek');
    if (deltaLastWeek) setDelta(deltaLastWeek, pct - lastWeekPct);
    const durationEl = $('#duration');
    if (durationEl) durationEl.textContent = formatHMS(metrics.durationSec);
    const rocEl = $('#roc');
    if (rocEl) rocEl.textContent = metrics.roc.toFixed(1);
    const accEl = $('#acc');
    if (accEl) accEl.textContent = metrics.acc.toFixed(1);
    const highEl = $('#allTimeHigh');
    if (highEl) highEl.textContent = `${Math.round(metrics.allTimeHigh * 100)}%`;
    const ratioEl = $('#athRatio');
    if (ratioEl) ratioEl.textContent = `${Math.round((metrics.congestion / metrics.allTimeHigh) * 100)}%`;
    const metaEl = $('#athMeta');
    if (metaEl) metaEl.textContent = metrics.athMeta;
    
    const riskArc = $('#riskArc');
    if (riskArc) {
      const circumference = 2 * Math.PI * 48;
      riskArc.setAttribute('stroke-dasharray', `${circumference * (metrics.riskIndex / 100)} ${circumference}`);
    }
    const riskText = $('#riskText');
    if (riskText) riskText.textContent = String(Math.round(metrics.riskIndex));
    
    const riskGrade = $('#riskGrade');
    if (riskGrade) {
        riskGrade.textContent = metrics.riskGrade;
        let tone = 'normal';
        if (metrics.riskGrade === '경고' || metrics.riskGrade === '위험') {
            tone = 'danger';
        } else if (metrics.riskGrade === '주의') {
            tone = 'warning';
        }
        riskGrade.className = `grade grade--${tone}`;
    }

    // --- New Risk Factors Logic ---
    // 1. Congestion
    const factorCongestionVal = document.querySelector('#factorCongestion .factor-value');
    const factorCongestionStatus = document.querySelector('#factorCongestion .factor-status');
    if (factorCongestionVal) factorCongestionVal.textContent = `${Math.round(metrics.congestion * 100)}%`;
    if (factorCongestionStatus) {
        let status, tone;
        if (metrics.congestion >= 0.6) { status = '높음'; tone = 'high'; }
        else if (metrics.congestion >= 0.3) { status = '주의'; tone = 'warn'; }
        else { status = '낮음'; tone = 'normal'; }
        factorCongestionStatus.textContent = status;
        factorCongestionStatus.className = `factor-status ${tone}`;
    }

    // 2. Rate of Change (ROC)
    const factorRocVal = document.querySelector('#factorRoc .factor-value');
    const factorRocStatus = document.querySelector('#factorRoc .factor-status');
    if (factorRocVal) factorRocVal.textContent = `${metrics.roc > 0 ? '+' : ''}${metrics.roc.toFixed(1)}%`;
    if (factorRocStatus) {
        let status, tone;
        if (metrics.roc > 1.0) { status = '증가'; tone = 'increasing'; }
        else if (metrics.roc < -1.0) { status = '감소'; tone = 'decreasing'; }
        else { status = '안정'; tone = 'stable'; }
        factorRocStatus.textContent = status;
        factorRocStatus.className = `factor-status ${tone}`;
    }

    // 3. Duration
    const factorDurationVal = document.querySelector('#factorDuration .factor-value');
    const factorDurationStatus = document.querySelector('#factorDuration .factor-status');
    if (factorDurationVal) factorDurationVal.textContent = formatHMS(metrics.durationSec);
    if (factorDurationStatus) {
        let status, tone;
        if (metrics.durationSec > 1800) { status = '김'; tone = 'long'; } // 30 mins
        else if (metrics.durationSec > 600) { status = '보통'; tone = 'warn'; } // 10 mins
        else { status = '짧음'; tone = 'normal'; }
        factorDurationStatus.textContent = status;
        factorDurationStatus.className = `factor-status ${tone}`;
    }

    // 4. Anomaly
    const factorAnomalyStatus = document.querySelector('#factorAnomaly .factor-status');
    if (factorAnomalyStatus) {
        const isAnomaly = metrics.congestion < metrics.anomaly.normalMin || metrics.congestion > metrics.anomaly.normalMax;
        let status, tone;
        if (isAnomaly) { status = '감지됨'; tone = 'detected'; }
        else { status = '해당 없음'; tone = 'normal'; }
        factorAnomalyStatus.textContent = status;
        factorAnomalyStatus.className = `factor-status ${tone}`;
    }
  }

  function renderAlerts() {
    const { metrics } = state.current;
    const predictiveAlert = $('#predictiveAlert');
    if (predictiveAlert) {
      predictiveAlert.textContent = metrics.predictiveAlert || '현재 예측 경보 없음.';
    }
    const tableBody = document.querySelector('#alertTable tbody');
    if (tableBody) {
      tableBody.innerHTML = metrics.alerts.map((alert) => `
        <tr>
          <td>${alert.ts}</td>
          <td>${alert.type}</td>
          <td>${alert.message}</td>
        </tr>
      `).join('');
    }
  }

  function renderAnomaly() {
    const { congestion, anomaly } = state.current.metrics;
    if (!anomaly) return;

    const statusEl = $('#anomalyStatus');
    const rangeEl = $('#anomalyRange');
    const valueEl = $('#anomalyValue');
    const currentValEl = $('#anomalyCurrentVal');
    const normalRangeEl = $('#anomalyNormalRange');
    const deviationEl = $('#anomalyDeviation');

    if (!statusEl || !rangeEl || !valueEl || !currentValEl || !normalRangeEl || !deviationEl) return;

    const { normalMin, normalMax } = anomaly;
    const isAnomaly = congestion < normalMin || congestion > normalMax;

    // 1. Update Status Chip
    const status = isAnomaly ? (congestion > normalMax ? '높음' : '낮음') : '정상';
    const tone = isAnomaly ? 'danger' : 'neutral';
    statusEl.textContent = status;
    statusEl.className = `chip chip--${tone}`;

    // 2. Update Bullet Graph
    const rangeLeft = normalMin * 100;
    const rangeWidth = (normalMax - normalMin) * 100;
    rangeEl.style.left = `${rangeLeft}%`;
    rangeEl.style.width = `${rangeWidth}%`;

    const valueLeft = congestion * 100;
    valueEl.style.left = `calc(${valueLeft}% - 2px)`; // center the 4px marker
    valueEl.classList.toggle('is-anomaly', isAnomaly);

    // 3. Update Text Details
    currentValEl.textContent = `${Math.round(congestion * 100)}%`;
    normalRangeEl.textContent = `${Math.round(normalMin * 100)}% ~ ${Math.round(normalMax * 100)}%`;

    if (isAnomaly) {
        const diff = congestion > normalMax 
            ? congestion - normalMax 
            : normalMin - congestion;
        const diffPct = Math.round(diff * 100);
        const direction = congestion > normalMax ? '높음' : '낮음';
        deviationEl.textContent = `정상 범위보다 ${diffPct}%p ${direction}`;
        deviationEl.classList.add('is-anomaly');
    } else {
        deviationEl.textContent = '정상 범위 내에 있습니다.';
        deviationEl.classList.remove('is-anomaly');
    }
  }

  function renderSparkline(data) {
    const svg = document.getElementById('statusSpark');
    const deltaEl = document.getElementById('sparkDelta');
    if (!svg) return;
    const points = (data || []).filter((value) => typeof value === 'number');
    if (points.length < 2) {
      svg.innerHTML = '';
      if (deltaEl) setDelta(deltaEl, 0);
      return;
    }
    const slice = points.slice(-20);
    const container = svg.parentElement;
    let width = 0;
    if (container) {
      const rect = container.getBoundingClientRect();
      width = rect.width || 0;
    }
    if (!width) {
      width = svg.clientWidth || 160;
    }
    width = Math.max(140, Math.round(width));
    const height = 48;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    const range = (max - min) || 1;
    const step = width / Math.max(1, (slice.length - 1));
    const coords = slice.map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * (height - 10) - 3;
      return { x, y };
    });
    const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
    const lastPoint = coords[coords.length - 1];
    const areaPath = `M0,${height} ` + coords.map((point) => `L${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ') + ` L${lastPoint.x.toFixed(2)},${height} Z`;
    const diff = slice[slice.length - 1] - slice[0];
    const diffPct = Math.round(diff * 100);
    if (deltaEl) setDelta(deltaEl, diffPct);
    const stroke = diff >= 0 ? '#2563eb' : '#059669';
    const fill = diff >= 0 ? 'rgba(37, 99, 235, 0.18)' : 'rgba(5, 150, 105, 0.20)';
    svg.innerHTML = `<path d="${areaPath}" fill="${fill}" stroke="none"/>`
      + `<path d="${line}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<circle cx="${lastPoint.x.toFixed(2)}" cy="${lastPoint.y.toFixed(2)}" r="2.6" fill="#ffffff" stroke="${stroke}" stroke-width="1.4"/>`;
  }

  function renderSeries() {
    const seriesContainer = $('#seriesChart');
    if (!seriesContainer) return;
    const rect = seriesContainer.getBoundingClientRect();
    const width = Math.max(320, rect.width || seriesContainer.clientWidth || 600) - 12;
    const height = Math.max(160, rect.height || seriesContainer.clientHeight || 200) - 12;
    const pad = 6;
    const xs = pad;
    const ys = pad;
    const xe = width - pad;
    const ye = height - pad;
    const data = state.current.series;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((value, index) => {
      const x = xs + (index / (data.length - 1)) * (xe - xs);
      const y = ye - ((value - min) / range) * (ye - ys);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const last = data[data.length - 1];
    const topColor = last >= 0.6 ? '#fee2e2' : last >= 0.3 ? '#fff7ed' : '#e0f2fe';
    const guideLines = [0.3, 0.6].map((value) => {
      const y = ye - ((value - min) / range) * (ye - ys);
      const color = value === 0.6 ? '#fecaca' : '#fde68a';
      return `<line x1='${xs}' y1='${y}' x2='${xe}' y2='${y}' stroke='${color}' stroke-dasharray='4 6'/>`;
    }).join('');
    seriesContainer.innerHTML = `
      <svg width='100%' height='100%' viewBox='0 0 ${width} ${height}'>
        <defs>
          <linearGradient id='seriesGrad' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stop-color='${topColor}'/>
            <stop offset='100%' stop-color='#ffffff'/>
          </linearGradient>
        </defs>
        <rect x='0' y='0' width='${width}' height='${height}' fill='url(#seriesGrad)' rx='10'/>
        ${guideLines}
        <polyline fill='none' stroke='#2b6ef2' stroke-width='2.2' points='${points}' stroke-linecap='round' stroke-linejoin='round'/>
      </svg>
    `;
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
    if (value >= 0.72) return '#fecaca';
    if (value >= 0.55) return '#fde68a';
    if (value >= 0.35) return '#dbeafe';
    return '#f3f4f6';
  }

  function renderOverlays() {
    if (!overlayCanvas) return;
    const { boxes = [], hotspots = [] } = state.current.live.overlays || {};
    const rect = overlayCanvas.getBoundingClientRect();
    const width = Math.max(320, rect.width || overlayCanvas.clientWidth || 640);
    const height = Math.max(180, rect.height || overlayCanvas.clientHeight || 360);
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    if (state.showHeat) {
      hotspots.forEach((spot) => {
        const x = spot.x * width;
        const y = spot.y * height;
        const radius = spot.radius * Math.min(width, height);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(239, 68, 68, 0.35)`);
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    if (state.showBBox) {
      ctx.lineWidth = 2;
      ctx.font = '12px "Inter", system-ui, sans-serif';
      boxes.forEach((box) => {
        const x = box.x * width;
        const y = box.y * height;
        const w = box.width * width;
        const h = box.height * height;
        ctx.strokeStyle = '#1d4ed8';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.35)';
        ctx.fillRect(x, y + h - 10, w, 10);
        if (box.label) {
          const padding = 6;
          const text = box.label;
          const labelWidth = ctx.measureText(text).width + padding * 2;
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(x, y - 20, labelWidth, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x + padding, y - 6);
        }
      });
    }
  }

  function syncOverlayControls() {
    if (toggleBBox) toggleBBox.classList.toggle('is-active', state.showBBox);
    if (toggleHeat) toggleHeat.classList.toggle('is-active', state.showHeat);
  }

  function setDelta(element, diff) {
    if (!element) return;
    let tone = 'flat';
    let text = '0p →';
    if (diff > 0) {
      tone = 'up';
      text = `+${diff}p ↑`;
    } else if (diff < 0) {
      tone = 'down';
      text = `${diff}p ↓`;
    }
    element.textContent = text;
    element.className = `delta ${tone}`;
    const amount = Math.abs(diff);
    const label = tone === 'flat' ? '변화 없음' : tone === 'up' ? `현재가 ${amount}p 높습니다` : `현재가 ${amount}p 낮습니다`;
    element.setAttribute('aria-label', label);
  }

  init();
});