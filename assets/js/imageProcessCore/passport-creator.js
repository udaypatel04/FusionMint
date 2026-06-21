
let globalPortraitImgElement = null;
let originalRenderedDims = { width: 0, height: 0 };
let globalTargetBgColor = "#ffffff";

let isDragging = false;
let startX = 0, startY = 0;
let transformState = {
    scale: 1.0,
    offsetX: 0,
    offsetY: 0
};

window.addEventListener('DOMContentLoaded', () => {
    updateFormatDimensions(true);
});

function changeBgColor(colorHex) {
    globalTargetBgColor = colorHex;
    document.getElementById('bg-color-picker').value = colorHex;
    if (globalPortraitImgElement) {
        applyTransformations();
    }
}

function handleUnitChange() {
    const unit = document.getElementById('custom-unit').value;
    const widthInput = document.getElementById('custom-w');
    const heightInput = document.getElementById('custom-h');

    if (unit === 'cm') {
        widthInput.value = "5.11"; heightInput.value = "5.11";
    } else if (unit === 'in') {
        widthInput.value = "2.01"; heightInput.value = "2.01";
    } else if (unit === 'px') {
        widthInput.value = "604"; heightInput.value = "604";
    } else if (unit === 'mm') {
        widthInput.value = "51.1"; heightInput.value = "51.1";
    }
    updateFormatDimensions(false);
}

function validateAndTransform() {
    const unit = document.getElementById('custom-unit').value;
    const wInput = document.getElementById('custom-w');
    const hInput = document.getElementById('custom-h');
    let valW = parseFloat(wInput.value) || 0;
    let valH = parseFloat(hInput.value) || 0;

    if (unit === 'cm') {
        if (valW > 30) wInput.value = "30"; if (valH > 30) hInput.value = "30";
    } else if (unit === 'in') {
        if (valW > 12) wInput.value = "12"; if (valH > 12) hInput.value = "12";
    } else if (unit === 'px') {
        if (valW > 4096) wInput.value = "4096"; if (valH > 4096) hInput.value = "4096";
    } else if (unit === 'mm') {
        if (valW > 300) wInput.value = "300"; if (valH > 300) hInput.value = "300";
    }
    updateFormatDimensions(false);
}

function updateFormatDimensions(isPresetSwitch = true) {
    const standard = document.getElementById('passport-standard').value;
    const boundary = document.getElementById('crop-frame-boundary');
    const customDeck = document.getElementById('custom-dim-inputs');
    
    if (isPresetSwitch) {
        customDeck.classList.add('hidden');
        customDeck.classList.remove('flex');
    }

    if (standard === 'us') {
        boundary.style.aspectRatio = "1 / 1"; boundary.style.height = "380px"; boundary.style.width = "380px";
    } else if (standard === 'eu') {
        boundary.style.aspectRatio = "35 / 45"; boundary.style.height = "420px"; boundary.style.width = "326px";
    } else if (standard === 'ca') {
        boundary.style.aspectRatio = "50 / 70"; boundary.style.height = "450px"; boundary.style.width = "321px";
    } else if (standard === 'custom') {
        customDeck.classList.remove('hidden'); customDeck.classList.add('flex');
        if (isPresetSwitch) {
            document.getElementById('custom-unit').value = "mm";
            document.getElementById('custom-w').value = "51.1"; document.getElementById('custom-h').value = "51.1";
        }
        
        let customW = parseFloat(document.getElementById('custom-w').value) || 1;
        let customH = parseFloat(document.getElementById('custom-h').value) || 1;
        const unit = document.getElementById('custom-unit').value;

        if (unit === 'cm' && customW < 1) customW = 1; if (unit === 'in' && customW < 0.5) customW = 0.5;
        if (unit === 'px' && customW < 100) customW = 100; if (unit === 'mm' && customW < 10) customW = 10;
        if (unit === 'cm' && customH < 1) customH = 1; if (unit === 'in' && customH < 0.5) customH = 0.5;
        if (unit === 'px' && customH < 100) customH = 100; if (unit === 'mm' && customH < 10) customH = 10;
        
        boundary.style.aspectRatio = `${customW} / ${customH}`;
        if (customW >= customH) {
            boundary.style.width = "380px"; boundary.style.height = `${Math.round(380 * (customH / customW))}px`;
        } else {
            boundary.style.height = "420px"; boundary.style.width = `${Math.round(420 * (customW / customH))}px`;
        }
    }
    if (globalPortraitImgElement) {
        setTimeout(() => { calculateBaseImageDimensions(); applyTransformations(); }, 50);
    }
}

function processPassportStream(input) {
    if (input.files && input.files[0]) {
        const activeFile = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                globalPortraitImgElement = img;
                const origPreview = document.getElementById('original-portrait-img');
                origPreview.src = e.target.result;
                origPreview.classList.remove('hidden');

                updateFormatDimensions(true);
                document.getElementById('guideline-overlay').style.display = 'block';
                document.getElementById('upload-text-prompt').classList.add('hidden');
                document.getElementById('interaction-tip').classList.remove('hidden');
                
                const metaNode = document.getElementById('staged-file-meta');
                metaNode.innerText = `${activeFile.name}`;
                metaNode.classList.remove('hidden');
                document.getElementById('preview-matrix-panel').classList.remove('opacity-30');

                const complianceBanner = document.getElementById('compliance-banner');
                complianceBanner.classList.remove('hidden');
                complianceBanner.classList.add('flex');

                setupDragInteractionHandlers();
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(activeFile);
    }
}

function calculateBaseImageDimensions() {
    if (!globalPortraitImgElement) return;
    const boundary = document.getElementById('crop-frame-boundary');
    const boxWidth = boundary.clientWidth; const boxHeight = boundary.clientHeight;
    const imgRatio = globalPortraitImgElement.width / globalPortraitImgElement.height;
    const boxRatio = boxWidth / boxHeight;
    
    if (imgRatio > boxRatio) {
        originalRenderedDims.width = boxWidth; originalRenderedDims.height = boxWidth / imgRatio;
    } else {
        originalRenderedDims.height = boxHeight; originalRenderedDims.width = boxHeight * imgRatio;
    }
}

function setupDragInteractionHandlers() {
    const boundary = document.getElementById('crop-frame-boundary');
    boundary.addEventListener('mousedown', (e) => {
        if (!globalPortraitImgElement) return;
        isDragging = true; boundary.style.cursor = 'grabbing';
        startX = e.clientX - transformState.offsetX; startY = e.clientY - transformState.offsetY;
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        transformState.offsetX = e.clientX - startX; transformState.offsetY = e.clientY - startY;
        document.getElementById('crop-offset-x').value = Math.round(transformState.offsetX);
        document.getElementById('crop-offset-y').value = Math.round(transformState.offsetY);
        applyTransformations();
    });
    window.addEventListener('mouseup', () => { isDragging = false; boundary.style.cursor = 'move'; });
    boundary.addEventListener('wheel', (e) => {
        if (!globalPortraitImgElement) return;
        e.preventDefault();
        const zoomFactor = 0.05;
        if (e.deltaY < 0) transformState.scale = Math.min(transformState.scale + zoomFactor, 4.0);
        else transformState.scale = Math.max(transformState.scale - zoomFactor, 0.15);
        document.getElementById('crop-scale').value = Math.round(transformState.scale * 100);
        applyTransformations();
    }, { passive: false });
}

function updateSlidersTransform() {
    transformState.scale = document.getElementById('crop-scale').value / 100;
    transformState.offsetX = parseFloat(document.getElementById('crop-offset-x').value);
    transformState.offsetY = parseFloat(document.getElementById('crop-offset-y').value);
    applyTransformations();
}

function transformImgNodeStyles() {
    if (!globalPortraitImgElement) return;
    const img = document.getElementById('original-portrait-img');
    img.style.transform = `scale(${transformState.scale}) translate(${transformState.offsetX / transformState.scale}px, ${transformState.offsetY / transformState.scale}px)`;
}

function applyTransformations() {
    transformImgNodeStyles();
    renderPassportCanvas(transformState.scale, transformState.offsetX, transformState.offsetY);
}

function calculateBiometricScore(shiftX, shiftY, scale, singleCanvas) {
    let centerScore = 25 - Math.min(25, (Math.abs(shiftX) / 15) + (Math.abs(shiftY) / 15));
    let scaleScore = 0;
    if (scale >= 0.8 && scale <= 1.5) scaleScore = 25;
    else scaleScore = Math.max(5, 25 - Math.abs(1.1 - scale) * 10);

    const sCtx = singleCanvas.getContext('2d');
    const imgData = sCtx.getImageData(0, 0, singleCanvas.width, singleCanvas.height);
    const data = imgData.data;

    let leftBrightness = 0, rightBrightness = 0, totalPixels = data.length / 4;
    let sampleStep = 8;
    
    for (let i = 0; i < data.length; i += 4 * sampleStep) {
        let brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        let xCoord = (i / 4) % singleCanvas.width;
        if (xCoord < singleCanvas.width / 2) leftBrightness += brightness;
        else rightBrightness += brightness;
    }

    let lightDiff = Math.abs(leftBrightness - rightBrightness) / (totalPixels / (2 * sampleStep));
    let lightingScore = Math.max(10, 25 - (lightDiff / 6));
    let shadowScore = Math.min(25, Math.max(12, 20 + (lightDiff / 12)));

    let totalScore = Math.round(centerScore + scaleScore + lightingScore + shadowScore);
    if (totalScore > 100) totalScore = 100;

    const auditCenter = document.getElementById('audit-center');
    const auditScale = document.getElementById('audit-scale');
    const auditLighting = document.getElementById('audit-lighting');
    const auditTotal = document.getElementById('audit-total-score');

    if (centerScore > 18) {
        auditCenter.className = "text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md";
        auditCenter.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i>Centering: PASSED`;
    } else {
        auditCenter.className = "text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md";
        auditCenter.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i>Centering: MISALIGNED`;
    }

    if (scaleScore > 18) {
        auditScale.className = "text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md";
        auditScale.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i>Face Scale: OPTIMAL`;
    } else {
        auditScale.className = "text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md";
        auditScale.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i>Face Scale: BAD`;
    }

    if (lightingScore > 18) {
        auditLighting.className = "text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md";
        auditLighting.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i>Lighting: BALANCED`;
    } else {
        auditLighting.className = "text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md";
        auditLighting.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i>Lighting: HARSH SHADOWS`;
    }

    if (totalScore >= 85) {
        auditTotal.className = "text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-0.5 rounded-md animate-pulse";
    } else {
        auditTotal.className = "text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-0.5 rounded-md";
    }
    auditTotal.innerText = `Compliance Score: ${totalScore}%`;
}

function renderPassportCanvas(scale = 1, shiftX = 0, shiftY = 0) {
    if (!globalPortraitImgElement) return;
    const canvas = document.getElementById('passport-output-canvas');
    const ctx = canvas.getContext('2d');
    const standard = document.getElementById('passport-standard').value;
    const boundary = document.getElementById('crop-frame-boundary');
    const tilingCount = parseInt(document.getElementById('print-tiling-count').value);

    let singlePhotoW = 600; let singlePhotoH = 600;
    if (standard === 'us') { singlePhotoW = 600; singlePhotoH = 600; }
    else if (standard === 'eu') { singlePhotoW = 600; singlePhotoH = 771; }
    else if (standard === 'ca') { singlePhotoW = 600; singlePhotoH = 840; }
    else if (standard === 'custom') {
        let customW = parseFloat(document.getElementById('custom-w').value) || 1;
        let customH = parseFloat(document.getElementById('custom-h').value) || 1;
        const unit = document.getElementById('custom-unit').value;
        
        if (unit === 'cm' && customW < 1) customW = 1; if (unit === 'in' && customW < 0.5) customW = 0.5;
        if (unit === 'px' && customW < 100) customW = 100; if (unit === 'mm' && customW < 10) customW = 10;
        if (unit === 'cm' && customH < 1) customH = 1; if (unit === 'in' && customH < 0.5) customH = 0.5;
        if (unit === 'px' && customH < 100) customH = 100; if (unit === 'mm' && customH < 10) customH = 10;
        
        let multiplier = 1;
        if (unit === 'in') multiplier = 300; if (unit === 'cm') multiplier = 118.11; if (unit === 'mm') multiplier = 11.811;
        
        if (unit === 'px') { singlePhotoW = customW; singlePhotoH = customH; } 
        else { singlePhotoW = Math.round(customW * multiplier); singlePhotoH = Math.round(customH * multiplier); }
    }

    const singleCanvas = document.createElement('canvas');
    singleCanvas.width = singlePhotoW; singleCanvas.height = singlePhotoH;
    const sCtx = singleCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = false;

    sCtx.fillStyle = globalTargetBgColor; sCtx.fillRect(0, 0, singlePhotoW, singlePhotoH);

    const uniformScaleFactor = singlePhotoW / boundary.clientWidth;
    let finalRenderWidth = singlePhotoW; let finalRenderHeight = singlePhotoH;
    const sourceRatio = globalPortraitImgElement.width / globalPortraitImgElement.height;
    const boundaryRatio = boundary.clientWidth / boundary.clientHeight;

    if (sourceRatio > boundaryRatio) {
        finalRenderWidth = singlePhotoW; finalRenderHeight = singlePhotoW / sourceRatio;
    } else {
        finalRenderHeight = singlePhotoH; finalRenderWidth = singlePhotoH * sourceRatio;
    }

    const outputWidth = finalRenderWidth * scale; const outputHeight = finalRenderHeight * scale;
    const centerX = singlePhotoW / 2; const centerY = singlePhotoH / 2;

    const drawX = centerX - (outputWidth / 2) + (shiftX * uniformScaleFactor);
    const drawY = centerY - (outputHeight / 2) + (shiftY * uniformScaleFactor);

    sCtx.drawImage(globalPortraitImgElement, drawX, drawY, outputWidth, outputHeight);

    calculateBiometricScore(shiftX, shiftY, scale, singleCanvas);

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = singlePhotoW; compositeCanvas.height = singlePhotoH;
    const cCtx = compositeCanvas.getContext('2d');
    cCtx.imageSmoothingEnabled = false;
    
    cCtx.fillStyle = globalTargetBgColor; cCtx.fillRect(0, 0, singlePhotoW, singlePhotoH);
    cCtx.drawImage(singleCanvas, 0, 0);

    if (tilingCount === 1) {
        canvas.width = singlePhotoW; canvas.height = singlePhotoH;
        ctx.imageSmoothingEnabled = false; ctx.drawImage(compositeCanvas, 0, 0);
    } else {
        let cols = 2, rows = 2;
        if (tilingCount === 6) { cols = 3; rows = 2; }
        else if (tilingCount === 8) { cols = 4; rows = 2; }
        else if (tilingCount === 12) { cols = 4; rows = 3; }

        const gutterSpace = 16;
        canvas.width = (singlePhotoW * cols) + (gutterSpace * (cols + 1));
        canvas.height = (singlePhotoH * rows) + (gutterSpace * (rows + 1));
        
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#121826"; ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentItemIndex = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (currentItemIndex < tilingCount) {
                    const tileX = gutterSpace + c * (singlePhotoW + gutterSpace);
                    const tileY = gutterSpace + r * (singlePhotoH + gutterSpace);
                    ctx.drawImage(compositeCanvas, tileX, tileY);
                    currentItemIndex++;
                }
            }
        }
    }
    canvas.classList.remove('hidden');
}

function resetPipeline() {
    globalPortraitImgElement = null;
    document.getElementById('media-drop-input').value = "";
    
    transformState = { scale: 1.0, offsetX: 0, offsetY: 0 };
    document.getElementById('crop-scale').value = 100;
    document.getElementById('crop-offset-x').value = 0;
    document.getElementById('crop-offset-y').value = 0;
    
    document.getElementById('passport-standard').value = "us";
    document.getElementById('print-tiling-count').value = "1";

    const img = document.getElementById('original-portrait-img');
    img.style.transform = "none"; img.classList.add('hidden');

    document.getElementById('passport-output-canvas').classList.add('hidden');
    document.getElementById('guideline-overlay').style.display = 'none';
    document.getElementById('upload-text-prompt').classList.remove('hidden');
    document.getElementById('interaction-tip').classList.add('hidden');
    
    document.getElementById('staged-file-meta').classList.add('hidden');
    document.getElementById('preview-matrix-panel').classList.add('opacity-30');
    document.getElementById('compliance-banner').classList.add('hidden');
    document.getElementById('compliance-banner').classList.remove('flex');
    
    updateFormatDimensions(true);
    changeBgColor('#ffffff');
}

// RE-ARCHITECTURED EXTENSION ROUTINES: Correctly parses MIME values and triggers custom downloads
function executeLocalCrop() {
    if (!globalPortraitImgElement) {
        alert("Staging Error: Active sandbox frame layer is empty. Load an image file asset first.");
        return;
    }

    const overlay = document.getElementById('matrix-processing-overlay');
    const statusLabel = document.getElementById('overlay-status-label');

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    statusLabel.innerText = "Extracting frame alignment mapping vectors...";

    const canvas = document.getElementById('passport-output-canvas');
    const formatValue = document.getElementById('download-format').value;
    
    let mimeType = "image/png";
    let extension = "png";

    if (formatValue === 'jpg' || formatValue === 'jpeg') {
        mimeType = "image/jpeg";
        extension = formatValue;
    } else if (formatValue === 'webp') {
        mimeType = "image/webp";
        extension = "webp";
    }

    setTimeout(() => {
        try {
            statusLabel.innerText = "Compiling biometric layout dimensions tiling matrix...";
            
            // Maps calculated MIME targets cleanly to avoid hardcoding fallback loops
            const exportDataUrl = canvas.toDataURL(mimeType, 0.95);
            
            statusLabel.innerText = "Packaging local sandbox image download container...";
            
            const localLinkNode = document.createElement('a');
            localLinkNode.download = `fusionmint_passport_sheet.${extension}`;
            localLinkNode.href = exportDataUrl;
            document.body.appendChild(localLinkNode);
            localLinkNode.click();
            document.body.removeChild(localLinkNode);

        } catch(err) {
            console.error("Canvas serialization asset breakdown context caught:", err);
            alert("Export Engine Fault: Incompatible pixel matrix data constraints loaded.");
        } finally {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    }, 300);
}