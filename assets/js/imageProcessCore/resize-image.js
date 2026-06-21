
let uploadedStagedImagesCache = [];
let resizedImagesOutputCache = [];
let conversionPipelineIsReady = false;
let activeResizerEngineMode = "pixels";

document.addEventListener('DOMContentLoaded', () => {
    hideProcessingOverlay();
});

function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling localized data payload structures...") {
    const overlay = document.getElementById('matrix-processing-overlay');
    document.getElementById('overlay-main-title').innerText = title;
    document.getElementById('overlay-status-label').innerText = subtitle;
    if (overlay) overlay.classList.add('active');
}

function updateProcessingOverlayStatus(text) {
    const statusLabel = document.getElementById('overlay-status-label');
    if (statusLabel) statusLabel.innerText = text;
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

    if (conversionPipelineIsReady && resizedImagesOutputCache.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (resizedImagesOutputCache.length === 1) {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-arrow-down text-xs"></i> Download Resized Image`;
        } else {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download Package (.ZIP)`;
        }
    } else {
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[44px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        dlIconContainer.innerHTML = `<i class="fa-solid fa-cloud-arrow-down text-xs"></i> Download Converted Media`;
    }
}

async function loadImagesIntoResizerMatrixPipeline(inputElement) {
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

        const reader = new FileReader();
        await new Promise((resolve) => {
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
                        aspectBaselineRatio: img.width / img.height
                    });
                    resolve();
                };
            };
            reader.readAsDataURL(file);
        });
    }

    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    
    if (uploadedStagedImagesCache.length > 0) {
        document.getElementById('num-resize-width').value = uploadedStagedImagesCache[0].nativeWidth;
        document.getElementById('num-resize-height').value = uploadedStagedImagesCache[0].nativeHeight;
    }

    document.getElementById('resizer-mode-deck').classList.replace('hidden', 'flex');
    document.getElementById('resizer-parameters-wrapper').classList.replace('hidden', 'flex');
    document.getElementById('extraction-actions-deck').classList.replace('hidden', 'flex');

    renderStagedImagePreviewGrid();
    inputElement.value = "";
    await hideProcessingOverlay();

    if (structuralBypassOccurred) {
        alert("Pipeline Alert: Animated asset configurations (.GIF) are unsupported in this engine topology and were scrubbed out of the staging layout automatically.");
    }

    evaluateActionsButtonStates();
}

function toggleResizerEngineMode(targetMode) {
    activeResizerEngineMode = targetMode;
    conversionPipelineIsReady = false;

    const btnPixels = document.getElementById('mode-btn-pixels');
    const btnPercent = document.getElementById('mode-btn-percentage');
    const panePixels = document.getElementById('pane-resizer-pixels');
    const panePercent = document.getElementById('pane-resizer-percentage');

    if (targetMode === 'pixels') {
        btnPixels.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer flex flex-col items-center gap-1 w-full";
        btnPercent.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex flex-col items-center gap-1 w-full";
        panePixels.classList.remove('hidden');
        panePercent.classList.add('hidden');
    } else {
        btnPercent.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer flex flex-col items-center gap-1 w-full";
        btnPixels.className = "py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex flex-col items-center gap-1 w-full";
        panePercent.classList.remove('hidden');
        panePixels.classList.add('hidden');
    }

    updateStagedCardsExpectedLabels();
    evaluateActionsButtonStates();
}

function resetAspectBaselineDimensions() {
    if (uploadedStagedImagesCache.length === 0) return;
    const maintainRatio = document.getElementById('chk-maintain-ratio').checked;
    if (maintainRatio) {
        handleDimensionInputLinkage('width');
    }
}

function handleDimensionInputLinkage(masterDimension) {
    if (uploadedStagedImagesCache.length === 0) return;
    const maintainRatio = document.getElementById('chk-maintain-ratio').checked;
    if (!maintainRatio) {
        updateStagedCardsExpectedLabels();
        return;
    }

    const baseRatio = uploadedStagedImagesCache[0].aspectBaselineRatio;
    const widthInput = document.getElementById('num-resize-width');
    const heightInput = document.getElementById('num-resize-height');

    if (masterDimension === 'width') {
        const wVal = parseInt(widthInput.value) || 0;
        heightInput.value = Math.max(1, Math.round(wVal / baseRatio));
    } else {
        const hVal = parseInt(heightInput.value) || 0;
        widthInput.value = Math.max(1, Math.round(hVal * baseRatio));
    }

    updateStagedCardsExpectedLabels();
}

function calculateTargetDimensionsForAsset(asset) {
    let targetWidth = asset.nativeWidth;
    let targetHeight = asset.nativeHeight;

    if (activeResizerEngineMode === 'pixels') {
        const globalW = parseInt(document.getElementById('num-resize-width').value) || asset.nativeWidth;
        const globalH = parseInt(document.getElementById('num-resize-height').value) || asset.nativeHeight;
        const maintainRatio = document.getElementById('chk-maintain-ratio').checked;
        const preventEnlarge = document.getElementById('chk-prevent-enlargement').checked;

        if (maintainRatio) {
            const scaleFactor = Math.min(globalW / asset.nativeWidth, globalH / asset.nativeHeight);
            targetWidth = Math.round(asset.nativeWidth * scaleFactor);
            targetHeight = Math.round(asset.nativeHeight * scaleFactor);
        } else {
            targetWidth = globalW;
            targetHeight = globalH;
        }

        if (preventEnlarge && (targetWidth > asset.nativeWidth || targetHeight > asset.nativeHeight)) {
            targetWidth = asset.nativeWidth;
            targetHeight = asset.nativeHeight;
        }
    } else {
        const percentage = parseFloat(document.getElementById('range-scale-percent').value) / 100.0;
        targetWidth = Math.round(asset.nativeWidth * percentage);
        targetHeight = Math.round(asset.nativeHeight * percentage);
    }

    return { w: Math.max(1, targetWidth), h: Math.max(1, targetHeight) };
}

function updateStagedCardsExpectedLabels() {
    uploadedStagedImagesCache.forEach((asset, idx) => {
        const dims = calculateTargetDimensionsForAsset(asset);
        const badge = document.getElementById(`dims-badge-tracker-${idx}`);
        if (badge) {
            badge.innerHTML = `<span class="whitespace-nowrap">${asset.nativeWidth}×${asset.nativeHeight}</span><i class="fa-solid fa-arrow-right mx-1 text-slate-700"></i><span class="text-teal-400 font-bold whitespace-nowrap">${dims.w}×${dims.h}</span>`;
        }
    });
}

function renderStagedImagePreviewGrid() {
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    if (uploadedStagedImagesCache.length === 0) {
        purgeActiveResizerPipeline();
        return;
    }

    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        const cardIndex = idx + 1;
        const card = document.createElement('div');
        card.className = "image-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2.5 flex flex-col gap-2 relative animate-fade-in";
        card.innerHTML = `
            <div onclick="triggerLightboxModalViewport('${imgItem.dataUrl}', ${cardIndex})" class="relative w-full aspect-[1/1] bg-slate-950 rounded-xl overflow-hidden border border-slate-900/60 flex items-center justify-center group/view cursor-zoom-in">
                <img src="${imgItem.dataUrl}" class="max-w-full max-h-full object-contain" alt="Staged Preview">
            </div>
            <div class="flex flex-col gap-1 px-1 py-0.5">
                <span class="text-[10px] font-mono font-bold text-slate-400 truncate w-full" title="${imgItem.name}.${imgItem.origExt}">${imgItem.name}.${imgItem.origExt}</span>
                <div class="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-950 gap-1 overflow-hidden">
                    <span id="dims-badge-tracker-${idx}" class="text-[9px] font-mono text-slate-500 flex items-center flex-wrap gap-0.5 overflow-hidden">
                    </span>
                    <button onclick="removeImageFromPipelineStack(${idx})" class="w-5 h-5 rounded bg-slate-950 hover:bg-red-950/40 border border-slate-850 hover:border-red-900/40 text-slate-500 hover:text-red-400 transition-all flex items-center justify-center text-[9px] cursor-pointer shrink-0">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        gridRoot.appendChild(card);
    });

    updateStagedCardsExpectedLabels();
}

function removeImageFromPipelineStack(index) {
    uploadedStagedImagesCache.splice(index, 1);
    conversionPipelineIsReady = false;
    resizedImagesOutputCache = [];
    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    renderStagedImagePreviewGrid();
    evaluateActionsButtonStates();
}

async function executeImageResizingBakeProcess() {
    if (uploadedStagedImagesCache.length === 0) return;

    conversionPipelineIsReady = false;
    resizedImagesOutputCache = [];

    showProcessingOverlay("Baking Geometric Transformations", "Executing structural pixels scaling algorithms...");

    setTimeout(async () => {
        try {
            for (let i = 0; i < uploadedStagedImagesCache.length; i++) {
                const asset = uploadedStagedImagesCache[i];
                updateProcessingOverlayStatus(`Scaling matrix boundaries data (${i + 1} / ${uploadedStagedImagesCache.length})...`);

                const imageObj = new Image();
                imageObj.src = asset.dataUrl;
                await new Promise((resolve) => { imageObj.onload = resolve; });

                const targetDims = calculateTargetDimensionsForAsset(asset);

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = targetDims.w;
                offscreenCanvas.height = targetDims.h;
                const ctx = offscreenCanvas.getContext('2d');

                ctx.drawImage(imageObj, 0, 0, targetDims.w, targetDims.h);

                const formattedDataUrl = offscreenCanvas.toDataURL(asset.type || 'image/png', 0.94);
                resizedImagesOutputCache.push({
                    name: asset.name,
                    ext: asset.origExt,
                    oldW: asset.nativeWidth,
                    oldH: asset.nativeHeight,
                    newW: targetDims.w,
                    newH: targetDims.h,
                    dataUrl: formattedDataUrl
                });
            }

            conversionPipelineIsReady = true;
            alert(`Successfully rendered geometry transforms for ${resizedImagesOutputCache.length} layers assets.`);
        } catch (fatalError) {
            console.error(fatalError);
            alert("Matrix Kernel Exception scaling vector constraints properties loops.");
        } finally {
            await hideProcessingOverlay();
            evaluateActionsButtonStates();
        }
    }, 300);
}

async function downloadAllProcessedImages() {
    if (resizedImagesOutputCache.length === 0 || !conversionPipelineIsReady) return;

    const mainDlBtn = document.getElementById('download-btn');
    const iconContainer = document.getElementById('main-dl-icon-container');

    if (resizedImagesOutputCache.length === 1) {
        const item = resizedImagesOutputCache[0];
        const structuredFilenameStr = `${item.name}_${item.oldW}x${item.oldH}_to_${item.newW}x${item.newH}.${item.ext}`;
        
        const linkAnchorNode = document.createElement('a');
        linkAnchorNode.download = structuredFilenameStr;
        linkAnchorNode.href = item.dataUrl; 
        document.body.appendChild(linkAnchorNode);
        linkAnchorNode.click();
        document.body.removeChild(linkAnchorNode);
        return;
    }

    if (mainDlBtn && iconContainer) {
        mainDlBtn.classList.add('scale-[0.97]');
        iconContainer.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin text-xs"></i> Compiling Archive...`;
    }

    setTimeout(() => {
        showProcessingOverlay("Packaging ZIP Container", "Writing compressed data allocations rules layout...");

        setTimeout(async () => {
            try {
                const zip = new JSZip();

                resizedImagesOutputCache.forEach((item) => {
                    const rawBase64Data = item.dataUrl.split(',')[1];
                    const structuredFilenameStr = `${item.name}_${item.oldW}x${item.oldH}_to_${item.newW}x${item.newH}.${item.ext}`;
                    zip.file(structuredFilenameStr, rawBase64Data, { base64: true });
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `fusionmint_resized_package.zip`;
                linkAnchorNode.href = URL.createObjectURL(zipBlob);
                document.body.appendChild(linkAnchorNode);
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);

            } catch(err) {
                console.error(err);
                alert("ZIP Package Stream Assembly Fault.");
            } finally {
                await hideProcessingOverlay();
                if (mainDlBtn && iconContainer) {
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
    document.getElementById('lightbox-index-badge').innerText = `Staged Matrix Aspect Snapshot View // Item ${cardIndex}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.add('hidden');
    document.getElementById('lightbox-modal-window').classList.remove('flex');
}

function purgeActiveResizerPipeline() {
    uploadedStagedImagesCache = [];
    resizedImagesOutputCache = [];
    conversionPipelineIsReady = false;

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

    document.getElementById('resizer-mode-deck').classList.add('hidden');
    document.getElementById('resizer-parameters-wrapper').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    
    evaluateActionsButtonStates();
}