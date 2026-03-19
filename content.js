const DEFAULTS = {
    enabled: true,
    blockShortsPage: true,
    hideShelves: true,
    hideSearchShorts: true,
    showInPageToggle: false,
    toggleX: null,
    toggleY: null
};

let cached = { ...DEFAULTS };
let lastUrl = location.href;
let scheduled = false;

// -----------------------------
// 設定
// -----------------------------
async function loadSettings() {
    cached = await chrome.storage.sync.get(DEFAULTS);
    return cached;
}

// -----------------------------
// URL / ページ判定
// -----------------------------
function isSearchPage() {
    return location.pathname === "/results";
}

function isShortsUrl(url) {
    try {
        const u = new URL(url, location.origin);
        return u.pathname.startsWith("/shorts/");
    } catch {
        return false;
    }
}

// -----------------------------
// /shorts/ ページブロック
// -----------------------------
function blockShortsPageIfNeeded() {
    if (!cached.enabled || !cached.blockShortsPage) return;

    if (location.pathname.startsWith("/shorts/")) {
        const id = location.pathname.split("/shorts/")[1]?.split(/[?&#/]/)[0];
        location.replace(id ? `/watch?v=${id}` : `/`);
    }
}

// -----------------------------
// Shorts 棚削除
// -----------------------------
function removeShortsShelvesIfNeeded() {
    if (!cached.enabled || !cached.hideShelves) return;

    // Shorts 専用棚
    document.querySelectorAll("ytd-reel-shelf-renderer").forEach(el => {
        el.remove();
    });

    // ホームや関連などの大きいセクション
    // 検索ページでは section 丸ごと削除しない
    if (isSearchPage()) return;

    document.querySelectorAll("ytd-rich-section-renderer, ytd-item-section-renderer").forEach(section => {
        if (section.querySelector('a[href^="/shorts/"]')) {
            section.remove();
        }
    });
}

// -----------------------------
// 検索結果内の Shorts だけ非表示
// -----------------------------
function hideSearchShortsIfNeeded() {
    if (!cached.enabled || !cached.hideSearchShorts) return;
    if (!isSearchPage()) return;

    const shortsLinks = document.querySelectorAll('a[href^="/shorts/"]');

    shortsLinks.forEach(link => {
        const card =
            link.closest("ytd-video-renderer") ||
            link.closest("ytd-grid-video-renderer") ||
            link.closest("ytd-rich-item-renderer") ||
            link.closest("ytd-compact-video-renderer") ||
            link.closest("yt-lockup-view-model") ||
            link.closest("[data-context-item-id]");

        if (!card) return;
        if (card.dataset.ytShortsHidden === "1") return;

        card.dataset.ytShortsHidden = "1";
        card.style.display = "none";
    });
}

// -----------------------------
// まとめて適用
// -----------------------------
function applyAll() {
    blockShortsPageIfNeeded();
    removeShortsShelvesIfNeeded();
    hideSearchShortsIfNeeded();
}

// -----------------------------
// トグルUI
// -----------------------------
function getSavedTogglePosition() {
    const defaultX = window.innerWidth - 220;
    const defaultY = window.innerHeight - 80;

    return {
        x: Number.isFinite(cached.toggleX) ? cached.toggleX : Math.max(12, defaultX),
        y: Number.isFinite(cached.toggleY) ? cached.toggleY : Math.max(12, defaultY)
    };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function applyPanelPosition(panel, x, y) {
    const maxX = Math.max(0, window.innerWidth - panel.offsetWidth - 8);
    const maxY = Math.max(0, window.innerHeight - panel.offsetHeight - 8);

    const nextX = clamp(x, 8, maxX);
    const nextY = clamp(y, 8, maxY);

    panel.style.left = `${nextX}px`;
    panel.style.top = `${nextY}px`;
}

async function savePanelPosition(x, y) {
    cached.toggleX = x;
    cached.toggleY = y;
    await chrome.storage.sync.set({
        toggleX: x,
        toggleY: y
    });
}

function renderInPageToggle() {
    const id = "yt-shorts-hider-toggle";
    const existing = document.getElementById(id);

    if (!cached.showInPageToggle) {
        if (existing) existing.remove();
        return;
    }

    if (existing) {
        const mainBtn = existing.querySelector(".ytsh-main-toggle");
        if (mainBtn) {
            mainBtn.textContent = cached.enabled ? "Shorts: OFF" : "Shorts: ON";
        }
        return;
    }

    const panel = document.createElement("div");
    panel.id = id;
    panel.innerHTML = `
        <div class="ytsh-drag-handle" title="ドラッグして移動">⋮⋮</div>
        <button class="ytsh-main-toggle" type="button">${cached.enabled ? "Shorts: OFF" : "Shorts: ON"}</button>
        <button class="ytsh-close-toggle" type="button" title="このトグルを隠す">×</button>
    `;

    Object.assign(panel.style, {
        position: "fixed",
        zIndex: "999999",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 10px",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.18)",
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        backdropFilter: "blur(4px)",
        userSelect: "none",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    });

    const dragHandle = panel.querySelector(".ytsh-drag-handle");
    const mainBtn = panel.querySelector(".ytsh-main-toggle");
    const closeBtn = panel.querySelector(".ytsh-close-toggle");

    Object.assign(dragHandle.style, {
        cursor: "move",
        fontSize: "14px",
        lineHeight: "1",
        padding: "6px 4px",
        color: "#666"
    });

    Object.assign(mainBtn.style, {
        cursor: "pointer",
        border: "1px solid rgba(0,0,0,0.18)",
        borderRadius: "999px",
        background: "#fff",
        padding: "8px 12px",
        fontSize: "13px"
    });

    Object.assign(closeBtn.style, {
        cursor: "pointer",
        border: "1px solid rgba(0,0,0,0.18)",
        borderRadius: "999px",
        background: "#fff",
        width: "30px",
        height: "30px",
        fontSize: "16px",
        lineHeight: "1"
    });

    document.body.appendChild(panel);

    const { x, y } = getSavedTogglePosition();
    applyPanelPosition(panel, x, y);

    mainBtn.addEventListener("click", async () => {
        await chrome.storage.sync.set({ enabled: !cached.enabled });
    });

    closeBtn.addEventListener("click", async () => {
        await chrome.storage.sync.set({ showInPageToggle: false });
    });

    let dragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onMouseMove = (e) => {
        if (!dragging) return;

        const nextX = startLeft + (e.clientX - startMouseX);
        const nextY = startTop + (e.clientY - startMouseY);
        applyPanelPosition(panel, nextX, nextY);
    };

    const onMouseUp = async () => {
        if (!dragging) return;
        dragging = false;

        const left = parseInt(panel.style.left, 10) || 0;
        const top = parseInt(panel.style.top, 10) || 0;
        await savePanelPosition(left, top);

        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };

    dragHandle.addEventListener("mousedown", (e) => {
        dragging = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        startLeft = parseInt(panel.style.left, 10) || 0;
        startTop = parseInt(panel.style.top, 10) || 0;

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        e.preventDefault();
    });

    window.addEventListener("resize", () => {
        const left = parseInt(panel.style.left, 10) || 0;
        const top = parseInt(panel.style.top, 10) || 0;
        applyPanelPosition(panel, left, top);
    });
}

// -----------------------------
// 間引き実行
// -----------------------------
function scheduleRun() {
    if (scheduled) return;
    scheduled = true;

    setTimeout(() => {
        scheduled = false;

        if (location.href !== lastUrl) {
            lastUrl = location.href;
        }

        applyAll();
        renderInPageToggle();
    }, 250);
}

// -----------------------------
// 初期化
// -----------------------------
(async function init() {
    await loadSettings();

    applyAll();
    renderInPageToggle();

    const observer = new MutationObserver(() => {
        scheduleRun();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync") return;

        for (const [key, change] of Object.entries(changes)) {
            cached[key] = change.newValue;
        }

        applyAll();
        renderInPageToggle();
    });
})();