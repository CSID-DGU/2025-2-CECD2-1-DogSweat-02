document.addEventListener('DOMContentLoaded', () => {
    const cameras = window.cameraData || [];

    const cameraChecklist = document.getElementById('cameraChecklist');
    const cameraSearch = document.getElementById('cameraSearch');
    const dateRangeSelector = document.getElementById('dateRangeSelector');
    const runAnalysisBtn = document.getElementById('runAnalysisBtn');
    const hotspotList = document.getElementById('hotspotList');
    const volatilityList = document.getElementById('volatilityList');
    const chartLegend = document.getElementById('chartLegend');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');

    let comparisonChart = null;
    const chartColors = ['#0f62fe', '#ff7c00', '#16a34a', '#ef4444', '#6366f1', '#f59e0b', '#8b5cf6'];

    // 1. 초기 UI 렌더링
    function renderCameraList(filter = '') {
        cameraChecklist.innerHTML = '';
        cameras
            .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
            .forEach(camera => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <label>
                        <input type="checkbox" name="cameraSelect" value="${camera.id}">
                        <span>${camera.name}</span>
                    </label>
                `;
                cameraChecklist.appendChild(div);
            });
    }

    // 2. 데이터 생성 및 통계 계산 (Mock)
    function generateMockSeries(days) {
        const data = [];
        const points = days * 24; // 시간별 데이터
        let value = Math.random() * 50;
        for (let i = 0; i < points; i++) {
            value += (Math.random() - 0.5) * 10;
            value = Math.max(0, Math.min(100, value));
            data.push(value);
        }
        return data;
    }

    function calculateStats() {
        const stats = cameras.map(camera => {
            const series = generateMockSeries(30); // 30일 기준 데이터
            const peak = Math.max(...series);
            const mean = series.reduce((a, b) => a + b, 0) / series.length;
            const variance = series.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / series.length;
            const stdDev = Math.sqrt(variance);
            return { ...camera, peak, stdDev, series };
        });

        stats.sort((a, b) => b.peak - a.peak);
        hotspotList.innerHTML = stats.slice(0, 5).map((s, i) => `<li><span class="rank">${i+1}</span><span class="item-name">${s.name}</span><span class="item-value">${s.peak.toFixed(1)}%</span></li>`).join('');

        stats.sort((a, b) => b.stdDev - a.stdDev);
        volatilityList.innerHTML = stats.slice(0, 5).map((s, i) => `<li><span class="rank">${i+1}</span><span class="item-name">${s.name}</span><span class="item-value">${s.stdDev.toFixed(2)}</span></li>`).join('');
        
        return stats;
    }

    const cameraStats = calculateStats();

    // 3. 차트 렌더링
    function renderChart() {
        const selectedCameras = Array.from(document.querySelectorAll('input[name="cameraSelect"]:checked')).map(cb => cb.value);
        const days = parseInt(dateRangeSelector.value);

        if (selectedCameras.length === 0) {
            alert('비교할 카메라를 1개 이상 선택하세요.');
            return;
        }

        const datasets = selectedCameras.map((id, index) => {
            const camStat = cameraStats.find(s => s.id == id);
            const color = chartColors[index % chartColors.length];
            return {
                label: camStat.name,
                data: camStat.series.slice(0, days * 24),
                borderColor: color,
                backgroundColor: `${color}33`,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2.5
            };
        });

        const labels = Array.from({ length: days * 24 }, (_, i) => `${i % 24}h`);

        if (comparisonChart) {
            comparisonChart.destroy();
        }

        comparisonChart = new Chart('comparisonChart', {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: '#f0f0f0' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }, // 커스텀 범례 사용
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });

        renderLegend(datasets);
    }

    function renderLegend(datasets) {
        chartLegend.innerHTML = datasets.map(d => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${d.borderColor}"></div>
                <span>${d.label}</span>
            </div>
        `).join('');
    }

    // 4. 이벤트 리스너
    cameraSearch.addEventListener('input', (e) => renderCameraList(e.target.value));
    runAnalysisBtn.addEventListener('click', renderChart);

    selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#cameraChecklist input[type="checkbox"]').forEach(cb => cb.checked = true);
    });

    deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('#cameraChecklist input[type="checkbox"]').forEach(cb => cb.checked = false);
    });

    // 초기화
    renderCameraList();
    renderChart(); // 초기 차트 렌더링 (선택된 것 없으면 아무것도 안나옴)
});
