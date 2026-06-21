
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let originalFileArrayBufferCache = null;
let documentPagesRecordsCache = []; 
let draggedTileDOMPointer = null;
let activePdfEngineRenderInstance = null;
let activeSlideshowIndexTracker = 0;

let currentPresentationZoomLevelScale = 1.4;
let documentColorMatrixInvertedState = false;

function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling localized data payload structures...") {
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

async function loadPDFDocumentIntoOrganizationPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    const pdfFile = inputElement.files[0];

    if (pdfFile.type !== "application/pdf") {
        alert("Staging Error: Element layout type mismatch. Please select a valid document .pdf extension.");
        return;
    }

    document.getElementById('empty-sandbox-state').classList.add('hidden');
    documentPagesRecordsCache = [];

    showProcessingOverlay("Analyzing Document Structure", "Decompressing page catalogs into reference vectors...");

    const fileReaderInstance = new FileReader();
    fileReaderInstance.onload = async function(e) {
        try {
            originalFileArrayBufferCache = e.target.result;
            const arrayBufferClone = originalFileArrayBufferCache.slice(0);
            activePdfEngineRenderInstance = await pdfjsLib.getDocument({ data: arrayBufferClone }).promise;
            const totalPagesCount = activePdfEngineRenderInstance.numPages;

            for (let pageNum = 1; pageNum <= totalPagesCount; pageNum++) {
                updateProcessingOverlayStatus(`Rendering page layout matrix: Asset raster ${pageNum} of ${totalPagesCount}...`);
                
                const pageDataNode = await activePdfEngineRenderInstance.getPage(pageNum);
                const viewport = pageDataNode.getViewport({ scale: 0.35 });

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = viewport.width;
                offscreenCanvas.height = viewport.height;
                const ctx = offscreenCanvas.getContext('2d');

                await pageDataNode.render({ canvasContext: ctx, viewport: viewport }).promise;

                const dataUrlStringValue = offscreenCanvas.toDataURL('image/jpeg', 0.80);
                documentPagesRecordsCache.push({
                    id: "page-uid-" + Math.random().toString(36).substr(2, 9),
                    originalPageIndex: pageNum - 1, 
                    dataUrl: dataUrlStringValue
                });
            }

            const originalInputName = pdfFile.name;
            const baselineSanitizedName = originalInputName.substring(0, originalInputName.lastIndexOf('.')) || originalInputName;
            const spaceSanitizedUnderscoreName = baselineSanitizedName.replace(/\s+/g, '_');
            document.getElementById('pdf-output-filename').value = `${spaceSanitizedUnderscoreName}_organized`;

            syncStagingUIBlocksView();

        } catch (err) {
            console.error(err);
            alert("Framework Layout Error: Unrecognized dictionary binary objects tree schema elements paths.");
            purgeActiveOrganizationPipeline();
        } {
            hideProcessingOverlay();
        }
    };
    fileReaderInstance.readAsArrayBuffer(pdfFile);
    inputElement.value = "";
}

function syncStagingUIBlocksView() {
    const gridRoot = document.getElementById('pages-thumbnails-sandbox-grid');
    gridRoot.querySelectorAll('.page-thumbnail-card').forEach(card => card.remove());

    document.getElementById('staged-count-lbl').innerText = documentPagesRecordsCache.length;

    if (documentPagesRecordsCache.length === 0) {
        document.getElementById('empty-sandbox-state').classList.remove('hidden');
        document.getElementById('compilation-actions-deck').classList.add('hidden');
        document.getElementById('compilation-actions-deck').classList.remove('flex');
        evaluatePresentationButtonState();
        return;
    }

    document.getElementById('empty-sandbox-state').classList.add('hidden');
    document.getElementById('compilation-actions-deck').classList.remove('hidden');
    document.getElementById('compilation-actions-deck').classList.add('flex');

    documentPagesRecordsCache.forEach((pageItem, index) => {
        const cardNode = document.createElement('div');
        cardNode.className = "page-thumbnail-card bg-slate-900 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col gap-3 relative animate-fade-in cursor-pointer select-none group";
        cardNode.setAttribute('draggable', 'true');
        cardNode.setAttribute('data-id', pageItem.id);
        cardNode.setAttribute('data-index', index);
        
        cardNode.innerHTML = `
            <div class="relative w-full aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-900 select-none pointer-events-none">
                <img src="${pageItem.dataUrl}" class="w-full h-full object-contain" alt="Page Matrix">
            </div>
            <div class="flex items-center justify-between px-1 pointer-events-none">
                <span class="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">Page ${pageItem.originalPageIndex + 1}</span>
                <button onclick="removeIndividualPageFrameItem('${pageItem.id}', event)" class="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 border border-red-500/20 transition-all flex items-center justify-center text-xs pointer-events-auto cursor-pointer" title="Remove page out of sequencing tracks row">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        wireDragAndDropTileListeners(cardNode);
        gridRoot.appendChild(cardNode);
    });

    evaluatePresentationButtonState();
}

function removeIndividualPageFrameItem(uniqueId, event) {
    event.stopPropagation();
    documentPagesRecordsCache = documentPagesRecordsCache.filter(item => item.id !== uniqueId);
    syncStagingUIBlocksView();
}

function wireDragAndDropTileListeners(node) {
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

            const structuralExtractedItem = documentPagesRecordsCache.splice(srcIndex, 1)[0];
            documentPagesRecordsCache.splice(destIndex, 0, structuralExtractedItem);

            syncStagingUIBlocksView();
        }
        return false;
    });
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (documentPagesRecordsCache.length > 0) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-300 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in";
        badge.classList.add('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('hidden');
        badge.classList.remove('hidden');
    }
}

/* -------------------------------------------------------------------------
    * VECTOR PRESENTATION DECK - CRYSTAL PREVIEW CONTROLLERS
    * ------------------------------------------------------------------------- */
function toggleFullscreenPresentation() {
    if (documentPagesRecordsCache.length === 0) return;
    activeSlideshowIndexTracker = 0;
    currentPresentationZoomLevelScale = 1.4;
    documentColorMatrixInvertedState = false;
    
    const deck = document.getElementById('presentation-slideshow-deck');
    deck.classList.remove('hidden');
    
    applyVisibilityStylesMatrix();
    renderActiveSlideshowVectorFrame();
    
    if (deck.requestFullscreen) {
        deck.requestFullscreen();
    }
}

async function renderActiveSlideshowVectorFrame() {
    const canvas = document.getElementById('presentation-vector-canvas');
    const counter = document.getElementById('presentation-counter-lbl');
    
    if (!documentPagesRecordsCache[activeSlideshowIndexTracker] || !activePdfEngineRenderInstance || !canvas) return;
    
    const targetPageIndex = documentPagesRecordsCache[activeSlideshowIndexTracker].originalPageIndex;
    counter.innerText = "Vectorizing Sheet lines...";
    const ctx = canvas.getContext('2d');

    try {
        const pageObj = await activePdfEngineRenderInstance.getPage(targetPageIndex + 1);
        const viewport = pageObj.getViewport({ scale: currentPresentationZoomLevelScale });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        await pageObj.render({ canvasContext: ctx, viewport: viewport }).promise;
        counter.innerText = `Sheet ${activeSlideshowIndexTracker + 1} / ${documentPagesRecordsCache.length} (Index: ${targetPageIndex + 1})`;
    } catch (err) {
        console.error("Presentation deck runtime tracking fault:", err);
        counter.innerText = "Error Processing Target Frame";
    }
}

function adjustPresentationSizingScale(deltaChange) {
    let tentativeScale = currentPresentationZoomLevelScale + deltaChange;
    if (tentativeScale >= 0.6 && tentativeScale <= 2.2) {
        currentPresentationZoomLevelScale = tentativeScale;
        
        const zoomLabel = document.getElementById('zoom-percentage-label');
        if (zoomLabel) {
            zoomLabel.innerText = `${Math.round((currentPresentationZoomLevelScale / 1.4) * 100)}%`;
        }
        
        renderActiveSlideshowVectorFrame();
    }
}

function toggleInvertedColorMatrixFilter() {
    documentColorMatrixInvertedState = !documentColorMatrixInvertedState;
    applyVisibilityStylesMatrix();
}

function applyVisibilityStylesMatrix() {
    const canvas = document.getElementById('presentation-vector-canvas');
    if (canvas) {
        canvas.style.filter = documentColorMatrixInvertedState ? 'invert(1) hue-rotate(180deg)' : 'none';
    }
}

function navigatePresentationSlideshow(deltaShift) {
    let tentativePos = activeSlideshowIndexTracker + deltaShift;
    if (tentativePos >= 0 && tentativePos < documentPagesRecordsCache.length) {
        activeSlideshowIndexTracker = tentativePos;
        renderActiveSlideshowVectorFrame();
    }
}

function exitFullscreenSlideshowMode() {
    document.getElementById('presentation-slideshow-deck').classList.add('hidden');
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

window.addEventListener('keydown', (e) => {
    const deckActive = !document.getElementById('presentation-slideshow-deck').classList.contains('hidden');
    if (!deckActive) return;

    if (e.key === 'ArrowRight') {
        navigatePresentationSlideshow(1);
    } else if (e.key === 'ArrowLeft') {
        navigatePresentationSlideshow(-1);
    } else if (e.key === 'Escape') {
        exitFullscreenSlideshowMode();
    }
});

async function executeOrganizedPDFExport() {
    if (!originalFileArrayBufferCache || documentPagesRecordsCache.length === 0) return;

    showProcessingOverlay("Rebuilding Page Sequences", "Compiling structural array index definitions...");

    let customOutputName = document.getElementById('pdf-output-filename').value.trim().replace(/\s+/g, '_');
    if(!customOutputName) customOutputName = "organized_document_export";

    setTimeout(async function() {
        try {
            const { PDFDocument } = PDFLib;
            const sourceDoc = await PDFDocument.load(originalFileArrayBufferCache);
            const modifiedDoc = await PDFDocument.create();

            const serializationIndicesTrack = documentPagesRecordsCache.map(item => item.originalPageIndex);
            const copiedPagesCollection = await modifiedDoc.copyPages(sourceDoc, serializationIndicesTrack);

            copiedPagesCollection.forEach(page => modifiedDoc.addPage(page));

            const processedBytesUint8Array = await modifiedDoc.save();
            const outputBlobStream = new Blob([processedBytesUint8Array], { type: 'application/pdf' });

            const anchorElement = document.createElement('a');
            anchorElement.download = `${customOutputName}.pdf`;
            anchorElement.href = URL.createObjectURL(outputBlobStream);
            document.body.appendChild(anchorElement);
            
            anchorElement.click();
            document.body.removeChild(anchorElement);

        } catch (fatalError) {
            console.error("Sequence layout adaptation break context caught:", fatalError);
            alert("Matrix Compilation Engine Error: Fault adapting geometry layout data track paths indices.");
        } finally {
            hideProcessingOverlay();
        }
    }, 350);
}

function purgeActiveOrganizationPipeline() {
    window.location.reload();
}