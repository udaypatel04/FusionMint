
let pyodideWasmInstance = null;
let globalStagedFileBytesArray = null;
let globalWatermarkImageStampBytesArray = null;
let globalWatermarkImageStampElement = null;
let globalWatermarkImageStampExtension = "";
let globalStagedFilename = "";

let pdfjsDocumentInstance = null;
let activePreviewPageIndex = 0;

let activeYAxisAnchor = "center";
let activeXAxisAnchor = "center";

async function bootstrapPythonWasmVirtualEngine() {
    try {
        pyodideWasmInstance = await loadPyodide();
        await pyodideWasmInstance.loadPackage("micropip");
        const micropip = pyodideWasmInstance.pyimport("micropip");
        await micropip.install("pypdf");
        await micropip.install("reportlab");
        document.getElementById('runtime-status-text').innerText = "Python WASM Core Active";
        document.getElementById('runtime-status-dot').className = "w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse";
    } catch(e) {
        console.error(e);
        document.getElementById('runtime-status-text').innerText = "Python WASM Crash Fault";
    }
}
bootstrapPythonWasmVirtualEngine();

function showProcessingOverlay(title, subtitle) {
    const overlay = document.getElementById('matrix-processing-overlay');
    document.getElementById('overlay-main-title').innerText = title;
    document.getElementById('overlay-status-label').innerText = subtitle;
    overlay.classList.add('active');
}

function hideProcessingOverlay() {
    document.getElementById('matrix-processing-overlay').classList.remove('active');
}

function printPipelineInlineStatus(message, isError = false) {
    const logBox = document.getElementById('pipeline-inline-log');
    if (!logBox) return;
    logBox.innerText = message;
    logBox.classList.remove('hidden');
    logBox.className = isError ? "text-[10px] font-mono font-bold bg-slate-900 border px-2.5 py-1 rounded text-red-400 border-red-500/20 p-2 block animate-pulse" : "text-[10px] font-mono font-bold bg-slate-900 border px-2.5 py-1 rounded text-indigo-400 border-indigo-500/20 p-2 block";
    setTimeout(() => { logBox.classList.add('hidden'); }, 5000);
}

function updateOpacitySliderTrackerLabel() {
    const val = document.getElementById('watermark-opacity-range').value;
    document.getElementById('opacity-slider-value').innerText = `${Math.round(val * 100)}%`;
    synchronizeThumbnailsIndicationBadges();
}

function toggleWatermarkTypeInputContext() {
    const presetMode = document.getElementById('watermark-preset-select').value;
    const textWrap = document.getElementById('wrapper-text-input');
    const imageWrap = document.getElementById('wrapper-image-input');
    const stylesWrap = document.getElementById('wrapper-typography-styles');
    const inputField = document.getElementById('watermark-input-string');
    const now = new Date();

    if (presetMode === 'image') {
        textWrap.classList.add('hidden');
        stylesWrap.classList.add('hidden');
        imageWrap.classList.remove('hidden');
    } else {
        imageWrap.classList.add('hidden');
        textWrap.classList.remove('hidden');
        stylesWrap.classList.remove('hidden');
        
        if (presetMode === 'date') {
            inputField.value = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } else if (presetMode === 'datetime') {
            inputField.value = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (presetMode === 'custom') {
            inputField.value = "CONFIDENTIAL";
        }
    }
    synchronizeThumbnailsIndicationBadges();
}

async function cacheUploadedWatermarkImageBufferTrack(fileInputNode) {
    if (!fileInputNode.files || fileInputNode.files.length === 0) return;
    const targetFile = fileInputNode.files[0];
    globalWatermarkImageStampExtension = targetFile.name.split('.').pop().toLowerCase();
    
    if (targetFile.name.toLowerCase().endsWith('.gif') || targetFile.type === 'image/gif') {
        printPipelineInlineStatus("Rejection Intercept: GIF files cannot be used as watermark stamps.", true);
        fileInputNode.value = "";
        return;
    }

    const arrayBuf = await targetFile.arrayBuffer();
    globalWatermarkImageStampBytesArray = new Uint8Array(arrayBuf);

    const reader = new FileReader();
    reader.onload = function(e) {
        globalWatermarkImageStampElement = new Image();
        globalWatermarkImageStampElement.onload = function() {
            document.getElementById('image-cache-status-lbl').innerText = `✓ Stamp Cached: ${targetFile.name}`;
            document.getElementById('image-cache-status-lbl').className = "text-[9px] font-mono text-emerald-400 px-0.5 font-bold";
            document.getElementById('live-mock-img-preview').src = e.target.result;
            synchronizeThumbnailsIndicationBadges();
        };
        globalWatermarkImageStampElement.src = e.target.result;
    };
    reader.readAsDataURL(targetFile);
}

function setMatrixTargetAnchor(y, x) {
    document.querySelectorAll('.matrix-grid-dot').forEach(el => el.classList.remove('selected'));
    activeYAxisAnchor = y;
    activeXAxisAnchor = x;
    document.getElementById(`dot-${y}-${x}`).classList.add('selected');
    
    let friendlyLabel = `${y} ${x}`;
    if (x === "right_to_top_left") friendlyLabel = "Right to Top Left";
    else if (x === "bottom_left_to_top_right") friendlyLabel = "Bottom Left to Top Right";
    else if (x === "center_diagonal") friendlyLabel = "Center Full Diagonal";
    document.getElementById('matrix-status-lbl').innerText = friendlyLabel;
    
    synchronizeThumbnailsIndicationBadges();
}

async function loadTargetFileToWorkspace(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const file = inputNode.files[0];
    
    globalStagedFilename = file.name;
    showProcessingOverlay("Parsing PDF Document", "Assembling page raster buffers for reference...");

    const arrayBuffer = await file.arrayBuffer();
    globalStagedFileBytesArray = new Uint8Array(arrayBuffer);

    try {
        pdfjsDocumentInstance = await pdfjsLib.getDocument({ data: globalStagedFileBytesArray.slice(0) }).promise;
        activePreviewPageIndex = 0;
        
        await renderActivePageToPreviewNode();

        document.getElementById('empty-workspace-callout').classList.add('hidden');
        document.getElementById('live-image-frame-wrapper').classList.remove('hidden');
        document.getElementById('page-total-badge').innerText = `${pdfjsDocumentInstance.numPages} Pages Loaded`;
        document.getElementById('page-total-badge').classList.remove('hidden');
        
        if (pdfjsDocumentInstance.numPages > 1) {
            document.getElementById('floating-prev').classList.replace('hidden', 'flex');
            document.getElementById('floating-next').classList.replace('hidden', 'flex');
        } else {
            document.getElementById('floating-prev').classList.replace('flex', 'hidden');
            document.getElementById('floating-next').classList.replace('flex', 'hidden');
        }

    } catch(err) {
        console.error(err);
        printPipelineInlineStatus("Failed to assemble document catalog reference.", true);
    } finally {
        hideProcessingOverlay();
    }

    document.getElementById('numbering-parameters-wrapper').classList.replace('hidden', 'flex');
    document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');
    
    const basePrefix = globalStagedFilename.substring(0, globalStagedFilename.lastIndexOf('.')) || globalStagedFilename;
    document.getElementById('pdf-output-filename').value = `${basePrefix.replace(/\s+/g, '_')}_watermarked`;

    synchronizeThumbnailsIndicationBadges();
    document.getElementById('lock-btn').disabled = false;
}

// Direct sharp rendering onto vector canvas to counter text blurring bugs completely
async function renderActivePageToPreviewNode(targetCanvasId = 'simulator-vector-canvas') {
    if (!pdfjsDocumentInstance) return;
    const canvas = document.getElementById(targetCanvasId);
    if (!canvas) return;

    try {
        const pageObj = await pdfjsDocumentInstance.getPage(activePreviewPageIndex + 1);
        const viewport = pageObj.getViewport({ scale: 1.5 }); // Crisp 1.5x resolution
        const ctx = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        await pageObj.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        if (targetCanvasId === 'simulator-vector-canvas') {
            document.getElementById('manifest-title-lbl').innerText = `Staged Sheet Monitor Frame (Page ${activePreviewPageIndex + 1}/${pdfjsDocumentInstance.numPages})`;
        }
    } catch(e) {
        console.error("Vector blueprint drawing intercept failure: ", e);
    }
}

async function changePreviewPageStep(directionStep) {
    if (!pdfjsDocumentInstance) return;
    const targetPageIndex = activePreviewPageIndex + directionStep;
    
    if (targetPageIndex >= 0 && targetPageIndex < pdfjsDocumentInstance.numPages) {
        activePreviewPageIndex = targetPageIndex;
        showProcessingOverlay("Loading Page Frame", "Updating active thumbnail context view...");
        await renderActivePageToPreviewNode();
        hideProcessingOverlay();
    }
}

function synchronizeThumbnailsIndicationBadges() {
    if (!globalStagedFileBytesArray) return;

    const mode = document.getElementById('watermark-preset-select').value;
    const txtValue = document.getElementById('watermark-input-string').value.trim() || "STAMP";
    const opacity = document.getElementById('watermark-opacity-range').value;
    const customScaleSize = parseInt(document.getElementById('watermark-custom-size').value) || 14;
    
    const weight = document.getElementById('watermark-font-weight').value;
    const posture = document.getElementById('watermark-font-style').value;

    const mockText = document.getElementById('live-mock-num-preview');
    const mockImg = document.getElementById('live-mock-img-preview');

    mockText.style.cssText = "display: none;";
    mockImg.style.cssText = "display: none;";

    let targetNode = null;

    if (mode === 'image') {
        if (globalWatermarkImageStampElement) {
            targetNode = mockImg;
            mockImg.style.opacity = opacity;
            let calculatedPercentWidth = Math.min(60, Math.max(10, customScaleSize * 1.5));
            mockImg.style.maxWidth = `${calculatedPercentWidth}%`;
        }
    } else {
        targetNode = mockText;
        mockText.innerText = txtValue;
        mockText.style.color = `rgba(15, 23, 42, ${opacity})`;
        mockText.style.textShadow = "0 1px 2px rgba(255,255,255,0.7)";
        mockText.style.fontWeight = weight === "bold" ? "800" : "400";
        mockText.style.fontStyle = posture === "italic" ? "italic" : "normal";
        mockText.style.fontSize = `${customScaleSize + 2}px`;
    }

    if (targetNode) {
        targetNode.style.display = "block";
        targetNode.style.position = "absolute";
        
        if (activeXAxisAnchor === 'right_to_top_left') {
            targetNode.style.top = "2rem";
            targetNode.style.left = "2rem";
            targetNode.style.bottom = "auto";
            targetNode.style.right = "auto";
            targetNode.style.transform = "rotate(-25deg)";
        } 
        else if (activeXAxisAnchor === 'bottom_left_to_top_right') {
            targetNode.style.bottom = "4rem";
            targetNode.style.left = "2rem";
            targetNode.style.top = "auto";
            targetNode.style.right = "auto";
            targetNode.style.transform = "rotate(-45deg)";
            targetNode.style.transformOrigin = "bottom left";
        }
        else if (activeXAxisAnchor === 'center_diagonal') {
            targetNode.style.top = "50%";
            targetNode.style.left = "50%";
            targetNode.style.bottom = "auto";
            targetNode.style.right = "auto";
            targetNode.style.transform = "translate(-50%, -50%) rotate(-45deg)";
        }
        else {
            if (activeYAxisAnchor === 'top') {
                targetNode.style.top = "1.5rem";
                targetNode.style.bottom = "auto";
            } else if (activeYAxisAnchor === 'center') {
                targetNode.style.top = "50%";
                targetNode.style.bottom = "auto";
            } else {
                targetNode.style.top = "auto";
                targetNode.style.bottom = "1.5rem";
            }

            if (activeXAxisAnchor === 'left') {
                targetNode.style.left = "1.5rem";
                targetNode.style.right = "auto";
            } else if (activeXAxisAnchor === 'center') {
                targetNode.style.left = "50%";
                targetNode.style.right = "auto";
            } else {
                targetNode.style.left = "auto";
                targetNode.style.right = "1.5rem";
            }

            let translateX = "0%";
            let translateY = "0%";
            if (activeXAxisAnchor === 'center') translateX = "-50%";
            if (activeYAxisAnchor === 'center') translateY = "-50%";
            targetNode.style.transform = `translate(${translateX}, ${translateY})`;
        }
    }
}

async function triggerLightboxModalViewport() {
    if (!pdfjsDocumentInstance) return;
    document.getElementById('lightbox-modal-window').classList.replace('hidden', 'flex');
    await renderActivePageToPreviewNode('lightbox-render-canvas');
    document.getElementById('lightbox-index-badge').innerText = `HQ Document Simulation View // Page ${activePreviewPageIndex + 1}`;
}

function closeLightboxModalViewport() {
    document.getElementById('lightbox-modal-window').classList.replace('flex', 'hidden');
}

async function executePythonPdfWatermarkEngine() {
    if (!globalStagedFileBytesArray || globalStagedFileBytesArray.byteLength === 0 || !pyodideWasmInstance) {
        printPipelineInlineStatus("Pipeline Error: Array buffer is missing or detached.", true);
        return;
    }

    const mode = document.getElementById('watermark-preset-select').value;
    const textValue = document.getElementById('watermark-input-string').value.trim() || "STAMP";
    const opacity = parseFloat(document.getElementById('watermark-opacity-range').value);
    const customScaleSize = parseInt(document.getElementById('watermark-custom-size').value) || 14;
    const outputFilename = document.getElementById('pdf-output-filename').value.trim() || "watermarked_document";

    const isBoldSelection = document.getElementById('watermark-font-weight').value === 'bold';
    const isItalicSelection = document.getElementById('watermark-font-style').value === 'italic';
    
    let calculatedReportLabFont = "Helvetica";
    if (isBoldSelection && isItalicSelection) calculatedReportLabFont = "Helvetica-BoldOblique";
    else if (isBoldSelection) calculatedReportLabFont = "Helvetica-Bold";
    else if (isItalicSelection) calculatedReportLabFont = "Helvetica-Oblique";

    showProcessingOverlay("Python WASM Stamping Engine", "Injecting vector stamp matrices layers across document catalogs...");

    const robustArrayCloneSnapshot = new Uint8Array(globalStagedFileBytesArray);
    pyodideWasmInstance.FS.writeFile("raw_source.pdf", robustArrayCloneSnapshot);
    
    if (mode === 'image') {
        pyodideWasmInstance.FS.writeFile(`stamp_image.${globalWatermarkImageStampExtension}`, new Uint8Array(globalWatermarkImageStampBytesArray));
    }

    pyodideWasmInstance.globals.set("w_mode", mode);
    pyodideWasmInstance.globals.set("stamp_txt", textValue);
    pyodideWasmInstance.globals.set("opacity_val", opacity);
    pyodideWasmInstance.globals.set("place_y", activeYAxisAnchor);
    pyodideWasmInstance.globals.set("align_x", activeXAxisAnchor);
    pyodideWasmInstance.globals.set("font_size_param", customScaleSize);
    pyodideWasmInstance.globals.set("font_name_param", calculatedReportLabFont);
    pyodideWasmInstance.globals.set("img_ext", globalWatermarkImageStampExtension);

    setTimeout(async () => {
        try {
            await pyodideWasmInstance.runPythonAsync(`
                from pypdf import PdfReader, PdfWriter
                from reportlab.pdfgen import canvas
                import io
                import os
                import math

                reader = PdfReader("raw_source.pdf")
                writer = PdfWriter()

                for page in reader.pages:
                    mediabox = page.mediabox
                    width = float(mediabox.width)
                    height = float(mediabox.height)

                    packet = io.BytesIO()
                    can = canvas.Canvas(packet, pagesize=(width, height))
                    can.setFillAlpha(opacity_val)
                    can.setFillColorRGB(0.278, 0.333, 0.412)

                    # Dynamic scaling variables
                    is_diagonal = align_x in ["bottom_left_to_top_right", "right_to_top_left", "center_diagonal"]
                    dynamic_font_scale = font_size_param if not is_diagonal else int(width * 0.08)
                    
                    # Dimensions for image elements 
                    i_w = font_size_param * 7 if not is_diagonal else width * 0.5
                    i_h = font_size_param * 3 if not is_diagonal else (width * 0.5) * (3/7)

                    if align_x == "bottom_left_to_top_right":
                        can.saveState()
                        can.translate(width / 2.0, height / 2.0)
                        angle = math.degrees(math.atan2(height, width))
                        can.rotate(angle)
                        if w_mode == "image":
                            img_path = f"stamp_image.{img_ext}"
                            if os.path.exists(img_path):
                                can.drawImage(img_path, -i_w / 2.0, -i_h / 2.0, width=i_w, height=i_h, mask='auto')
                        else:
                            can.setFont(font_name_param, dynamic_font_scale)
                            can.drawCentredString(0, -dynamic_font_scale / 4.0, stamp_txt)
                        can.restoreState()
                    
                    elif align_x == "right_to_top_left":
                        can.saveState()
                        can.translate(width / 2.0, height / 2.0)
                        angle = math.degrees(math.atan2(height, width))
                        can.rotate(-angle)
                        if w_mode == "image":
                            img_path = f"stamp_image.{img_ext}"
                            if os.path.exists(img_path):
                                can.drawImage(img_path, -i_w / 2.0, -i_h / 2.0, width=i_w, height=i_h, mask='auto')
                        else:
                            can.setFont(font_name_param, dynamic_font_scale)
                            can.drawCentredString(0, -dynamic_font_scale / 4.0, stamp_txt)
                        can.restoreState()

                    elif align_x == "center_diagonal":
                        can.saveState()
                        can.translate(width / 2.0, height / 2.0)
                        can.rotate(45)
                        if w_mode == "image":
                            img_path = f"stamp_image.{img_ext}"
                            if os.path.exists(img_path):
                                can.drawImage(img_path, -i_w / 2.0, -i_h / 2.0, width=i_w, height=i_h, mask='auto')
                        else:
                            can.setFont(font_name_param, dynamic_font_scale)
                            can.drawCentredString(0, -dynamic_font_scale / 4.0, stamp_txt)
                        can.restoreState()
                            
                    else:
                        # Exact Standard Cartesian Coordinates Configuration Mapping
                        if place_y == "top": 
                            y_coord = height - 50 - (0 if w_mode == "image" else font_size_param)
                        elif place_y == "center": 
                            y_coord = height / 2.0
                        else: 
                            y_coord = 50

                        if align_x == "left": 
                            x_coord = 50
                        elif align_x == "center": 
                            x_coord = width / 2.0
                        else: 
                            x_coord = width - 50

                        if w_mode == "image":
                            # Compensate origin translation offset for exact matrix placement alignment
                            draw_x = x_coord if align_x == "left" else (x_coord - i_w/2.0 if align_x == "center" else x_coord - i_w)
                            draw_y = y_coord if place_y == "bottom" else (y_coord - i_h/2.0 if place_y == "center" else y_coord - i_h)
                            img_path = f"stamp_image.{img_ext}"
                            if os.path.exists(img_path):
                                can.drawImage(img_path, draw_x, draw_y, width=i_w, height=i_h, mask='auto')
                        else:
                            can.setFont(font_name_param, font_size_param)
                            # Safe baseline height alignment context variables
                            adjusted_y = y_coord - (font_size_param / 4.0) if place_y == "center" else y_coord
                            if align_x == "left": 
                                can.drawString(x_coord, adjusted_y, stamp_txt)
                            elif align_x == "center": 
                                can.drawCentredString(x_coord, adjusted_y, stamp_txt)
                            else: 
                                can.drawRightString(x_coord, adjusted_y, stamp_txt)

                    can.save()
                    packet.seek(0)
                    page.merge_page(PdfReader(packet).pages[0])
                    writer.add_page(page)

                with open("watermarked_output.pdf", "wb") as f:
                    writer.write(f)
            `);

            const outputBytes = pyodideWasmInstance.FS.readFile("watermarked_output.pdf");
            const blobStream = new Blob([outputBytes], { type: "application/pdf" });
            
            const linkAnchor = document.createElement('a');
            linkAnchor.download = `${outputFilename}.pdf`;
            linkAnchor.href = URL.createObjectURL(blobStream);
            document.body.appendChild(linkAnchor);
            linkAnchor.click();
            document.body.removeChild(linkAnchor);

            printPipelineInlineStatus("PDF Watermark execution completed successfully.");
            
            pyodideWasmInstance.FS.unlink("raw_source.pdf");
            pyodideWasmInstance.FS.unlink("watermarked_output.pdf");
            if (mode === 'image') pyodideWasmInstance.FS.unlink(`stamp_image.${globalWatermarkImageStampExtension}`);
        } catch (fatalError) {
            console.error(fatalError);
            printPipelineInlineStatus("Transformation Error inside Python runtime catalogs.", true);
        } finally {
            hideProcessingOverlay();
        }
    }, 300);
}

function purgeActiveWatermarkPipeline() { window.location.reload(); }