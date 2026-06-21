
let uploadedStagedImagesCache = [];
let convertedImagesOutputCache = [];
let conversionPipelineIsReady = false;

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
        convertBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5";
    }

    if (conversionPipelineIsReady && convertedImagesOutputCache.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (convertedImagesOutputCache.length === 1) {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-arrow-down text-xs"></i> Download Converted Image`;
        } else {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download All Pages (.ZIP)`;
        }
    } else {
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[40px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        dlIconContainer.innerHTML = `<i class="fa-solid fa-cloud-arrow-down text-xs"></i> Download Converted Media`;
    }
}

async function loadImagesIntoMatrixPipeline(inputElement) {
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
                const lastDotIndex = file.name.lastIndexOf('.');
                uploadedStagedImagesCache.push({
                    name: lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name,
                    origExt: lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1).toLowerCase() : 'img',
                    type: file.type,
                    dataUrl: e.target.result
                });
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    renderStagedImagePreviews();
    
    document.getElementById('extraction-actions-deck').classList.remove('hidden');
    document.getElementById('extraction-actions-deck').classList.add('flex');
    
    inputElement.value = "";
    await hideProcessingOverlay();

    if (structuralBypassOccurred) {
        alert("Pipeline Alert: Animated asset configurations (.GIF) are unsupported in this engine topology and were scrubbed out of the staging layout automatically.");
    }

    evaluateActionsButtonStates();
}

function renderStagedImagePreviews() {
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    if (uploadedStagedImagesCache.length === 0) {
        purgeActiveConverterPipeline();
        return;
    }

    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        const cardIndex = idx + 1;
        const card = document.createElement('div');
        card.className = "page-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2 flex flex-col gap-2 relative animate-fade-in";
        card.innerHTML = `
            <div onclick="triggerLightboxModalViewport('${imgItem.dataUrl}', ${cardIndex})" class="relative w-full aspect-[1/1] bg-slate-950 rounded-xl overflow-hidden border border-slate-900 cursor-zoom-in" title="Click to view raw frame">
                <img src="${imgItem.dataUrl}" class="w-full h-full object-cover" alt="Source Item">
            </div>
            <div class="flex items-center justify-between px-1 py-0.5">
                <span class="text-[10px] font-mono font-bold text-teal-400 bg-slate-950 border border-slate-800/80 px-2.5 py-0.5 rounded max-w-[70%] truncate">${imgItem.name}.${imgItem.origExt}</span>
                <button onclick="removeImageFromPipelineStack(${idx})" class="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all flex items-center justify-center text-[10px] cursor-pointer" title="Remove image">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        gridRoot.appendChild(card);
    });
}

function removeImageFromPipelineStack(index) {
    uploadedStagedImagesCache.splice(index, 1);
    conversionPipelineIsReady = false;
    convertedImagesOutputCache = [];
    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    renderStagedImagePreviews();
    evaluateActionsButtonStates();
}

async function executeImageConversionProcess() {
    if (uploadedStagedImagesCache.length === 0) return;

    conversionPipelineIsReady = false;
    convertedImagesOutputCache = [];

    const targetMimeFormat = document.getElementById('target-image-format').value;
    showProcessingOverlay("Transcoding Layout Layers", "Remapping core pixels transforms execution...");

    setTimeout(async () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            for (let i = 0; i < uploadedStagedImagesCache.length; i++) {
                const asset = uploadedStagedImagesCache[i];
                updateProcessingOverlayStatus(`Transcoding element maps index (${i + 1} / ${uploadedStagedImagesCache.length})...`);

                const imageObj = new Image();
                imageObj.src = asset.dataUrl;
                
                await new Promise((resolve) => { imageObj.onload = resolve; });

                canvas.width = imageObj.width;
                canvas.height = imageObj.height;
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imageObj, 0, 0);

                const formattedOutputDataUrl = canvas.toDataURL(targetMimeFormat, 0.95);
                convertedImagesOutputCache.push({
                    name: asset.name,
                    origExt: asset.origExt,
                    dataUrl: formattedOutputDataUrl
                });
            }

            conversionPipelineIsReady = true;
        } catch(fatalError) {
            console.error(fatalError);
            alert("Pipeline Encoding Matrix Fault encountered during canvas pixel transforms execution.");
        } finally {
            await hideProcessingOverlay();
            evaluateActionsButtonStates();
        }
    }, 300);
}

async function downloadAllConvertedImages() {
    if (convertedImagesOutputCache.length === 0 || !conversionPipelineIsReady) return;

    const mainDlBtn = document.getElementById('download-btn');
    const iconContainer = document.getElementById('main-dl-icon-container');
    
    const targetMimeFormat = document.getElementById('target-image-format').value;
    const extensionExtensionMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/bmp': 'bmp'
    };
    const activeExt = extensionExtensionMap[targetMimeFormat];

    if (convertedImagesOutputCache.length === 1) {
        const singleAsset = convertedImagesOutputCache[0];
        const linkAnchorNode = document.createElement('a');
        linkAnchorNode.download = `${singleAsset.name}_${singleAsset.origExt}_to_${activeExt}.${activeExt}`;
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
        showProcessingOverlay("Packaging ZIP Container", "Writing compressed data allocations parameters structures...");

        setTimeout(async () => {
            try {
                const zip = new JSZip();

                convertedImagesOutputCache.forEach((item) => {
                    const rawBase64Data = item.dataUrl.split(',')[1];
                    zip.file(`${item.name}_${item.origExt}_to_${activeExt}.${activeExt}`, rawBase64Data, { base64: true });
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `fusionmint_bulk_package.zip`;
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
    document.getElementById('lightbox-index-badge').innerText = `Matrix Element Staged Track Map Frame // Item ${cardIndex}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.add('hidden');
    document.getElementById('lightbox-modal-window').classList.remove('flex');
}

function purgeActiveConverterPipeline() {
    uploadedStagedImagesCache = [];
    convertedImagesOutputCache = [];
    conversionPipelineIsReady = false;

    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';
    
    const emptyTemplateNode = document.createElement('div');
    emptyTemplateNode.id = "empty-raster-grid-state";
    emptyTemplateNode.className = "col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5 select-none";
    emptyTemplateNode.innerHTML = `
        <i class="fa-solid fa-photo-film text-2xl mb-1 text-slate-600"></i>
        <span class="text-xs font-medium">Staging compiler pipeline is empty. Mount files above.</span>
    `;
    gridRoot.appendChild(emptyTemplateNode);

    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    
    evaluateActionsButtonStates();
}