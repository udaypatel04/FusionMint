
let uploadedStagedImagesCache = [];
let croppedImagesOutputCache = [];
let conversionPipelineIsReady = false;
let activeStagedFileIndex = 0;
let boxX = 10, boxY = 10, boxW = 80, boxH = 80; 

document.addEventListener('DOMContentLoaded', () => {
    hideProcessingOverlay();
});

function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling localized data payload structures...") {
    const overlay = document.getElementById('matrix-processing-overlay');
    document.getElementById('overlay-main-title').innerText = title;
    document.getElementById('overlay-status-label').innerText = subtitle;
    overlay.classList.add('active');
}

function updateProcessingOverlayStatus(text) {
    const statusLabel = document.getElementById('overlay-status-label');
    if (statusLabel) statusLabel.innerText = text;
}

function hideProcessingOverlay() {
    return new Promise((resolve) => {
        document.getElementById('matrix-processing-overlay').classList.remove('active');
        resolve();
    });
}

function evaluateActionsButtonStates() {
    const convertBtn = document.getElementById('convert-btn');
    const downloadBtn = document.getElementById('download-btn');

    if (uploadedStagedImagesCache.length > 0) {
        convertBtn.disabled = false;
        convertBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5";
    } else {
        convertBtn.disabled = true;
        convertBtn.className = "w-full min-h-[44px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-not-allowed";
    }

    if (conversionPipelineIsReady && croppedImagesOutputCache.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (croppedImagesOutputCache.length === 1) {
            downloadBtn.innerHTML = `<i class="fa-solid fa-file-arrow-down text-xs"></i> Download Cropped Image`;
        } else {
            downloadBtn.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download Package (.ZIP)`;
        }
    } else {
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[44px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        downloadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-down text-xs"></i> Download Converted Media`;
    }
}

async function loadImagesIntoCropMatrixPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    
    const fileList = Array.from(inputElement.files);
    const emptyPrompt = document.getElementById('empty-raster-grid-state');
    if (emptyPrompt) emptyPrompt.classList.add('hidden');

    showProcessingOverlay("Staging Image Assets", "Ingesting source layout structures...");
    let structuralBypassOccurred = false;

    for (let file of fileList) {
        if (file.type === "image/gif" || file.name.toLowerCase().endsWith('.gif')) {
            structuralBypassOccurred = true;
            continue; 
        }

        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const lastDotIndex = file.name.lastIndexOf('.');
                const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
                const originalExt = lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1).toLowerCase() : 'png';
                
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    uploadedStagedImagesCache.push({
                        name: baseName,
                        origExt: originalExt,
                        type: file.type,
                        dataUrl: e.target.result,
                        nativeWidth: img.width,
                        nativeHeight: img.height,
                        cropSettings: { x: 10, y: 10, w: 80, h: 80 }
                    });
                    resolve();
                };
            };
            reader.readAsDataURL(file);
        });
    }

    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    
    if (uploadedStagedImagesCache.length > 0) {
        document.getElementById('sandbox-empty-prompt').classList.add('hidden');
        document.getElementById('sandbox-container-wrapper').classList.remove('hidden');
        document.getElementById('crop-parameters-wrapper').classList.replace('hidden', 'grid');
        document.getElementById('extraction-actions-deck').classList.replace('hidden', 'flex');
        
        switchActiveSandboxFileView(0);
        initializeCropBoundingBoxDragListeners();
    }

    renderStagedImagePreviewGrid();
    inputElement.value = "";
    await hideProcessingOverlay();

    if (structuralBypassOccurred) {
        alert("Pipeline Alert: Animated asset configurations (.GIF) are unsupported in this engine topology and were scrubbed out of the staging layout automatically.");
    }

    evaluateActionsButtonStates();
}

function switchActiveSandboxFileView(index) {
    if (index < 0 || index >= uploadedStagedImagesCache.length) return;
    
    if (uploadedStagedImagesCache[activeStagedFileIndex]) {
        uploadedStagedImagesCache[activeStagedFileIndex].cropSettings = { x: boxX, y: boxY, w: boxW, h: boxH };
    }

    activeStagedFileIndex = index;
    const asset = uploadedStagedImagesCache[index];
    
    document.getElementById('sandbox-preview-img').src = asset.dataUrl;
    
    boxX = asset.cropSettings.x;
    boxY = asset.cropSettings.y;
    boxW = asset.cropSettings.w;
    boxH = asset.cropSettings.h;

    synchronizeCropBoxUIFromPercentages();
    highlightActiveFilmstripThumbnailCard();
}

function renderStagedImagePreviewGrid() {
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    if (uploadedStagedImagesCache.length === 0) {
        purgeActiveCropPipeline();
        return;
    }

    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        const card = document.createElement('div');
        card.id = `filmstrip-card-${idx}`;
        card.className = "image-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2 flex flex-col gap-2 relative cursor-pointer";
        card.onclick = () => switchActiveSandboxFileView(idx);
        card.innerHTML = `
            <div class="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-900/60 flex items-center justify-center">
                <img src="${imgItem.dataUrl}" class="w-full h-full object-cover" alt="Staged Preview">
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
    uploadedStagedImagesCache.splice(index, 1);
    conversionPipelineIsReady = false;
    croppedImagesOutputCache = [];
    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    
    if (activeStagedFileIndex >= uploadedStagedImagesCache.length) {
        activeStagedFileIndex = Math.max(0, uploadedStagedImagesCache.length - 1);
    }
    
    if (uploadedStagedImagesCache.length > 0) {
        switchActiveSandboxFileView(activeStagedFileIndex);
        renderStagedImagePreviewGrid();
    } else {
        purgeActiveCropPipeline();
    }
    evaluateActionsButtonStates();
}

function synchronizeCropBoxUIFromPercentages() {
    const currentAsset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (!currentAsset) return;

    const realX = Math.round((boxX / 100.0) * currentAsset.nativeWidth);
    const realY = Math.round((boxY / 100.0) * currentAsset.nativeHeight);
    const realW = Math.round((boxW / 100.0) * currentAsset.nativeWidth);
    const realH = Math.round((boxH / 100.0) * currentAsset.nativeHeight);

    document.getElementById('num-crop-x').value = realX;
    document.getElementById('num-crop-y').value = realY;
    document.getElementById('num-crop-width').value = realW;
    document.getElementById('num-crop-height').value = realH;

    const guide = document.getElementById('interactive-crop-box-guide');
    if (guide) {
        guide.style.top = `${boxY}%`;
        guide.style.left = `${boxX}%`;
        guide.style.width = `${boxW}%`;
        guide.style.height = `${boxH}%`;
    }
}

function handleManualCropInputOverride() {
    const currentAsset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (!currentAsset) return;

    const inputX = Math.max(0, Math.min(currentAsset.nativeWidth, parseInt(document.getElementById('num-crop-x').value) || 0));
    const inputY = Math.max(0, Math.min(currentAsset.nativeHeight, parseInt(document.getElementById('num-crop-y').value) || 0));
    const inputW = Math.max(1, Math.min(currentAsset.nativeWidth - inputX, parseInt(document.getElementById('num-crop-width').value) || 1));
    const inputH = Math.max(1, Math.min(currentAsset.nativeHeight - inputY, parseInt(document.getElementById('num-crop-height').value) || 1));

    boxX = (inputX / currentAsset.nativeWidth) * 100;
    boxY = (inputY / currentAsset.nativeHeight) * 100;
    boxW = (inputW / currentAsset.nativeWidth) * 100;
    boxH = (inputH / currentAsset.nativeHeight) * 100;

    synchronizeCropBoxUIFromPercentages();
    conversionPipelineIsReady = false;
    evaluateActionsButtonStates();
}

function initializeCropBoundingBoxDragListeners() {
    const container = document.getElementById('sandbox-container-wrapper');
    const guide = document.getElementById('interactive-crop-box-guide');
    let activeDragToken = null; 
    let startMouseX = 0, startMouseY = 0;
    let startBoxX = 0, startBoxY = 0, startBoxW = 0, startBoxH = 0;

    guide.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('crop-corner-handle')) return;
        e.preventDefault();
        activeDragToken = 'move';
        startMouseX = e.clientX; startMouseY = e.clientY;
        startBoxX = boxX; startBoxY = boxY;
    });

    // Universal event mapping handles touchscreen actions smoothly
    const bindTouchEvents = (element, tokenType) => {
        element.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            activeDragToken = tokenType;
            const touch = e.touches[0];
            startMouseX = touch.clientX; startMouseY = touch.clientY;
            startBoxX = boxX; startBoxY = boxY;
            startBoxW = boxW; startBoxH = boxH;
        }, { passive: true });
    };

    bindTouchEvents(guide, 'move');

    document.querySelectorAll('.crop-corner-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            activeDragToken = handle.id;
            startMouseX = e.clientX; startMouseY = e.clientY;
            startBoxX = boxX; startBoxY = boxY;
            startBoxW = boxW; startBoxH = boxH;
        });
        bindTouchEvents(handle, handle.id);
    });

    const handleMoveLogic = (clientX, clientY) => {
        if (!activeDragToken) return;
        const rect = container.getBoundingClientRect();
        const deltaXPercent = ((clientX - startMouseX) / rect.width) * 100;
        const deltaYPercent = ((clientY - startMouseY) / rect.height) * 100;

        if (activeDragToken === 'move') {
            boxX = Math.min(100 - boxW, Math.max(0, startBoxX + deltaXPercent));
            boxY = Math.min(100 - boxH, Math.max(0, startBoxY + deltaYPercent));
        } else if (activeDragToken === 'handle-tl') {
            let nextX = Math.max(0, Math.min(startBoxX + startBoxW - 1, startBoxX + deltaXPercent));
            boxW = startBoxX + startBoxW - nextX; boxX = nextX;
            let nextY = Math.max(0, Math.min(startBoxY + startBoxH - 1, startBoxY + deltaYPercent));
            boxH = startBoxY + startBoxH - nextY; boxY = nextY;
        } else if (activeDragToken === 'handle-tr') {
            boxW = Math.min(100 - boxX, Math.max(1, startBoxW + deltaXPercent));
            let nextY = Math.max(0, Math.min(startBoxY + startBoxH - 1, startBoxY + deltaYPercent));
            boxH = startBoxY + startBoxH - nextY; boxY = nextY;
        } else if (activeDragToken === 'handle-bl') {
            let nextX = Math.max(0, Math.min(startBoxX + startBoxW - 1, startBoxX + deltaXPercent));
            boxW = startBoxX + startBoxW - nextX; boxX = nextX;
            boxH = Math.min(100 - boxY, Math.max(1, startBoxH + deltaYPercent));
        } else if (activeDragToken === 'handle-br') {
            boxW = Math.min(100 - boxX, Math.max(1, startBoxW + deltaXPercent));
            boxH = Math.min(100 - boxY, Math.max(1, startBoxH + deltaYPercent));
        }

        synchronizeCropBoxUIFromPercentages();
        conversionPipelineIsReady = false;
        evaluateActionsButtonStates();
    };

    window.addEventListener('mousemove', (e) => handleMoveLogic(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if (!activeDragToken) return;
        const touch = e.touches[0];
        handleMoveLogic(touch.clientX, touch.clientY);
    }, { passive: false });

    const handleReleaseLogic = () => {
        if (activeDragToken) {
            activeDragToken = null;
            if (uploadedStagedImagesCache[activeStagedFileIndex]) {
                uploadedStagedImagesCache[activeStagedFileIndex].cropSettings = { x: boxX, y: boxY, w: boxW, h: boxH };
            }
        }
    };

    window.addEventListener('mouseup', handleReleaseLogic);
    window.addEventListener('touchend', handleReleaseLogic);
}

async function executeImageCroppingBakeProcess() {
    if (uploadedStagedImagesCache.length === 0) return;

    conversionPipelineIsReady = false;
    croppedImagesOutputCache = [];

    showProcessingOverlay("Baking Selection Matrices", "Executing absolute point bounding coordinates extractions...");

    setTimeout(async () => {
        try {
            if (uploadedStagedImagesCache[activeStagedFileIndex]) {
                uploadedStagedImagesCache[activeStagedFileIndex].cropSettings = { x: boxX, y: boxY, w: boxW, h: boxH };
            }

            for (let i = 0; i < uploadedStagedImagesCache.length; i++) {
                const asset = uploadedStagedImagesCache[i];
                updateProcessingOverlayStatus(`Trimming canvas layer coordinates boundary (${i + 1} / ${uploadedStagedImagesCache.length})...`);

                const imageObj = new Image();
                imageObj.src = asset.dataUrl;
                await new Promise((resolve) => { imageObj.onload = resolve; });

                const extX = (asset.cropSettings.x / 100.0) * asset.nativeWidth;
                const extY = (asset.cropSettings.y / 100.0) * asset.nativeHeight;
                const extW = (asset.cropSettings.w / 100.0) * asset.nativeWidth;
                const extH = (asset.cropSettings.h / 100.0) * asset.nativeHeight;

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = Math.max(1, Math.round(extW));
                offscreenCanvas.height = Math.max(1, Math.round(extH));
                const ctx = offscreenCanvas.getContext('2d');

                ctx.drawImage(
                    imageObj, 
                    Math.round(extX), Math.round(extY), Math.round(extW), Math.round(extH), 
                    0, 0, offscreenCanvas.width, offscreenCanvas.height
                );

                const formattedDataUrl = offscreenCanvas.toDataURL(asset.type || 'image/png', 0.95);
                croppedImagesOutputCache.push({
                    name: asset.name,
                    ext: asset.origExt,
                    oldW: asset.nativeWidth,
                    oldH: asset.nativeHeight,
                    newW: offscreenCanvas.width,
                    newH: offscreenCanvas.height,
                    dataUrl: formattedDataUrl
                });
            }

            conversionPipelineIsReady = true;
            alert(`Successfully rendered crop boundaries for ${croppedImagesOutputCache.length} layers assets.`);
        } catch (fatalError) {
            console.error(fatalError);
            alert("Matrix Operations Fault rendering edge point extractions contexts.");
        } finally {
            await hideProcessingOverlay();
            evaluateActionsButtonStates();
        }
    }, 300);
}

async function downloadAllProcessedImages() {
    if (croppedImagesOutputCache.length === 0 || !conversionPipelineIsReady) return;

    const mainDlBtn = document.getElementById('download-btn');

    if (croppedImagesOutputCache.length === 1) {
        const item = croppedImagesOutputCache[0];
        const structuredFilenameStr = `${item.name}_${item.oldW}x${item.oldH}_cropped_to_${item.newW}x${item.newH}.${item.ext}`;
        
        const linkAnchorNode = document.createElement('a');
        linkAnchorNode.download = structuredFilenameStr;
        linkAnchorNode.href = item.dataUrl; 
        document.body.appendChild(linkAnchorNode);
        linkAnchorNode.click();
        document.body.removeChild(linkAnchorNode);
        return;
    }

    if (mainDlBtn) {
        mainDlBtn.classList.add('scale-[0.97]');
    }

    setTimeout(() => {
        showProcessingOverlay("Packaging ZIP Container", "Writing compressed data allocations parameter structures lists...");

        setTimeout(async () => {
            try {
                const zip = new JSZip();

                croppedImagesOutputCache.forEach((item) => {
                    const rawBase64Data = item.dataUrl.split(',')[1];
                    const structuredFilenameStr = `${item.name}_${item.oldW}x${item.oldH}_cropped_to_${item.newW}x${item.newH}.${item.ext}`;
                    zip.file(structuredFilenameStr, rawBase64Data, { base64: true });
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `fusionmint_cropped_images_package.zip`;
                linkAnchorNode.href = URL.createObjectURL(zipBlob);
                document.body.appendChild(linkAnchorNode);
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);

            } catch(err) {
                console.error(err);
                alert("ZIP Package Stream Assembly Fault.");
            } finally {
                await hideProcessingOverlay();
                if (mainDlBtn) {
                    mainDlBtn.classList.remove('scale-[0.97]');
                    evaluateActionsButtonStates();
                }
            }
        }, 300);
    }, 400);
}

function triggerLightboxModalViewport(imageSrcData, cardIndex) {
    const modal = document.getElementById('lightbox-modal-window');
    document.getElementById('lightbox-preview-node-img').src = imageSrcData;
    document.getElementById('lightbox-index-badge').innerText = `Staged Matrix Edge Boundaries View // Item ${cardIndex}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.add('hidden');
    document.getElementById('lightbox-modal-window').classList.remove('flex');
}

function purgeActiveCropPipeline() {
    uploadedStagedImagesCache = [];
    croppedImagesOutputCache = [];
    conversionPipelineIsReady = false;
    activeStagedFileIndex = 0;
    boxX = 10; boxY = 10; boxW = 80; boxH = 80;

    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';
    
    const emptyTemplateNode = document.createElement('div');
    emptyTemplateNode.id = "empty-raster-grid-state";
    emptyTemplateNode.className = "col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5 select-none";
    emptyTemplateNode.innerHTML = `
        <i class="fa-solid fa-compress text-2xl mb-1 text-slate-600"></i>
        <span class="text-xs font-medium">Staging resizer pipeline is empty. Mount graphics assets above.</span>
    `;
    gridRoot.appendChild(emptyTemplateNode);

    document.getElementById('sandbox-container-wrapper').classList.add('hidden');
    document.getElementById('sandbox-empty-prompt').classList.remove('hidden');
    document.getElementById('crop-parameters-wrapper').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    
    evaluateActionsButtonStates();
}