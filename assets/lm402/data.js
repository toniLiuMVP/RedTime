export const STORAGE_KEYS = {
  introSeen: "lm402_intro_seen_v6",
  lookSensitivity: "lm402_look_sensitivity_v3",
  audioEnabled: "lm402_audio_enabled_v3",
};

export const WORLD = {
  minX: -860,
  maxX: 2040,
  minZ: 72,
  maxZ: 2232,
  floorY: 0,
  dividerX: -210,
  corridor: {
    parapetHeight: 82,
    parapetTop: 118,
    columnWidth: 30,
    columnDepth: 30,
    columnZs: [132, 292, 452, 612, 772, 932, 1092, 1252, 1412, 1572, 1732, 1892, 2052, 2212],
    campusDepth: 1580,
  },
  stairs: {
    back: { z1: 72, z2: 192, landingZ: 162, label: "後樓梯間" },
    front: { z1: 2112, z2: 2232, landingZ: 2142, label: "前樓梯間" },
  },
  classroom: {
    frontZ: 512,
    backZ: 832,
    aisleX: 1060,
    lightWellZ: 674,
  },
  floorRooms: [
    { id: "room_1", label: "教室", z1: 192, z2: 512, interactive: false },
    { id: "LM402", label: "LM402", z1: 512, z2: 832, interactive: true },
    { id: "room_3", label: "教室", z1: 832, z2: 1152, interactive: false },
    { id: "room_4", label: "教室", z1: 1152, z2: 1472, interactive: false },
    { id: "room_5", label: "教室", z1: 1472, z2: 1792, interactive: false },
    { id: "room_6", label: "教室", z1: 1792, z2: 2112, interactive: false },
  ],
  frontDoor: { z1: 748, z2: 804, center: { x: -210, y: 118, z: 776 } },
  backDoor: { z1: 522, z2: 578, center: { x: -210, y: 118, z: 550 } },
  plaque: { x: -248, y: 204, z: 776 },
  focusMark: { x: -236, y: 0, z: 550 },
  board: { z: 814, x1: 420, x2: 1860, y1: 92, y2: 228 },
  rightWallWindows: [
    { z: 560, y1: 86, y2: 236, width: 156 },
    { z: 648, y1: 86, y2: 242, width: 196 },
    { z: 734, y1: 86, y2: 236, width: 156 },
  ],
  leftWallWindows: [
    { z: 610, y1: 138, y2: 236, width: 128 },
    { z: 688, y1: 138, y2: 236, width: 148 },
  ],
  lightBeams: [
    { side: "right", z: 560, width: 168, reach: 660, alpha: 0.24 },
    { side: "right", z: 648, width: 216, reach: 740, alpha: 0.34 },
    { side: "right", z: 734, width: 172, reach: 620, alpha: 0.24 },
    { side: "left", z: 610, width: 136, reach: 340, alpha: 0.18 },
    { side: "left", z: 688, width: 164, reach: 360, alpha: 0.2 },
  ],
  desks: [
    { x: 168, z: 552 }, { x: 396, z: 552 }, { x: 624, z: 552 }, { x: 852, z: 552 }, { x: 1080, z: 552 }, { x: 1308, z: 552 }, { x: 1536, z: 552 }, { x: 1764, z: 552 },
    { x: 168, z: 622 }, { x: 396, z: 622 }, { x: 624, z: 622 }, { x: 852, z: 622 }, { x: 1080, z: 622 }, { x: 1308, z: 622 }, { x: 1536, z: 622 }, { x: 1764, z: 622 },
    { x: 168, z: 692 }, { x: 396, z: 692 }, { x: 624, z: 692 }, { x: 852, z: 692 }, { x: 1080, z: 692 }, { x: 1308, z: 692 }, { x: 1536, z: 692 }, { x: 1764, z: 692 },
    { x: 168, z: 762 }, { x: 396, z: 762 }, { x: 624, z: 762 }, { x: 852, z: 762 }, { x: 1080, z: 762 }, { x: 1308, z: 762 }, { x: 1536, z: 762 }, { x: 1764, z: 762 },
  ],
  notes: [
    { x: 1548, y: 75, z: 622, label: "講義" },
    { x: 1566, y: 75, z: 628, label: "白紙" },
  ],
  campusTrees: [
    { x: -1240, z: 216, scale: 5.7 },
    { x: -1410, z: 424, scale: 6.2 },
    { x: -1272, z: 676, scale: 6.1 },
    { x: -1440, z: 988, scale: 6.6 },
    { x: -1288, z: 1344, scale: 6.4 },
    { x: -1456, z: 1688, scale: 6.8 },
    { x: -1292, z: 2044, scale: 6.2 },
  ],
  wallLabels: [
    { id: "W-A", x: -790, y: 212, z: 136, rotateY: 0 },
    { id: "W-B", x: -246, y: 214, z: 776, rotateY: Math.PI / 2 },
    { id: "W-C", x: 1186, y: 218, z: 818, rotateY: 0 },
    { id: "W-D", x: 2012, y: 214, z: 690, rotateY: -Math.PI / 2 },
    { id: "W-E", x: -188, y: 214, z: 548, rotateY: Math.PI / 2 },
    { id: "W-F", x: 1186, y: 214, z: 526, rotateY: 0 },
    { id: "W-G", x: -804, y: 186, z: 642, rotateY: Math.PI / 2 },
    { id: "W-H", x: -804, y: 186, z: 1188, rotateY: Math.PI / 2 },
    { id: "W-I", x: -804, y: 186, z: 1760, rotateY: Math.PI / 2 },
    { id: "W-J", x: -834, y: 146, z: 1088, rotateY: Math.PI / 2 },
    { id: "W-K", x: -790, y: 212, z: 2140, rotateY: 0 },
    { id: "W-L", x: -220, y: 214, z: 1548, rotateY: Math.PI / 2 },
  ],
};

export const PHASES = [
  {
    id: "front_call",
    index: "01",
    title: "前門來電",
    copy: "先靠近 LM402 前門外的走廊，把電話真正聽見。",
  },
  {
    id: "rear_wait",
    index: "02",
    title: "後門等待",
    copy: "進教室、站到後門旁，把那條走廊與空白留出來。",
  },
  {
    id: "eye_contact",
    index: "03",
    title: "一眼瞬間",
    copy: "讓光、站位與視角都到位，看見那秒鐘往旁邊退一步。",
  },
];

export const HOTSPOTS = [
  {
    id: "front_call",
    type: "scene",
    label: "前門走廊",
    prompt: "聽前門來電",
    x: -404,
    y: 112,
    z: 766,
    radius: 176,
    revealIn: ["front_call", "rear_wait"],
  },
  {
    id: "plaque",
    type: "memory",
    label: "LM402 門牌",
    prompt: "看門牌",
    x: -250,
    y: 194,
    z: 736,
    radius: 132,
    revealIn: ["front_call", "rear_wait", "eye_contact"],
  },
  {
    id: "board",
    type: "memory",
    label: "黑板與時鐘",
    prompt: "看黑板",
    x: 1186,
    y: 164,
    z: 806,
    radius: 210,
    revealIn: ["front_call", "rear_wait", "eye_contact"],
  },
  {
    id: "seat",
    type: "memory",
    label: "靠窗座位",
    prompt: "看座位",
    x: 1536,
    y: 86,
    z: 622,
    radius: 170,
    revealIn: ["front_call", "rear_wait", "eye_contact"],
  },
  {
    id: "notes",
    type: "memory",
    label: "講義邊角",
    prompt: "看講義",
    x: 1554,
    y: 78,
    z: 628,
    radius: 136,
    revealIn: ["rear_wait", "eye_contact"],
  },
  {
    id: "junior",
    type: "scene",
    label: "學妹",
    prompt: "聽她排練",
    x: 1536,
    y: 112,
    z: 622,
    radius: 156,
    revealIn: ["front_call", "rear_wait"],
  },
  {
    id: "backdoor",
    type: "scene",
    label: "後門",
    prompt: "站在後門",
    x: -246,
    y: 112,
    z: 548,
    radius: 174,
    revealIn: ["rear_wait", "eye_contact"],
  },
];

export const MEMORY_FRAGMENTS = {
  plaque: {
    kicker: "利瑪竇大樓",
    title: "LM402 門牌",
    copy: [
      "門牌：LM402。粉筆味像一層薄雲。",
      "紅線就是在這裡忽然收緊，把我牽進這條安靜的走廊。",
    ],
  },
  board: {
    kicker: "十一點前",
    title: "黑板與時鐘",
    copy: [
      "十一點整，下課鐘會響。",
      "他會先從前門探頭看，可是看不到妳。",
      "接著，他會拿起手機，打給妳。",
    ],
  },
  seat: {
    kicker: "倒數第二排靠窗",
    title: "白襯衫、牛仔短褲",
    copy: [
      "我忍住不回頭，只盯著窗框邊緣，看見自己的倒影。",
      "一個穿白襯衫、牛仔短褲的女生，站在倒數第二排靠窗那一側，站得比自己以為的還要穩一點。",
    ],
  },
  notes: {
    kicker: "講義邊角",
    title: "風把紙邊輕輕掀起",
    copy: [
      "樓梯口的風掠過，教室內的講義邊角微翹。",
      "時間卡在那一格清澈的光裡，不近不遠，剛好相遇。",
    ],
  },
  backdoor: {
    kicker: "後門那一端",
    title: "留一點空白給命運",
    copy: [
      "妳只要站在後門，等他轉身走過那段走廊。",
      "留一點空白給命運，也留一點空白給妳自己。",
    ],
  },
};

export const INTERACTIONS = {
  front_call: {
    eyebrow: "11:00｜前門",
    title: "前門來電",
    speaker: "學長",
    copy: [
      "我站在前門，東張西望，卻沒看到妳。",
      "「妳在哪裡？」",
      "這通電話一響，整條動線就會從前門折向後門。",
    ],
    choices: [
      {
        id: "front_listen",
        label: "把這通電話收進來",
        detail: "讓十一點的第一句話先成立。",
        effect: "advance_front_call",
      },
      {
        id: "front_plaque",
        label: "先記住這扇門",
        detail: "把門牌與粉筆味一起收下。",
        effect: "collect_plaque",
      },
    ],
  },
  plaque: {
    eyebrow: "紅線的入口",
    title: "LM402 門牌",
    speaker: "女兒",
    copy: MEMORY_FRAGMENTS.plaque.copy,
    choices: [
      {
        id: "plaque_collect",
        label: "把門牌記下來",
        detail: "收進「LM402 門牌」片段。",
        effect: "memory_plaque",
      },
      {
        id: "plaque_leave",
        label: "先讓紅線往前飛",
        detail: "不多停留，回到走廊的主線。",
        effect: "close_only",
      },
    ],
  },
  board: {
    eyebrow: "排練流程",
    title: "黑板與時鐘",
    speaker: "33 歲的聲音",
    copy: MEMORY_FRAGMENTS.board.copy,
    choices: [
      {
        id: "board_collect",
        label: "把流程背下來",
        detail: "先把鐘聲、前門與後門的順序記穩。",
        effect: "memory_board",
      },
      {
        id: "board_focus",
        label: "只抓住十一點",
        detail: "把節拍留給等一下的走位。",
        effect: "memory_board_soft",
      },
    ],
  },
  seat: {
    eyebrow: "學妹的位置",
    title: "靠窗座位",
    speaker: "女兒",
    copy: MEMORY_FRAGMENTS.seat.copy,
    choices: [
      {
        id: "seat_collect",
        label: "記住她起身前的樣子",
        detail: "收進靠窗座位的片段。",
        effect: "memory_seat",
      },
      {
        id: "seat_wait",
        label: "先別驚動這一格光",
        detail: "把視線留給等一下的一眼瞬間。",
        effect: "close_only",
      },
    ],
  },
  notes: {
    eyebrow: "講義邊角",
    title: "風從樓梯口掠過",
    speaker: "女兒",
    copy: MEMORY_FRAGMENTS.notes.copy,
    choices: [
      {
        id: "notes_collect",
        label: "把風和紙邊留下來",
        detail: "收進記憶豐滿結局需要的片段。",
        effect: "memory_notes",
      },
      {
        id: "notes_return",
        label: "先回到後門節奏",
        detail: "讓畫面保持輕一點。",
        effect: "close_only",
      },
    ],
  },
  junior: {
    eyebrow: "排練過無數次的台詞",
    title: "學妹在教室裡",
    speaker: "學妹",
    copy: [
      "我深吸一口氣，接起來：「喂？」",
      "菜市場裡所有版本的我同時安靜下來，只剩那句被排練過無數次的台詞。",
      "「你走到後門。」",
    ],
    choices: [
      {
        id: "junior_collect",
        label: "把這句台詞記穩",
        detail: "讓後門等待真正成立。",
        effect: "advance_rear_wait",
      },
      {
        id: "junior_seat",
        label: "記住她站起來前的光",
        detail: "先把靠窗那一格收下。",
        effect: "memory_seat",
      },
    ],
  },
  backdoor: {
    eyebrow: "後門等待",
    title: "留一點空白給命運",
    speaker: "39 歲與 49 歲的聲音",
    copy: [
      "妳只要站在後門，等他轉身走過那段走廊。",
      "難的是『站好』。",
      "留一點空白給命運，也留一點空白給妳自己。",
    ],
    choices: [
      {
        id: "backdoor_anchor",
        label: "站在後門，別多跨一步",
        detail: "正式進入一眼瞬間的等待。",
        effect: "anchor_backdoor",
      },
      {
        id: "backdoor_collect",
        label: "先把這句留給未來",
        detail: "收進後門與空白的片段。",
        effect: "memory_backdoor",
      },
    ],
  },
};

export const INTRO_BEATS = [
  {
    id: "daughter_glow",
    start: 0,
    end: 2.2,
    kicker: "女兒",
    text: "我又夢見自己被那條紅線輕輕帶起來，整個人像真的往前飛出去。",
    ambience: "黑暗裡先亮起一條細細的紅線，像心跳一樣，一下一下，把我從夢裡托高。風還沒出現，整個身體已經先開始飛。",
  },
  {
    id: "red_thread",
    start: 2.2,
    end: 4.9,
    kicker: "紅線",
    text: "只要我沿著那條屬於把拔與阿姨的紅線往前飛，時間就會自己把路讓開。",
    ambience: "紅線先劃開風，再掠過從一樓長上來的大樹。樹冠被十一點前的光照得像一片會呼吸的海，整層四樓正慢慢浮上來。",
  },
  {
    id: "fourth_floor_arrives",
    start: 4.9,
    end: 7.4,
    kicker: "利瑪竇",
    text: "利瑪竇四樓的風、六間教室長度的走廊，和 LM402 那面門牌一起慢慢浮出來。",
    ambience: "矮牆、柱列、兩端樓梯間、門牌和整條四樓外廊一起靠近，像一段真正落到校園裡的電影軌道。",
  },
  {
    id: "sunlight_bloom",
    start: 7.4,
    end: 9.8,
    kicker: "十一點",
    text: "十一點的陽光先灑在矮牆和樹冠上，再沿著前門門洞、黑板那一端和教室兩面一起慢慢推進來。",
    ambience: "風、粉筆灰、玻璃反光和地面亮斑一起站好位置。走廊那一道暖白的光先到了，教室裡才跟著被慢慢打亮。",
  },
  {
    id: "front_door_settle",
    start: 9.8,
    end: 12.0,
    kicker: "前門走廊",
    text: "我要先把前門那句「妳在哪裡？」真正聽見，這整層樓才會把那一秒交給我。",
    ambience: "鏡頭收進 LM402 前門外的走廊。學長剛從樓梯走上來，門洞、門牌、矮牆外的日光和那口還沒說完的氣息終於一起站進畫面裡。",
  },
];

export const MOBILE_DENSITY_PRESETS = {
  regular: {
    stickSize: 138,
    thumbSize: 50,
    actionSize: 46,
    controlsClearance: 154,
    railMinHeight: 68,
  },
  compact: {
    stickSize: 124,
    thumbSize: 46,
    actionSize: 42,
    controlsClearance: 142,
    railMinHeight: 64,
  },
  tight: {
    stickSize: 108,
    thumbSize: 40,
    actionSize: 38,
    controlsClearance: 128,
    railMinHeight: 60,
  },
};

export const CAMERA_PRESETS = {
  desktop: {
    baseHeight: 150,
    focalScale: 0.94,
    frontCallPitch: 0.02,
  },
  mobile: {
    baseHeight: 162,
    focalScale: 0.84,
    frontCallPitch: 0.04,
  },
  intro: {
    start: { x: -1120, y: 260, z: 40, yaw: 0.96, pitch: -0.24 },
    end: { x: -426, y: 170, z: 542, yaw: 0.22, pitch: -0.06 },
  },
};

export const ENDINGS = {
  perfect: {
    kicker: "完美結局",
    title: "女兒飛到一眼瞬間那一秒",
    copy:
      "學妹走到教室內的後門站定，學長停在走廊後門前，兩人隔著那道門洞面對面。陽光整片灑在學妹身上，鏡頭慢慢繞過她，最後只剩眼睛和那一句再次落下來的話。",
  },
  canon: {
    kicker: "正史結局",
    title: "後門那一眼",
    copy:
      "他出現在光裡。兩條視線對上的瞬間，時間真的像往旁邊退了一步。你站在後門旁，剛好把這一秒完整接住；其餘交給目光與無聲的節拍。",
  },
  memory: {
    kicker: "記憶豐滿結局",
    title: "把光、風、門牌與紙邊都留下來",
    copy:
      "你不只看見那一眼，也把黑板、門牌、靠窗座位、講義邊角與後門那一點空白都收進來。於是這一格不只是一秒，而是整個 LM402 的聲光味一起被存下來。",
  },
  missed: {
    kicker: "錯過結局",
    title: "你只聽見動靜，沒看清那一秒",
    copy:
      "鐘聲、椅腳聲、電話與風都到了，可你的站位或視線慢了一點。紅線在真正對眼之前先回彈，只留下走廊裡一抹逆光和一句還沒來得及說出口的話。",
  },
};

export const CINEMATIC_TIMELINE = {
  duration: 5.8,
  lockWindow: 4.1,
  successWindow: [3.2, 4.4],
  introDuration: 12,
  perfectDuration: 22.4,
};
