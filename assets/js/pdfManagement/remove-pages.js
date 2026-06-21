
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let originalFileArrayBufferCache = null;
let retainedPageFramesRecordsCache = []; 
let activePdfEngineRenderInstance = null;
let activeSlideshowIndexTracker = 0;

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

async function loadPDFDocumentIntoRemovalPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    const pdfFile = inputElement.files[0];

    if (pdfFile.type !== "application/pdf") {
        alert("Staging Error: Element layer mismatch. Please choose a valid .pdf file asset.");
        return;
    }

    document.getElementById('empty-sandbox-state').classList.add('hidden');
    retainedPageFramesRecordsCache = [];

    showProcessingOverlay("Analyzing Document Structure", "Decompressing page catalogs into reference vectors...");

    const fileReaderInstance = new FileReader();
    fileReaderInstance.onload = async function(e) {
        try {
            originalFileArrayBufferCache = e.target.result;
            const arrayBufferClone = originalFileArrayBufferCache.slice(0);
            activePdfEngineRenderInstance = await pdfjsLib.getDocument({ data: arrayBufferClone }).promise;
            const totalPagesCount = activePdfEngineRenderInstance.numPages;

            for (let pageNum = 1; pageNum <= totalPagesCount; pageNum++) {
                updateProcessingOverlayStatus(`Rasterizing Pages Layouts: Asset preview ${pageNum} of ${totalPagesCount}...`);
                
                const pageDataNode = await activePdfEngineRenderInstance.getPage(pageNum);
                const viewport = pageDataNode.getViewport({ scale: 0.35 });

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = viewport.width;
                offscreenCanvas.height = viewport.height;
                const ctx = offscreenCanvas.getContext('2d');

                await pageDataNode.render({ canvasContext: ctx, viewport: viewport }).promise;

                const dataUrlStringValue = offscreenCanvas.toDataURL('image/jpeg', 0.80);
                retainedPageFramesRecordsCache.push({
                    originalPageIndex: pageNum - 1, 
                    dataUrl: dataUrlStringValue
                });
            }

            const originalInputName = pdfFile.name;
            const baselineSanitizedName = originalInputName.substring(0, originalInputName.lastIndexOf('.')) || originalInputName;
            const spaceSanitizedUnderscoreName = baselineSanitizedName.replace(/\s+/g, '_');
            document.getElementById('pdf-output-filename').value = `${spaceSanitizedUnderscoreName}_reconstructed`;

            syncStagingUIBlocksView();

        } catch (err) {
            console.error(err);
            alert("Framework Translation Fault: Unrecognized binary object map tracks.");
            purgeActiveRemovalPipeline();
        } finally {
            hideProcessingOverlay();
        }
    };
    fileReaderInstance.readAsArrayBuffer(pdfFile);
    inputElement.value = "";
}

function syncStagingUIBlocksView() {
    const gridRoot = document.getElementById('pages-thumbnails-sandbox-grid');
    gridRoot.querySelectorAll('.page-thumbnail-card').forEach(card => card.remove());

    stagedCountUpdate();

    if (retainedPageFramesRecordsCache.length === 0) {
        document.getElementById('empty-sandbox-state').classList.remove('hidden');
        document.getElementById('compilation-actions-deck').classList.add('hidden');
        document.getElementById('compilation-actions-deck').classList.remove('flex');
        evaluatePresentationButtonState();
        return;
    }

    document.getElementById('empty-sandbox-state').classList.add('hidden');
    document.getElementById('compilation-actions-deck').classList.remove('hidden');
    document.getElementById('compilation-actions-deck').classList.add('flex');

    retainedPageFramesRecordsCache.forEach((pageItem) => {
        const cardNode = document.createElement('div');
        cardNode.className = "page-thumbnail-card bg-slate-900 border border-slate-800/80 rounded-2xl p-2 flex flex-col gap-2 relative animate-fade-in";
        cardNode.setAttribute('data-id', pageItem.originalPageIndex);
        
        cardNode.innerHTML = `
            <div class="relative w-full aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-900/60 select-none">
                <img src="${pageItem.dataUrl}" class="w-full h-full object-contain" alt="Page Matrix">
            </div>
            <div class="flex items-center justify-between px-1 py-0.5">
                <span class="text-xs font-mono font-bold text-[#ff2a5f] bg-[#ff2a5f]/5 border border-[#ff2a5f]/20 px-2.5 py-0.5 rounded-md">Page ${pageItem.originalPageIndex + 1}</span>
                <button onclick="removeIndividualPageFrameItem(${pageItem.originalPageIndex}, this)" class="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 border border-red-500/20 transition-all flex items-center justify-center text-xs cursor-pointer" title="Remove page out of sequencing matrix tracks">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        gridRoot.appendChild(cardNode);
    });

    evaluatePresentationButtonState();
}

function removeIndividualPageFrameItem(originalPageIdx, btnNode) {
    const associatedCard = btnNode.closest('.page-thumbnail-card');
    associatedCard.style.opacity = "0";
    associatedCard.style.transform = "scale(0.9) translateY(10px)";
    
    setTimeout(() => {
        retainedPageFramesRecordsCache = retainedPageFramesRecordsCache.filter(item => item.originalPageIndex !== originalPageIdx);
        syncStagingUIBlocksView();
    }, 200);
}

function stagedCountUpdate() {
    document.getElementById('staged-count-lbl').innerText = retainedPageFramesRecordsCache.length;
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (retainedPageFramesRecordsCache.length > 0) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#ff2a5f] to-rose-500 hover:from-rose-400 hover:to-rose-300 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in";
        badge.classList.add('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('hidden');
        badge.classList.remove('hidden');
    }
}

/* -------------------------------------------------------------------------
    * CRISP HIGH-RESOLUTION PRESENTATION PIPELINE CONTROLLERS
    * ------------------------------------------------------------------------- */
function toggleFullscreenPresentation() {
    if (retainedPageFramesRecordsCache.length === 0) return;
    activeSlideshowIndexTracker = 0;
    
    const deck = document.getElementById('presentation-slideshow-deck');
    deck.classList.remove('hidden');
    
    renderActiveSlideshowVectorFrame();
    
    if (deck.requestFullscreen) {
        deck.requestFullscreen();
    }
}

async function renderActiveSlideshowVectorFrame() {
    const canvas = document.getElementById('presentation-vector-canvas');
    const counter = document.getElementById('presentation-counter-lbl');
    
    if (!retainedPageFramesRecordsCache[activeSlideshowIndexTracker] || !activePdfEngineRenderInstance || !canvas) return;
    
    const targetPageIndex = retainedPageFramesRecordsCache[activeSlideshowIndexTracker].originalPageIndex;
    counter.innerText = "Vectorizing Sheet lines...";
    const ctx = canvas.getContext('2d');

    try {
        const pageObj = await activePdfEngineRenderInstance.getPage(targetPageIndex + 1);
        // Sharp high-density rasterization scaling multiplier factor
        const viewport = pageObj.getViewport({ scale: 1.5 });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        await pageObj.render({ canvasContext: ctx, viewport: viewport }).promise;
        counter.innerText = `Sheet ${activeSlideshowIndexTracker + 1} / ${retainedPageFramesRecordsCache.length} (Index: ${targetPageIndex + 1})`;
    } catch (err) {
        console.error("Presentation deck runtime tracking fault:", err);
        counter.innerText = "Error Processing Target Frame";
    }
}

function navigatePresentationSlideshow(deltaShift) {
    let tentativePos = activeSlideshowIndexTracker + deltaShift;
    if (tentativePos >= 0 && tentativePos < retainedPageFramesRecordsCache.length) {
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

async function executeReconstructedPDFExport() {
    if (!originalFileArrayBufferCache || retainedPageFramesRecordsCache.length === 0) return;

    showProcessingOverlay("Reconstructing Document Map", "Stripping dictionary reference indices entries... ");
    const statusLabel = document.getElementById('overlay-status-label');

    let customOutputName = document.getElementById('pdf-output-filename').value.trim().replace(/\s+/g, '_');
    if(!customOutputName) customOutputName = "reconstructed_package";

    setTimeout(async function() {
        try {
            const { PDFDocument } = PDFLib;
            const sourceDoc = await PDFDocument.load(originalFileArrayBufferCache);
            const modifiedDoc = await PDFDocument.create();

            statusLabel.innerText = "Slicing, packing and transferring structural vector components channels...";

            const extractionIndicesArray = retainedPageFramesRecordsCache.map(item => item.originalPageIndex);
            const copiedPagesCollection = await modifiedDoc.copyPages(sourceDoc, extractionIndicesArray);

            copiedPagesCollection.forEach(page => modifiedDoc.addPage(page));

            statusLabel.innerText = "Encrypting compiled binary tracking blocks...";
            const processedBytesUint8Array = await modifiedDoc.save();
            const outputBlobStream = new Blob([processedBytesUint8Array], { type: 'application/pdf' });

            const anchorElement = document.createElement('a');
            anchorElement.download = `${customOutputName}.pdf`;
            anchorElement.href = URL.createObjectURL(outputBlobStream);
            document.body.appendChild(anchorElement);
            
            anchorElement.click();
            document.body.removeChild(anchorElement);

        } catch (fatalError) {
            console.error("Reconstruction array breakdown caught:", fatalError);
            alert("Reconstructed Pipeline Error: Fault processing localized binary object sequences indices.");
        } finally {
            hideProcessingOverlay();
        }
    }, 350);
}

function purgeActiveRemovalPipeline() {
    window.location.reload();
}