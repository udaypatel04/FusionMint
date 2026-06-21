
let globalStagedImageElement = null;
let globalStagedImageFilename = "";
let globalStagedImageMimeType = "";
let globalWatermarkImageStampElement = null;

let activeYAxisAnchor = "center";
let activeXAxisAnchor = "center";

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
    logBox.className = isError ? "text-[10px] font-mono font-bold bg-slate-900 border px-2.5 py-1 rounded text-red-400 border-red-500/20 p-2 block animate-pulse" : "text-[10px] font-mono font-bold bg-slate-900 border px-2.5 py-1 rounded text-emerald-400 border-emerald-500/20 p-2 block";
    setTimeout(() => { logBox.classList.add('hidden'); }, 5000);
}

function updateOpacitySliderTrackerLabel() {
    const val = document.getElementById('watermark-opacity-range').value;
    document.getElementById('opacity-slider-value').innerText = `${Math.round(val * 100)}%`;
    synchronizeThumbnailsIndicationBadges();
}

function updateBlurSliderTrackerLabel() {
    const val = document.getElementById('watermark-blur-range').value;
    document.getElementById('blur-slider-value').innerText = val === "0" ? "0px (Pristine)" : `${val}px`;
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
        } else if (presetMode === 'author') {
            inputField.value = "FusionMint Lab Core";
        } else if (presetMode === 'custom') {
            inputField.value = "CONFIDENTIAL";
        }
    }
    synchronizeThumbnailsIndicationBadges();
}

function cacheUploadedWatermarkImageBufferTrack(fileInputNode) {
    if (!fileInputNode.files || fileInputNode.files.length === 0) return;
    const targetFile = fileInputNode.files[0];
    
    if (targetFile.name.toLowerCase().endsWith('.gif') || targetFile.type === 'image/gif') {
        printPipelineInlineStatus("Rejection Intercept: GIF files cannot be used as watermark stamps.", true);
        fileInputNode.value = "";
        return;
    }

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
    document.getElementById('matrix-status-lbl').innerText = `${y} ${x}`;
    synchronizeThumbnailsIndicationBadges();
}

function loadTargetImageFileToWorkspace(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const imgFile = inputNode.files[0];
    
    if (imgFile.name.toLowerCase().endsWith('.gif') || imgFile.type === 'image/gif') {
        printPipelineInlineStatus("Rejection Intercept: GIF formatting is explicitly unsupported inside this workspace module.", true);
        inputNode.value = "";
        return;
    }

    globalStagedImageFilename = imgFile.name;
    globalStagedImageMimeType = imgFile.type;
    showProcessingOverlay("Mounting Image Grid", "Assembling buffer matrix track frames...");

    const reader = new FileReader();
    reader.onload = function(e) {
        globalStagedImageElement = new Image();
        globalStagedImageElement.onload = function() {
            document.getElementById('empty-workspace-callout').classList.add('hidden');
            document.getElementById('workspace-source-img-node').src = e.target.result;
            document.getElementById('live-image-frame-wrapper').classList.remove('hidden');
            document.getElementById('page-total-badge').innerText = `${globalStagedImageElement.width}x${globalStagedImageElement.height} Px`;
            document.getElementById('page-total-badge').classList.remove('hidden');

            document.getElementById('numbering-parameters-wrapper').classList.replace('hidden', 'flex');
            document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');

            const basePrefix = globalStagedImageFilename.substring(0, globalStagedImageFilename.lastIndexOf('.')) || globalStagedImageFilename;
            document.getElementById('pdf-output-filename').value = `${basePrefix.replace(/\s+/g, '_')}_watermarked`;

            hideProcessingOverlay();
            synchronizeThumbnailsIndicationBadges();
            document.getElementById('lock-btn').disabled = false;
        };
        globalStagedImageElement.src = e.target.result;
    };
    reader.readAsDataURL(imgFile);
}

function synchronizeThumbnailsIndicationBadges() {
    if (!globalStagedImageElement) return;

    const mode = document.getElementById('watermark-preset-select').value;
    const txtValue = document.getElementById('watermark-input-string').value.trim() || "STAMP";
    const opacity = document.getElementById('watermark-opacity-range').value;
    const blurVal = parseInt(document.getElementById('watermark-blur-range').value) || 0;
    
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
            mockImg.style.filter = blurVal > 0 ? `blur(${blurVal}px)` : 'none';
        }
    } else {
        targetNode = mockText;
        mockText.innerText = txtValue;
        mockText.style.color = `rgba(15, 23, 42, ${opacity})`;
        mockText.style.textShadow = "0 1px 2px rgba(255,255,255,0.7)";
        mockText.style.fontWeight = weight === "bold" ? "800" : "400";
        mockText.style.fontStyle = posture === "italic" ? "italic" : "normal";
        mockText.style.filter = blurVal > 0 ? `blur(${blurVal * 0.4}px)` : 'none';
    }

    if (targetNode) {
        targetNode.style.display = "block";
        targetNode.style.position = "absolute";
        
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

function processAndDownloadWatermarkedImage() {
    if (!globalStagedImageElement) return;

    const mode = document.getElementById('watermark-preset-select').value;
    const opacity = parseFloat(document.getElementById('watermark-opacity-range').value);
    const blurRadius = parseInt(document.getElementById('watermark-blur-range').value) || 0;
    const targetMime = document.getElementById('export-image-mime').value;
    const targetQuality = parseFloat(document.getElementById('export-image-quality').value) || 0.92;
    const outputFilename = document.getElementById('pdf-output-filename').value.trim() || "watermarked_image";
    const weight = document.getElementById('watermark-font-weight').value;
    const posture = document.getElementById('watermark-font-style').value;

    showProcessingOverlay("Compiling Image Asset Layers", "Executing client-side Canvas draw matrices pipelines loops...");

    setTimeout(() => {
        try {
            const renderingCanvas = document.createElement('canvas');
            renderingCanvas.width = globalStagedImageElement.width;
            renderingCanvas.height = globalStagedImageElement.height;
            const ctx = renderingCanvas.getContext('2d');

            ctx.drawImage(globalStagedImageElement, 0, 0);

            const safeOffsetRatioX = renderingCanvas.width * 0.07; 
            const safeOffsetRatioY = renderingCanvas.height * 0.07;

            let targetPlacementX = renderingCanvas.width / 2;
            let targetPlacementY = renderingCanvas.height / 2;

            if (activeXAxisAnchor === 'left') targetPlacementX = safeOffsetRatioX;
            else if (activeXAxisAnchor === 'right') targetPlacementX = renderingCanvas.width - safeOffsetRatioX;

            if (activeYAxisAnchor === 'top') targetPlacementY = safeOffsetRatioY;
            else if (activeYAxisAnchor === 'bottom') targetPlacementY = renderingCanvas.height - safeOffsetRatioY;

            ctx.globalAlpha = opacity;
            if (blurRadius > 0) {
                ctx.filter = `blur(${blurRadius}px)`;
            } else {
                ctx.filter = 'none';
            }

            if (mode === 'image' && globalWatermarkImageStampElement) {
                let stampWidth = renderingCanvas.width * 0.22; 
                let stampHeight = (globalWatermarkImageStampElement.height / globalWatermarkImageStampElement.width) * stampWidth;
                let drawX = targetPlacementX;
                let drawY = targetPlacementY;

                if (activeXAxisAnchor === 'center') drawX -= (stampWidth / 2);
                else if (activeXAxisAnchor === 'right') drawX -= stampWidth;

                if (activeYAxisAnchor === 'center') drawY -= (stampHeight / 2);
                else if (activeYAxisAnchor === 'bottom') drawY -= stampHeight;

                ctx.drawImage(globalWatermarkImageStampElement, drawX, drawY, stampWidth, stampHeight);
            } 
            else {
                const calculatedFontSize = Math.max(14, Math.round(renderingCanvas.width * 0.035));
                let fontStyleString = "";
                if (posture === "italic") fontStyleString += "italic ";
                if (weight === "bold") fontStyleString += "bold ";
                
                ctx.font = `${fontStyleString}${calculatedFontSize}px 'Plus Jakarta Sans', sans-serif`;
                ctx.fillStyle = "#1e293b"; 
                
                ctx.textAlign = activeXAxisAnchor === 'left' ? 'left' : (activeXAxisAnchor === 'right' ? 'right' : 'center');
                ctx.textBaseline = activeYAxisAnchor === 'top' ? 'top' : (activeYAxisAnchor === 'bottom' ? 'bottom' : 'middle');

                ctx.fillText(document.getElementById('watermark-input-string').value.trim() || "STAMP", targetPlacementX, targetPlacementY);
            }

            ctx.filter = 'none';
            const encodedDataUrl = renderingCanvas.toDataURL(targetMime, targetQuality);
            const fileExtension = targetMime.split('/')[1];
            
            const linkAnchor = document.createElement('a');
            linkAnchor.download = `${outputFilename}.${fileExtension}`;
            linkAnchor.href = encodedDataUrl;
            document.body.appendChild(linkAnchor);
            linkAnchor.click();
            document.body.removeChild(linkAnchor);

            printPipelineInlineStatus("Watermarked asset layer processed completely.");
        } catch(err) {
            console.error(err);
            printPipelineInlineStatus("Canvas Transformation Intercept Fault.", true);
        } finally {
            hideProcessingOverlay();
        }
    }, 300);
}

function purgeActiveWatermarkPipeline() { window.location.reload(); }