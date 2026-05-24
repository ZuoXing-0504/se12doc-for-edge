/* TextExport · background.js */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'OPEN_PRINT') {
    const openPrint = () => {
      const printUrl = chrome.runtime.getURL('print.html');
      return chrome.tabs.create({ url: printUrl, active: true })
        .then(() => sendResponse({ ok: true }))
        .catch((err) => {
          sendResponse({ ok: false, error: err && err.message ? err.message : '打开 PDF 预览页失败' });
        });
    };

    if (msg.text || msg.html || msg.title || msg.url) {
      chrome.storage.session.set({
        te_text:  msg.text,
        te_html:  msg.html,
        te_title: msg.title,
        te_url:   msg.url,
      }).then(openPrint).catch((err) => {
        sendResponse({ ok: false, error: err && err.message ? err.message : '保存导出内容失败' });
      });
      return true;
    }

    openPrint();
    return true; // keep channel open for async response
  }
});
