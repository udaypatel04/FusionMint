
let pyodideWasmInstance = null;
let originalFileBytesPayload = null;
let activeStagedPdfPagesCount = 0;
let documentHasBeenLockedSuccessfully = false;

let cropTop = 5;
let cropBottom = 5;
let cropLeft = 5;
let cropRight = 5;

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
    
    if (pyodideWasmInstance && originalFileBytesPayload) {
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
}

async function loadPDFToPipelineOrchestrator(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const pdfFile = inputNode.files[0];
    const arrayBuffer = await pdfFile.arrayBuffer();
    originalFileBytesPayload = new Uint8Array(arrayBuffer);
    documentHasBeenLockedSuccessfully = false;

    showProcessingOverlay("Generating Thumbnails Matrix", "Parsing document pages schemas layouts elements channels...");

    try {
        const pdfjsDoc = await pdfjsLib.getDocument({ data: originalFileBytesPayload.slice(0) }).promise;
        activeStagedPdfPagesCount = pdfjsDoc.numPages;

        document.getElementById('pdf-range-from').value = 1;
        document.getElementById('pdf-range-to').value = activeStagedPdfPagesCount;

        const gridRoot = document.getElementById('pdf-thumbnails-grid-root');
        if (gridRoot) gridRoot.innerHTML = '';
        
        const callout = document.getElementById('empty-workspace-callout');
        if (callout) callout.classList.add('hidden');

        let firstPageDataUrl = null;

        for (let pageNum = 1; pageNum <= activeStagedPdfPagesCount; pageNum++) {
            updateProcessingOverlayStatus(`Rasterizing sheet wrapper blueprint (${pageNum} / ${activeStagedPdfPagesCount})...`);
            
            const pageObj = await pdfjsDoc.getPage(pageNum);
            const viewport = pageObj.getViewport({ scale: 0.6 }); 
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await pageObj.render({ canvasContext: ctx, viewport: viewport }).promise;
            const base64ThumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.9);

            if(pageNum === 1) {
                firstPageDataUrl = base64ThumbnailDataUrl;
            }

            const thumbCardNode = document.createElement('div');
            thumbCardNode.className = "page-thumbnail-box bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl flex flex-col gap-1.5 relative shadow-lg select-none cursor-pointer min-w-[70px] md:min-w-0";
            thumbCardNode.onclick = () => { document.getElementById('sandbox-preview-img').src = base64ThumbnailDataUrl; };
            thumbCardNode.innerHTML = `
                <div class="relative w-full aspect-[210/297] bg-white rounded overflow-hidden border border-slate-950 flex items-center justify-center">
                    <img src="${base64ThumbnailDataUrl}" class="w-full h-full object-cover opacity-95">
                </div>
                <div class="flex items-center justify-between font-mono text-[9px] text-slate-400 px-0.5">
                    <span>Page</span>
                    <span class="text-emerald-400 font-bold bg-slate-950 px-1.5 rounded">${pageNum}</span>
                </div>
            `;

            if (gridRoot) gridRoot.appendChild(thumbCardNode);
        }

        if (firstPageDataUrl) {
            document.getElementById('sandbox-empty-prompt').classList.add('hidden');
            const container = document.getElementById('sandbox-container-wrapper');
            container.classList.remove('hidden');
            document.getElementById('sandbox-preview-img').src = firstPageDataUrl;
            initializeCursorBasedPositionListeners();
        }

        const totalBadge = document.getElementById('page-total-badge');
        if (totalBadge) {
            totalBadge.innerText = `${activeStagedPdfPagesCount} Pages Loaded`;
            totalBadge.classList.remove('hidden');
        }

        document.getElementById('cropping-parameters-wrapper').classList.replace('hidden', 'flex');
        document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');

        if (pdfFile.name) {
            const basePrefix = pdfFile.name.substring(0, pdfFile.name.lastIndexOf('.')) || pdfFile.name;
            document.getElementById('pdf-output-filename').value = `${basePrefix.replace(/\s+/g, '_')}_cropped`;
        }

    } catch (error) {
        console.error(error);
        alert("Error parsing PDF metadata matrix tracks.");
    } finally {
        await hideProcessingOverlay();
        updateCropBoxOverlayAndSliders();
        evaluateMintButtonState();
    }
}

function toggleCanvasMagnificationZoom(event) {
    if (event.target.classList.contains('crop-handle')) return;

    const targetWrapper = document.getElementById('sandbox-container-wrapper');
    const statusIndicator = document.getElementById('zoom-status-indicator');
    
    if (targetWrapper.classList.contains('zoomed')) {
        targetWrapper.classList.remove('zoomed');
        targetWrapper.classList.replace('cursor-zoom-out', 'cursor-zoom-in');
        statusIndicator.innerHTML = `<i class="fa-solid fa-magnifying-glass text-[9px] mr-1"></i> Zoom Available`;
        statusIndicator.className = "text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800";
    } else {
        targetWrapper.classList.add('zoomed');
        targetWrapper.classList.replace('cursor-zoom-in', 'cursor-zoom-out');
        statusIndicator.innerHTML = `<i class="fa-solid fa-magnifying-glass-minus text-[9px] mr-1"></i> Reset Zoom`;
        statusIndicator.className = "text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/40";
    }
}

function updateCropBoxOverlayAndSliders() {
    document.getElementById('lbl-crop-top').innerText = `${cropTop}%`;
    document.getElementById('lbl-crop-bottom').innerText = `${cropBottom}%`;
    document.getElementById('lbl-crop-left').innerText = `${cropLeft}%`;
    document.getElementById('lbl-crop-right').innerText = `${cropRight}%`;

    document.getElementById('range-crop-top').value = cropTop;
    document.getElementById('range-crop-bottom').value = cropBottom;
    document.getElementById('range-crop-left').value = cropLeft;
    document.getElementById('range-crop-right').value = cropRight;

    const guideBox = document.getElementById('interactive-crop-box-guide');
    if (guideBox) {
        guideBox.style.top = `${cropTop}%`;
        guideBox.style.bottom = `${cropBottom}%`;
        guideBox.style.left = `${cropLeft}%`;
        guideBox.style.right = `${cropRight}%`;
    }
}

function synchronizeCropValuesFromSliders() {
    cropTop = parseInt(document.getElementById('range-crop-top').value) || 0;
    cropBottom = parseInt(document.getElementById('range-crop-bottom').value) || 0;
    cropLeft = parseInt(document.getElementById('range-crop-left').value) || 0;
    cropRight = parseInt(document.getElementById('range-crop-right').value) || 0;
    updateCropBoxOverlayAndSliders();
}

function initializeCursorBasedPositionListeners() {
    const container = document.getElementById('sandbox-container-wrapper');
    let activeHandle = null;

    document.querySelectorAll('.crop-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            activeHandle = handle.id;
        });
        
        // Add touch support handle bindings
        handle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            activeHandle = handle.id;
        }, { passive: true });
    });

    const handleMoveLogic = (clientX, clientY) => {
        if (!activeHandle) return;
        const rect = container.getBoundingClientRect();
        let mouseXPercent = ((clientX - rect.left) / rect.width) * 100;
        let mouseYPercent = ((clientY - rect.top) / rect.height) * 100;

        if (activeHandle === 'handle-tl') {
            cropLeft = Math.min(45, Math.max(0, Math.round(mouseXPercent)));
            cropTop = Math.min(45, Math.max(0, Math.round(mouseYPercent)));
        } else if (activeHandle === 'handle-tr') {
            cropRight = Math.min(45, Math.max(0, Math.round(100 - mouseXPercent)));
            cropTop = Math.min(45, Math.max(0, Math.round(mouseYPercent)));
        } else if (activeHandle === 'handle-bl') {
            cropLeft = Math.min(45, Math.max(0, Math.round(mouseXPercent)));
            cropBottom = Math.min(45, Math.max(0, Math.round(100 - mouseYPercent)));
        } else if (activeHandle === 'handle-br') {
            cropRight = Math.min(45, Math.max(0, Math.round(100 - mouseXPercent)));
            cropBottom = Math.min(45, Math.max(0, Math.round(100 - mouseYPercent)));
        }
        updateCropBoxOverlayAndSliders();
    };

    window.addEventListener('mousemove', (e) => handleMoveLogic(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0 && activeHandle) {
            handleMoveLogic(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    const stopDragLogic = () => { activeHandle = null; };
    window.addEventListener('mouseup', stopDragLogic);
    window.addEventListener('touchend', stopDragLogic);
}

async function executePythonPdfCropping(shouldTriggerDownloadPayload = false) {
    if (!originalFileBytesPayload || !pyodideWasmInstance) return;

    const rangeFrom = parseInt(document.getElementById('pdf-range-from').value) || 1;
    const rangeTo = parseInt(document.getElementById('pdf-range-to').value) || activeStagedPdfPagesCount;

    showProcessingOverlay("Advanced Cropping Matrix", "Processing dimension boundary box layout parameters inside WASM kernel...");

    pyodideWasmInstance.FS.writeFile("raw_source.pdf", originalFileBytesPayload);
    pyodideWasmInstance.globals.set("pct_top", cropTop);
    pyodideWasmInstance.globals.set("pct_bottom", cropBottom);
    pyodideWasmInstance.globals.set("pct_left", cropLeft);
    pyodideWasmInstance.globals.set("pct_right", cropRight);
    pyodideWasmInstance.globals.set("range_from", rangeFrom);
    pyodideWasmInstance.globals.set("range_to", rangeTo);

    setTimeout(async () => {
        try {
            updateProcessingOverlayStatus("Executing structural crop matrix transformations...");
            await pyodideWasmInstance.runPythonAsync(`
                from pypdf import PdfReader, PdfWriter

                reader = PdfReader("raw_source.pdf")
                writer = PdfWriter()

                for idx, page in enumerate(reader.pages):
                    pageNumOneIndexed = idx + 1
                    
                    if pageNumOneIndexed >= range_from and pageNumOneIndexed <= range_to:
                        mb = page.mediabox
                        width = float(mb.width)
                        height = float(mb.height)

                        trim_top = (pct_top / 100.0) * height
                        trim_bottom = (pct_bottom / 100.0) * height
                        trim_left = (pct_left / 100.0) * width
                        trim_right = (pct_right / 100.0) * width

                        mb.left = mb.left + trim_left
                        mb.right = mb.right - trim_right
                        mb.bottom = mb.bottom + trim_bottom
                        mb.top = mb.top - trim_top

                    writer.add_page(page)

                with open("cropped_output.pdf", "wb") as f:
                    writer.write(f)
            `);

            const cleanBytes = pyodideWasmInstance.FS.readFile("cropped_output.pdf");
            documentHasBeenLockedSuccessfully = true;

            if (shouldTriggerDownloadPayload) {
                updateProcessingOverlayStatus("Flushing generated binary streams...");
                const blobStream = new Blob([cleanBytes], { type: "application/pdf" });
                const customOutputName = document.getElementById('pdf-output-filename').value.trim() || "cropped_export";
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `${customOutputName}.pdf`;
                linkAnchorNode.href = URL.createObjectURL(blobStream);
                document.body.appendChild(linkAnchorNode);
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);
            } else {
                alert("Crop margins applied safely to sandbox local memory cache stream.");
            }

            pyodideWasmInstance.FS.unlink("raw_source.pdf");
            pyodideWasmInstance.FS.unlink("cropped_output.pdf");

        } catch (fatalError) {
            console.error(fatalError);
            alert("WASM Core Error: Structural bounding track crash.");
        } finally {
            await hideProcessingOverlay();
            evaluateMintButtonState();
        }
    }, 450);
}

function purgeActiveCroppingPipeline() {
    window.location.reload();
}