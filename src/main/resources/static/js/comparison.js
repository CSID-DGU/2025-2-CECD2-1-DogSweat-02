document.addEventListener('DOMContentLoaded', () => {
    const cameraChecklist = document.getElementById('cameraChecklist');
    const cameraSearch = document.getElementById('cameraSearch');
    const dateRangeSelector = document.getElementById('dateRangeSelector');
    const runAnalysisBtn = document.getElementById('runAnalysisBtn');
    const hotspotList = document.getElementById('hotspotList');
    const volatilityList = document.getElementById('volatilityList');
    const chartLegend = document.getElementById('chartLegend');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const chartCanvas = document.getElementById('comparisonChart');
    const chartPlaceholder = document.getElementById('chartPlaceholder');

    let comparisonChart = null;
    const chartColors = ['#0f62fe', '#ff7c00', '#16a34a', '#ef4444', '#6366f1', '#f59e0b', '#8b5cf6', '#00a2c7', '#ba4e00', '#d2184b'];

    // 1. 검색 기능 (DOM 필터링)
    function filterCameraList(filterText) {
        const items = cameraChecklist.querySelectorAll('div');
        items.forEach(item => {
            const label = item.querySelector('span');
            if (label) {
                const name = label.textContent || label.innerText;
                item.style.display = name.toLowerCase().includes(filterText.toLowerCase()) ? '' : 'none';
            }
        });
    }

    // 2. 차트 렌더링 (API 호출 및 Chart.js 사용)
    async function renderChart() {
        const selectedCheckboxes = Array.from(document.querySelectorAll('input[name="cameraSelect"]:checked'));
        const selectedCameras = selectedCheckboxes.map(cb => ({
            id: cb.value,
            name: cb.nextElementSibling.textContent
        }));
        
        if (selectedCameras.length === 0) {
            chartCanvas.style.display = 'none';
            chartPlaceholder.style.display = 'flex';
            chartPlaceholder.innerHTML = `<p>좌측 패널에서 비교할 카메라를 1개 이상 선택하고<br>'분석 실행' 버튼을 눌러주세요.</p>`;
            if (comparisonChart) {
                comparisonChart.destroy();
                comparisonChart = null;
            }
            chartLegend.innerHTML = '';
            return;
        }

        chartCanvas.style.display = 'none';
        chartPlaceholder.style.display = 'flex';
        chartPlaceholder.innerHTML = '<p>데이터를 불러오는 중입니다...</p>';

        const days = parseInt(dateRangeSelector.value);
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);

        const toISOStringWithTimezone = (date) => {
            const pad = (num) => String(num).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };
        
        const startStr = toISOStringWithTimezone(start);
        const endStr = toISOStringWithTimezone(end);

        try {
            const fetchPromises = selectedCameras.map(cam =>
                fetch(`/api/v1/cameras/${cam.id}/density-history?start=${startStr}&end=${endStr}`)
                    .then(res => {
                        if (!res.ok) throw new Error(`Camera ${cam.id} fetch failed`);
                        return res.json();
                    })
            );

            const results = await Promise.all(fetchPromises);

            const datasets = results.map((data, index) => {
                const cam = selectedCameras[index];
                const color = chartColors[index % chartColors.length];
                return {
                    label: cam.name,
                    data: data.map(d => d.density),
                    borderColor: color,
                    backgroundColor: `${color}33`,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2.5
                };
            });

            // Use the first dataset's timestamps for labels
            const firstData = results.find(r => r.length > 0) || [];
            const labels = firstData.map(d => new Date(d.timestamp).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }));

            if (comparisonChart) {
                comparisonChart.destroy();
            }

            chartCanvas.style.display = 'block';
            chartPlaceholder.style.display = 'none';

            comparisonChart = new Chart('comparisonChart', {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                        x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 15 } }
                    },
                    plugins: {
                        legend: { display: false }, // Use custom legend
                        tooltip: { mode: 'index', intersect: false }
                    },
                    interaction: { mode: 'nearest', axis: 'x', intersect: false }
                }
            });

            renderLegend(datasets);

        } catch (error) {
            console.error("Failed to render chart:", error);
            chartPlaceholder.innerHTML = '<p>차트 데이터를 불러오는 데 실패했습니다.<br>선택한 기간에 데이터가 없을 수 있습니다.</p>';
        }
    }

    function renderLegend(datasets) {
        chartLegend.innerHTML = datasets.map(d => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${d.borderColor}"></div>
                <span>${d.label}</span>
            </div>
        `).join('');
    }

    // 3. 요약 패널 렌더링
    async function fetchAndRenderSummaryPanels() {
        try {
            const response = await fetch('/api/v1/cameras/statistics?days=7');
            if (!response.ok) throw new Error('Failed to fetch statistics');
            const stats = await response.json();

            // Hotspot List
            stats.sort((a, b) => b.peakDensity - a.peakDensity);
            hotspotList.innerHTML = stats.slice(0, 5).map((s, i) => `<li><span class="rank">${i+1}</span><span class="item-name">${s.cameraName}</span><span class="item-value">${(s.peakDensity * 100).toFixed(1)}%</span></li>`).join('');

            // Volatility List
            stats.sort((a, b) => b.densityStdDev - a.densityStdDev);
            volatilityList.innerHTML = stats.slice(0, 5).map((s, i) => `<li><span class="rank">${i+1}</span><span class="item-name">${s.cameraName}</span><span class="item-value">${s.densityStdDev.toFixed(3)}</span></li>`).join('');

        } catch (error) {
            console.error('Failed to render summary panels:', error);
            hotspotList.innerHTML = '<li>데이터를 불러오는 데 실패했습니다.</li>';
            volatilityList.innerHTML = '<li>데이터를 불러오는 데 실패했습니다.</li>';
        }
    }

    // 4. 이벤트 리스너
    cameraSearch.addEventListener('input', (e) => filterCameraList(e.target.value));
    runAnalysisBtn.addEventListener('click', renderChart);

    selectAllBtn.addEventListener('click', () => {
        cameraChecklist.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (cb.parentElement.parentElement.style.display !== 'none') {
                cb.checked = true;
            }
        });
    });

    deselectAllBtn.addEventListener('click', () => {
        cameraChecklist.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    });

    // 5. 초기화
    renderChart();
    fetchAndRenderSummaryPanels();
});