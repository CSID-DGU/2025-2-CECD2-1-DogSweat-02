(() => {
    "use strict";

    const STATUS_META = {
        HEALTHY: { className: "normal", label: "정상" },
        WARNING: { className: "warning", label: "주의" },
        OFFLINE: { className: "offline", label: "오프라인" }
    };

    const FALLBACK_STATUS = STATUS_META.HEALTHY;
    const MAP_INIT_MAX_ATTEMPTS = 20;
    const MAP_INIT_RETRY_DELAY = 150;
    const LOCATE_TARGET_ZOOM = 16;
    const LOCATE_HINT_DELAY = 500;

    const rawCameras = Array.isArray(window.safetyCameras) ? window.safetyCameras : [];
    const cameras = rawCameras
        .map(normalizeCamera)
        .filter(camera => Boolean(camera.id));
    const cameraById = new Map(cameras.map(camera => [camera.id, camera]));

    const state = {
        filter: "ALL",
        activeId: null,
        map: null,
        markers: new Map(),
        userMarker: null,
        mapInitAttempts: 0,
        isLocating: false,
        locateHintTimer: null
    };

    const elements = {
        canvas: null,
        hint: null,
        list: null,
        listSummary: null,
        infoPanel: null,
        infoPanelClose: null,
        infoName: null,
        infoLocation: null,
        infoAddress: null,
        infoChip: null,
        infoLatitude: null,
        infoLongitude: null,
        filterButtons: null,
        filterContainer: null,
        locateMeButton: null
    };

    function captureElements() {
        elements.canvas ??= document.getElementById("mapCanvas");
        elements.hint ??= document.querySelector("[data-role=\"map-hint\"]");
        elements.list ??= document.getElementById("cameraList");
        elements.listSummary ??= document.getElementById("listSummary");
        elements.infoPanel ??= document.getElementById("infoPanel");
        elements.infoPanelClose ??= document.getElementById("infoPanelClose");
        elements.infoName ??= document.getElementById("infoPanelName");
        elements.infoLocation ??= document.getElementById("infoPanelLocation");
        elements.infoAddress ??= document.getElementById("infoPanelAddress");
        elements.infoChip ??= document.getElementById("infoPanelChip");
        elements.infoLatitude ??= document.getElementById("infoPanelLatitude");
        elements.infoLongitude ??= document.getElementById("infoPanelLongitude");
        elements.filterButtons ??= document.querySelectorAll(".filter-buttons .filter-btn");
        elements.filterContainer ??= document.querySelector(".filter-buttons");
        elements.locateMeButton ??= document.querySelector("[data-role=\"locate-me\"]");
    }

    function hasMapContext() {
        captureElements();
        return Boolean(elements.canvas);
    }

    function normalizeCamera(raw) {
        if (!raw) {
            return { id: "" };
        }
        const statusKey = typeof raw.status === "string" && STATUS_META[raw.status]
            ? raw.status
            : "HEALTHY";
        const meta = STATUS_META[statusKey] ?? FALLBACK_STATUS;
        const latitude = toNumber(raw.latitude);
        const longitude = toNumber(raw.longitude);
        return {
            id: raw.id != null ? String(raw.id) : "",
            name: (raw.name ?? "").trim() || "이름 미상",
            status: statusKey,
            statusDisplay: (raw.statusDisplay ?? "").trim() || meta.label,
            className: meta.className,
            location: (raw.locationZone ?? "").trim(),
            address: (raw.address ?? "").trim(),
            latitude,
            longitude,
            hasCoordinates: Number.isFinite(latitude) && Number.isFinite(longitude)
        };
    }

    function toNumber(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function formatCoordinate(value, axis) {
        if (!Number.isFinite(value)) {
            return axis === "lat" ? "위도 정보 없음" : "경도 정보 없음";
        }
        return `${axis === "lat" ? "위도" : "경도"} ${value.toFixed(6)}`;
    }

    function statusMeta(status) {
        return STATUS_META[status] ?? FALLBACK_STATUS;
    }

    function getFilteredCameras(filter = state.filter) {
        return filter === "ALL" ? cameras : cameras.filter(camera => camera.status === filter);
    }

    function getDefaultHintMessage(filteredList = getFilteredCameras()) {
        if (cameras.length === 0) {
            return "등록된 카메라가 없습니다. 카메라 관리에서 장비를 추가하세요.";
        }
        if (filteredList.length === 0) {
            return "선택한 상태의 카메라가 없습니다. 다른 필터를 선택해 보세요.";
        }
        return "마커를 클릭하거나 목록에서 카메라를 선택하세요.";
    }

    function showHint(message, isError = false) {
        captureElements();
        if (!elements.hint) {
            return;
        }
        elements.hint.textContent = message;
        elements.hint.hidden = false;
        elements.hint.classList.toggle("map-hint--error", Boolean(isError));
    }

    function hideHint() {
        captureElements();
        if (!elements.hint) {
            return;
        }
        elements.hint.hidden = true;
        elements.hint.classList.remove("map-hint--error");
    }

    function showDefaultHint(filteredList) {
        showHint(getDefaultHintMessage(filteredList), false);
    }

    function clearLocateHintTimer() {
        if (state.locateHintTimer) {
            clearTimeout(state.locateHintTimer);
            state.locateHintTimer = null;
        }
    }

    function renderList(filtered) {
        captureElements();
        if (!elements.list) {
            return;
        }
        elements.list.innerHTML = "";
        if (!filtered.length) {
            const empty = document.createElement("li");
            empty.className = "camera-list-empty";
            empty.textContent = state.filter === "ALL"
                ? "등록된 카메라가 없습니다."
                : "선택한 상태의 카메라가 없습니다.";
            elements.list.appendChild(empty);
            return;
        }
        filtered.forEach(camera => {
            const meta = statusMeta(camera.status);
            const item = document.createElement("li");
            item.className = "camera-list-item";
            item.dataset.cameraId = camera.id;
            if (camera.id === state.activeId) {
                item.classList.add("is-active");
            }
            if (!camera.hasCoordinates) {
                item.classList.add("camera-list-item--no-coords");
            }

            const statusDot = document.createElement("span");
            statusDot.className = `camera-list-item__status-dot camera-list-item__status-dot--${meta.className}`;

            const info = document.createElement("div");
            info.className = "camera-list-item__info";

            const name = document.createElement("span");
            name.className = "camera-list-item__name";
            name.textContent = camera.name;

            const location = document.createElement("span");
            location.className = "camera-list-item__location";
            if (camera.location) {
                location.textContent = camera.location;
            } else if (camera.address) {
                location.textContent = camera.address;
            } else if (camera.hasCoordinates) {
                location.textContent = "상세 위치 정보 없음";
                location.classList.add("camera-list-item__location--muted");
            } else {
                location.textContent = "지도에 표시되지 않습니다 (좌표 미등록)";
                location.classList.add("camera-list-item__location--warning");
            }

            const chip = document.createElement("span");
            chip.className = `chip chip--${meta.className}`;
            chip.textContent = meta.label;

            info.appendChild(name);
            info.appendChild(location);
            item.appendChild(statusDot);
            item.appendChild(info);
            item.appendChild(chip);
            elements.list.appendChild(item);
        });
    }

    function updateSummary(count) {
        captureElements();
        if (!elements.listSummary) {
            return;
        }
        elements.listSummary.textContent = `총 ${count}대`;
    }

    function updateFilterButtons() {
        captureElements();
        const buttons = Array.from(elements.filterButtons ?? []);
        buttons.forEach(button => {
            button.classList.toggle("is-active", button.dataset.filter === state.filter);
        });
    }

    function highlightActiveListItem(cameraId) {
        captureElements();
        if (!elements.list) {
            return;
        }
        elements.list
            .querySelectorAll(".camera-list-item")
            .forEach(item => {
                item.classList.toggle("is-active", cameraId && item.dataset.cameraId === cameraId);
            });
    }

    function showInfoPanel(camera) {
        captureElements();
        if (!elements.infoPanel) {
            return;
        }
        const meta = statusMeta(camera.status);
        elements.infoName.textContent = camera.name;
        elements.infoLocation.textContent = camera.location || "설치 위치 정보 없음";
        elements.infoAddress.textContent = camera.address || "등록된 주소가 없습니다.";
        elements.infoChip.textContent = meta.label;
        elements.infoChip.className = `chip chip--${meta.className}`;
        elements.infoLatitude.textContent = formatCoordinate(camera.latitude, "lat");
        elements.infoLongitude.textContent = formatCoordinate(camera.longitude, "lng");
        elements.infoPanel.hidden = false;
    }

    function hideInfoPanel() {
        captureElements();
        if (elements.infoPanel) {
            elements.infoPanel.hidden = true;
        }
    }

    function getMarkerIcon(camera, isActive) {
        const meta = statusMeta(camera.status);
        const classes = ["map-marker", `map-marker--${meta.className}`];
        if (isActive) {
            classes.push("is-active");
        }
        return {
            content: `<div class="${classes.join(" ")}"><span class="map-marker__pulse"></span><span class="map-marker__dot"></span></div>`,
            anchor: new naver.maps.Point(18, 36)
        };
    }

    function refreshMarkerIcons() {
        if (!state.map) {
            return;
        }
        state.markers.forEach((marker, cameraId) => {
            const camera = cameraById.get(cameraId);
            if (!camera) {
                return;
            }
            const isActive = state.activeId === cameraId;
            marker.setIcon(getMarkerIcon(camera, isActive));
            marker.setZIndex(isActive ? 1000 : 1);
        });
    }

    function updateMarkersVisibility(filtered) {
        if (!state.map) {
            return;
        }
        const availableIds = new Set(
            filtered.filter(camera => camera.hasCoordinates).map(camera => camera.id)
        );
        state.markers.forEach((marker, cameraId) => {
            marker.setMap(availableIds.has(cameraId) ? state.map : null);
        });
    }

    function panToCamera(cameraId) {
        if (!state.map) {
            return;
        }
        const marker = state.markers.get(cameraId);
        if (marker) {
            state.map.panTo(marker.getPosition());
        }
    }

    function selectCamera(cameraId, { pan = false } = {}) {
        const camera = cameraById.get(cameraId);
        if (!camera) {
            return;
        }
        state.activeId = cameraId;
        highlightActiveListItem(cameraId);
        showInfoPanel(camera);
        refreshMarkerIcons();
        if (pan && camera.hasCoordinates) {
            panToCamera(cameraId);
        }
        hideHint();
    }

    function clearActiveCamera() {
        state.activeId = null;
        hideInfoPanel();
        highlightActiveListItem(null);
        refreshMarkerIcons();
        showDefaultHint();
    }

    function applyFilter(filter) {
        state.filter = filter;
        updateFilterButtons();
        const filtered = getFilteredCameras(filter);
        renderList(filtered);
        updateSummary(filtered.length);
        updateMarkersVisibility(filtered);
        if (state.activeId && !filtered.some(camera => camera.id === state.activeId)) {
            clearActiveCamera();
        } else if (!state.activeId) {
            showDefaultHint(filtered);
        }
    }

    function bindFilterEvents() {
        captureElements();
        const container = elements.filterContainer;
        if (!container) {
            return;
        }
        container.addEventListener("click", event => {
            const button = event.target.closest(".filter-btn");
            if (!button) {
                return;
            }
            const { filter } = button.dataset;
            if (filter && filter !== state.filter) {
                applyFilter(filter);
            }
        });
    }

    function bindListEvents() {
        captureElements();
        if (!elements.list) {
            return;
        }
        elements.list.addEventListener("click", event => {
            const item = event.target.closest(".camera-list-item");
            if (!item) {
                return;
            }
            selectCamera(item.dataset.cameraId, { pan: true });
        });
    }

    function bindInfoPanelEvents() {
        captureElements();
        if (!elements.infoPanelClose) {
            return;
        }
        elements.infoPanelClose.addEventListener("click", () => {
            clearActiveCamera();
        });
    }

    function getUserMarkerIcon() {
        return {
            content: "<div class=\"map-user-marker\"><span class=\"map-user-marker__pulse\"></span><span class=\"map-user-marker__dot\"></span></div>",
            anchor: new naver.maps.Point(12, 12)
        };
    }

    function ensureUserMarker() {
        if (!state.map) {
            return null;
        }
        if (!state.userMarker) {
            state.userMarker = new naver.maps.Marker({
                position: state.map.getCenter(),
                map: state.map,
                icon: getUserMarkerIcon(),
                clickable: false,
                zIndex: 2000
            });
        } else if (!state.userMarker.getMap()) {
            state.userMarker.setMap(state.map);
            state.userMarker.setIcon(getUserMarkerIcon());
        }
        return state.userMarker;
    }

    function bindLocateMe() {
        captureElements();
        const button = elements.locateMeButton;
        if (!button || button.dataset.bound === "true") {
            return;
        }
        if (!navigator.geolocation) {
            button.disabled = true;
            button.title = "브라우저가 현재 위치 기능을 지원하지 않습니다.";
            return;
        }
        button.addEventListener("click", () => {
            if (state.isLocating) {
                return;
            }
            if (!state.map) {
                showHint("지도가 준비 중입니다. 잠시 후 다시 시도하세요.", true);
                return;
            }
            state.isLocating = true;
            button.classList.add("is-busy");
            button.setAttribute("aria-busy", "true");

            clearLocateHintTimer();
            state.locateHintTimer = window.setTimeout(() => {
                showHint("현재 위치를 확인하는 중입니다...");
            }, LOCATE_HINT_DELAY);

            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const coord = new naver.maps.LatLng(coords.latitude, coords.longitude);
                    state.map.panTo(coord);
                    if (state.map.getZoom() < LOCATE_TARGET_ZOOM) {
                        state.map.setZoom(LOCATE_TARGET_ZOOM);
                    }
                    const userMarker = ensureUserMarker();
                    if (userMarker) {
                        userMarker.setPosition(coord);
                        userMarker.setMap(state.map);
                    }
                    clearLocateHintTimer();
                    hideHint();
                    state.isLocating = false;
                    button.classList.remove("is-busy");
                    button.removeAttribute("aria-busy");
                },
                error => {
                    console.error("Geolocation error:", error);
                    const message = error.code === error.PERMISSION_DENIED
                        ? "위치 권한이 거부되었습니다."
                        : "현재 위치를 가져올 수 없습니다.";
                    clearLocateHintTimer();
                    showHint(message, true);
                    state.isLocating = false;
                    button.classList.remove("is-busy");
                    button.removeAttribute("aria-busy");
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 10000,
                    timeout: 10000
                }
            );
        });
        button.dataset.bound = "true";
    }

    function initUI() {
        if (!hasMapContext()) {
            return;
        }
        bindFilterEvents();
        bindListEvents();
        bindInfoPanelEvents();
        bindLocateMe();
        applyFilter(state.filter);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initUI);
    } else {
        initUI();
    }

    function createMarkers(mapInstance, camerasWithCoords) {
        camerasWithCoords.forEach(camera => {
            const marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(camera.latitude, camera.longitude),
                map: mapInstance,
                icon: getMarkerIcon(camera, false)
            });
            state.markers.set(camera.id, marker);
            naver.maps.Event.addListener(marker, "click", () => {
                selectCamera(camera.id, { pan: false });
            });
        });
    }

    function fitMapToMarkers(mapInstance, camerasWithCoords) {
        if (!camerasWithCoords.length) {
            return;
        }
        if (camerasWithCoords.length === 1) {
            const camera = camerasWithCoords[0];
            mapInstance.setCenter(new naver.maps.LatLng(camera.latitude, camera.longitude));
            mapInstance.setZoom(16);
            return;
        }
        const bounds = camerasWithCoords.reduce((acc, camera) => {
            const position = new naver.maps.LatLng(camera.latitude, camera.longitude);
            if (!acc) {
                return new naver.maps.LatLngBounds(position, position);
            }
            acc.extend(position);
            return acc;
        }, null);
        if (bounds) {
            mapInstance.fitBounds(bounds);
        }
    }

    function scheduleMapRetry() {
        if (state.mapInitAttempts >= MAP_INIT_MAX_ATTEMPTS) {
            showHint("지도를 불러오지 못했습니다. 네트워크 상태와 API 키를 확인하세요.", true);
            return;
        }
        state.mapInitAttempts += 1;
        setTimeout(() => window.initCampusMap(), MAP_INIT_RETRY_DELAY);
    }

    window.initCampusMap = function initCampusMap() {
        if (!hasMapContext()) {
            scheduleMapRetry();
            return;
        }
        if (!window.naver || !window.naver.maps) {
            scheduleMapRetry();
            return;
        }

        captureElements();
        const defaultLat = toNumber(elements.canvas.dataset.defaultLat) ?? 37.5665;
        const defaultLng = toNumber(elements.canvas.dataset.defaultLng) ?? 126.9780;

        state.map = new naver.maps.Map(elements.canvas, {
            center: new naver.maps.LatLng(defaultLat, defaultLng),
            zoom: 15,
            minZoom: 6,
            maxZoom: 19,
            draggable: true,
            pinchZoom: true,
            scrollWheel: true,
            keyboardShortcuts: true
        });

        state.mapInitAttempts = 0;
        state.markers.clear();
        if (state.userMarker) {
            state.userMarker.setMap(null);
            state.userMarker = null;
        }
        state.isLocating = false;
        clearLocateHintTimer();
        if (elements.locateMeButton) {
            elements.locateMeButton.classList.remove("is-busy");
            elements.locateMeButton.removeAttribute("aria-busy");
        }

        const camerasWithCoords = cameras.filter(camera => camera.hasCoordinates);
        if (!camerasWithCoords.length) {
            showHint("좌표가 등록된 카메라가 없습니다. 카메라 관리에서 위치를 설정하세요.", true);
        } else {
            createMarkers(state.map, camerasWithCoords);
            fitMapToMarkers(state.map, camerasWithCoords);
            if (!state.activeId) {
                showDefaultHint();
            }
        }
        updateMarkersVisibility(getFilteredCameras());
        bindLocateMe();
        if (elements.locateMeButton && navigator.geolocation) {
            elements.locateMeButton.disabled = false;
        }
    };
})();
