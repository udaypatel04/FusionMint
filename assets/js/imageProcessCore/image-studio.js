
let uploadedStagedImagesCache = [];
let compiledStudioOutputCache = [];
let conversionPipelineIsReady = false;
let activeStagedFileIndex = 0;
let cachedDomImagesMap = {};

document.addEventListener('DOMContentLoaded', () => {
    hideProcessingOverlay();
});

function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling localized data payload structures...", initialProgress = 0) {
    const overlay = document.getElementById('matrix-processing-overlay');
    document.getElementById('overlay-main-title').innerText = title;
    document.getElementById('overlay-status-label').innerText = subtitle;
    document.getElementById('overlay-progress-bar-fill').style.width = `${initialProgress}%`;
    document.getElementById('overlay-progress-percent-lbl').innerText = `${Math.round(initialProgress)}%`;
    if (overlay) overlay.classList.add('active');
}

function updateProcessingOverlayStatus(text, progressPercent = 0) {
    const statusLabel = document.getElementById('overlay-status-label');
    const barFill = document.getElementById('overlay-progress-bar-fill');
    const percentLabel = document.getElementById('overlay-progress-percent-lbl');
    
    if (statusLabel) statusLabel.innerText = text;
    if (barFill) barFill.style.width = `${progressPercent}%`;
    if (percentLabel) percentLabel.innerText = `${Math.round(progressPercent)}%`;
}

function hideProcessingOverlay() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('matrix-processing-overlay');
        if (overlay) overlay.classList.remove('active');
        resolve();
    });
}

function evaluateActionsButtonStates() {
    const convertBtn = document.getElementById('convert-btn');
    const downloadBtn = document.getElementById('download-btn');
    const dlIconContainer = document.getElementById('main-dl-icon-container');

    if (uploadedStagedImagesCache.length > 0) {
        convertBtn.disabled = false;
        convertBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5";
    } else {
        convertBtn.disabled = true;
        convertBtn.className = "w-full min-h-[44px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-not-allowed";
    }

    if (conversionPipelineIsReady && compiledStudioOutputCache.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (compiledStudioOutputCache.length === 1) {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-arrow-down text-xs"></i> Download Enhanced Image`;
        } else {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download Bundle Package (.ZIP)`;
        }
    } else {
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[44px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        dlIconContainer.innerHTML = `<i class="fa-solid fa-cloud-arrow-down text-xs"></i> Download Rendered Layouts`;
    }
}

async function loadImagesIntoStudioPipelineTrack(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    
    const fileList = Array.from(inputElement.files);
    document.getElementById('empty-raster-grid-state').classList.add('hidden');

    showProcessingOverlay("Staging File Elements", "Assembling layout binary parameters matrices...", 15);

    const chunkFactor = 85 / fileList.length;
    let currentTrackedProgress = 15;

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type === "image/gif") continue;

        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = function() {
                    const runtimeId = 'track_' + Math.random().toString(36).substr(2, 9);
                    uploadedStagedImagesCache.push({
                        uid: runtimeId, name: file.name.substring(0, file.name.lastIndexOf('.')),
                        origExt: file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase(),
                        type: file.type, dataUrl: e.target.result,
                        filterSettings: { bright: 100, contrast: 100, saturation: 100, blur: 0, hue: 0, grayscale: 0, sepia: 0, invert: 0, opacity: 100, warmth: 100 }
                    });
                    cachedDomImagesMap[runtimeId] = img;
                    currentTrackedProgress += chunkFactor;
                    updateProcessingOverlayStatus(`Caching layout structures: ${i + 1} / ${fileList.length}`, currentTrackedProgress);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    if (uploadedStagedImagesCache.length > 0) {
        document.getElementById('sandbox-empty-prompt').classList.add('hidden');
        document.getElementById('sandbox-container-wrapper').classList.remove('hidden');
        document.getElementById('editor-parameters-deck').classList.replace('hidden', 'flex');
        document.getElementById('extraction-actions-deck').classList.replace('hidden', 'flex');
        switchActiveSandboxFileView(0);
    }

    renderStagedImagePreviewGrid();
    inputElement.value = "";
    await hideProcessingOverlay();
}

function switchActiveSandboxFileView(index) {
    if (index < 0 || index >= uploadedStagedImagesCache.length) return;

    if(uploadedStagedImagesCache[activeStagedFileIndex]) {
        uploadedStagedImagesCache[activeStagedFileIndex].filterSettings = readCurrentSlidersStateBlockValues();
    }

    activeStagedFileIndex = index;
    const asset = uploadedStagedImagesCache[index];
    
    document.getElementById('range-bright').value = asset.filterSettings.bright;
    document.getElementById('range-contrast').value = asset.filterSettings.contrast;
    document.getElementById('range-saturation').value = asset.filterSettings.saturation;
    document.getElementById('range-blur').value = asset.filterSettings.blur;
    document.getElementById('range-hue').value = asset.filterSettings.hue;
    document.getElementById('range-grayscale').value = asset.filterSettings.grayscale;
    document.getElementById('range-sepia').value = asset.filterSettings.sepia;
    document.getElementById('range-invert').value = asset.filterSettings.invert;
    document.getElementById('range-opacity').value = asset.filterSettings.opacity;
    document.getElementById('range-warmth').value = asset.filterSettings.warmth;

    syncStudioCanvasRenderOutput();
    highlightActiveFilmstripThumbnailCard();
}

function readCurrentSlidersStateBlockValues() {
    return {
        bright: parseInt(document.getElementById('range-bright').value),
        contrast: parseInt(document.getElementById('range-contrast').value),
        saturation: parseInt(document.getElementById('range-saturation').value),
        blur: parseInt(document.getElementById('range-blur').value),
        hue: parseInt(document.getElementById('range-hue').value),
        grayscale: parseInt(document.getElementById('range-grayscale').value),
        sepia: parseInt(document.getElementById('range-sepia').value),
        invert: parseInt(document.getElementById('range-invert').value),
        opacity: parseInt(document.getElementById('range-opacity').value),
        warmth: parseInt(document.getElementById('range-warmth').value)
    };
}

function syncStudioCanvasRenderOutput() {
    const asset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (!asset) return;

    const imgNode = cachedDomImagesMap[asset.uid];
    const canvas = document.getElementById('studio-main-render-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = imgNode.width;
    canvas.height = imgNode.height;

    const s = readCurrentSlidersStateBlockValues();

    document.getElementById('lbl-bright').innerText = `${s.bright}%`;
    document.getElementById('lbl-contrast').innerText = `${s.contrast}%`;
    document.getElementById('lbl-saturation').innerText = `${s.saturation}%`;
    document.getElementById('lbl-blur').innerText = `${s.blur}px`;
    document.getElementById('lbl-hue').innerText = `${s.hue}°`;
    document.getElementById('lbl-grayscale').innerText = `${s.grayscale}%`;
    document.getElementById('lbl-sepia').innerText = `${s.sepia}%`;
    document.getElementById('lbl-invert').innerText = `${s.invert}%`;
    document.getElementById('lbl-opacity').innerText = `${s.opacity}%`;
    document.getElementById('lbl-warmth').innerText = `${s.warmth}%`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.filter = `
        brightness(${s.bright}%) contrast(${s.contrast}%) saturate(${s.saturation}%) 
        blur(${s.blur}px) hue-rotate(${s.hue}deg) grayscale(${s.grayscale}%)
        sepia(${s.sepia}%) invert(${s.invert}%) opacity(${s.opacity}%) saturate(${s.warmth}%)
    `;
    
    ctx.drawImage(imgNode, 0, 0);
    conversionPipelineIsReady = false;
    evaluateActionsButtonStates();
}

function injectPresetFiltersValues(br, co, sat, bl, hu, gr, se, inv, op, wa) {
    document.getElementById('range-bright').value = br;
    document.getElementById('range-contrast').value = co;
    document.getElementById('range-saturation').value = sat;
    document.getElementById('range-blur').value = bl;
    document.getElementById('range-hue').value = hu;
    document.getElementById('range-grayscale').value = gr;
    document.getElementById('range-sepia').value = se;
    document.getElementById('range-invert').value = inv;
    document.getElementById('range-opacity').value = op;
    document.getElementById('range-warmth').value = wa;
    syncStudioCanvasRenderOutput();
}

function renderStagedImagePreviewGrid() {
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    if (uploadedStagedImagesCache.length === 0) {
        purgeActiveStudioPipeline(); return;
    }

    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        const card = document.createElement('div');
        card.id = `filmstrip-card-${idx}`;
        card.className = "image-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2 flex flex-col gap-2 relative cursor-pointer";
        card.onclick = () => switchActiveSandboxFileView(idx);
        card.innerHTML = `
            <div class="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-900/60 flex items-center justify-center">
                <img src="${imgItem.dataUrl}" class="w-full h-full object-cover" alt="Thumb Track">
            </div>
            <div class="flex items-center justify-between px-1 py-0.5">
                <span class="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[75%]">${imgItem.name}.${imgItem.origExt}</span>
                <button onclick="event.stopPropagation(); removeImageFromPipelineStack(${idx})" class="w-5 h-5 rounded-md bg-slate-950 hover:bg-red-950/40 border border-slate-850 text-slate-500 hover:text-red-400 flex items-center justify-center text-[9px] cursor-pointer">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        gridRoot.appendChild(card);
    });
    highlightActiveFilmstripThumbnailCard();
}

function highlightActiveFilmstripThumbnailCard() {
    uploadedStagedImagesCache.forEach((_, idx) => {
        const card = document.getElementById(`filmstrip-card-${idx}`);
        if (!card) return;
        if (idx === activeStagedFileIndex) {
            card.className = "image-raster-card bg-teal-950/20 border border-teal-500/40 rounded-2xl overflow-hidden shadow-lg p-2 flex flex-col gap-2 relative scale-[0.99] shadow-md shadow-teal-500/10 cursor-pointer";
        } else {
            card.className = "image-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2 flex flex-col gap-2 relative cursor-pointer";
        }
    });
}

function removeImageFromPipelineStack(index) {
    const asset = uploadedStagedImagesCache[index];
    if(asset) delete cachedDomImagesMap[asset.uid];
    uploadedStagedImagesCache.splice(index, 1);
    conversionPipelineIsReady = false;
    compiledStudioOutputCache = [];
    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    
    if (activeStagedFileIndex >= uploadedStagedImagesCache.length) {
        activeStagedFileIndex = Math.max(0, uploadedStagedImagesCache.length - 1);
    }
    
    if (uploadedStagedImagesCache.length > 0) {
        switchActiveSandboxFileView(activeStagedFileIndex); renderStagedImagePreviewGrid();
    } else {
        purgeActiveStudioPipeline();
    }
}

async function processFilterRasterBakeForAsset(asset) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgNode = cachedDomImagesMap[asset.uid];

    canvas.width = imgNode.width; canvas.height = imgNode.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const f = asset.filterSettings;
    ctx.filter = `
        brightness(${f.bright}%) contrast(${f.contrast}%) saturate(${f.saturation}%) 
        blur(${f.blur}px) hue-rotate(${f.hue}deg) grayscale(${f.grayscale}%) 
        sepia(${f.sepia}%) invert(${f.invert}%) opacity(${f.opacity}%) saturate(${f.warmth}%)
    `;
    ctx.drawImage(imgNode, 0, 0);
    return canvas.toDataURL(asset.type || 'image/png', 0.95);
}

async function executeImageStudioRenderBake() {
    if (uploadedStagedImagesCache.length === 0) return;

    if(uploadedStagedImagesCache[activeStagedFileIndex]) {
        uploadedStagedImagesCache[activeStagedFileIndex].filterSettings = readCurrentSlidersStateBlockValues();
    }

    conversionPipelineIsReady = false; compiledStudioOutputCache = [];
    showProcessingOverlay("Executing Filter Processing Pipeline", "Baking enhancement calculations matrices parameters loops...", 0);

    try {
        for (let i = 0; i < uploadedStagedImagesCache.length; i++) {
            const asset = uploadedStagedImagesCache[i];
            const progress = (i / uploadedStagedImagesCache.length) * 100;
            updateProcessingOverlayStatus(`Rendering filter constraints layers: File ${i + 1} of ${uploadedStagedImagesCache.length}`, progress);
            
            const bakedDataUrl = await processFilterRasterBakeForAsset(asset);
            compiledStudioOutputCache.push({ name: asset.name, ext: asset.origExt, dataUrl: bakedDataUrl });
        }
        updateProcessingOverlayStatus("Render pass successful. Ready for localized serialization tracks.", 100);
        conversionPipelineIsReady = true;
    } catch(err) {
        console.error(err); alert("Error during filter layer baking execution.");
    } finally {
        await hideProcessingOverlay(); evaluateActionsButtonStates();
    }
}

async function downloadAllStudioProcessedImages() {
    if (compiledStudioOutputCache.length === 0 || !conversionPipelineIsReady) return;
    const mainDlBtn = document.getElementById('download-btn');

    if (compiledStudioOutputCache.length === 1) {
        const item = compiledStudioOutputCache[0];
        const linkAnchorNode = document.createElement('a');
        linkAnchorNode.download = `${item.name}_edited.${item.ext}`;
        linkAnchorNode.href = item.dataUrl; 
        document.body.appendChild(linkAnchorNode); linkAnchorNode.click();
        document.body.removeChild(linkAnchorNode); return;
    }

    if (mainDlBtn) mainDlBtn.classList.add('scale-[0.97]');
    showProcessingOverlay("Packaging ZIP Container", "Writing compressed data streams structures...", 20);
    
    setTimeout(async () => {
        try {
            const zip = new JSZip();
            compiledStudioOutputCache.forEach((item, idx) => zip.file(`${item.name}_edited_${idx + 1}.${item.ext}`, item.dataUrl.split(',')[1], { base64: true }));
            updateProcessingOverlayStatus("Generating archive link layer...", 70);
            const zipBlob = await zip.generateAsync({ type: "blob" });
            
            const linkAnchorNode = document.createElement('a');
            linkAnchorNode.download = `fusionmint_studio_bundle_package.zip`;
            linkAnchorNode.href = URL.createObjectURL(zipBlob);
            document.body.appendChild(linkAnchorNode); linkAnchorNode.click();
            document.body.removeChild(linkAnchorNode);
        } catch(err) {
            console.error(err); alert("ZIP Package Error.");
        } finally {
            await hideProcessingOverlay();
            if (mainDlBtn) mainDlBtn.classList.remove('scale-[0.97]');
            evaluateActionsButtonStates();
        }
    }, 300);
}

function purgeActiveStudioPipeline() {
    uploadedStagedImagesCache = []; compiledStudioOutputCache = []; cachedDomImagesMap = {};
    conversionPipelineIsReady = false; activeStagedFileIndex = 0;

    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';
    
    const emptyTemplateNode = document.createElement('div');
    emptyTemplateNode.id = "empty-raster-grid-state";
    emptyTemplateNode.className = "col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5 select-none";
    emptyTemplateNode.innerHTML = `
        <i class="fa-solid fa-photo-film text-2xl mb-1 text-slate-600"></i>
        <span class="text-xs font-medium">Staging core pipeline is empty. Mount files above.</span>
    `;
    gridRoot.appendChild(emptyTemplateNode);

    document.getElementById('sandbox-container-wrapper').classList.add('hidden');
    document.getElementById('sandbox-empty-prompt').classList.remove('hidden');
    document.getElementById('editor-parameters-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    evaluateActionsButtonStates();
}