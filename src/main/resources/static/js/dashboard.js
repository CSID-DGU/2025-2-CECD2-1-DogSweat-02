const rotationConfig = {
  intervalMs: 30000,
  countdownStep: 1000
};

const state = {
  index: 0,
  auto: true,
  countdown: rotationConfig.intervalMs / 1000,
  rotationTimer: null,
  countdownTimer: null
};

const getEl = role => document.querySelector(`[data-role="${role}"]`);

function renderCameraList() {
    const listEl = getEl('camera-list');
    listEl.innerHTML = '';
    cameraData.forEach((camera, index) => {
        const item = document.createElement('li');
        item.className = 'camera-list__item';
        item.dataset.cameraId = camera.id;

        const link = document.createElement('a');
        link.href = `/analysis?id=${camera.id}`;
        link.className = 'camera-list__link';
        link.innerHTML = `
            <span class="camera-list__name">${camera.name}</span>
            <span class="camera-list__status camera-list__status--${camera.status.tone}">${camera.status.label}</span>
        `;

        item.appendChild(link);
        listEl.appendChild(item);
    });
}

function renderCamera(camera) {
  const nameEl = getEl('camera-name');
  nameEl.innerHTML = '';
  const link = document.createElement('a');
  link.href = `/analysis?id=${camera.id}`;
  link.className = 'camera-name__link';
  link.textContent = camera.name;
  nameEl.appendChild(link);

  getEl('camera-location').textContent = camera.location;
  const statusEl = getEl('camera-status');
  statusEl.textContent = camera.status.label;
  statusEl.className = `camera-stage__status camera-stage__status--${camera.status.tone}`;

  renderView('live', camera.live);
  renderView('snapshot', camera.snapshot);

  getEl('metric-density').textContent = camera.metrics.density;
  applyTone(getEl('metric-change'), camera.metrics.change);
  applyTone(getEl('metric-accel'), camera.metrics.accel);
  getEl('camera-info').querySelector('dt:last-of-type').textContent = camera.metrics.durationLabel;
  getEl('metric-duration').textContent = camera.metrics.duration;

  const tagsRoot = getEl('camera-tags');
  tagsRoot.innerHTML = '';
  camera.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = `chip chip--${tag.tone}`;
    span.textContent = tag.text;
    tagsRoot.appendChild(span);
  });

  getEl('camera-message').textContent = camera.message;

  const timelineRoot = getEl('camera-timeline');
  timelineRoot.innerHTML = '';
  camera.timeline.forEach(entry => {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = entry.time;
    li.appendChild(time);
    li.append(entry.text);
    timelineRoot.appendChild(li);
  });

  updateActiveListItem(camera.id);
  updateRotationText();
}

function updateActiveListItem(activeId) {
    const listItems = document.querySelectorAll('[data-role="camera-list"] [data-camera-id]');
    listItems.forEach(item => {
        item.classList.toggle('camera-list__item--active', item.dataset.cameraId === activeId);
    });
}

function renderView(prefix, data) {
  const overlayRoot = getEl(`${prefix}-overlay`);
  overlayRoot.innerHTML = '';
  (data.overlay || []).forEach(box => {
    const span = document.createElement('span');
    span.className = `bbox bbox--${box.type}`;
    span.style.setProperty('--x', box.x);
    span.style.setProperty('--y', box.y);
    span.style.setProperty('--w', box.w);
    span.style.setProperty('--h', box.h);
    span.textContent = box.text;
    overlayRoot.appendChild(span);
  });
  getEl(`${prefix}-caption`).textContent = data.caption;
}

function applyTone(element, metric) {
  element.textContent = metric.value;
  element.className = metric.tone ? metric.tone : '';
}

function updateRotationText() {
  const count = cameraData.length;
  const idx = state.index + 1;
  const remaining = Math.max(state.countdown, 0);
  getEl('rotation-interval').textContent = state.auto
    ? `현재 카메라 ${String(idx).padStart(2, '0')}/${String(count).padStart(2, '0')} · 남은 시간 ${String(remaining).padStart(2, '0')}초`
    : `수동 제어 중 · 카메라 ${String(idx).padStart(2, '0')}/${String(count).padStart(2, '0')}`;
  getEl('rotation-mode').textContent = state.auto ? '자동' : '수동';
  const indicator = getEl('rotation-indicator');
  indicator.textContent = state.auto ? 'AUTO' : 'HOLD';
  indicator.className = state.auto ? 'rotation-indicator rotation-indicator--auto' : 'rotation-indicator';
  getEl('rotation-note').textContent = state.auto
    ? '30초마다 1대씩 순환 중 · 모든 카메라 자동 노출'
    : '사용자 조작으로 자동 순환이 일시정지되었습니다';
  document.querySelector('[data-action="toggle"]').textContent = state.auto ? '수동 제어 모드' : '자동 재생 재개';
}

function showCamera(index) {
  state.index = (index + cameraData.length) % cameraData.length;
  state.countdown = rotationConfig.intervalMs / 1000;
  renderCamera(cameraData[state.index]);
  restartTimers();
}

function nextCamera() {
  showCamera(state.index + 1);
}

function prevCamera() {
  showCamera(state.index - 1);
}

function restartTimers() {
  clearTimeout(state.rotationTimer);
  clearInterval(state.countdownTimer);

  if (!state.auto) {
    updateRotationText();
    return;
  }

  state.countdownTimer = setInterval(() => {
    state.countdown -= 1;
    if (state.countdown <= 0) {
      state.countdown = 0;
      clearInterval(state.countdownTimer);
    }
    updateRotationText();
  }, rotationConfig.countdownStep);

  state.rotationTimer = setTimeout(() => {
    nextCamera();
  }, rotationConfig.intervalMs);
}

function enterManualMode() {
  if (!state.auto) return;
  state.auto = false;
  clearTimeout(state.rotationTimer);
  clearInterval(state.countdownTimer);
  updateRotationText();
}

function toggleMode() {
  state.auto = !state.auto;
  if (state.auto) {
    state.countdown = rotationConfig.intervalMs / 1000;
    restartTimers();
  } else {
    clearTimeout(state.rotationTimer);
    clearInterval(state.countdownTimer);
    updateRotationText();
  }
}

function bindControls() {
  document.querySelector('[data-action="next"]').addEventListener('click', () => {
    enterManualMode();
    nextCamera();
  });
  document.querySelector('[data-action="prev"]').addEventListener('click', () => {
    enterManualMode();
    prevCamera();
  });
  document.querySelector('[data-action="toggle"]').addEventListener('click', toggleMode);

  const handleUserInteraction = () => {
    enterManualMode();
    document.removeEventListener('pointerdown', handleUserInteraction);
    document.removeEventListener('keydown', handleUserInteraction);
  };
  document.addEventListener('pointerdown', handleUserInteraction);
  document.addEventListener('keydown', handleUserInteraction);
}

function tickClock() {
  const clock = getEl('clock');
  if (!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  }) + ' 기준';
}

function init() {
  if (!document.querySelector('[data-role="camera-stage"]')) return;
  renderCameraList();
  bindControls();
  showCamera(0);
  tickClock();
  setInterval(tickClock, 1000);
}

document.addEventListener('DOMContentLoaded', init);
