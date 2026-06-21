
let pyodideWasmInstance = null;
let originalFileBytesPayload = null;
let activeStagedPdfPagesCount = 0;
let documentHasBeenLockedSuccessfully = false;

let activeYAxisAnchor = "bottom";
let activeXAxisAnchor = "right";

async function bootstrapPythonWasmVirtualEngine() {
    try {
        pyodideWasmInstance = await loadPyodide();
        await pyodideWasmInstance.loadPackage("micropip");
        const micropip = pyodideWasmInstance.pyimport("micropip");
        
        await micropip.install("pypdf");
        await micropip.install("reportlab");
        
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

function setMatrixTargetAnchor(yAxis, xAxis) {
    document.querySelectorAll('.matrix-grid-dot').forEach(el => el.classList.remove('selected'));
    
    activeYAxisAnchor = yAxis;
    activeXAxisAnchor = xAxis;

    const targetBtn = document.getElementById(`dot-${yAxis}-${xAxis}`);
    if (targetBtn) targetBtn.classList.add('selected');

    document.getElementById('matrix-status-lbl').innerText = `${yAxis} ${xAxis}`;
    synchronizeThumbnailsIndicationBadges();
}

function evaluateMintButtonState() {
    const lockBtn = document.getElementById('lock-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    if (pyodideWasmInstance && originalFileBytesPayload) {
        lockBtn.disabled = false;
        lockBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (documentHasBeenLockedSuccessfully) {
            downloadBtn.disabled = false;
            downloadBtn.className = "w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        } else {
            downloadBtn.disabled = true;
            downloadBtn.className = "w-full min-h-[44px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        }
    } else {
        lockBtn.disabled = true;
        lockBtn.className = "w-full min-h-[44px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[44px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
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
        document.getElementById('pdf-range-from').max = activeStagedPdfPagesCount;
        document.getElementById('pdf-range-to').value = activeStagedPdfPagesCount;
        document.getElementById('pdf-range-to').max = activeStagedPdfPagesCount;

        const gridRoot = document.getElementById('pdf-thumbnails-grid-root');
        if (gridRoot) gridRoot.innerHTML = '';
        
        const callout = document.getElementById('empty-workspace-callout');
        if (callout) callout.classList.add('hidden');

        for (let pageNum = 1; pageNum <= activeStagedPdfPagesCount; pageNum++) {
            updateProcessingOverlayStatus(`Rasterizing sheet wrapper blueprint (${pageNum} / ${activeStagedPdfPagesCount})...`);
            
            const pageObj = await pdfjsDoc.getPage(pageNum);
            const viewport = pageObj.getViewport({ scale: 0.35 }); 
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await pageObj.render({ canvasContext: ctx, viewport: viewport }).promise;
            const base64ThumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            const thumbCardNode = document.createElement('div');
            thumbCardNode.id = `thumb-container-row-${pageNum}`;
            thumbCardNode.className = "page-thumbnail-box bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl flex flex-col gap-2 relative shadow-lg select-none animate-fade-in";
            thumbCardNode.innerHTML = `
                <div class="relative w-full aspect-[210/297] bg-white rounded-lg overflow-hidden border border-slate-950 flex items-center justify-center">
                    <img src="${base64ThumbnailDataUrl}" class="w-full h-full object-cover opacity-95" alt="Slide snapshot">
                    <div id="indicator-dot-node-${pageNum}" class="absolute w-5 h-5 rounded-full text-slate-800 border border-white text-[8px] font-bold flex items-center justify-center transition-all duration-200">1</div>
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

        const paramsWrapper = document.getElementById('numbering-parameters-wrapper');
        if (paramsWrapper) {
            paramsWrapper.classList.remove('hidden');
            paramsWrapper.classList.add('flex');
        }

        const actionsDeck = document.getElementById('compilation-actions-deck');
        if (actionsDeck) {
            actionsDeck.classList.remove('hidden');
            actionsDeck.classList.add('flex');
        }

        if (pdfFile.name) {
            const basePrefix = pdfFile.name.substring(0, pdfFile.name.lastIndexOf('.')) || pdfFile.name;
            const filenameInput = document.getElementById('pdf-output-filename');
            if (filenameInput) {
                filenameInput.value = `${basePrefix.replace(/\s+/g, '_')}_paginated`;
            }
        }

    } catch (error) {
        console.error("Pipeline Rendering Intercept Fault: ", error);
        alert("Error parsing PDF metadata matrix tracks.");
    } finally {
        await hideProcessingOverlay();
        synchronizeThumbnailsIndicationBadges();
        evaluateMintButtonState();
    }
}

function synchronizeThumbnailsIndicationBadges() {
    if (activeStagedPdfPagesCount === 0) return;

    const startIdx = parseInt(document.getElementById('pdf-start-page-num').value) || 1;
    const stylePat = document.getElementById('pdf-number-style').value;
    const rangeFrom = parseInt(document.getElementById('pdf-range-from').value) || 1;
    const rangeTo = parseInt(document.getElementById('pdf-range-to').value) || activeStagedPdfPagesCount;

    for (let i = 1; i <= activeStagedPdfPagesCount; i++) {
        const dot = document.getElementById(`indicator-dot-node-${i}`);
        if (!dot) continue;

        dot.className = "absolute w-5 h-5 rounded-full text-slate-800 border border-white text-[8px] font-bold flex items-center justify-center transition-all duration-200";
        
        if (i < rangeFrom || i > rangeTo) {
            dot.classList.add('opacity-0', 'scale-50', 'invisible');
            continue;
        } else {
            dot.classList.remove('opacity-0', 'scale-50', 'invisible');
        }

        if (activeYAxisAnchor === 'top') dot.classList.add('top-2');
        else dot.classList.add('bottom-2');

        if (activeXAxisAnchor === 'left') dot.classList.add('left-2');
        else if (activeXAxisAnchor === 'center') dot.classList.add('left-1/2', '-translate-x-1/2');
        else dot.classList.add('right-2');

        let indexRepresentation = startIdx + (i - rangeFrom);
        if (stylePat === 'roman_upper') dot.innerText = "I";
        else if (stylePat === 'decorated') dot.innerText = `-${indexRepresentation}-`;
        else if (stylePat === 'total') dot.innerText = `${indexRepresentation}/X`;
        else dot.innerText = indexRepresentation;
    }
}

async function executePythonPdfPagination(shouldTriggerDownloadPayload = false) {
    if (!originalFileBytesPayload || !pyodideWasmInstance) return;

    const startIdxValue = parseInt(document.getElementById('pdf-start-page-num').value) || 1;
    const chosenStylePattern = document.getElementById('pdf-number-style').value;
    const rangeFrom = parseInt(document.getElementById('pdf-range-from').value) || 1;
    const rangeTo = parseInt(document.getElementById('pdf-range-to').value) || activeStagedPdfPagesCount;

    showProcessingOverlay("Advanced Pagination Matrix", "Injecting requested alignment coordinates and format models inside Python runtime environment...");

    pyodideWasmInstance.FS.writeFile("raw_source.pdf", originalFileBytesPayload);
    pyodideWasmInstance.globals.set("start_idx", startIdxValue);
    pyodideWasmInstance.globals.set("style_pat", chosenStylePattern);
    pyodideWasmInstance.globals.set("place_axis", activeYAxisAnchor);
    pyodideWasmInstance.globals.set("align_axis", activeXAxisAnchor);
    pyodideWasmInstance.globals.set("range_from", rangeFrom);
    pyodideWasmInstance.globals.set("range_to", rangeTo);

    setTimeout(async () => {
        try {
            updateProcessingOverlayStatus("Executing structural layout translations...");
            await pyodideWasmInstance.runPythonAsync(`
                from pypdf import PdfReader, PdfWriter
                from reportlab.pdfgen import canvas
                import io

                def generate_num_string(num, total, style):
                    if style == "simple": return str(num)
                    elif style == "decorated": return f"- {num} -"
                    elif style == "total": return f"Page {num} of {total}"
                    elif style == "roman_upper":
                        val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
                        syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
                        roman = ""
                        i = 0
                        n = num
                        while n > 0:
                            for _ in range(n // val[i]):
                                roman += syb[i]
                                n -= val[i]
                            i += 1
                        return roman
                    return str(num)

                reader = PdfReader("raw_source.pdf")
                writer = PdfWriter()
                total_pages = len(reader.pages)

                for idx, page in enumerate(reader.pages):
                    pageNumOneIndexed = idx + 1
                    mediabox = page.mediabox
                    width = float(mediabox.width)
                    height = float(mediabox.height)

                    if pageNumOneIndexed >= range_from and pageNumOneIndexed <= range_to:
                        packet = io.BytesIO()
                        can = canvas.Canvas(packet, pagesize=(width, height))
                        can.setFont("Helvetica", 10)
                        can.setFillColorRGB(0.09, 0.13, 0.24)

                        calculatedIndexValue = start_idx + (pageNumOneIndexed - range_from)
                        num_str = generate_num_string(calculatedIndexValue, total_pages, style_pat)

                        y_coordinate = (height - 30) if place_axis == "top" else 30
                        
                        if align_axis == "left":
                            can.drawString(36, y_coordinate, num_str)
                        elif align_axis == "center":
                            can.drawCentredString(width / 2.0, y_coordinate, num_str)
                        else:
                            can.drawRightString(width - 36, y_coordinate, num_str)
                            
                        can.save()
                        packet.seek(0)

                        num_pdf = PdfReader(packet)
                        page.merge_page(num_pdf.pages[0])
                    
                    writer.add_page(page)

                with open("paginated_output.pdf", "wb") as f:
                    writer.write(f)
            `);

            const cleanBytes = pyodideWasmInstance.FS.readFile("paginated_output.pdf");
            documentHasBeenLockedSuccessfully = true;

            if (shouldTriggerDownloadPayload) {
                updateProcessingOverlayStatus("Flushing generated binary blocks container stream...");
                const blobStream = new Blob([cleanBytes], { type: "application/pdf" });
                const customOutputName = document.getElementById('pdf-output-filename').value.trim() || "paginated_export";
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `${customOutputName}.pdf`;
                linkAnchorNode.href = URL.createObjectURL(blobStream);
                document.body.appendChild(linkAnchorNode);
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);
            } else {
                alert("Pagination applied completely in cache. Click 'Download Paginated PDF' to store file.");
            }

            pyodideWasmInstance.FS.unlink("raw_source.pdf");
            pyodideWasmInstance.FS.unlink("paginated_output.pdf");

        } catch (fatalError) {
            console.error(fatalError);
            alert("WASM Processing Error: Structural layout mismatch or corrupted internal PDF page streams dictionary.");
        } finally {
            await hideProcessingOverlay();
            evaluateMintButtonState();
        }
    }, 450);
}

function purgeActivePaginationPipeline() {
    window.location.reload();
}