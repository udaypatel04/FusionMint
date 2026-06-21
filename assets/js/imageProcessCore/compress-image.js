let globalStagedImageElement = null;
let originalFileWeightBytes = 0;
let originalFileNameStr = "";

function updateIndicator(value) {
    document.getElementById('slider-indicator').innerText = value + '%';
    if (globalStagedImageElement) {
        renderCompressedCanvas();
    }
}

function processImageStream(input) {
    if (input.files && input.files[0]) {
        const activeFile = input.files[0];
        originalFileWeightBytes = activeFile.size;
        originalFileNameStr = activeFile.name;
        const fileSizeMB = (originalFileWeightBytes / (1024 * 1024)).toFixed(2);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                globalStagedImageElement = img;
                
                const origPreview = document.getElementById('original-preview-img');
                origPreview.src = e.target.result;
                origPreview.classList.remove('hidden');
                
                document.getElementById('original-size-badge').innerText = `${fileSizeMB} MB (${img.width}x${img.height})`;

                renderCompressedCanvas();

                document.getElementById('upload-icon-logo').classList.add('hidden');
                document.getElementById('upload-text-prompt').classList.add('hidden');
                
                const metaNode = document.getElementById('staged-file-meta');
                metaNode.innerText = `${originalFileNameStr}`;
                metaNode.classList.remove('hidden');

                document.getElementById('reset-btn').classList.remove('hidden');
                document.getElementById('preview-matrix-panel').classList.remove('opacity-30');
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(activeFile);
    }
}

function renderCompressedCanvas() {
    if (!globalStagedImageElement) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    const qualityValue = document.getElementById('compression-factor-range').value / 100;

    tempCanvas.width = globalStagedImageElement.width;
    tempCanvas.height = globalStagedImageElement.height;
    
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(globalStagedImageElement, 0, 0, tempCanvas.width, tempCanvas.height);

    const quantizedDataUrlStr = tempCanvas.toDataURL('image/jpeg', qualityValue);
    
    const compPreviewNode = document.getElementById('compressed-preview-img');
    compPreviewNode.src = quantizedDataUrlStr;
    compPreviewNode.classList.remove('hidden');

    let calculatedCompressionWeightBytes = originalFileWeightBytes * (qualityValue * 0.85 + 0.05);
    if (qualityValue > 0.92) {
        calculatedCompressionWeightBytes = originalFileWeightBytes * qualityValue;
    }
    const calculatedMBStr = (Math.min(calculatedCompressionWeightBytes, originalFileWeightBytes) / (1024 * 1024)).toFixed(2);
    document.getElementById('compressed-size-badge').innerText = `Est: ${calculatedMBStr} MB`;
}

function resetPipeline() {
    globalStagedImageElement = null;
    originalFileWeightBytes = 0;
    originalFileNameStr = "";
    document.getElementById('media-drop-input').value = "";
    
    document.getElementById('original-preview-img').classList.add('hidden');
    document.getElementById('compressed-preview-img').classList.add('hidden');
    document.getElementById('original-size-badge').innerText = "";
    document.getElementById('compressed-size-badge').innerText = "";
    
    document.getElementById('upload-icon-logo').classList.remove('hidden');
    document.getElementById('upload-text-prompt').classList.remove('hidden');
    
    document.getElementById('staged-file-meta').classList.add('hidden');
    document.getElementById('reset-btn').classList.add('hidden');
    document.getElementById('preview-matrix-panel').classList.add('opacity-30');
}

function executeLocalQuantization() {
    if (!globalStagedImageElement) {
        alert("Staging Error: Monitor stream empty. Select an asset file framework configuration target.");
        return;
    }

    const overlay = document.getElementById('matrix-processing-overlay');
    const statusLabel = document.getElementById('overlay-status-label');

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    statusLabel.innerText = "Allocating sandbox pixel memory block bounds...";
    
    setTimeout(() => {
        try {
            statusLabel.innerText = "Re-packing image matrix compression coordinates...";
            
            const productionCanvasNode = document.createElement('canvas');
            const productionCtx = productionCanvasNode.getContext('2d');
            
            productionCanvasNode.width = globalStagedImageElement.width;
            productionCanvasNode.height = globalStagedImageElement.height;
            productionCtx.drawImage(globalStagedImageElement, 0, 0, productionCanvasNode.width, productionCanvasNode.height);
            
            const factorValue = document.getElementById('compression-factor-range').value / 100;
            const exportDataUrl = productionCanvasNode.toDataURL('image/jpeg', factorValue);
            
            statusLabel.innerText = "Minting optimized image container asset file...";
            
            const localLinkNode = document.createElement('a');
            localLinkNode.download = `fusionmint_${originalFileNameStr.split('.')[0] || 'compressed'}.jpg`;
            localLinkNode.href = exportDataUrl;
            document.body.appendChild(localLinkNode);
            localLinkNode.click();
            document.body.removeChild(localLinkNode);

        } catch(fatalError) {
            console.error("Local packing crash context:", fatalError);
            alert("Quantization Fault: Error rendering canvas pixel mapping bounds.");
        } finally {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    }, 300);
}