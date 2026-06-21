
let pyodideWasmInstance = null;
let encryptedFileBytesPayload = null;
let pdfjsDocumentInstance = null;
let activeSimulatorFocusedPageIndex = 0;
let documentHasBeenUnlockedSuccessfully = false;

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
    const unlockBtn = document.getElementById('unlock-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    if (pyodideWasmInstance && encryptedFileBytesPayload) {
        unlockBtn.disabled = false;
        unlockBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (documentHasBeenUnlockedSuccessfully) {
            downloadBtn.disabled = false;
            downloadBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        } else {
            downloadBtn.disabled = true;
            downloadBtn.className = "w-full min-h-[40px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        }
    } else {
        unlockBtn.disabled = true;
        unlockBtn.className = "w-full min-h-[40px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[40px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
    }
}

async function loadEncryptedPDFToPipeline(inputNode) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const pdfFile = inputNode.files[0];
    const arrayBuffer = await pdfFile.arrayBuffer();
    encryptedFileBytesPayload = new Uint8Array(arrayBuffer);
    documentHasBeenUnlockedSuccessfully = false;

    document.getElementById('empty-buffer-list-state').classList.add('hidden');
    document.getElementById('analytics-metrics-panel').classList.remove('hidden');
    document.getElementById('analytics-metrics-panel').classList.add('flex');
    document.getElementById('security-parameters-wrapper').classList.remove('hidden');
    document.getElementById('security-parameters-wrapper').classList.add('flex');
    document.getElementById('compilation-actions-deck').classList.remove('hidden');
    document.getElementById('compilation-actions-deck').classList.add('flex');

    document.getElementById('metrics-filename-lbl').innerText = pdfFile.name;
    document.getElementById('metrics-size-lbl').innerText = `Original Size: ${(pdfFile.size / 1024).toFixed(1)} KB`;

    const basePrefix = pdfFile.name.substring(0, pdfFile.name.lastIndexOf('.')) || pdfFile.name;
    document.getElementById('pdf-output-filename').value = `${basePrefix.replace(/\s+/g, '_')}_unlocked`;

    evaluateMintButtonState();
    probeStagedPDFSecurityProperties();
}

async function probeStagedPDFSecurityProperties() {
    if (!encryptedFileBytesPayload || !pyodideWasmInstance) return;
    pyodideWasmInstance.FS.writeFile("probe_target.pdf", encryptedFileBytesPayload);

    await pyodideWasmInstance.runPythonAsync(`
        from pypdf import PdfReader
        reader = PdfReader("probe_target.pdf")
        is_locked = reader.is_encrypted
        total_pages = len(reader.pages) if not is_locked else "Unknown (Locked)"
    `);

    const isLocked = pyodideWasmInstance.globals.get("is_locked");
    const totalPages = pyodideWasmInstance.globals.get("total_pages");
    const statusLabel = document.getElementById('metrics-encryption-type-lbl');
    const pagesLabel = document.getElementById('metrics-pages-lbl');

    if (isLocked) {
        statusLabel.innerText = "Status: Encrypted / Owner Lock Active";
        statusLabel.className = "text-xs font-bold text-red-400 font-mono";
        pagesLabel.innerText = "Total Pages Found: Protected Block";
    } else {
        statusLabel.innerText = "Status: Unencrypted / Free Document";
        statusLabel.className = "text-xs font-bold text-emerald-400 font-mono";
        pagesLabel.innerText = `Total Pages Found: ${totalPages} Sheets`;
        documentHasBeenUnlockedSuccessfully = true;
        initializeUnencryptedSimulatorView(encryptedFileBytesPayload.slice(0));
    }
    evaluateMintButtonState();
}

async function initializeUnencryptedSimulatorView(cleanBytesBuffer) {
    pdfjsDocumentInstance = await pdfjsLib.getDocument({ data: cleanBytesBuffer }).promise;
    activeSimulatorFocusedPageIndex = 0;

    document.getElementById('simulator-empty-callout').classList.add('hidden');
    document.getElementById('simulator-raster-frame').classList.remove('hidden');
    document.getElementById('simulator-pagination-deck').classList.remove('hidden');
    document.getElementById('simulator-pagination-deck').classList.add('flex');

    if (pdfjsDocumentInstance.numPages > 1) {
        document.getElementById('floating-prev').classList.replace('hidden', 'flex');
        document.getElementById('floating-next').classList.replace('hidden', 'flex');
    } else {
        document.getElementById('floating-prev').classList.replace('flex', 'hidden');
        document.getElementById('floating-next').classList.replace('flex', 'hidden');
    }

    renderActivePdfPagePreviewCanvas();
    evaluatePresentationButtonState();
}

async function renderActivePdfPagePreviewCanvas() {
    if (!pdfjsDocumentInstance) return;
    const pageNode = await pdfjsDocumentInstance.getPage(activeSimulatorFocusedPageIndex + 1);
    const canvas = document.getElementById('pdf-render-canvas');
    const ctx = canvas.getContext('2d');
    
    const baseViewport = pageNode.getViewport({ scale: 1.2 });
    canvas.width = baseViewport.width;
    canvas.height = baseViewport.height;

    await pageNode.render({ canvasContext: ctx, viewport: baseViewport }).promise;
    document.getElementById('simulator-page-index-label').innerText = `Page ${activeSimulatorFocusedPageIndex + 1} / ${pdfjsDocumentInstance.numPages}`;
}

function navigateSimulatorPageFrames(stepDirection) {
    if (!pdfjsDocumentInstance) return;
    const nextIndex = activeSimulatorFocusedPageIndex + stepDirection;
    if (nextIndex >= 0 && nextIndex < pdfjsDocumentInstance.numPages) {
        activeSimulatorFocusedPageIndex = nextIndex;
        renderActivePdfPagePreviewCanvas();
    }
}

function togglePasswordInputMaskField() {
    const input = document.getElementById('pdf-decryption-password');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const runtimeBadge= document.getElementById('runtime-badge');
    if (pdfjsDocumentInstance) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 animate-fade-in";
        runtimeBadge.classList.add('hidden');
    }
}

function toggleFullscreenPresentation() {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const dropzone = document.getElementById('pdf-drop-zone');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            if (dropzone) dropzone.classList.add('hidden');
            targetElement.classList.remove('p-6', 'bg-slate-950/10', 'border');
            targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
            sheet.classList.remove('max-w-[320px]', 'mt-6');
            sheet.classList.add('max-w-[70vh]', 'mt-0', 'h-[85vh]');
            renderActivePdfPagePreviewCanvas();
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const dropzone = document.getElementById('pdf-drop-zone');
    
    if (!document.fullscreenElement) {
        if (dropzone) dropzone.classList.remove('hidden');
        targetElement.classList.add('p-6', 'bg-slate-950/10', 'border');
        targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.add('max-w-[320px]', 'mt-6');
        sheet.classList.remove('max-w-[70vh]', 'mt-0', 'h-[85vh]');
        renderActivePdfPagePreviewCanvas();
    }
});

window.addEventListener('keydown', function(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

async function executePythonPDFUnlockOperation(shouldTriggerDownloadPayload = false) {
    if (!encryptedFileBytesPayload || !pyodideWasmInstance) return;
    const inputPass = document.getElementById('pdf-decryption-password').value.trim();
    
    showProcessingOverlay("Stripping Security Matrix", "Decrypting cryptographic file dictionary arrays...");

    pyodideWasmInstance.FS.writeFile("locked_source.pdf", encryptedFileBytesPayload);
    pyodideWasmInstance.globals.set("auth_pass_str", inputPass);

    setTimeout(async () => {
        try {
            await pyodideWasmInstance.runPythonAsync(`
                from pypdf import PdfReader, PdfWriter
                reader = PdfReader("locked_source.pdf")
                writer = PdfWriter()

                if reader.is_encrypted:
                    decrypt_success = reader.decrypt(auth_pass_str)
                else:
                    decrypt_success = True

                if decrypt_success or decrypt_success == 0:
                    for page in reader.pages:
                        writer.add_page(page)
                    with open("unlocked_output.pdf", "wb") as f:
                        writer.write(f)
                    unlock_flag = True
                else:
                    unlock_flag = False
            `);

            const unlockFlag = pyodideWasmInstance.globals.get("unlock_flag");
            if (!unlockFlag) {
                alert("User Password Mismatch: Invalid decryption credentials provided for this stream.");
                await hideProcessingOverlay();
                return;
            }

            updateProcessingOverlayStatus("Allocating clean data buffers onto target workspace...");
            const cleanBytes = pyodideWasmInstance.FS.readFile("unlocked_output.pdf");
            documentHasBeenUnlockedSuccessfully = true;
            
            await initializeUnencryptedSimulatorView(cleanBytes.slice(0));
            
            if (shouldTriggerDownloadPayload) {
                updateProcessingOverlayStatus("Packaging document download container...");
                const blobStream = new Blob([cleanBytes], { type: "application/pdf" });
                const customOutputName = document.getElementById('pdf-output-filename').value.trim() || "unlocked_document";
                
                const linkAnchorNode = document.createElement('a');
                linkAnchorNode.download = `${customOutputName}.pdf`;
                linkAnchorNode.href = URL.createObjectURL(blobStream);
                document.body.appendChild(linkAnchorNode);
                linkAnchorNode.click();
                document.body.removeChild(linkAnchorNode);
            }

            document.getElementById('metrics-encryption-type-lbl').innerText = "Status: Restrictions Stripped Successfully";
            document.getElementById('metrics-encryption-type-lbl').className = "text-xs font-bold text-emerald-400 font-mono";
            document.getElementById('metrics-pages-lbl').innerText = `Total Pages Found: ${pdfjsDocumentInstance.numPages} Sheets`;

            pyodideWasmInstance.FS.unlink("locked_source.pdf");
            pyodideWasmInstance.FS.unlink("unlocked_output.pdf");

        } catch (fatalError) {
            console.error(fatalError);
            alert("WASM Processing Error: Incorrect password string or incompatible compression streams.");
        } finally {
            await hideProcessingOverlay();
            evaluateMintButtonState();
        }
    }, 450);
}

function purgeActiveUnlockPipeline() {
    window.location.reload();
}