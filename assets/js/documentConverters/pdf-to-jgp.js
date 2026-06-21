
let extractedPagesBlobUrlCache = [];
let globalStagedPdfDocumentPayload = null;
let compilationPipelineIsReady = false;

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

    if (globalStagedPdfDocumentPayload) {
        convertBtn.disabled = false;
        convertBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5";
    }

    if (compilationPipelineIsReady && extractedPagesBlobUrlCache.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
    } else {
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[40px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
    }
}

async function loadPDFDocumentToRasterPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    const pdfFile = inputElement.files[0];

    if (pdfFile.type !== "application/pdf") {
        alert("Staging Error: Chosen format element layer mismatch. Please select a valid document .pdf file asset.");
        return;
    }

    purgeActiveExtractorPipeline();

    const fileReaderInstance = new FileReader();
    readerObjPromiseWrapper(fileReaderInstance, pdfFile)
        .then(async (arrayBufferPayload) => {
            globalStagedPdfDocumentPayload = await pdfjsLib.getDocument({ data: arrayBufferPayload }).promise;
            
            document.getElementById('extraction-total-lbl').innerText = globalStagedPdfDocumentPayload.numPages;
            document.getElementById('extraction-actions-deck').classList.remove('hidden');
            document.getElementById('extraction-actions-deck').classList.add('flex');

            evaluateActionsButtonStates();
        })
        .catch(err => {
            console.error(err);
            alert("Pipeline Matrix Error staging core binary definitions arrays.");
        });

    inputElement.value = "";
}

async function executeRasterConversionProcess() {
    if (!globalStagedPdfDocumentPayload) return;
    
    compilationPipelineIsReady = false;
    extractedPagesBlobUrlCache = [];
    
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';

    showProcessingOverlay("Rasterizing Asset Layers", "Parsing structural elements map variables blocks...");

    setTimeout(async () => {
        try {
            const totalDocumentPagesCount = globalStagedPdfDocumentPayload.numPages;
            const qualityScaleFactor = parseFloat(document.getElementById('raster-dpi-scale').value);

            for (let pageNum = 1; pageNum <= totalDocumentPagesCount; pageNum++) {
                updateProcessingOverlayStatus(`Rendering page snapshot element bounds matrix (${pageNum} / ${totalDocumentPagesCount})...`);
                
                const pageDataNode = await globalStagedPdfDocumentPayload.getPage(pageNum);
                const baseViewportOrientation = pageDataNode.getViewport({ scale: qualityScaleFactor });

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = baseViewportOrientation.width;
                offscreenCanvas.height = baseViewportOrientation.height;
                const canvasRenderingCtx = offscreenCanvas.getContext('2d');

                const renderContextTaskContext = {
                    canvasContext: canvasRenderingCtx,
                    viewport: baseViewportOrientation
                };

                await pageDataNode.render(renderContextTaskContext).promise;

                const dataUrlStringValue = offscreenCanvas.toDataURL('image/jpeg', 0.92);
                extractedPagesBlobUrlCache.push({
                    pageNumber: pageNum,
                    dataUrl: dataUrlStringValue
                });

                const cardElementNode = document.createElement('div');
                cardElementNode.className = "page-raster-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-2 flex flex-col gap-2 relative animate-fade-in";
                cardElementNode.innerHTML = `
                    <div onclick="triggerLightboxModalViewport('${dataUrlStringValue}', ${pageNum})" class="relative w-full invert-0 aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-900 cursor-zoom-in" title="Click to view full size">
                        <img src="${dataUrlStringValue}" class="w-full h-full object-contain" alt="Page Frame">
                    </div>
                    <div class="flex items-center justify-between px-1 py-0.5">
                        <span class="text-xs font-mono font-bold text-teal-400 bg-slate-950 border border-slate-800/80 px-2.5 py-0.5 rounded-md">Page ${pageNum}</span>
                        <button id="single-dl-btn-${pageNum}" onclick="downloadSingleExtractedJpgPage(${pageNum})" class="w-6 h-6 rounded-lg bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 border border-teal-500/20 transition-all flex items-center justify-center text-xs cursor-pointer">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </div>
                `;
                gridRoot.appendChild(cardElementNode);
            }

            compilationPipelineIsReady = true;
            evaluatePresentationButtonState();
        } catch(err) {
            console.error(err);
            alert("Failure executing graphic allocation loops mapping rules context.");
        } finally {
            await hideProcessingOverlay();
            evaluateActionsButtonStates();
        }
    }, 300);
}

function downloadSingleExtractedJpgPage(pageIdx) {
    const matchedAssetData = extractedPagesBlobUrlCache.find(item => item.pageNumber === pageIdx);
    if (!matchedAssetData) return;

    const btnNode = document.getElementById(`single-dl-btn-${pageIdx}`);
    
    if (btnNode) {
        btnNode.classList.add('scale-90');
        btnNode.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i>`;
    }

    setTimeout(() => {
        const namePatternPrefix = document.getElementById('raster-name-prefix').value.trim() || "fusionmint_page";
        
        const linkAnchorNode = document.createElement('a');
        linkAnchorNode.download = `${namePatternPrefix}_${pageIdx}.jpg`;
        linkAnchorNode.href = matchedAssetData.dataUrl;
        document.body.appendChild(linkAnchorNode);
        linkAnchorNode.click();
        document.body.removeChild(linkAnchorNode);

        if (btnNode) {
            btnNode.classList.remove('scale-90');
            btnNode.innerHTML = `<i class="fa-solid fa-download"></i>`;
        }
    }, 600);
}

async function downloadAllExtractedJpgPages() {
    if (extractedPagesBlobUrlCache.length === 0 || !compilationPipelineIsReady) return;
    
    const mainDlBtn = document.getElementById('download-btn');
    const iconContainer = document.getElementById('main-dl-icon-container');

    if (mainDlBtn && iconContainer) {
        mainDlBtn.classList.add('scale-[0.97]');
        iconContainer.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin text-xs"></i> Packaging Stream...`;
    }
    
    setTimeout(() => {
        showProcessingOverlay("Packaging ZIP Archive", "Packaging image payload blocks into a downloadable package file...");
        
        setTimeout(() => {
            try {
                const zip = new JSZip();
                const namePatternPrefix = document.getElementById('raster-name-prefix').value.trim() || "fusionmint_page";
                
                extractedPagesBlobUrlCache.forEach(item => {
                    const rawBase64Data = item.dataUrl.split(',')[1];
                    zip.file(`${namePatternPrefix}_${item.pageNumber}.jpg`, rawBase64Data, { base64: true });
                });
                
                zip.generateAsync({ type: "blob" }).then(async function(contentBlob) {
                    const linkAnchorNode = document.createElement('a');
                    linkAnchorNode.download = `${namePatternPrefix}_archive.zip`;
                    linkAnchorNode.href = URL.createObjectURL(contentBlob);
                    document.body.appendChild(linkAnchorNode);
                    linkAnchorNode.click();
                    document.body.removeChild(linkAnchorNode);
                    
                    await hideProcessingOverlay();

                    if (mainDlBtn && iconContainer) {
                        mainDlBtn.classList.remove('scale-[0.97]');
                        iconContainer.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download All Pages (.ZIP)`;
                    }
                });
            } catch (err) {
                console.error(err);
                alert("ZIP Packaging Error compiling target archive files.");
                hideProcessingOverlay();
                if (mainDlBtn && iconContainer) {
                    mainDlBtn.classList.remove('scale-[0.97]');
                    iconContainer.innerHTML = `<i class="fa-solid fa-file-zipper text-xs"></i> Download All Pages (.ZIP)`;
                }
            }
        }, 300);
    }, 600);
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (extractedPagesBlobUrlCache.length > 0) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in";
        badge.classList.add('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('hidden');
        badge.classList.remove('hidden');
    }
}

function toggleFullscreenPresentation() {
    const targetElement = document.getElementById('presentation-viewport-container');
    const trackingSubframe = document.getElementById('presentation-viewport-subframe');
    const scrollingTrack = document.getElementById('manifest-scroll-track');
    const dropzone = document.getElementById('pdf-drop-zone');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            dropzone.classList.add('hidden');
            targetElement.classList.remove('gap-4');
            trackingSubframe.classList.remove('border', 'bg-slate-950/30', 'p-5');
            trackingSubframe.classList.add('bg-[#02040a]', 'p-8');
            scrollingTrack.classList.remove('h-[42vh]');
            scrollingTrack.classList.add('h-[90vh]');
            document.getElementById('manifest-title-lbl').classList.add('text-teal-400');
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const targetElement = document.getElementById('presentation-viewport-container');
    const trackingSubframe = document.getElementById('presentation-viewport-subframe');
    const scrollingTrack = document.getElementById('manifest-scroll-track');
    const dropzone = document.getElementById('pdf-drop-zone');
    
    if (!document.fullscreenElement) {
        dropzone.classList.remove('hidden');
        targetElement.classList.add('gap-4');
        trackingSubframe.classList.add('border', 'bg-slate-950/30', 'p-5');
        trackingSubframe.classList.remove('bg-[#02040a]', 'p-8');
        scrollingTrack.classList.add('h-[42vh]');
        scrollingTrack.classList.remove('h-[90vh]');
        document.getElementById('manifest-title-lbl').classList.remove('text-teal-400');
    }
});

window.addEventListener('keydown', function(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

function triggerLightboxModalViewport(imageSrcData, pageIndex) {
    const modal = document.getElementById('lightbox-modal-window');
    document.getElementById('lightbox-preview-node-img').src = imageSrcData;
    document.getElementById('lightbox-index-badge').innerText = `Extracted Document Page // Frame ${pageIndex}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.add('hidden');
    document.getElementById('lightbox-modal-window').classList.remove('flex');
}

function readerObjPromiseWrapper(readerInstance, fileObj) {
    return new Promise((resolve, reject) => {
        readerInstance.onload = () => resolve(readerInstance.result);
        readerInstance.onerror = () => reject(readerInstance.error);
        readerInstance.readAsArrayBuffer(fileObj);
    });
}

function purgeActiveExtractorPipeline() {
    extractedPagesBlobUrlCache = [];
    globalStagedPdfDocumentPayload = null;
    compilationPipelineIsReady = false;
    
    const gridRoot = document.getElementById('rasterized-pages-output-grid');
    gridRoot.innerHTML = '';
    
    const emptyTemplateNode = document.createElement('div');
    emptyTemplateNode.id = "empty-raster-grid-state";
    emptyTemplateNode.className = "col-span-full py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5 select-none";
    emptyTemplateNode.innerHTML = `
        <i class="fa-solid fa-images text-2xl mb-1 text-slate-600"></i>
        <span class="text-xs font-medium">No active PDF matrix staged for image distribution conversion frames.</span>
    `;
    gridRoot.appendChild(emptyTemplateNode);

    document.getElementById('extraction-actions-deck').classList.add('hidden');
    document.getElementById('extraction-actions-deck').classList.remove('flex');
    
    evaluatePresentationButtonState();
}