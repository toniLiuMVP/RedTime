export const STORAGE_KEYS = {
  introSeen: "lm402_intro_seen_v4",
};

export const WORLD = {
  minX: -560,
  maxX: 360,
  minZ: 40,
  maxZ: 1545,
  floorY: 0,
  dividerX: -220,
  frontDoor: { z1: 152, z2: 294, center: { x: -220, y: 118, z: 223 } },
  backDoor: { z1: 1188, z2: 1324, center: { x: -220, y: 118, z: 1256 } },
  plaque: { x: -262, y: 188, z: 204 },
  focusMark: { x: -246, y: 0, z: 1252 },
  board: { x1: -40, x2: 238, y1: 88, y2: 206, z: 82 },
  windows: [
    { z: 384, y1: 78, y2: 208 },
    { z: 702, y1: 78, y2: 208 },
    { z: 1022, y1: 78, y2: 208 },
  ],
  lightBeams: [
    { z: 390, width: 138, reach: 340, alpha: 0.17 },
    { z: 710, width: 146, reach: 360, alpha: 0.15 },
    { z: 1038, width: 154, reach: 348, alpha: 0.2 },
  ],
  desks: [
    { x: -54, z: 488 }, { x: 72, z: 488 }, { x: 198, z: 488 },
    { x: -54, z: 670 }, { x: 72, z: 670 }, { x: 198, z: 670 },
    { x: -54, z: 852 }, { x: 72, z: 852 }, { x: 198, z: 852 },
    { x: -54, z: 1034 }, { x: 72, z: 1034 }, { x: 198, z: 1034 },
  ],
  notes: [
    { x: 202, y: 75, z: 1044, label: "講義" },
    { x: 192, y: 75, z: 1048, label: "白紙" },
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
    x: -402,
    y: 112,
    z: 224,
    radius: 158,
    revealIn: ["front_call", "rear_wait"],
  },
  {
    id: "plaque",
    type: "memory",
    label: "LM402 門牌",
    prompt: "看門牌",
    x: -264,
    y: 186,
    z: 204,
    radius: 128,
    revealIn: ["front_call", "rear_wait", "eye_contact"],
  },
  {
    id: "board",
    type: "memory",
    label: "黑板與時鐘",
    prompt: "看黑板",
    x: 84,
    y: 164,
    z: 96,
    radius: 210,
    revealIn: ["front_call", "rear_wait", "eye_contact"],
  },
  {
    id: "seat",
    type: "memory",
    label: "靠窗座位",
    prompt: "看座位",
    x: 210,
    y: 86,
    z: 1042,
    radius: 170,
    revealIn: ["front_call", "rear_wait", "eye_contact"],
  },
  {
    id: "notes",
    type: "memory",
    label: "講義邊角",
    prompt: "看講義",
    x: 192,
    y: 78,
    z: 1046,
    radius: 136,
    revealIn: ["rear_wait", "eye_contact"],
  },
  {
    id: "junior",
    type: "scene",
    label: "學妹",
    prompt: "聽她排練",
    x: 218,
    y: 112,
    z: 1038,
    radius: 156,
    revealIn: ["front_call", "rear_wait"],
  },
  {
    id: "backdoor",
    type: "scene",
    label: "後門",
    prompt: "站在後門",
    x: -236,
    y: 112,
    z: 1252,
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
      "一個穿白襯衫、牛仔短褲的女生，站得比自己以為的還要穩一點。",
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
    end: 1,
    kicker: "女兒",
    text: "我可以飛翔。",
    ambience: "紅線先在黑暗裡亮起來，像心跳一樣，一下一下，把我往前牽。",
  },
  {
    id: "red_thread",
    start: 1,
    end: 2.2,
    kicker: "紅線",
    text: "只要我沿著那條專屬於把拔與阿姨的紅線往前飛，LM402 就會在光裡慢慢長出來。",
    ambience: "空氣先被紅線劃開，整棟樓的輪廓像從記憶背面慢慢翻到正面。",
  },
  {
    id: "corridor_arrives",
    start: 2.2,
    end: 3.4,
    kicker: "利瑪竇",
    text: "利瑪竇走廊和 LM402 門牌一起靠近，前門那一端先浮出來。",
    ambience: "牆面、門牌、轉角與腳步聲都被牽進視線，像一段即將落地的軌道。",
  },
  {
    id: "sunlight_bloom",
    start: 3.4,
    end: 4.6,
    kicker: "十一點",
    text: "光在百葉窗上亮起來，門牌和走廊一起被牽進視線。",
    ambience: "十一點的陽光從窗邊切進來，粉筆灰和空氣一起變得很清楚。",
  },
  {
    id: "front_door_settle",
    start: 4.6,
    end: 6,
    kicker: "前門走廊",
    text: "我要先把前門那句「妳在哪裡？」真正聽見，這一關才會開始。",
    ambience: "鏡頭收進前門走廊，鐘聲和風都站好位置，等第一句話落下來。",
  },
];

export const MOBILE_DENSITY_PRESETS = {
  regular: {
    stickSize: 138,
    thumbSize: 50,
    actionSize: 46,
    controlsClearance: 144,
    railMinHeight: 64,
  },
  compact: {
    stickSize: 124,
    thumbSize: 46,
    actionSize: 42,
    controlsClearance: 132,
    railMinHeight: 60,
  },
  tight: {
    stickSize: 108,
    thumbSize: 40,
    actionSize: 38,
    controlsClearance: 118,
    railMinHeight: 56,
  },
};

export const CAMERA_PRESETS = {
  desktop: {
    baseHeight: 150,
    focalScale: 0.96,
    frontCallPitch: 0.06,
  },
  mobile: {
    baseHeight: 162,
    focalScale: 0.88,
    frontCallPitch: 0.08,
  },
  intro: {
    start: { x: -548, y: 220, z: -250, yaw: 0.88, pitch: -0.26 },
    end: { x: -246, y: 168, z: 306, yaw: 0.16, pitch: -0.08 },
  },
};

export const ENDINGS = {
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
  duration: 5.4,
  lockWindow: 4.1,
  successWindow: [3.2, 4.4],
  introDuration: 6,
};
