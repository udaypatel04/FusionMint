
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let stagedPdfFilesArrayBufferCache = [];
let draggedRowDOMPointer = null;
let activeSimulatorFocusedPageIndex = 0;
let activeHighResPageDataUrl = ""; 

document.addEventListener('DOMContentLoaded', () => {
    hideProcessingOverlay();
    
    // ATTACH HARDWARE KEYBOARD EVENT HOOKS FOR ARROW KEY BINDINGS
    window.addEventListener('keydown', (e) => {
        if (stagedPdfFilesArrayBufferCache.length <= 1) return;
        if (e.key === 'ArrowLeft') {
            navigateSimulatorPageFrames(-1);
        } else if (e.key === 'ArrowRight') {
            navigateSimulatorPageFrames(1);
        }
    });
});

function processStagedPDFDocumentsInput(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const targetFilesList = Array.from(inputNode.files);

    document.getElementById('processing-loader-indicator').classList.remove('hidden');
    document.getElementById('processing-loader-indicator').classList.add('flex');

    let filesLoadedCounter = 0;

    targetFilesList.forEach(file => {
        if (file.type !== "application/pdf") {
            alert(`Format Intercept: [${file.name}] is not recognized as a structured PDF.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const trackingUid = "pdf-node-" + Math.random().toString(36).substr(2, 9);
            
            stagedPdfFilesArrayBufferCache.push({
                id: trackingUid,
                fileName: file.name,
                fileSize: bytesToHumanReadableUnits(file.size),
                binaryBuffer: e.target.result
            });

            filesLoadedCounter++;
            if (filesLoadedCounter === targetFilesList.length) {
                activeSimulatorFocusedPageIndex = stagedPdfFilesArrayBufferCache.length - targetFilesList.length;
                finalizeUIRenderUpdatesState();
            }
        };
        reader.readAsArrayBuffer(file);
    });

    inputNode.value = "";
}

function bytesToHumanReadableUnits(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function finalizeUIRenderUpdatesState() {
    document.getElementById('processing-loader-indicator').classList.add('hidden');
    document.getElementById('processing-loader-indicator').classList.remove('flex');
    rebuildSequencingRowsMatrixView();
    evaluatePresentationButtonState();
}

function rebuildSequencingRowsMatrixView() {
    const rowContainer = document.getElementById('pdf-document-rows-container');
    const emptyCallout = document.getElementById('empty-buffer-list-state');
    const countLabel = document.getElementById('staged-count-lbl');

    countLabel.innerText = stagedPdfFilesArrayBufferCache.length;

    if (stagedPdfFilesArrayBufferCache.length === 0) {
        rowContainer.innerHTML = '';
        rowContainer.appendChild(emptyCallout);
        emptyCallout.classList.remove('hidden');
        document.getElementById('compilation-actions-deck').classList.add('hidden');
        document.getElementById('compilation-actions-deck').classList.remove('flex');
        
        activeSimulatorFocusedPageIndex = 0;
        renderLiveSimulatorPageFrame();
        return;
    }

    emptyCallout.classList.add('hidden');
    rowContainer.querySelectorAll('.document-item-row').forEach(row => row.remove());

    stagedPdfFilesArrayBufferCache.forEach((fileItem, index) => {
        const rowNode = document.createElement('div');
        const isSelectedBorder = index === activeSimulatorFocusedPageIndex ? "border-teal-400 ring-2 ring-teal-500/10" : "border-slate-800/80";
        rowNode.className = `document-item-row w-full bg-slate-900/60 border ${isSelectedBorder} hover:border-teal-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4 select-none animate-fade-in`;
        rowNode.setAttribute('draggable', 'true');
        rowNode.setAttribute('data-id', fileItem.id);
        rowNode.setAttribute('data-index', index);

        rowNode.innerHTML = `
            <div class="flex items-center gap-3 truncate pointer-events-none">
                <div class="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-mono font-black shrink-0">
                    ${index + 1}
                </div>
                <div class="flex flex-col truncate">
                    <span class="text-xs font-bold text-slate-200 truncate">${fileItem.fileName}</span>
                    <span class="text-[10px] font-mono text-slate-500 mt-0.5">${fileItem.fileSize}</span>
                </div>
            </div>
            <div class="flex items-center gap-4 shrink-0">
                <i class="fa-solid fa-grip-lines text-xs text-slate-600 group-hover:text-slate-400 transition-colors pointer-events-none"></i>
                <button onclick="deleteIndividualBufferItem('${fileItem.id}', event)" class="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xs">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;

        rowNode.addEventListener('click', () => {
            activeSimulatorFocusedPageIndex = index;
            document.querySelectorAll('.document-item-row').forEach(r => r.classList.remove('border-teal-400', 'ring-2', 'ring-teal-500/10'));
            rowNode.classList.add('border-teal-400', 'ring-2', 'ring-teal-500/10');
            renderLiveSimulatorPageFrame();
        });

        wireSortableHTML5ListListeners(rowNode);
        rowContainer.appendChild(rowNode);
    });

    document.getElementById('compilation-actions-deck').classList.remove('hidden');
    document.getElementById('compilation-actions-deck').classList.add('flex');
    
    renderLiveSimulatorPageFrame();
}

async function renderLiveSimulatorPageFrame() {
    const callout = document.getElementById('simulator-empty-callout');
    const rasterFrame = document.getElementById('simulator-raster-frame');
    const viewportImg = document.getElementById('simulator-viewport-img');
    const paginationDeck = document.getElementById('simulator-pagination-deck');
    const infoBadge = document.getElementById('simulator-info-badge');
    
    const flPrev = document.getElementById('floating-prev');
    const flNext = document.getElementById('floating-next');

    if (stagedPdfFilesArrayBufferCache.length === 0 || !stagedPdfFilesArrayBufferCache[activeSimulatorFocusedPageIndex]) {
        callout.classList.remove('hidden');
        rasterFrame.classList.add('hidden');
        paginationDeck.className = "hidden";
        infoBadge.classList.add('hidden');
        flPrev.classList.replace('flex', 'hidden');
        flNext.classList.replace('flex', 'hidden');
        activeHighResPageDataUrl = "";
        return;
    }

    callout.classList.add('hidden');
    rasterFrame.classList.remove('hidden');
    paginationDeck.className = "flex items-center gap-3 bg-slate-950/60 border border-slate-900 px-4 py-2 rounded-xl text-xs font-mono font-bold mt-2";
    infoBadge.classList.remove('hidden');
    infoBadge.classList.add('flex');

    // TOGGLE VISIBILITY FOR COMPACT SIDE CONTROL BAR BUTTON NODES
    if (stagedPdfFilesArrayBufferCache.length > 1) {
        flPrev.classList.replace('hidden', 'flex');
        flNext.classList.replace('hidden', 'flex');
    } else {
        flPrev.classList.replace('flex', 'hidden');
        flNext.classList.replace('flex', 'hidden');
    }

    document.getElementById('simulator-page-index-label').innerText = `File ${activeSimulatorFocusedPageIndex + 1} / ${stagedPdfFilesArrayBufferCache.length}`;

    try {
        const fileData = stagedPdfFilesArrayBufferCache[activeSimulatorFocusedPageIndex];
        const arrayBufferClone = fileData.binaryBuffer.slice(0);
        const loadedDoc = await pdfjsLib.getDocument({ data: arrayBufferClone }).promise;
        
        const pageDataNode = await loadedDoc.getPage(1);
        const viewport = pageDataNode.getViewport({ scale: 1.2 });

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const ctx = offscreenCanvas.getContext('2d');

        await pageDataNode.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        activeHighResPageDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.85);
        viewportImg.src = activeHighResPageDataUrl;
    } catch (err) {
        console.error("Preview render failed:", err);
    }
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badgeWorkspace= document.getElementById('badge-workspace');
    if (stagedPdfFilesArrayBufferCache.length > 0) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in transition-all";
        badgeWorkspace.classList.add('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('hidden');
        badgeWorkspace.classList.remove('hidden');
    }
}

function toggleFullscreenPresentation() {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const dropzone = document.getElementById('pdf-drop-zone');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            if (dropzone) dropzone.classList.add('hidden');
            targetElement.classList.remove('p-6', 'bg-slate-950/10', 'border');
            targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
            sheet.classList.remove('max-w-[280px]', 'mt-6');
            sheet.classList.add('max-w-[70vh]', 'mt-0', 'h-[85vh]');
            document.getElementById('manifest-title-lbl').classList.add('text-teal-400');
            renderLiveSimulatorPageFrame();
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const dropzone = document.getElementById('pdf-drop-zone');
    
    if (!document.fullscreenElement) {
        if (dropzone) dropzone.classList.remove('hidden');
        targetElement.classList.add('p-6', 'bg-slate-950/10', 'border');
        targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.add('max-w-[280px]', 'mt-6');
        sheet.classList.remove('max-w-[70vh]', 'mt-0', 'h-[85vh]');
        document.getElementById('manifest-title-lbl').classList.remove('text-teal-400');
        renderLiveSimulatorPageFrame();
    }
});

window.addEventListener('keydown', function(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

function triggerLightboxModalViewport() {
    if (!activeHighResPageDataUrl) return;
    const modal = document.getElementById('lightbox-modal-window');
    const currentItem = stagedPdfFilesArrayBufferCache[activeSimulatorFocusedPageIndex];
    document.getElementById('lightbox-preview-node-img').src = activeHighResPageDataUrl;
    document.getElementById('lightbox-index-badge').innerText = `File #${activeSimulatorFocusedPageIndex + 1} // ${currentItem.fileName}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.add('hidden');
    document.getElementById('lightbox-modal-window').classList.remove('flex');
}

function navigateSimulatorPageFrames(stepDirection) {
    let nextIndex = activeSimulatorFocusedPageIndex + stepDirection;
    if (nextIndex >= 0 && nextIndex < stagedPdfFilesArrayBufferCache.length) {
        activeSimulatorFocusedPageIndex = nextIndex;
        rebuildSequencingRowsMatrixView();
    }
}

function deleteIndividualBufferItem(targetId, e) {
    e.stopPropagation();
    stagedPdfFilesArrayBufferCache = stagedPdfFilesArrayBufferCache.filter(item => item.id !== targetId);
    if (activeSimulatorFocusedPageIndex >= stagedPdfFilesArrayBufferCache.length) {
        activeSimulatorFocusedPageIndex = Math.max(0, stagedPdfFilesArrayBufferCache.length - 1);
    }
    rebuildSequencingRowsMatrixView();
    evaluatePresentationButtonState();
}

function clearStagedMergeBufferPipeline() {
    stagedPdfFilesArrayBufferCache = [];
    activeSimulatorFocusedPageIndex = 0;
    rebuildSequencingRowsMatrixView();
    evaluatePresentationButtonState();
}

function wireSortableHTML5ListListeners(row) {
    row.addEventListener('dragstart', (e) => {
        draggedRowDOMPointer = row;
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('bg-slate-950/80', 'border-teal-500/40');
    });

    row.addEventListener('dragend', () => {
        row.classList.remove('bg-slate-950/80', 'border-teal-500/40');
    });

    row.addEventListener('dragover', (e) => e.preventDefault());

    row.addEventListener('drop', (e) => {
        e.stopPropagation();
        if (draggedRowDOMPointer !== row) {
            const srcIndex = parseInt(draggedRowDOMPointer.getAttribute('data-index'));
            const destIndex = parseInt(row.getAttribute('data-index'));

            const structuralExtractedItem = stagedPdfFilesArrayBufferCache.splice(srcIndex, 1)[0];
            stagedPdfFilesArrayBufferCache.splice(destIndex, 0, structuralExtractedItem);

            activeSimulatorFocusedPageIndex = destIndex;
            rebuildSequencingRowsMatrixView();
        }
        return false;
    });
}

async function executeBrowserSidePDFMerge() {
    if (stagedPdfFilesArrayBufferCache.length < 2) {
        alert("Staging Range Violation: Please insert at least 2 distinct PDF files to combine.");
        return;
    }

    const overlay = document.getElementById('matrix-processing-overlay');
    const statusLabel = document.getElementById('overlay-status-label');

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    statusLabel.innerText = "Initializing master document allocation sequence...";

    setTimeout(async () => {
        try {
            const { PDFDocument } = PDFLib;
            const mergedMasterDocument = await PDFDocument.create();

            for (let i = 0; i < stagedPdfFilesArrayBufferCache.length; i++) {
                const currentDocData = stagedPdfFilesArrayBufferCache[i];
                statusLabel.innerText = `Extracting objects from file component (${i + 1} / ${stagedPdfFilesArrayBufferCache.length})...`;

                const loadedSubDocument = await PDFDocument.load(currentDocData.binaryBuffer);
                const subDocumentPagesIndices = loadedSubDocument.getPageIndices();

                const copiedPagesCollection = await mergedMasterDocument.copyPages(
                    loadedSubDocument, 
                    subDocumentPagesIndices
                );

                copiedPagesCollection.forEach((page) => mergedMasterDocument.addPage(page));
            }

            statusLabel.innerText = "Serializing unified cryptographic byte vectors...";
            const unifiedFileBytesUint8Array = await mergedMasterDocument.save();
            const fileBlobStream = new Blob([unifiedFileBytesUint8Array], { type: 'application/pdf' });
            const outputNamePrefix = document.getElementById('pdf-output-filename').value.trim() || "merged_compilation";
            
            const linkAnchorNode = document.createElement('a');
            linkAnchorNode.download = `${outputNamePrefix}.pdf`;
            linkAnchorNode.href = URL.createObjectURL(fileBlobStream);
            document.body.appendChild(linkAnchorNode);
            
            linkAnchorNode.click();
            document.body.removeChild(linkAnchorNode);

        } catch (err) {
            console.error(err);
            alert("Merge Pipeline Failure: Error assembling the selected PDF blueprints mapping arrays.");
        } finally {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    }, 300);
}