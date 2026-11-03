# 太空彈球防衛戰 (Cosmic Ball Defense) — GitHub 中英雙語 README.md 專案文件規劃

### User Review & Critical Decisions
- **文件涵蓋章節 (Confirmed)**: 根據您的選擇，`README.md` 將完整涵蓋四大核心章節：
  1. **遊戲特色與核心玩法機制說明**（緊湊型 10 排貪食蛇陣列、追趕填補機制、三大武器系統、三選一寶箱強化與戰術道具）
  2. **GitHub Actions 自動打包 APK 下載教學**（零本地環境設定、雲端自動編譯與 Artifacts 下載步驟）
  3. **Android Studio 本地編譯與專案架構說明**（JDK 17 / Android SDK 34 環境配置、Gradle 指令、高刷新率遊戲引擎與執行緒安全設計、Web 預覽器啟動方式）
  4. **版本更新日誌與數值設定總覽**（`v1.0` 至最新 `v1.3` 閃退修復與執行緒同步更新紀錄、以及最新平衡參數對照表）
- **語言風格與排版格式 (Confirmed)**: 採用**中英雙語對照版本 (Traditional Chinese & English Bilingual)**，搭配 GitHub 頂部徽章 (Badges)、清晰雙語表格與步驟指引，讓中文與國際開發者皆能一目了然。

---

### 1. Overview & Core Concept
為「太空彈球防衛戰 (Cosmic Ball Defense)」建立一份可直接推送至 GitHub 儲存庫根目錄的專業級中英雙語 `README.md` 說明文件。本專案同時包含 **原生 Android Kotlin 2D 遊戲引擎** 與 **Web 互動式街機預覽暨專案瀏覽器**，文件將清楚引導開發者與玩家如何透過 GitHub Actions 自動取得可安裝的 Android APK、如何在本地端透過 Android Studio 或命令列編譯，並完整記錄遊戲核心數值與歷次重大修正。

---

### 2. User Experience & Visual Design
- **GitHub 門面與狀態徽章 (Badges)**：文件頂部配置 Android API (24–34)、Kotlin (1.9.24)、AGP (8.4.1)、GitHub Actions CI (Node 24 Ready) 與 CC0 授權徽章，建立專業開源專案形象。
- **中英雙語結構化排版**：每個主章節皆提供繁體中文與英文雙語對照說明，關鍵遊戲機制與編譯步驟採用高可讀性的對照表與編號清單。
- **Web 預覽器內建檢視與一鍵複製**：同步將新建立的 `README.md` 納入 Web 介面中的「Android 原生專案與自動打包」程式碼檢視器，讓您除了直接推送專案外，也能在網頁介面直接預覽與一鍵複製整份 Markdown 原始碼。

---

### 3. Key Product Decisions & Trade-Offs
- **雙語段落與表格並陳 vs. 拆分為兩份獨立檔案**：選擇在單一 `README.md` 中採用「中英雙語對照標題＋雙語欄位表格＋精煉雙語說明」設計，使用者進入 GitHub 首頁即可直接閱讀，無須額外跳轉至外部連結。
- **完整揭露遊戲平衡參數**：將最新調整後的數值（怪物每排血量 `+15%` 指數成長、寶箱 `3%` 生成率、Row 0 清空過半觸發 `3.0x` 加速補位等）整理為雙語規格表，方便日後在 GitHub 上追蹤版本數值演進。

---

### 4. Technical Architecture & Data Strategy
以下架構圖展示 `README.md` 如何串聯 GitHub 雲端自動打包流程、原生 Android 遊戲引擎以及 Web 互動預覽器：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GitHub Repository Documentation                      │
│                      (Bilingual README.md Guide)                        │
└───────────────┬───────────────────────┬─────────────────────────────────┘
                │                       │
                ▼                       ▼
┌───────────────────────────────┐ ┌───────────────────────────────────────┐
│   GitHub Actions CI Pipeline  │ │     Native Android Engine (Kotlin)    │
│  • Push / Manual Trigger      │ │  • 1080x2400 Virtual Canvas (30-185Hz)│
│  • JDK 17 + Node 24 Actions   │ │  • Thread-Safe WorldLock & Crash Guard│
│  • Auto-builds Debug APK      │ │  • 10-Row Snake Grid (+15% HP, 3% Box)│
└───────────────┬───────────────┘ └───────────────────┬───────────────────┘
                │                                     │
                └─────────────────┬───────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Web Arcade Preview & Code Explorer (React)                 │
│  • Live 60FPS Gameplay Simulation + One-Click README.md Viewer/Copier   │
└─────────────────────────────────────────────────────────────────────────┘
```
