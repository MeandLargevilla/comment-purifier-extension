document.addEventListener('DOMContentLoaded', () => {
  // 1. 界面国际化
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.innerText = msg;
  });
  
  const textarea = document.getElementById('userKeywords');
  textarea.placeholder = chrome.i18n.getMessage("uiKeywordPlaceholder");

  // 2. 加载设置 (包括开关状态)
  chrome.storage.sync.get(['words', 'mode', 'enabled'], (data) => {
    if (data.words) textarea.value = data.words;
    if (data.mode) document.getElementById('mode').value = data.mode;
    
    // 如果没有存过enabled，默认为 "true" (开启)
    if (data.enabled !== undefined) {
      document.getElementById('switch').value = data.enabled;
    } else {
      document.getElementById('switch').value = "true";
    }
  });

  // 3. 保存设置
  // 3. 保存设置（优化版：增加了防止单字误伤的逻辑）
  document.getElementById('save').addEventListener('click', () => {
    const rawInput = textarea.value;
    const mode = document.getElementById('mode').value;
    const enabled = document.getElementById('switch').value;

    // --- 新增：安全检查 ---
    // 检查是否有太短的关键词（比如只有1个字的）
    const keywords = rawInput.split(/,|，/);
    const dangerousWords = keywords.filter(w => w.trim().length === 1);
    
    if (dangerousWords.length > 0) {
        // 如果发现危险词，提示用户，不保存
        alert(`⚠️ 安全警告：\n关键词 "${dangerousWords.join('", "')}" 太短了！\n\n屏蔽单字会导致网页大部分内容消失。\n请至少输入2个字的词。`);
        return; // ⛔ 停止执行
    }
    // -------------------

    chrome.storage.sync.set({ words: rawInput, mode: mode, enabled: enabled }, () => {
      const statusDiv = document.getElementById('status');
      statusDiv.innerText = chrome.i18n.getMessage("msgSaved");
      
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) chrome.tabs.reload(tabs[0].id);
      });
      
      setTimeout(() => statusDiv.innerText = "", 2000);
    });
  });
});