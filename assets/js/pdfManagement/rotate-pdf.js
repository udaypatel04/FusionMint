
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let globalFileUint8BytesArray = null;
let documentPagesRecordsCache = []; 
let activePdfEngineRenderInstance = null;

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

async function loadPDFDocumentIntoRotationPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    const pdfFile = inputElement.files[0];

    if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
        alert("Staging Error: Element layer configuration mismatch. Please supply a valid .pdf file asset.");
        return;
    }

    document.getElementById('empty-sandbox-state').classList.add('hidden');
    documentPagesRecordsCache = [];

    showProcessingOverlay("Analyzing Document Structure", "Decompressing page catalogs into reference vectors...");

    const fileReaderInstance = new FileReader();
    fileReaderInstance.onload = async function(e) {
        try {
            globalFileUint8BytesArray = new Uint8Array(e.target.result);
            
            activePdfEngineRenderInstance = await pdfjsLib.getDocument({ data: globalFileUint8BytesArray.slice(0) }).promise;
            const totalPagesCount = activePdfEngineRenderInstance.numPages;

            for (let pageNum = 1; pageNum <= totalPagesCount; pageNum++) {
                updateProcessingOverlayStatus(`Rendering raster previews: Page ${pageNum} of ${totalPagesCount}...`);
                
                const pageDataNode = await activePdfEngineRenderInstance.getPage(pageNum);
                const viewport = pageDataNode.getViewport({ scale: 0.35 });

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = viewport.width;
                offscreenCanvas.height = viewport.height;
                const ctx = offscreenCanvas.getContext('2d');

                await pageDataNode.render({ canvasContext: ctx, viewport: viewport }).promise;

                const dataUrlStringValue = offscreenCanvas.toDataURL('image/jpeg', 0.85);
                documentPagesRecordsCache.push({
                    pageIndex: pageNum - 1, 
                    dataUrl: dataUrlStringValue,
                    currentRotationDegrees: 0 
                });
            }

            const originalInputName = pdfFile.name;
            const baselineSanitizedName = originalInputName.substring(0, originalInputName.lastIndexOf('.')) || originalInputName;
            const spaceSanitizedUnderscoreName = baselineSanitizedName.replace(/\s+/g, '_');
            document.getElementById('pdf-output-filename').value = `${spaceSanitizedUnderscoreName}_rotated`;

            syncStagingUIBlocksView();

        } catch (err) {
            console.error("PDF Parsing Failure intercept:", err);
            alert("Framework Translation Fault: Unrecognized binary object map tracks parsing layout context.");
            purgeActiveRotationPipeline();
        } finally {
            hideProcessingOverlay();
        }
    };
    fileReaderInstance.readAsArrayBuffer(pdfFile);
    inputElement.value = "";
}

function syncStagingUIBlocksView() {
    const gridRoot = document.getElementById('pages-rotation-sandbox-grid');
    gridRoot.querySelectorAll('.page-thumbnail-card').forEach(card => card.remove());

    if (documentPagesRecordsCache.length === 0) {
        document.getElementById('empty-sandbox-state').classList.remove('hidden');
        document.getElementById('compilation-actions-deck').classList.add('hidden');
        document.getElementById('compilation-actions-deck').classList.remove('flex');
        return;
    }

    document.getElementById('empty-sandbox-state').classList.add('hidden');
    document.getElementById('compilation-actions-deck').classList.remove('hidden');
    document.getElementById('compilation-actions-deck').classList.add('flex');

    documentPagesRecordsCache.forEach((pageItem) => {
        const cardNode = document.createElement('div');
        cardNode.className = "page-thumbnail-card bg-slate-900 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col gap-3 relative animate-fade-in cursor-pointer select-none group";
        cardNode.setAttribute('onclick', `rotateIndividualPageFrameItem(${pageItem.pageIndex})`);
        
        cardNode.innerHTML = `
            <div class="relative w-full aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-900 flex items-center justify-center p-2">
                <div id="canvas-container-node-${pageItem.pageIndex}" class="canvas-container-node w-full h-full flex items-center justify-center" style="transform: rotate(${pageItem.currentRotationDegrees}deg);">
                    <img src="${pageItem.dataUrl}" class="max-w-full max-h-full object-contain shadow-inner rounded" alt="Page Matrix">
                </div>
                <div class="absolute top-2 right-2 w-6 h-6 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-slate-400 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all">
                    <i class="fa-solid fa-arrows-rotate"></i>
                </div>
            </div>
            <div class="flex items-center justify-between px-1">
                <span class="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 px-2 py-0.5 rounded-md">Page ${pageItem.pageIndex + 1}</span>
                <span id="rotation-angle-badge-${pageItem.pageIndex}" class="text-[10px] font-mono text-slate-500 font-bold">${pageItem.currentRotationDegrees}°</span>
            </div>
        `;
        gridRoot.appendChild(cardNode);
    });
}

function rotateIndividualPageFrameItem(pageIndex) {
    const pageRecord = documentPagesRecordsCache.find(item => item.pageIndex === pageIndex);
    if (!pageRecord) return;

    pageRecord.currentRotationDegrees = (pageRecord.currentRotationDegrees + 90) % 360;
    
    const wrapperNode = document.getElementById('canvas-container-node-' + pageIndex);
    const textAngleLabel = document.getElementById('rotation-angle-badge-' + pageIndex);
    
    if (wrapperNode && textAngleLabel) {
        wrapperNode.style.transform = `rotate(${pageRecord.currentRotationDegrees}deg)`;
        textAngleLabel.innerText = `${pageRecord.currentRotationDegrees}°`;
    }
}

function rotateAllPagesMatrix(degreesStepValue) {
    documentPagesRecordsCache.forEach(page => {
        page.currentRotationDegrees = (page.currentRotationDegrees + degreesStepValue) % 360;
    });
    syncStagingUIBlocksView();
}

function resetAllRotationsMatrix() {
    documentPagesRecordsCache.forEach(page => {
        page.currentRotationDegrees = 0;
    });
    syncStagingUIBlocksView();
}

async function executeRotatedPDFExport() {
    if (!globalFileUint8BytesArray || documentPagesRecordsCache.length === 0) return;

    showProcessingOverlay("Compiling Document Geometry", "Encoding modifications down into vector streams...");
    const statusLabel = document.getElementById('overlay-status-label');

    let customOutputName = document.getElementById('pdf-output-filename').value.trim().replace(/\s+/g, '_');
    if(!customOutputName) customOutputName = "rotated_document_export";

    setTimeout(async function() {
        try {
            const { PDFDocument, degrees } = PDFLib;
            
            const freshArrayBufferSnapshot = globalFileUint8BytesArray.slice(0);
            const sourceDoc = await PDFDocument.load(freshArrayBufferSnapshot);
            const pagesArray = sourceDoc.getPages();

            statusLabel.innerText = "Iterating page reference maps and modifying spatial geometry indexes...";

            documentPagesRecordsCache.forEach(record => {
                const targetPage = pagesArray[record.pageIndex];
                if (record.currentRotationDegrees !== 0) {
                    let assetExistingRotationAngle = 0;
                    try {
                        const rotationObj = targetPage.getRotation();
                        if (rotationObj && typeof rotationObj.angle === 'number') {
                            assetExistingRotationAngle = rotationObj.angle;
                        } else if (typeof rotationObj === 'number') {
                            assetExistingRotationAngle = rotationObj;
                        }
                    } catch (e) {
                        assetExistingRotationAngle = 0;
                    }

                    const totalComputedAngleValue = (assetExistingRotationAngle + record.currentRotationDegrees) % 360;
                    targetPage.setRotation(degrees(totalComputedAngleValue));
                }
            });

            statusLabel.innerText = "Encrypting compiled binary data streams...";
            const processedBytesUint8Array = await sourceDoc.save();
            const outputBlobStream = new Blob([processedBytesUint8Array], { type: 'application/pdf' });

            const anchorElement = document.createElement('a');
            anchorElement.download = `${customOutputName}.pdf`;
            anchorElement.href = URL.createObjectURL(outputBlobStream);
            document.body.appendChild(anchorElement);
            
            anchorElement.click();
            document.body.removeChild(anchorElement);

        } catch (fatalError) {
            console.error("Rotational mapping crash caught:", fatalError);
            alert("Rotation Processing Engine Error: Fault adapting geometry rotation matrix properties index maps.");
        } finally {
            hideProcessingOverlay();
        }
    }, 350);
}

function purgeActiveRotationPipeline() {
    window.location.reload();
}