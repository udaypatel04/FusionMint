
let currentActiveTemplateType = 'split-h-2';
let currentActiveTargetCellMaximumCount = 2;
let cellImageDataCache = {};
let selectedThemeValue = 'dark';
let targetedActiveTextDOMReference = null;
let targetCellClickSelectionIndex = null;

const collageTemplatesCatalog = [
    { id: "split-h-2", name: "Split Horizontal (2)", cells: 2, cols: 1, rows: 2 },
    { id: "split-v-2", name: "Split Vertical (2)", cells: 2, cols: 2, rows: 1 },
    { id: "classic-4", name: "Classic Grid (4)", cells: 4, cols: 2, rows: 2 },
    { id: "ig-story-3", name: "IG Story (3)", cells: 3, cols: 3, rows: 1 },
    { id: "yt-hero-3", name: "YouTube Hero (3)", cells: 3, cols: 1, rows: 3 },
    { id: "pinterest-3", name: "Pinterest Block (3)", cells: 3, cols: 2, rows: 2, special: "pinterest" },
    { id: "polaroid-1", name: "Polaroid Retro (1)", cells: 1, cols: 1, rows: 1 },
    { id: "trio-3", name: "Trio Collage (3)", cells: 3, cols: 2, rows: 2, special: "trio" },
    { id: "double-duo-4", name: "Double Duo (4)", cells: 4, cols: 4, rows: 1 },
    { id: "cinema-2", name: "Cinema Wide (2)", cells: 2, cols: 2, rows: 1 },
    { id: "insta-6", name: "Insta Grid (6)", cells: 6, cols: 3, rows: 2 },
    { id: "mosaic-9", name: "Mosaic Matrix (9)", cells: 9, cols: 3, rows: 3 }
];

const textStylesList = [
    { name: "Normal Text", class: "text-white text-sm tracking-normal font-normal" },
    { name: "Neon Cyan", class: "text-teal-400 font-extrabold drop-shadow-[0_0_6px_rgba(20,184,166,0.8)] tracking-tight text-base" },
    { name: "Vintage Serif", class: "text-amber-500 font-serif uppercase tracking-widest text-lg font-black" },
    { name: "Minimal Soft", class: "text-slate-300 font-light tracking-normal text-xs" },
    { name: "Futuristic Fusion", class: "text-fuchsia-500 font-mono tracking-tighter text-sm uppercase font-bold" }
];

const stickersList = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
    "🌈", "☀️", "🌙", "⭐", "🌟", "🔥", "💧", "🌊", "🌻", "🌹", "🌷", "🌱", "🌲", "🌳", "🌵", "🌸", "🌺", "🍀", "🍃",
    "🍎", "🍓", "🍍", "🍔", "🍕", "🌮", "🍦", "🍩", "🍪", "🎂", "🍿", "☕", "🍺", "🥂", "🍉", "🍒", "🍇", "🥨", "🍱", "🍣",
    "✨", "🚀", "💎", "🎨", "👾", "💡", "🎮", "🎧", "📸", "⚽", "🎸", "❤️", "💯", "✅", "🌀", "📍", "🚲", "✈️", "🎈", "🎉"
];

window.addEventListener('DOMContentLoaded', () => {
    initializeTemplatesMenuDeck();
    switchActiveTemplate('split-h-2', 2);
    setupCellExplicitInputTunnel();
});

function initializeTemplatesMenuDeck() {
    const container = document.getElementById('template-scroll-panel');
    container.innerHTML = '';
    collageTemplatesCatalog.forEach(t => {
        const btn = document.createElement('button');
        btn.id = `btn-tmpl-${t.id}`;
        btn.className = "template-btn w-full p-3 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl text-left transition-all cursor-pointer";
        btn.setAttribute('onclick', `switchActiveTemplate("${t.id}", ${t.cells})`);
        btn.innerHTML = `
            <p class="text-xs font-bold text-slate-200 transition-colors">${t.name}</p>
            <span class="text-[9px] font-mono text-slate-500 block mt-0.5">Layout // ${t.cells} Cells</span>
        `;
        container.appendChild(btn);
    });
}

function openStyleBox(mode) {
    const box = document.getElementById('style-assets-box');
    const grid = document.getElementById('style-box-grid');
    const title = document.getElementById('style-box-title');
    
    box.classList.remove('hidden');
    grid.innerHTML = '';

    if (mode === 'text') {
        title.innerText = "Select Font Style Preset";
        textStylesList.forEach((style, index) => {
            const btn = document.createElement('button');
            btn.className = "p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-center text-xs truncate transition-all cursor-pointer text-slate-200 font-semibold";
            btn.innerText = style.name;
            btn.setAttribute('onclick', `injectFloatingText("${index}")`);
            grid.appendChild(btn);
        });
    } else if (mode === 'sticker') {
        title.innerText = "Select Sticker Asset";
        stickersList.forEach(sticker => {
            const btn = document.createElement('button');
            btn.className = "p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-center text-lg transition-all cursor-pointer";
            btn.innerText = sticker;
            btn.setAttribute('onclick', `injectFloatingSticker("${sticker}")`);
            grid.appendChild(btn);
        });
    }
}

function closeStyleBox() {
    document.getElementById('style-assets-box').classList.add('hidden');
}

function selectActiveTextElement(domElement) {
    document.querySelectorAll('.floating-element').forEach(el => el.classList.remove('element-active'));
    targetedActiveTextDOMReference = domElement;
    domElement.classList.add('element-active');

    const textPanel = document.getElementById('text-edit-field-panel');
    const textarea = document.getElementById('live-text-textarea');
    
    textPanel.classList.remove('hidden');
    textarea.value = domElement.innerText;
    
    const rgbColor = domElement.style.color || "#ffffff";
    const hexColor = rgbToHexConverter(rgbColor);
    document.getElementById('live-text-color-picker').value = hexColor;
    document.getElementById('live-text-color-hex').value = hexColor.toUpperCase();

    syncDecorationButtonState('fontWeight', 'bold', 'toggle-bold-btn');
    syncDecorationButtonState('fontStyle', 'italic', 'toggle-italic-btn');
    syncDecorationButtonState('textDecoration', 'underline', 'toggle-underline-btn');

    textarea.focus();
}

function syncDecorationButtonState(cssProperty, activeValue, elementId) {
    const btn = document.getElementById(elementId);
    if (targetedActiveTextDOMReference && targetedActiveTextDOMReference.style[cssProperty] === activeValue) {
        btn.className = "py-1 text-xs font-bold text-center rounded bg-teal-500 text-slate-950 transition-colors cursor-pointer";
    } else {
        btn.className = "py-1 text-xs font-bold text-center rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer";
    }
}

function toggleStyleAttribute(cssProperty, activeValue, defaultValue, elementDOM) {
    if (!targetedActiveTextDOMReference) return;
    
    if (targetedActiveTextDOMReference.style[cssProperty] === activeValue) {
        targetedActiveTextDOMReference.style[cssProperty] = defaultValue;
        elementDOM.className = "py-1 text-xs font-bold text-center rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer";
    } else {
        targetedActiveTextDOMReference.style[cssProperty] = activeValue;
        elementDOM.className = "py-1 text-xs font-bold text-center rounded bg-teal-500 text-slate-950 transition-colors cursor-pointer";
    }
}

function rgbToHexConverter(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
    if (!match) return "#ffffff";
    return "#" + ("0" + parseInt(match[1],10).toString(16)).slice(-2) +
                    ("0" + parseInt(match[2],10).toString(16)).slice(-2) +
                    ("0" + parseInt(match[3],10).toString(16)).slice(-2);
}

function applyLiveTextColorTheme(colorHex) {
    if (targetedActiveTextDOMReference && colorHex.match(/^#[0-9A-F]{6}$/i)) {
        targetedActiveTextDOMReference.style.color = colorHex;
        document.getElementById('live-text-color-picker').value = colorHex;
        document.getElementById('live-text-color-hex').value = colorHex.toUpperCase();
    }
}

function setupCellExplicitInputTunnel() {
    const tunnel = document.getElementById('hidden-cell-file-input');
    tunnel.addEventListener('change', () => {
        if (tunnel.files.length === 0 || targetCellClickSelectionIndex === null) return;
        const targetFile = tunnel.files[0];
        const matchingDOMNode = document.querySelector(`[data-cell-index="${targetCellClickSelectionIndex}"]`);
        if (matchingDOMNode) {
            mountImageToCellTarget(targetFile, matchingDOMNode, targetCellClickSelectionIndex);
        }
        tunnel.value = ""; 
    });
}

function triggerCellSelectionContext(cellIndexValue) {
    targetCellClickSelectionIndex = parseInt(cellIndexValue);
    if (cellImageDataCache[targetCellClickSelectionIndex]) return; 
    document.getElementById('hidden-cell-file-input').click();
}

function synchronizeLiveTextStringValue(val) {
    if (targetedActiveTextDOMReference) {
        targetedActiveTextDOMReference.innerText = val;
    }
}

function switchActiveTemplate(templateKey, totalCells) {
    currentActiveTemplateType = templateKey;
    currentActiveTargetCellMaximumCount = totalCells;
    updateCellTrackCountIndicator();
    cellImageDataCache = {};

    const templateConfig = collageTemplatesCatalog.find(t => t.id === templateKey);
    const gridRoot = document.getElementById('collage-grid-root');
    
    gridRoot.removeAttribute('style');
    gridRoot.className = "w-full h-full gap-3 transition-all duration-300 grid";
    
    gridRoot.style.gridTemplateColumns = `repeat(${templateConfig.cols}, minmax(0, 1fr))`;
    gridRoot.style.gridTemplateRows = `repeat(${templateConfig.rows}, minmax(0, 1fr))`;
    gridRoot.innerHTML = '';

    for (let i = 0; i < totalCells; i++) {
        const cellNode = document.createElement('div');
        cellNode.className = "cell-wrapper relative bg-slate-900/30 border border-dashed border-slate-800 hover:border-teal-500/40 rounded-xl flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer";
        
        if (templateConfig.special === "pinterest" && i === 0) {
            cellNode.style.gridRow = "span 2";
        }
        if (templateConfig.special === "trio" && i === 2) {
            cellNode.style.gridColumn = "span 2";
        }

        cellNode.setAttribute('data-cell-index', i);
        cellNode.setAttribute('onclick', `triggerCellSelectionContext(${i})`);
        cellNode.setAttribute('ondrop', 'handleCellFileDrop(event)');
        cellNode.setAttribute('ondragover', 'allowDropTracking(event)');
        cellNode.innerHTML = `<span class="text-[10px] uppercase font-bold tracking-widest text-slate-600 group-hover:text-teal-400/70 transition-colors pointer-events-none"><i class="fa-solid fa-file-arrow-up mr-1"></i> Click / Drop Image</span>`;
        gridRoot.appendChild(cellNode);
    }

    applySpacingMetrics();
    updateTemplateButtonsHighlight(templateKey);
}

function allowDropTracking(e) {
    e.preventDefault();
}

function updateTemplateButtonsHighlight(activeKey) {
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.className = "template-btn w-full p-3 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl text-left transition-all cursor-pointer";
        btn.querySelector('p').className = "text-xs font-bold text-slate-200";
    });
    const targetedBtn = document.getElementById(`btn-tmpl-${activeKey}`);
    if (targetedBtn) {
        targetedBtn.className = "template-btn w-full p-3 border-2 border-teal-500/30 bg-teal-500/5 rounded-xl text-left transition-all cursor-pointer";
        targetedBtn.querySelector('p').className = "text-xs font-bold text-teal-400";
    }
}

function updateCellTrackCountIndicator() {
    const loadedCount = Object.keys(cellImageDataCache).length;
    document.getElementById('cell-count-tracker').innerText = `${loadedCount} / ${currentActiveTargetCellMaximumCount} Cells Loaded`;
}

function handleCellFileDrop(e) {
    e.preventDefault();
    const cellIndex = e.currentTarget.getAttribute('data-cell-index');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        mountImageToCellTarget(file, e.currentTarget, cellIndex);
    }
}

function mountImageToCellTarget(file, containerNode, index) {
    const reader = new FileReader();
    reader.onload = function(e) {
        cellImageDataCache[index] = e.target.result;
        containerNode.innerHTML = `
            <img src="${e.target.result}" class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none shadow-inner animate-fade-in" alt="Collage Asset">
            <button onclick="purgeCellImage(event, ${index})" class="absolute top-2 right-2 w-5 h-5 rounded-md bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-all flex items-center justify-center text-[10px] z-30 shadow cursor-pointer" title="Remove Image">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        updateCellTrackCountIndicator();
    }
    reader.readAsDataURL(file);
}

function purgeCellImage(event, index) {
    event.stopPropagation();
    delete cellImageDataCache[index];
    
    const cellNode = [...document.getElementById('collage-grid-root').children].find(cell => parseInt(cell.getAttribute('data-cell-index')) === index);
    if (cellNode) {
        cellNode.innerHTML = `<span class="text-[10px] uppercase font-bold tracking-widest text-slate-600 group-hover:text-teal-400/70 transition-colors pointer-events-none"><i class="fa-solid fa-file-arrow-up mr-1"></i> Click / Drop Image</span>`;
    }
    updateCellTrackCountIndicator();
}

function changeCanvasRatio(ratioStr) {
    const container = document.getElementById('collage-canvas-container');
    container.style.width = "100%";
    container.style.aspectRatio = ratioStr;

    document.querySelectorAll('.ratio-btn').forEach(b => {
        b.className = "ratio-btn py-1 text-[10px] font-bold text-center rounded text-slate-400 hover:text-slate-200 font-mono cursor-pointer";
    });
    const target = [...document.querySelectorAll('.ratio-btn')].find(b => b.getAttribute('onclick').includes(ratioStr));
    if (target) {
        target.className = "ratio-btn py-1 text-[10px] font-bold text-center rounded bg-teal-500 text-slate-950 font-mono cursor-pointer";
    }
}

function resetCanvasSizingMatrix() {
    const container = document.getElementById('collage-canvas-container');
    container.style.width = "100%";
    container.style.aspectRatio = "1/1";

    document.querySelectorAll('.ratio-btn').forEach((b, i) => {
        if (i === 0) b.className = "ratio-btn py-1 text-[10px] font-bold text-center rounded bg-teal-500 text-slate-950 font-mono cursor-pointer";
        else b.className = "ratio-btn py-1 text-[10px] font-bold text-center rounded text-slate-400 hover:text-slate-200 font-mono cursor-pointer";
    });
}

function applySpacingMetrics() {
    const gapVal = document.getElementById('slider-inner-gap').value;
    const borderVal = document.getElementById('slider-outer-border').value;
    const cornerVal = document.getElementById('slider-corner').value;

    document.getElementById('label-inner-gap').innerText = `${gapVal}%`;
    document.getElementById('label-outer-border').innerText = `${borderVal}%`;
    document.getElementById('label-corner').innerText = `${cornerVal}%`;

    const gridRoot = document.getElementById('collage-grid-root');
    gridRoot.style.gap = `${gapVal * 3}px`;

    const canvas = document.getElementById('collage-canvas-container');
    canvas.style.padding = `${borderVal * 3}px`;

    [...gridRoot.children].forEach(child => child.style.borderRadius = `${cornerVal * 1.5}px`);
}

function switchCanvasTheme(themeType) {
    selectedThemeValue = themeType;
    const canvas = document.getElementById('collage-canvas-container');
    canvas.className = "relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden border shadow-2xl p-4 transition-all duration-300";
    
    if (themeType === 'dark') { canvas.style.backgroundColor = "#0c1020"; canvas.classList.add('border-slate-800'); }
    else if (themeType === 'white') { canvas.style.backgroundColor = "#f8fafc"; canvas.classList.add('border-slate-200'); }
    else if (themeType === 'glass') { canvas.style.backgroundColor = "transparent"; canvas.classList.add('glass-theme'); }
}

function injectFloatingText(styleIndex = "0") {
    const canvas = document.getElementById('collage-canvas-container');
    const textNode = document.createElement('div');
    const targetStyle = textStylesList[parseInt(styleIndex)];

    textNode.className = `floating-element px-2 py-1 rounded border border-transparent shadow-md whitespace-nowrap focus:outline-none ${targetStyle.class}`;
    textNode.innerText = "Custom Text Layer";
    textNode.style.left = "40px";
    textNode.style.top = "40px";

    textNode.addEventListener('click', (e) => {
        e.stopPropagation();
        selectActiveTextElement(textNode);
    });

    setupFloatingElementDrag(textNode);
    canvas.appendChild(textNode);
    selectActiveTextElement(textNode);
}

function injectFloatingSticker(stickerChar = "✨") {
    const canvas = document.getElementById('collage-canvas-container');
    const stickerNode = document.createElement('div');
    stickerNode.className = "floating-element text-3xl select-none filter drop-shadow-md p-1 rounded";
    stickerNode.innerHTML = stickerChar;
    stickerNode.style.left = "80px";
    stickerNode.style.top = "80px";

    stickerNode.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.floating-element').forEach(el => el.classList.remove('element-active'));
        stickerNode.classList.add('element-active');
        document.getElementById('text-edit-field-panel').classList.add('hidden');
    });

    setupFloatingElementDrag(stickerNode);
    canvas.appendChild(stickerNode);
}

function setupFloatingElementDrag(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    el.addEventListener('mousedown', dragMouseDown);
    el.addEventListener('touchstart', dragMouseDown, { passive: false });

    function dragMouseDown(e) {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        pos3 = clientX;
        pos4 = clientY;
        
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('touchend', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('touchmove', elementDrag, { passive: false });
    }

    function elementDrag(e) {
        if (e.cancelable) e.preventDefault();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";

        const trashZone = document.getElementById('canvas-trash-zone');
        const trashRect = trashZone.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        if (elRect.bottom >= trashRect.top && elRect.top <= trashRect.bottom &&
            elRect.right >= trashRect.left && elRect.left <= trashRect.right) {
            trashZone.classList.add('trash-active');
            document.getElementById('trash-icon').className = "fa-solid fa-trash-can-open text-red-400 scale-110";
        } else {
            trashZone.classList.remove('trash-active');
            document.getElementById('trash-icon').className = "fa-solid fa-trash-can";
        }
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('touchmove', elementDrag);

        const trashZone = document.getElementById('canvas-trash-zone');
        const trashRect = trashZone.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        if (elRect.bottom >= trashRect.top && elRect.top <= trashRect.bottom &&
            elRect.right >= trashRect.left && elRect.left <= trashRect.right) {
            if (targetedActiveTextDOMReference === el) {
                document.getElementById('text-edit-field-panel').classList.add('hidden');
                targetedActiveTextDOMReference = null;
            }
            el.remove(); 
        }
        trashZone.classList.remove('trash-active');
        document.getElementById('trash-icon').className = "fa-solid fa-trash-can";
    }
}

document.getElementById('collage-canvas-container').addEventListener('click', () => {
    document.querySelectorAll('.floating-element').forEach(el => el.classList.remove('element-active'));
    document.getElementById('text-edit-field-panel').classList.add('hidden');
    targetedActiveTextDOMReference = null;
});

function resetWholeWorkspacePipeline() {
    cellImageDataCache = {};
    const gridRoot = document.getElementById('collage-grid-root');
    [...gridRoot.children].forEach(child => {
        child.innerHTML = `<span class="text-[10px] uppercase font-bold tracking-widest text-slate-600 pointer-events-none"><i class="fa-solid fa-file-arrow-up mr-1"></i> Click / Drop Image</span>`;
    });
    document.querySelectorAll('.floating-element').forEach(el => el.remove());
    updateCellTrackCountIndicator();
    document.getElementById('text-edit-field-panel').classList.add('hidden');
    closeStyleBox();
    resetCanvasSizingMatrix();
    targetedActiveTextDOMReference = null;
}

function updateProcessingOverlayStatus(text) {
    const statusLabel = document.getElementById('overlay-status-label');
    if (statusLabel) {
        statusLabel.innerText = text;
    }
}

function compileAndDownloadCollage() {
    if (Object.keys(cellImageDataCache).length === 0) {
        alert("Staging Failure: Collage is completely empty. Add images first.");
        return;
    }

    const canvasContainer = document.getElementById('collage-canvas-container');
    const gridRoot = document.getElementById('collage-grid-root');
    
    const exportWidth = 1200;
    const containerBounds = canvasContainer.getBoundingClientRect();
    const scaleFactor = exportWidth / containerBounds.width;
    const exportHeight = containerBounds.height * scaleFactor;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const ctx = exportCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (selectedThemeValue === 'white') {
        ctx.fillStyle = "#f8fafc";
    } else {
        ctx.fillStyle = "#0c1020"; 
    }
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    const cells = gridRoot.children;
    if (cells.length === 0) return;

    let imagesToLoad = [];
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const cellImg = cell.querySelector('img');
        if (cellImg) {
            imagesToLoad.push({
                imgSrc: cellImg.src,
                rect: cell.getBoundingClientRect()
            });
        } else {
            imagesToLoad.push({
                imgSrc: null,
                rect: cell.getBoundingClientRect()
            });
        }
    }

    const overlay = document.getElementById('matrix-processing-overlay');
    const statusLabel = document.getElementById('overlay-status-label');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    setTimeout(() => {
        let componentsLoaded = 0;
        const totalComponents = imagesToLoad.filter(item => item.imgSrc !== null).length;

        if (totalComponents === 0) {
            renderVectorLayersAndTriggerDownload();
        } else {
            imagesToLoad.forEach((item) => {
                if (item.imgSrc) {
                    const img = new Image();
                    img.onload = function() {
                        const drawX = (item.rect.left - containerBounds.left) * scaleFactor;
                        const drawY = (item.rect.top - containerBounds.top) * scaleFactor;
                        const drawW = item.rect.width * scaleFactor;
                        const drawH = item.rect.height * scaleFactor;
                        
                        const cornerRadiusVal = parseFloat(document.getElementById('slider-corner').value) * 1.5 * scaleFactor;
                        if (cornerRadiusVal > 0) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.moveTo(drawX + cornerRadiusVal, drawY);
                            ctx.lineTo(drawX + drawW - cornerRadiusVal, drawY);
                            ctx.quadraticCurveTo(drawX + drawW, drawY, drawX + drawW, drawY + cornerRadiusVal);
                            ctx.lineTo(drawX + drawW, drawY + drawH - cornerRadiusVal);
                            ctx.quadraticCurveTo(drawX + drawW, drawY + drawH, drawX + drawW - cornerRadiusVal, drawY + drawH);
                            ctx.lineTo(drawX + cornerRadiusVal, drawY + drawH);
                            ctx.quadraticCurveTo(drawX, drawY + drawH, drawX, drawY + drawH - cornerRadiusVal);
                            ctx.lineTo(drawX, drawY + cornerRadiusVal);
                            ctx.quadraticCurveTo(drawX, drawY, drawX + cornerRadiusVal, drawY);
                            ctx.closePath();
                            ctx.clip();
                        }

                        ctx.drawImage(img, drawX, drawY, drawW, drawH);
                        if (cornerRadiusVal > 0) ctx.restore();
                        
                        componentsLoaded++;
                        updateProcessingOverlayStatus(`Decoding image elements: (${componentsLoaded} / ${totalComponents})...`);
                        if (componentsLoaded === totalComponents) {
                            renderVectorLayersAndTriggerDownload();
                        }
                    };
                    img.src = item.imgSrc;
                } else {
                    const drawX = (item.rect.left - containerBounds.left) * scaleFactor;
                    const drawY = (item.rect.top - containerBounds.top) * scaleFactor;
                    const drawW = item.rect.width * scaleFactor;
                    const drawH = item.rect.height * scaleFactor;
                    ctx.fillStyle = selectedThemeValue === 'white' ? "rgba(226, 232, 240, 0.4)" : "rgba(15, 23, 42, 0.6)";
                    ctx.fillRect(drawX, drawY, drawW, drawH);
                }
            });
        }
    }, 300);

    function renderVectorLayersAndTriggerDownload() {
        statusLabel.innerText = "Stitching overlay vector styles...";
        const floatingLayers = canvasContainer.querySelectorAll('.floating-element');
        floatingLayers.forEach(layer => {
            const layerRect = layer.getBoundingClientRect();
            const x = (layerRect.left - containerBounds.left) * scaleFactor;
            const y = (layerRect.top - containerBounds.top) * scaleFactor;

            if (layer.classList.contains('text-3xl')) {
                ctx.font = `${Math.round(32 * scaleFactor)}px sans-serif`;
                ctx.textBaseline = "top";
                ctx.fillText(layer.innerText, x, y);
            } else {
                const computedStyle = window.getComputedStyle(layer);
                ctx.fillStyle = computedStyle.color || "#ffffff";
                
                let fontModifiers = "";
                if (layer.style.fontStyle === "italic") fontModifiers += "italic ";
                if (layer.style.fontWeight === "bold" || layer.classList.contains('font-extrabold') || layer.classList.contains('font-bold')) fontModifiers += "bold ";
                
                ctx.font = `${fontModifiers}${Math.round(14 * scaleFactor)}px 'Plus Jakarta Sans', sans-serif`;
                ctx.textBaseline = "top";
                ctx.fillText(layer.innerText, x, y);

                if (layer.style.textDecoration === "underline") {
                    const textMetrics = ctx.measureText(layer.innerText);
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.lineWidth = 2 * scaleFactor;
                    ctx.beginPath();
                    ctx.moveTo(x, y + (16 * scaleFactor));
                    ctx.lineTo(x + textMetrics.width, y + (16 * scaleFactor));
                    ctx.stroke();
                }
            }
        });

        statusLabel.innerText = "Encoding container file format package data...";
        const downloadFormatSelect = document.getElementById('download-format').value;
        let mimeType = "image/png";
        let fileExt = "png";

        if (downloadFormatSelect === 'jpg' || downloadFormatSelect === 'jpeg') {
            mimeType = "image/jpeg";
            fileExt = downloadFormatSelect;
        } else if (downloadFormatSelect === 'webp') {
            mimeType = "image/webp";
            fileExt = "webp";
        }

        const dataUrl = exportCanvas.toDataURL(mimeType, 0.95);
        const anchorNode = document.createElement('a');
        anchorNode.download = `fusionmint_collage_render.${fileExt}`;
        anchorNode.href = dataUrl;
        document.body.appendChild(anchorNode);
        anchorNode.click();
        document.body.removeChild(anchorNode);

        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}