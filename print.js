function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderContent(title, text, html, url) {
  document.title = title + ' · TextExport PDF';
  document.getElementById('doc-title').textContent = title;

  const now = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  document.getElementById('doc-meta').innerHTML =
    `来源：<a href="${escHtml(url)}" target="_blank">${escHtml(url)}</a><br>导出时间：${now}`;

  const bodyEl = document.getElementById('doc-body');
  bodyEl.innerHTML = html
    ? sanitizeExportHtml(html)
    : textToHtml(text);

  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';
}

function textToHtml(text) {
  const lines = String(text || '').split('\n');
  return lines.map(line =>
    line.trim()
      ? `<p>${escHtml(line)}</p>`
      : '<div class="empty-line"></div>'
  ).join('');
}

function sanitizeExportHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const allowedTags = new Set([
    'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DD', 'DIV', 'DL', 'DT', 'EM',
    'FIGCAPTION', 'FIGURE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I',
    'IMG', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'SUB', 'SUP',
    'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL',
  ]);

  for (const el of [...doc.body.querySelectorAll('*')]) {
    if (!allowedTags.has(el.tagName)) {
      el.replaceWith(...el.childNodes);
      continue;
    }

    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (el.tagName === 'IMG' && ['src', 'alt', 'width', 'height', 'style'].includes(name)) {
        if (name === 'src' && !isSafeUrl(value, true)) el.removeAttribute(attr.name);
        continue;
      }

      if (el.tagName === 'A' && name === 'href' && isSafeUrl(value, false)) {
        continue;
      }

      el.removeAttribute(attr.name);
    }

    if (el.tagName === 'IMG' && !el.getAttribute('src')) {
      el.remove();
    }
  }

  return doc.body.firstElementChild.innerHTML || textToHtml('');
}

function isSafeUrl(url, allowDataImage) {
  try {
    const parsed = new URL(url, location.href);
    if (['http:', 'https:', 'blob:'].includes(parsed.protocol)) return true;
    if (allowDataImage && /^data:image\//i.test(url)) return true;
    return false;
  } catch {
    return false;
  }
}

function getStoredExportData() {
  const keys = ['te_text', 'te_html', 'te_title', 'te_url'];
  return chrome.storage.session.get(keys).then(data => {
    if (data.te_text || data.te_html) {
      return { data, area: chrome.storage.session };
    }

    return chrome.storage.local.get(keys).then(localData => ({
      data: localData,
      area: chrome.storage.local,
    }));
  }).catch(() => chrome.storage.local.get(keys).then(data => ({
    data,
    area: chrome.storage.local,
  })));
}

document.getElementById('btn-print').addEventListener('click', () => {
  window.print();
});

document.getElementById('btn-close').addEventListener('click', () => {
  window.close();
});

getStoredExportData().then(({ data, area }) => {
  if (data.te_text || data.te_html) {
    renderContent(data.te_title || '导出文档', data.te_text || '', data.te_html || '', data.te_url || '');
    area.remove(['te_text', 'te_html', 'te_title', 'te_url']);
  } else {
    document.getElementById('loading').textContent = '未找到内容，请重新操作。';
  }
}).catch(() => {
  document.getElementById('loading').textContent = '加载失败，请重试。';
});
