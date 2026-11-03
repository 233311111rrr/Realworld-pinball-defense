/**
 * 1:1 街機卡通厚描邊 2D 精靈圖庫 (對應參考圖 155552 美術風格)
 * 採用高解析 SVG Data URI 預渲染為 Image 物件，具備厚黑描邊、賽璐珞高光與零破圖保證
 */

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

// 1. 古銅橄欖石像鬼幼蟲 (參考圖 155552 主力怪物：雙彎角、發光黃眼、小蝠翼、節肢腹部與捲尾)
export const GARGOYLE_SPRITE_URL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <g stroke="#18120E" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <!-- 左小蝠翼 -->
    <path d="M32 54 C14 44, 8 58, 16 72 C22 66, 28 66, 35 68 Z" fill="#6E5D43"/>
    <!-- 右小蝠翼 -->
    <path d="M88 54 C106 44, 112 58, 104 72 C98 66, 92 66, 85 68 Z" fill="#6E5D43"/>
    <!-- 下方捲曲蟲尾 -->
    <path d="M45 84 C42 104, 66 112, 84 100 C94 93, 92 80, 82 82 C76 83, 74 90, 66 90 C56 90, 56 80, 58 76 Z" fill="#8C7756"/>
    <!-- 腹部節肢條紋 -->
    <ellipse cx="60" cy="76" rx="22" ry="18" fill="#A9926C"/>
    <path d="M43 72 Q60 80 77 72" fill="none" stroke="#4A3C28" stroke-width="3.5"/>
    <path d="M45 81 Q60 89 75 81" fill="none" stroke="#4A3C28" stroke-width="3.5"/>
    <path d="M49 89 Q60 95 71 89" fill="none" stroke="#4A3C28" stroke-width="3.5"/>
    <!-- 兩側小短爪 -->
    <path d="M36 68 C28 72, 28 80, 38 80" fill="#8C7756"/>
    <path d="M84 68 C92 72, 92 80, 82 80" fill="#8C7756"/>
    <!-- 頭部主體 -->
    <path d="M34 46 C30 26, 90 26, 86 46 C90 62, 76 72, 60 72 C44 72, 30 62, 34 46 Z" fill="#9E8863"/>
    <!-- 額頭高光 -->
    <ellipse cx="60" cy="36" rx="18" ry="7" fill="#BCA682" stroke="none"/>
    <!-- 左彎角 -->
    <path d="M44 34 C34 16, 20 18, 24 34 C27 42, 36 44, 42 42 Z" fill="#756145"/>
    <path d="M40 28 C33 20, 26 22, 27 31" fill="none" stroke="#B69F7D" stroke-width="2.5"/>
    <!-- 右彎角 -->
    <path d="M76 34 C86 16, 100 18, 96 34 C93 42, 84 44, 78 42 Z" fill="#756145"/>
    <path d="M80 28 C87 20, 94 22, 93 31" fill="none" stroke="#B69F7D" stroke-width="2.5"/>
    <!-- 憤怒眉骨 -->
    <path d="M38 45 L55 52 L60 49 L65 52 L82 45" fill="none" stroke="#3B2E1E" stroke-width="4"/>
    <!-- 發光邪惡雙眼 -->
    <path d="M41 48 L55 53 L44 57 Z" fill="#FFF380" stroke="#18120E" stroke-width="2.5"/>
    <path d="M79 48 L65 53 L76 57 Z" fill="#FFF380" stroke="#18120E" stroke-width="2.5"/>
  </g>
</svg>
`);

// 2. 粉紅紫殼外星小章魚 (參考圖 155552 右下角 10.1K / 5.18K 怪物)
export const OCTOPUS_SPRITE_URL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <g stroke="#1C1124" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <!-- 下方六根粉紅小觸手 -->
    <path d="M32 76 C20 84, 22 98, 34 94 C38 92, 40 86, 42 82" fill="#F277C6"/>
    <path d="M44 82 C38 96, 46 106, 54 96 C56 92, 56 86, 56 84" fill="#F277C6"/>
    <path d="M64 84 C64 92, 66 106, 74 96 C80 90, 76 82, 72 80" fill="#F277C6"/>
    <path d="M78 82 C82 90, 90 98, 96 90 C100 84, 92 76, 86 74" fill="#F277C6"/>
    <!-- 粉紅圓潤臉部 -->
    <ellipse cx="60" cy="64" rx="30" ry="24" fill="#FF8BD6"/>
    <!-- 臉部柔和高光 -->
    <ellipse cx="52" cy="54" rx="18" ry="10" fill="#FFB2E6" stroke="none"/>
    <!-- 紫色斑點頭罩外殼 -->
    <path d="M26 60 C24 26, 96 26, 94 60 C88 42, 76 34, 60 34 C44 34, 32 42, 26 60 Z" fill="#9D4EDD"/>
    <!-- 頭罩斑點 -->
    <circle cx="42" cy="38" r="5" fill="#C77DFF" stroke="none"/>
    <circle cx="78" cy="40" r="6" fill="#C77DFF" stroke="none"/>
    <circle cx="60" cy="28" r="4.5" fill="#C77DFF" stroke="none"/>
    <!-- 水汪汪大黑眼 + 白高光 -->
    <ellipse cx="46" cy="64" rx="6.5" ry="8" fill="#1E1028"/>
    <ellipse cx="74" cy="64" rx="6.5" ry="8" fill="#1E1028"/>
    <circle cx="44" cy="61" r="2.8" fill="#FFFFFF" stroke="none"/>
    <circle cx="72" cy="61" r="2.8" fill="#FFFFFF" stroke="none"/>
    <!-- 可愛章魚小嘴 -->
    <ellipse cx="60" cy="72" rx="4.5" ry="5.5" fill="#9E2A5B" stroke="#1C1124" stroke-width="3"/>
  </g>
</svg>
`);

// 3. 紫金皇家寶箱 (參考圖 155552 中 37.3K / 9.41K 寶箱)
export const CHEST_SPRITE_URL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <g stroke="#1A1121" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <!-- 寶箱底座陰影 -->
    <ellipse cx="60" cy="96" rx="42" ry="10" fill="rgba(0,0,0,0.45)" stroke="none"/>
    <!-- 紫色箱身下半部 -->
    <rect x="20" y="54" width="80" height="38" rx="8" fill="#7E22CE"/>
    <!-- 箱身正面深紫內嵌 -->
    <rect x="28" y="60" width="64" height="26" rx="4" fill="#581C87" stroke="none"/>
    <!-- 紫色弧形箱蓋上半部 -->
    <path d="M18 56 C18 28, 102 28, 102 56 Z" fill="#9333EA"/>
    <!-- 箱蓋高光 -->
    <path d="M30 46 C36 34, 84 34, 90 46" fill="none" stroke="#C084FC" stroke-width="4"/>
    <!-- 金色厚邊框與護角 -->
    <path d="M18 54 L102 54 L102 64 L18 64 Z" fill="#FACC15"/>
    <path d="M20 52 L32 52 L32 92 L20 92 Z" fill="#EAB308"/>
    <path d="M88 52 L100 52 L100 92 L88 92 Z" fill="#EAB308"/>
    <path d="M20 82 L100 82 L100 92 L20 92 Z" fill="#CA8A04"/>
    <!-- 中央黃金大鎖牌 -->
    <rect x="47" y="46" width="26" height="26" rx="6" fill="#FEF08A"/>
    <rect x="51" y="50" width="18" height="18" rx="4" fill="#F59E0B" stroke-width="2.5"/>
    <circle cx="60" cy="57" r="3.5" fill="#1A1121" stroke="none"/>
    <path d="M58 58 L56 64 L64 64 L62 58 Z" fill="#1A1121" stroke="none"/>
  </g>
</svg>
`);

// 4. 第 10 排煉獄魔王 Boss
export const BOSS_SPRITE_URL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
  <g stroke="#180B0B" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    <!-- 巨大惡魔雙翼 -->
    <path d="M36 62 C6 34, 2 68, 14 92 C24 82, 32 84, 42 86 Z" fill="#991B1B"/>
    <path d="M104 62 C134 34, 138 68, 126 92 C116 82, 108 84, 98 86 Z" fill="#991B1B"/>
    <!-- 魔王裝甲軀幹 -->
    <circle cx="70" cy="72" r="36" fill="#DC2626"/>
    <ellipse cx="70" cy="60" rx="24" ry="12" fill="#EF4444" stroke="none"/>
    <!-- 黃金惡魔雙角 -->
    <path d="M44 46 C26 16, 12 24, 22 48 C28 58, 38 58, 44 56 Z" fill="#F59E0B"/>
    <path d="M96 46 C114 16, 128 24, 118 48 C112 58, 102 58, 96 56 Z" fill="#F59E0B"/>
    <!-- 額頭皇冠核心 -->
    <polygon points="56,42 70,20 84,42" fill="#FEF08A"/>
    <!-- 熾熱四眼與獠牙 -->
    <polygon points="46,62 64,68 50,74" fill="#FEF08A" stroke-width="3"/>
    <polygon points="94,62 76,68 90,74" fill="#FEF08A" stroke-width="3"/>
    <path d="M50 88 Q70 98 90 88" fill="none" stroke="#180B0B" stroke-width="5"/>
    <polygon points="54,88 58,98 63,90" fill="#FFFFFF" stroke-width="2.5"/>
    <polygon points="86,88 82,98 77,90" fill="#FFFFFF" stroke-width="2.5"/>
  </g>
</svg>
`);

// 5. 藍白雙聯裝噴射火箭戰機 (1:1 還原參考圖 155552 底部中央藍白雙瓶火箭造型)
export const FIGHTER_SPRITE_URL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 150">
  <g stroke="#101828" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <!-- 底部噴射尾焰 -->
    <path d="M48 112 L40 142 L56 128 L68 146 L78 124 L92 138 L86 112 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="3"/>
    <path d="M56 112 L52 132 L68 136 L78 128 L76 112 Z" fill="#E0F2FE" stroke="none"/>
    <!-- 左右流線穩定翼 -->
    <path d="M34 78 L12 104 L36 108 L44 92 Z" fill="#2563EB"/>
    <path d="M106 78 L128 104 L104 108 L96 92 Z" fill="#2563EB"/>
    <!-- 左側副推進瓶艙 -->
    <g transform="translate(52, 62) rotate(10)">
      <rect x="-18" y="-34" width="36" height="68" rx="14" fill="#60A5FA"/>
      <rect x="-18" y="-12" width="36" height="28" fill="#EFF6FF"/>
      <rect x="-10" y="-44" width="20" height="10" rx="3" fill="#1D4ED8"/>
    </g>
    <!-- 右側主推進瓶艙 (交疊於上方，與 155552 完全一致) -->
    <g transform="translate(76, 68) rotate(14)">
      <rect x="-20" y="-38" width="40" height="74" rx="16" fill="#3B82F6"/>
      <rect x="-20" y="-14" width="40" height="32" fill="#FFFFFF"/>
      <!-- 高光條 -->
      <path d="M-12 -30 L-12 26" stroke="#93C5FD" stroke-width="4"/>
      <rect x="-11" y="-48" width="22" height="11" rx="3" fill="#1E40AF"/>
    </g>
  </g>
</svg>
`);

// 6. 左側藍銀雷達副砲 (還原參考圖 155552 左下角雷達碟)
export const TURRET_RADAR_SPRITE_URL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <g stroke="#111827" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="42" cy="72" rx="20" ry="8" fill="#3B82F6"/>
    <rect x="34" y="54" width="16" height="18" rx="4" fill="#64748B"/>
    <!-- 碟型雷達面 -->
    <path d="M24 24 C10 40, 26 68, 56 60 C46 44, 34 32, 24 24 Z" fill="#2563EB"/>
    <ellipse cx="44" cy="40" rx="22" ry="12" transform="rotate(-38 44 40)" fill="#38BDF8"/>
    <!-- 雷達指針與紅頭 -->
    <line x1="44" y1="40" x2="62" y2="22" stroke="#E2E8F0" stroke-width="4"/>
    <circle cx="64" cy="20" r="6" fill="#EF4444"/>
  </g>
</svg>
`);

// 7. 右側藍銀雙管重砲 (還原參考圖 155552 右下角副砲)
export const TURRET_CANNON_SPRITE_URL = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
  <g stroke="#111827" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="45" cy="54" r="24" fill="#1D4ED8"/>
    <circle cx="45" cy="54" r="17" fill="#3B82F6"/>
    <!-- 砲管 -->
    <g transform="rotate(30 45 54)">
      <rect x="37" y="14" width="16" height="32" rx="4" fill="#94A3B8"/>
      <rect x="35" y="10" width="20" height="8" rx="2" fill="#475569"/>
      <rect x="33" y="38" width="24" height="22" rx="6" fill="#64748B"/>
    </g>
  </g>
</svg>
`);

export interface LoadedArcadeSprites {
  gargoyle: HTMLImageElement;
  octopus: HTMLImageElement;
  chest: HTMLImageElement;
  boss: HTMLImageElement;
  fighter: HTMLImageElement;
  turretRadar: HTMLImageElement;
  turretCannon: HTMLImageElement;
}

export function loadArcadeSprites(): LoadedArcadeSprites {
  const createImg = (src: string) => {
    const img = new Image();
    img.src = src;
    return img;
  };
  return {
    gargoyle: createImg(GARGOYLE_SPRITE_URL),
    octopus: createImg(OCTOPUS_SPRITE_URL),
    chest: createImg(CHEST_SPRITE_URL),
    boss: createImg(BOSS_SPRITE_URL),
    fighter: createImg(FIGHTER_SPRITE_URL),
    turretRadar: createImg(TURRET_RADAR_SPRITE_URL),
    turretCannon: createImg(TURRET_CANNON_SPRITE_URL),
  };
}
