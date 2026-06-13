export const STORAGE_KEYS = {
  introSeen: "lm402_intro_seen_v7",
  lookSensitivity: "lm402_look_sensitivity_v3",
  audioEnabled: "lm402_audio_enabled_v3",
  fontScale: "lm402_font_scale_v1",
  endingsCompleted: "lm402_endings_completed_v1",
  graphicsQuality: "lm402_graphics_quality_v1",
  unlockedSongs: "lm402_unlocked_songs_v1",
};
export const WORLD = {
  minX: -860,
  maxX: 2040,
  minZ: 72,
  maxZ: 3328,
  floorY: 0,
  dividerX: -210,
  corridor: {
    parapetHeight: 82,
    parapetTop: 118,
    columnWidth: 30,
    columnDepth: 30,
    columnZs: [
      132, 332, 532, 732, 932, 1132, 1332, 1532, 1732, 1932, 2132, 2332, 2532,
      2732, 2932, 3132,
    ],
    campusDepth: 1680,
  },
  stairs: {
    front: { z1: 72, z2: 244, landingZ: 196, label: "LM401 側樓梯間" },
    back: { z1: 3084, z2: 3328, landingZ: 3196, label: "LM404 側樓梯間" },
  },
  classroom: { frontZ: 560, backZ: 2484, aisleX: 1180, lightWellZ: 1564 },
  floorRooms: [
    { id: "LM401", label: "LM401", z1: 244, z2: 560, interactive: !1 },
    { id: "LM402", label: "LM402", z1: 560, z2: 2484, interactive: !0 },
    { id: "LM403", label: "LM403", z1: 2484, z2: 2800, interactive: !1 },
    { id: "LM404", label: "LM404", z1: 2800, z2: 3084, interactive: !1 },
  ],
  frontDoor: { z1: 2250, z2: 2418, center: { x: -210, y: 118, z: 2334 } },
  backDoor: { z1: 638, z2: 806, center: { x: -210, y: 118, z: 722 } },
  plaque: { x: -252, y: 192, z: 2176 },
  focusMark: { x: -236, y: 0, z: 726 },
  board: { z: 2424, x1: 520, x2: 1960, y1: 92, y2: 236 },
  rightWallWindows: [
    { z: 920, y1: 84, y2: 238, width: 236 },
    { z: 1280, y1: 84, y2: 238, width: 260 },
    { z: 1640, y1: 84, y2: 238, width: 260 },
    { z: 2e3, y1: 84, y2: 238, width: 236 },
  ],
  leftWallWindows: [
    { z: 882, y1: 92, y2: 238, width: 148 },
    { z: 1242, y1: 92, y2: 238, width: 246 },
    { z: 1602, y1: 92, y2: 238, width: 246 },
    { z: 1962, y1: 92, y2: 238, width: 224 },
  ],
  lightBeams: [
    /* 右牆(外牆)光束 — 陽光灑在學妹身上 */
    { side: "right", z: 920, width: 236, reach: 1020, alpha: 0.36 },
    { side: "right", z: 1280, width: 268, reach: 1160, alpha: 0.48 },
    { side: "right", z: 1640, width: 272, reach: 1220, alpha: 0.5 },
    { side: "right", z: 2e3, width: 236, reach: 1040, alpha: 0.36 },
    /* 左牆(走廊隔牆)光束 */
    { side: "left", z: 882, width: 148, reach: 980, alpha: 0.32 },
    { side: "left", z: 1242, width: 252, reach: 1120, alpha: 0.42 },
    { side: "left", z: 1602, width: 252, reach: 1140, alpha: 0.44 },
    { side: "left", z: 1962, width: 222, reach: 980, alpha: 0.32 },
  ],
  desks: [930, 1090, 1250, 1410, 1570, 1730, 1890, 2050].flatMap((e) =>
    [300, 580, 860, 1140, 1420, 1700, 1980].map((t) => ({ x: t, z: e })),
  ),
  notes: [
    { x: 1990, y: 62, z: 2040, label: "講義" },
    { x: 1970, y: 62, z: 2060, label: "白紙" },
  ],
  campusTrees: [{ x: -1296, z: 2246, scale: 7.4 }],
  wallLabels: [
    { id: "W-A", x: -790, y: 212, z: 154, rotateY: 0 },
    { id: "W-B", x: -248, y: 202, z: 2262, rotateY: Math.PI / 2 },
    { id: "W-C", x: 1240, y: 218, z: 2428, rotateY: 0 },
    { id: "W-D", x: 2052, y: 214, z: 1510, rotateY: -Math.PI / 2 },
    { id: "W-E", x: -188, y: 214, z: 722, rotateY: Math.PI / 2 },
    { id: "W-F", x: 1240, y: 214, z: 568, rotateY: 0 },
    { id: "W-G", x: -804, y: 186, z: 402, rotateY: Math.PI / 2 },
    { id: "W-H", x: -804, y: 186, z: 1434, rotateY: Math.PI / 2 },
    { id: "W-I", x: -804, y: 186, z: 2624, rotateY: Math.PI / 2 },
    { id: "W-J", x: -834, y: 146, z: 3180, rotateY: Math.PI / 2 },
    { id: "W-K", x: -790, y: 212, z: 3212, rotateY: 0 },
    { id: "W-L", x: -220, y: 214, z: 2898, rotateY: Math.PI / 2 },
  ],
};
export const stairsWarp = {
  cooldown: 6,
  effectReturnDelay: 1.05,
  triggerEdgePadding: 36,
  returnPoint: { x: -548, y: 0, z: 1978 },
  subtitle: {
    source: "女兒",
    text: "不管上樓還是下樓，都會回到四樓耶",
    ttl: 4.6,
  },
  front: {
    id: "front_stair",
    label: "前樓梯",
    z1: WORLD.stairs.front.z1,
    z2: WORLD.stairs.front.z2,
    landingZ: WORLD.stairs.front.landingZ,
  },
  back: {
    id: "back_stair",
    label: "後樓梯",
    z1: WORLD.stairs.back.z1,
    z2: WORLD.stairs.back.z2,
    landingZ: WORLD.stairs.back.landingZ,
  },
};
export const PHASES = [
  {
    id: "consciousness_market",
    index: "01",
    title: "意識菜市場",
    copy: "10:40，一束光打在阿姨身上。教室裡的意識菜市場正在開市，不同年紀的自己正在七嘴八舌。時空手錶走到 11:00 之前，先在教室裡感受這場內心風暴。",
  },
  {
    id: "front_call",
    index: "02",
    title: "前門來電",
    copy: "時空手錶停在 11:00。鐘響了，學長從樓梯走過來，站在 LM402 前門外，打了那通電話。",
  },
  {
    id: "rear_wait",
    index: "03",
    title: "後門等待",
    copy: "穿過教室，站到後門旁邊。腳步聲從走廊那一端傳過來了，把那一段又燙又美的等待，完整地留下來。",
  },
  {
    id: "eye_contact",
    index: "04",
    title: "一眼瞬間",
    copy: "讓光、站位與視角都對位。他看見她了，不是餘光，不是恍惚，是整個人被釘在原地那種看見。",
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
    z: 2324,
    radius: 194,
    revealIn: ["front_call", "rear_wait"],
  },
  {
    id: "plaque",
    type: "memory",
    label: "LM402 門牌",
    prompt: "看門牌",
    x: -250,
    y: 194,
    z: 2328,
    radius: 132,
    revealIn: [
      "consciousness_market",
      "front_call",
      "rear_wait",
      "eye_contact",
    ],
  },
  {
    id: "board",
    type: "memory",
    label: "黑板與時鐘",
    prompt: "看黑板",
    x: 1240,
    y: 164,
    z: 2418,
    radius: 232,
    revealIn: [
      "consciousness_market",
      "front_call",
      "rear_wait",
      "eye_contact",
    ],
  },
  {
    id: "seat",
    type: "memory",
    label: "靠窗座位",
    prompt: "看座位",
    x: 1896,
    y: 86,
    z: 2058,
    radius: 300,
    revealIn: [
      "consciousness_market",
      "front_call",
      "rear_wait",
      "eye_contact",
    ],
  },
  {
    id: "notes",
    type: "memory",
    label: "講義邊角",
    prompt: "看講義",
    x: 1912,
    y: 78,
    z: 2068,
    radius: 136,
    revealIn: ["rear_wait", "eye_contact"],
  },
  {
    id: "junior",
    type: "scene",
    label: "學妹",
    prompt: "聽她排練",
    x: 1896,
    y: 112,
    z: 2058,
    radius: 156,
    revealIn: ["consciousness_market", "front_call", "rear_wait"],
  },
  {
    id: "backdoor",
    type: "scene",
    label: "後門",
    prompt: "站在後門",
    x: -246,
    y: 112,
    z: 722,
    radius: 186,
    revealIn: ["rear_wait", "eye_contact"],
  },
  {
    id: "textbook",
    type: "memory",
    label: "攤開的課本",
    prompt: "看課本",
    x: 1144,
    y: 70,
    z: 1600,
    radius: 300,
    revealIn: ["consciousness_market", "front_call", "rear_wait"],
  },
  {
    id: "bulletin",
    type: "memory",
    label: "穿堂布告欄",
    prompt: "看布告欄",
    x: 480,
    y: 136,
    z: 608,
    radius: 320,
    revealIn: ["consciousness_market", "front_call", "rear_wait"],
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
      "一個穿白襯衫、牛仔短褲的女生，站在倒數第二排靠窗那一側，馬尾被光勾出很淡的邊，站得比自己以為的還要穩一點。",
      "那不是普通地站在那裡。她像把所有排練過的勇氣，都安安靜靜收進了那一格光裡。",
      "真正揪心的是，妳明明還沒看清她的眼睛，整顆心卻已經先一步知道，這一秒會在後來被想起很多次。",
      "她沒有多做什麼，只是站著。可是也正因為那麼安靜，後來每次回想起來，心都還是會跟著再縮一下。",
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
      "真正揪心的不是終於看見，而是知道自己就要看見，卻只能站在原地等那一秒自己走進來。",
      "所有更晚的人生、所有更遠的年份，像都先安靜地站在這道門後，只等那一眼把它們一起照亮。",
      "那幾步其實很短，卻像把很多年後會一再想起來的情緒，全都先折進了那幾秒裡。",
    ],
  },
};
export const INTERACTIONS = {
  consciousness_market: {
    title: "意識菜市場",
    eyebrow: "10:40 · 教室裡",
    copy: "不同年紀的自己，正在七嘴八舌。",
    lines: [
      { speaker: "29歲的聲音", text: "坐好。保持微笑，看起來鎮定就好。" },
      { speaker: "18歲的聲音", text: "可是我心臟跳好快……我好怕搞砸。" },
      {
        speaker: "29歲的聲音",
        text: "11 點鐘響的時候，他會先到前門，看不到妳。然後他會打電話。",
      },
      {
        speaker: "29歲的聲音",
        text: "妳就坐著。等他打來，只要說：『你走到後門。』",
      },
      { speaker: "33歲的聲音", text: "喜歡不是佔有。靠近需要對方同意。" },
      { speaker: "33歲的聲音", text: "讓他自己走過來，填滿那一段距離。" },
      { speaker: "39歲的聲音", text: "先活著。後來的事後來再說。" },
      { speaker: "39歲的聲音", text: "把這排桌子當成妳的邊界。不要往前跨。" },
      {
        speaker: "49歲的聲音",
        text: "不要把所有的話在二十分鐘裡說完。讓這二十分鐘好好發生。",
      },
      { speaker: "49歲的聲音", text: "所有更晚的心跳，都會從這裡長出來。" },
      {
        speaker: "49歲的聲音",
        text: "不要怕。留一點空白給命運，也留一點空白給妳自己。",
      },
      {
        speaker: "29歲的聲音",
        text: "選一件最小但最重要的事：不要跑掉，也不要做奇怪的事。",
      },
    ],
  },
  front_call: {
    eyebrow: "11:00｜前門",
    title: "前門來電",
    speaker: "學長",
    copy: [
      "我站在前門，東張西望，卻沒看到妳。",
      "「妳在哪裡？」",
      "這通電話一響，整條動線就會從前門折向後門。",
      "等一下他真的轉身走過去時，所有還沒被說出口的喜歡，都會先藏進那幾步裡。",
      "真正讓人心臟縮一下的，不只是他說了什麼，而是他還不知道，這一秒會把很多年後的所有人一起拉回來。",
      "他現在只是往前門再多看一眼，可是你知道，真正刺進心裡的那一眼，還在後門等著。",
      "這通電話並不喧鬧，反而像一根很細的線，先把走廊、教室、光和所有人的呼吸都悄悄拉成同一個節拍。",
      "妳明明站得那麼遠，可是一想到他等一下真的會轉身走過去，心裡還是先一步亂了起來。",
    ],
    choices: [
      {
        id: "front_call_phone",
        label: "打電話給學妹",
        detail: "拿起手機，撥給教室裡的她。",
        effect: "make_phone_call",
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
      {
        id: "board_eraser",
        label: "看看粉筆溝上的板擦",
        detail: "黑板剛被擦過。",
        effect: "lore_eraser",
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
      {
        id: "seat_note",
        label: "看桌角那張還沒寫的紙條",
        detail: "一張空白的紙條，安靜地躺在桌角。",
        effect: "open_note",
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
  junior_prephone: {
    eyebrow: "10:40 · 意識菜市場",
    title: "阿姨坐在座位上",
    speaker: "學妹（內心獨白）",
    copy: [
      "她坐在靠窗的座位，馬尾被光勾出很淡的邊。",
      "白襯衫、牛仔短褲，站得比自己以為的還要穩一點。",
      "心臟跳好快。外面看起來很鎮定，但裡面所有版本的自己正在七嘴八舌。",
      "29 歲的聲音說：『坐好。等 11 點鐘響，他會先到前門。然後他會打電話。』",
      "49 歲的聲音溫溫地說：『不要怕。留一點空白給命運，也留一點空白給妳自己。』",
    ],
    choices: [
      {
        id: "junior_listen",
        label: "繼續聽她們說",
        detail: "讓意識菜市場慢慢開市。",
        effect: "close_only",
      },
      {
        id: "junior_seat_pre",
        label: "記住這一格陽光",
        detail: "把靠窗座位的光收下來。",
        effect: "memory_seat",
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
      "我明明只是站在教室裡等他，可是心裡那種又想往前、又只能站好的感覺，已經先把整個人拉得很緊。",
      "我知道只要他真的走過來，很多沒有被說出口的事，就會在那一眼裡全部成立。",
      "那一秒最讓人受不了的，不是表白，而是明明什麼都還沒發生，心卻已經先一步被輕輕拉緊。",
      "她沒有退，也沒有往前，只是把自己穩穩留在那格光裡。真正動人的地方，反而是那種明明緊張到不行、卻還是硬把自己站好的安靜。",
      "後來每次想起來，最先回來的不是台詞，而是她抬起眼睛以前，先把自己安安靜靜放進那一道光裡的樣子。",
    ],
    choices: [
      {
        id: "junior_backdoor",
        label: "跟學長說：你走到後門。",
        detail: "說出那句排練過無數次的台詞，讓一眼瞬間真正發生。",
        effect: "trigger_ending_sequence",
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
      "等他真的從光裡走出來以前，整個世界都像先屏住了呼吸，只剩妳和那道門洞知道，下一秒會有多痛又有多美。",
      "因為一旦他真的走到這裡，妳會知道，自己再也不可能回到還沒看見他的那一個版本。",
      "妳不是在等一個人走過來而已，妳是在等很多年後還會讓人想起來發疼的那一秒，自己慢慢走進妳眼前。",
      "腳步聲從走廊那一端傳過來了。一步、兩步，每一步都在把這一秒拉得更長、更薄、更燙。",
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
  aunt_market: {
    eyebrow: "意識菜市場",
    title: "菜市場裡的我們",
    speaker: "不同年齡的聲音",
    copy: [
      "10:40，一束光打在阿姨身上，不是陽光，是比陽光更安靜、更古老的光。這是阿姨的第二次穿越。",
      "那道光落在她29歲的身體上，喚醒的卻是十八歲的意識。她坐在那裡，眼睛裡同時映著兩個時空的走廊。",
      "18 歲阿姨的意識正式上線。從這一刻起，她是這間教室的主角。",
      "不同年齡的「我」一下子全擠進來，像同一條巷子忽然開了好多個攤位。",
      "有人說話很穩、有人語調很尖，有人聽起來像剛哭完，還有一個聲音，溫溫的，好像已經看過很多次日出。",
      "菜市場裡每個攤位都在叫賣自己的真理：有人喊要衝，有人喊要退，有人喊「先活」、有人喊「要留白」。",
      "29 歲的聲音像在幫大家收攤：「好，回到現在。既然妳有能力選，就先選一件最小、但最重要的事，不要逃，也不要做奇怪的事情。」",
      "49 歲的聲音笑了笑：「留一點空白給命運，也留一點空白給妳自己。」",
      "菜市場慢慢安靜下來。聲音一個一個退到巷口，只剩下 29 歲在旁邊陪我呼吸。",
    ],
    choices: [
      {
        id: "aunt_market_stay",
        label: "讓菜市場的聲音留久一點",
        detail: "把不同年齡的自己都聽一遍。",
        effect: "memory_aunt_market",
      },
      {
        id: "aunt_market_leave",
        label: "讓攤位們收攤",
        detail: "帶走她們的溫度，回到 LM402。",
        effect: "collect_aunt_market",
      },
    ],
  },
  junior_rear_choices: {
    eyebrow: "11:07 · 後門",
    title: "一眼瞬間的三條路",
    speaker: "女兒",
    copy: [
      "學長已經走到後門了。阿姨站在門洞的那一格光裡，抬起頭。",
      "接下來這一秒，會決定這個故事最後長成什麼形狀。",
      "是讓兩條視線真正對上，還是讓其中一個人先把眼睛別開？",
      "又或者，有些事，阿姨其實一直都知道。",
    ],
    choices: [
      {
        id: "ending_perfect_eye",
        label: "我要乖乖待著後門，不要向前也不要向後。",
        detail: "（阿姨的選擇二選一）站好就好。讓那一眼自己發生。",
        effect: "ending_perfect_eye",
      },
      {
        id: "ending_restrain",
        label: "我要往前去抱學長，我好想他。",
        detail: "（阿姨的選擇二選一）可是如果往前衝，會不會改變什麼？",
        effect: "ending_restrain",
      },
      {
        id: "ending_secret_heart",
        label: "我決定先飛進阿姨的心裡。",
        detail: "（這是我的選擇，我真的想先看看。）阿姨的心裡面，到底藏了什麼？",
        effect: "ending_secret_heart",
      },
    ],
  },
  /* ── 玩家控制學妹走到後門後，點擊學長的二選一 ── */
  senior_backdoor_choices: {
    eyebrow: "11:07 · 後門",
    title: "學長就在面前",
    speaker: "學妹",
    copy: [
      "他就站在那裡。光剛好落在我們兩個人之間。",
      "心裡有一個聲音說：衝過去抱他。另一個聲音說：站好就好。",
    ],
    choices: [
      {
        id: "choice_a_observe",
        label: "不往前也不往後，不要說話，就乖乖看著學長",
        detail: "站好就好。讓那一眼自己發生。",
        effect: "switch_to_daughter",
      },
      {
        id: "choice_b_hug",
        label: "抱抱學長，跟他説我很想他",
        detail: "可是如果往前衝，時間會怎麼反應？",
        effect: "rewind_hug_attempt",
      },
    ],
  },
  /* ── 女兒視角：與把拔互動 ── */
  daughter_father: {
    eyebrow: "女兒的視角",
    title: "把拔的聲音",
    speaker: "把拔",
    copy: [
      "（說出口的話）「也太像徐若瑄了吧！」",
    ],
    choices: [
      {
        id: "daughter_father_close",
        label: "聽完了",
        detail: "把把拔的聲音收好。",
        effect: "close_only",
      },
    ],
  },
  senior_rear: {
    eyebrow: "11:05 · 走廊",
    title: "走向後門的那段路",
    speaker: "把拔（現在的聲音）",
    copy: [
      "那段從前門到後門的路，其實不長。大概就是半條走廊、十幾根柱子、兩面窗。",
      "可是走在那段路上的時候，我覺得整個走廊的光都變慢了。",
      "我當時不知道那叫什麼。後來才知道，那就是你阿姨。",
      "走過那道門洞的時候，粉筆味忽然濃了一下。然後我看見她了。",
      "她站在門邊，光落在她那一側，像有人替她先畫好了位置。",
      "我心裡先跳出一句很不正經的念頭：『也太像徐若瑄了吧。』",
      "可是真正讓我站住的，不是這句話，是她眼睛抬起來那一秒，我好像已經看見後來所有的事了。",
      "後來我才知道，那一眼不是開始，是命運把往後二十年的重量，全部壓縮進那一秒裡了。",
    ],
    choices: [
      {
        id: "senior_rear_listen",
        label: "聽把拔說完",
        detail: "讓他把二十年前那一段路走完。",
        effect: "listen_father_murmur",
      },
      {
        id: "senior_rear_fly",
        label: "飛進把拔心裡",
        detail: "女兒化作意識，潛入學長的視角。",
        effect: "fly_into_father_heart",
      },
    ],
  },
  watch: {
    eyebrow: "時空手錶",
    title: "命運阿嬤的禮物",
    speaker: "女兒",
    copy: [
      "這支手錶，是命運阿嬤送我的七歲生日禮物。",
      "它會自己對時，不管我飛到哪一條時間線，錶面永遠停在那一格該停的時刻。",
      "現在它指著 10:59。再過一分鐘，鐘聲就會響，把拔會從那頭走過來。",
      "我握著它，像握著一整段倒數。每一次看錶，都是在數同一秒。",
    ],
    choices: [
      {
        id: "watch_close",
        label: "把錶收回口袋",
        detail: "繼續等那一秒。",
        effect: "close_only",
      },
    ],
  },
  textbook: {
    eyebrow: "10:40 · 靠走道的課桌",
    title: "攤開的〈背影〉",
    speaker: "女兒",
    copy: [
      "課桌上攤著一本國文課本，翻到〈背影〉那一頁。",
      "書角有一條細細的紅線，亮了一下，就是它，在第二次段考前的午後，把睡著的我牽到這裡。",
      "我才知道，那道光的年紀，是十八歲。",
      "紅線從書角一路延伸，指向教室後門。那一秒，正在那裡等我。",
    ],
    choices: [
      {
        id: "textbook_close",
        label: "順著紅線看向後門",
        detail: "記住自己是怎麼走進這一秒的。",
        effect: "close_only",
      },
      {
        id: "textbook_earphone",
        label: "戴上命運阿嬤的時空耳機",
        detail: "同時聽見兩個人的心。",
        effect: "open_earphone",
      },
    ],
  },
  bulletin: {
    eyebrow: "意識菜市場 · 1994",
    title: "穿堂的布告欄",
    speaker: "女兒",
    copy: [
      "意識菜市場最熱鬧的時候，牆上浮出一面 1994 年的布告欄。",
      "那是阿姨十八歲、高三的穿堂。禮堂喇叭放著畢業歌，那句「傷離別」還在梁上盤旋。",
      "風把一封寫滿她芳名的情書，紙角掀了起來。",
      "她伸出食指，輕輕把紙角壓平，卻沒有撕下來。",
      "她不讓七嘴八舌的喧鬧替她決定什麼。就像等一下，她會在後門安安靜靜地站好。",
    ],
    choices: [
      {
        id: "bulletin_names",
        label: "讀情書上一封封的芳名",
        detail: "誰把她的名字寫得那麼用力。",
        effect: "open_bulletin_names",
      },
      {
        id: "bulletin_song",
        label: "聽禮堂飄來的那首畢業歌",
        detail: "第一個長音「傷離別」還在梁上。",
        effect: "open_bulletin_song",
      },
      {
        id: "bulletin_close",
        label: "把情書的紙角輕輕壓平",
        detail: "留一點空白給命運。",
        effect: "lore_bulletin",
      },
    ],
  },
  bulletin_names: {
    eyebrow: "意識菜市場 · 1994",
    title: "一封封的芳名",
    speaker: "女兒",
    copy: [
      "她的名字，被不熟練卻用力的筆畫，寫進一封封情書，外圈密密畫滿愛心。",
      "可是十八歲的阿姨，一封都沒有回。",
      "她把指尖貼在自己的脈搏上，像在搜尋命運密碼：如果命中注定會遇見那個人，他現在在哪裡？",
    ],
    choices: [
      {
        id: "bulletin_names_close",
        label: "他在十一年後的那道後門外",
        detail: "2005 年，他會從前門的樓梯走上來。",
        effect: "close_only",
      },
    ],
  },
  bulletin_song: {
    eyebrow: "意識菜市場 · 1994",
    title: "傷離別",
    speaker: "女兒",
    copy: [
      "禮堂喇叭放著畢業歌，第一個長音「傷離別」在梁上盤旋。",
      "十八歲的她還不知道，真正的離別，要等到很多年以後。",
      "也還不知道，會有一個人，把這首歌，聽成兩個人的。",
    ],
    choices: [
      {
        id: "bulletin_song_close",
        label: "把這個夏天輕輕收好",
        detail: "原來傷離別，是先學會相遇。",
        effect: "close_only",
      },
    ],
  },
  note: {
    eyebrow: "靠窗座位 · 桌角",
    title: "還沒寫的紙條",
    speaker: "學妹（內心獨白）",
    copy: [
      "靠窗座位的桌角，放著一張還沒寫的空白紙條。",
      "她還不知道，2006 年 1 月，她會在一張這樣的紙條上寫下：「我走了，你要好好照顧自己。」",
      "然後把它放在學長的 125 機車上。",
      "那時候的她，只會用「離開」來照顧一個人。",
    ],
    choices: [
      {
        id: "note_future",
        label: "想像她未來會在這張紙上寫什麼",
        detail: "2006 年 1 月，她會寫下一句話。",
        effect: "open_note_future",
      },
      {
        id: "note_why",
        label: "她為什麼只會用「離開」照顧人",
        detail: "有些溫柔，年輕時只懂得用背影表達。",
        effect: "open_note_why",
      },
      {
        id: "note_close",
        label: "把紙條留在原地",
        detail: "有些話，要很多年後才寫得出來。",
        effect: "close_only",
      },
    ],
  },
  note_future: {
    eyebrow: "靠窗座位 · 桌角",
    title: "2006 年 1 月的那張紙條",
    speaker: "學妹（內心獨白）",
    copy: [
      "2006 年 1 月，她會在一張這樣的紙條上寫下：",
      "「我走了，你要好好照顧自己。」",
      "然後把它放在學長的 125 機車上。",
    ],
    choices: [
      {
        id: "note_future_close",
        label: "很多年後，她才敢補上後半句",
        detail: "「我說我走了，但我從沒離開過。」",
        effect: "close_only",
      },
    ],
  },
  note_why: {
    eyebrow: "靠窗座位 · 桌角",
    title: "用離開照顧一個人",
    speaker: "學妹（內心獨白）",
    copy: [
      "那時候的她，只會用「離開」來照顧一個人。",
      "把自己先收走，怕留下來，會變成對方的負擔。",
      "她還要走很長的路，才學得會：留下來，也是一種溫柔。",
    ],
    choices: [
      {
        id: "note_why_close",
        label: "把這份笨拙的溫柔收好",
        detail: "她的背影，其實一直朝著他。",
        effect: "close_only",
      },
    ],
  },
  earphone: {
    eyebrow: "命運阿嬤的禮物",
    title: "時空耳機",
    speaker: "女兒",
    copy: [
      "命運阿嬤說：「妳上次第一次段考考得不錯。這副『時空耳機』給妳，戴上去就知道了。」",
      "我戴上時空耳機，整間教室的聲音忽然分了層。",
      "我聽見的不只是 2005 年的這一秒，還有把拔和阿姨各自心裡，那條一直沒斷的線。",
      "原來戴上它，就能同時聽見兩個人沒說出口的話。",
    ],
    choices: [
      {
        id: "earphone_close",
        label: "把耳機摘下來",
        detail: "聽過一次，就再也假裝沒聽過。",
        effect: "close_only",
      },
    ],
  },
};
export const INTRO_BEATS = [
  {
    id: "daughter_glow",
    start: 0,
    end: 3.8,
    kicker: "女兒",
    text: "我又夢見自己被那條紅線輕輕帶起來，整個人像真的往前飛出去。",
    ambience:
      "黑暗裡先亮起一條細細的紅線，像心跳一樣，一下一下，把我從夢裡托高。風還沒出現，整個身體已經先開始飛。",
  },
  {
    id: "red_thread",
    start: 3.8,
    end: 7.4,
    kicker: "紅線",
    text: "只要我沿著那條屬於把拔與阿姨的紅線往前飛，時間就會自己把路讓開。",
    ambience:
      "紅線先劃開風，再掠過從一樓長上來的大樹。樹冠被十一點前的光照得像一片會呼吸的海，整層四樓正慢慢浮上來。",
  },
  {
    id: "fourth_floor_arrives",
    start: 7.4,
    end: 11.4,
    kicker: "利瑪竇",
    text: "利瑪竇四樓的風、四間教室長度的走廊，和 LM402 那面門牌一起慢慢浮出來。",
    ambience:
      "無天花板的外廊、柱列、兩端樓梯間、LM401 到 LM404 和整條四樓走廊一起靠近，像一段真正落到校園裡的電影軌道。",
  },
  {
    id: "sunlight_bloom",
    start: 11.4,
    end: 14.8,
    kicker: "十一點",
    text: "十一點的陽光先灑在矮牆和樹冠上，再沿著前門門洞、黑板那一端和教室兩面一起慢慢推進來。",
    ambience:
      "風、粉筆灰、玻璃反光和地面亮斑一起站好位置。走廊那一道暖白的光先到了，教室裡才跟著被慢慢打亮。",
  },
  {
    id: "front_door_settle",
    start: 14.8,
    end: 18.4,
    kicker: "前門走廊",
    text: "我要先把前門那句「妳在哪裡？」真正聽見，這整層樓才會把那一秒交給我。",
    ambience:
      "鏡頭收進 LM402 前門外的走廊。學長剛從 LM401 那側樓梯走上來，門洞、門牌、矮牆外的日光和那口還沒說完的氣息終於一起站進畫面裡。",
  },
];
export const MOBILE_DENSITY_PRESETS = {
  regular: {
    stickSize: 138,
    thumbSize: 50,
    actionSize: 46,
    controlsClearance: 92,
    railMinHeight: 62,
  },
  compact: {
    stickSize: 124,
    thumbSize: 46,
    actionSize: 42,
    controlsClearance: 82,
    railMinHeight: 58,
  },
  tight: {
    stickSize: 108,
    thumbSize: 40,
    actionSize: 38,
    controlsClearance: 72,
    railMinHeight: 54,
  },
};
export const RENDER_QUALITY_TIERS = {
  desktop: {
    id: "desktop",
    label: "Desktop Cinematic",
    shadowMapSize: 2048,
    maxPixelRatio: 1.5,
    dustCount: 96,
    mirrorOpacity: 0.12,
    portraitBoost: 1,
  },
  mobile: {
    id: "mobile",
    label: "Mobile Balanced",
    shadowMapSize: 896,
    maxPixelRatio: 1,
    dustCount: 48,
    mirrorOpacity: 0.08,
    portraitBoost: 0.92,
  },
};
export const CHARACTER_ASSET_MANIFEST = {
  junior2005: {
    id: "junior2005",
    label: "2005 學妹定稿",
    mode: "portrait-shell",
    deliveryMode: "glb-first",
    liveDisplayPolicy: "runtime_only",
    fallbackMode: "procedural",
    sourceBlendUrl: "assets/lm402/characters/junior/work/junior_hero_master.blend",
    runtimeModelUrl: "assets/lm402/characters/junior/exports/junior_2005_runtime.glb",
    heroCloseupModelUrl:
      "assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb",
    runtimeTierPolicy: {
      desktop: {
        preferred: "junior_2005_runtime.glb",
        runtimeModelUrl: "assets/lm402/characters/junior/exports/junior_2005_runtime.glb",
        heroCloseupModelUrl:
          "assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb",
        fallback: "procedural_shell_until_runtime_bundle_exists",
      },
      mobile: {
        preferred: "junior_2005_runtime_mobile.glb",
        runtimeModelUrl:
          "assets/lm402/characters/junior/exports/junior_2005_runtime_mobile.glb",
        heroCloseupModelUrl:
          "assets/lm402/characters/junior/exports/junior_2005_hero_closeup.glb",
        fallback: "decimated_glb_or_procedural_shell",
      },
      missingAsset: "procedural_fallback",
    },
    animationClips: [
      {
        id: "idle_breathe",
        label: "站定呼吸",
        loop: !0,
        notes: "日常待機，保持胸口與肩頸的自然起伏。",
      },
      {
        id: "rear_wait",
        label: "後門等待",
        loop: !0,
        notes: "後門站定、微轉身、保持眼神留白。",
      },
      {
        id: "micro_glance",
        label: "微抬頭",
        loop: !1,
        notes: "從低頭到抬眼的瞬間，供 senior POV 轉場。",
      },
      {
        id: "eyes_hold",
        label: "一眼停留",
        loop: !1,
        notes: "學長看見學妹的那一秒，讓停頓與呼吸一起成立。",
      },
      {
        id: "pony_sway",
        label: "髮束晃動",
        loop: !0,
        notes: "馬尾、側髮與髮尾在停步與轉身時的自然擺動。",
      },
    ],
    materialProfiles: {
      skin_face: {
        profile: "pbr_subsurface_approx",
        notes: ["臉部保留柔和高光", "不要塑膠感", "close-up 仍要有膚質層次"],
      },
      skin_body: {
        profile: "soft_pbr",
        notes: ["身體膚色略淡於臉部", "與長袖襯衫、光影一起成立"],
      },
      hair_cards: {
        profile: "alpha_hair_cards",
        notes: ["瀏海要分束", "側髮貼臉但不黏成黑牆", "馬尾尾端要有重量感"],
      },
      shirt_white: {
        profile: "cotton_pbr",
        notes: ["白襯衫要有布料皺摺與柔反射", "不能像純白平面"],
      },
      shorts_denim: {
        profile: "denim_pbr",
        notes: ["牛仔短褲要有布紋與磨損層次"],
      },
      shoes: {
        profile: "school_shoes_pbr",
        notes: ["保持校園寫實感", "不要過度亮面"],
      },
      scrunchie: {
        profile: "accent_pbr",
        notes: ["髮圈作為小亮點", "不搶臉部焦點"],
      },
    },
    fallbackPolicy: {
      missingRuntime: "procedural_shell",
      missingHeroCloseup: "runtime_glb_camera_crop",
      preserveGameplay: !0,
      preserveFaceSilhouette: !0,
    },
    referenceSet: {
      folder: "assets/lm402/characters/junior/reference",
      requiredViews: ["front", "left_front", "left_side", "back", "closeup", "outfit"],
      notes: [
        "2005 定稿照是唯一主參考，不混用其他年代版本當主臉。",
        "手工建模時先鎖臉型與髮束，再做服裝和材質。",
      ],
    },
    exportTargets: {
      runtime: "junior_2005_runtime.glb",
      heroCloseup: "junior_2005_hero_closeup.glb",
      mobile: "junior_2005_runtime_mobile.glb",
      manifest: "junior_2005_export_manifest.json",
    },
    textures: {
      front: new URL(
        "../../2005年學妹定稿/2005年學妹正面長袖襯衫定稿.png",
        import.meta.url,
      ).href,
      side: new URL(
        "../../2005年學妹定稿/2005年學妹左側長袖襯衫定稿.png",
        import.meta.url,
      ).href,
      frontClose: new URL(
        "../../2005年學妹定稿/2005年學妹正面長袖襯衫定稿特寫.png",
        import.meta.url,
      ).href,
      leftFrontClose: new URL(
        "../../2005年學妹定稿/2005年學妹左前長袖襯衫定稿特寫.png",
        import.meta.url,
      ).href,
      rightFrontClose: new URL(
        "../../2005年學妹定稿/2005年學妹右前長袖襯衫定稿特寫.png",
        import.meta.url,
      ).href,
      sideClose: new URL(
        "../../2005年學妹定稿/2005年學妹左側長袖襯衫定稿特寫.png",
        import.meta.url,
      ).href,
      backClose: new URL(
        "../../2005年學妹定稿/2005年學妹背面長袖襯衫定稿特寫.png",
        import.meta.url,
      ).href,
    },
    notes: [
      "白襯衫、牛仔短褲、中高馬尾、整體比例偏纖細。",
      "臉小、眼神清澈、第一眼要讀得出『也太像徐若瑄了吧』的震撼。",
      "站在教室光影裡要自然成為焦點，不能只是靜態貼圖。",
    ],
    audioBootPolicy: "always_off",
  },
};
export const UI_VISIBILITY_PRESETS = {
  intro: {
    hud: !0,
    speedWidget: !1,
    audioWidget: !1,
    fontWidget: !1,
    timeWatch: !1,
    objectivePrompt: !1,
    focusPrompt: !1,
    bottomDock: !0,
    transcriptDock: !1,
    debugPanel: !1,
    pointerPill: !1,
    mobileControls: !1,
  },
  play: {
    hud: !0,
    speedWidget: !0,
    audioWidget: !0,
    fontWidget: !0,
    timeWatch: !0,
    objectivePrompt: !0,
    focusPrompt: !0,
    bottomDock: !0,
    transcriptDock: !0,
    debugPanel: !1,
    pointerPill: !0,
    mobileControls: !0,
  },
  ending: {
    hud: !1,
    speedWidget: !1,
    audioWidget: !1,
    fontWidget: !1,
    timeWatch: !1,
    objectivePrompt: !1,
    focusPrompt: !1,
    bottomDock: !1,
    transcriptDock: !1,
    debugPanel: !1,
    pointerPill: !1,
    mobileControls: !1,
  },
};
export const CAMERA_PRESETS = {
  desktop: { baseHeight: 150, focalScale: 0.94, frontCallPitch: 0.02 },
  mobile: { baseHeight: 162, focalScale: 0.84, frontCallPitch: 0.04 },
  intro: {
    start: { x: -1120, y: 260, z: 40, yaw: 0.96, pitch: -0.24 },
    end: { x: -448, y: 176, z: 2242, yaw: 0.18, pitch: -0.07 },
  },
};
export const ENDINGS = {
  perfect: {
    kicker: "完美結局",
    title: "女兒飛到一眼瞬間那一秒",
    copy: "學妹走到教室內的後門站定，學長停在走廊後門前，兩人隔著那道門洞面對面。一道光落在學妹身上，學長心裡先被那句「也太像徐若瑄了吧！」狠狠撞了一下；等鏡頭慢慢收進眼睛與呼吸，剩下的就只是一句更深的確認：「這一次，依然再次遇見妳。」",
  },
  canon: {
    kicker: "正史結局",
    title: "後門那一眼",
    copy: "他出現在光裡。兩條視線對上的瞬間，時間真的像往旁邊退了一步。你站在後門旁，剛好把這一秒完整接住；其餘交給目光與無聲的節拍。",
  },
  memory: {
    kicker: "記憶豐滿結局",
    title: "把光、風、門牌與紙邊都留下來",
    copy: "你不只看見那一眼，也把黑板、門牌、靠窗座位、講義邊角與後門那一點空白都收進來。於是這一格不只是一秒，而是整個 LM402 的聲光味一起被存下來。",
  },
  missed: {
    kicker: "錯過結局",
    title: "你只聽見動靜，沒看清那一秒",
    copy: "鐘聲、椅腳聲、電話與風都到了，可你的站位或視線慢了一點。紅線在真正對眼之前先回彈，只留下走廊裡一抹逆光和一句還沒來得及說出口的話。",
  },
  perfect_eye: {
    kicker: "一眼瞬間完美結局",
    title: "這一次，依然再次遇見妳。",
    copy: "鏡頭最後化為學長的雙眼，定定地看著她。畫面下方浮現一行字：「這一次，依然再次遇見妳。」光慢慢收進黑。",
  },
  restrain: {
    kicker: "忍住想念結局",
    title: "我的手慢慢在消失了。",
    copy: "畫面全黑。白色的字慢慢浮出來：「我的手慢慢在消失了。」五秒之後，又浮出另一行字：「阿姨好像忍住沒有抱把拔，我的手又跑出來了，好像在變魔術喔。」",
  },
  secret_heart: {
    kicker: "學妹心底的秘密結局",
    title: "原來阿姨跟把拔互相是一眼瞬間",
    copy: "彩虹色的紅線特效飛舞，字幕浮現：「我在阿姨的心裡飛來飛去，阿姨的心底都是滿滿把拔」。畫面漸白，中央浮現彩虹色文字：「原來阿姨跟把拔互相是一眼瞬間」。",
  },
};
export const CINEMATIC_TIMELINE = {
  duration: 5.8,
  lockWindow: 4.1,
  successWindow: [3.2, 4.4],
  introDuration: 18.4,
  perfectDuration: 38.2,
  perfectEstablishEnd: 2.2,
  perfectOrbitStart: 2.2,
  perfectOrbitEnd: 14.2,
  perfectTransitionEnd: 17.4,
  perfectSeniorPovStart: 17.4,
  perfectSeniorPovEnd: 27.6,
  perfectEyesStart: 27.6,
  perfectEyesEnd: 37.6,
  perfectOverlayAt: 37.6,
  perfectLine1At: 27.6,
  perfectLine2At: 32.6,
};
export const perfectSubtitleTrack = {
  startAt: CINEMATIC_TIMELINE.perfectLine1At,
  line1: {
    source: "學長（心底的聲音）",
    text: "也太像徐若瑄了吧！",
    duration: 5,
  },
  line2: {
    source: "",
    text: "這一次，依然再次遇見妳。",
    duration: 10,
  },
  overlayAt: CINEMATIC_TIMELINE.perfectOverlayAt,
  overlayDelay: 10,
};
export const AUTHOR_REVIEW_DIALOGUE_DRAFTS = [
  {
    id: "intro_daughter",
    label: "開場女兒旁白",
    status: "needs_author_review",
    lines: [
      "我不是來看一個故事的，我是來親眼看見把拔當年那一眼。",
      "只要沿著紅線飛進去，時間就會把 LM402 那一秒重新打亮。",
    ],
  },
  {
    id: "rear_wait",
    label: "學妹後門等待",
    status: "needs_author_review",
    lines: [
      "真正讓人快站不住的，不是他等一下會說什麼，而是我知道他快看見我了。",
      "只要我沒有往前多跨一步，很多年後的我們，就都還能回到這裡謝謝現在的我。",
    ],
  },
  {
    id: "senior_pov",
    label: "學長 POV 一眼台詞",
    status: "needs_author_review",
    lines: [
      "我明明只抬頭看了一眼，心裡卻像已經把她記了很久。",
      "也太像徐若瑄了吧！",
    ],
  },
  {
    id: "ending_overlay",
    label: "結局收束句",
    status: "needs_author_review",
    lines: [
      "每當我閉上眼睛，我就可以看見妳。",
      "後來所有『後來』，都是從這一眼開始。",
    ],
  },
];
