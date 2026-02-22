const DEFAULTS = {
    enabled: true,
    blockShortsPage: true,
    hideShelves: true,
    showInPageToggle: false
};

let cached = { ...DEFAULTS };

// --- 設定ロード
async function loadSettings() {
    cached = await chrome.storage.sync.get(DEFAULTS);
    return cached;
}

// --- Shortsページブロック
function blockShortsPageIfNeeded() {
    if (!cached.enabled || !cached.blockShortsPage) return;
    if (location.pathname.startsWith("/shorts/")) {
        const id = location.pathname.split("/shorts/")[1]?.split(/[?&#/]/)[0];
        location.replace(id ? `/watch?v=${id}` : `/`);
    }
}

// --- Shorts棚削除（重い全走査を避ける）
function removeShortsShelvesIfNeeded() {
    if (!cached.enabled || !cached.hideShelves) return;

    // まず「棚レンダラ」を直接消す（これが一番軽い）
    document.querySelectorAll("ytd-reel-shelf-renderer").forEach(el => el.remove());

    // 追加：/shorts/リンクが混ざってるブロックを消す（必要最低限だけ）
    // 全リンク走査は重いので、棚っぽいコンテナだけ対象にする
    document.querySelectorAll("ytd-rich-section-renderer, ytd-item-section-renderer").forEach(section => {
        if (section.querySelector('a[href^="/shorts/"]')) {
            section.remove();
        }
    });
}

// --- YouTube上トグル（DOM監視のたびには呼ばない）
function renderInPageToggle() {
    const id = "yt-shorts-hider-toggle";
    const existing = document.getElementById(id);

    if (!cached.showInPageToggle) {
        if (existing) existing.remove();
        return;
    }

    if (existing) {
        existing.textContent = cached.enabled ? "Shorts: OFF" : "Shorts: ON";
        return;
    }

    const btn = document.createElement("button");
    btn.id = id;
    btn.textContent = cached.enabled ? "Shorts: OFF" : "Shorts: ON";
    btn.style.position = "fixed";
    btn.style.right = "12px";
    btn.style.bottom = "12px";
    btn.style.zIndex = "999999";
    btn.style.padding = "10px 12px";
    btn.style.borderRadius = "999px";
    btn.style.border = "1px solid rgba(0,0,0,0.2)";
    btn.style.background = "white";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", async () => {
        await chrome.storage.sync.set({ enabled: !cached.enabled });
    });

    document.body.appendChild(btn);
}

// --- 間引き実行（ここが肝）
let scheduled = false;
function scheduleRun() {
    if (scheduled) return;
    scheduled = true;

    // 早すぎる連打を止める（YouTubeはDOM更新が多い）
    setTimeout(() => {
        scheduled = false;
        blockShortsPageIfNeeded();
        removeShortsShelvesIfNeeded();
    }, 200);
}

(async function init() {
    await loadSettings();

    // 初回
    blockShortsPageIfNeeded();
    removeShortsShelvesIfNeeded();
    renderInPageToggle();

    // DOM監視：重い処理は scheduleRun 経由で間引く
    const observer = new MutationObserver(() => {
        scheduleRun();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // 設定変更時だけトグル描画を更新（ここ重要）
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync") return;
        for (const [key, change] of Object.entries(changes)) {
            cached[key] = change.newValue;
        }
        // 設定変更は即反映
        blockShortsPageIfNeeded();
        removeShortsShelvesIfNeeded();
        renderInPageToggle();
    });
})();