(() => {
    const STATUS_OK = window.naver?.maps?.Service?.Status?.OK
        ?? window.naver?.maps?.Service?.StatusCode?.OK
        ?? "OK";

    function isOkStatus(status, response) {
        if (status === undefined || status === null) {
            return false;
        }

        if (typeof status === "string") {
            return status.toUpperCase() === "OK"
                || (typeof STATUS_OK === "string" && status.toUpperCase() === STATUS_OK.toUpperCase());
        }

        if (typeof status === "number") {
            return status === STATUS_OK || status === 0 || status === 200;
        }

        if (typeof status === "object") {
            if ("code" in status) {
                return Number(status.code) === 0;
            }
            if ("name" in status) {
                return String(status.name).toUpperCase() === "OK";
            }
        }

        const code = response?.status?.code ?? response?.status?.statusCode;
        if (code !== undefined) {
            return Number(code) === 0;
        }
        const name = response?.status?.name;
        if (name !== undefined) {
            return String(name).toUpperCase() === "OK";
        }
        return false;
    }

    function formatCoord(value) {
        return Number.isFinite(value) ? value.toFixed(6) : "";
    }

    function getNumber(value) {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function updateStatus(element, message, isError = false) {
        if (!element) {
            return;
        }
        element.textContent = message;
        element.classList.toggle("map-hint--error", Boolean(isError));
    }

    const ORDER_PRIORITY = [
        "roadaddr",
        "addr",
        "legalcode",
        "admcode"
    ];

    function extractAddressFromGeocode(address) {
        if (!address) {
            return "";
        }
        return address.roadAddress
            || address.roadaddr
            || address.jibunAddress
            || address.addr
            || "";
    }

    function composeRegion(region) {
        if (!region) {
            return "";
        }
        const parts = [
            region.area1?.name,
            region.area2?.name,
            region.area3?.name,
            region.area4?.name
        ].filter(Boolean);
        const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);
        return uniqueParts.join(" ");
    }

    function composeLand(land) {
        if (!land) {
            return "";
        }
        const number = [land.number1, land.number2].filter(Boolean).join("-");
        const building = land.addition0?.type === "building" ? land.addition0.value : "";
        const name = land.name;
        return [name, number, building].filter(Boolean).join(" ");
    }

    function extractAddressFromResult(result) {
        if (!result) {
            return "";
        }
        const name = result.name;
        if (name === "roadaddr" && result.roadaddress?.address) {
            return result.roadaddress.address;
        }
        if (name === "addr" && result.address?.jibunAddress) {
            return result.address.jibunAddress;
        }
        const region = composeRegion(result.region);
        const land = composeLand(result.land);
        return [region, land].filter(Boolean).join(" ").trim();
    }

    function pickAddress(results) {
        if (!Array.isArray(results)) {
            return "";
        }
        for (const order of ORDER_PRIORITY) {
            const match = results.find(item => item?.name === order);
            const candidate = extractAddressFromResult(match);
            if (candidate) {
                return candidate;
            }
        }
        const fallback = extractAddressFromResult(results[0]);
        return fallback;
    }

    window.navermap_authFailure = function navermap_authFailure() {
        const statusElement = document.querySelector("[data-role='map-status']");
        updateStatus(
            statusElement,
            "네이버 지도 인증에 실패했습니다. API 키와 허용 도메인을 확인하세요.",
            true
        );
        console.error("Naver Maps authentication failed.");
    };

    window.initCameraMap = function initCameraMap() {
        if (!window.naver || !window.naver.maps) {
            return;
        }

        const mapElement = document.getElementById("camera-map");
        if (!mapElement) {
            return;
        }

        const addressInput = document.querySelector("#camera-form input[name='address']");
        const latitudeInput = document.querySelector("#camera-form input[name='latitude']");
        const longitudeInput = document.querySelector("#camera-form input[name='longitude']");
        const searchButton = document.querySelector("[data-role='address-search']");
        const locateMeButton = document.querySelector("[data-role='locate-me']");
        const statusElement = document.querySelector("[data-role='map-status']");

        const defaultLat = getNumber(mapElement.dataset.lat) ?? getNumber(mapElement.dataset.defaultLat) ?? 37.5665;
        const defaultLng = getNumber(mapElement.dataset.lng) ?? getNumber(mapElement.dataset.defaultLng) ?? 126.9780;

        const initialPosition = new naver.maps.LatLng(defaultLat, defaultLng);
        let map;
        try {
            map = new naver.maps.Map(mapElement, {
                center: initialPosition,
                zoom: 16,
                minZoom: 6,
                scaleControl: true,
                mapDataControl: false
            });
        } catch (error) {
            updateStatus(statusElement, "지도를 불러오지 못했습니다. API 키와 도메인 등록을 확인하세요.", true);
            console.error("Failed to initialize Naver map:", error);
            return;
        }

        let marker = null;

        function ensureMarker() {
            if (!marker) {
                marker = new naver.maps.Marker({
                    position: map.getCenter(),
                    map,
                    draggable: true
                });
                naver.maps.Event.addListener(marker, "dragend", ({ coord }) => {
                    applyCoordinate(coord);
                    reverseGeocode(coord);
                });
            }
            return marker;
        }

        function applyCoordinate(coord) {
            if (latitudeInput) {
                latitudeInput.value = formatCoord(coord.lat());
            }
            if (longitudeInput) {
                longitudeInput.value = formatCoord(coord.lng());
            }
        }

        function reverseGeocode(coord) {
            if (!naver.maps.Service || typeof naver.maps.Service.reverseGeocode !== "function") {
                updateStatus(statusElement, "역지오코딩 모듈을 불러오지 못했습니다.", true);
                return;
            }

            try {
                naver.maps.Service.reverseGeocode(
                    {
                        coords: coord,
                        orders: ORDER_PRIORITY.join(",")
                    },
                    (status, response) => {
                        console.debug("[CameraMap] reverseGeocode status:", status, response);
                        if (!isOkStatus(status, response)) {
                            updateStatus(statusElement, "주소를 찾을 수 없습니다. Geocoding API 권한을 확인하세요.", true);
                            return;
                        }

                        const v2 = response?.v2 ?? {};
                        const legacyResults = response?.results ?? response?.result?.items;
                        const legacyAddresses = response?.addresses ?? response?.result?.address;
                        let address = "";
                        let debugData = [];

                        if (Array.isArray(v2.results) && v2.results.length > 0) {
                            console.debug("[CameraMap] reverseGeocode v2.results:", v2.results);
                            address = pickAddress(v2.results);
                            debugData = v2.results;
                        }

                        if (!address && Array.isArray(legacyResults) && legacyResults.length > 0) {
                            console.debug("[CameraMap] reverseGeocode legacy results:", legacyResults);
                            address = pickAddress(legacyResults);
                            debugData = legacyResults;
                        }

                        if (!address && Array.isArray(v2.addresses)) {
                            console.debug("[CameraMap] reverseGeocode v2.addresses:", v2.addresses);
                            address = v2.addresses
                                .map(extractAddressFromGeocode)
                                .find(value => typeof value === "string" && value.length > 0) ?? "";
                            debugData = v2.addresses;
                        }

                        if (!address && Array.isArray(legacyAddresses)) {
                            console.debug("[CameraMap] reverseGeocode legacy addresses:", legacyAddresses);
                            address = legacyAddresses
                                .map(extractAddressFromGeocode)
                                .find(value => typeof value === "string" && value.length > 0) ?? "";
                            debugData = legacyAddresses;
                        }

                        if (addressInput) {
                            addressInput.value = address;
                        }

                        console.debug("[CameraMap] reverseGeocode parsed address:", address);
                        console.debug("[CameraMap] reverseGeocode data used:", debugData);

                        updateStatus(
                            statusElement,
                            address ? "지도에서 선택한 위치입니다." : "주소 정보를 찾을 수 없습니다."
                        );
                    }
                );
            } catch (error) {
                updateStatus(statusElement, "역지오코딩 요청에 실패했습니다. API 권한을 확인하세요.", true);
                console.error("Reverse geocode error:", error);
            }
        }

        function handleMapClick(event) {
            const coord = event.coord;
            map.panTo(coord);
            const activeMarker = ensureMarker();
            activeMarker.setPosition(coord);
            applyCoordinate(coord);
            reverseGeocode(coord);
        }

        function geocodeAddress() {
            if (!naver.maps.Service || typeof naver.maps.Service.geocode !== "function") {
                updateStatus(statusElement, "지오코딩 모듈을 불러오지 못했습니다.", true);
                return;
            }
            const query = addressInput?.value?.trim();
            if (!query) {
                updateStatus(statusElement, "검색할 주소를 입력하세요.", true);
                return;
            }

            updateStatus(statusElement, "주소를 검색하는 중입니다...");
            searchButton?.setAttribute("disabled", "true");

            try {
                naver.maps.Service.geocode(
                    { query },
                    (status, response) => {
                        console.debug("[CameraMap] geocode status:", status, response);
                        searchButton?.removeAttribute("disabled");
                        if (!isOkStatus(status, response) || !response?.v2?.addresses?.length) {
                            updateStatus(statusElement, "검색 결과가 없습니다. Geocoding API 권한을 확인하세요.", true);
                            return;
                        }
                        const result = response.v2.addresses[0];
                        const lat = getNumber(result.y);
                        const lng = getNumber(result.x);
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                            updateStatus(statusElement, "좌표를 확인할 수 없습니다.", true);
                            return;
                        }
                        const coord = new naver.maps.LatLng(lat, lng);
                        map.panTo(coord);
                        const activeMarker = ensureMarker();
                        activeMarker.setPosition(coord);
                        applyCoordinate(coord);
                        const address = extractAddressFromGeocode(result);
                        console.debug("[CameraMap] geocode parsed address:", address, result);
                        if (addressInput) {
                            addressInput.value = address ?? "";
                        }
                        updateStatus(
                            statusElement,
                            address ? "주소 검색 결과로 위치를 이동했습니다." : "검색된 주소가 없습니다."
                        );
                    }
                );
            } catch (error) {
                searchButton?.removeAttribute("disabled");
                updateStatus(statusElement, "지오코딩 요청에 실패했습니다. API 권한을 확인하세요.", true);
                console.error("Geocode error:", error);
            }
        }

        if (latitudeInput?.value && longitudeInput?.value) {
            const lat = getNumber(latitudeInput.value);
            const lng = getNumber(longitudeInput.value);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                const coord = new naver.maps.LatLng(lat, lng);
                map.setCenter(coord);
                const activeMarker = ensureMarker();
                activeMarker.setPosition(coord);
            }
        }

        naver.maps.Event.addListener(map, "click", handleMapClick);

        if (searchButton) {
            searchButton.addEventListener("click", geocodeAddress);
        }

        if (locateMeButton && navigator.geolocation) {
            locateMeButton.addEventListener("click", () => {
                locateMeButton.setAttribute("disabled", "true");
                updateStatus(statusElement, "현재 위치를 확인하는 중입니다...");
                navigator.geolocation.getCurrentPosition(
                    ({ coords }) => {
                        const coord = new naver.maps.LatLng(coords.latitude, coords.longitude);
                        map.panTo(coord);
                        const activeMarker = ensureMarker();
                        activeMarker.setPosition(coord);
                        applyCoordinate(coord);
                        reverseGeocode(coord);
                        locateMeButton.removeAttribute("disabled");
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        updateStatus(
                            statusElement,
                            error.code === error.PERMISSION_DENIED
                                ? "위치 권한이 거부되었습니다."
                                : "현재 위치를 가져올 수 없습니다.",
                            true
                        );
                        locateMeButton.removeAttribute("disabled");
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 10000,
                        timeout: 10000
                    }
                );
            });
        } else if (locateMeButton) {
            locateMeButton.setAttribute("disabled", "true");
            locateMeButton.title = "이 브라우저에서는 현재 위치 기능을 지원하지 않습니다.";
        }

        updateStatus(statusElement, "지도에서 위치를 선택하거나 주소를 검색하세요.");
    };
})();
