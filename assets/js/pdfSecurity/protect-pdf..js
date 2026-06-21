pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let originalFileBytes = null;
let pdfjsInstance = null;
let currentPageIndex = 0;
let pyodideInstance = null;
let correctPasswordToken = "";
let documentHasBeenLockedSuccessfully = false;

async function initializePythonWasmRuntime() {
    try {
        pyodideInstance = await loadPyodide();
        await pyodideInstance.loadPackage("micropip");
        const micropip = pyodideInstance.pyimport("micropip");
        await micropip.install("pypdf");
        
        document.getElementById('runtime-badge').className = "flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800/60 shrink-0 shadow-md";
        document.getElementById('runtime-status-text').innerText = "Python Loaded";
        document.getElementById('runtime-badge').children[0].className = "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse";
        
        updateMintButtonState(true);
    } catch(e) {
        console.error(e);
        document.getElementById('runtime-status-text').innerText = "Python Crash";
        document.getElementById('runtime-badge').children[0].className = "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse";
    }
}
initializePythonWasmRuntime();

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

function updateMintButtonState(ready) {
    const lockBtn = document.getElementById('lock-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    if (ready && originalFileBytes) {
        lockBtn.disabled = false;
        lockBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        
        if (documentHasBeenLockedSuccessfully) {
            downloadBtn.disabled = false;
            downloadBtn.className = "w-full min-h-[40px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 animate-fade-in";
        } else {
            downloadBtn.disabled = true;
            downloadBtn.className = "w-full min-h-[40px] bg-slate-800/80 text-slate-500 opacity-50 border border-slate-800/60 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        }
    } else {
        lockBtn.disabled = true;
        lockBtn.className = "w-full min-h-[40px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
        downloadBtn.disabled = true;
        downloadBtn.className = "w-full min-h-[40px] bg-slate-800 text-slate-500 opacity-50 font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-not-allowed";
    }
}

async function loadPdfToPipelineOrchestrator(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const buffer = await file.arrayBuffer();
    originalFileBytes = new Uint8Array(buffer);
    documentHasBeenLockedSuccessfully = false;

    pdfjsInstance = await pdfjsLib.getDocument({ data: originalFileBytes.slice(0) }).promise;
    currentPageIndex = 0;

    document.getElementById('simulator-empty-callout').classList.add('hidden');
    document.getElementById('simulator-raster-frame').classList.remove('hidden');
    document.getElementById('simulator-pagination-deck').classList.remove('hidden');
    document.getElementById('security-parameters-wrapper').classList.remove('hidden');
    document.getElementById('analytics-metrics-panel').classList.remove('hidden');
    document.getElementById('compilation-actions-deck').classList.remove('hidden');
    document.getElementById('empty-buffer-list-state').classList.add('hidden');

    document.getElementById('metrics-filename-lbl').innerText = file.name;
    document.getElementById('metrics-size-lbl').innerText = `Size: ${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById('metrics-pages-lbl').innerText = `Total Pages Found: ${pdfjsInstance.numPages} Sheets`;

    if (pdfjsInstance.numPages > 1) {
        document.getElementById('floating-prev').classList.replace('hidden', 'flex');
        document.getElementById('floating-next').classList.replace('hidden', 'flex');
    } else {
        document.getElementById('floating-prev').classList.replace('flex', 'hidden');
        document.getElementById('floating-next').classList.replace('flex', 'hidden');
    }

    updateMintButtonState(pyodideInstance !== null);
    evaluatePresentationButtonState();
    renderPreview();
}

async function renderPreview() {
    if (!pdfjsInstance) return;
    const page = await pdfjsInstance.getPage(currentPageIndex + 1);
    const canvas = document.getElementById('pdf-render-canvas');
    const ctx = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.0 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    document.getElementById('simulator-page-index-label').innerText = `Page ${currentPageIndex + 1} / ${pdfjsInstance.numPages}`;
}

function navigateSimulatorPageFrames(dir) {
    if (!pdfjsInstance) return;
    const next = currentPageIndex + dir;
    if (next >= 0 && next < pdfjsInstance.numPages) {
        currentPageIndex = next;
        renderPreview();
    }
}

function togglePasswordVisibility() {
    const el = document.getElementById('pdf-password-input');
    el.type = el.type === 'password' ? 'text' : 'password';
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const runtimeBadge= document.getElementById('runtime-badge');
    if (pdfjsInstance) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-2.5 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-300 text-slate-950 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 shrink-0";
        runtimeBadge.classList.add('hidden');
    }
}

function toggleFullscreenPresentation() {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const dropzone = document.getElementById('pdf-drop-zone');
    const authShield = document.getElementById('presentation-auth-shield');
    
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            if (dropzone) dropzone.classList.add('hidden');
            targetElement.classList.remove('p-6', 'bg-slate-950/10', 'border');
            targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
            sheet.classList.remove('max-w-[320px]', 'mt-6');
            sheet.classList.add('max-w-[70vh]', 'mt-0', 'h-[85vh]');
            document.getElementById('manifest-title-lbl').classList.add('text-red-400');
            
            correctPasswordToken = document.getElementById('pdf-password-input').value.trim();
            if(correctPasswordToken && documentHasBeenLockedSuccessfully) {
                document.getElementById('simulator-raster-frame').classList.add('hidden');
                document.getElementById('simulator-pagination-deck').classList.add('hidden');
                authShield.classList.remove('hidden');
                authShield.classList.add('flex');
            } else {
                renderPreview();
            }
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

function verifyPresentationPassword() {
    const inputPass = document.getElementById('presentation-password-test').value;
    if(inputPass === correctPasswordToken) {
        document.getElementById('presentation-auth-shield').classList.add('hidden');
        document.getElementById('presentation-auth-shield').classList.remove('flex');
        document.getElementById('simulator-raster-frame').classList.remove('hidden');
        document.getElementById('simulator-pagination-deck').classList.remove('hidden');
        renderPreview();
    } else {
        alert("Security Authorization Failed: Lock string tokens mismatch.");
    }
}

document.addEventListener('fullscreenchange', () => {
    const targetElement = document.getElementById('presentation-viewport-container');
    const sheet = document.getElementById('pdf-paper-sheet-simulator');
    const dropzone = document.getElementById('pdf-drop-zone');
    const authShield = document.getElementById('presentation-auth-shield');
    
    if (!document.fullscreenElement) {
        if (dropzone) dropzone.classList.remove('hidden');
        targetElement.classList.add('p-6', 'bg-slate-955/10', 'border');
        targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.add('max-w-[320px]', 'mt-6');
        sheet.classList.remove('max-w-[70vh]', 'mt-0', 'h-[85vh]');
        document.getElementById('manifest-title-lbl').classList.remove('text-red-400');
        
        authShield.classList.add('hidden');
        authShield.classList.remove('flex');
        document.getElementById('presentation-password-test').value = "";
        document.getElementById('simulator-raster-frame').classList.remove('hidden');
        document.getElementById('simulator-pagination-deck').classList.remove('hidden');
        renderPreview();
    }
});

window.addEventListener('keydown', function(event) {
    if ((event.key === 'Escape' || event.keyCode === 27) && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

async function executePythonPdfLock(shouldTriggerDownloadPayload = false) {
    if (!originalFileBytes || !pyodideInstance) return;
    const password = document.getElementById('pdf-password-input').value;
    if (!password) return alert("Please specify an authentication lock password.");

    showProcessingOverlay("MINTING CIPHER KEY", "Mounting binary data streams onto Python virtual filesystem...");

    setTimeout(async function() {
        try {
            pyodideInstance.FS.writeFile("source.pdf", originalFileBytes);
            pyodideInstance.globals.set("pass_str", password);

            updateProcessingOverlayStatus("Encrypting dictionary matrices variables using RC4-128 algorithms...");
            await pyodideInstance.runPythonAsync(`
                from pypdf import PdfReader, PdfWriter
                reader = PdfReader("source.pdf")
                writer = PdfWriter()
                for page in reader.pages:
                    writer.add_page(page)
                writer.encrypt(pass_str, algorithm="RC4-128")
                with open("locked.pdf", "wb") as out_f:
                    writer.write(out_f)
            `);

            documentHasBeenLockedSuccessfully = true;

            if (shouldTriggerDownloadPayload) {
                updateProcessingOverlayStatus("Flushing wrapped binary container to output stream...");
                const encryptedBytes = pyodideInstance.FS.readFile("locked.pdf");
                const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
                const a = document.createElement('a');
                a.download = document.getElementById('pdf-output-filename').value.trim() + ".pdf";
                a.href = URL.createObjectURL(blob);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }

            pyodideInstance.FS.unlink("source.pdf");
            pyodideInstance.FS.unlink("locked.pdf");
        } catch (err) {
            console.error(err);
            alert("Python Cryptographic Runtime Error processing arrays configuration tokens.");
        } finally {
            await hideProcessingOverlay();
            updateMintButtonState(true);
        }
    }, 450);
}

function purgeActivePdfPipeline() {
    window.location.reload();
}