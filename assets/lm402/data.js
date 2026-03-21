export const STORAGE_KEYS = {
  introSeen: "lm402_intro_seen_v7",
  lookSensitivity: "lm402_look_sensitivity_v3",
  audioEnabled: "lm402_audio_enabled_v3",
  fontScale: "lm402_font_scale_v1",
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
    columnZs: [132, 332, 532, 732, 932, 1132, 1332, 1532, 1732, 1932, 2132, 2332, 2532, 2732, 2932, 3132],
    campusDepth: 1680,
  },
  stairs: {
    front: { z1: 72, z2: 244, landingZ: 196, label: "LM401 側樓梯間" },
    back: { z1: 3084, z2: 3328, landingZ: 3196, label: "LM404 側樓梯間" },
  },
  classroom: {
    frontZ: 560,
    backZ: 2484,
    aisleX: 1180,
    lightWellZ: 1564,
  },
  floorRooms: [
    { id: "LM401", label: "LM401", z1: 244, z2: 560, interactive: false },
    { id: "LM402", label: "LM402", z1: 560, z2: 2484, interactive: true },
    { id: "LM403", label: "LM403", z1: 2484, z2: 2800, interactive: false },
    { id: "LM404", label: "LM404", z1: 2800, z2: 3084, interactive: false },
  ],
  frontDoor: { z1: 2250, z2: 2418, center: { x: -210, y: 118, z: 2334 } },
  backDoor: { z1: 638, z2: 806, center: { x: -210, y: 118, z: 722 } },
  plaque: { x: -252, y: 192, z: 2176 },
  focusMark: { x: -236, y: 0, z: 726 },
  board: { z: 2424, x1: 520, x2: 1960, y1: 92, y2: 236 },
  rightWallWindows: [
    { z: 920, y1: 84, y2: 256, width: 236 },
    { z: 1280, y1: 84, y2: 260, width: 260 },
    { z: 1640, y1: 84, y2: 260, width: 260 },
    { z: 2000, y1: 84, y2: 256, width: 236 },
  ],
  leftWallWindows: [
    { z: 882, y1: 92, y2: 246, width: 148 },
    { z: 1242, y1: 92, y2: 250, width: 246 },
    { z: 1602, y1: 92, y2: 250, width: 246 },
    { z: 1962, y1: 92, y2: 246, width: 224 },
  ],
  lightBeams: [
    { side: "right", z: 920, width: 236, reach: 1020, alpha: 0.36 },
    { side: "right", z: 1280, width: 268, reach: 1160, alpha: 0.48 },
    { side: "right", z: 1640, width: 272, reach: 1220, alpha: 0.50 },
    { side: "right", z: 2000, width: 236, reach: 1040, alpha: 0.36 },
    { side: "left", z: 882, width: 148, reach: 980, alpha: 0.32 },
    { side: "left", z: 1242, width: 252, reach: 1120, alpha: 0.42 },
    { side: "left", z: 1602, width: 252, reach: 1140, alpha: 0.44 },
    { side: "left", z: 1962, width: 222, reach: 980, alpha: 0.32 },
  ],
  desks: [930, 1090, 1250, 1410, 1570, 1730, 1890, 2050].flatMap((z) =>
    [300, 580, 860, 1140, 1420, 1700, 1980].map((x) => ({ x, z }))
  ),
  notes: [
    { x: 1896, y: 75, z: 2058, label: "講義" },
    { x: 1922, y: 75, z: 2072, label: "白紙" },
  ],
  campusTrees: [
    { x: -1296, z: 2246, scale: 7.4 },
  ],
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

/* ✅ 已校對：全部文案與 EP3、EP11、EP38 故事原文核實完成 */
/* 10:40–11:00 為意識菜市場探索期（時空手錶倒數 20 分鐘）；front_call 在 11:00 手錶凍結後才正式啟動 */
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
    copy: "穿過教室，站到後門旁邊，把那一段等待與空白留下來。",
  },
  {
    id: "eye_contact",
    index: "04",
    title: "一眼瞬間",
    copy: "讓光、站位與視角都對位，看見那一秒真正的樣子。",
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
    revealIn: ["consciousness_market", "front_call", "rear_wait", "eye_contact"],
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
    revealIn: ["consciousness_market", "front_call", "rear_wait", "eye_contact"],
  },
  {
    id: "seat",
    type: "memory",
    label: "靠窗座位",
    prompt: "看座位",
    x: 1896,
    y: 86,
    z: 2058,
    radius: 170,
    revealIn: ["consciousness_market", "front_call", "rear_wait", "eye_contact"],
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
];

/* ✅ 已校對：片段文案與 EP38 原文核實；seat 片段「馬尾被光勾出很淡的邊」為作者確認保留之遊戲補充描寫 */
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

/* ✅ 已校對：對話文案與 EP3、EP11、EP38 故事原文核實完成 */
export const INTERACTIONS = {
  consciousness_market: {
    title: "意識菜市場",
    eyebrow: "10:40 · 教室裡",
    copy: "不同年紀的自己，正在七嘴八舌。",
    lines: [
      { speaker: "29歲的聲音", text: "坐好。保持微笑，看起來鎮定就好。" },
      { speaker: "18歲的聲音", text: "可是我心臟跳好快……我好怕搞砸。" },
      { speaker: "29歲的聲音", text: "11 點鐘響的時候，他會先到前門，看不到妳。然後他會打電話。" },
      { speaker: "29歲的聲音", text: "妳就坐著。等他打來，只要說：『你走到後門。』" },
      { speaker: "33歲的聲音", text: "喜歡不是佔有。靠近需要對方同意。" },
      { speaker: "33歲的聲音", text: "讓他自己走過來，填滿那一段距離。" },
      { speaker: "39歲的聲音", text: "先活著。後來的事後來再說。" },
      { speaker: "39歲的聲音", text: "把這排桌子當成妳的邊界。不要往前跨。" },
      { speaker: "49歲的聲音", text: "不要把所有的話在二十分鐘裡說完。讓這二十分鐘好好發生。" },
      { speaker: "49歲的聲音", text: "所有更晚的心跳，都會從這裡長出來。" },
      { speaker: "49歲的聲音", text: "不要怕。留一點空白給命運，也留一點空白給妳自己。" },
      { speaker: "29歲的聲音", text: "選一件最小但最重要的事：不要跑掉，也不要做奇怪的事。" },
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
  /* ✅ 已校對：改為對齊 EP38 意識菜市場原文——不同年齡的「我」像攤位擠進來；光束打在阿姨身上觸發第二次穿越 */
  aunt_market: {
    eyebrow: "意識菜市場",
    title: "菜市場裡的我們",
    speaker: "不同年齡的聲音",
    copy: [
      "10:40，一束光打在阿姨身上——不是陽光，是比陽光更安靜、更古老的光。這是阿姨的第二次穿越。",
      "那道光落在一個十八歲女生身上。她站在那裡，眼睛裡同時映著兩個時空的走廊。",
      "18 歲阿姨的意識正式上線。從這一刻起，她是這間教室的主角。",
      "不同年齡的「我」一下子全擠進來，像同一條巷子忽然開了好多個攤位。",
      "有人說話很穩、有人語調很尖，有人聽起來像剛哭完，還有一個聲音，溫溫的，好像已經看過很多次日出。",
      "菜市場裡每個攤位都在叫賣自己的真理：有人喊要衝，有人喊要退，有人喊「先活」、有人喊「要留白」。",
      "29 歲的聲音像在幫大家收攤：「好，回到現在。既然妳有能力選，就先選一件最小、但最重要的事——不要逃，也不要做奇怪的事情。」",
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
};

/* ✅ 已校對：開場字幕為遊戲原創，與故事調性一致 */
export const INTRO_BEATS = [
  {
    id: "daughter_glow",
    start: 0,
    end: 3.6,
    kicker: "女兒",
    text: "我又夢見自己被那條紅線輕輕帶起來，整個人像真的往前飛出去。",
    ambience: "黑暗裡先亮起一條細細的紅線，像心跳一樣，一下一下，把我從夢裡托高。風還沒出現，整個身體已經先開始飛。",
  },
  {
    id: "red_thread",
    start: 3.6,
    end: 7.8,
    kicker: "紅線",
    text: "只要我沿著那條屬於把拔與阿姨的紅線往前飛，時間就會自己把路讓開。",
    ambience: "紅線先劃開風，再掠過從一樓長上來的大樹。樹冠被十一點前的光照得像一片會呼吸的海，整層四樓正慢慢浮上來。",
  },
  {
    id: "fourth_floor_arrives",
    start: 7.8,
    end: 12.2,
    kicker: "利瑪竇",
    text: "利瑪竇四樓的風、四間教室長度的走廊，和 LM402 那面門牌一起慢慢浮出來。",
    ambience: "無天花板的外廊、柱列、兩端樓梯間、LM401 到 LM404 和整條四樓走廊一起靠近，像一段真正落到校園裡的電影軌道。",
  },
  {
    id: "sunlight_bloom",
    start: 12.2,
    end: 15.8,
    kicker: "十一點",
    text: "十一點的陽光先灑在矮牆和樹冠上，再沿著前門門洞、黑板那一端和教室兩面一起慢慢推進來。",
    ambience: "風、粉筆灰、玻璃反光和地面亮斑一起站好位置。走廊那一道暖白的光先到了，教室裡才跟著被慢慢打亮。",
  },
  {
    id: "front_door_settle",
    start: 15.8,
    end: 18.2,
    kicker: "前門走廊",
    text: "我要先把前門那句「妳在哪裡？」真正聽見，這整層樓才會把那一秒交給我。",
    ambience: "鏡頭收進 LM402 前門外的走廊。學長剛從 LM401 那側樓梯走上來，門洞、門牌、矮牆外的日光和那口還沒說完的氣息終於一起站進畫面裡。",
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
    end: { x: -448, y: 176, z: 2242, yaw: 0.18, pitch: -0.07 },
  },
};

/* ✅ 已校對：結局文案為遊戲原創，與故事調性一致 */
export const ENDINGS = {
  perfect: {
    kicker: "完美結局",
    title: "女兒飛到一眼瞬間那一秒",
    copy:
      "學妹走到教室內的後門站定，學長停在走廊後門前，兩人隔著那道門洞面對面。一道光落在學妹身上。女兒喃喃自語：「原來在當初把拔第一次見到阿姨的時候，阿姨的眼睛裡面，同時有兩個十八歲的阿姨。」陽光整片灑在學妹身上，鏡頭先用韓劇慢動作完整環繞她一圈，最後切成學長視角，慢慢看著她靠近，只剩眼睛和呼吸被留下來。",
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
  introDuration: 18.2,
  perfectDuration: 30,
  perfectOrbitStart: 2,
  perfectOrbitEnd: 12,
  perfectSeniorPovEnd: 28,
  perfectLine1At: 14,
  perfectLine2At: 22,
};
