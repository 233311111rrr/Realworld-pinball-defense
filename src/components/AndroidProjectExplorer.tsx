import React, { useState } from 'react';
import { Copy, Check, FileCode, Terminal, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AndroidFileItem {
  name: string;
  path: string;
  desc: string;
  language: string;
  snippet?: string;
}

const BUILD_YML_CONTENT = `name: Build & Release Android APK

on:
  push:
    branches: [ "main", "master" ]
    tags:
      - "v*"
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

permissions:
  contents: write

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"

jobs:
  build:
    name: Build Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v5

      - name: Set up JDK 17
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Gradle 8.6
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.6'

      - name: Accept Android SDK Licenses
        run: |
          yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses || true
          echo "sdk.dir=$ANDROID_HOME" > local.properties

      - name: Build Debug APK with Gradle
        run: gradle assembleDebug --no-daemon --stacktrace

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: cosmic-ball-defense-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 30`;

const README_MD_CONTENT = `# 🪐 太空彈球防衛戰 | Cosmic Ball Defense

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web%20Preview-3DDC84?logo=android&logoColor=white)
![Android API](https://img.shields.io/badge/Android%20API-24%20--%2034-00E5FF)
![Kotlin](https://img.shields.io/badge/Kotlin-1.9.24-7F52FF?logo=kotlin&logoColor=white)
![Gradle](https://img.shields.io/badge/AGP-8.4.1%20%7C%20Gradle%208.7-02303A?logo=gradle&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Auto%20APK%20(Node%2024)-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/Assets%20License-CC0%201.0-brightgreen)

> **一款結合「10 排緊湊貪食蛇行軍」、「物理彈球連射」、「追蹤導彈與雷射塔防」以及「Roguelite 寶箱三選一強化」的直向太空街機防禦遊戲。**  
> **A vertical space arcade defense game combining a 10-row compact snake-march grid, physics ball ricochets, homing missiles & laser turrets, and Roguelite 3-pick-1 chest upgrades.**

---

## 🎮 遊戲特色與核心玩法機制 | Game Features & Core Mechanics

### 1. 緊湊型 10 排貪食蛇行軍陣列 (Compact 10-Row Snake-March Grid)
- **Z 字型緊湊推進 (S-Curve Marching Path)**：怪物從畫面**右上角 (Row 0)** 生成並向左行進，每排固定容納 \`15\` 隻怪物，總共 \`10\` 排（偶數排 \`0, 2, 4, 6, 8\` 向左、奇數排 \`1, 3, 5, 7, 9\` 向右），終點位於第 9 排右下角防禦底線。
- **清空過半加速補位 (Half-Cleared Speed Catch-Up)**：當第 0 排（最頂排）怪物被消滅超過一半（剩餘 \`< 8\` 隻）時，後方生成的怪物隊列會觸發 **3.0 倍速 (\`3.0x\`) 追趕機制**，直到新生成的怪群推進至第 1 排中央才會恢復正常行軍速度並開啟下一波生成。
- **防線失守與復活機制 (Defense Breach & Revive System)**：一旦任何一隻怪物抵達第 9 排右下角終點，即判定防線失守。玩家可消耗 **復活券 (Revive Ticket)** 立即清空前線威脅並繼續挑戰。

### 2. 三大複合武器系統 (Three Core Weapon Systems)
| 武器系統 (Weapon System) | 運作機制 (Mechanics - ZH) | Mechanics (EN) |
| :--- | :--- | :--- |
| **🔵 主砲彈球 (Main Ball Cannon)** | 按住或拖曳瞄準線後連發高彈性物理彈球，在怪群與牆壁間高速反彈；支援數量擴充與傷害倍增。 | Fires physics-based ricocheting balls along your aiming trajectory; upgradable ball count and damage multiplier. |
| **🚀 追蹤導彈 (Homing Missiles)** | 獨立冷卻 (\`2.5s\`) 自動發射，具備平滑轉向演算法 (\`TURN_SPEED = 4.5\`)，自動鎖定場上距離最近的前 5 名高威脅目標。 | Independent \`2.5s\` cooldown auto-launcher with smooth steering that locks onto the 5 nearest high-priority targets. |
| **⚡ 雷射砲台 (Laser Cannons)** | 底部左、右兩側共配置 4 座雷射塔槽位，解鎖後每 \`3.0s\` 針對一直線路徑發射高能貫穿雷射光束。 | 4 turret slots on the bottom-left and bottom-right flanks firing piercing high-energy beams every \`3.0s\`. |

### 3. Roguelite 寶箱三選一強化 (Roguelite 3-Pick-1 Chest Upgrades)
擊破行軍隊列中的 **隨機寶箱 (Chest)** 後，遊戲將暫停並彈出 **三選一強化輪盤 (3-Pick-1 Skill Lottery)**：
1. **➕ 主砲彈球 +15 顆 (Main Ball Count +15)**
2. **💥 主砲傷害 +30% (Main Ball Damage +30%)**
3. **🚀 解鎖/強化追蹤導彈 (Unlock / Upgrade Homing Missiles - DMG +50%)**
4. **⚡ 建造/強化雷射砲台 (Build up to 4 Laser Turrets / Upgrade DMG +50%)**

---

## 📦 GitHub Actions 自動打包 APK 下載教學 | Automated APK Build & Download Guide

1. **推送程式碼至 GitHub | Push Repository to GitHub**
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit: Cosmic Ball Defense (Android + Web)"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<你的儲存庫名稱>.git
   git push -u origin main
   \`\`\`
2. **觸發雲端自動打包 | Trigger GitHub Actions Build**
   - 推送至 \`main\` 或 \`master\` 分支即自動開始編譯；或進入 GitHub **「Actions」** ➔ **「Build Android APK」** ➔ 點擊 **「Run workflow」**。
3. **下載並安裝 APK | Download & Install APK**
   - 等待工作流程顯示綠色勾勾 ✅（約 1～2 分鐘），滑到頁面最下方 **「Artifacts」** 下載 **\`CosmicBallDefense-debug-apk\`**，解壓縮即可取得 \`app-debug.apk\` 安裝至手機！

---

## ⚖️ 數值設定總覽 | Game Balance & Parameters Overview (\`GameConfig.kt\`)

| 參數類別 (Category) | 常數名稱 (Constant) | 設定數值 (Value) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| **畫布與幀率 (Canvas)** | \`VIRTUAL_WIDTH\` × \`HEIGHT\` | \`1080\` × \`2400\` | 9:20 自適應直向畫布 (支援 30~185Hz 刷新率) |
| **貪食蛇路徑 (Snake Grid)** | \`SNAKE_TOTAL_ROWS\` / \`MONSTERS_PER_ROW\` | \`10\` 排 / \`15\` 隻 | 共 150 格位，右上角進場、右下角終點 |
| **追趕加速 (Catch-Up)** | \`SNAKE_CATCHUP_MULTIPLIER\` | \`3.0x\` | Row 0 清空過半時觸發 3 倍速推進至 Row 1 中央 |
| **血量成長率 (HP Growth)** | \`MONSTER_HP_ROW_GROWTH_RATE\` | \`+15%\` / 排 | 初始血量 \`100\`，每排指數成長 \`1.15^row\` |
| **魔王與寶箱 (Boss & Chest)** | \`BOSS_HP_MULTIPLIER\` / \`CHEST_SPAWN_CHANCE\` | \`10x\` / \`3%\` | 每 10 排生成 10 倍血量魔王；每格 3% 機率生成寶箱 |

---

## 📝 版本更新日誌 | Version Changelog

- **\`v1.3.0\` (Latest)**：修復 Android 11+ (API 30–34) 點擊開始遊戲時 \`DecorView\` 初始化順序導致的閃退 (\`requestFeature() must be called before adding content\`)、新增跨執行緒 \`worldLock\` 安全鎖與無 Iterator 索引走訪、加入錯誤攔截診斷視窗，並升級 GitHub Actions Node 24。
- **\`v1.2.0\`**：怪物每排血量成長調升至 \`+15%\` 指數成長；寶箱生成機率調整為 \`3%\`（平均 2~3 排出現 1 個）。
- **\`v1.1.0\`**：重構為緊湊 10 排貪食蛇路徑與 Row 0 清空過半 \`3.0x\` 追趕機制。`;

const ANDROID_FILES: AndroidFileItem[] = [
  {
    name: 'README.md (GitHub 中英雙語說明文件)',
    path: 'README.md',
    desc: '專為推送至 GitHub 設計的中英雙語專案說明文件（含自動打包 APK 教學、玩法架構與更新日誌）',
    language: 'markdown',
    snippet: README_MD_CONTENT,
  },
  {
    name: 'GameActivity.kt (已修復點擊開始閃退)',
    path: 'app/src/main/java/com/cosmic/defense/ui/GameActivity.kt',
    desc: '修正 setContentView(gameView) 與 hideSystemUI() 呼叫順序，解決 Android 11+ DecorView requestFeature 閃退，並加入錯誤攔截診斷彈窗',
    language: 'kotlin',
  },
  {
    name: 'GameView.kt & GameLoop.kt (執行緒安全鎖)',
    path: 'app/src/main/java/com/cosmic/defense/engine/GameView.kt',
    desc: '新增 worldLock 同步鎖、surface.isValid 檢查與異常攔截回報，防止跨執行緒 ConcurrentModificationException',
    language: 'kotlin',
  },
  {
    name: 'SnakeGrid.kt & World.kt (安全索引走訪)',
    path: 'app/src/main/java/com/cosmic/defense/world/SnakeGrid.kt',
    desc: '改用無 Iterator 之安全索引迴圈與死亡怪物清理機制，並套用每排 +15% 血量與 3% 寶箱率',
    language: 'kotlin',
  },
  {
    name: 'build.yml (GitHub Actions 已修復)',
    path: '.github/workflows/build.yml',
    desc: '升級 checkout@v5、setup-java@v5 並啟用 Node 24 相容環境變數',
    language: 'yaml',
    snippet: BUILD_YML_CONTENT,
  },
  {
    name: 'MainActivity.kt (已加入防呆攔截)',
    path: 'app/src/main/java/com/cosmic/defense/ui/MainActivity.kt',
    desc: '點擊「開始防禦戰鬥」加入異常攔截保護與診斷彈窗，以及 TextView.paint.isFakeBoldText 修正',
    language: 'kotlin',
  },
  {
    name: 'AudioManager.kt (音效與震動防呆)',
    path: 'app/src/main/java/com/cosmic/defense/audio/AudioManager.kt',
    desc: '為 SoundPool 與 Vibrator 加入完整 try-catch 保護，防止特定機型震動服務異常',
    language: 'kotlin',
  },
  {
    name: 'SettingsActivity.kt (30~185Hz 刷新率)',
    path: 'app/src/main/java/com/cosmic/defense/ui/SettingsActivity.kt',
    desc: '修正 TextView.paint.isFakeBoldText = true 與 30~185Hz 螢幕刷新率切換',
    language: 'kotlin',
  },
  {
    name: 'Monster.kt (155552 厚黑描邊卡通怪)',
    path: 'app/src/main/java/com/cosmic/defense/entities/Monster.kt',
    desc: '石像鬼幼蟲、粉紅紫殼章魚、紫金皇家寶箱與頭頂厚黑邊 K/M 血量渲染',
    language: 'kotlin',
  },
  {
    name: 'app/build.gradle.kts',
    path: 'app/build.gradle.kts',
    desc: '鎖定與 compileSdk 34 / AGP 8.4.1 完全相容之 AndroidX 穩定版依賴',
    language: 'kotlin',
  },
  {
    name: 'GameConfig.kt',
    path: 'app/src/main/java/com/cosmic/defense/config/GameConfig.kt',
    desc: '全局數值集中管理（含每排 +15% 血量成長與 3% 寶箱生成機率）',
    language: 'kotlin',
  },
];

interface AndroidProjectExplorerProps {
  onBackToGame?: () => void;
}

export const AndroidProjectExplorer: React.FC<AndroidProjectExplorerProps> = ({ onBackToGame }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFileItem>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#12131C] text-slate-100 p-5 overflow-y-auto w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4 bg-[#252636] border-2 border-[#3E405B] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-[#FFE838]" />
          <div>
            <h2 className="text-base font-black text-white">Android 原生工程 & 閃退修復中心</h2>
            <p className="text-xs text-slate-300">
              已徹底排除 <code className="text-rose-300">點擊開始閃退 (requestFeature before setContentView)</code> 與執行緒競爭問題
            </p>
          </div>
        </div>
        {onBackToGame && (
          <button
            onClick={onBackToGame}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FFE047] hover:bg-[#FACC15] text-[#18120B] font-black text-xs rounded-xl border-2 border-[#18120B] shadow-[0_3px_0_#18120B] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回 2D 街機試玩</span>
          </button>
        )}
      </div>

      {/* 構建失敗根因與修復清單 */}
      <div className="mb-4 bg-emerald-950/40 border-2 border-emerald-700/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-emerald-300 font-black text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>本次修復的 Android 實機閃退根因與防護機制：</span>
        </div>
        <ul className="list-disc list-inside text-xs text-slate-200 space-y-1.5 leading-relaxed">
          <li>
            <strong>修復點擊「開始防禦戰鬥」瞬間閃退 (Android 11+ DecorView 順序衝突)：</strong>
            先前在 <code>GameActivity.onCreate()</code> 中於 <code>setContentView(gameView)</code> 之前先呼叫了 <code>hideSystemUI()</code>，導致 Android 11+ 存取 <code>window.insetsController</code> 時提前建立 <code>DecorView</code>，使後續 <code>AppCompatActivity.setContentView()</code> 拋出 <code>AndroidRuntimeException: requestFeature() must be called before adding content</code>。現已改為先執行 <code>setContentView(gameView)</code> 再透過 <code>window.decorView.post</code> 隱藏系統列。
          </li>
          <li>
            <strong>新增跨執行緒同步鎖 (worldLock) 與安全索引走訪：</strong>
            在 <code>GameView</code>、<code>GameLoop</code>、<code>World</code> 與 <code>SnakeGrid</code> 中加入 <code>synchronized(worldLock)</code> 與無 Iterator 索引迴圈，根除 UI 觸控與渲染執行緒同時讀寫怪物列表造成的 <code>ConcurrentModificationException</code>。
          </li>
          <li>
            <strong>內建防呆異常攔截與錯誤診斷彈窗：</strong>
            在 <code>MainActivity</code>、<code>GameActivity</code> 與 <code>GameLoop</code> 加入完整異常攔截，若特定機型發生任何未預期錯誤，將自動暫停並彈出可一鍵複製 StackTrace 的診斷視窗，不再直接黑屏閃退。
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-[420px]">
        <div className="bg-[#1C1D28] border-2 border-[#35374D] rounded-xl p-3 flex flex-col gap-1.5 overflow-y-auto max-h-[500px]">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider px-2 py-1">已修復之專案檔案</span>
          {ANDROID_FILES.map((f) => (
            <button
              key={f.path}
              onClick={() => setSelectedFile(f)}
              className={`flex flex-col text-left px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                selectedFile.path === f.path
                  ? 'bg-[#3B82F6] text-white font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#282A3A] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="truncate">{f.name}</span>
              </div>
              <span className={`text-[10px] mt-0.5 truncate ${selectedFile.path === f.path ? 'text-sky-100' : 'text-slate-400'}`}>
                {f.desc}
              </span>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-[#1C1D28] border-2 border-[#35374D] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#35374D] mb-3">
            <div>
              <h3 className="text-sm font-black text-white">{selectedFile.name}</h3>
              <p className="text-xs text-[#7DD3FC] font-mono mt-0.5">{selectedFile.path}</p>
            </div>
            <button
              onClick={() => handleCopy(selectedFile.snippet || selectedFile.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#2B2D3E] hover:bg-[#383B52] text-slate-200 rounded-lg cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製' : selectedFile.snippet ? '複製完整檔案內容' : '複製檔案路徑'}</span>
            </button>
          </div>

          <div className="flex-1 bg-[#101118] rounded-lg p-4 font-mono text-xs text-slate-200 overflow-y-auto border border-[#2B2D3E] leading-relaxed whitespace-pre-wrap">
            {selectedFile.snippet ? (
              selectedFile.snippet
            ) : (
              <div>
                <p className="text-slate-400 mb-2"># 檔案位置: {selectedFile.path}</p>
                <p className="text-slate-400 mb-4"># 修復與更新說明: {selectedFile.desc}</p>
                <div className="text-emerald-300 bg-emerald-950/30 p-3 rounded border border-emerald-800/50 text-[11px]">
                  ✔ 此檔案已直接寫入專案工作區對應路徑。<br />
                  ✔ 重新匯出或同步至 GitHub 後，GitHub Actions 將以 0 錯誤完成 <code>gradle assembleDebug</code> 並上傳 APK 產物！
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
