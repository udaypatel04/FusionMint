
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

var loadedRawPdfArrayBufferCache = null;
var pdfjsDocumentInstance = null;
var activeSimulatorFocusedPageIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('matrix-processing-overlay');
    if(overlay) overlay.classList.add('hidden');

    // HARDWARE KEYBOARD LISTENERS FOR HOTKEY NAVIGATION CONTROL
    window.addEventListener('keydown', function(e) {
        if (!pdfjsDocumentInstance) return;
        if (e.key === 'ArrowLeft') {
            navigateSimulatorPageFrames(-1);
        } else if (e.key === 'ArrowRight') {
            navigateSimulatorPageFrames(1);
        }
    });
});

function loadPdfToPipelineOrchestrator(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    var targetFile = inputNode.files[0];

    document.getElementById('processing-loader-indicator').className = 'flex items-center gap-2 text-xs font-bold text-orange-400 tracking-widest font-mono';

    var fileReader = new FileReader();
    fileReader.onload = function(e) {
        loadedRawPdfArrayBufferCache = e.target.result;
        var bufferInstanceClone = loadedRawPdfArrayBufferCache.slice(0);

        pdfjsLib.getDocument({ data: bufferInstanceClone }).promise.then(function(pdfDoc) {
            pdfjsDocumentInstance = pdfDoc;
            activeSimulatorFocusedPageIndex = 0;

            document.getElementById('processing-loader-indicator').className = 'hidden';
            document.getElementById('empty-buffer-list-state').className = 'hidden';
            
            document.getElementById('simulator-empty-callout').className = 'hidden';
            document.getElementById('simulator-raster-frame').className = 'w-full h-full relative flex items-center justify-center';
            document.getElementById('simulator-pagination-deck').className = 'flex items-center gap-3 bg-slate-950/60 border border-slate-900 px-4 py-2 rounded-xl text-xs font-mono font-bold select-none z-30 relative';

            document.getElementById('range-parameters-wrapper').className = 'flex flex-col gap-3 animate-fade-in';
            document.getElementById('analytics-metrics-panel').className = 'flex w-full flex-col gap-3.5 animate-fade-in pt-1';
            document.getElementById('compilation-actions-deck').className = 'flex flex-col gap-3 pt-4 border-t border-slate-900 shrink-0';

            var originalInputName = targetFile.name;
            var baselineSanitizedName = originalInputName.substring(0, originalInputName.lastIndexOf('.')) || originalInputName;
            var spaceSanitizedUnderscoreName = baselineSanitizedName.replace(/\s+/g, '_');
            document.getElementById('pdf-output-filename').value = spaceSanitizedUnderscoreName + '_split';

            document.getElementById('split-start-page').value = 1;
            document.getElementById('split-end-page').value = pdfjsDocumentInstance.numPages;
            document.getElementById('split-start-page').max = pdfjsDocumentInstance.numPages;
            document.getElementById('split-end-page').max = pdfjsDocumentInstance.numPages;

            document.getElementById('metrics-filename-lbl').innerText = originalInputName;
            document.getElementById('metrics-size-lbl').innerText = 'Size File Track: ' + (targetFile.size / 1024).toFixed(1) + ' KB';
            document.getElementById('metrics-pages-lbl').innerText = 'Total Pages Found: ' + pdfjsDocumentInstance.numPages + ' Sheets';

            renderActivePdfPagePreviewCanvas();
            evaluatePresentationButtonState();
        }).catch(function(err) {
            console.error(err);
            alert("PDF Framework Parser Break: Invalid array signature context.");
            purgeActivePdfPipeline();
        });
    };
    fileReader.readAsArrayBuffer(targetFile);
    inputNode.value = "";
}

async function renderActivePdfPagePreviewCanvas() {
    if (!pdfjsDocumentInstance) return;
    
    var page = await pdfjsDocumentInstance.getPage(activeSimulatorFocusedPageIndex + 1);
    var canvas = document.getElementById('pdf-render-canvas');
    var ctx = canvas.getContext('2d');
    
    // Render scaling calculations matching the layout viewport constraints
    var unscaledViewport = page.getViewport({ scale: 1.0 });
    var simulatorContainer = document.getElementById('pdf-paper-sheet-simulator');
    
    // Dynamic width scale configuration to widen presentation bounds safely
    var scaleFactor = (simulatorContainer.clientWidth) / unscaledViewport.width;
    if (document.fullscreenElement) {
        scaleFactor = (window.innerHeight * 0.9) / unscaledViewport.height;
    }
    var viewport = page.getViewport({ scale: scaleFactor });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    var flPrev = document.getElementById('floating-prev');
    var flNext = document.getElementById('floating-next');

    if (pdfjsDocumentInstance.numPages > 1) {
        flPrev.classList.replace('hidden', 'flex');
        flNext.classList.replace('hidden', 'flex');
    } else {
        flPrev.classList.replace('flex', 'hidden');
        flNext.classList.replace('flex', 'hidden');
    }

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('simulator-page-index-label').innerText = 'Page ' + (activeSimulatorFocusedPageIndex + 1) + ' / ' + pdfjsDocumentInstance.numPages;
}

function navigateSimulatorPageFrames(stepDirection) {
    if (!pdfjsDocumentInstance) return;
    var nextIndex = activeSimulatorFocusedPageIndex + stepDirection;
    if (nextIndex >= 0 && nextIndex < pdfjsDocumentInstance.numPages) {
        activeSimulatorFocusedPageIndex = nextIndex;
        renderActivePdfPagePreviewCanvas();
    }
}

function validateInputPageRanges() {
    if (!pdfjsDocumentInstance) return;
    var startInput = document.getElementById('split-start-page');
    var endInput = document.getElementById('split-end-page');

    var startVal = parseInt(startInput.value) || 1;
    var endVal = parseInt(endInput.value) || 1;
    var totalPages = pdfjsDocumentInstance.numPages;

    if (startVal < 1) startInput.value = 1;
    if (startVal > totalPages) startInput.value = totalPages;
    if (endVal < 1) endInput.value = 1;
    if (endVal > totalPages) endInput.value = totalPages;
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (pdfjsDocumentInstance) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 transition-all";
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
    const dropzone = document.getElementById('pdf-drop-zone');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            if(dropzone) dropzone.classList.add('hidden');
            targetElement.classList.remove('p-6', 'bg-slate-950/10', 'border');
            targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
            sheet.classList.remove('max-w-[280px]', 'sm:max-w-[340px]', 'max-h-[52vh]', 'mt-6');
            sheet.classList.add('max-w-none', 'mt-0', 'h-[92vh]', 'w-auto');
            document.getElementById('manifest-title-lbl').classList.add('text-orange-400');
            renderActivePdfPagePreviewCanvas();
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
        if(dropzone) dropzone.classList.remove('hidden');
        targetElement.classList.add('p-6', 'bg-slate-950/10', 'border');
        targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.add('max-w-[280px]', 'sm:max-w-[340px]', 'max-h-[52vh]', 'mt-6');
        sheet.classList.remove('max-w-none', 'mt-0', 'h-[92vh]', 'w-auto');
        document.getElementById('manifest-title-lbl').classList.remove('text-orange-400');
        renderActivePdfPagePreviewCanvas();
    }
});

function purgeActivePdfPipeline() {
    loadedRawPdfArrayBufferCache = null;
    pdfjsDocumentInstance = null;
    activeSimulatorFocusedPageIndex = 0;

    var canvas = document.getElementById('pdf-render-canvas');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementById('simulator-empty-callout').className = 'w-full h-full text-center text-slate-400 flex flex-col items-center justify-center gap-1.5 select-none p-4 my-auto';
    document.getElementById('simulator-raster-frame').className = 'hidden';
    document.getElementById('simulator-pagination-deck').className = 'hidden';
    
    document.getElementById('floating-prev').classList.replace('flex', 'hidden');
    document.getElementById('floating-next').classList.replace('flex', 'hidden');

    document.getElementById('range-parameters-wrapper').className = 'hidden';
    document.getElementById('analytics-metrics-panel').className = 'hidden';
    document.getElementById('compilation-actions-deck').className = 'hidden';
    document.getElementById('empty-buffer-list-state').className = 'py-16 flex flex-col items-center justify-center text-slate-600 gap-1.5 select-none my-auto';
    document.getElementById('processing-loader-indicator').className = 'hidden';
    document.getElementById('pdf-output-filename').value = "sliced_document_export";
    
    evaluatePresentationButtonState();
}

function executePdfSliceOperation() {
    if (!loadedRawPdfArrayBufferCache || !pdfjsDocumentInstance) return;

    var startIdx = parseInt(document.getElementById('split-start-page').value) - 1;
    var endIdx = parseInt(document.getElementById('split-end-page').value);
    var totalPages = pdfjsDocumentInstance.numPages;

    if (isNaN(startIdx) || isNaN(endIdx) || startIdx < 0 || endIdx > totalPages || startIdx >= endIdx) {
        alert("Staging Range Violation: Correct your start and end boundaries.");
        return;
    }

    var overlay = document.getElementById('matrix-processing-overlay');
    var statusLabel = document.getElementById('overlay-status-label');
    
    overlay.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center gap-4 select-none';
    statusLabel.innerText = "Initializing localized pdf-lib byte space orchestrator...";

    var customOutputName = document.getElementById('pdf-output-filename').value.trim().replace(/\s+/g, '_');
    if(!customOutputName) customOutputName = "sliced_document_export";

    setTimeout(async function() {
        try {
            var sourceDocument = await PDFLib.PDFDocument.load(loadedRawPdfArrayBufferCache);
            var slicedOutputDocument = await PDFLib.PDFDocument.create();

            statusLabel.innerText = "Isolating canvas headers and copying encrypted page vectors...";
            
            var targetPagesIndicesArray = [];
            for (var i = startIdx; i < endIdx; i++) {
                targetPagesIndicesArray.push(i);
            }

            var copiedPagesArray = await slicedOutputDocument.copyPages(sourceDocument, targetPagesIndicesArray);
            copiedPagesArray.forEach(function(copiedPageNode) {
                slicedOutputDocument.addPage(copiedPageNode);
            });

            statusLabel.innerText = "Re-stamping structural compression metadata filters...";
            var compiledPdfBinaryBytes = await slicedOutputDocument.save();

            var outputBlobStream = new Blob([compiledPdfBinaryBytes], { type: 'application/pdf' });
            var anchorNode = document.createElement('a');
            anchorNode.download = customOutputName + '.pdf';
            anchorNode.href = URL.createObjectURL(outputBlobStream);
            
            document.body.appendChild(anchorNode);
            anchorNode.click();
            document.body.removeChild(anchorNode);

        } catch (fatalProcessingError) {
            console.error("Vector splitter system breakdown caught:", fatalProcessingError);
            alert("Slicer Engine Failure: Error parsing localized streams.");
        } finally {
            overlay.className = 'hidden';
        }
    }, 400);
}