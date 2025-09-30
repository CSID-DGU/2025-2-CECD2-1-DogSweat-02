const cameraData = [
  {
    id: "cam-01",
    name: "복지관 3층 복도",
    location: "복지관 · 3F",
    status: { label: "위험", tone: "danger" },
    live: {
      caption: "라이브 · 14:35:20",
      overlay: [
        { x: "16%", y: "22%", w: "30%", h: "42%", type: "danger", text: "군중" },
        { x: "58%", y: "28%", w: "20%", h: "32%", type: "warning", text: "대기" }
      ]
    },
    snapshot: {
      caption: "14:35:00 캡처 · 30초 주기 갱신",
      overlay: [
        { x: "22%", y: "26%", w: "26%", h: "36%", type: "danger", text: "혼잡" },
        { x: "60%", y: "30%", w: "18%", h: "30%", type: "danger", text: "추가" }
      ]
    },
    metrics: {
      density: "0.82",
      change: { value: "+6%/분", tone: "positive" },
      accel: { value: "+2%/분²", tone: "positive" },
      durationLabel: "위험 지속",
      duration: "00:05:12"
    },
    tags: [
      { text: "피크 유입", tone: "warning" },
      { text: "AI 감지 12건", tone: "ai" }
    ],
    message: "서측 출입구 혼잡 · 보안 인력 배치 필요",
    timeline: [
      { time: "14:35", text: "밀집도 0.82 · 위험 상태 유지" },
      { time: "14:33", text: "동측 회랑 병목 지속" },
      { time: "14:31", text: "학생 다중 이동 감지" }
    ]
  },
  {
    id: "cam-02",
    name: "공학관 B1 로비",
    location: "공학관 · 지하 로비",
    status: { label: "주의", tone: "warning" },
    live: {
      caption: "라이브 · 14:28:40",
      overlay: [
        { x: "24%", y: "24%", w: "28%", h: "32%", type: "warning", text: "대기" },
        { x: "60%", y: "32%", w: "18%", h: "28%", type: "neutral", text: "통행" }
      ]
    },
    snapshot: {
      caption: "14:28:10 캡처 · 30초 주기 갱신",
      overlay: [
        { x: "26%", y: "28%", w: "26%", h: "28%", type: "warning", text: "혼잡" }
      ]
    },
    metrics: {
      density: "0.64",
      change: { value: "+2%/분", tone: "positive" },
      accel: { value: "+1%/분²", tone: "positive" },
      durationLabel: "주의 지속",
      duration: "00:02:05"
    },
    tags: [
      { text: "엘리베이터 대기", tone: "warning" },
      { text: "AI 감지 7건", tone: "ai" }
    ],
    message: "강의 종료 인파 유입 · 출입 동선 확보 필요",
    timeline: [
      { time: "14:28", text: "대기열 길이 18m" },
      { time: "14:26", text: "에스컬레이터 인원 증가" },
      { time: "14:24", text: "출입 게이트 통과 260명" }
    ]
  },
  {
    id: "cam-03",
    name: "도서관 1층 라운지",
    location: "도서관 · 1F",
    status: { label: "정상", tone: "normal" },
    live: {
      caption: "라이브 · 14:18:12",
      overlay: [
        { x: "18%", y: "28%", w: "22%", h: "30%", type: "neutral", text: "좌석" }
      ]
    },
    snapshot: {
      caption: "14:17:40 캡처 · 30초 주기 갱신",
      overlay: [
        { x: "20%", y: "30%", w: "20%", h: "28%", type: "neutral", text: "활동" }
      ]
    },
    metrics: {
      density: "0.28",
      change: { value: "-1%/분", tone: "negative" },
      accel: { value: "-0.4%/분²", tone: "negative" },
      durationLabel: "안정 구간",
      duration: "00:18:42"
    },
    tags: [
      { text: "조용", tone: "neutral" }
    ],
    message: "열람석 여유 충분 · 이상 징후 없음",
    timeline: [
      { time: "14:18", text: "혼잡도 0.28 · 정상" },
      { time: "14:16", text: "좌석 점유 32%" },
      { time: "14:14", text: "출입 변동 미미" }
    ]
  },
  {
    id: "cam-04",
    name: "체육관 동문",
    location: "체육관 · 동문",
    status: { label: "주의", tone: "warning" },
    live: {
      caption: "라이브 · 14:33:02",
      overlay: [
        { x: "32%", y: "24%", w: "34%", h: "36%", type: "warning", text: "대기열" }
      ]
    },
    snapshot: {
      caption: "14:32:30 캡처 · 30초 주기 갱신",
      overlay: [
        { x: "34%", y: "26%", w: "30%", h: "34%", type: "warning", text: "대기" }
      ]
    },
    metrics: {
      density: "0.73",
      change: { value: "+4%/분", tone: "positive" },
      accel: { value: "+1%/분²", tone: "positive" },
      durationLabel: "주의 지속",
      duration: "00:06:21"
    },
    tags: [
      { text: "행사 대기", tone: "warning" },
      { text: "AI 감지 9건", tone: "ai" }
    ],
    message: "입장 대기열 증가 · 우회 안내 방송 진행",
    timeline: [
      { time: "14:32", text: "대기열 길이 24m" },
      { time: "14:30", text: "입장 게이트 혼잡" },
      { time: "14:28", text: "봉사 인력 배치" }
    ]
  },
  {
    id: "cam-05",
    name: "중앙광장 분수대",
    location: "중앙광장",
    status: { label: "위험", tone: "danger" },
    live: {
      caption: "라이브 · 14:37:44",
      overlay: [
        { x: "20%", y: "20%", w: "42%", h: "46%", type: "danger", text: "군중" },
        { x: "68%", y: "34%", w: "20%", h: "28%", type: "danger", text: "추가" }
      ]
    },
    snapshot: {
      caption: "14:37:10 캡처 · 30초 주기 갱신",
      overlay: [
        { x: "22%", y: "22%", w: "40%", h: "44%", type: "danger", text: "군집" },
        { x: "70%", y: "34%", w: "18%", h: "24%", type: "danger", text: "확장" }
      ]
    },
    metrics: {
      density: "0.88",
      change: { value: "+7%/분", tone: "positive" },
      accel: { value: "+3%/분²", tone: "positive" },
      durationLabel: "위험 지속",
      duration: "00:07:54"
    },
    tags: [
      { text: "즉시 조치", tone: "danger" },
      { text: "AI 감지 18건", tone: "ai" }
    ],
    message: "축제 관람객 집중 · 경찰 협조 요청",
    timeline: [
      { time: "14:37", text: "밀집도 0.88 · 위험" },
      { time: "14:35", text: "우회 동선 안내" },
      { time: "14:33", text: "관람객 급증" }
    ]
  },
  {
    id: "cam-06",
    name: "생활관 2층 로비",
    location: "생활관 · 2F",
    status: { label: "정상", tone: "normal" },
    live: {
      caption: "라이브 · 14:12:08",
      overlay: [
        { x: "30%", y: "32%", w: "18%", h: "26%", type: "neutral", text: "학생" }
      ]
    },
    snapshot: {
      caption: "14:11:40 캡처 · 30초 주기 갱신",
      overlay: [
        { x: "32%", y: "34%", w: "16%", h: "24%", type: "neutral", text: "학생" }
      ]
    },
    metrics: {
      density: "0.24",
      change: { value: "+0%/분", tone: "neutral" },
      accel: { value: "-0.2%/분²", tone: "negative" },
      durationLabel: "안정 구간",
      duration: "00:26:40"
    },
    tags: [
      { text: "한산", tone: "neutral" }
    ],
    message: "생활관 출입 안정 · 특이사항 없음",
    timeline: [
      { time: "14:12", text: "혼잡도 0.24 · 정상" },
      { time: "14:10", text: "출입 변동 없음" },
      { time: "14:08", text: "체류 인원 18명" }
    ]
  }
];

const cameraDataMap = new Map(cameraData.map(cam => [cam.id, cam]));
