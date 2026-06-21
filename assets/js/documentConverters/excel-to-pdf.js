
let loadedTargetWorkbookObject = null;

document.addEventListener('DOMContentLoaded', () => {
hideProcessingOverlay();
});

function showProcessingOverlay(title = "Compiling Asset Track", subtitle = "Assembling raster graphics matrix layers...") {
const overlay = document.getElementById('matrix-processing-overlay');
document.getElementById('overlay-main-title').innerText = title;
document.getElementById('overlay-status-label').innerText = subtitle;
if (overlay) overlay.classList.add('active');
}

function updateProcessingOverlayStatus(text) {
const statusLabel = document.getElementById('overlay-status-label');
if (statusLabel) statusLabel.innerText = text;
}

function hideProcessingOverlay() {
const overlay = document.getElementById('matrix-processing-overlay');
if (overlay) overlay.classList.remove('active');
}

function loadExcelWorkbookToPipeline(inputNode) {
if (!inputNode.files || inputNode.files.length === 0) return;
const excelFile = inputNode.files[0];

document.getElementById('processing-loader-indicator').classList.remove('hidden');
document.getElementById('processing-loader-indicator').classList.add('flex');

const fileReaderInstance = new FileReader();
fileReaderInstance.onload = function(e) {
    const arrayBufferData = e.target.result;
    
    try {
        loadedTargetWorkbookObject = XLSX.read(arrayBufferData, { type: 'array' });
        
        const selectNode = document.getElementById('excel-active-sheet');
        selectNode.innerHTML = '';
        
        loadedTargetWorkbookObject.SheetNames.forEach(sheetName => {
            const option = document.createElement('option');
            option.value = sheetName;
            option.innerText = sheetName;
            selectNode.appendChild(option);
        });

        document.getElementById('processing-loader-indicator').classList.add('hidden');
        document.getElementById('processing-loader-indicator').classList.remove('flex');
        document.getElementById('empty-buffer-list-state').classList.add('hidden');
        
        document.getElementById('simulator-empty-callout').classList.add('hidden');
        document.getElementById('simulator-raster-frame').classList.remove('hidden');
        document.getElementById('simulator-info-badge').classList.remove('hidden');
        document.getElementById('simulator-info-badge').classList.add('flex');
        document.getElementById('sheet-selector-wrapper').classList.remove('hidden');
        document.getElementById('sheet-selector-wrapper').classList.add('flex');

        document.getElementById('analytics-metrics-panel').classList.remove('hidden');
        document.getElementById('analytics-metrics-panel').classList.add('flex');
        document.getElementById('compilation-actions-deck').classList.remove('hidden');
        document.getElementById('compilation-actions-deck').classList.add('flex');

        const originalInputName = excelFile.name;
        const baselineSanitizedName = originalInputName.substring(0, originalInputName.lastIndexOf('.')) || originalInputName;
        const spaceSanitizedUnderscoreName = baselineSanitizedName.replace(/\s+/g, '_');
        document.getElementById('pdf-output-filename').value = `${spaceSanitizedUnderscoreName}_excel_to_pdf`;

        document.getElementById('metrics-filename-lbl').innerText = originalInputName;
        document.getElementById('metrics-size-lbl').innerText = `Size File Track: ${(excelFile.size / 1024).toFixed(1)} KB`;
        document.getElementById('metrics-sheets-lbl').innerText = `Sheets Found: ${loadedTargetWorkbookObject.SheetNames.length} Sub-grids`;

        changeActiveWorkbookSheet();
        evaluatePresentationButtonState();
    } catch(err) {
        console.error(err);
        alert("Spreadsheet Pipeline Parser Break: Invalid workbook binary layers pattern mapping.");
        purgeActiveExcelPipeline();
    }
};
fileReaderInstance.readAsArrayBuffer(excelFile);
inputNode.value = "";
}

function changeActiveWorkbookSheet() {
if (!loadedTargetWorkbookObject) return;
const targetSheetName = document.getElementById('excel-active-sheet').value;
const targetWorksheet = loadedTargetWorkbookObject.Sheets[targetSheetName];

const rawHtmlTableString = XLSX.utils.sheet_to_html(targetWorksheet, { editable: false });

const contentFrame = document.getElementById('excel-rendered-content');
contentFrame.innerHTML = rawHtmlTableString;

const parsedTableNode = contentFrame.querySelector('table');
if (parsedTableNode) {
    parsedTableNode.className = "excel-preview-table";
}
}

function purgeActiveExcelPipeline() {
loadedTargetWorkbookObject = null;

document.getElementById('excel-rendered-content').innerHTML = "";
document.getElementById('excel-active-sheet').innerHTML = "";

document.getElementById('simulator-empty-callout').classList.remove('hidden');
document.getElementById('simulator-raster-frame').classList.add('hidden');
document.getElementById('simulator-info-badge').classList.add('hidden');
document.getElementById('simulator-info-badge').classList.remove('flex');
document.getElementById('sheet-selector-wrapper').classList.add('hidden');
document.getElementById('sheet-selector-wrapper').classList.remove('flex');

document.getElementById('analytics-metrics-panel').classList.add('hidden');
document.getElementById('analytics-metrics-panel').classList.remove('flex');
document.getElementById('compilation-actions-deck').classList.add('hidden');
document.getElementById('compilation-actions-deck').classList.remove('flex');
document.getElementById('empty-buffer-list-state').classList.remove('hidden');
document.getElementById('processing-loader-indicator').classList.add('hidden');
document.getElementById('pdf-output-filename').value = "original_workbook_to_pdf";

evaluatePresentationButtonState();
}

function evaluatePresentationButtonState() {
const btn = document.getElementById('btn-fullscreen-presentation');
const badge = document.getElementById('badge-workspace');
if (loadedTargetWorkbookObject) {
    btn.disabled = false;
    btn.classList.remove('hidden');
    btn.className = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 animate-fade-in";
    badge.classList.add('hidden');
} else {
    btn.disabled = true;
    btn.classList.add('hidden');
    badge.classList.remove('hidden');
}
}

function toggleFullscreenPresentation() {
const targetElement = document.getElementById('presentation-viewport-container');
const sheet = document.getElementById('pdf-paper-sheet-simulator');
const frame = document.getElementById('simulator-raster-frame');

if (!document.fullscreenElement) {
    targetElement.requestFullscreen().then(() => {
        targetElement.classList.remove('p-6', 'bg-slate-950/10', 'border');
        targetElement.classList.add('p-0', 'bg-[#02040a]', 'justify-center');
        sheet.classList.remove('max-w-[340px]', 'mt-6');
        sheet.classList.add('max-w-[85vh]', 'mt-0', 'p-10', 'h-[90vh]');
        frame.classList.remove('no-scrollbar');
    }).catch(err => console.error(err));
} else {
    document.fullscreenElement ? document.exitFullscreen() : null;
}
}

document.addEventListener('fullscreenchange', () => {
const targetElement = document.getElementById('presentation-viewport-container');
const sheet = document.getElementById('pdf-paper-sheet-simulator');
const frame = document.getElementById('simulator-raster-frame');
if (!document.fullscreenElement) {
    targetElement.classList.add('p-6', 'bg-slate-950/10', 'border');
    targetElement.classList.remove('p-0', 'bg-[#02040a]', 'justify-center');
    sheet.classList.add('max-w-[340px]', 'mt-6');
    sheet.classList.remove('max-w-[85vh]', 'mt-0', 'p-10', 'h-[90vh]');
    frame.classList.add('no-scrollbar');
}
});

window.addEventListener('keydown', function(event) {
if ((event.key === 'Escape' || event.keyCode === 27) && document.fullscreenElement) {
    document.exitFullscreen();
}
});

function executeDirectExcelToPdfCompilation() {
if (!loadedTargetWorkbookObject) return;

showProcessingOverlay("Baking Spreadsheet Architecture", "Compiling localized vector paths...");
const statusLabel = document.getElementById('overlay-status-label');

let customOutputName = document.getElementById('pdf-output-filename').value.trim().replace(/\s+/g, '_');
if(!customOutputName) customOutputName = "original_workbook_to_pdf";

setTimeout(() => {
    try {
        const { jsPDF } = window.jspdf;
        const pdfDocument = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'a4',
            compress: true
        });

        const targetSheetName = document.getElementById('excel-active-sheet').value;
        const targetWorksheet = loadedTargetWorkbookObject.Sheets[targetSheetName];
        
        const rowsDataMatrix = XLSX.utils.sheet_to_json(targetWorksheet, { header: 1 });
        
        if (rowsDataMatrix.length === 0) {
            alert("Compilation Abort: Selected data workspace spreadsheet matrix grid is completely blank.");
            return;
        }

        statusLabel.innerText = "Slicing worksheet cells and binding grid boundaries...";

        const autotableHeadersArray = rowsDataMatrix[0];
        const autotableBodyRowsMatrix = rowsDataMatrix.slice(1);

        pdfDocument.autoTable({
            head: [autotableHeadersArray],
            body: autotableBodyRowsMatrix,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 5,
                font: 'helvetica',
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: [0, 230, 118],
                fontStyle: 'bold'
            },
            margin: { top: 40, right: 30, bottom: 40, left: 30 },
            didDrawPage: function (data) {
                pdfDocument.setTextColor(148, 163, 184);
                pdfDocument.setFontSize(9);
                pdfDocument.setFont('helvetica', 'bold');
                pdfDocument.text(`FusionMint Workspace: ${targetSheetName.toUpperCase()}`, 30, 25);
            }
        });

        statusLabel.innerText = "Encrypting compiled binary tracking blocks...";
        pdfDocument.save(`${customOutputName}.pdf`);

    } catch (fatalProcessingError) {
        console.error("Vector compiler sheet asset breakdown context caught:", fatalProcessingError);
        alert("Runtime Failure: Error parsing data worksheet streams array.");
    } finally {
        hideProcessingOverlay();
    }
}, 400);
}