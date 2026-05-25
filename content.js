/* TextExport · content.js
   Injects a floating export toolbar whenever text is selected on any page.
   Uses Shadow DOM to avoid CSS conflicts with host pages.
*/
(function () {
  if (window.__textExportLoaded) return;
  window.__textExportLoaded = true;

  /* ── Create Shadow Host ── */
  const host = document.createElement('div');
  host.id = '__te_host';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;pointer-events:none;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  /* ── Styles inside Shadow DOM ── */
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }

    #bar {
      position: fixed;
      pointer-events: auto;
      display: none;
      align-items: center;
      gap: 4px;
      background: #1a1714;
      border-radius: 10px;
      padding: 6px 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.28);
      transform: translateX(-50%) translateY(-100%);
      margin-top: -10px;
      font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      user-select: none;
    }

    #bar.on { display: flex; }

    #bar::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 10px; height: 5px;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
      background: #1a1714;
    }

    .lbl {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      padding: 0 4px;
      white-space: nowrap;
    }

    .sep { width: 1px; height: 18px; background: rgba(255,255,255,0.14); margin: 0 2px; }

    .btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 11px;
      border-radius: 7px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      transition: filter 0.12s, transform 0.1s;
      font-family: inherit;
    }

    .btn:active { transform: scale(0.95); }
    .btn:hover  { filter: brightness(1.15); }

    .btn svg { width: 13px; height: 13px; flex-shrink: 0; }

    .word { background: #0f6e56; color: #fff; }
    .pdf  { background: #a32d2d; color: #fff; }

    #toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(60px);
      background: #1a1714;
      color: #fff;
      padding: 9px 18px;
      border-radius: 24px;
      font-size: 13px;
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
      pointer-events: none;
      white-space: nowrap;
      font-family: inherit;
    }

    #toast.on {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  `;
  shadow.appendChild(style);

  /* ── Floating bar markup ── */
  const bar = document.createElement('div');
  bar.id = 'bar';
  bar.innerHTML = `
    <span class="lbl">导出选中内容</span>
    <div class="sep"></div>
    <button class="btn word" id="btn-word">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="16" y2="17"/>
      </svg>
      Word
    </button>
    <button class="btn pdf" id="btn-pdf">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
      </svg>
      PDF
    </button>
  `;
  shadow.appendChild(bar);

  /* ── Toast ── */
  const toast = document.createElement('div');
  toast.id = 'toast';
  shadow.appendChild(toast);
  let toastTimer;

  function showToast(msg, err) {
    toast.textContent = (err ? '✗ ' : '✓ ') + msg;
    toast.style.background = err ? '#a32d2d' : '#1a1714';
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 2600);
  }

  /* ── Selection state ── */
  let savedSelection = null;
  let pendingUpdate = 0;

  function scheduleUpdate(delay) {
    clearTimeout(pendingUpdate);
    pendingUpdate = setTimeout(updateBar, delay);
  }

  function getSelectionText() {
    return (window.getSelection() || '').toString().trim();
  }

  function getSelectionData() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    const fragment = range.cloneContents();
    const rawHtml = fragmentToHtml(fragment);
    const text = sel.toString().trim();
    const hasImage = /<img\b/i.test(rawHtml);

    if (!text && !hasImage) return null;

    return {
      text,
      html: rawHtml,
      fallbackHtml: fragmentToHtml(fragment, { embedImages: false }),
      title: getPageTitle(),
      url: location.href,
      hasImage,
    };
  }

  function getPageTitle() {
    return document.title.trim() || location.hostname || '导出文档';
  }

  /* ── Show/hide bar ── */
  function updateBar() {
    const selection = getSelectionData();

    if (!selection) {
      bar.classList.remove('on');
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    savedSelection = selection;

    bar.style.left = (rect.left + rect.width / 2) + 'px';
    bar.style.top  = (rect.top - 10) + 'px';
    bar.classList.add('on');
  }

  document.addEventListener('mouseup',        () => scheduleUpdate(30));
  document.addEventListener('keyup',          () => scheduleUpdate(30));
  document.addEventListener('selectionchange',() => scheduleUpdate(80));

  /* Clicking outside clears bar */
  document.addEventListener('mousedown', (e) => {
    if (!e.composedPath().includes(host)) {
      setTimeout(() => {
        if (!getSelectionData()) bar.classList.remove('on');
      }, 50);
    }
  });

  /* ── Word export ── */
  function exportWord() {
    const selection = savedSelection || getSelectionData();
    if (!selection) { showToast('请先选中文字或图片', true); return; }

    const title = selection.title || getPageTitle();
    const contentHtml = selection.html || textToHtml(selection.text);

    const html = `\ufeff<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${escHtml(title)}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument>
</xml><![endif]-->
<style>
  @page { margin: 2cm; size: A4; }
  body {
    font-family: 宋体, 'SimSun', serif;
    font-size: 14pt;
    color: #1a1714;
    line-height: 1.8;
    mso-margin-top-alt: auto;
    mso-margin-bottom-alt: auto;
  }
  h1 {
    font-size: 18pt;
    font-weight: bold;
    margin: 0 0 12pt;
    border-bottom: 1.5pt solid #c8820a;
    padding-bottom: 6pt;
    color: #1a1714;
  }
  .meta {
    font-size: 9pt;
    color: #8a847e;
    margin: 0 0 18pt;
  }
  .te-content p,
  .te-content div,
  .te-content blockquote,
  .te-content pre,
  .te-content ul,
  .te-content ol,
  .te-content table,
  .te-content figure {
    margin: 0 0 8pt 0;
    line-height: 1.8;
  }
  .te-content img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 10pt auto;
  }
  .te-content table {
    width: 100%;
    border-collapse: collapse;
  }
  .te-content th,
  .te-content td {
    border: 1pt solid #d8d2cb;
    padding: 5pt;
    vertical-align: top;
  }
</style>
</head>
<body>
<h1>${escHtml(title)}</h1>
<p class="meta">来源：${escHtml(location.href)} &nbsp;·&nbsp; 导出时间：${new Date().toLocaleString('zh-CN')}</p>
<div class="te-content">
${contentHtml}
</div>
</body>
</html>`;

    downloadBlob(html, title + '.doc', 'application/msword');
    showToast('Word 文档已导出');
  }

  /* ── PDF export (opens print window) ── */
  function exportPDF() {
    const selection = savedSelection || getSelectionData();
    if (!selection) { showToast('请先选中文字或图片', true); return; }

    showToast('正在准备 PDF 预览…');
    saveSelectionForPrint(selection)
      .then(() => openPrintPreview())
      .catch((err) => {
        showToast(err && err.message ? err.message : 'PDF 预览打开失败', true);
      });
  }

  /* ── Helpers ── */
  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function textToHtml(text) {
    return String(text || '')
      .split('\n')
      .map(line => line.trim()
        ? `<p>${escHtml(line)}</p>`
        : '<p>&nbsp;</p>')
      .join('\n');
  }

  function fragmentToHtml(fragment, options = {}) {
    const embedImages = options.embedImages !== false;
    const allowedTags = new Set([
      'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DD', 'DIV', 'DL', 'DT', 'EM',
      'FIGCAPTION', 'FIGURE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I',
      'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP',
      'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL'
    ]);
    const blockTags = new Set([
      'ADDRESS', 'ARTICLE', 'ASIDE', 'DIV', 'FIGURE', 'FOOTER', 'HEADER',
      'MAIN', 'NAV', 'P', 'SECTION'
    ]);

    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || '');
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createTextNode('');
      }

      const tagName = node.tagName;
      const outputTag = allowedTags.has(tagName)
        ? tagName.toLowerCase()
        : (blockTags.has(tagName) ? 'div' : 'span');
      const el = document.createElement(outputTag);

      if (tagName === 'IMG') {
        const src = getImageSrc(node, embedImages);
        if (!src) return document.createTextNode('');

        el.setAttribute('src', src);
        el.setAttribute('alt', node.getAttribute('alt') || '');
        const width = node.naturalWidth || parseInt(node.getAttribute('width'), 10);
        const height = node.naturalHeight || parseInt(node.getAttribute('height'), 10);
        if (width) el.setAttribute('width', String(Math.min(width, 960)));
        if (height && width && width <= 960) el.setAttribute('height', String(height));
        el.setAttribute('style', 'max-width:100%;height:auto;');
        return el;
      }

      if (tagName === 'A') {
        const href = resolveUrl(node.getAttribute('href'));
        if (href && /^https?:|^mailto:/i.test(href)) {
          el.setAttribute('href', href);
        }
      }

      for (const child of node.childNodes) {
        const cleanChild = cleanNode(child);
        if (cleanChild.textContent || cleanChild.nodeName === 'IMG' || cleanChild.childNodes.length) {
          el.appendChild(cleanChild);
        }
      }

      return el;
    }

    const cleaned = document.createElement('div');
    for (const child of fragment.childNodes) {
      const cleanChild = cleanNode(child);
      if (cleanChild.textContent || cleanChild.nodeName === 'IMG' || cleanChild.childNodes.length) {
        cleaned.appendChild(cleanChild);
      }
    }

    const html = cleaned.innerHTML.trim();
    return html || textToHtml(getSelectionText());
  }

  function getImageSrc(img, embedImage) {
    if (embedImage) {
      const embedded = imageToDataUrl(img);
      if (embedded) return embedded;
    }

    const currentSrc = img.currentSrc || img.src || img.getAttribute('src');
    return resolveUrl(currentSrc);
  }

  function saveSelectionForPrint(selection) {
    const payload = {
      te_text: selection.text || '',
      te_html: selection.html || '',
      te_title: selection.title || getPageTitle(),
      te_url: selection.url || location.href,
    };

    const fallbackPayload = {
      te_text: payload.te_text,
      te_html: selection.fallbackHtml || textToHtml(selection.text),
      te_title: payload.te_title,
      te_url: payload.te_url,
    };

    return chrome.storage.session.set(payload).catch(() => {
      return chrome.storage.local.set(fallbackPayload).catch(() => {
        return chrome.storage.local.set(payload);
      });
    });
  }

  function openPrintPreview() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'OPEN_PRINT' }, (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error('后台未响应，请重新加载扩展后再试'));
          return;
        }

        if (!resp || !resp.ok) {
          reject(new Error(resp && resp.error ? resp.error : 'PDF 预览打开失败'));
          return;
        }

        resolve();
      });
    });
  }

  function imageToDataUrl(img) {
    const width = img.naturalWidth || 0;
    const height = img.naturalHeight || 0;
    if (!img.complete || !width || !height) return '';

    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const largeImage = width > 600 && height > 400;
      return largeImage
        ? canvas.toDataURL('image/jpeg', 0.85)
        : canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }

  function resolveUrl(url) {
    if (!url || /^javascript:/i.test(url)) return '';
    try {
      return new URL(url, document.baseURI).href;
    } catch {
      return '';
    }
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ── Wire buttons ── */
  shadow.getElementById('btn-word').addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      exportWord();
    } catch (err) {
      showToast(err && err.message ? err.message : 'Word 导出失败', true);
    }
  });

  shadow.getElementById('btn-pdf').addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      exportPDF();
    } catch (err) {
      showToast(err && err.message ? err.message : 'PDF 导出失败', true);
    }
  });

  /* Prevent bar clicks from clearing selection */
  bar.addEventListener('mousedown', (e) => e.preventDefault());

})();
