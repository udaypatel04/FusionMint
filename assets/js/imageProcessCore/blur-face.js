
let uploadedStagedImagesCache = [];
let anonymizedImagesOutputCache = [];
let activeStagedFileIndex = 0;
let neuralBlazeFaceModelInstance = null;
let activeDetectionPhilosophyMode = "auto"; 
let faceModelConfidenceScoreThreshold = 0.60; 
let cachedDomImagesMap = {}; 

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await tf.setBackend('webgl');
        neuralBlazeFaceModelInstance = await blazeface.load();
        
        const fileInput = document.getElementById('image-file-input');
        fileInput.disabled = false;
        fileInput.classList.remove('cursor-not-allowed');
        
        document.getElementById('runtime-dot').className = "w-1.5 h-1.5 rounded-full bg-teal-400";
        document.getElementById('runtime-lbl').innerText = "Tensor Engine Ready";
        document.getElementById('dropzone-title').className = "text-sm font-bold text-slate-200";
        document.getElementById('dropzone-title').innerText = "Drag & Drop Image Files Here";
    } catch(e) {
        console.error(e);
        document.getElementById('runtime-lbl').innerText = "Engine Error";
    }
});

function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling localized data payload structures...", initialProgress = 0) {
    const overlay = document.getElementById('matrix-processing-overlay');
    const titleNode = document.getElementById('overlay-main-title');
    const statusLabel = document.getElementById('overlay-status-label');
    const barFill = document.getElementById('overlay-progress-bar-fill');
    const percentLabel = document.getElementById('overlay-progress-percent-lbl');
    const target = overlay.querySelector('.anim-target');
    
    if (overlay) {
        titleNode.innerText = title;
        statusLabel.innerText = subtitle;
        barFill.style.width = `${initialProgress}%`;
        percentLabel.innerText = `${Math.round(initialProgress)}%`;
        overlay.classList.add('active');
        if (target) {
            target.classList.remove('scale-90', 'scale-95');
            target.classList.add('scale-100');
        }
    }
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
    const previewBtn = document.getElementById('preview-btn');
    if (uploadedStagedImagesCache.length > 0) {
        convertBtn.disabled = false;
        previewBtn.disabled = false;
        convertBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5";
    } else {
        convertBtn.disabled = true;
        previewBtn.disabled = true;
        convertBtn.className = "w-full min-h-[44px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-not-allowed";
    }
}

async function loadImagesIntoBlurMatrixPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    
    const fileList = Array.from(inputElement.files);
    document.getElementById('empty-raster-grid-state').classList.add('hidden');

    showProcessingOverlay("Staging Image Assets", "Ingesting clean media file data blocks...", 10);

    const incrementChunkFactor = 90 / fileList.length;
    let currentStagedProgress = 10;

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type === "image/gif") continue;

        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = function() {
                    const runtimeUniqueId = 'node_' + Math.random().toString(36).substr(2, 9);
                    uploadedStagedImagesCache.push({
                        uid: runtimeUniqueId, name: file.name.substring(0, file.name.lastIndexOf('.')),
                        origExt: file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase(),
                        type: file.type, dataUrl: e.target.result,
                        autoDetectedBoxes: null, manualBoxes: []
                    });
                    cachedDomImagesMap[runtimeUniqueId] = img;
                    currentStagedProgress += incrementChunkFactor;
                    updateProcessingOverlayStatus(`Caching binary frames: ${i + 1} of ${fileList.length}`, currentStagedProgress);
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
        document.getElementById('blur-options-wrapper').classList.replace('hidden', 'flex');
        document.getElementById('extraction-actions-deck').classList.replace('hidden', 'flex');
        await switchActiveSandboxFileView(0);
        initializeCustomBlurZoneResizeGlobalTrackers();
    }

    renderStagedImagePreviewGrid();
    inputElement.value = "";
    await hideProcessingOverlay();
}

async function switchActiveSandboxFileView(index) {
    if (index < 0 || index >= uploadedStagedImagesCache.length) return;

    activeStagedFileIndex = index;
    const asset = uploadedStagedImagesCache[index];
    const imgElement = document.getElementById('sandbox-src-img-layer');
    imgElement.src = asset.dataUrl;

    await new Promise(resolve => imgElement.onload = resolve);

    if (!asset.autoDetectedBoxes) {
        const imgNode = cachedDomImagesMap[asset.uid];
        showProcessingOverlay("Executing Face Tracker Scan", "Extracting localized coordinate layers...", 30);
        const predictions = await neuralBlazeFaceModelInstance.estimateFaces(imgNode, false);
        asset.autoDetectedBoxes = [];

        predictions.forEach(face => {
            if (face.probability[0] >= faceModelConfidenceScoreThreshold) {
                const sX = face.topLeft[0]; const sY = face.topLeft[1];
                const eX = face.bottomRight[0]; const eY = face.bottomRight[1];

                asset.autoDetectedBoxes.push({
                    pctX: (sX / imgNode.width) * 100, pctY: (sY / imgNode.height) * 100,
                    pctW: ((eX - sX) / imgNode.width) * 100, pctH: ((eY - sY) / imgNode.height) * 100
                });
            }
        });
        updateProcessingOverlayStatus("Neural mapping completed...", 100);
        await hideProcessingOverlay();
    }

    renderLiveHUDOverlayInteractionTracks();
    highlightActiveFilmstripThumbnailCard();
    evaluateActionsButtonStates();
}

function renderLiveHUDOverlayInteractionTracks() {
    const hudLayer = document.getElementById('sandbox-overlay-hud-layer');
    hudLayer.innerHTML = '';

    const asset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (!asset) return;

    const targetedList = activeDetectionPhilosophyMode === 'auto' ? asset.autoDetectedBoxes : asset.manualBoxes;

    targetedList.forEach((box, index) => {
        const boxEl = document.createElement('div');
        boxEl.className = "interactive-blur-zone-anchor";
        boxEl.setAttribute('data-box-index', index);
        boxEl.style.left = `${box.pctX}%`; boxEl.style.top = `${box.pctY}%`;
        boxEl.style.width = `${box.pctW}%`; boxEl.style.height = `${box.pctH}%`;

        boxEl.innerHTML = `
            <div class="blur-corner-handle bhandle-tl" data-handle="tl"></div>
            <div class="blur-corner-handle bhandle-tr" data-handle="tr"></div>
            <div class="blur-corner-handle bhandle-bl" data-handle="bl"></div>
            <div class="blur-corner-handle bhandle-br" data-handle="br"></div>
        `;

        // Setup unified touch interaction paths smoothly maps metrics
        const setupResponsiveTouchTrigger = (targetElement, tokenType) => {
            targetElement.addEventListener('touchstart', (touchEvent) => {
                touchEvent.stopPropagation();
                window.globalActiveDragToken = tokenType;
                window.globalActiveBoxIndex = index;
                const t = touchEvent.touches[0];
                window.mStartTouchX = t.clientX; window.mStartTouchY = t.clientY;
                window.initBoxX = box.pctX; window.initBoxY = box.pctY;
                window.initBoxW = box.pctW; window.initBoxH = box.pctH;
            }, { passive: true });
        };

        setupResponsiveTouchTrigger(boxEl, 'move');
        boxEl.querySelectorAll('.blur-corner-handle').forEach(handle => {
            setupResponsiveTouchTrigger(handle, handle.getAttribute('data-handle'));
        });

        const removeBtn = document.createElement('div');
        removeBtn.className = "blur-removal-btn";
        removeBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        removeBtn.onclick = (e) => {
            e.stopPropagation(); targetedList.splice(index, 1);
            renderLiveHUDOverlayInteractionTracks();
        };

        boxEl.appendChild(removeBtn);
        hudLayer.appendChild(boxEl);
    });
}

function initializeCustomBlurZoneResizeGlobalTrackers() {
    const overlayContainer = document.getElementById('sandbox-overlay-hud-layer');
    let dragTargetToken = null, targetBoxDataRef = null, mStartX = 0, mStartY = 0, initialX = 0, initialY = 0, initialW = 0, initialH = 0;

    overlayContainer.addEventListener('mousedown', (e) => {
        const anchorNode = e.target.closest('.interactive-blur-zone-anchor');
        if (!anchorNode) return;

        const bIndex = parseInt(anchorNode.getAttribute('data-box-index'));
        const asset = uploadedStagedImagesCache[activeStagedFileIndex];
        const activeList = activeDetectionPhilosophyMode === 'auto' ? asset.autoDetectedBoxes : asset.manualBoxes;
        targetBoxDataRef = activeList[bIndex];

        mStartX = e.clientX; mStartY = e.clientY;
        initialX = targetBoxDataRef.pctX; initialY = targetBoxDataRef.pctY;
        initialW = targetBoxDataRef.pctW; initialH = targetBoxDataRef.pctH;

        if (e.target.classList.contains('blur-corner-handle')) {
            e.preventDefault(); e.stopPropagation();
            dragTargetToken = e.target.getAttribute('data-handle'); 
        } else if (e.target.classList.contains('interactive-blur-zone-anchor')) {
            e.preventDefault(); dragTargetToken = 'move';
        }
    });

    const synchronizeDragMutationCoordinates = (clientX, clientY) => {
        const activeToken = dragTargetToken || window.globalActiveDragToken;
        if (!activeToken) return;

        const asset = uploadedStagedImagesCache[activeStagedFileIndex];
        const activeList = activeDetectionPhilosophyMode === 'auto' ? asset.autoDetectedBoxes : asset.manualBoxes;
        const activeBox = targetBoxDataRef || activeList[window.globalActiveBoxIndex];
        if (!activeBox) return;

        const boundsRect = overlayContainer.getBoundingClientRect();
        const startX = dragTargetToken ? mStartX : window.mStartTouchX;
        const startY = dragTargetToken ? mStartY : window.mStartTouchY;
        const origX = dragTargetToken ? initialX : window.initBoxX;
        const origY = dragTargetToken ? initialY : window.initBoxY;
        const origW = dragTargetToken ? initialW : window.initBoxW;
        const origH = dragTargetToken ? initialH : window.initBoxH;

        const dXPct = ((clientX - startX) / boundsRect.width) * 100;
        const dYPct = ((clientY - startY) / boundsRect.height) * 100;

        if (activeToken === 'move') {
            activeBox.pctX = Math.min(100 - activeBox.pctW, Math.max(0, origX + dXPct));
            activeBox.pctY = Math.min(100 - activeBox.pctH, Math.max(0, origY + dYPct));
        } else if (activeToken === 'tl') {
            let nextX = Math.max(0, Math.min(origX + origW - 2, origX + dXPct));
            activeBox.pctW = origX + origW - nextX; activeBox.pctX = nextX;
            let nextY = Math.max(0, Math.min(origY + origH - 2, origY + dYPct));
            activeBox.pctH = origY + origH - nextY; activeBox.pctY = nextY;
        } else if (activeToken === 'tr') {
            activeBox.pctW = Math.min(100 - origX, Math.max(2, origW + dXPct));
            let nextY = Math.max(0, Math.min(origY + origH - 2, origY + dYPct));
            activeBox.pctH = origY + origH - nextY; activeBox.pctY = nextY;
        } else if (activeToken === 'bl') {
            let nextX = Math.max(0, Math.min(origX + origW - 2, origX + dXPct));
            activeBox.pctW = origX + origW - nextX; activeBox.pctX = nextX;
            activeBox.pctH = Math.min(100 - origY, Math.max(2, origH + dYPct));
        } else if (activeToken === 'br') {
            activeBox.pctW = Math.min(100 - origX, Math.max(2, origW + dXPct));
            activeBox.pctH = Math.min(100 - origY, Math.max(2, origH + dYPct));
        }

        const targetIndex = activeList.indexOf(activeBox);
        const anchorNode = overlayContainer.querySelector(`[data-box-index="${targetIndex}"]`);
        if(anchorNode) {
            anchorNode.style.left = `${activeBox.pctX}%`; anchorNode.style.top = `${activeBox.pctY}%`;
            anchorNode.style.width = `${activeBox.pctW}%`; anchorNode.style.height = `${activeBox.pctH}%`;
        }
    };

    window.addEventListener('mousemove', (e) => synchronizeDragMutationCoordinates(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if (!window.globalActiveDragToken) return;
        const t = e.touches[0];
        synchronizeDragMutationCoordinates(t.clientX, t.clientY);
    }, { passive: false });

    const releaseActiveResizersTokens = () => {
        dragTargetToken = null; targetBoxDataRef = null;
        window.globalActiveDragToken = null;
    };

    window.addEventListener('mouseup', releaseActiveResizersTokens);
    window.addEventListener('touchend', releaseActiveResizersTokens);
}

function injectManualBlurZoneElement() {
    const asset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (!asset) return;
    asset.manualBoxes.push({ pctX: 35, pctY: 35, pctW: 30, pctH: 30 });
    renderLiveHUDOverlayInteractionTracks();
}

function switchDetectionPhilosophy(targetPhilosophy) {
    activeDetectionPhilosophyMode = targetPhilosophy;
    const tabAuto = document.getElementById('tab-philosophy-auto');
    const tabCustom = document.getElementById('tab-philosophy-custom');
    const sensContainer = document.getElementById('sensitivity-threshold-container');
    const customContainer = document.getElementById('custom-action-trigger-container');

    if (targetPhilosophy === 'auto') {
        tabAuto.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-teal-500 text-slate-950 shadow-md flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer w-full text-center";
        tabCustom.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg text-slate-400 hover:text-white flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer w-full text-center";
        sensContainer.classList.replace('hidden', 'flex'); customContainer.classList.replace('flex', 'hidden');
    } else {
        tabCustom.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-teal-500 text-slate-950 shadow-md flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer w-full text-center";
        tabAuto.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg text-slate-400 hover:text-white flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer w-full text-center";
        customContainer.classList.replace('hidden', 'flex'); sensContainer.classList.replace('flex', 'hidden');
    }
    renderLiveHUDOverlayInteractionTracks();
}

async function adjustTensorDetectionThreshold(newScore, btnTokenId) {
    faceModelConfidenceScoreThreshold = newScore;
    ['recommended', 'low', 'high'].forEach(type => {
        const btn = document.getElementById(`threshold-btn-${type}`);
        if (type === btnTokenId) {
            btn.className = "w-full text-left px-3 py-2 text-[11px] font-bold uppercase border border-teal-500/30 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-between cursor-pointer transition-all";
            btn.innerHTML = `<span>${btn.querySelector('span').innerText}</span> <i class="fa-solid fa-circle-check text-xs"></i>`;
        } else {
            btn.className = "w-full text-left px-3 py-2 text-[11px] font-bold uppercase border border-slate-900 rounded-xl text-slate-400 hover:border-slate-800 flex items-center justify-between transition-all";
            btn.innerHTML = `<span>${btn.querySelector('span').innerText}</span>`;
        }
    });
    const asset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (asset) {
        asset.autoDetectedBoxes = null; await switchActiveSandboxFileView(activeStagedFileIndex);
    }
}

async function triggerAnonymizedPreviewModal() {
    const asset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (!asset) return;

    showProcessingOverlay("Generating Live Preview Canvas", "Rendering active blur box modifications...", 40);
    const dataUrl = await processBlurBakeForSingleAsset(asset);
    const modal = document.getElementById('lightbox-modal-window');
    
    document.getElementById('lightbox-preview-node-img').src = dataUrl;
    document.getElementById('lightbox-index-badge').innerText = `Live Anonymized Aspect Frame Frame // ${asset.name}.${asset.origExt}`;
    
    await hideProcessingOverlay();
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.add('hidden');
    document.getElementById('lightbox-modal-window').classList.remove('flex');
}

function renderStagedImagePreviewGrid() {
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    if (uploadedStagedImagesCache.length === 0) {
        purgeActiveBlurPipeline(); return;
    }

    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        const card = document.createElement('div');
        card.id = `filmstrip-card-${idx}`;
        card.className = "image-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col gap-2 relative animate-fade-in cursor-pointer p-2";
        card.onclick = () => switchActiveSandboxFileView(idx);
        card.innerHTML = `
            <div class="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-900/60 flex items-center justify-center">
                <img src="${imgItem.dataUrl}" class="w-full h-full object-cover" alt="Thumb">
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
    anonymizedImagesOutputCache = [];
    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    
    if (activeStagedFileIndex >= uploadedStagedImagesCache.length) {
        activeStagedFileIndex = Math.max(0, uploadedStagedImagesCache.length - 1);
    }
    
    if (uploadedStagedImagesCache.length > 0) {
        switchActiveSandboxFileView(activeStagedFileIndex); renderStagedImagePreviewGrid();
    } else {
        purgeActiveBlurPipeline();
    }
}

async function processBlurBakeForSingleAsset(asset) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgNode = cachedDomImagesMap[asset.uid];

    canvas.width = imgNode.width; canvas.height = imgNode.height;
    ctx.drawImage(imgNode, 0, 0);

    const activeBoxesList = activeDetectionPhilosophyMode === 'auto' ? asset.autoDetectedBoxes : asset.manualBoxes;

    if (activeBoxesList && activeBoxesList.length > 0) {
        activeBoxesList.forEach(box => {
            const realX = (box.pctX / 100.0) * canvas.width; const realY = (box.pctY / 100.0) * canvas.height;
            const realW = (box.pctW / 100.0) * canvas.width; const realH = (box.pctH / 100.0) * canvas.height;

            ctx.save(); ctx.beginPath(); ctx.rect(realX, realY, realW, realH); ctx.clip();
            ctx.filter = 'blur(24px)'; ctx.drawImage(canvas, 0, 0); ctx.restore();
        });
    }
    return canvas.toDataURL(asset.type || 'image/png', 0.95);
}

async function downloadAllProcessedImages() {
    if (uploadedStagedImagesCache.length === 0) return;

    showProcessingOverlay("Executing Anonymization Engine", "Burning box filters over facial clusters...", 0);
    anonymizedImagesOutputCache = [];
    
    try {
        for (let i = 0; i < uploadedStagedImagesCache.length; i++) {
            const asset = uploadedStagedImagesCache[i];
            const currentProgressPct = (i / uploadedStagedImagesCache.length) * 100;
            updateProcessingOverlayStatus(`Rendering filter masks: File ${i + 1} of ${uploadedStagedImagesCache.length}`, currentProgressPct);
            
            const bakedDataUrl = await processBlurBakeForSingleAsset(asset);
            anonymizedImagesOutputCache.push({ name: asset.name, ext: asset.origExt, dataUrl: bakedDataUrl });
        }
        updateProcessingOverlayStatus("All frames filtered successfully.", 100);
    } catch(err) {
        console.error(err); alert("Anonymization matrix failure.");
        await hideProcessingOverlay(); return;
    }

    await hideProcessingOverlay();

    if (anonymizedImagesOutputCache.length === 1) {
        const item = anonymizedImagesOutputCache[0];
        const cleanOutputFilename = `${item.name}_anonymized.${item.ext}`;
        const a = document.createElement('a'); a.download = cleanOutputFilename; a.href = item.dataUrl; 
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        return;
    }

    showProcessingOverlay("Packaging ZIP Container", "Writing compressed data streams parameters structures...", 20);
    setTimeout(async () => {
        try {
            const zip = new JSZip();
            anonymizedImagesOutputCache.forEach((item, idx) => zip.file(`${item.name}_anonymized_${idx + 1}.${item.ext}`, item.dataUrl.split(',')[1], { base64: true }));
            updateProcessingOverlayStatus("Generating archive link layer...", 70);
            const zipBlob = await zip.generateAsync({ type: "blob" });
            
            updateProcessingOverlayStatus("Triggering stream download...", 100);
            const a = document.createElement('a'); a.download = `fusionmint_anonymized_package.zip`; a.href = URL.createObjectURL(zipBlob);
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        } catch(err) {
            console.error(err); alert("ZIP Package Stream Assembly Fault.");
        } finally {
            await hideProcessingOverlay();
        }
    }, 300);
}

function purgeActiveBlurPipeline() {
    uploadedStagedImagesCache = []; anonymizedImagesOutputCache = []; cachedDomImagesMap = {};
    activeStagedFileIndex = 0; faceModelConfidenceScoreThreshold = 0.60;

    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';
    
    const emptyTemplateNode = document.createElement('div');
    emptyTemplateNode.id = "empty-raster-grid-state";
    emptyTemplateNode.className = "col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5 select-none";
    emptyTemplateNode.innerHTML = `
        <i class="fa-solid fa-shield-cat text-2xl mb-1 text-slate-600"></i>
        <span class="text-xs font-medium">Staging core pipeline is empty. Mount graphic paths above.</span>
    `;
    gridRoot.appendChild(emptyTemplateNode);

    const wrapper = document.getElementById('sandbox-container-wrapper');
    wrapper.classList.add('hidden'); wrapper.classList.remove('animate-hologram-in');

    document.getElementById('sandbox-empty-prompt').classList.remove('hidden');
    document.getElementById('blur-options-wrapper').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    
    switchDetectionPhilosophy('auto'); evaluateActionsButtonStates();
}