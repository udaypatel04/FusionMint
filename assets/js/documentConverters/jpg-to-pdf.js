
let stagedImagesCacheArray = [];
let activePageOrientationValue = 'p'; 
let activeSimulatorFocusedPageIndex = 0;
let draggedTileDOMPointer = null;

function showProcessingOverlay(title = "Compiling Asset Track", subtitle = "Assembling raster graphics matrix layers...") {
    const overlay = document.getElementById('matrix-processing-overlay');
    const titleNode = document.getElementById('overlay-main-title');
    const statusLabel = document.getElementById('overlay-status-label');
    const target = overlay.querySelector('.anim-target');
    
    if (overlay) {
        titleNode.innerText = title;
        statusLabel.innerText = subtitle;
        overlay.classList.add('active');
        if (target) {
            target.classList.remove('scale-90');
            target.classList.add('scale-100');
        }
    }
}

function updateProcessingOverlayStatus(text) {
    const statusLabel = document.getElementById('overlay-status-label');
    if (statusLabel) {
        statusLabel.innerText = text;
    }
}

function hideProcessingOverlay() {
    const overlay = document.getElementById('matrix-processing-overlay');
    const target = overlay.querySelector('.anim-target');
    if (overlay) {
        overlay.classList.remove('active');
        if (target) {
            target.classList.remove('scale-100');
            target.classList.add('scale-90');
        }
    }
}

function setPdfPageOrientation(orientationMode) {
    activePageOrientationValue = orientationMode;
    const pBtn = document.getElementById('orient-portrait');
    const lBtn = document.getElementById('orient-landscape');

    if (orientationMode === 'p') {
        pBtn.className = "py-1.5 text-xs font-bold text-center rounded bg-amber-500 text-slate-950 transition-all cursor-pointer";
        lBtn.className = "py-1.5 text-xs font-bold text-center rounded text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
    } else {
        lBtn.className = "py-1.5 text-xs font-bold text-center rounded bg-amber-500 text-slate-950 transition-all cursor-pointer";
        pBtn.className = "py-1.5 text-xs font-bold text-center rounded text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
    }

    syncSimulatorPageLayoutViewDimensions();
}

function syncSimulatorPageLayoutViewDimensions() {
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const sizePreset = document.getElementById('pdf-page-size').value;
    const marginVal = parseFloat(document.getElementById('pdf-margin').value);

    if (sizePreset === 'letter') {
        sheet.style.aspectRatio = activePageOrientationValue === 'p' ? "8.5 / 11" : "11 / 8.5";
    } else if (sizePreset === 'a4' || sizePreset === 'img') {
        sheet.style.aspectRatio = activePageOrientationValue === 'p' ? "210 / 297" : "297 / 210";
    }

    sheet.style.padding = `${marginVal * 1.2}px`;
    refreshLiveSimulatorImageFrame();
}

function processStagedImagesFilesInput(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const uploadedFiles = Array.from(inputNode.files);

    showProcessingOverlay("Staging Raster Graphics", "Caching image file stream buffers inside isolated sandbox memory...");

    let loadedCounter = 0;
    uploadedFiles.forEach(file => {
        if (!file.type.match('image/jpeg') && !file.type.match('image/jpg')) {
            alert(`Asset Format Mismatch: [${file.name}] must be JPEG format.`);
            return;
        }

        const readerObjInstance = new FileReader();
        readerObjInstance.onload = function(e) {
            const uniqueAssetId = "asset-node-" + Math.random().toString(36).substr(2, 9);
            
            stagedImagesCacheArray.push({
                id: uniqueAssetId,
                fileName: file.name,
                dataUrl: e.target.result
            });

            loadedCounter++;
            updateProcessingOverlayStatus(`Processing staged images: Map matrix element ${loadedCounter} of ${uploadedFiles.length}...`);

            if (loadedCounter === uploadedFiles.length) {
                activeSimulatorFocusedPageIndex = stagedImagesCacheArray.length - 1;
                renderCompilerStagingGridMatrix();
                evaluatePresentationButtonState();
                hideProcessingOverlay();
            }
        };
        readerObjInstance.readAsDataURL(file);
    });

    inputNode.value = "";
}

function renderCompilerStagingGridMatrix() {
    const gridRoot = document.getElementById('images-sorting-grid');
    const emptyIndicator = document.getElementById('empty-grid-state');
    const trackerIndicator = document.getElementById('staged-count-indicator');

    trackerIndicator.innerText = `${stagedImagesCacheArray.length} Items Staged`;

    if (stagedImagesCacheArray.length === 0) {
        gridRoot.innerHTML = '';
        gridRoot.appendChild(emptyIndicator);
        emptyIndicator.classList.remove('hidden');
        
        document.getElementById('simulator-empty-callout').classList.remove('hidden');
        document.getElementById('simulator-raster-frame').classList.add('hidden');
        document.getElementById('simulator-pagination-deck').className = "hidden";
        return;
    }

    emptyIndicator.classList.add('hidden');
    gridRoot.querySelectorAll('.image-tile').forEach(tile => tile.remove());

    stagedImagesCacheArray.forEach((asset, idx) => {
        const tileNode = document.createElement('div');
        const isSelectedClass = idx === activeSimulatorFocusedPageIndex ? "border-amber-400 ring-2 ring-amber-500/20" : "border-slate-800";
        tileNode.className = `image-tile relative aspect-square bg-slate-900 border rounded-2xl overflow-hidden shadow-md group ${isSelectedClass}`;
        tileNode.setAttribute('draggable', 'true');
        tileNode.setAttribute('data-id', asset.id);
        tileNode.setAttribute('data-index', idx);

        tileNode.innerHTML = `
            <img src="${asset.dataUrl}" class="w-full h-full object-cover select-none pointer-events-none" alt="Staged Block">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <div class="flex justify-end">
                    <button onclick="removeIndividualStagedAssetItem('${asset.id}', event)" class="w-5 h-5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-[10px] cursor-pointer">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-mono font-bold text-amber-400 bg-slate-950/80 border border-slate-800/80 px-1.5 py-0.5 rounded"># ${idx + 1}</span>
                </div>
            </div>
        `;

        tileNode.addEventListener('click', () => {
            activeSimulatorFocusedPageIndex = idx;
            refreshLiveSimulatorImageFrame();
            document.querySelectorAll('.image-tile').forEach(t => t.classList.remove('border-amber-400', 'ring-2', 'ring-amber-500/20'));
            tileNode.classList.add('border-amber-400', 'ring-2', 'ring-amber-500/20');
        });

        wireHTML5DragAndDropTileListeners(tileNode);
        gridRoot.appendChild(tileNode);
    });

    refreshLiveSimulatorImageFrame();
}

function refreshLiveSimulatorImageFrame() {
    const callout = document.getElementById('simulator-empty-callout');
    const rasterFrame = document.getElementById('simulator-raster-frame');
    const viewportImg = document.getElementById('simulator-viewport-img');
    const paginationDeck = document.getElementById('simulator-pagination-deck');

    if (stagedImagesCacheArray.length === 0 || !stagedImagesCacheArray[activeSimulatorFocusedPageIndex]) {
        callout.classList.remove('hidden');
        rasterFrame.classList.add('hidden');
        paginationDeck.className = "hidden";
        return;
    }

    callout.classList.add('hidden');
    rasterFrame.classList.remove('hidden');
    paginationDeck.className = "flex items-center gap-3 bg-slate-950/60 border border-slate-900 px-4 py-2 rounded-xl text-xs font-mono font-bold mt-3 z-30 relative";

    viewportImg.src = stagedImagesCacheArray[activeSimulatorFocusedPageIndex].dataUrl;
    document.getElementById('simulator-page-index-label').innerText = `Page ${activeSimulatorFocusedPageIndex + 1} / ${stagedImagesCacheArray.length}`;
}

function navigateSimulatorPageFrames(stepDirection) {
    let nextIndex = activeSimulatorFocusedPageIndex + stepDirection;
    if (nextIndex >= 0 && nextIndex < stagedImagesCacheArray.length) {
        activeSimulatorFocusedPageIndex = nextIndex;
        renderCompilerStagingGridMatrix();
    }
}

function removeIndividualStagedAssetItem(targetId, clickEvent) {
    clickEvent.stopPropagation();
    stagedImagesCacheArray = stagedImagesCacheArray.filter(item => item.id !== targetId);
    if (activeSimulatorFocusedPageIndex >= stagedImagesCacheArray.length) {
        activeSimulatorFocusedPageIndex = Math.max(0, stagedImagesCacheArray.length - 1);
    }
    renderCompilerStagingGridMatrix();
    evaluatePresentationButtonState();
}

function clearStagedAssetsMatrix() {
    stagedImagesCacheArray = [];
    activeSimulatorFocusedPageIndex = 0;
    renderCompilerStagingGridMatrix();
    evaluatePresentationButtonState();
}

function wireHTML5DragAndDropTileListeners(node) {
    node.addEventListener('dragstart', (e) => {
        draggedTileDOMPointer = node;
        e.dataTransfer.effectAllowed = 'move';
        node.style.opacity = "0.4";
    });

    node.addEventListener('dragend', () => {
        node.style.opacity = "1";
    });

    node.addEventListener('dragover', (e) => e.preventDefault());

    node.addEventListener('drop', (e) => {
        e.stopPropagation();
        if (draggedTileDOMPointer !== node) {
            const srcIndex = parseInt(draggedTileDOMPointer.getAttribute('data-index'));
            const destIndex = parseInt(node.getAttribute('data-index'));

            const structuralExtractedItem = stagedImagesCacheArray.splice(srcIndex, 1)[0];
            stagedImagesCacheArray.splice(destIndex, 0, structuralExtractedItem);

            activeSimulatorFocusedPageIndex = destIndex;
            renderCompilerStagingGridMatrix();
        }
        return false;
    });
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (stagedImagesCacheArray.length > 0) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 animate-fade-in";
        badge.classList.add('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('hidden');
        badge.classList.remove('hidden');
    }
}

function toggleFullscreenPresentation() {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            targetElement.classList.remove('p-6', 'bg-slate-950/10', 'border');
            targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
            sheet.classList.remove('max-w-[340px]', 'mt-8');
            sheet.classList.add('max-w-[70vh]', 'mt-0');
            refreshLiveSimulatorImageFrame();
        }).catch(err => console.error(err));
    } else {
        document.fullscreenElement ? document.exitFullscreen() : null;
    }
}

document.addEventListener('fullscreenchange', () => {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    if (!document.fullscreenElement) {
        targetElement.classList.add('p-6', 'bg-slate-950/10', 'border');
        targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.add('max-w-[340px]', 'mt-8');
        sheet.classList.remove('max-w-[70vh]', 'mt-0');
        refreshLiveSimulatorImageFrame();
    }
});

window.addEventListener('keydown', function(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

async function compileStagedAssetsToPDF() {
    if (stagedImagesCacheArray.length === 0) {
        alert("Compilation Error: Staged image buffer grid is completely empty.");
        return;
    }

    const overlay = document.getElementById('matrix-processing-overlay');
    const statusLabel = document.getElementById('overlay-status-label');

    overlay.classList.add('active');
    statusLabel.innerText = "Initializing jsPDF runtime configuration context...";

    const { jsPDF } = window.jspdf;
    const pageSizePreset = document.getElementById('pdf-page-size').value;
    const paddingMarginMetric = parseFloat(document.getElementById('pdf-margin').value);
    const compressionSetting = document.getElementById('pdf-compression').value;

    let baselineFormat = pageSizePreset === 'img' ? 'a4' : pageSizePreset;
    let currentDocumentInstance = new jsPDF({
        orientation: activePageOrientationValue,
        unit: 'mm',
        format: baselineFormat,
        compress: compressionSetting !== 'NONE'
    });

    const initialStagedImageObject = stagedImagesCacheArray[0];
    const rawSourceInputName = initialStagedImageObject.fileName || "compiled_package";
    const baselineSanitizedName = rawSourceInputName.substring(0, rawSourceInputName.lastIndexOf('.')) || rawSourceInputName;
    
    const spaceSanitizedUnderscoreName = baselineSanitizedName.replace(/\s+/g, '_');
    const targetOutputNameStringPattern = `${spaceSanitizedUnderscoreName}_jpg_to_pdf.pdf`;

    setTimeout(async () => {
        try {
            for (let index = 0; index < stagedImagesCacheArray.length; index++) {
                const asset = stagedImagesCacheArray[index];
                statusLabel.innerText = `Baking image sequence profile frame (${index + 1} / ${stagedImagesCacheArray.length})...`;

                if (index > 0) {
                    currentDocumentInstance.addPage(baselineFormat, activePageOrientationValue);
                }

                await new Promise((resolveComponentTask) => {
                    const tempImgObj = new Image();
                    tempImgObj.onload = function() {
                        let pageW = currentDocumentInstance.internal.pageSize.getWidth();
                        let pageH = currentDocumentInstance.internal.pageSize.getHeight();

                        if (pageSizePreset === 'img') {
                            const calculatedMillimeterRatioW = tempImgObj.width * 0.264583;
                            const calculatedMillimeterRatioH = tempImgObj.height * 0.264583;
                            
                            currentDocumentInstance.setPage(index + 1);
                            currentDocumentInstance.internal.pageSize.setWidth(calculatedMillimeterRatioW);
                            currentDocumentInstance.internal.pageSize.setHeight(calculatedMillimeterRatioH);
                            
                            pageW = calculatedMillimeterRatioW;
                            pageH = calculatedMillimeterRatioH;
                        }

                        const maxTargetRenderableW = pageW - (paddingMarginMetric * 2);
                        const maxTargetRenderableH = pageH - (paddingMarginMetric * 2);

                        const imgAspectScalingRatio = tempImgObj.width / tempImgObj.height;
                        let finalRenderW = maxTargetRenderableW;
                        let finalRenderH = maxTargetRenderableW / imgAspectScalingRatio;

                        if (finalRenderH > maxTargetRenderableH) {
                            finalRenderH = maxTargetRenderableH;
                            finalRenderW = maxTargetRenderableH * imgAspectScalingRatio;
                        }

                        const renderCoordX = paddingMarginMetric + (maxTargetRenderableW - finalRenderW) / 2;
                        const renderCoordY = paddingMarginMetric + (maxTargetRenderableH - finalRenderH) / 2;

                        currentDocumentInstance.addImage(
                            asset.dataUrl, 
                            'JPEG', 
                            renderCoordX, 
                            renderCoordY, 
                            finalRenderW, 
                            finalRenderH,
                            undefined,
                            compressionSetting === 'FAST' ? 'FAST' : (compressionSetting === 'SLOW' ? 'SLOW' : undefined)
                        );
                        
                        resolveComponentTask();
                    };
                    tempImgObj.src = asset.dataUrl;
                });
            }

            statusLabel.innerText = "Assembling raster document streams...";
            currentDocumentInstance.save(targetOutputNameStringPattern);

        } catch(err) {
            console.error("Compilation loop crash: ", err);
            alert("Sandbox Crash Exception: Error mapping binary matrix elements streams.");
        }  finally {
            hideProcessingOverlay();
        }
    }, 300);
}