
let loadedTargetWordBinaryCache = null;
let convertedHtmlDocumentStringValue = "";
let compiledPlainStringValue = "";

document.addEventListener('DOMContentLoaded', () => {
    hideProcessingOverlay();
});

function showProcessingOverlay(title = "Minting Document Framework", subtitle = "Compiling localized vector paths...") {
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
    const overlay = document.getElementById('matrix-processing-overlay');
    if (overlay) overlay.classList.remove('active');
}

function loadWordDocumentToPipeline(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const wordFile = inputNode.files[0];

    showProcessingOverlay("Processing Document Layers", "Deconstructing XML component streams...");

    const fileReaderInstance = new FileReader();
    fileReaderInstance.onload = function(e) {
        loadedTargetWordBinaryCache = e.target.result;

        mammoth.extractRawText({ arrayBuffer: loadedTargetWordBinaryCache.slice(0) })
            .then(function(textResult) {
                compiledPlainStringValue = textResult.value;
            });

        mammoth.convertToHtml({ arrayBuffer: loadedTargetWordBinaryCache.slice(0) })
            .then(function(result) {
                convertedHtmlDocumentStringValue = result.value;

                document.getElementById('word-rendered-content').innerHTML = convertedHtmlDocumentStringValue;

                document.getElementById('empty-buffer-list-state').classList.add('hidden');
                document.getElementById('simulator-empty-callout').classList.add('hidden');
                document.getElementById('simulator-raster-frame').classList.remove('hidden');
                document.getElementById('simulator-info-badge').classList.remove('hidden');
                document.getElementById('simulator-info-badge').classList.add('flex');

                document.getElementById('analytics-metrics-panel').classList.remove('hidden');
                document.getElementById('analytics-metrics-panel').classList.add('flex');
                document.getElementById('compilation-actions-deck').classList.remove('hidden');
                document.getElementById('compilation-actions-deck').classList.add('flex');

                const originalInputName = wordFile.name;
                const baselineSanitizedName = originalInputName.substring(0, originalInputName.lastIndexOf('.')) || originalInputName;
                const spaceSanitizedUnderscoreName = baselineSanitizedName.replace(/\s+/g, '_');
                document.getElementById('pdf-output-filename').value = `${spaceSanitizedUnderscoreName}_word_to_pdf`;

                document.getElementById('metrics-filename-lbl').innerText = originalInputName;
                document.getElementById('metrics-size-lbl').innerText = `Size File Track: ${(wordFile.size / 1024).toFixed(1)} KB`;
                
                evaluatePresentationButtonState();
            })
            .catch(function(err) {
                console.error(err);
                alert("Pipeline XML Parser Exception: File conversion layout failure.");
                purgeActiveWordPipeline();
            })
            .finally(function() {
                hideProcessingOverlay();
            });
    };
    fileReaderInstance.readAsArrayBuffer(wordFile);
    inputNode.value = "";
}

function purgeActiveWordPipeline() {
    loadedTargetWordBinaryCache = null;
    convertedHtmlDocumentStringValue = "";
    compiledPlainStringValue = "";

    document.getElementById('word-rendered-content').innerHTML = "";

    document.getElementById('simulator-empty-callout').classList.remove('hidden');
    document.getElementById('simulator-raster-frame').classList.add('hidden');
    document.getElementById('simulator-info-badge').classList.add('hidden');
    document.getElementById('simulator-info-badge').classList.remove('flex');

    document.getElementById('analytics-metrics-panel').classList.add('hidden');
    document.getElementById('analytics-metrics-panel').classList.remove('flex');
    document.getElementById('compilation-actions-deck').classList.add('hidden');
    document.getElementById('compilation-actions-deck').classList.remove('flex');
    document.getElementById('empty-buffer-list-state').classList.remove('hidden');
    document.getElementById('pdf-output-filename').value = "original_word_to_pdf";
    
    evaluatePresentationButtonState();
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (loadedTargetWordBinaryCache) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 animate-fade-in";
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
    const frame = document.getElementById('simulator-raster-frame');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            targetElement.classList.remove('p-6', 'bg-slate-950/10', 'border');
            targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
            sheet.classList.remove('max-w-[320px]', 'mt-6');
            sheet.classList.add('max-w-[70vh]', 'mt-0', 'p-10', 'h-[90vh]');
            frame.classList.remove('no-scrollbar');
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const frame = document.getElementById('simulator-raster-frame');
    if (!document.fullscreenElement) {
        targetElement.classList.add('p-6', 'bg-slate-950/10', 'border');
        targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.add('max-w-[320px]', 'mt-6');
        sheet.classList.remove('max-w-[70vh]', 'mt-0', 'p-10', 'h-[90vh]');
        frame.classList.add('no-scrollbar');
    }
});

window.addEventListener('keydown', function(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

function executeDirectWordToPdfCompilation() {
    if (!compiledPlainStringValue && !convertedHtmlDocumentStringValue) return;

    showProcessingOverlay("Minting Document Framework", "Deconstructing XML blueprints...");
    const statusLabel = document.getElementById('overlay-status-label');

    let customOutputName = document.getElementById('pdf-output-filename').value.trim().replace(/\s+/g, '_');
    if(!customOutputName) customOutputName = "original_word_to_pdf";

    setTimeout(() => {
        try {
            statusLabel.innerText = "Allocating vector tracking matrices...";
            
            const { jsPDF } = window.jspdf;
            const pdfDocument = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
                compress: true
            });

            const sourceContentRows = compiledPlainStringValue || document.getElementById('word-rendered-content').innerText;
            const processingWrappedLinesArray = pdfDocument.splitTextToSize(sourceContentRows, 515);
            
            let coordinateCursorY = 50;
            const dynamicPageHeightLimitBound = 775;

            pdfDocument.setFont("Helvetica", "normal");
            pdfDocument.setFontSize(11);

            statusLabel.innerText = "Writing high-fidelity typography paths...";

            for (let i = 0; i < processingWrappedLinesArray.length; i++) {
                if (coordinateCursorY > dynamicPageHeightLimitBound) {
                    pdfDocument.addPage();
                    coordinateCursorY = 50; 
                }
                pdfDocument.text(processingWrappedLinesArray[i], 45, coordinateCursorY);
                coordinateCursorY += 16; 
            }

            statusLabel.innerText = "Minting container binary blocks...";
            pdfDocument.save(`${customOutputName}.pdf`);

        } catch (fatalProcessingError) {
            console.error("Vector generator pipeline break:", fatalProcessingError);
            alert("Runtime Failure: Word streaming error.");
        } finally {
            hideProcessingOverlay();
        }
    }, 400);
}