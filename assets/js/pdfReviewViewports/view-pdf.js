let currentActivePDFjsDocumentCache = null;
let globalStagedBytesPayloadArray = null;
let currentViewportScaleRatio = 0.65; 
let totalPagesInStagedDocument = 0;
let currentManualTrackedPageIndex = 1;

// Native keyboard macro triggers tracking setup loops
window.addEventListener('keydown', function(event) {
    if (!globalStagedBytesPayloadArray) return;

if (event.key === "ArrowLeft" || event.key === "<" || event.key === ",") {
        navigateViewerManualPageSteps(document.fullscreenElement ? -2 : -1);
    } else if (event.key === "ArrowRight" || event.key === ">" || event.key === ".") {
        navigateViewerManualPageSteps(document.fullscreenElement ? 2 : 1);
    }
});

// Smart Cursor tracking mechanics to hide/show controls dock while keeping side arrows always on
const bookSpreadViewport = document.getElementById('fullscreen-book-spread-viewport');
bookSpreadViewport.addEventListener('mousemove', (e) => {
    if (!document.fullscreenElement) return;

    const bounds = bookSpreadViewport.getBoundingClientRect();
    const distancePercentFromTop = ((e.clientY - bounds.top) / bounds.height) * 100;
    const dock = document.getElementById('hud-dock-bottom');

    // If the mouse cursor slides into the lower 25% boundary region, reveal bottom dock
    if (distancePercentFromTop > 75) {
        dock.classList.add('show-hud');
    } else {
        dock.classList.remove('show-hud');
    }
});

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

async function loadPDFDocumentIntoViewerPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    const pdfFile = inputElement.files[0];

    if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
        alert("Staging Error: Element layer configuration mismatch. Please supply a valid .pdf file asset.");
        return;
    }

    showProcessingOverlay("Decompressing File Payload", "Caching stream allocations entries vectors...");

    const fileReaderInstance = new FileReader();
    fileReaderInstance.onload = async function(e) {
        try {
            globalStagedBytesPayloadArray = new Uint8Array(e.target.result);
            document.getElementById('empty-sandbox-state').classList.add('hidden');
            
            document.getElementById('metrics-filename-lbl').innerText = pdfFile.name;
            document.getElementById('metrics-size-lbl').innerText = `Size File Track: ${(pdfFile.size / 1024).toFixed(1)} KB`;

            currentManualTrackedPageIndex = 1;
            await compileAndRenderViewerStream();

            document.getElementById('zoom-controls-wrapper').classList.replace('hidden', 'flex');
            document.getElementById('navigation-tracker-wrapper').classList.replace('hidden', 'flex');
            document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');

            evaluatePresentationButtonState();

        } catch (err) {
            console.error("PDF Parsing Failure intercept:", err);
            alert("Framework Translation Fault: Unrecognized binary object map tracks parsing layout context.");
            purgeActiveViewerPipeline();
        } finally {
            hideProcessingOverlay();
        }
    };
    fileReaderInstance.readAsArrayBuffer(pdfFile);
    inputElement.value = "";
}

async function compileAndRenderViewerStream() {
    if (!globalStagedBytesPayloadArray) return;

    document.getElementById('lbl-zoom-percent').innerText = `${Math.round(currentViewportScaleRatio * 100)}%`;
    document.getElementById('lbl-fullscreen-zoom').innerText = `${Math.round(currentViewportScaleRatio * 100)}%`;

    if (document.fullscreenElement) {
        await syncFullscreenBookSpreadElements();
        return;
    }

    const scrollTrackRoot = document.getElementById('manifest-scroll-track');
    scrollTrackRoot.querySelectorAll('.page-viewport-card').forEach(node => node.remove());

    currentActivePDFjsDocumentCache = await pdfjsLib.getDocument({ data: globalStagedBytesPayloadArray.slice(0) }).promise;
    totalPagesInStagedDocument = currentActivePDFjsDocumentCache.numPages;

    document.getElementById('lbl-page-index').innerText = `${currentManualTrackedPageIndex} / ${totalPagesInStagedDocument}`;
    
    document.getElementById('input-page-jump').max = totalPagesInStagedDocument;
    document.getElementById('input-fullscreen-page-jump').max = totalPagesInStagedDocument;

    for (let pageNum = 1; pageNum <= totalPagesInStagedDocument; pageNum++) {
        updateProcessingOverlayStatus(`Rasterizing continuous viewport elements: Page ${pageNum} of ${totalPagesInStagedDocument}...`);
        
        const pageDataNode = await currentActivePDFjsDocumentCache.getPage(pageNum);
        
        const containerSubframeWidth = document.getElementById('presentation-viewport-subframe').clientWidth;
        const standardScale = (containerSubframeWidth * 0.7) / pageDataNode.getViewport({ scale: 1.0 }).width;
        const appliedViewportScale = standardScale * currentViewportScaleRatio;

        const viewport = pageDataNode.getViewport({ scale: appliedViewportScale });

        const outerCardWrapper = document.createElement('div');
        outerCardWrapper.className = "page-viewport-card bg-white border border-slate-950/40 p-2 rounded-xl relative shrink-0 shadow-2xl flex flex-col items-center select-none";
        outerCardWrapper.id = `viewport-card-page-${pageNum}`;
        outerCardWrapper.setAttribute('data-page-num', pageNum);

        const renderCanvasNode = document.createElement('canvas');
        renderCanvasNode.width = viewport.width;
        renderCanvasNode.height = viewport.height;
        renderCanvasNode.style.width = `${viewport.width}px`;
        renderCanvasNode.style.height = `${viewport.height}px`;
        
        const ctx = renderCanvasNode.getContext('2d');
        await pageDataNode.render({ canvasContext: ctx, viewport: viewport }).promise;

        outerCardWrapper.appendChild(renderCanvasNode);
        scrollTrackRoot.appendChild(outerCardWrapper);
    }

    setupScrollPositionIndexObserver();
}

function setupScrollPositionIndexObserver() {
    const track = document.getElementById('manifest-scroll-track');
    track.addEventListener('scroll', () => {
        if (document.fullscreenElement) return; 
        const wrappers = track.querySelectorAll('.page-viewport-card');
        let targetedActivePage = 1;
        let minimumDeltaDistance = Infinity;

        wrappers.forEach(el => {
            const delta = Math.abs(el.offsetTop - track.offsetTop - track.scrollTop);
            if (delta < minimumDeltaDistance) {
                minimumDeltaDistance = delta;
                targetedActivePage = parseInt(el.getAttribute('data-page-num'));
            }
        });

        currentManualTrackedPageIndex = targetedActivePage;
        document.getElementById('lbl-page-index').innerText = `${currentManualTrackedPageIndex} / ${totalPagesInStagedDocument}`;
    });
}

function navigateViewerManualPageSteps(stepIncrement) {
    if (!globalStagedBytesPayloadArray) return;

    if (document.fullscreenElement) {
        let nextFSIndex = currentManualTrackedPageIndex + stepIncrement;
        if (nextFSIndex >= 1 && nextFSIndex <= totalPagesInStagedDocument) {
            currentManualTrackedPageIndex = nextFSIndex;
            syncFullscreenBookSpreadElements();
        }
    } else {
        let nextScrollIndex = currentManualTrackedPageIndex + stepIncrement;
        if (nextScrollIndex >= 1 && nextScrollIndex <= totalPagesInStagedDocument) {
            currentManualTrackedPageIndex = nextScrollIndex;
            executeManualPageJumpMatrix(currentManualTrackedPageIndex);
        }
    }
}

function executeManualPageJumpMatrix(targetInputValue) {
    if (!globalStagedBytesPayloadArray) return;
    const parsedTargetIndex = parseInt(targetInputValue);

    if (isNaN(parsedTargetIndex) || parsedTargetIndex < 1 || parsedTargetIndex > totalPagesInStagedDocument) {
        alert("Navigation Cap Error: Page reference falls out of document matrices bounds.");
        return;
    }

    currentManualTrackedPageIndex = parsedTargetIndex;

    if (document.fullscreenElement) {
        syncFullscreenBookSpreadElements();
    } else {
        const targetedDOMNode = document.getElementById(`viewport-card-page-${currentManualTrackedPageIndex}`);
        if (targetedDOMNode) {
            targetedDOMNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    document.getElementById('input-page-jump').value = "";
    document.getElementById('input-fullscreen-page-jump').value = "";
}

async function adjustScaleRatio(stepDeltaFactor) {
    let computedNextRatio = currentViewportScaleRatio + stepDeltaFactor;
    if (computedNextRatio >= 0.4 && computedNextRatio <= 2.5) {
        currentViewportScaleRatio = computedNextRatio;
        
        showProcessingOverlay("Adjusting Resolution Scales", "Remapping dimensions layout...");
        try {
            await compileAndRenderViewerStream();
            if (!document.fullscreenElement) {
                const currentStagedCardNode = document.getElementById(`viewport-card-page-${currentManualTrackedPageIndex}`);
                if (currentStagedCardNode) currentStagedCardNode.scrollIntoView({ block: 'start' });
            }
        } catch(e) {
            console.error(e);
        } finally {
            hideProcessingOverlay();
        }
    }
}

async function syncFullscreenBookSpreadElements() {
    const leftContainer = document.getElementById('book-page-left');
    const rightContainer = document.getElementById('book-page-right');
    
    leftContainer.innerHTML = '';
    rightContainer.innerHTML = '';

    if (currentManualTrackedPageIndex > 1 && currentManualTrackedPageIndex % 2 === 0) {
        currentManualTrackedPageIndex--;
    }

    document.getElementById('lbl-fullscreen-page-index').innerText = `Pages ${currentManualTrackedPageIndex}-${Math.min(currentManualTrackedPageIndex + 1, totalPagesInStagedDocument)} / ${totalPagesInStagedDocument}`;

    const baseScaleFactorValue = 1.35 * currentViewportScaleRatio;

    // Render Left Page
    const leftPageNode = await currentActivePDFjsDocumentCache.getPage(currentManualTrackedPageIndex);
    const leftViewport = leftPageNode.getViewport({ scale: baseScaleFactorValue });
    const canvasLeft = document.createElement('canvas');
    canvasLeft.width = leftViewport.width;
    canvasLeft.height = leftViewport.height;
    canvasLeft.style.width = "100%";
    canvasLeft.style.height = "100%";
    await leftPageNode.render({ canvasContext: canvasLeft.getContext('2d'), viewport: leftViewport }).promise;
    leftContainer.appendChild(canvasLeft);

    // Render Right Page if applicable
    if (currentManualTrackedPageIndex + 1 <= totalPagesInStagedDocument) {
        rightContainer.style.visibility = "visible";
        const rightPageNode = await currentActivePDFjsDocumentCache.getPage(currentManualTrackedPageIndex + 1);
        const rightViewport = rightPageNode.getViewport({ scale: baseScaleFactorValue });
        const canvasRight = document.createElement('canvas');
        canvasRight.width = rightViewport.width;
        canvasRight.height = rightViewport.height;
        canvasRight.style.width = "100%";
        canvasRight.style.height = "100%";
        await rightPageNode.render({ canvasContext: canvasRight.getContext('2d'), viewport: rightViewport }).promise;
        rightContainer.appendChild(canvasRight);
    } else {
        rightContainer.style.visibility = "hidden";
    }
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (globalStagedBytesPayloadArray) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in";
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
    const bookSpreadViewport = document.getElementById('fullscreen-book-spread-viewport');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            if (dropzone) dropzone.classList.add('hidden');
            targetElement.classList.remove('gap-4');
            trackingSubframe.classList.remove('border', 'bg-slate-950/30', 'p-5');
            trackingSubframe.classList.add('bg-[#04060c]', 'p-0');
            scrollingTrack.classList.add('hidden');
            
            bookSpreadViewport.classList.remove('hidden');
            bookSpreadViewport.classList.add('flex');
            document.getElementById('manifest-title-lbl').classList.add('text-sky-400');
            
            // Force side navigation arrows to lock open immediately on launch
            document.getElementById('hud-arrow-left').classList.add('show-hud');
            document.getElementById('hud-arrow-right').classList.add('show-hud');

            syncFullscreenBookSpreadElements();
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
    const bookSpreadViewport = document.getElementById('fullscreen-book-spread-viewport');
    
    if (!document.fullscreenElement) {
        if (dropzone) dropzone.classList.remove('hidden');
        targetElement.classList.add('gap-4');
        trackingSubframe.classList.add('border', 'bg-slate-950/30', 'p-5');
        trackingSubframe.classList.remove('bg-[#04060c]', 'p-0');
        scrollingTrack.classList.remove('hidden');
        
        bookSpreadViewport.classList.add('hidden');
        bookSpreadViewport.classList.remove('flex');
        document.getElementById('manifest-title-lbl').classList.remove('text-sky-400');
        
        // Clear active mouse HUD tracking variables
        document.getElementById('hud-dock-bottom').classList.remove('show-hud');
        document.getElementById('hud-arrow-left').classList.remove('show-hud');
        document.getElementById('hud-arrow-right').classList.remove('show-hud');

        document.getElementById('lbl-page-index').innerText = `${currentManualTrackedPageIndex} / ${totalPagesInStagedDocument}`;
        document.getElementById('lbl-zoom-percent').innerText = `${Math.round(currentViewportScaleRatio * 100)}%`;
        
        const targetedDOMNode = document.getElementById(`viewport-card-page-${currentManualTrackedPageIndex}`);
        if (targetedDOMNode) {
            targetedDOMNode.scrollIntoView({ block: 'start' });
        }
    }
});

function purgeActiveViewerPipeline() {
    window.location.reload();
}