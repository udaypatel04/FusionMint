var currentPayloadMode = "url";
var activeLogoDataUrl = null;
var qrCodeEngineInstance = null;
var updateDebounceTimer = null;
var isTransparentBg = false;

document.addEventListener('DOMContentLoaded', function() {
    initQrEngine();
});

function initQrEngine() {
    var initialData = constructCurrentPayloadData();
    
    qrCodeEngineInstance = new QRCodeStyling({
        width: 320,
        height: 320,
        type: 'svg',
        data: initialData,
        image: '',
        dotsOptions: {
            color: '#10b981',
            type: 'rounded'
        },
        backgroundOptions: {
            color: '#060913'
        },
        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 4,
            imageSize: 0.30
        },
        cornersSquareOptions: {
            type: 'extra-rounded',
            color: '#10b981'
        },
        cornersDotOptions: {
            type: 'dot',
            color: '#10b981'
        },
        qrOptions: {
            errorCorrectionLevel: 'H'
        }
    });

    var target = document.getElementById('qr-target-node');
    if (target) {
        target.innerHTML = '';
        qrCodeEngineInstance.append(target);
    }

    scheduleQrUpdate();
}

// --- Quick Mode Switchers ---
function applyNormalQrPreset() {
    applyColorTheme('#ffffff', '#000000');
    document.getElementById('sel-dot-type').value = 'square';
    document.getElementById('sel-corner-type').value = 'square';
    
    var chkGrad = document.getElementById('chk-gradient');
    if (chkGrad && chkGrad.checked) {
        chkGrad.checked = false;
        toggleGradientMode(false);
    }

    clearCenterLogo();

    var btnNormal = document.getElementById('preset-btn-normal');
    var btnStylized = document.getElementById('preset-btn-stylized');
    if (btnNormal && btnStylized) {
        btnNormal.className = "py-2.5 px-3 text-xs font-bold rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-400";
        btnStylized.className = "py-2.5 px-3 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent";
    }

    scheduleQrUpdate();
}

function applyStylizedQrPreset() {
    applyColorTheme('#060913', '#10b981');
    document.getElementById('sel-dot-type').value = 'rounded';
    document.getElementById('sel-corner-type').value = 'extra-rounded';

    var btnNormal = document.getElementById('preset-btn-normal');
    var btnStylized = document.getElementById('preset-btn-stylized');
    if (btnNormal && btnStylized) {
        btnStylized.className = "py-2.5 px-3 text-xs font-bold rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-400";
        btnNormal.className = "py-2.5 px-3 text-xs font-bold rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent";
    }

    scheduleQrUpdate();
}

// --- Password Helper Utilities ---
function generateRandomSecurePass() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()-_=+";
    var array = new Uint32Array(16);
    window.crypto.getRandomValues(array);
    var result = "";
    for (var i = 0; i < array.length; i++) {
        result += chars[array[i] % chars.length];
    }
    var passInput = document.getElementById('inp-secret-pass');
    if (passInput) {
        passInput.value = result;
        scheduleQrUpdate();
    }
}

function copyPasswordToClipboard() {
    var passInput = document.getElementById('inp-secret-pass');
    if (passInput) {
        navigator.clipboard.writeText(passInput.value).then(function() {
            alert("Passphrase copied to clipboard!");
        });
    }
}

function constructCurrentPayloadData() {
    var compiledStr = "https://fusionmint.io";

    switch (currentPayloadMode) {
        case 'url':
            var urlElem = document.getElementById('inp-url');
            compiledStr = (urlElem && urlElem.value.trim()) ? urlElem.value.trim() : "https://fusionmint.io";
            break;
        case 'text':
            var textElem = document.getElementById('inp-raw-text');
            compiledStr = textElem ? textElem.value : "";
            break;
        case 'password':
            var pass = document.getElementById('inp-secret-pass') ? document.getElementById('inp-secret-pass').value : "";
            var user = document.getElementById('inp-secret-user') ? document.getElementById('inp-secret-user').value.trim() : "";
            var format = document.getElementById('inp-secret-format') ? document.getElementById('inp-secret-format').value : "raw";
            
            if (format === 'formatted') {
                compiledStr = "ACCOUNT:" + (user || "Default") + "\nKEY:" + pass;
            } else {
                compiledStr = pass;
            }
            break;
        case 'upi':
            var vpa = document.getElementById('inp-upi-vpa') ? document.getElementById('inp-upi-vpa').value.trim() : "";
            var name = document.getElementById('inp-upi-name') ? encodeURIComponent(document.getElementById('inp-upi-name').value.trim()) : "";
            var amount = document.getElementById('inp-upi-amount') ? document.getElementById('inp-upi-amount').value.trim() : "";
            var note = document.getElementById('inp-upi-note') ? encodeURIComponent(document.getElementById('inp-upi-note').value.trim()) : "";
            
            compiledStr = "upi://pay?pa=" + vpa + "&pn=" + name;
            if (amount) compiledStr += "&am=" + amount + "&cu=INR";
            if (note) compiledStr += "&tn=" + note;
            break;
        case 'wifi':
            var ssid = document.getElementById('inp-wifi-ssid') ? document.getElementById('inp-wifi-ssid').value.trim() : "";
            var type = document.getElementById('inp-wifi-type') ? document.getElementById('inp-wifi-type').value : "WPA";
            var passw = document.getElementById('inp-wifi-pass') ? document.getElementById('inp-wifi-pass').value : "";
            compiledStr = "WIFI:T:" + type + ";S:" + ssid + ";P:" + passw + ";;";
            break;
        case 'vcard':
            var vName = document.getElementById('inp-vc-name') ? document.getElementById('inp-vc-name').value.trim() : "";
            var vOrg = document.getElementById('inp-vc-org') ? document.getElementById('inp-vc-org').value.trim() : "";
            var vPhone = document.getElementById('inp-vc-phone') ? document.getElementById('inp-vc-phone').value.trim() : "";
            var vEmail = document.getElementById('inp-vc-email') ? document.getElementById('inp-vc-email').value.trim() : "";
            compiledStr = "BEGIN:VCARD\nVERSION:3.0\nN:" + vName + "\nORG:" + vOrg + "\nTEL:" + vPhone + "\nEMAIL:" + vEmail + "\nEND:VCARD";
            break;
        case 'geo':
            var lat = document.getElementById('inp-geo-lat') ? document.getElementById('inp-geo-lat').value.trim() : "0";
            var lng = document.getElementById('inp-geo-lng') ? document.getElementById('inp-geo-lng').value.trim() : "0";
            compiledStr = "geo:" + lat + "," + lng;
            break;
    }

    var summaryElem = document.getElementById('summary-text-str');
    if (summaryElem) {
        summaryElem.innerText = compiledStr.replace(/\n/g, ' ');
    }
    return compiledStr;
}

function setPayloadMode(mode) {
    currentPayloadMode = mode;
    var modes = ['url', 'text', 'password', 'upi', 'wifi', 'vcard', 'geo'];

    for (var i = 0; i < modes.length; i++) {
        var m = modes[i];
        var btn = document.getElementById('type-btn-' + m);
        var pane = document.getElementById('pane-' + m);

        if (m === mode) {
            if (btn) btn.className = "py-2 text-[10px] font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all flex flex-col items-center gap-1 cursor-pointer";
            if (pane) pane.classList.remove('hidden');
        } else {
            if (btn) btn.className = "py-2 text-[10px] font-bold uppercase rounded-xl text-slate-400 hover:text-white transition-all flex flex-col items-center gap-1 cursor-pointer";
            if (pane) pane.classList.add('hidden');
        }
    }

    scheduleQrUpdate();
}

function handleCustomLogoUpload(inputElement) {
    if (!inputElement.files || inputElement.files.length === 0) return;
    var file = inputElement.files[0];
    var reader = new FileReader();
    
    reader.onload = function(e) {
        activeLogoDataUrl = e.target.result;
        
        var dropzone = document.getElementById('logo-dropzone-view');
        var preview = document.getElementById('logo-uploaded-preview');
        var thumb = document.getElementById('logo-thumb-img');
        var filename = document.getElementById('logo-filename-lbl');
        var removeBtn = document.getElementById('btn-remove-logo');

        if (dropzone) dropzone.classList.add('hidden');
        if (preview) preview.classList.remove('hidden');
        if (thumb) thumb.src = activeLogoDataUrl;
        if (filename) filename.innerText = file.name;
        if (removeBtn) removeBtn.classList.remove('hidden');

        scheduleQrUpdate();
    };
    reader.readAsDataURL(file);
}

function clearCenterLogo() {
    activeLogoDataUrl = null;
    var fileInput = document.getElementById('inp-custom-logo');
    var thumb = document.getElementById('logo-thumb-img');
    var preview = document.getElementById('logo-uploaded-preview');
    var dropzone = document.getElementById('logo-dropzone-view');
    var removeBtn = document.getElementById('btn-remove-logo');

    if (fileInput) fileInput.value = "";
    if (thumb) thumb.src = "";
    if (preview) preview.classList.add('hidden');
    if (dropzone) dropzone.classList.remove('hidden');
    if (removeBtn) removeBtn.classList.add('hidden');
    scheduleQrUpdate();
}

function handleBgColorChange(val) {
    isTransparentBg = false;
    var lbl = document.getElementById('lbl-bg-hex');
    if (lbl) lbl.innerText = val;
    scheduleQrUpdate();
}

function handleFgColorChange(val) {
    var lbl = document.getElementById('lbl-fg-hex');
    if (lbl) lbl.innerText = val;
    scheduleQrUpdate();
}

function applyColorTheme(bgHex, fgHex) {
    isTransparentBg = false;
    var pickerBg = document.getElementById('picker-bg-color');
    var lblBg = document.getElementById('lbl-bg-hex');
    var pickerFg = document.getElementById('picker-fg-color');
    var lblFg = document.getElementById('lbl-fg-hex');

    if (pickerBg) pickerBg.value = bgHex;
    if (lblBg) lblBg.innerText = bgHex;
    if (pickerFg) pickerFg.value = fgHex;
    if (lblFg) lblFg.innerText = fgHex;
    scheduleQrUpdate();
}

function enableTransparentBg() {
    isTransparentBg = true;
    var lbl = document.getElementById('lbl-bg-hex');
    if (lbl) lbl.innerText = "TRANSPARENT";
    scheduleQrUpdate();
}

function toggleGradientMode(isEnabled) {
    var gradBox = document.getElementById('grad-end-picker-box');
    if (gradBox) {
        if (isEnabled) {
            gradBox.classList.remove('hidden');
            gradBox.classList.add('flex');
        } else {
            gradBox.classList.add('hidden');
            gradBox.classList.remove('flex');
        }
    }
    scheduleQrUpdate();
}

function scheduleQrUpdate() {
    clearTimeout(updateDebounceTimer);
    updateDebounceTimer = setTimeout(function() {
        renderUpdatedQrMatrix();
    }, 60);
}

function renderUpdatedQrMatrix() {
    if (!qrCodeEngineInstance) return;

    var payload = constructCurrentPayloadData();
    var pickerBg = document.getElementById('picker-bg-color');
    var pickerFg = document.getElementById('picker-fg-color');
    var selDot = document.getElementById('sel-dot-type');
    var selCorner = document.getElementById('sel-corner-type');
    var rngSize = document.getElementById('rng-logo-size');
    var rngMargin = document.getElementById('rng-logo-margin');
    var chkGrad = document.getElementById('chk-gradient');
    var pickerGrad = document.getElementById('picker-fg-grad');

    var bgColor = isTransparentBg ? 'transparent' : (pickerBg ? pickerBg.value : '#060913');
    var fgColor = pickerFg ? pickerFg.value : '#10b981';
    var dotType = selDot ? selDot.value : 'rounded';
    var cornerType = selCorner ? selCorner.value : 'extra-rounded';
    var logoSize = rngSize ? parseFloat(rngSize.value) : 0.30;
    var logoMargin = rngMargin ? parseInt(rngMargin.value) : 4;
    var isGradient = chkGrad ? chkGrad.checked : false;
    var gradEndColor = pickerGrad ? pickerGrad.value : '#06b6d4';

    var presentationFrame = document.getElementById('qr-presentation-frame');
    if (presentationFrame) {
        if (isTransparentBg) {
            presentationFrame.classList.add('alpha-checkerboard');
        } else {
            presentationFrame.classList.remove('alpha-checkerboard');
        }
    }

    var computedDotsOptions = { type: dotType };

    if (isGradient) {
        computedDotsOptions.gradient = {
            type: 'linear',
            rotation: 45,
            colorStops: [
                { offset: 0, color: fgColor },
                { offset: 1, color: gradEndColor }
            ]
        };
    } else {
        computedDotsOptions.color = fgColor;
        computedDotsOptions.gradient = null;
    }

    qrCodeEngineInstance.update({
        data: payload,
        image: activeLogoDataUrl || '',
        dotsOptions: computedDotsOptions,
        backgroundOptions: {
            color: bgColor
        },
        cornersSquareOptions: {
            type: cornerType,
            color: fgColor
        },
        cornersDotOptions: {
            type: cornerType === 'square' ? 'square' : 'dot',
            color: fgColor
        },
        imageOptions: {
            imageSize: logoSize,
            margin: logoMargin,
            hideBackgroundDots: true
        }
    });
}

function downloadMatrixQRCode(format) {
    format = format || 'png';
    showProcessingOverlay("Compiling Asset Stream", "Encoding master " + format.toUpperCase() + " image structures...");
    
    setTimeout(function() {
        qrCodeEngineInstance.download({
            name: "fusionmint_qr_matrix_" + Date.now(),
            extension: format
        }).then(function() {
            hideProcessingOverlay();
        }).catch(function(e) {
            console.error(e);
            alert("Matrix Export error.");
            hideProcessingOverlay();
        });
    }, 300);
}

function printFormattedQRCard() {
    var printWin = window.open('', '_blank');
    if (!printWin) {
        alert("Please allow popups to print the QR Code.");
        return;
    }

    var targetSvgElem = document.getElementById('qr-target-node');
    var summaryElem = document.getElementById('summary-text-str');
    var targetSvg = targetSvgElem ? targetSvgElem.innerHTML : "";
    var payloadStr = summaryElem ? summaryElem.innerText : "";

    var doc = printWin.document;
    doc.open();
    
    var html = doc.createElement('html');
    var head = doc.createElement('head');
    var title = doc.createElement('title');
    title.textContent = 'FusionMint QR Card Print';
    
    var style = doc.createElement('style');
    style.textContent = 'body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; color: #000; text-align: center; } .card { border: 2px solid #000; padding: 24px; border-radius: 16px; display: inline-flex; flex-direction: column; align-items: center; } .meta { margin-top: 12px; font-size: 11px; font-family: monospace; max-width: 320px; word-break: break-all; }';
    
    head.appendChild(title);
    head.appendChild(style);
    
    var body = doc.createElement('body');
    var card = doc.createElement('div');
    card.className = 'card';
    card.innerHTML = targetSvg;
    
    var meta = doc.createElement('div');
    meta.className = 'meta';
    meta.textContent = payloadStr;
    card.appendChild(meta);
    
    body.appendChild(card);
    html.appendChild(head);
    html.appendChild(body);
    
    doc.appendChild(html);
    doc.close();

    printWin.focus();
    setTimeout(function() {
        printWin.print();
        printWin.close();
    }, 250);
}

function copyRawPayloadString() {
    var str = constructCurrentPayloadData();
    navigator.clipboard.writeText(str).then(function() {
        alert("Payload copied to clipboard!");
    });
}

function showProcessingOverlay(title, subtitle) {
    var overlay = document.getElementById('matrix-processing-overlay');
    var mainTitle = document.getElementById('overlay-main-title');
    var statusLabel = document.getElementById('overlay-status-label');
    if (mainTitle) mainTitle.innerText = title;
    if (statusLabel) statusLabel.innerText = subtitle;
    if (overlay) overlay.classList.add('active');
}

function hideProcessingOverlay() {
    return new Promise(function(resolve) {
        var overlay = document.getElementById('matrix-processing-overlay');
        if (overlay) overlay.classList.remove('active');
        resolve();
    });
}