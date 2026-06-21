
let uploadedStagedImagesCache = [];
let compiledMemesOutputCache = [];
let conversionPipelineIsReady = false;
let activeStagedFileIndex = 0;
let imageObjectsDomMap = {}; 
let activeTextHorizontalAlignment = "center"; 

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

    if (conversionPipelineIsReady && compiledMemesOutputCache.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (compiledMemesOutputCache.length === 1) {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-arrow-down text-xs"></i> Download Meme Image`;
        } else {
            dlIconContainer.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download Package (.ZIP)`;
        }
    } else {
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[44px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        dlIconContainer.innerHTML = `<i class="fa-solid fa-cloud-arrow-down text-xs"></i> Download Converted Media`;
    }
}

async function loadImagesIntoMemeMatrixPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    
    const fileList = Array.from(inputElement.files);
    const emptyPrompt = document.getElementById('empty-raster-grid-state');

    if (emptyPrompt) emptyPrompt.classList.add('hidden');

    showProcessingOverlay("Staging Image Blueprints", "Ingesting clean media file data blocks...");

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
                    const uniqueFileId = Date.now() + Math.random().toString(36).substr(2, 5);
                    uploadedStagedImagesCache.push({
                        id: uniqueFileId,
                        name: baseName,
                        origExt: originalExt,
                        type: file.type,
                        dataUrl: e.target.result
                    });
                    imageObjectsDomMap[uniqueFileId] = img;
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
        document.getElementById('meme-parameters-wrapper').classList.replace('hidden', 'flex');
        document.getElementById('extraction-actions-deck').classList.replace('hidden', 'flex');
        
        switchActiveSandboxFileView(0);
    }

    renderStagedImagePreviewGrid();
    inputElement.value = "";
    await hideProcessingOverlay();

    if (structuralBypassOccurred) {
        alert("Pipeline Restriction: Animation format tracking configurations (.GIF) are rejected inside this static studio tool workspace.");
    }

    evaluateActionsButtonStates();
}

function switchActiveSandboxFileView(index) {
    if (index < 0 || index >= uploadedStagedImagesCache.length) return;

    activeStagedFileIndex = index;
    syncRealtimeMemeCanvasOutput();
    highlightActiveFilmstripThumbnailCard();
}

function updateTextAlignmentVector(alignmentMode) {
    activeTextHorizontalAlignment = alignmentMode;

    ['left', 'center', 'right'].forEach(type => {
        const btn = document.getElementById(`align-btn-${type}`);
        if (type === alignmentMode) {
            btn.className = "py-1 text-[10px] font-bold uppercase rounded bg-teal-500 text-slate-950 transition-colors cursor-pointer text-center flex-1";
        } else {
            btn.className = "py-1 text-[10px] font-bold uppercase rounded text-slate-400 hover:text-white transition-colors cursor-pointer text-center flex-1";
        }
    });

    syncRealtimeMemeCanvasOutput();
}

function drawMemeCaptionTextOnContext(ctx, text, canvasWidth, y, fontHeight, strokeWidth) {
    ctx.font = `bold ${fontHeight}px Impact, Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.textAlign = activeTextHorizontalAlignment;

    let targetX = canvasWidth / 2; 
    if (activeTextHorizontalAlignment === "left") {
        targetX = canvasWidth * 0.05; 
    } else if (activeTextHorizontalAlignment === "right") {
        targetX = canvasWidth * 0.95; 
    }

    const cleanCaption = text.toUpperCase().trim();
    ctx.strokeText(cleanCaption, targetX, y);
    ctx.fillText(cleanCaption, targetX, y);
}

function syncRealtimeMemeCanvasOutput() {
    const asset = uploadedStagedImagesCache[activeStagedFileIndex];
    if (!asset) return;

    const imgNode = imageObjectsDomMap[asset.id];
    const canvas = document.getElementById('studio-render-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = imgNode.width;
    canvas.height = imgNode.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgNode, 0, 0);

    const topText = document.getElementById('txt-meme-top').value;
    const bottomText = document.getElementById('txt-meme-bottom').value;
    const fontSize = parseInt(document.getElementById('num-font-size').value) || 40;
    const strokeSize = parseInt(document.getElementById('num-stroke-size').value) || 6;

    if (topText) {
        drawMemeCaptionTextOnContext(ctx, topText, canvas.width, fontSize + (canvas.height * 0.03), fontSize, strokeSize);
    }
    if (bottomText) {
        drawMemeCaptionTextOnContext(ctx, bottomText, canvas.width, canvas.height - (canvas.height * 0.04), fontSize, strokeSize);
    }

    conversionPipelineIsReady = false;
    evaluateActionsButtonStates();
}

function renderStagedImagePreviewGrid() {
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    if (uploadedStagedImagesCache.length === 0) {
        purgeActiveMemePipeline();
        return;
    }

    uploadedStagedImagesCache.forEach((imgItem, idx) => {
        const card = document.createElement('div');
        card.id = `filmstrip-card-${idx}`;
        card.className = "image-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2 flex flex-col gap-2 relative animate-fade-in cursor-pointer";
        card.onclick = () => switchActiveSandboxFileView(idx);
        card.innerHTML = `
            <div class="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-900/60 flex items-center justify-center">
                <img src="${imgItem.dataUrl}" class="w-full h-full object-cover" alt="Source Track">
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
    const assetToRemove = uploadedStagedImagesCache[index];
    if (assetToRemove) {
        delete imageObjectsDomMap[assetToRemove.id];
    }

    uploadedStagedImagesCache.splice(index, 1);
    conversionPipelineIsReady = false;
    compiledMemesOutputCache = [];
    document.getElementById('extraction-total-lbl').innerText = uploadedStagedImagesCache.length;
    
    if (activeStagedFileIndex >= uploadedStagedImagesCache.length) {
        activeStagedFileIndex = Math.max(0, uploadedStagedImagesCache.length - 1);
    }
    
    if (uploadedStagedImagesCache.length > 0) {
        switchActiveSandboxFileView(activeStagedFileIndex);
        renderStagedImagePreviewGrid();
    } else {
        purgeActiveMemePipeline();
    }
    evaluateActionsButtonStates();
}

async function executeMemeBakeCompilationProcess() {
    if (uploadedStagedImagesCache.length === 0) return;

    conversionPipelineIsReady = false;
    compiledMemesOutputCache = [];

    showProcessingOverlay("Burning Caption Layers", "Compositing typography structures over raster arrays coordinates...");

    const topText = document.getElementById('txt-meme-top').value;
    const bottomText = document.getElementById('txt-meme-bottom').value;
    const fontSize = parseInt(document.getElementById('num-font-size').value) || 40;
    const strokeSize = parseInt(document.getElementById('num-stroke-size').value) || 6;
    
    const formatSelect = document.getElementById('target-export-format').value;
    const extensionExtensionMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/bmp': 'bmp'
    };

    setTimeout(async () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            for (let i = 0; i < uploadedStagedImagesCache.length; i++) {
                const asset = uploadedStagedImagesCache[i];
                updateProcessingOverlayStatus(`Rendering caption overlay text loops (${i + 1} / ${uploadedStagedImagesCache.length})...`);

                const imgNode = imageObjectsDomMap[asset.id];
                canvas.width = imgNode.width;
                canvas.height = imgNode.height;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imgNode, 0, 0);

                if (topText) {
                    drawMemeCaptionTextOnContext(ctx, topText, canvas.width, fontSize + (canvas.height * 0.03), fontSize, strokeSize);
                }
                if (bottomText) {
                    drawMemeCaptionTextOnContext(ctx, bottomText, canvas.width, canvas.height - (canvas.height * 0.04), fontSize, strokeSize);
                }

                const targetMime = formatSelect === 'original' ? (asset.type || 'image/png') : formatSelect;
                const targetExt = formatSelect === 'original' ? asset.origExt : extensionExtensionMap[formatSelect];

                const formattedOutputDataUrl = canvas.toDataURL(targetMime, 0.94);
                compiledMemesOutputCache.push({
                    name: asset.name,
                    ext: targetExt,
                    dataUrl: formattedOutputDataUrl
                });
            }

            conversionPipelineIsReady = true;
            alert(`Successfully memeified ${compiledMemesOutputCache.length} static graphic frames tracks assets blocks.`);
        } catch(fatalError) {
            console.error(fatalError);
            alert("Pipeline Encoding Matrix Fault encountered during canvas rendering layers execution.");
        } finally {
            await hideProcessingOverlay();
            evaluateActionsButtonStates();
        }
    }, 300);
}

async function downloadAllProcessedMemes() {
    if (compiledMemesOutputCache.length === 0 || !conversionPipelineIsReady) return;

    const mainDlBtn = document.getElementById('download-btn');

    if (compiledMemesOutputCache.length === 1) {
        const item = compiledMemesOutputCache[0];
        const customMemeFilename = `${item.name}_memeified.${item.ext}`;
        
        const linkAnchorNode = document.createElement('a');
        linkAnchorNode.download = customMemeFilename;
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
        showProcessingOverlay("Packaging ZIP Container", "Writing compressed entries into downloadable packages structures...");

        setTimeout(async () => {
            try {
                const zip = new JSZip();

                compiledMemesOutputCache.forEach((item, idx) => {
                    const rawBase64Data = item.dataUrl.split(',')[1];
                    const customMemeFilename = `${item.name}_memeified_${idx + 1}.${item.ext}`;
                    zip.file(customMemeFilename, rawBase64Data, { base64: true });
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `fusionmint_memeified_package.zip`;
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

function purgeActiveMemePipeline() {
    uploadedStagedImagesCache = [];
    compiledMemesOutputCache = [];
    imageObjectsDomMap = {};
    conversionPipelineIsReady = false;
    activeStagedFileIndex = 0;

    document.getElementById('txt-meme-top').value = '';
    document.getElementById('txt-meme-bottom').value = '';
    document.getElementById('target-export-format').value = 'original';
    updateTextAlignmentVector('center');

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

    document.getElementById('sandbox-container-wrapper').classList.add('hidden');
    document.getElementById('sandbox-empty-prompt').classList.remove('hidden');
    document.getElementById('meme-parameters-wrapper').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    
    evaluateActionsButtonStates();
}