/* TextExport · background.js */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'OPEN_PRINT') {
    chrome.tabs.create({ url: chrome.runtime.getURL('print.html'), active: true })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        sendResponse({ ok: false, error: err && err.message ? err.message : '打开 PDF 预览页失败' });
      });
    return true; // keep channel open for async response
  }
});
