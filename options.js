const DEFAULTS = {
    enabled: true,
    blockShortsPage: true,
    hideShelves: true,
    hideSearchShorts: true,
    showInPageToggle: false,
    toggleX: null,
    toggleY: null
};

function $(id) {
    return document.getElementById(id);
}

async function load() {
    const data = await chrome.storage.sync.get(DEFAULTS);

    $("enabled").checked = data.enabled;
    $("blockShortsPage").checked = data.blockShortsPage;
    $("hideShelves").checked = data.hideShelves;
    $("hideSearchShorts").checked = data.hideSearchShorts;
    $("showInPageToggle").checked = data.showInPageToggle;
}

async function save() {
    await chrome.storage.sync.set({
        enabled: $("enabled").checked,
        blockShortsPage: $("blockShortsPage").checked,
        hideShelves: $("hideShelves").checked,
        hideSearchShorts: $("hideSearchShorts").checked,
        showInPageToggle: $("showInPageToggle").checked
    });
}

[
    "enabled",
    "blockShortsPage",
    "hideShelves",
    "hideSearchShorts",
    "showInPageToggle"
].forEach(id => {
    $(id).addEventListener("change", save);
});

load();