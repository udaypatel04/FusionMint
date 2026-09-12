
var liveEpochInterval = null;
var currentEpochSeconds = 0;

document.addEventListener('DOMContentLoaded', function() {
    setTimestampToNow();
    initBuilderDefaults();
    toggleLiveStreaming();
});

function initBuilderDefaults() {
    var now = new Date();
    var dInput = document.getElementById('inp-builder-date');
    var tInput = document.getElementById('inp-builder-time');

    var year = now.getUTCFullYear();
    var month = String(now.getUTCMonth() + 1).padStart(2, '0');
    var day = String(now.getUTCDate()).padStart(2, '0');
    if (dInput) dInput.value = year + '-' + month + '-' + day;

    var hours = String(now.getUTCHours()).padStart(2, '0');
    var minutes = String(now.getUTCMinutes()).padStart(2, '0');
    var seconds = String(now.getUTCSeconds()).padStart(2, '0');
    if (tInput) tInput.value = hours + ':' + minutes + ':' + seconds;
}

function setTimestampToNow() {
    var nowSec = Math.floor(Date.now() / 1000);
    var inp = document.getElementById('inp-epoch-value');
    if (inp) {
        inp.value = nowSec;
        parseEpochInput();
    }
}

function setBuilderToNow() {
    initBuilderDefaults();
    compileHumanDateToEpoch();
}

function toggleLiveStreaming() {
    var chk = document.getElementById('chk-live-stream');
    if (chk && chk.checked) {
        if (!liveEpochInterval) {
            liveEpochInterval = setInterval(function() {
                setTimestampToNow();
            }, 1000);
        }
    } else {
        if (liveEpochInterval) {
            clearInterval(liveEpochInterval);
            liveEpochInterval = null;
        }
    }
}

function parseEpochInput() {
    var rawVal = document.getElementById('inp-epoch-value').value.trim();
    if (!rawVal) return;

    var num = parseInt(rawVal, 10);
    if (isNaN(num)) return;

    // Automatically detect seconds vs milliseconds (13 digits = ms)
    var dateObj;
    var formatBadge = document.getElementById('epoch-format-badge');

    if (rawVal.length >= 12 || num > 100000000000) {
        dateObj = new Date(num);
        if (formatBadge) formatBadge.innerText = "Format: Milliseconds (13-digit)";
    } else {
        dateObj = new Date(num * 1000);
        if (formatBadge) formatBadge.innerText = "Format: Seconds (10-digit)";
    }

    if (isNaN(dateObj.getTime())) return;

    currentEpochSeconds = Math.floor(dateObj.getTime() / 1000);
    updateDashboardOutputs(dateObj, currentEpochSeconds);
}

function compileHumanDateToEpoch() {
    // Stop live stream if user manually builds a date
    var chk = document.getElementById('chk-live-stream');
    if (chk && chk.checked) {
        chk.checked = false;
        toggleLiveStreaming();
    }

    var dVal = document.getElementById('inp-builder-date').value;
    var tVal = document.getElementById('inp-builder-time').value || "00:00:00";
    if (!dVal) return;

    var isoStr = dVal + "T" + tVal + "Z";
    var dateObj = new Date(isoStr);
    if (isNaN(dateObj.getTime())) return;

    var sec = Math.floor(dateObj.getTime() / 1000);
    var inp = document.getElementById('inp-epoch-value');
    if (inp) inp.value = sec;

    currentEpochSeconds = sec;
    updateDashboardOutputs(dateObj, sec);
}

function loadEpochPreset(targetSec) {
    var chk = document.getElementById('chk-live-stream');
    if (chk && chk.checked) {
        chk.checked = false;
        toggleLiveStreaming();
    }

    var inp = document.getElementById('inp-epoch-value');
    if (inp) {
        inp.value = targetSec;
        parseEpochInput();
    }
}

function updateDashboardOutputs(dateObj, sec) {
    var ms = dateObj.getTime();

    document.getElementById('display-primary-epoch').innerText = sec;
    document.getElementById('display-primary-ms').innerText = "Milliseconds: " + ms;
    document.getElementById('badge-live-epoch').innerText = "Epoch: " + sec;

    document.getElementById('decoded-utc-str').innerText = dateObj.toUTCString();
    document.getElementById('decoded-local-str').innerText = dateObj.toString();

    document.getElementById('format-iso').innerText = dateObj.toISOString();
    document.getElementById('format-rfc').innerText = dateObj.toUTCString();

    // Day of Year calculation
    var start = new Date(dateObj.getUTCFullYear(), 0, 0);
    var diff = dateObj - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var dayOfYear = Math.floor(diff / oneDay);
    document.getElementById('format-doy').innerText = "Day " + dayOfYear + " of " + (dateObj.getUTCFullYear() % 4 === 0 ? 366 : 365);

    // Timezone offset
    var tzOffsetMin = dateObj.getTimezoneOffset();
    var absOff = Math.abs(tzOffsetMin);
    var offH = Math.floor(absOff / 60);
    var offM = absOff % 60;
    var offStr = (tzOffsetMin <= 0 ? "+" : "-") + String(offH).padStart(2, '0') + ":" + String(offM).padStart(2, '0');
    document.getElementById('format-offset').innerText = "UTC " + offStr;
}

function copyInputEpoch() {
    var val = document.getElementById('inp-epoch-value').value;
    navigator.clipboard.writeText(val).then(function() {
        alert("Epoch timestamp copied to clipboard!");
    });
}

function copyEpochReport() {
    var sec = document.getElementById('display-primary-epoch').innerText;
    var utc = document.getElementById('decoded-utc-str').innerText;
    var local = document.getElementById('decoded-local-str').innerText;

    var report = "=== FUSIONMINT UNIX EPOCH MATRIX REPORT ===\n" +
                    "Timestamp: " + sec + "\n" +
                    "UTC: " + utc + "\n" +
                    "Local: " + local + "\n" +
                    "Generated by FusionMint Unix Epoch Matrix Engine.";

    navigator.clipboard.writeText(report).then(function() {
        alert("Epoch Matrix report copied to clipboard!");
    });
}