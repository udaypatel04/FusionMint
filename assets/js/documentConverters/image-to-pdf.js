
let stagedImagesCacheArray = [];
let activePageOrientationValue = 'p'; 
let activeBackgroundColor = 'white'; // 'white' or 'black'
let exportSequenceOrderMode = 'forward'; // 'forward' (Oldest->Newest) or 'reverse' (Newest->Oldest)
let activeSimulatorFocusedPageIndex = 0;
let draggedTileDOMPointer = null;

function showProcessingOverlay(title = "Compiling PDF", subtitle = "Rendering slide deck matrix...") {
    const overlay = document.getElementById('matrix-processing-overlay');
    const titleNode = document.getElementById('overlay-main-title');
    const statusLabel = document.getElementById('overlay-status-label');
    const target = overlay.querySelector('.anim-target');
    
    if (overlay) {
        titleNode.innerText = title;
        statusLabel.innerText = subtitle;
        overlay.classList.remove('invisible', 'opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
        if (target) {
            target.classList.remove('scale-90');
            target.classList.add('scale-100');
        }
    }
}

function updateProcessingOverlayStatus(text) {
    const statusLabel = document.getElementById('overlay-status-label');
    if (statusLabel) statusLabel.innerText = text;
}

function hideProcessingOverlay() {
    const overlay = document.getElementById('matrix-processing-overlay');
    const target = overlay.querySelector('.anim-target');
    if (overlay) {
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('invisible', 'opacity-0', 'pointer-events-none');
        if (target) {
            target.classList.remove('scale-100');
            target.classList.add('scale-90');
        }
    }
}

// Format Date / Timestamp for badges
function formatFileTimestamp(timestampMs) {
    if (!timestampMs) return "Unknown date";
    const d = new Date(timestampMs);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Sequence Order Switcher (Oldest First vs Newest First)
function setExportSequenceOrder(orderMode) {
    exportSequenceOrderMode = orderMode;
    const fBtn = document.getElementById('order-btn-forward');
    const rBtn = document.getElementById('order-btn-reverse');
    const indicator = document.getElementById('order-indicator');

    if (orderMode === 'forward') {
        fBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg bg-amber-500 text-slate-950 transition-all cursor-pointer shadow flex items-center justify-center gap-1";
        rBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1";
        indicator.innerText = "Oldest First";
    } else {
        rBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg bg-amber-500 text-slate-950 transition-all cursor-pointer shadow flex items-center justify-center gap-1";
        fBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1";
        indicator.innerText = "Newest First";
    }
    reSortByTimestamp();
}

// Re-sort the current stack strictly by date/timestamp
function reSortByTimestamp() {
    if (stagedImagesCacheArray.length <= 1) return;
    stagedImagesCacheArray.sort((a, b) => {
        return exportSequenceOrderMode === 'forward' 
            ? a.timestamp - b.timestamp 
            : b.timestamp - a.timestamp;
    });
    activeSimulatorFocusedPageIndex = 0;
    renderCompilerStagingGridMatrix();
}

// Background Color Switcher (White / Black)
function setPdfBackgroundColor(colorMode) {
    activeBackgroundColor = colorMode;
    const wBtn = document.getElementById('bg-btn-white');
    const bBtn = document.getElementById('bg-btn-black');
    const indicator = document.getElementById('bg-color-indicator');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const emptyCalloutH = document.getElementById('empty-callout-heading');
    const emptyCalloutS = document.getElementById('empty-callout-sub');

    if (colorMode === 'white') {
        wBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg bg-white text-slate-950 transition-all cursor-pointer shadow flex items-center justify-center gap-1.5 border border-slate-300";
        bBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5";
        indicator.innerText = "White Canvas";
        
        sheet.style.backgroundColor = '#FFFFFF';
        sheet.style.color = '#020617';
        emptyCalloutH.className = "text-xs font-bold uppercase tracking-wider text-slate-700";
        emptyCalloutS.className = "text-[10px] text-slate-500 max-w-[200px] block";
    } else {
        bBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg bg-slate-900 border border-slate-700 text-white transition-all cursor-pointer shadow flex items-center justify-center gap-1.5";
        wBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5";
        indicator.innerText = "Black Canvas";

        sheet.style.backgroundColor = '#0B0F19';
        sheet.style.color = '#F8FAFC';
        emptyCalloutH.className = "text-xs font-bold uppercase tracking-wider text-slate-200";
        emptyCalloutS.className = "text-[10px] text-slate-400 max-w-[200px] block";
    }
}

function setPdfPageOrientation(orientationMode) {
    activePageOrientationValue = orientationMode;
    const pBtn = document.getElementById('orient-portrait');
    const lBtn = document.getElementById('orient-landscape');

    if (orientationMode === 'p') {
        pBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg bg-amber-500 text-slate-950 transition-all cursor-pointer shadow";
        lBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
    } else {
        lBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg bg-amber-500 text-slate-950 transition-all cursor-pointer shadow";
        pBtn.className = "py-1.5 text-xs font-bold text-center rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
    }

    syncSimulatorPageLayoutViewDimensions();
}

function syncSimulatorPageLayoutViewDimensions() {
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const sizePreset = document.getElementById('pdf-page-size').value;
    const marginVal = parseFloat(document.getElementById('pdf-margin').value);

    // Handle PPT Slides vs Standard Formats
    if (sizePreset === 'ppt-16-9') {
        sheet.style.aspectRatio = activePageOrientationValue === 'p' ? "9 / 16" : "16 / 9";
    } else if (sizePreset === 'ppt-4-3') {
        sheet.style.aspectRatio = activePageOrientationValue === 'p' ? "3 / 4" : "4 / 3";
    } else if (sizePreset === 'letter') {
        sheet.style.aspectRatio = activePageOrientationValue === 'p' ? "8.5 / 11" : "11 / 8.5";
    } else if (sizePreset === 'a4' || sizePreset === 'img') {
        sheet.style.aspectRatio = activePageOrientationValue === 'p' ? "210 / 297" : "297 / 210";
    }

    sheet.style.padding = `${Math.max(4, marginVal * 1.2)}px`;
    refreshLiveSimulatorImageFrame();
}

// Automatic Date/Time Extraction, Folder Scanning & Sorting on Input
function processStagedImagesFilesInput(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const rawFiles = Array.from(inputNode.files);

    // Filter only valid image extensions/mimetypes
    const uploadedFiles = rawFiles.filter(f => f.type.match(/^image\/(jpeg|jpg|png|webp)$/i) || f.name.match(/\.(jpeg|jpg|png|webp)$/i));

    if (uploadedFiles.length === 0) {
        alert("No valid JPG, PNG, or WebP image files found in selection.");
        inputNode.value = "";
        return;
    }

    // Extract folder name if available (from webkitRelativePath)
    let detectedFolderName = "";
    if (uploadedFiles[0].webkitRelativePath) {
        const pathParts = uploadedFiles[0].webkitRelativePath.split('/');
        if (pathParts.length > 1) {
            detectedFolderName = pathParts[0];
        }
    }

    showProcessingOverlay("Staging Visual Assets", `Reading ${uploadedFiles.length} file streams and timestamps...`);

    let loadedCounter = 0;
    let newlyLoadedItems = [];

    uploadedFiles.forEach(file => {
        // Extract chronological timestamp (File lastModified timestamp fallback)
        const fileTimestamp = file.lastModified || (file.lastModifiedDate ? new Date(file.lastModifiedDate).getTime() : Date.now());

        const readerObjInstance = new FileReader();
        readerObjInstance.onload = function(e) {
            const uniqueAssetId = "asset-" + Math.random().toString(36).substring(2, 11);
            
            newlyLoadedItems.push({
                id: uniqueAssetId,
                fileName: file.name,
                dataUrl: e.target.result,
                timestamp: fileTimestamp
            });

            loadedCounter++;
            updateProcessingOverlayStatus(`Indexing image ${loadedCounter} of ${uploadedFiles.length}...`);

            if (loadedCounter === uploadedFiles.length) {
                // Merge and sort everything strictly chronologically
                stagedImagesCacheArray = [...stagedImagesCacheArray, ...newlyLoadedItems];
                
                stagedImagesCacheArray.sort((a, b) => {
                    return exportSequenceOrderMode === 'forward' 
                        ? a.timestamp - b.timestamp 
                        : b.timestamp - a.timestamp;
                });

                // Set custom filename: prefer folder name if folder upload, else first image name
                const nameInput = document.getElementById('pdf-custom-filename');
                if (!nameInput.value.trim()) {
                    if (detectedFolderName) {
                        nameInput.value = detectedFolderName.replace(/\s+/g, '_');
                    } else if (stagedImagesCacheArray.length > 0) {
                        const rawName = stagedImagesCacheArray[0].fileName;
                        const baseName = rawName.substring(0, rawName.lastIndexOf('.')) || rawName;
                        nameInput.value = baseName.replace(/\s+/g, '_');
                    }
                }

                activeSimulatorFocusedPageIndex = 0;
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

    trackerIndicator.innerText = `${stagedImagesCacheArray.length} ${stagedImagesCacheArray.length === 1 ? 'Slide' : 'Slides'} Staged`;

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
        const isSelectedClass = idx === activeSimulatorFocusedPageIndex ? "border-amber-400 ring-2 ring-amber-500/30" : "border-slate-800/80";
        tileNode.className = `image-tile relative aspect-video bg-slate-900 border rounded-2xl overflow-hidden shadow-md group ${isSelectedClass}`;
        tileNode.setAttribute('draggable', 'true');
        tileNode.setAttribute('data-id', asset.id);
        tileNode.setAttribute('data-index', idx);

        const formattedTime = formatFileTimestamp(asset.timestamp);

        tileNode.innerHTML = `
            <img src="${asset.dataUrl}" class="w-full h-full object-cover select-none pointer-events-none" alt="Preview Tile">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div class="flex justify-between items-start">
                    <span class="text-[8px] font-mono font-medium text-slate-300 bg-slate-950/90 border border-slate-800 px-1.5 py-0.5 rounded backdrop-blur-sm truncate max-w-[110px]" title="${formattedTime}">
                        <i class="fa-regular fa-clock mr-0.5 text-amber-400"></i>${formattedTime}
                    </span>
                    <button onclick="removeIndividualStagedAssetItem('${asset.id}', event)" class="w-5 h-5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-[10px] cursor-pointer">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-mono font-bold text-amber-400 bg-slate-950/90 border border-slate-800 px-1.5 py-0.5 rounded">#${idx + 1}</span>
                </div>
            </div>
        `;

        tileNode.addEventListener('click', () => {
            activeSimulatorFocusedPageIndex = idx;
            refreshLiveSimulatorImageFrame();
            document.querySelectorAll('.image-tile').forEach(t => t.classList.remove('border-amber-400', 'ring-2', 'ring-amber-500/30'));
            tileNode.classList.add('border-amber-400', 'ring-2', 'ring-amber-500/30');
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
    paginationDeck.className = "flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono font-bold mt-3 shadow-lg";

    viewportImg.src = stagedImagesCacheArray[activeSimulatorFocusedPageIndex].dataUrl;
    document.getElementById('simulator-page-index-label').innerText = `Slide ${activeSimulatorFocusedPageIndex + 1} / ${stagedImagesCacheArray.length}`;
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
    document.getElementById('pdf-custom-filename').value = "";
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

            const movedItem = stagedImagesCacheArray.splice(srcIndex, 1)[0];
            stagedImagesCacheArray.splice(destIndex, 0, movedItem);

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
        btn.classList.add('flex');
        badge.classList.add('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('hidden');
        btn.classList.remove('flex');
        badge.classList.remove('hidden');
    }
}

function toggleFullscreenPresentation() {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            targetElement.classList.remove('p-6', 'bg-slate-950/40', 'border');
            targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
            sheet.classList.remove('max-w-[340px]', 'mt-8');
            sheet.classList.add('max-w-[80vw]', 'max-h-[85vh]', 'mt-0');
            refreshLiveSimulatorImageFrame();
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen ? document.exitFullscreen() : null;
    }
}

document.addEventListener('fullscreenchange', () => {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    if (!document.fullscreenElement) {
        targetElement.classList.add('p-6', 'bg-slate-950/40', 'border');
        targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.add('max-w-[340px]', 'mt-8');
        sheet.classList.remove('max-w-[80vw]', 'max-h-[85vh]', 'mt-0');
        refreshLiveSimulatorImageFrame();
    }
});

// Helper to convert images with canvas background fill
function convertImageWithBackground(dataUrl, bgColorHex) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            
            // Fill background
            ctx.fillStyle = bgColorHex;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            resolve({
                dataUrl: canvas.toDataURL('image/jpeg', 0.95),
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };
        img.src = dataUrl;
    });
}

async function compileStagedAssetsToPDF() {
    if (stagedImagesCacheArray.length === 0) {
        alert("Please stage at least one image before exporting.");
        return;
    }

    showProcessingOverlay("Compiling Document Deck", "Configuring page dimensions and canvas streams...");

    const { jsPDF } = window.jspdf;
    const pageSizePreset = document.getElementById('pdf-page-size').value;
    const paddingMargin = parseFloat(document.getElementById('pdf-margin').value);
    const compressionSetting = document.getElementById('pdf-compression').value;

    // Resolve page format dimension mappings
    let pageFormat = 'a4';
    if (pageSizePreset === 'ppt-16-9') {
        pageFormat = [297, 167.06]; // 16:9 mm format
    } else if (pageSizePreset === 'ppt-4-3') {
        pageFormat = [280, 210];    // 4:3 mm format
    } else if (pageSizePreset === 'letter') {
        pageFormat = 'letter';
    } else if (pageSizePreset === 'a4' || pageSizePreset === 'img') {
        pageFormat = 'a4';
    }

    let doc = new jsPDF({
        orientation: activePageOrientationValue,
        unit: 'mm',
        format: pageFormat,
        compress: compressionSetting !== 'NONE'
    });

    // Ensure array is strictly aligned with chosen chronological sequence
    let exportList = [...stagedImagesCacheArray];

    // Determine custom filename (or sanitized fallback)
    const customNameInput = document.getElementById('pdf-custom-filename').value.trim();
    let outputFileName;
    if (customNameInput) {
        const sanitizedCustom = customNameInput.replace(/[/\\?%*:|"<>]/g, '-').replace(/\.pdf$/i, '');
        outputFileName = `${sanitizedCustom}.pdf`;
    } else {
        const initialImage = exportList[0];
        const rawName = initialImage.fileName || "convertmint_deck";
        const sanitizedBaseName = rawName.substring(0, rawName.lastIndexOf('.')) || rawName;
        outputFileName = `${sanitizedBaseName.replace(/\s+/g, '_')}_deck.pdf`;
    }

    const bgFillHex = activeBackgroundColor === 'black' ? '#0B0F19' : '#FFFFFF';

    setTimeout(async () => {
        try {
            for (let i = 0; i < exportList.length; i++) {
                const asset = exportList[i];
                updateProcessingOverlayStatus(`Rendering slide ${i + 1} of ${exportList.length} (${formatFileTimestamp(asset.timestamp)})...`);

                const converted = await convertImageWithBackground(asset.dataUrl, bgFillHex);

                if (i > 0) {
                    doc.addPage(pageFormat, activePageOrientationValue);
                }

                let pageW = doc.internal.pageSize.getWidth();
                let pageH = doc.internal.pageSize.getHeight();

                if (pageSizePreset === 'img') {
                    const mmW = converted.width * 0.264583;
                    const mmH = converted.height * 0.264583;
                    doc.setPage(i + 1);
                    doc.internal.pageSize.setWidth(mmW);
                    doc.internal.pageSize.setHeight(mmH);
                    pageW = mmW;
                    pageH = mmH;
                }

                // Paint full page background color
                if (activeBackgroundColor === 'black') {
                    doc.setFillColor(11, 15, 25);
                    doc.rect(0, 0, pageW, pageH, 'F');
                } else {
                    doc.setFillColor(255, 255, 255);
                    doc.rect(0, 0, pageW, pageH, 'F');
                }

                const renderableW = Math.max(1, pageW - (paddingMargin * 2));
                const renderableH = Math.max(1, pageH - (paddingMargin * 2));

                const imgAspect = converted.width / converted.height;
                let finalW = renderableW;
                let finalH = renderableW / imgAspect;

                if (finalH > renderableH) {
                    finalH = renderableH;
                    finalW = renderableH * imgAspect;
                }

                const posX = paddingMargin + (renderableW - finalW) / 2;
                const posY = paddingMargin + (renderableH - finalH) / 2;

                doc.addImage(
                    converted.dataUrl,
                    'JPEG',
                    posX,
                    posY,
                    finalW,
                    finalH,
                    undefined,
                    compressionSetting === 'FAST' ? 'FAST' : (compressionSetting === 'SLOW' ? 'SLOW' : undefined)
                );
            }

            updateProcessingOverlayStatus(`Exporting as "${outputFileName}"...`);
            doc.save(outputFileName);

        } catch(err) {
            console.error("PDF generation error: ", err);
            alert("An error occurred during PDF compilation.");
        } finally {
            hideProcessingOverlay();
        }
    }, 150);
}