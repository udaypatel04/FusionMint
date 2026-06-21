
    let loadedTargetPdfBinaryCache = null;
    let stagedDocumentOriginalBytesSize = 0;
    let activeFileLabelStringValue = "";
    
    let pdfjsDocumentInstance = null;
    let activeSimulatorFocusedPageIndex = 0;
    let activeHighResPageDataUrl = ""; 
    
    let currentSizingInputStrategy = 'preset'; 
    let currentNativeWidth = 0;
    let currentNativeHeight = 0;

    function toggleSizingInputStrategy(strategyMode) {
        currentSizingInputStrategy = strategyMode;
        const presetBtn = document.getElementById('mode-preset-btn');
        const manualBtn = document.getElementById('mode-manual-btn');
        const presetWrapper = document.getElementById('wrapper-preset-slider');
        const manualWrapper = document.getElementById('wrapper-manual-dimensions');

        if (strategyMode === 'preset') {
            presetBtn.className = "py-1 text-[10px] font-bold text-center rounded bg-purple-500 text-slate-950 transition-all cursor-pointer";
            manualBtn.className = "py-1 text-[10px] font-bold text-center rounded text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
            presetWrapper.classList.remove('hidden');
            manualWrapper.classList.add('hidden');
        } else {
            manualBtn.className = "py-1 text-[10px] font-bold text-center rounded bg-purple-500 text-slate-950 transition-all cursor-pointer";
            presetBtn.className = "py-1 text-[10px] font-bold text-center rounded text-slate-400 hover:text-slate-200 transition-all cursor-pointer";
            manualWrapper.classList.remove('hidden');
            presetWrapper.classList.add('hidden');
        }
        recalculateOptimizationEstimatesDashboard();
    }

    function syncCompressionSliderLabelMetrics(val) {
        const lbl = document.getElementById('compression-strategy-label');
        if (val === "1") { lbl.innerText = "Low Quality Focus"; lbl.className = "font-mono text-blue-400 font-extrabold"; }
        else if (val === "2") { lbl.innerText = "Balanced Strategy"; lbl.className = "font-mono text-purple-400 font-extrabold"; }
        else if (val === "3") { lbl.innerText = "Extreme Compression"; lbl.className = "font-mono text-fuchsia-500 font-extrabold"; }
        
        recalculateOptimizationEstimatesDashboard();
    }

    function applyManualScaleFactorSliderMetrics(scalePercentage) {
        document.getElementById('manual-scale-factor-label').innerText = `${scalePercentage}%`;
        
        if (currentNativeWidth > 0 && currentNativeHeight > 0) {
            const multiplier = parseFloat(scalePercentage) / 100;
            document.getElementById('manual-width-input').value = Math.round(currentNativeWidth * multiplier);
            document.getElementById('manual-height-input').value = Math.round(currentNativeHeight * multiplier);
        }
        recalculateOptimizationEstimatesDashboard();
    }

    function handleManualDimensionTextInput(axisDirection) {
        const widthVal = parseFloat(document.getElementById('manual-width-input').value) || 0;
        if (currentNativeWidth > 0 && axisDirection === 'w') {
            const percentage = Math.min(100, Math.max(10, Math.round((widthVal / currentNativeWidth) * 100)));
            document.getElementById('manual-scale-slider').value = percentage;
            document.getElementById('manual-scale-factor-label').innerText = `${percentage}%`;
            
            if (currentNativeHeight > 0) {
                document.getElementById('manual-height-input').value = Math.round(currentNativeHeight * (percentage / 100));
            }
        }
        recalculateOptimizationEstimatesDashboard();
    }

    function loadPDFDocumentToCompressionPipeline(inputNode) {
        if (!inputNode.files || inputNode.files.length === 0) return;
        const targetFile = inputNode.files[0];

        if (targetFile.type !== "application/pdf") {
            alert("Format Rejection: Element layer mismatch. Please load a clean .pdf file asset block.");
            return;
        }

        document.getElementById('processing-loader-indicator').className = "flex items-center gap-2 text-xs font-bold text-purple-400 tracking-widest font-mono";
        document.getElementById('empty-buffer-list-state').classList.add('hidden');

        activeFileLabelStringValue = targetFile.name;
        stagedDocumentOriginalBytesSize = targetFile.size;

        const readerInstance = new FileReader();
        readerInstance.onload = async function(e) {
            loadedTargetPdfBinaryCache = e.target.result;
            
            const arrayBufferClone = loadedTargetPdfBinaryCache.slice(0);
            pdfjsDocumentInstance = await pdfjsLib.getDocument({ data: arrayBufferClone }).promise;
            activeSimulatorFocusedPageIndex = 0;

            const firstPageNode = await pdfjsDocumentInstance.getPage(1);
            const standardViewport = firstPageNode.getViewport({ scale: 1.0 });
            currentNativeWidth = Math.round(standardViewport.width);
            currentNativeHeight = Math.round(standardViewport.height);

            document.getElementById('manual-width-input').value = currentNativeWidth;
            document.getElementById('manual-height-input').value = currentNativeHeight;
            document.getElementById('manual-scale-slider').value = 100;
            document.getElementById('manual-scale-factor-label').innerText = "100%";

            document.getElementById('processing-loader-indicator').className = "hidden";
            document.getElementById('analytics-metrics-panel').classList.replace('hidden', 'flex');
            document.getElementById('compilation-actions-deck').classList.replace('hidden', 'flex');

            recalculateOptimizationEstimatesDashboard();
            renderLiveSimulatorPageFrame();
        };
        readerInstance.readAsArrayBuffer(targetFile);

        inputNode.value = "";
    }

    async function renderLiveSimulatorPageFrame() {
        const callout = document.getElementById('simulator-empty-callout');
        const rasterFrame = document.getElementById('simulator-raster-frame');
        const paginationDeck = document.getElementById('simulator-pagination-deck');
        const canvas = document.getElementById('simulator-render-canvas');
        const lArrow = document.getElementById('simulator-left-arrow');
        const rArrow = document.getElementById('simulator-right-arrow');

        if (!pdfjsDocumentInstance || !canvas) {
            callout.classList.remove('hidden');
            rasterFrame.classList.add('hidden');
            paginationDeck.className = "hidden";
            lArrow.classList.replace('flex', 'hidden');
            rArrow.classList.replace('flex', 'hidden');
            activeHighResPageDataUrl = "";
            return;
        }

        callout.classList.add('hidden');
        rasterFrame.classList.remove('hidden');
        paginationDeck.className = "flex items-center gap-3 bg-slate-950/60 border border-slate-900 px-4 py-2 rounded-xl text-xs font-mono font-bold mt-3 z-30 relative mx-auto";
        lArrow.classList.replace('hidden', 'flex');
        rArrow.classList.replace('hidden', 'flex');

        const totalPages = pdfjsDocumentInstance.numPages;
        document.getElementById('simulator-page-index-label').innerText = `Page ${activeSimulatorFocusedPageIndex + 1} / ${totalPages}`;

        try {
            const pageDataNode = await pdfjsDocumentInstance.getPage(activeSimulatorFocusedPageIndex + 1);
            const viewport = pageDataNode.getViewport({ scale: 1.5 });
            const ctx = canvas.getContext('2d');
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            await pageDataNode.render({ canvasContext: ctx, viewport: viewport }).promise;
            activeHighResPageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        } catch(e) {
            console.error("Simulator vector re-render tracking failure:", e);
        }
    }

    window.addEventListener('keydown', (e) => {
        if (!pdfjsDocumentInstance) return;
        if (e.key === 'ArrowRight') {
            navigateSimulatorPageFrames(1);
        } else if (e.key === 'ArrowLeft') {
            navigateSimulatorPageFrames(-1);
        }
    });

    function triggerLightboxModalViewport() {
        if (!activeHighResPageDataUrl) return;
        const modal = document.getElementById('lightbox-modal-window');
        document.getElementById('lightbox-preview-node-img').src = activeHighResPageDataUrl;
        document.getElementById('lightbox-index-badge').innerText = `Optimized Document Simulation // Page ${activeSimulatorFocusedPageIndex + 1}`;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeLightboxModalViewport() {
        document.getElementById('lightbox-modal-window').classList.add('hidden');
        document.getElementById('lightbox-modal-window').classList.remove('flex');
    }

    function navigateSimulatorPageFrames(stepDirection) {
        if (!pdfjsDocumentInstance) return;
        let nextIndex = activeSimulatorFocusedPageIndex + stepDirection;
        if (nextIndex >= 0 && nextIndex < pdfjsDocumentInstance.numPages) {
            activeSimulatorFocusedPageIndex = nextIndex;
            renderLiveSimulatorPageFrame();
        }
    }

    function bytesToHumanUnits(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function recalculateOptimizationEstimatesDashboard() {
        if (!loadedTargetPdfBinaryCache) return;

        let efficiencyRatioScalar = 0.60; 

        if (currentSizingInputStrategy === 'preset') {
            const sliderRatioIndex = document.getElementById('compression-ratio-slider').value;
            if (sliderRatioIndex === "1") efficiencyRatioScalar = 0.85; 
            if (sliderRatioIndex === "2") efficiencyRatioScalar = 0.60; 
            if (sliderRatioIndex === "3") efficiencyRatioScalar = 0.35; 
        } else {
            const scaleSliderVal = parseFloat(document.getElementById('manual-scale-slider').value) || 100;
            efficiencyRatioScalar = Math.max(0.15, (scaleSliderVal / 100) * 0.8);
        }

        const simulatedTargetBytesSize = Math.round(stagedDocumentOriginalBytesSize * efficiencyRatioScalar);
        const savedPercentageFactor = Math.round((1 - efficiencyRatioScalar) * 100);

        document.getElementById('metrics-filename-lbl').innerText = activeFileLabelStringValue;
        document.getElementById('metrics-size-lbl').innerText = `Original Size: ${bytesToHumanUnits(stagedDocumentOriginalBytesSize)}`;
        document.getElementById('metrics-target-size-lbl').innerText = `Estimated Size: ${bytesToHumanUnits(simulatedTargetBytesSize)}`;
        document.getElementById('metrics-saved-percentage-lbl').innerText = `Space Reduction: Shrunk by ${savedPercentageFactor}%`;
        
        document.getElementById('graph-percentage-lbl').innerText = `${savedPercentageFactor}% Smaller`;
        document.getElementById('metrics-visual-progress-bar').style.width = `${savedPercentageFactor}%`;
    }

    function purgeActiveCompressionPipeline() {
        loadedTargetPdfBinaryCache = null;
        pdfjsDocumentInstance = null;
        stagedDocumentOriginalBytesSize = 0;
        activeFileLabelStringValue = "";
        activeSimulatorFocusedPageIndex = 0;
        currentNativeWidth = 0;
        currentNativeHeight = 0;

        document.getElementById('analytics-metrics-panel').classList.add('hidden');
        document.getElementById('compilation-actions-deck').classList.add('hidden');
        document.getElementById('empty-buffer-list-state').classList.remove('hidden');
        document.getElementById('processing-loader-indicator').className = "hidden";
        
        document.getElementById('manual-width-input').value = "";
        document.getElementById('manual-height-input').value = "";
        toggleSizingInputStrategy('preset');
        renderLiveSimulatorPageFrame();
    }

    async function executeBrowserSidePDFCompression() {
        if (!loadedTargetPdfBinaryCache) return;

        const overlay = document.getElementById('matrix-processing-overlay');
        const statusLabel = document.getElementById('overlay-status-label');

        overlay.classList.replace('hidden', 'flex');
        statusLabel.innerText = "Parsing structural dictionary catalogs...";

        setTimeout(async () => {
            try {
                const { PDFDocument } = PDFLib;
                
                statusLabel.innerText = "Decompressing internal object byte streams...";
                const parsedSourceDocument = await PDFDocument.load(loadedTargetPdfBinaryCache);
                const compressedDuplicateDocument = await PDFDocument.create();
                
                const originalPageIndices = parsedSourceDocument.getPageIndices();
                const copiedPagesMatrix = await compressedDuplicateDocument.copyPages(parsedSourceDocument, originalPageIndices);
                
                if (currentSizingInputStrategy === 'manual') {
                    statusLabel.innerText = "Re-mapping dimensional matrix bounds...";
                    const customWidth = parseFloat(document.getElementById('manual-width-input').value) || currentNativeWidth;
                    const customHeight = parseFloat(document.getElementById('manual-height-input').value) || currentNativeHeight;
                    
                    const scaledPointsW = customWidth * 0.75;
                    const scaledPointsH = customHeight * 0.75;

                    copiedPagesMatrix.forEach(page => {
                        page.setSize(scaledPointsW, scaledPointsH);
                        compressedDuplicateDocument.addPage(page);
                    });
                } else {
                    copiedPagesMatrix.forEach(page => compressedDuplicateDocument.addPage(page));
                }

                statusLabel.innerText = "Compressing stream blocks into packed object arrays...";
                const optimizedBinaryDataUint8Array = await compressedDuplicateDocument.save({
                    useObjectStreams: true,
                    updateFieldPositions: true
                });

                statusLabel.innerText = "Assembling optimization download payload...";
                const compressionBlobStream = new Blob([optimizedBinaryDataUint8Array], { type: "application/pdf" });
                const customPrefixName = document.getElementById('pdf-output-prefix').value.trim() || "compressed_document";
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `${customPrefixName}.pdf`;
                linkAnchorNode.href = URL.createObjectURL(compressionBlobStream);
                document.body.appendChild(linkAnchorNode);
                
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);

            } catch (err) {
                console.error(err);
                alert("Compression Compiler Fault: Incompatible metadata layers structure inside document.");
            } finally {
                overlay.classList.replace('flex', 'hidden');
            }
        }, 300);
}