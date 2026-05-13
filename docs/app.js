const CONFIG = {
    MANIFEST_PATH: "./structure.json",
    WELCOME: "A centralized resource for spine imaging measurements."
};

const viewContainer = document.getElementById('view-container');
const breadcrumb = document.getElementById('breadcrumb');
const backBtn = document.getElementById('back-btn');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const brandRow = document.getElementById('brand-row');

let db = null;
let stateStack = [];
let searchIndex = [];

window.onpopstate = () => {
    if (stateStack.length > 0) {
        stateStack.pop();
        render();
    }
};

async function init() {
    try {
        const res = await fetch(CONFIG.MANIFEST_PATH);
        if (!res.ok) throw new Error("Could not fetch structure.json.");
        db = await res.json();
        buildSearchIndex(db);
        resetToHome();
    } catch (e) {
        viewContainer.innerHTML = `<div class="status-msg">Error: ${e.message}</div>`;
    }
}

function buildSearchIndex(data) {
    searchIndex = [];
    Object.keys(data).forEach(cat => {
        Object.keys(data[cat]).forEach(mod => {
            const gridData = data[cat][mod];
            if (gridData.content && gridData.content.length > 0) {
                gridData.content.forEach(item => { // Changed from itemName to item
                    searchIndex.push({
                        category: cat, modality: mod,
                        path: gridData.path, // This is the base path for the type (e.g., pages/resources/cervical/xray/)
                        name: item.name, // Use item.name
                        index: item.index, // Add item.index
                        thumbnail: item.thumbnail // Add item.thumbnail
                    });
                });
            }
        });
    });
}

function fuzzySearch(query) {
    if (!query) return [];
    const pattern = query.split('').map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*?');
    const regex = new RegExp(pattern, 'i');
    return searchIndex.filter(item => regex.test(item.name)); // Use item.name for search
}

searchInput.addEventListener('focus', () => brandRow.classList.add('search-active'));
searchInput.addEventListener('blur', () => {
    setTimeout(() => {
        brandRow.classList.remove('search-active');
        searchResults.style.display = 'none';
    }, 250);
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    displaySearchResults(fuzzySearch(query));
});

function displaySearchResults(matches) {
    searchResults.innerHTML = '';
    if (matches.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'search-item';
        empty.innerHTML = '<strong style="color: #94a3b8; text-align: center;">No results found</strong>';
        searchResults.appendChild(empty);
    } else {
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `<strong>${match.name}</strong><small>${match.category} &rsaquo; ${match.modality}</small>`; // Use match.name
            div.onclick = () => {
                searchResults.style.display = 'none';
                searchInput.value = '';
                loadSearchItem(match); // Pass the full match object
            };
            searchResults.appendChild(div);
        });
    }
    searchResults.style.display = 'block';
}

function resetToHome() {
    stateStack = [];
    render();
}

function goBack() { window.history.back(); }

function updateUI(titlePath) {
    breadcrumb.innerText = titlePath.length > 0 ? titlePath.join(' > ') : CONFIG.WELCOME;
    backBtn.style.display = stateStack.length > 0 ? 'block' : 'none';
    window.scrollTo(0, 0);
}

function getRelPath(p) {
    // Ensure path starts with ./ if it's relative, or just return if it's already absolute or correctly relative
    if (p.startsWith('./') || p.startsWith('/') || p.startsWith('http')) {
        return p;
    }
    return `./${p}`;
}

function render() {
    const current = stateStack[stateStack.length - 1];
    const titlePath = stateStack.map(s => s.label);
    viewContainer.innerHTML = '';
    
    if (current && (current.type === 'grid' || current.type === 'content')) {
        document.body.classList.add('no-bg');
    } else {
        document.body.classList.remove('no-bg');
    }

    if (stateStack.length === 0) {
        viewContainer.className = 'centered';
        const list = document.createElement('div');
        list.className = 'menu-list';
        Object.keys(db).forEach(cat => {
            const hasContent = Object.values(db[cat]).some(mod => mod.content && mod.content.length > 0);
            if (hasContent) {
                const btn = document.createElement('button');
                btn.className = 'menu-item';
                btn.innerText = cat;
                btn.onclick = () => {
                    stateStack.push({ type: 'category', label: cat, data: db[cat] });
                    history.pushState({ depth: stateStack.length }, cat);
                    render();
                };
                list.appendChild(btn);
            }
        });
        viewContainer.appendChild(list);
        updateUI([]);
    }
    else if (current.type === 'category') {
        viewContainer.className = 'centered';
        const list = document.createElement('div');
        list.className = 'menu-list';
        Object.keys(current.data).forEach(mod => {
            if (current.data[mod].content && current.data[mod].content.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'menu-item';
                btn.innerText = mod;
                btn.onclick = () => {
                    stateStack.push({ type: 'grid', label: mod, data: current.data[mod] });
                    history.pushState({ depth: stateStack.length }, mod);
                    render();
                };
                list.appendChild(btn);
            }
        });
        viewContainer.appendChild(list);
        updateUI(titlePath);
    }
    else if (current.type === 'grid') {
        viewContainer.className = '';
        // current.data.path is the base path for the type (e.g., pages/resources/cervical/xray/)
        current.data.content.forEach(item => { // Changed from itemName to item
            const card = document.createElement('div');
            card.className = 'item-card';
            // Use item.thumbnail and item.name
            const thumbnailUrl = item.thumbnail ? getRelPath(current.data.path + item.thumbnail) : '';
            card.innerHTML = `<img src="${thumbnailUrl}" onerror="this.style.display='none'"><div class="label">${item.name}</div>`;
            // Pass current.data.path as the basePath to loadItem
            card.onclick = () => loadItem(current.data.path, item);
            viewContainer.appendChild(card);
        });
        updateUI(titlePath);
    }
    else if (current.type === 'content') {
        viewContainer.className = '';
        viewContainer.innerHTML = `<div id="content-viewer" class="inline-html-content" style="display:block">${current.html}</div>`;
        updateUI(titlePath);
    }
}

async function loadItem(basePath, item) { // Modified to accept basePath and item object
    try {
        // item.index is relative to the type path (e.g., Angulation/index.html)
        // basePath is the base path for the type (e.g., resources/cervical/xray/)
        const fullIndexPath = getRelPath(basePath + item.index); // Construct full path to index.html using basePath
        const res = await fetch(fullIndexPath);
        let html = await res.text();

        // The itemFolder should be the directory containing the index.html
        // e.g., resources/cervical/xray/Angulation/
        const itemFolder = getRelPath(basePath + item.index.substring(0, item.index.lastIndexOf('/') + 1));

        // Adjust image paths within the fetched HTML
        html = html.replace(/src=["'](?:\.\/)?images\/(.*?)["']/g, (m, f) => `src="${itemFolder}images/${f}"`);

        // Ensure label is always a string
        const itemNameLabel = item.name ? String(item.name) : 'Unknown Item';
        stateStack.push({ type: 'content', label: itemNameLabel, html: html }); // Use itemNameLabel for label
        history.pushState({ depth: stateStack.length }, itemNameLabel); // Also for history title
        render();
    } catch (e) { alert("Document unavailable."); }
}

async function loadAbout() {
    try {
        const res = await fetch('about.html');
        if (!res.ok) throw new Error();
        let html = await res.text();
        
        // Reset the stack so About is treated as a primary view
        stateStack = [{ type: 'content', label: 'About', html: html }];
        
        // Use pushState to allow the hardware back button to return home
        history.pushState({ depth: stateStack.length }, 'About');
        render();
    } catch (e) {
        alert("About page unavailable.");
    }
}

async function loadSearchItem(match) {
    try {
        // match.index is relative to the type path (e.g., Angulation/index.html)
        // match.path is the base path for the type (e.g., pages/resources/cervical/xray/)
        const fullIndexPath = getRelPath(match.path + match.index); // Construct full path to index.html
        const res = await fetch(fullIndexPath);
        let html = await res.text();

        // The itemFolder should be the directory containing the index.html
        // e.g., pages/resources/cervical/xray/Angulation/
        const itemFolder = getRelPath(match.path + match.index.substring(0, match.index.lastIndexOf('/') + 1));

        // Adjust image paths within the fetched HTML
        html = html.replace(/src=["'](?:\.\/)?images\/(.*?)["']/g, (m, f) => `src="${itemFolder}images/${f}"`);

        // Ensure label is always a string
        const matchNameLabel = match.name ? String(match.name) : 'Unknown Item';
        stateStack = [
            { type: 'category', label: match.category, data: db[match.category] },
            { type: 'grid', label: match.modality, data: db[match.category][match.modality] },
            { type: 'content', label: matchNameLabel, html: html } // Use matchNameLabel for label
        ];
        render();
    } catch (e) { alert("Document unavailable."); }
}

init();
