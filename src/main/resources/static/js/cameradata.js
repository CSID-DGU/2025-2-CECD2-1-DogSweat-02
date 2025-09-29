const cameraData = [
  {
    id: "cam-01",
    name: "학생회관 3층 복도",
    location: "학생회관 · 존 3F",
    status: { label: "위험", tone: "danger" },
    live: {
      caption: "라이브 · 14:32:18",
      overlay: [
        { x: "16%", y: "22%", w: "30%", h: "42%", type: "danger", text: "군중" },
        { x: "58%", y: "28%", w: "20%", h: "32%", type: "warning", text: "정체" }
      ]
    },
    snapshot: {
      caption: "14:32:00 캡처 · 30초마다 갱신",
      overlay: [
        { x: "22%", y: "26%", w: "26%", h: "36%", type: "danger", text: "밀집" },
        { x: "60%", y: "30%", w: "18%", h: "30%", type: "danger", text: "추가" }
      ]
    },
    metrics: {
      density: "0.78",
      change: { value: "+6%/분", tone: "positive" },
      accel: { value: "+2%/분²", tone: "positive" },
      durationLabel: "위험 지속",
      duration: "00:04:12"
    },
    tags: [
      { text: "피크 타임", tone: "warning" },
      { text: "AI 감지 12건", tone: "ai" }
    ],
    message: "주출입구 혼잡 · 보안팀 확인 필요",
    timeline: [
      { time: "14:32:00", text: "밀집도 0.78 · 위험 지속 4분" },
      { time: "14:31:30", text: "입장 대기열 20명 감지" },
      { time: "14:31:00", text: "이동 속도 감소" }
    ]
  },
  {
    id: "cam-02",
    name: "공학관 B1 로비",
    location: "공학관 · 지하 로비",
    status: { label: "주의", tone: "warning" },
    live: {
      caption: "라이브 · 14:32:18",
      overlay: [
        { x: "24%", y: "26%", w: "28%", h: "28%", type: "warning", text: "군중" },
        { x: "60%", y: "32%", w: "18%", h: "26%", type: "neutral", text: "대기" }
      ]
    },
    snapshot: {
      caption: "14:31:50 캡처 · 30초마다 갱신",
      overlay: [
        { x: "26%", y: "28%", w: "26%", h: "26%", type: "warning", text: "혼잡" }
      ]
    },
    metrics: {
      density: "0.51",
      change: { value: "+2%/분", tone: "positive" },
      accel: { value: "+0%/분²", tone: "neutral" },
      durationLabel: "주의 지속",
      duration: "00:02:05"
    },
    tags: [
      { text: "AI 감지 6건", tone: "ai" }
    ],
    message: "강의 종료 인파 유입 · 출입문 개방 유지",
    timeline: [
      { time: "14:31:50", text: "혼잡 영역 1곳" },
      { time: "14:31:20", text: "엘리베이터 대기열 형성" },
      { time: "14:30:45", text: "출구 집중 2군 감지" }
    ]
  },
  {
    id: "cam-03",
    name: "도서관 1층 큐레이션존",
    location: "도서관 · 1층",
    status: { label: "정상", tone: "normal" },
    live: {
      caption: "라이브 · 14:32:18",
      overlay: [
        { x: "18%", y: "28%", w: "22%", h: "30%", type: "neutral", text: "학생" }
      ]
    },
    snapshot: {
      caption: "14:31:48 캡처 · 30초마다 갱신",
      overlay: [
        { x: "20%", y: "30%", w: "20%", h: "28%", type: "neutral", text: "이동" }
      ]
    },
    metrics: {
      density: "0.22",
      change: { value: "-1%/분", tone: "negative" },
      accel: { value: "-0.4%/분²", tone: "negative" },
      durationLabel: "정상 지속",
      duration: "00:18:42"
    },
    tags: [
      { text: "조용", tone: "neutral" }
    ],
    message: "입실 인원 안정적 · 이상 없음",
    timeline: [
      { time: "14:31:48", text: "혼잡도 0.22 유지" },
      { time: "14:31:18", text: "좌석 점유 35%" },
      { time: "14:30:52", text: "이상 징후 없음" }
    ]
  },
  {
    id: "cam-04",
    name: "체육관 서문",
    location: "체육단지 · 서문",
    status: { label: "주의", tone: "warning" },
    live: {
      caption: "라이브 · 14:32:18",
      overlay: [
        { x: "32%", y: "24%", w: "34%", h: "36%", type: "warning", text: "입장 대기" }
      ]
    },
    snapshot: {
      caption: "14:31:54 캡처 · 30초마다 갱신",
      overlay: [
        { x: "34%", y: "26%", w: "30%", h: "34%", type: "warning", text: "행렬" }
      ]
    },
    metrics: {
      density: "0.64",
      change: { value: "+4%/분", tone: "positive" },
      accel: { value: "+1%/분²", tone: "positive" },
      durationLabel: "주의 지속",
      duration: "00:06:21"
    },
    tags: [
      { text: "행사 입장", tone: "warning" },
      { text: "AI 감지 9건", tone: "ai" }
    ],
    message: "선착순 입장 진행 중",
    timeline: [
      { time: "14:31:54", text: "대기열 길이 24m" },
      { time: "14:31:24", text: "안내 방송 송출" },
      { time: "14:30:54", text: "밀집도 0.62" }
    ]
  },
  {
    id: "cam-05",
    name: "중앙광장 분수대",
    location: "중앙광장",
    status: { label: "위험", tone: "danger" },
    live: {
      caption: "라이브 · 14:32:18",
      overlay: [
        { x: "20%", y: "18%", w: "42%", h: "50%", type: "danger", text: "군집" },
        { x: "68%", y: "38%", w: "18%", h: "26%", type: "danger", text: "추가" }
      ]
    },
    snapshot: {
      caption: "14:31:48 캡처 · 30초마다 갱신",
      overlay: [
        { x: "22%", y: "20%", w: "40%", h: "44%", type: "danger", text: "군중" },
        { x: "70%", y: "34%", w: "16%", h: "24%", type: "danger", text: "확대" }
      ]
    },
    metrics: {
      density: "0.86",
      change: { value: "+8%/분", tone: "positive" },
      accel: { value: "+3%/분²", tone: "positive" },
      durationLabel: "위험 지속",
      duration: "00:07:54"
    },
    tags: [
      { text: "즉시 대응", tone: "danger" },
      { text: "AI 감지 18건", tone: "ai" }
    ],
    message: "행사 관람객 집중 · 경찰 협조 요청",
    timeline: [
      { time: "14:31:48", text: "군중 밀집 최고 0.86" },
      { time: "14:31:18", text: "관람객 증가 추세" },
      { time: "14:30:45", text: "출입 통제 권고" }
    ]
  },
  {
    id: "cam-06",
    name: "생활관 2동 로비",
    location: "생활관 · 2동",
    status: { label: "정상", tone: "normal" },
    live: {
      caption: "라이브 · 14:32:18",
      overlay: [
        { x: "30%", y: "32%", w: "18%", h: "26%", type: "neutral", text: "입실" }
      ]
    },
    snapshot: {
      caption: "14:31:56 캡처 · 30초마다 갱신",
      overlay: [
        { x: "32%", y: "34%", w: "16%", h: "24%", type: "neutral", text: "입실" }
      ]
    },
    metrics: {
      density: "0.18",
      change: { value: "+0%/분", tone: "neutral" },
      accel: { value: "-0.2%/분²", tone: "negative" },
      durationLabel: "정상 지속",
      duration: "00:26:40"
    },
    tags: [
      { text: "야간", tone: "neutral" }
    ],
    message: "야간 통행 소수 · 이슈 없음",
    timeline: [
      { time: "14:31:56", text: "입실 3명" },
      { time: "14:31:26", text: "혼잡도 0.18 유지" },
      { time: "14:30:58", text: "이상 징후 없음" }
    ]
  }
];

const cameraDataMap = new Map(cameraData.map(cam => [cam.id, cam]));
