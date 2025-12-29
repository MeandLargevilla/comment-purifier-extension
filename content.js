// Comment Purifier - Content Script
const DEFAULT_BAD_WORDS = [
  "刷单",
  "卖片",
  "澳门首家",
  "包夜",
  "色情",
  "黄图",
  "黄片",
  "裸照",
  "裸体",
  "色情视频",
  "性交易",
  "约炮",
  "一夜情",
  "口交",
  "阴道",
  "阴茎",
  "奶子",
  "乳房",
  "射精",
  "群交",
  "强奸",
  "强暴",
  "性骚扰",
  "性侵犯",
  "脑残",
  "智障",
  "nmsl",
  "死全家",
  "性虐待",
  "性病",
  "性器官",
  "自慰",
  "手淫",
  "阴蒂",
  "阴唇",
  "肛门",
  "肛交",
  "性高潮",
  "性欲",
  "性幻想",
  "性虐",
  "性奴",
  "性奴隶",
  "性奴役",
  "性虐待狂",
  "傻逼",
  "傻B",
  "傻子",
  "弱智",
  "垃圾",
  "废物",
  "贱人",
  "贱货",
  "婊子",
  "滚",
  "滚开",
  "吃屎",
  "去死",
  "操你",
  "草你妈",
  "你妈",
  "王八蛋",
  "杀了你",
  "弄死你",
  "砍死你",
  "打死你",
  "烧死你",
  "去死吧",
  "我弄死你",
  "porn",
  "porno",
  "pornography",
  "hentai",
  "nude",
  "naked",
  "nsfw",
  "nudity",
  "sex",
  "sexual",
  "fuck",
  "fucking",
  "fucked",
  "fucker",
  "motherfucker",
  "mf",
  "cunt",
  "pussy",
  "vagina",
  "dick",
  "cock",
  "penis",
  "tits",
  "boobs",
  "breasts",
  "asshole",
  "butthole",
  "blowjob",
  "handjob",
  "oral",
  "deepthroat",
  "rimjob",
  "cumshot",
  "jizz",
  "semen",
  "creampie",
  "anal",
  "gangbang",
  "orgy",
  "bukkake",
  "rape",
  "raping",
  "sexual assault",
  "noncon",
  "non-consent",
  "forced",
  "bestiality",
  "zoophilia",
  "beastiality",
  "incest",
  "loli",
  "lolita",
  "shota",
  "prostitute",
  "hooker",
  "whore",
  "slut",
  "camgirl",
  "onlyfans",
  "thot",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "tranny",
  "retard",
  "kill yourself",
  "kys",
  "commit suicide",
  "hang yourself",
  "die bitch",
  "kill you",
  "i will kill you",
  "go die",
  "fuck off and die",
];

let globalRegex = null;
let currentMode = "super";
let isEnabled = true;

function init() {
  chrome.storage.sync.get(["words", "mode", "enabled", "whitelist"], (data) => {
    if (data.enabled === "false") {
      isEnabled = false;
      return;
    }

    const currentHost = window.location.hostname;
    const whitelist = data.whitelist || [];
    if (whitelist.includes(currentHost)) {
      console.log("🛡️ [Comment Purifier] Skipped: Domain is whitelisted.");
      isEnabled = false;
      return;
    }

    const userWords = data.words ? data.words.split(/,|，/) : [];
    const cleanUserWords = userWords
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    const allWords = [...DEFAULT_BAD_WORDS, ...cleanUserWords];

    if (allWords.length > 0) {
      buildRegex(allWords);
      currentMode = data.mode || "super";

      // 1. 首次加载：扫描整个 Body
      // 使用 requestIdleCallback 避免阻塞页面加载
      requestIdleCallback(() => scanNode(document.body));

      // 2. 开启增量监听
      startObserver();
    }
  });
}

function buildRegex(words) {
  const escapedWords = words.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  escapedWords.sort((a, b) => b.length - a.length);
  globalRegex = new RegExp(`(${escapedWords.join("|")})`, "gi");
}

function scanNode(root) {
  if (!isEnabled || !globalRegex || !root) return;

  // 使用 NodeFilter 在遍历前就剔除无关元素，效率更高
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        // 如果父级是 script/style/textarea，直接跳过整个标签
        const parentTag = node.parentElement ? node.parentElement.tagName : "";
        if (
          parentTag === "SCRIPT" ||
          parentTag === "STYLE" ||
          parentTag === "TEXTAREA" ||
          node.parentElement.isContentEditable
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        // 如果已经处理过，跳过
        if (node.parentElement.dataset.purified === "yes") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue;
    if (!text || text.length < 2) continue;

    globalRegex.lastIndex = 0; // Reset regex index
    if (globalRegex.test(text)) {
      handleBadNode(node, node.parentElement);
    }
  }
}

function handleBadNode(textNode, parentElement) {
  parentElement.dataset.purified = "yes";

  switch (currentMode) {
    case "super":
      const container = parentElement.closest(
        'article, li, [role="article"], ' +
          "ytd-comment-thread-renderer, ytd-rich-item-renderer, " +
          '[data-testid="tweet"], [data-testid="cellInnerDiv"], ' +
          ".reply-item, .bili-comment-container-fallback, .feed-card, " +
          '.WB_card, [action-type="feed_list_item"], ' +
          ".CommentItem, .List-item, .AnswerItem, " +
          'shreddit-comment, .l_post, [data-e2e="comment-item"], ' +
          '[class*="comment"], [class*="Comment"], [class*="post"], [class*="card"]'
      );
      if (container) {
        container.style.display = "none";
      } else {
        parentElement.style.display = "none";
      }
      break;

    case "space":
      textNode.nodeValue = textNode.nodeValue.replace(globalRegex, (match) =>
        "  ".repeat(match.length)
      );
      break;

    case "mask":
      textNode.nodeValue = textNode.nodeValue.replace(globalRegex, "***");
      parentElement.style.color = "#bbb";
      break;

    case "blur":
      parentElement.style.filter = "blur(6px)";
      parentElement.style.pointerEvents = "none";
      parentElement.title = "Content Hidden";
      break;

    case "red":
      parentElement.style.border = "2px solid #ff4757";
      parentElement.style.backgroundColor = "rgba(255, 71, 87, 0.1)";
      break;
  }
}

function startObserver() {
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;

    // 使用 requestIdleCallback 确保不卡顿 UI
    // 如果浏览器不支持 (Safari)，降级为 setTimeout
    const scheduler = window.requestIdleCallback || setTimeout;

    scheduler(() => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            // 只有元素节点才需要扫描 (type 1)
            if (node.nodeType === 1) {
              scanNode(node);
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 为了兼容性，简单 polyfill requestIdleCallback
window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    return setTimeout(() => {
      const start = Date.now();
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  };

init();
