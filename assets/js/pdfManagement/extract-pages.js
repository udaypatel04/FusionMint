
let pyodideWasmInstance = null;
let originalFileBytesPayload = null;
let activeStagedPdfPagesCount = 0;
let documentHasBeenLockedSuccessfully = false;

let trackingSelectedPagesIndicesSet = [];
let activePresentationSlideSequencePosition = 0;
let activePdfDocumentInstanceInstance = null;

// Visual presentation state matrices
let currentPresentationZoomLevelScale = 1.4; // Base multiplier scale for clean reading resolution
let documentColorMatrixInvertedState = false;

async function bootstrapPythonWasmVirtualEngine() {
    try {
        pyodideWasmInstance = await loadPyodide();
        await pyodideWasmInstance.loadPackage("micropip");
        const micropip = pyodideWasmInstance.pyimport("micropip");
        await micropip.install("pypdf");
        
        document.getElementById('runtime-status-text').innerText = "Python Loaded";
        document.getElementById('runtime-badge').children[0].className = "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse";
        evaluateMintButtonState();
    } catch(fatalError) {
        console.error(fatalError);
        document.getElementById('runtime-status-text').innerText = "Python WASM Crash";
        document.getElementById('runtime-badge').children[0].className = "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse";
    }
}
bootstrapPythonWasmVirtualEngine();

function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling localized data payload structures...") {
    const overlay = document.getElementById('matrix-processing-overlay');
    const titleNode = document.getElementById('overlay-main-title');
    const statusLabel = document.getElementById('overlay-status-label');
    const target = overlay.querySelector('.anim-target');
    
    if (overlay) {
        titleNode.innerText = title;
        statusLabel.innerText = subtitle;
        overlay.classList.remove('invisible');
        overlay.classList.add('active');
        if (target) {
            target.classList.remove('scale-90', 'scale-95');
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
    return new Promise((resolve) => {
        const overlay = document.getElementById('matrix-processing-overlay');
        const target = overlay.querySelector('.anim-target');
        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            if (target) {
                target.classList.remove('scale-100');
                target.classList.add('scale-90');
            }
            setTimeout(resolve, 300);
        } else {
            resolve();
        }
    });
}

function evaluateMintButtonState() {
    const lockBtn = document.getElementById('lock-btn');
    const downloadBtn = document.getElementById('download-btn');
    const presentBtn = document.getElementById('btn-fullscreen-presentation');
    
    if (pyodideWasmInstance && originalFileBytesPayload && trackingSelectedPagesIndicesSet.length > 0) {
        lockBtn.disabled = false;
        lockBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5";
        
        if (documentHasBeenLockedSuccessfully) {
            downloadBtn.disabled = false;
            downloadBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5";
        } else {
            downloadBtn.disabled = true;
            downloadBtn.className = "w-full min-h-[44px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        }
    } else {
        lockBtn.disabled = true;
        lockBtn.className = "w-full min-h-[44px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-not-allowed";
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[44px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-not-allowed";
    }

    if (trackingSelectedPagesIndicesSet.length > 0) {
        presentBtn.disabled = false;
        presentBtn.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all opacity-100";
    } else {
        presentBtn.disabled = true;
        presentBtn.className = "opacity-40 cursor-not-allowed px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 rounded-xl shadow-md flex items-center gap-1.5 transition-all";
    }
}

async function loadPDFToPipelineOrchestrator(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const pdfFile = inputNode.files[0];
    const arrayBuffer = await pdfFile.arrayBuffer();
    originalFileBytesPayload = new Uint8Array(arrayBuffer);
    documentHasBeenLockedSuccessfully = false;
    trackingSelectedPagesIndicesSet = [];

    showProcessingOverlay("Generating Thumbnails Matrix", "Parsing document pages schemas layouts elements channels...");

    try {
        activePdfDocumentInstanceInstance = await pdfjsLib.getDocument({ data: originalFileBytesPayload.slice(0) }).promise;
        activeStagedPdfPagesCount = activePdfDocumentInstanceInstance.numPages;

        document.getElementById('select-range-from').max = activeStagedPdfPagesCount;
        document.getElementById('select-range-to').value = Math.min(20, activeStagedPdfPagesCount);
        document.getElementById('select-range-to').max = activeStagedPdfPagesCount;

        const gridRoot = document.getElementById('pdf-thumbnails-grid-root');
        if (gridRoot) gridRoot.innerHTML = '';
        
        const callout = document.getElementById('empty-workspace-callout');
        if (callout) callout.classList.add('hidden');

        for (let pageNum = 1; pageNum <= activeStagedPdfPagesCount; pageNum++) {
            updateProcessingOverlayStatus(`Rasterizing sheet wrapper blueprint (${pageNum} / ${activeStagedPdfPagesCount})...`);
            
            const pageObj = await activePdfDocumentInstanceInstance.getPage(pageNum);
            const viewport = pageObj.getViewport({ scale: 0.35 }); 
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await pageObj.render({ canvasContext: ctx, viewport: viewport }).promise;
            const base64ThumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            const thumbCardNode = document.createElement('div');
            thumbCardNode.id = `thumb-container-idx-${pageNum}`;
            thumbCardNode.className = "page-thumbnail-box bg-slate-900/40 border border-slate-850 p-2.5 rounded-xl flex flex-col gap-2 relative shadow-lg select-none cursor-pointer";
            thumbCardNode.onclick = () => { togglePageIndexSelectionChannel(pageNum); };
            thumbCardNode.innerHTML = `
                <div class="relative w-full aspect-[210/297] bg-white rounded overflow-hidden border border-slate-950 flex items-center justify-center">
                    <img src="${base64ThumbnailDataUrl}" class="w-full h-full object-cover opacity-95">
                    <div id="selection-checkbox-badge-${pageNum}" class="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-bold flex items-center justify-center transition-all">
                        <i class="fa-solid fa-check opacity-0 transition-opacity"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between font-mono text-[10px] text-slate-400 px-0.5">
                    <span class="font-bold">Sheet Index</span>
                    <span class="text-slate-500 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">${pageNum}</span>
                </div>
            `;

            if (gridRoot) gridRoot.appendChild(thumbCardNode);
        }

        const totalBadge = document.getElementById('page-total-badge');
        if (totalBadge) {
            totalBadge.innerText = `${activeStagedPdfPagesCount} Pages Loaded`;
            totalBadge.classList.remove('hidden');
        }

        document.getElementById('extraction-parameters-wrapper').classList.replace('hidden', 'flex');
        document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');

        if (pdfFile.name) {
            const basePrefix = pdfFile.name.substring(0, pdfFile.name.lastIndexOf('.')) || pdfFile.name;
            document.getElementById('pdf-output-filename').value = `${basePrefix.replace(/\s+/g, '_')}_extracted`;
        }

    } catch (error) {
        console.error(error);
        alert("Error parsing PDF metadata matrix tracks.");
    } finally {
        await hideProcessingOverlay();
        updateSelectionStateUIRepresentation();
    }
}

function applyBatchRangeSelection() {
    documentHasBeenLockedSuccessfully = false;
    const rFrom = parseInt(document.getElementById('select-range-from').value) || 1;
    const rTo = parseInt(document.getElementById('select-range-to').value) || activeStagedPdfPagesCount;

    if (rFrom < 1 || rTo > activeStagedPdfPagesCount || rFrom > rTo) {
        alert("Invalid selection range boundaries.");
        return;
    }

    trackingSelectedPagesIndicesSet = [];
    for (let i = rFrom; i <= rTo; i++) {
        trackingSelectedPagesIndicesSet.push(i);
    }

    updateSelectionStateUIRepresentation();
    rebuildStringSequencePatternFromSelection();
}

function togglePageIndexSelectionChannel(targetIndex) {
    documentHasBeenLockedSuccessfully = false;
    const itemPos = trackingSelectedPagesIndicesSet.indexOf(targetIndex);
    if(itemPos > -1) {
        trackingSelectedPagesIndicesSet.splice(itemPos, 1);
    } else {
        trackingSelectedPagesIndicesSet.push(targetIndex);
        trackingSelectedPagesIndicesSet.sort((a, b) => a - b);
    }
    updateSelectionStateUIRepresentation();
    rebuildStringSequencePatternFromSelection();
}

function modifyGlobalSelectionState(shouldSelectAll = true) {
    documentHasBeenLockedSuccessfully = false;
    trackingSelectedPagesIndicesSet = [];
    if(shouldSelectAll) {
        for(let i = 1; i <= activeStagedPdfPagesCount; i++) {
            trackingSelectedPagesIndicesSet.push(i);
        }
    }
    updateSelectionStateUIRepresentation();
    rebuildStringSequencePatternFromSelection();
}

function updateSelectionStateUIRepresentation() {
    document.getElementById('lbl-selected-count').innerText = `${trackingSelectedPagesIndicesSet.length} Pages`;
    
    for(let i = 1; i <= activeStagedPdfPagesCount; i++) {
        const box = document.getElementById(`thumb-container-idx-${i}`);
        const badge = document.getElementById(`selection-checkbox-badge-${i}`);
        if(!box) continue;

        if(trackingSelectedPagesIndicesSet.includes(i)) {
            box.classList.add('selected');
            badge.className = "absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border border-white text-[10px] text-slate-950 font-bold flex items-center justify-center scale-105 shadow-md shadow-emerald-500/20";
            badge.querySelector('i').classList.remove('opacity-0');
        } else {
            box.classList.remove('selected');
            badge.className = "absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-bold flex items-center justify-center scale-100 shadow-none";
            badge.querySelector('i').classList.add('opacity-0');
        }
    }
    evaluateMintButtonState();
}

function rebuildStringSequencePatternFromSelection() {
    if(trackingSelectedPagesIndicesSet.length === 0) {
        document.getElementById('manual-page-sequence-input').value = "";
        return;
    }
    let ranges = [];
    let start = trackingSelectedPagesIndicesSet[0];
    let end = start;

    for(let i = 1; i < trackingSelectedPagesIndicesSet.length; i++) {
        if(trackingSelectedPagesIndicesSet[i] === end + 1) {
            end = trackingSelectedPagesIndicesSet[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = trackingSelectedPagesIndicesSet[i];
            end = start;
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    document.getElementById('manual-page-sequence-input').value = ranges.join(', ');
}

function parseManualSequenceInputString() {
    documentHasBeenLockedSuccessfully = false;
    const inputVal = document.getElementById('manual-page-sequence-input').value.trim();
    if(!inputVal) {
        trackingSelectedPagesIndicesSet = [];
        updateSelectionStateUIRepresentation();
        return;
    }

    let computedIndices = [];
    const parts = inputVal.split(',');

    for(let part of parts) {
        part = part.trim();
        if(part.includes('-')) {
            const limits = part.split('-');
            const rStart = parseInt(limits[0]);
            const rEnd = parseInt(limits[1]);
            if(!isNaN(rStart) && !isNaN(rEnd)) {
                for(let k = Math.min(rStart, rEnd); k <= Math.max(rStart, rEnd); k++) {
                    if(k >= 1 && k <= activeStagedPdfPagesCount && !computedIndices.includes(k)) {
                        computedIndices.push(k);
                    }
                }
            }
        } else {
            const val = parseInt(part);
            if(!isNaN(val) && val >= 1 && val <= activeStagedPdfPagesCount && !computedIndices.includes(val)) {
                computedIndices.push(val);
            }
        }
    }
    trackingSelectedPagesIndicesSet = computedIndices.sort((a,b)=>a-b);
    updateSelectionStateUIRepresentation();
}

/* -------------------------------------------------------------------------
    * PRESENTATION SLIDER CONTROLLERS - DIRECT RE-RENDER MATRIX PIPELINE
    * ------------------------------------------------------------------------- */
function toggleFullscreenPresentation() {
    if (trackingSelectedPagesIndicesSet.length === 0) return;
    activePresentationSlideSequencePosition = 0;
    currentPresentationZoomLevelScale = 1.4; // Optimized clean starting point for direct-to-canvas rendering
    documentColorMatrixInvertedState = false;
    
    const viewportNode = document.getElementById('presentation-mode-viewport');
    viewportNode.classList.remove('hidden');
    
    applyVisibilityStylesMatrix();
    renderActivePresentationSlideState();
    
    if (viewportNode.requestFullscreen) {
        viewportNode.requestFullscreen();
    }
}

// Fixes text blurriness by rendering directly to the destination canvas size on slide/zoom changes
async function renderActivePresentationSlideState() {
    const currentSelectedPageIndex = trackingSelectedPagesIndicesSet[activePresentationSlideSequencePosition];
    const canvas = document.getElementById('presentation-render-canvas');
    const counterNode = document.getElementById('presentation-counter-label');
    
    if (!currentSelectedPageIndex || !activePdfDocumentInstanceInstance || !canvas) return;

    counterNode.innerText = `Rendering Sheet Matrix...`;
    const ctx = canvas.getContext('2d');

    try {
        const pageObj = await activePdfDocumentInstanceInstance.getPage(currentSelectedPageIndex);
        // Vector-render directly at the adjusted target canvas zoom factor matrix mapping rule
        const viewport = pageObj.getViewport({ scale: currentPresentationZoomLevelScale }); 
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Clear out stale structures inside canvas workspace buffer layout tracking channel
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        await pageObj.render({ canvasContext: ctx, viewport: viewport }).promise;
        counterNode.innerText = `Sheet ${activePresentationSlideSequencePosition + 1} / ${trackingSelectedPagesIndicesSet.length} (Index: ${currentSelectedPageIndex})`;
    } catch (err) {
        console.error("Vector rendering pipeline tracking fault:", err);
        counterNode.innerText = "Error Loading Page Channel";
    }
}

function adjustPresentationSizingScale(deltaChange) {
    let tentativeScale = currentPresentationZoomLevelScale + deltaChange;
    if (tentativeScale >= 0.6 && tentativeScale <= 2.2) {
        currentPresentationZoomLevelScale = tentativeScale;
        
        const zoomLabel = document.getElementById('zoom-percentage-label');
        if (zoomLabel) {
            // Standardize visual translation string values
            zoomLabel.innerText = `${Math.round((currentPresentationZoomLevelScale / 1.4) * 100)}%`;
        }
        
        // Re-render immediately to recalculate text metrics sharp vectors arrays block bounds
        renderActivePresentationSlideState();
    }
}

function toggleInvertedColorMatrixFilter() {
    documentColorMatrixInvertedState = !documentColorMatrixInvertedState;
    applyVisibilityStylesMatrix();
}

function applyVisibilityStylesMatrix() {
    const canvas = document.getElementById('presentation-render-canvas');
    if (canvas) {
        canvas.style.filter = documentColorMatrixInvertedState ? 'invert(1) hue-rotate(180deg)' : 'none';
    }
}

function navigatePresentationSliderSequence(directionShift) {
    let nextIndex = activePresentationSlideSequencePosition + directionShift;
    if (nextIndex >= 0 && nextIndex < trackingSelectedPagesIndicesSet.length) {
        activePresentationSlideSequencePosition = nextIndex;
        renderActivePresentationSlideState();
    }
}

function exitPresentationViewportMode() {
    document.getElementById('presentation-mode-viewport').classList.add('hidden');
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

window.addEventListener('keydown', (event) => {
    const viewOpen = !document.getElementById('presentation-mode-viewport').classList.contains('hidden');
    if (!viewOpen) return;

    if (event.key === 'ArrowRight') {
        navigatePresentationSliderSequence(1);
    } else if (event.key === 'ArrowLeft') {
        navigatePresentationSliderSequence(-1);
    } else if (event.key === 'Escape') {
        exitPresentationViewportMode();
    }
});

async function executePythonPdfExtraction(shouldTriggerDownloadPayload = false) {
    if (!originalFileBytesPayload || !pyodideWasmInstance || trackingSelectedPagesIndicesSet.length === 0) return;

    showProcessingOverlay("Advanced Page Extraction Matrix", "Isolating chosen workspace matrix track layers inside Python runtime layout container...");

    pyodideWasmInstance.FS.writeFile("raw_source.pdf", originalFileBytesPayload);
    
    const zeroIndexedPythonList = trackingSelectedPagesIndicesSet.map(idx => idx - 1);
    pyodideWasmInstance.globals.set("target_pages_list", pyodideWasmInstance.toPy(zeroIndexedPythonList));

    setTimeout(async () => {
        try {
            updateProcessingOverlayStatus("Extracting selected layout tracks into individual buffers...");
            await pyodideWasmInstance.runPythonAsync(`
                from pypdf import PdfReader, PdfWriter

                reader = PdfReader("raw_source.pdf")
                writer = PdfWriter()

                for page_idx in target_pages_list:
                    if page_idx < len(reader.pages):
                        writer.add_page(reader.pages[page_idx])

                with open("extracted_output.pdf", "wb") as f:
                    writer.write(f)
            `);

            const cleanBytes = pyodideWasmInstance.FS.readFile("extracted_output.pdf");
            documentHasBeenLockedSuccessfully = true;

            if (shouldTriggerDownloadPayload) {
                updateProcessingOverlayStatus("Flushing generated binary blocks container stream...");
                const blobStream = new Blob([cleanBytes], { type: "application/pdf" });
                const customOutputName = document.getElementById('pdf-output-filename').value.trim() || "extracted_export";
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `${customOutputName}.pdf`;
                linkAnchorNode.href = URL.createObjectURL(blobStream);
                document.body.appendChild(linkAnchorNode);
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);
            } else {
                alert("Selected pages extracted completely to sandbox local cache memory. Click 'Download Extracted PDF' to store file.");
            }

            pyodideWasmInstance.FS.unlink("raw_source.pdf");
            pyodideWasmInstance.FS.unlink("extracted_output.pdf");

        } catch (fatalError) {
            console.error(fatalError);
            alert("WASM Extraction Processing Error: Index bounds or layout sequence dictionary failure.");
        } finally {
            await hideProcessingOverlay();
            evaluateMintButtonState();
        }
    }, 450);
}

function purgeActiveExtractionPipeline() {
    window.location.reload();
}