# 选字导出 · TextExport for Edge

> 将任意网页选中的文字或图片一键导出为 Word 或 PDF 文档
> Export selected text and images from any webpage to Word or PDF with one click

![Edge](https://img.shields.io/badge/Microsoft%20Edge-适配-0078D7?logo=microsoft-edge&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V3-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 简介 · Introduction

**选字导出** 是一款适配 Microsoft Edge 的浏览器扩展。在任意网页（GitHub、知乎、新闻页、文档站等）选中文字或图片后，会自动弹出悬浮工具栏，一键将所选内容导出为 `.doc` 或 `.pdf` 文件，图片会自动嵌入文档，无需复制粘贴，无需打开额外应用。

**TextExport** is a Microsoft Edge browser extension. Select any text or images on any webpage — GitHub, Zhihu, news sites, documentation — and a floating toolbar appears instantly. Export the selection to `.doc` or `.pdf` in one click, with images embedded automatically. No copy-paste, no extra apps needed.

---

## 功能特性 · Features

| 功能 | Feature |
|------|---------|
| 🖱️ 选中即弹出悬浮工具栏 | Floating toolbar appears on selection |
| 🖼️ 支持文字 + 图片导出 | Supports text and image export |
| 📄 导出为 Word (.doc) | Export to Word (.doc) |
| 🖨️ 导出为 PDF（打印预览） | Export to PDF via print preview |
| 🌐 适配所有网页 | Works on all webpages |
| 🔒 Shadow DOM 隔离，不影响原页面样式 | Shadow DOM isolation, no style conflicts |
| 📌 导出文件自动含来源 URL 与时间 | Output includes source URL and timestamp |

---

## 安装方法 · Installation

> 目前需手动加载，尚未上架 Edge 扩展商店。
> Currently requires manual loading; not yet listed in the Edge Add-ons store.

**中文步骤：**

1. 点击右上角 **Code → Download ZIP**，下载并解压本仓库
2. 打开 Edge 浏览器，地址栏输入 `edge://extensions` 并回车
3. 右上角开启 **开发人员模式**
4. 点击 **加载解压缩的扩展**，选择解压后包含 `manifest.json` 的文件夹（即 `se12doc-for-edge-main`）
5. 扩展栏出现图标，加载后刷新已打开的网页即可使用 ✅

> ⚠️ **易错提示**：解压后是一个 `se12doc-for-edge-main` 文件夹，里面直接就是 `manifest.json`。加载时必须选中**这一层** —— 不能选它的上级目录，也不能点进文件夹内部再去选子目录。如果 Edge 报"文件找不到/已损毁"，多半是选错了层级。

**English steps:**

1. Click **Code → Download ZIP** at the top right, then unzip
2. Open Edge and navigate to `edge://extensions`
3. Enable **Developer mode** in the top-right corner
4. Click **Load unpacked** and select the folder containing `manifest.json` (i.e. `se12doc-for-edge-main`)
5. The extension icon appears — refresh any open pages to activate ✅

> ⚠️ **Common mistake**: The unzipped folder `se12doc-for-edge-main` contains `manifest.json` directly. Select **this exact folder** — not its parent, not a subfolder inside it. If Edge shows "file not found / corrupted", you're likely selecting the wrong folder level.

---

## 使用方法 · Usage

**中文：**

1. 在任意网页，用鼠标选中你想保存的文字或图片
2. 自动弹出悬浮工具栏（黑色浮窗）
3. 点击 **Word** → 直接下载 `.doc` 文件（图片自动嵌入）
4. 点击 **PDF** → 打开预览页，使用 Edge 打印功能另存为 PDF

**English:**

1. On any webpage, select the text or images you want to save
2. A floating toolbar (dark popup) appears automatically
3. Click **Word** → downloads a `.doc` file directly (images auto-embedded)
4. Click **PDF** → opens a preview page; use Edge's print dialog to save as PDF

---

## 文件结构 · File Structure

```
textexport-ext/
├── manifest.json      # 扩展配置 · Extension manifest (MV3)
├── content.js         # 注入所有页面的悬浮工具栏 · Floating toolbar injected into all pages
├── background.js      # Service Worker，处理 PDF 跳转 · Handles PDF tab opening
├── popup.html         # 点击扩展图标时的说明弹窗 · Usage guide popup
├── print.html         # PDF 预览页 · PDF preview page
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 技术栈 · Tech Stack

- **Manifest V3** — Edge / Chrome 扩展规范
- **Shadow DOM** — 样式隔离，防止与宿主页面冲突
- **chrome.storage.session** — 跨标签页安全传递内容
- **Blob + URL.createObjectURL** — 纯前端生成 Word 文件，无需服务器

---

## 隐私说明 · Privacy

本扩展不收集、不上传任何用户数据。所有操作（文字/图片提取、文件生成）均在本地浏览器内完成。

This extension collects no user data and makes no network requests. All operations — text and image extraction, file generation — happen entirely within your local browser.

---

## 开源协议 · License

[MIT License](LICENSE) · 自由使用、修改与分发 · Free to use, modify, and distribute

---

## 贡献 · Contributing

欢迎提交 Issue 或 Pull Request！
Issues and Pull Requests are welcome!
