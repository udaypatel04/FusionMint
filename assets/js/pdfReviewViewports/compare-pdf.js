
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let byteCacheA = null, byteCacheB = null;
let pdfDocA = null, pdfDocB = null;
let activePageA = 0, activePageB = 0;
let activeZoomScaleA = 1.0, activeZoomScaleB = 1.0;

async function stageFile(inputNode, slot) {
    if (!inputNode.files || inputNode.files.length === 0) return;
    const targetFile = inputNode.files[0];
    const arrayBuffer = await targetFile.arrayBuffer();

    document.getElementById(`lbl-file-${slot.toLowerCase()}`).innerHTML = `<i class="fa-solid fa-file-pdf mr-1.5 opacity-80"></i> ${targetFile.name}`;
    document.getElementById(`btn-remove-${slot.toLowerCase()}`).classList.remove('hidden');

    if (slot === 'A') {
        byteCacheA = new Uint8Array(arrayBuffer);
        pdfDocA = await pdfjsLib.getDocument({ data: byteCacheA.slice(0) }).promise;
        activePageA = 0;
        document.getElementById('drop-zone-a').classList.add('hidden');
        document.getElementById('scroll-box-a').classList.remove('hidden');
        document.getElementById('controls-a').classList.remove('hidden');
        document.getElementById('lbl-total-pages-a').innerText = `/ ${pdfDocA.numPages}`;
        
        document.getElementById('floating-prev-a').classList.replace('hidden', 'flex');
        document.getElementById('floating-next-a').classList.replace('hidden', 'flex');

        initializeIndependentViewportInteractions('scroll-box-a', 'A');
        renderLightboxPageFrame('A');
    } else {
        byteCacheB = new Uint8Array(arrayBuffer);
        pdfDocB = await pdfjsLib.getDocument({ data: byteCacheB.slice(0) }).promise;
        activePageB = 0;
        document.getElementById('drop-zone-b').classList.add('hidden');
        document.getElementById('scroll-box-b').classList.remove('hidden');
        document.getElementById('controls-b').classList.remove('hidden');
        document.getElementById('lbl-total-pages-b').innerText = `/ ${pdfDocB.numPages}`;
        
        document.getElementById('floating-prev-b').classList.replace('hidden', 'flex');
        document.getElementById('floating-next-b').classList.replace('hidden', 'flex');

        initializeIndependentViewportInteractions('scroll-box-b', 'B');
        renderLightboxPageFrame('B');
    }

    evaluatePresentationButtonState();
}

function removeLoadedPdf(slot) {
    const lowSlot = slot.toLowerCase();
    if (slot === 'A') {
        byteCacheA = null; pdfDocA = null; activePageA = 0; activeZoomScaleA = 1.0;
        document.getElementById('drop-zone-a').classList.remove('hidden');
        document.getElementById('scroll-box-a').classList.add('hidden');
        document.getElementById('controls-a').classList.add('hidden');
        document.getElementById('btn-remove-a').classList.add('hidden');
        document.getElementById('lbl-file-a').innerHTML = `<i class="fa-solid fa-file-circle-minus mr-1.5 opacity-70"></i> Monitor A Source`;
        document.getElementById('input-a').value = "";
    } else {
        byteCacheB = null; pdfDocB = null; activePageB = 0; activeZoomScaleB = 1.0;
        document.getElementById('drop-zone-b').classList.remove('hidden');
        document.getElementById('scroll-box-b').classList.add('hidden');
        document.getElementById('controls-b').classList.add('hidden');
        document.getElementById('btn-remove-b').classList.add('hidden');
        document.getElementById('lbl-file-b').innerHTML = `<i class="fa-solid fa-file-signature mr-1.5 opacity-70"></i> Monitor B Variant`;
        document.getElementById('input-b').value = "";
    }
    
    document.getElementById(`floating-prev-${lowSlot}`).classList.replace('flex', 'hidden');
    document.getElementById(`floating-next-${lowSlot}`).classList.replace('flex', 'hidden');

    evaluatePresentationButtonState();
}

function evaluatePresentationButtonState() {
    const btn = document.getElementById('btn-fullscreen-presentation');
    const badge = document.getElementById('badge-workspace');
    if (pdfDocA && pdfDocB) {
        btn.disabled = false;
        btn.classList.remove('hidden');
        btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 animate-fade-in";
        badge.classList.add('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('hidden');
        badge.classList.remove('hidden');
    }
}

function toggleFullscreenPresentation() {
    const targetElement = document.getElementById('split-workspace-grid');
    if (!document.fullscreenElement) {
        targetElement.requestFullscreen().then(() => {
            targetElement.classList.remove('p-4', 'gap-4');
            targetElement.classList.add('p-0', 'gap-0', 'bg-[#02040a]');
        }).catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const grid = document.getElementById('split-workspace-grid');
    if (!document.fullscreenElement) {
        grid.classList.add('p-4', 'gap-4');
        grid.classList.remove('p-0', 'gap-0', 'bg-[#02040a]');
        setTimeout(() => { renderLightboxPageFrame('A'); renderLightboxPageFrame('B'); }, 100);
    }
});

async function renderLightboxPageFrame(slot) {
    const isA = slot === 'A';
    const doc = isA ? pdfDocA : pdfDocB;
    const pIdx = isA ? activePageA : activePageB;

    if (!doc) return;

    const page = await doc.getPage(pIdx + 1);
    const canvas = document.getElementById(isA ? 'canvas-compare-a' : 'canvas-compare-b');
    const ctx = canvas.getContext('2d');

    const viewport = page.getViewport({ scale: 2.0 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = (viewport.width / 2) + "px";
    canvas.style.height = (viewport.height / 2) + "px";

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    updateScaleTransformCSS(slot);
    
    document.getElementById(`input-jump-page-${slot.toLowerCase()}`).value = pIdx + 1;
}

function updateScaleTransformCSS(slot) {
    const isA = slot === 'A';
    const scale = isA ? activeZoomScaleA : activeZoomScaleB;
    document.getElementById(isA ? 'wrapper-a' : 'wrapper-b').style.transform = `scale(${scale})`;
    document.getElementById(`lbl-zoom-${slot.toLowerCase()}`).innerText = Math.round(scale * 100) + "%";
}

function zoomViewport(slot, incrementalValue, mouseEventContext = null) {
    const isA = slot === 'A';
    let oldScale = isA ? activeZoomScaleA : activeZoomScaleB;
    let newScale = oldScale + incrementalValue;
    
    if (newScale < 0.5 || newScale > 3.0) return;

    if (isA) activeZoomScaleA = newScale; else activeZoomScaleB = newScale;

    const scrollBox = document.getElementById(isA ? 'scroll-box-a' : 'scroll-box-b');

    let clientX = mouseEventContext ? mouseEventContext.clientX - scrollBox.getBoundingClientRect().left : scrollBox.clientWidth / 2;
    let clientY = mouseEventContext ? mouseEventContext.clientY - scrollBox.getBoundingClientRect().top : scrollBox.clientHeight / 2;

    const contentX = (clientX + scrollBox.scrollLeft) / oldScale;
    const contentY = (clientY + scrollBox.scrollTop) / oldScale;

    updateScaleTransformCSS(slot);

    scrollBox.scrollLeft = (contentX * newScale) - clientX;
    scrollBox.scrollTop = (contentY * newScale) - clientY;
}

function turnPage(slot, step) {
    if (slot === 'A' && pdfDocA) {
        const target = activePageA + step;
        if (target >= 0 && target < pdfDocA.numPages) { activePageA = target; renderLightboxPageFrame('A'); }
    } else if (slot === 'B' && pdfDocB) {
        const target = activePageB + step;
        if (target >= 0 && target < pdfDocB.numPages) { activePageB = target; renderLightboxPageFrame('B'); }
    }
}

function handlePageJumpKeydown(event, slot) {
    if (event.key !== 'Enter') return;
    
    const isA = slot === 'A';
    const doc = isA ? pdfDocA : pdfDocB;
    if (!doc) return;

    const inputNode = document.getElementById(`input-jump-page-${slot.toLowerCase()}`);
    let targetPageNum = parseInt(inputNode.value);

    if (isNaN(targetPageNum) || targetPageNum < 1) {
        targetPageNum = 1;
    } else if (targetPageNum > doc.numPages) {
        targetPageNum = doc.numPages;
    }

    if (isA) {
        activePageA = targetPageNum - 1;
    } else {
        activePageB = targetPageNum - 1;
    }

    renderLightboxPageFrame(slot);
    inputNode.blur();
}

function initializeIndependentViewportInteractions(boxId, slot) {
    const box = document.getElementById(boxId);
    let isDragging = false, startX, startY, startScrollLeft, startScrollTop;

    box.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.closest('button')) return;
        isDragging = true;
        startX = e.pageX - box.offsetLeft; startY = e.pageY - box.offsetTop;
        startScrollLeft = box.scrollLeft; startScrollTop = box.scrollTop;
    });

    box.addEventListener('mouseleave', () => { isDragging = false; });
    box.addEventListener('mouseup', () => { isDragging = false; });
    box.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        box.scrollLeft = startScrollLeft - (e.pageX - box.offsetLeft - startX);
        box.scrollTop = startScrollTop - (e.pageY - box.offsetTop - startY);
    });

    box.addEventListener('wheel', (e) => {
        if (e.ctrlKey) { e.preventDefault(); zoomViewport(slot, e.deltaY < 0 ? 0.25 : -0.25, e); }
    }, { passive: false });
}


