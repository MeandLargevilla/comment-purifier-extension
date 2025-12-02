// ===============================================
// 👇 你的预设词库 👇
// ===============================================
const DEFAULT_BAD_WORDS = [
    "刷单", "卖片", "澳门首家",  "包夜",
    "色情","黄图","黄片","裸照","裸体","色情视频","性交易",
"约炮","一夜情","口交","阴道","阴茎","奶子","乳房","射精","群交","强奸",
"强暴","性骚扰","性侵犯","脑残", "智障", "nmsl", "死全家"
, "性虐待", "性病", "性器官", "自慰", "手淫", "阴蒂", "阴唇", "肛门", "肛交",
"性高潮", "性欲", "性幻想", "性虐", "性奴", "性奴隶", "性奴役", "性虐待狂",
"傻逼","傻B","傻子","弱智","脑残","垃圾","废物","贱人","贱货","婊子",
"滚","滚开","吃屎","去死","操你","草你妈","你妈","王八蛋"
,"杀了你","弄死你","砍死你","打死你","烧死你","去死吧","我弄死你"
,"porn","porno","pornography","hentai","nude","naked","nsfw","nudity",
"sex","sexual","fuck","fucking","fucked","fucker","motherfucker","mf",
"cunt","pussy","vagina","dick","cock","penis","tits","boobs","breasts",
"asshole","butthole","blowjob","handjob","oral","deepthroat","rimjob",
"cumshot","jizz","semen","creampie","anal","gangbang","orgy","bukkake",
"rape","raping","sexual assault","noncon","non-consent","forced",
"bestiality","zoophilia","beastiality","incest","loli","lolita","shota",
"prostitute","hooker","whore","slut","camgirl","onlyfans","thot",
"nigger","nigga","faggot","fag","tranny","retard",
"kill yourself","kys","commit suicide","hang yourself","die bitch",
"kill you","i will kill you","go die","fuck off and die"

   // 在这里粘贴你之前找的词库
]; 
// ===============================================

let fullBlockList = [];
let currentFilterMode = 'super'; 
let isPluginEnabled = true;

function initPlugin() {
    chrome.storage.sync.get(['words', 'mode', 'enabled'], (data) => {
        if (data.enabled === "false") {
            isPluginEnabled = false;
            return;
        }

        const userCustomWords = data.words ? data.words.split(/,|，/) : [];
        const cleanUserWords = userCustomWords.map(w => w.trim()).filter(w => w);

        fullBlockList = [...DEFAULT_BAD_WORDS, ...cleanUserWords];
        currentFilterMode = data.mode || 'super'; 

        if (fullBlockList.length > 0) {
            cleanUpNow();
            observePage();
        }
    });
}

function createSafeRegex(word) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    const flexibleSpace = escaped.replace(/\s+/g, '\\s+');
    return new RegExp(`(${flexibleSpace})`, 'gi'); 
}

function cleanUpNow() {
    if (!isPluginEnabled) return;

    const targets = document.querySelectorAll('*'); 

    targets.forEach(el => {
        // 🛡️ 安全检查 (防死循环的关键)
        // 1. data-isPurified="yes": 父级元素已经处理过
        // 2. data-red-tag="true": 这是我们自己生成的红框，绝对不能再处理！
        // 3. childElementCount > 0: 必须是叶子节点（最里面的文字）
        if (el.dataset.isPurified === "yes" || 
            el.getAttribute('data-red-tag') === "true" || 
            el.childElementCount > 0 || 
            el.tagName === 'SCRIPT' || 
            el.tagName === 'STYLE') return;

        const textContent = el.textContent;
        if (textContent.trim().length < 1) return;

        const hasBadWord = fullBlockList.some(badWord => {
            const regex = createSafeRegex(badWord);
            return regex.test(textContent);
        });

        if (hasBadWord) {
            applyPurification(el);
            el.dataset.isPurified = "yes"; // 标记父级已处理
        }
    });
}

function applyPurification(element) {
    switch (currentFilterMode) {
        case 'super': 
            // 💥 超强力：连坐法
            const container = element.closest(
                'article, li, [role="article"], ' +
                'ytd-comment-thread-renderer, ytd-rich-item-renderer, ' +
                '[data-testid="tweet"], [data-testid="cellInnerDiv"], ' +
                '.reply-item, .bili-comment-container-fallback, .feed-card, ' +
                '.WB_card, [action-type="feed_list_item"], ' +
                '.CommentItem, .List-item, .AnswerItem, ' +
                'shreddit-comment, .l_post, [data-e2e="comment-item"], ' +
                '[class*="comment"], [class*="Comment"], [class*="post"], [class*="card"]'
            ) || element;
            container.style.display = 'none'; 
            break;

        case 'space':
            // 🔥 强力 (空格模式)
            let textForSpace = element.textContent;
            fullBlockList.forEach(badWord => {
                const regex = createSafeRegex(badWord);
                textForSpace = textForSpace.replace(regex, (match) => "  ".repeat(match.length));
            });
            element.textContent = textForSpace;
            break;
            
        case 'red': 
            // 👀 标注模式 (已修复无限变粗 BUG)
            let htmlContent = element.innerHTML;
            
            fullBlockList.forEach(badWord => {
                const regex = createSafeRegex(badWord);
                
                // 🔴 这里的 data-red-tag="true" 就是免死金牌
                // 🔴 我还调整了颜色：rgba(255,0,0,0.1) 是淡淡的粉红，不会挡住字
                htmlContent = htmlContent.replace(regex, 
                    `<span data-red-tag="true" style="border: 2px solid #ff4d4d; border-radius: 4px; background: rgba(255, 0, 0, 0.1); padding: 0 2px;">$1</span>`
                );
            });
            
            element.innerHTML = htmlContent;
            break;

        case 'mask': 
            element.innerText = chrome.i18n.getMessage("contentMaskText");
            element.style.color = "#bbb";
            element.style.fontStyle = "italic";
            break;
            
        case 'blur': 
            element.style.filter = 'blur(6px)';
            element.style.pointerEvents = 'none';
            element.title = chrome.i18n.getMessage("contentBlurTitle");
            break;
    }
}

let debounceTimer = null;
function observePage() {
    const observer = new MutationObserver(mutations => {
        if (!isPluginEnabled) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(cleanUpNow, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

initPlugin();