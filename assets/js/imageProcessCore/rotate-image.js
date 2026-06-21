
let uploadedStagedImagesCache = [];
let rotatedImagesOutputCache = [];
let conversionPipelineIsReady = false;
let activeSelectionFilterMode = "all";

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
    const dlIconContainer = document.getElementById('main-dl-icon-container');

    if (uploadedStagedImagesCache.length > 0) {
        convertBtn.disabled = false;
        convertBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5";
    } else {
        convertBtn.disabled = true;
        convertBtn.className = "w-full min-h-[40px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-not-allowed";
    }

    if (conversionPipelineIsReady && rotatedImagesOutputCache.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (rotatedImagesOutputCache.length === 1) {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-arrow-down text-xs"></i> Download Rotated Image`;
        } else {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download Package (.ZIP)`;
        }
    } else {
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[40px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        dlIconContainer.innerHTML = `<i class="fa-solid fa-cloud-arrow-down text-xs"></i> Download Converted Media`;
    }
}

async function loadImagesIntoRotationMatrixPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    
    const fileList = Array.from(inputElement.files);
    const emptyPrompt = document.getElementById('empty-raster-grid-state');
    if (emptyPrompt) emptyPrompt.classList.add('hidden');

    showProcessingOverlay("Staging Image Assets", "Ingesting source binary files...");
    let structuralBypassOccurred = false;

    for (let file of fileList) {
        if (file.type === "image/gif" || file.name.toLowerCase().endsWith('.gif')) {
            structuralBypassOccurred = true;
            continue; 
        }

        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = function() {
                    const isPortrait = img.height >= img.width;
                    uploadedStagedImagesCache.push({
                        name: file.name.substring(0, file.name.lastIndexOf('.')),
                        origExt: file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase(),
                        type: file.type,
                        dataUrl: e.target.result,
                        currentRotationDegrees: 0,
                        orientation: isPortrait ? 'portrait' : 'landscape'
                    });
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    document.getElementById('macro-filter-deck').classList.replace('hidden', 'flex');
    document.getElementById('rotation-parameters-wrapper').classList.replace('hidden', 'flex');
    document.getElementById('extraction-actions-deck').classList.replace('hidden', 'flex');

    renderStagedImagePreviewGrid();
    inputElement.value = "";
    await hideProcessingOverlay();

    if (structuralBypassOccurred) {
        alert("Pipeline Alert: Animated asset configurations (.GIF) are unsupported in this engine topology and were scrubbed out of the staging layout automatically.");
    }

    evaluateActionsButtonStates();
}

function renderStagedImagePreviewGrid() {
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    if (uploadedStagedImagesCache.length === 0) {
        purgeActiveRotationPipeline();
        return;
    }

    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        if (activeSelectionFilterMode !== 'all' && imgItem.orientation !== activeSelectionFilterMode) {
            return;
        }

        const card = document.createElement('div');
        card.className = "image-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2.5 flex flex-col gap-2 relative";
        card.innerHTML = `
            <div class="relative w-full aspect-[1/1] bg-slate-950 rounded-xl overflow-hidden border border-slate-900/60 flex items-center justify-center group/view">
                <img id="preview-img-tag-${idx}" src="${imgItem.dataUrl}" style="transform: rotate(${imgItem.currentRotationDegrees}deg)" class="rotation-preview-frame max-w-full max-h-full object-contain" alt="Staged Map Frame">
                
                <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/view:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                    <button onclick="rotateIndividualPageCard(${idx}, -90)" class="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-teal-400 flex items-center justify-center cursor-pointer transition-colors" title="Rotate Left"><i class="fa-solid fa-reply"></i></button>
                    <button onclick="triggerIndividualLightboxModal(${idx})" class="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-teal-400 flex items-center justify-center cursor-pointer transition-colors" title="Zoom View"><i class="fa-solid fa-magnifying-glass"></i></button>
                    <button onclick="rotateIndividualPageCard(${idx}, 90)" class="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-teal-400 flex items-center justify-center cursor-pointer transition-colors" title="Rotate Right"><i class="fa-solid fa-share"></i></button>
                </div>
            </div>
            <div class="flex items-center justify-between px-1 py-0.5">
                <span class="text-[10px] font-mono font-bold text-slate-400 max-w-[60%] truncate" title="${imgItem.name}.${imgItem.origExt}">${imgItem.name}.${imgItem.origExt}</span>
                <div class="flex items-center gap-2">
                    <span class="text-[9px] font-mono font-bold text-teal-400 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-900/20">${imgItem.currentRotationDegrees}°</span>
                    <button onclick="removeImageFromPipelineStack(${idx})" class="w-5 h-5 rounded-md bg-slate-950 hover:bg-red-950/40 border border-slate-850 hover:border-red-900/40 text-slate-500 hover:text-red-400 transition-all flex items-center justify-center text-[9px] cursor-pointer">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        gridRoot.appendChild(card);
    });
}

function applySelectionFilter(filterType) {
    activeSelectionFilterMode = filterType;
    
    ['all', 'portrait', 'landscape'].forEach(type => {
        const btn = document.getElementById(`filter-btn-${type}`);
        if (type === filterType) {
            btn.className = "py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer text-center";
        } else {
            btn.className = "py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-center";
        }
    });

    renderStagedImagePreviewGrid();
}

function rotateIndividualPageCard(index, stepDegreesOffset) {
    conversionPipelineIsReady = false;
    let targetAngle = (uploadedStagedImagesCache[index].currentRotationDegrees + stepDegreesOffset) % 360;
    if (targetAngle < 0) targetAngle += 360;
    
    uploadedStagedImagesCache[index].currentRotationDegrees = targetAngle;
    
    const element = document.getElementById(`preview-img-tag-${index}`);
    if (element) {
        element.style.transform = `rotate(${targetAngle}deg)`;
    }
    
    const parentCard = element.closest('.image-raster-card');
    if (parentCard) {
        parentCard.querySelector('span.text-teal-400').innerText = `${targetAngle}°`;
    }
    evaluateActionsButtonStates();
}

function rotateFilteredBatchImages(stepDegreesOffset) {
    conversionPipelineIsReady = false;
    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        if (activeSelectionFilterMode === 'all' || imgItem.orientation === activeSelectionFilterMode) {
            let nextAngle = (imgItem.currentRotationDegrees + stepDegreesOffset) % 360;
            if (nextAngle < 0) nextAngle += 360;
            imgItem.currentRotationDegrees = nextAngle;
        }
    });
    renderStagedImagePreviewGrid();
    evaluateActionsButtonStates();
}

function removeImageFromPipelineStack(index) {
    uploadedStagedImagesCache.splice(index, 1);
    conversionPipelineIsReady = false;
    rotatedImagesOutputCache = [];
    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    renderStagedImagePreviewGrid();
    evaluateActionsButtonStates();
}

async function executeImageRotationBakeProcess() {
    if (uploadedStagedImagesCache.length === 0) return;

    conversionPipelineIsReady = false;
    rotatedImagesOutputCache = [];

    showProcessingOverlay("Baking Rotation Transformations", "Compiling high-fidelity codes layouts context parameters bounds...");

    setTimeout(async () => {
        try {
            for (let i = 0; i < uploadedStagedImagesCache.length; i++) {
                const asset = uploadedStagedImagesCache[i];
                updateProcessingOverlayStatus(`Processing transforms rotation sequence (${i + 1} / ${uploadedStagedImagesCache.length})...`);

                const imageObj = new Image();
                imageObj.src = asset.dataUrl;
                await new Promise((resolve) => { imageObj.onload = resolve; });

                const angleRadians = (asset.currentRotationDegrees * Math.PI) / 180;
                
                const useSwappedDimensions = asset.currentRotationDegrees === 90 || asset.currentRotationDegrees === 270;
                const canvasWidth = useSwappedDimensions ? imageObj.height : imageObj.width;
                const canvasHeight = useSwappedDimensions ? imageObj.width : imageObj.height;

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = canvasWidth;
                offscreenCanvas.height = canvasHeight;
                const ctx = offscreenCanvas.getContext('2d');

                ctx.translate(canvasWidth / 2, canvasHeight / 2);
                ctx.rotate(angleRadians);
                ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);

                const formattedDataUrl = offscreenCanvas.toDataURL(asset.type || 'image/png', 0.95);
                rotatedImagesOutputCache.push({
                    name: asset.name,
                    ext: asset.origExt,
                    dataUrl: formattedDataUrl
                });
            }

            conversionPipelineIsReady = true;
            alert(`Successfully rendered rotation translations for ${rotatedImagesOutputCache.length} graphic assets.`);
        } catch (fatalError) {
            console.error(fatalError);
            alert("Matrix Kernel Error processing multidirectional image bounds.");
        } finally {
            await hideProcessingOverlay();
            evaluateActionsButtonStates();
        }
    }, 300);
}

async function downloadAllProcessedImages() {
    if (rotatedImagesOutputCache.length === 0 || !conversionPipelineIsReady) return;

    const mainDlBtn = document.getElementById('download-btn');
    const iconContainer = document.getElementById('main-dl-icon-container');

    if (rotatedImagesOutputCache.length === 1) {
        const singleAsset = rotatedImagesOutputCache[0];
        const cleanOutputFilename = `${singleAsset.name}_rotated.${singleAsset.ext}`;
        
        const linkAnchorNode = document.createElement('a');
        linkAnchorNode.download = cleanOutputFilename;
        linkAnchorNode.href = singleAsset.dataUrl; 
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
        showProcessingOverlay("Packaging ZIP Container", "Writing compressed data blocks allocations rules...");

        setTimeout(async () => {
            try {
                const zip = new JSZip();

                rotatedImagesOutputCache.forEach((item) => {
                    const rawBase64Data = item.dataUrl.split(',')[1];
                    const cleanOutputFilename = `${item.name}_rotated.${item.ext}`;
                    zip.file(cleanOutputFilename, rawBase64Data, { base64: true });
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `fusionmint_rotated_images_package.zip`;
                linkAnchorNode.href = URL.createObjectURL(zipBlob);
                document.body.appendChild(linkAnchorNode);
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);

            } catch(err) {
                console.error(err);
                alert("ZIP Package Stream Assembly Fault.");
            } finally {
                hideProcessingOverlay();
                if (mainDlBtn && iconContainer) {
                    mainDlBtn.classList.remove('scale-[0.97]');
                    evaluateActionsButtonStates();
                }
            }
        }, 300);
    }, 400);
}

function triggerIndividualLightboxModal(index) {
    const asset = uploadedStagedImagesCache[index];
    const modal = document.getElementById('lightbox-modal-window');
    const imgNode = document.getElementById('lightbox-preview-node-img');
    
    imgNode.src = asset.dataUrl;
    imgNode.style.transform = `rotate(${asset.currentRotationDegrees}deg)`;
    
    document.getElementById('lightbox-index-badge').innerText = `Orientation Snapshot Track // Item ${index + 1}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.add('hidden');
    document.getElementById('lightbox-modal-window').classList.remove('flex');
}

function purgeActiveRotationPipeline() {
    uploadedStagedImagesCache = [];
    rotatedImagesOutputCache = [];
    conversionPipelineIsReady = false;
    activeSelectionFilterMode = "all";

    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';
    
    const emptyTemplateNode = document.createElement('div');
    emptyTemplateNode.id = "empty-raster-grid-state";
    emptyTemplateNode.className = "col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5 select-none";
    emptyTemplateNode.innerHTML = `
        <i class="fa-solid fa-compass-drafting text-2xl mb-1 text-slate-600"></i>
        <span class="text-xs font-medium">Staging orientation pipeline is empty. Mount files above.</span>
    `;
    gridRoot.appendChild(emptyTemplateNode);

    document.getElementById('macro-filter-deck').classList.add('hidden');
    document.getElementById('rotation-parameters-wrapper').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    
    evaluateActionsButtonStates();
}