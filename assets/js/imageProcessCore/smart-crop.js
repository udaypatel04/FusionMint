
let globalImageObjectRef = null;
let originalRenderedDimensions = { width: 0, height: 0 };

let isDraggingActiveState = false;
let pointerStartX = 0, pointerStartY = 0;

let transformMatrixState = {
    scale: 1.0,
    offsetX: 0,
    offsetY: 0
};

document.addEventListener('DOMContentLoaded', () => {
    hideProcessingOverlay();
});

function showProcessingOverlay(title = "Baking Operation Pipeline", subtitle = "Compiling data payload structures...") {
    const overlay = document.getElementById('matrix-processing-overlay');
    document.getElementById('overlay-main-title').innerText = title;
    document.getElementById('overlay-status-label').innerText = subtitle;
    overlay.classList.add('active');
}

function hideProcessingOverlay() {
    document.getElementById('matrix-processing-overlay').classList.remove('active');
}

function loadGraphicFileIntoCropPipeline(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    const targetFile = inputElement.files[0];

    showProcessingOverlay("Decompressing Image Object", "Mapping raster track layers channels...");

    const readerInstance = new FileReader();
    readerInstance.onload = function(e) {
        const imgElement = document.getElementById('pipeline-source-img');
        imgElement.onload = function() {
            globalImageObjectRef = imgElement;
            document.getElementById('empty-sandbox-state').classList.add('hidden');
            
            document.getElementById('metrics-filename-lbl').innerText = targetFile.name;
            document.getElementById('metrics-size-lbl').innerText = `Size: ${(targetFile.size / 1024).toFixed(1)} KB`;

            document.getElementById('crop-frame-boundary').classList.remove('hidden');
            imgElement.classList.remove('hidden');

            document.getElementById('crop-sliders-wrapper').classList.replace('hidden', 'flex');
            document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');

            resetTransformationsState();
            syncViewportMaskDimensions();
            setupDragInteractionHandlers();
            
            hideProcessingOverlay();
        };
        imgElement.src = e.target.result;
    };
    readerInstance.readAsDataURL(targetFile);
    inputElement.value = "";
}

function syncViewportMaskDimensions() {
    if (!globalImageObjectRef) return;
    const aspectPreset = document.getElementById('crop-aspect-ratio').value;
    const boundaryNode = document.getElementById('crop-frame-boundary');

    const dimensionsArr = aspectPreset.split('/');
    const widthRatio = parseFloat(dimensionsArr[0]);
    const heightRatio = parseFloat(dimensionsArr[1]);

    boundaryNode.style.aspectRatio = `${widthRatio} / ${heightRatio}`;

    if (widthRatio >= heightRatio) {
        boundaryNode.style.width = "400px";
        boundaryNode.style.height = `${Math.round(400 * (heightRatio / widthRatio))}px`;
    } else {
        boundaryNode.style.height = "380px";
        boundaryNode.style.width = `${Math.round(380 * (widthRatio / heightRatio))}px`;
    }

    setTimeout(() => {
        calculateRenderedBaselineImageDimensions();
        applyTransformations();
    }, 40);
}

function calculateRenderedBaselineImageDimensions() {
    if (!globalImageObjectRef) return;
    const boundaryNode = document.getElementById('crop-frame-boundary');
    const boxW = boundaryNode.clientWidth;
    const boxH = boundaryNode.clientHeight;

    const imageAspectRatio = globalImageObjectRef.naturalWidth / globalImageObjectRef.naturalHeight;
    const boundaryAspectRatio = boxW / boxH;

    if (imageAspectRatio > boundaryAspectRatio) {
        originalRenderedDimensions.width = boxW;
        originalRenderedDimensions.height = boxW / imageAspectRatio;
    } else {
        originalRenderedDimensions.height = boxH;
        originalRenderedDimensions.width = boxH * imageAspectRatio;
    }
}

function setupDragInteractionHandlers() {
    const boundaryNode = document.getElementById('crop-frame-boundary');
    
    boundaryNode.addEventListener('mousedown', (e) => {
        if (!globalImageObjectRef) return;
        isDraggingActiveState = true;
        boundaryNode.style.cursor = 'grabbing';
        pointerStartX = e.clientX - transformMatrixState.offsetX;
        pointerStartY = e.clientY - transformMatrixState.offsetY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingActiveState) return;
        transformMatrixState.offsetX = e.clientX - pointerStartX;
        transformMatrixState.offsetY = e.clientY - pointerStartY;
        
        document.getElementById('crop-offset-x').value = Math.round(transformMatrixState.offsetX);
        document.getElementById('crop-offset-y').value = Math.round(transformMatrixState.offsetY);
        applyTransformations();
    });

    window.addEventListener('mouseup', () => {
        isDraggingActiveState = false;
        boundaryNode.style.cursor = 'move';
    });

    boundaryNode.addEventListener('wheel', (e) => {
        if (!globalImageObjectRef) return;
        e.preventDefault();
        const incrementalFactor = 0.05;
        if (e.deltaY < 0) {
            transformMatrixState.scale = Math.min(transformMatrixState.scale + incrementalFactor, 3.5);
        } else {
            transformMatrixState.scale = Math.max(transformMatrixState.scale - incrementalFactor, 0.5);
        }
        document.getElementById('crop-scale').value = Math.round(transformMatrixState.scale * 100);
        applyTransformations();
    }, { passive: false });
}

function updateSlidersTransform() {
    transformMatrixState.scale = document.getElementById('crop-scale').value / 100;
    transformMatrixState.offsetX = parseFloat(document.getElementById('crop-offset-x').value);
    transformMatrixState.offsetY = parseFloat(document.getElementById('crop-offset-y').value);
    applyTransformations();
}

function applyTransformations() {
    if (!globalImageObjectRef) return;
    
    document.getElementById('lbl-crop-scale').innerText = `${Math.round(transformMatrixState.scale * 100)}%`;
    document.getElementById('lbl-crop-x').innerText = `${Math.round(transformMatrixState.offsetX)}px`;
    document.getElementById('lbl-crop-y').innerText = `${Math.round(transformMatrixState.offsetY)}px`;

    const wrapper = document.getElementById('image-transform-wrapper');
    wrapper.style.transform = `scale(${transformMatrixState.scale}) translate(${transformMatrixState.offsetX / transformMatrixState.scale}px, ${transformMatrixState.offsetY / transformMatrixState.scale}px)`;
}

function executeSmartCropExport() {
    if (!globalImageObjectRef) return;

    showProcessingOverlay("Slicing Vector Frame", "Calculating viewport subframe downsampling coordinates matrices...");

    setTimeout(() => {
        try {
            const canvas = document.getElementById('internal-slice-canvas');
            const ctx = canvas.getContext('2d');
            const boundaryNode = document.getElementById('crop-frame-boundary');
            const formatPreset = document.getElementById('download-format').value;

            const targetWidthFactor = 1200;
            const boundingAspectString = document.getElementById('crop-aspect-ratio').value.split('/');
            const aspectW = parseFloat(boundingAspectString[0]);
            const aspectH = parseFloat(boundingAspectString[1]);
            const targetHeightFactor = Math.round(targetWidthFactor * (aspectH / aspectW));

            canvas.width = targetWidthFactor;
            canvas.height = targetHeightFactor;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const coordinateScalingRatio = targetWidthFactor / boundaryNode.clientWidth;
            const maskCenterX = targetWidthFactor / 2;
            const maskCenterY = targetHeightFactor / 2;

            let finalPixelWidth = originalRenderedDimensions.width * coordinateScalingRatio;
            let finalPixelHeight = originalRenderedDimensions.height * coordinateScalingRatio;

            const computedWidthOutput = finalPixelWidth * transformMatrixState.scale;
            const computedHeightOutput = finalPixelHeight * transformMatrixState.scale;

            const destinationDrawX = maskCenterX - (computedWidthOutput / 2) + (transformMatrixState.offsetX * coordinateScalingRatio);
            const destinationDrawY = maskCenterY - (computedHeightOutput / 2) + (transformMatrixState.offsetY * coordinateScalingRatio);

            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, targetWidthFactor, targetHeightFactor);
            ctx.drawImage(globalImageObjectRef, destinationDrawX, destinationDrawY, computedWidthOutput, computedHeightOutput);

            let mimeType = "image/png";
            let extension = "png";

            if (formatPreset === 'jpg' || formatPreset === 'jpeg') {
                mimeType = "image/jpeg";
                extension = formatPreset;
            } else if (formatPreset === 'webp') {
                mimeType = "image/webp";
                extension = "webp";
            }

            const dataUrl = canvas.toDataURL(mimeType, 0.95);
            const anchorElement = document.createElement('a');
            anchorElement.download = `smart_crop_export.${extension}`;
            anchorElement.href = dataUrl;
            document.body.appendChild(anchorElement);
            anchorElement.click();
            document.body.removeChild(anchorElement);

        } catch(err) {
            console.error("Slicing breakdown error caught: ", err);
            alert("Matrix Composition Error framing coordinates channels loops.");
        } finally {
            hideProcessingOverlay();
        }
    }, 350);
}

function resetTransformationsState() {
    transformMatrixState = { scale: 1.0, offsetX: 0, offsetY: 0 };
    document.getElementById('crop-scale').value = 100;
    document.getElementById('crop-offset-x').value = 0;
    document.getElementById('crop-offset-y').value = 0;
}

function purgeActiveCropPipeline() {
    window.location.reload();
}