document.addEventListener("DOMContentLoaded", () => {
  // 1. 界面翻译
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.innerText = msg;
  });

  const textarea = document.getElementById("userKeywords");
  const domainLabel = document.getElementById("domainName");
  const whitelistBtn = document.getElementById("whitelistBtn");
  const whitelistText = document.getElementById("whitelistText");
  const whitelistIcon = document.getElementById("whitelistIcon");

  let currentHost = "";
  let isWhitelisted = false; // 当前状态标记

  // 获取当前标签页域名
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        currentHost = url.hostname;
        domainLabel.innerText = currentHost;

        // 域名获取成功后，加载状态
        loadSettings();
      } catch (e) {
        domainLabel.innerText = "Local Page";
        whitelistBtn.disabled = true;
        whitelistText.innerText = "Not available";
      }
    }
  });

  // 2. 加载设置 & 更新按钮状态
  function loadSettings() {
    chrome.storage.sync.get(
      ["words", "mode", "enabled", "whitelist"],
      (data) => {
        // 加载常规设置
        if (data.words) textarea.value = data.words;
        if (data.mode) document.getElementById("mode").value = data.mode;
        document.getElementById("switch").value =
          data.enabled !== "false" ? "true" : "false";

        // 核心：检查白名单状态
        const whitelist = data.whitelist || [];
        if (currentHost && whitelist.includes(currentHost)) {
          setWhitelistState(true); // 在名单里 -> 激活状态
        } else {
          setWhitelistState(false); // 不在名单里 -> 默认状态
        }
      }
    );
  }

  // 3. 切换按钮视觉状态的函数
  function setWhitelistState(active) {
    isWhitelisted = active;
    if (active) {
      // 激活状态（绿灯）：代表在白名单里，插件不工作
      whitelistBtn.classList.add("active");
      whitelistIcon.innerText = "🏳️"; // 白旗，代表停战/白名单
      whitelistText.innerText = chrome.i18n.getMessage("btnWhitelistOn");
    } else {
      // 默认状态（灰灯）：代表不在白名单，插件正在工作
      whitelistBtn.classList.remove("active");
      whitelistIcon.innerText = "🛡️"; // 盾牌，代表防御中
      whitelistText.innerText = chrome.i18n.getMessage("btnWhitelistOff");
    }
  }

  // 4. 按钮点击事件 (点击即切换)
  whitelistBtn.addEventListener("click", () => {
    if (!currentHost) return;

    // 切换状态
    const newState = !isWhitelisted;
    setWhitelistState(newState);

    // 立即读取存储并更新
    chrome.storage.sync.get(["whitelist"], (data) => {
      let list = data.whitelist || [];

      if (newState) {
        // 如果变成了激活，加入白名单
        if (!list.includes(currentHost)) list.push(currentHost);
      } else {
        // 如果变成了关闭，移出白名单
        list = list.filter((host) => host !== currentHost);
      }

      // 保存
      chrome.storage.sync.set({ whitelist: list }, () => {
        // 提示一下
        const statusDiv = document.getElementById("status");
        statusDiv.innerText = "✅ " + chrome.i18n.getMessage("msgSaved");

        // 自动刷新页面
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) chrome.tabs.reload(tabs[0].id);
        });

        setTimeout(() => (statusDiv.innerText = ""), 1500);
      });
    });
  });

  // 5. 底部保存按钮 (只负责保存关键词和模式)
  document.getElementById("save").addEventListener("click", () => {
    const rawInput = textarea.value;
    const mode = document.getElementById("mode").value;
    const enabled = document.getElementById("switch").value;

    // 安全检查
    const keywords = rawInput.split(/,|，/);
    const dangerousWords = keywords.filter((w) => w.trim().length === 1);

    if (dangerousWords.length > 0) {
      alert(`⚠️ Warning: Keywords too short!`);
      return;
    }

    chrome.storage.sync.set(
      { words: rawInput, mode: mode, enabled: enabled },
      () => {
        const statusDiv = document.getElementById("status");
        statusDiv.innerText = chrome.i18n.getMessage("msgSaved");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) chrome.tabs.reload(tabs[0].id);
        });

        setTimeout(() => (statusDiv.innerText = ""), 2000);
      }
    );
  });
});
