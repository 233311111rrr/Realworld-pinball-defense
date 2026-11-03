# 🪐 太空彈球防衛戰 | Cosmic Ball Defense

![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web%20Preview-3DDC84?logo=android&logoColor=white)
![Android API](https://img.shields.io/badge/Android%20API-24%20--%2034-00E5FF)
![Kotlin](https://img.shields.io/badge/Kotlin-1.9.24-7F52FF?logo=kotlin&logoColor=white)
![Gradle](https://img.shields.io/badge/AGP-8.4.1%20%7C%20Gradle%208.7-02303A?logo=gradle&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Auto%20APK%20(Node%2024)-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/Assets%20License-CC0%201.0-brightgreen)

> **一款結合「10 排緊湊貪食蛇行軍」、「物理彈球連射」、「追蹤導彈與雷射塔防」以及「Roguelite 寶箱三選一強化」的直向太空街機防禦遊戲。**  
> **A vertical space arcade defense game combining a 10-row compact snake-march grid, physics ball ricochets, homing missiles & laser turrets, and Roguelite 3-pick-1 chest upgrades.**

---

## 📖 目錄 | Table of Contents

1. [🎮 遊戲特色與核心玩法機制 | Game Features & Core Mechanics](#-遊戲特色與核心玩法機制--game-features--core-mechanics)
2. [📦 GitHub Actions 自動打包 APK 下載教學 | Automated APK Build & Download Guide](#-github-actions-自動打包-apk-下載教學--automated-apk-build--download-guide)
3. [🛠️ Android Studio 本地編譯與專案架構 | Local Build & Project Architecture](#️-android-studio-本地編譯與專案架構--local-build--project-architecture)
4. [⚖️ 數值設定總覽 | Game Balance & Parameters Overview](#️-數值設定總覽--game-balance--parameters-overview)
5. [📝 版本更新日誌 | Version Changelog](#-版本更新日誌--version-changelog)
6. [📜 音效與素材授權 | Audio & Assets License](#-音效與素材授權--audio--assets-license)

---

## 🎮 遊戲特色與核心玩法機制 | Game Features & Core Mechanics

### 1. 緊湊型 10 排貪食蛇行軍陣列 (Compact 10-Row Snake-March Grid)
- **Z 字型緊湊推進 (S-Curve Marching Path)**：怪物從畫面**右上角 (Row 0)** 生成並向左行進，每排固定容納 `15` 隻怪物，總共 `10` 排（偶數排 `0, 2, 4, 6, 8` 向左、奇數排 `1, 3, 5, 7, 9` 向右），終點位於第 9 排右下角防禦底線。
- **清空過半加速補位 (Half-Cleared Speed Catch-Up)**：當第 0 排（最頂排）怪物被消滅超過一半（剩餘 `< 8` 隻）時，後方生成的怪物隊列會觸發 **3.0 倍速 (`3.0x`) 追趕機制**，直到新生成的怪群推進至第 1 排中央才會恢復正常行軍速度並開啟下一波生成，確保戰鬥節奏緊湊不間斷。
- **防線失守與復活機制 (Defense Breach & Revive System)**：一旦任何一隻怪物抵達第 9 排右下角終點，即判定防線失守。玩家可消耗 **復活券 (Revive Ticket)** 立即清空前線威脅並繼續挑戰。

### 2. 三大複合武器系統 (Three Core Weapon Systems)
| 武器系統 (Weapon System) | 運作機制 (Mechanics - ZH) | Mechanics (EN) |
| :--- | :--- | :--- |
| **🔵 主砲彈球 (Main Ball Cannon)** | 按住或拖曳瞄準線後連發高彈性物理彈球，在怪群與牆壁間高速反彈；支援數量擴充與傷害倍增。 | Fires physics-based ricocheting balls along your aiming trajectory; upgradable ball count and damage multiplier. |
| **🚀 追蹤導彈 (Homing Missiles)** | 獨立冷卻 (`2.5s`) 自動發射，具備平滑轉向演算法 (`TURN_SPEED = 4.5`)，自動鎖定場上距離最近的前 5 名高威脅目標。 | Independent `2.5s` cooldown auto-launcher with smooth steering that locks onto the 5 nearest high-priority targets. |
| **⚡ 雷射砲台 (Laser Cannons)** | 底部左、右兩側共配置 4 座雷射塔槽位，解鎖後每 `3.0s` 針對一直線路徑發射高能貫穿雷射光束。 | 4 turret slots on the bottom-left and bottom-right flanks firing piercing high-energy beams every `3.0s`. |

### 3. Roguelite 寶箱三選一強化 (Roguelite 3-Pick-1 Chest Upgrades)
擊破行軍隊列中的 **隨機寶箱 (Chest)** 後，遊戲將暫停並彈出 **三選一強化輪盤 (3-Pick-1 Skill Lottery)**：
1. **➕ 主砲彈球 +15 顆 (Main Ball Count +15)**：單次齊射彈球數量大幅增加。
2. **💥 主砲傷害 +30% (Main Ball Damage +30%)**：提升每顆彈球的撞擊基礎傷害。
3. **🚀 解鎖/強化追蹤導彈 (Unlock / Upgrade Homing Missiles)**：啟用自動追蹤導彈或提升導彈傷害 `+50%`。
4. **⚡ 建造/強化雷射砲台 (Build / Upgrade Laser Turrets)**：依序建造最多 4 座側翼雷射塔，滿座後全體雷射傷害 `+50%`。

### 4. 戰術道具與局外加速系統 (Tactical Items & Game Speed Progression)
- **戰術道具（每局各限用 2 次 / Max 2 Uses per Match）**：
  - ❄️ **冰凍全場 (Freeze - `5.0s`)**：凍結所有怪物的行軍推進 5 秒。
  - 💣 **全屏轟炸 (Mega Bomb - `300 DMG`)**：對場上所有存活怪物與魔王造成巨額範圍傷害。
  - 🔥 **雙倍傷害 (2x Damage - `8.0s`)**：主砲、導彈與雷射塔傷害全面翻倍 8 秒。
- **永久倍速解鎖 (Permanent Speed Multipliers)**：
  - 累積擊殺金幣可於主畫面永久解鎖 **2 倍速 (`500` 金幣)** 與 **5 倍速 (`1500` 金幣)**，局內隨時一鍵切換 `1x / 2x / 5x`。

---

## 📦 GitHub Actions 自動打包 APK 下載教學 | Automated APK Build & Download Guide

本專案已內建 `.github/workflows/build.yml` 自動化雲端編譯流程（全面升級支援 **Node.js 24** 與 **JDK 17**），**無需在電腦安裝 Android Studio** 即可自動產出可安裝的 APK 檔案！

This repository includes a pre-configured `.github/workflows/build.yml` workflow (upgraded for **Node.js 24** and **JDK 17**). You can build and download the Android APK directly from GitHub cloud runners without installing Android Studio locally.

### 步驟說明 | Step-by-Step Guide

1. **推送程式碼至 GitHub | Push Repository to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Cosmic Ball Defense (Android + Web)"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<你的儲存庫名稱>.git
   git push -u origin main
   ```
2. **觸發雲端自動打包 | Trigger GitHub Actions Build**
   - 只要推送至 `main` 或 `master` 分支，GitHub Actions 會自動開始編譯。
   - 您也可以手動觸發：進入 GitHub 儲存庫頂端選單的 **「Actions」** ➔ 點選左側 **「Build Android APK」** ➔ 點擊右側 **「Run workflow」** 按鈕。
   - Pushing to `main` or `master` automatically triggers the build, or you can manually trigger it via **Actions** ➔ **Build Android APK** ➔ **Run workflow**.
3. **下載並安裝 APK | Download & Install APK**
   - 等待工作流程顯示綠色勾勾 ✅（約 1～2 分鐘）。
   - 點進該次執行紀錄頁面，滑到最下方 **「Artifacts」** 區塊，點擊下載 **`CosmicBallDefense-debug-apk`** 壓縮檔。
   - 解壓縮後即可取得 `app-debug.apk`，傳送至 Android 手機即可直接安裝遊玩！
   - Once the workflow succeeds ✅, scroll down to the **Artifacts** section and download **`CosmicBallDefense-debug-apk`**. Extract `app-debug.apk` and install it on your Android device.

---

## 🛠️ Android Studio 本地編譯與專案架構 | Local Build & Project Architecture

本儲存庫採用 **雙環境混合架構 (Dual-Runtime Hybrid Architecture)**，同時包含 **原生 Android Kotlin 專案** 與 **Web 互動街機預覽器**。

### A. 原生 Android 專案編譯 (Native Android Build)

#### 環境需求 | Prerequisites
- **Android Studio**: Iguana / Jellyfish (2023.2+) 或更新版本
- **JDK 版本**: Java 17 (Temurin / JBR 17)
- **Android SDK**: `compileSdk = 34`, `targetSdk = 34`, `minSdk = 24` (Android 7.0+)
- **Android Gradle Plugin (AGP)**: `8.4.1` / **Kotlin**: `1.9.24`

#### 命令列打包指令 | CLI Gradle Build
```bash
# 賦予 Gradle 腳本執行權限 (macOS / Linux)
chmod +x gradlew

# 編譯 Debug 版本 APK (Build Debug APK)
./gradlew assembleDebug --stacktrace
```
> 產出的 APK 路徑 (Output APK path)：`app/build/outputs/apk/debug/app-debug.apk`

### B. Web 互動預覽器啟動 (Web Arcade Preview & Code Explorer)
```bash
# 安裝前端依賴 (Install dependencies)
npm install

# 啟動本地開發伺服器 (Start dev server at http://localhost:3000)
npm run dev
```

### C. 核心架構與模組導覽 | Core Architecture & Modules

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Cosmic Ball Defense Hybrid Repository                    │
├─────────────────────────────────────┬──────────────────────────────────────┤
│   Native Android App (Kotlin 2D)    │     Web Arcade Preview (React TS)    │
│   app/src/main/java/com/cosmic/...  │     src/                             │
├─────────────────────────────────────┼──────────────────────────────────────┤
│ • config/GameConfig.kt              │ • components/GameCanvas.tsx          │
│   1080x2400 virtual canvas & stats  │   60FPS HTML5 Canvas arcade replica  │
│ • engine/GameLoop.kt & GameView.kt  │ • components/AndroidProjectExplorer  │
│   30-185Hz loop + worldLock safety  │   In-browser Kotlin & CI code viewer │
│ • world/World.kt & SnakeGrid.kt     │ • App.tsx                            │
│   10-row snake path & spatial hash  │   Interactive HUD, shop & skill UI   │
│ • entities/ (Ball, Monster, Laser)  │                                      │
│   Zero-GC object pools & physics    │                                      │
│ • ui/ (MainActivity, GameActivity)  │                                      │
│   Immersive fullscreen & crash guard│                                      │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

#### 關鍵技術亮點 | Technical Highlights
- **高刷新率獨立時間步長引擎 (`GameLoop.kt` & `GameView.kt`)**：採用固定物理步長 (`FIXED_DELTA_TIME = 1/60s`) 搭配動態渲染支援 `30 / 60 / 90 / 120 / 144 / 165 / 185 Hz` 螢幕刷新率。
- **跨執行緒同步與防閃退保護 (`worldLock` & Crash Guard)**：所有 UI 觸控事件、寶箱三選一強化、道具施放與遊戲主迴圈更新/繪製皆透過 `worldLock` 同步鎖保護，並全面使用無配置索引迴圈 (`for (i in 0 until size)`) 杜絕 `ConcurrentModificationException`；同時內建全域未捕捉異常攔截器，發生異常時可顯示並複製詳細堆疊資訊。
- **零 GC 物件池與空間雜湊 (`ObjectPool.kt` & `SpatialGrid.kt`)**：預先配置 300 顆彈球與 300 隻怪物實體，搭配二維空間雜湊網格將碰撞檢測複雜度由 $O(N \times M)$ 降至近似 $O(N)$。

---

## ⚖️ 數值設定總覽 | Game Balance & Parameters Overview

所有核心參數統一集中於 `app/src/main/java/com/cosmic/defense/config/GameConfig.kt`，方便快速調整平衡：

| 參數類別 (Category) | 常數名稱 (Constant) | 設定數值 (Value) | 說明 (Description - ZH / EN) |
| :--- | :--- | :--- | :--- |
| **畫布與幀率 (Canvas)** | `VIRTUAL_WIDTH` × `HEIGHT` | `1080` × `2400` | 9:20 滿版自適應直向虛擬畫布 (Virtual resolution) |
| **貪食蛇路徑 (Snake Grid)** | `SNAKE_TOTAL_ROWS` | `10` 排 | 固定 10 排 Z 字型向下推進 (10 horizontal rows) |
| **單排容量 (Row Capacity)** | `MONSTERS_PER_ROW` | `15` 隻/排 | 每排固定 15 個怪物格位，共 150 格 (15 slots per row) |
| **追趕加速 (Catch-Up)** | `SNAKE_CATCHUP_MULTIPLIER` | `3.0x` | Row 0 清空過半時觸發 3 倍速推進至 Row 1 中央 |
| **怪物初始血量 (Base HP)** | `INITIAL_MONSTER_HP` | `100f` | 第 1 波普通怪物基礎生命值 (Base monster HP) |
| **血量成長率 (HP Growth)** | `MONSTER_HP_ROW_GROWTH_RATE` | `+15%` / 排 | 每推進一排血量指數成長 `1.15^row` (Exponential HP scaling) |
| **魔王與寶箱 (Boss & Chest)** | `BOSS_HP_MULTIPLIER` / `CHEST_SPAWN_CHANCE` | `10x` / `3%` | 每 10 排生成 10 倍血量魔王；每格 3% 機率生成寶箱 (`0.5x` HP) |
| **主砲升級 (Main Cannon)** | `SKILL_BALL_COUNT_ADD` / `DAMAGE_MULT` | `+15` 顆 / `+30%` | 寶箱三選一：增加 15 顆彈球或提升 30% 主砲傷害 |
| **追蹤導彈 (Missiles)** | `MISSILE_COOLDOWN` / `TARGET_COUNT` | `2.5s` / `5` 目標 | 每 2.5 秒自動發射，鎖定最近 5 隻怪物 (`50` 基礎傷害) |
| **雷射砲台 (Lasers)** | `LASER_MAX_COUNT` / `COOLDOWN` | `4` 座 / `3.0s` | 左右側翼共 4 座槽位，每 3 秒發射貫穿雷射 (`45` 基礎傷害) |
| **戰術道具 (Items)** | `FREEZE` / `BOMB` / `DOUBLE_DMG` | `5s` / `300` / `8s` | 冰凍 5 秒、轟炸 300 傷害、雙倍傷害 8 秒（每局各限 2 次） |

---

## 📝 版本更新日誌 | Version Changelog

### `v1.3.0` — Android 11+ 啟動閃退修復、執行緒安全鎖與 CI 升級 (Latest)
- **🐛 修復點擊開始遊戲瞬間閃退 (`GameActivity.kt`)**：修正 Android 11+ (API 30–34) 在 `setContentView()` 之前呼叫 `window.insetsController` 導致 `DecorView` 尚未初始化並拋出 `AndroidRuntimeException: requestFeature() must be called before adding content` 的問題；改為先掛載 `setContentView(gameView)` 並透過 `window.decorView.post { ... }` 安全啟用沉浸式全螢幕與高刷新率設定。
- **🔒 跨執行緒同步與零配置迴圈 (`GameView.kt`, `World.kt`, `SnakeGrid.kt`)**：新增 `worldLock` 同步鎖保護 UI 執行緒與 `GameLoop` 渲染執行緒，並將所有實體清單走訪改為無 `Iterator` 配置的索引迴圈，徹底消除 `ConcurrentModificationException`。
- **🛡️ 防呆異常攔截視窗 (`GameActivity.kt`, `MainActivity.kt`)**：加入錯誤攔截保護機制，若發生未預期異常將顯示包含完整 Stack Trace 的錯誤對話框（支援一鍵複製與安全返回主選單），不再直接黑屏閃退。
- **⚙️ GitHub Actions Node 24 升級 (`build.yml`)**：升級至 `actions/checkout@v5`、`actions/setup-java@v5` 與 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"`。

### `v1.2.0` — 難度曲線與寶箱機率平衡調整
- **📈 怪物血量中度加速成長**：將每排血量成長率由 `+8%` 調升至 **`+15%` 指數成長 (`1.15^row`)**，提升中後期防禦挑戰性與武器強化爽快感。
- **🎁 寶箱生成率精緻化**：將寶箱出現機率由 `8%` 調降為 **`3%`**（平均每 2～3 排出現 1 個寶箱），讓每次三選一強化更具策略價值。

### `v1.1.0` — 緊湊 10 排貪食蛇路徑與追趕機制重構
- **🐍 緊湊 10 排 S 型陣列**：改為從右上角 (`Row 0`) 出發向左行進，每排 15 隻怪、共 10 排，終點設於右下角 (`Row 9`)。
- **⚡ 清空過半 3 倍速補位**：當第 0 排剩餘怪物少於一半時，後續怪群以 `3.0x` 速度推進至第 1 排中央。

### `v1.0.0` — 初始版本發佈
- 完成原生 Android Kotlin 2D 遊戲引擎、三大武器系統、三選一寶箱系統、音效合成器與 Web 預覽器。

---

## 📜 音效與素材授權 | Audio & Assets License

本專案內建程序化音效合成引擎 (`AudioManager.kt` 使用 Android `AudioTrack` 即時合成射擊、爆炸、雷射與開箱音效)，無須依賴外部音訊檔案即可運作；若需替換為外部 CC0 音效素材，請參閱根目錄下的 [`ASSETS_LICENSE.md`](./ASSETS_LICENSE.md)。

This project features a built-in procedural audio synthesizer (`AudioManager.kt` powered by Android `AudioTrack`) that works out-of-the-box without external audio files. For optional CC0 audio asset guidelines, please refer to [`ASSETS_LICENSE.md`](./ASSETS_LICENSE.md).
