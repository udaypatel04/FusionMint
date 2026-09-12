
/* ==========================================================================
    GLOBAL APPLICATION STATE
    ========================================================================== */
const appState = {
    format: 24, // 12 | 24
    dialMode: 'analog', // default set to analog as requested
    selectedTimezone: 'AUTO',
    activeTab: 'clock',
    soundEnabled: true,
    
    worldCities: [
        { name: 'London (GMT)', tz: 'Europe/London' },
        { name: 'New York (EST)', tz: 'America/New_York' },
        { name: 'Dubai (GST)', tz: 'Asia/Dubai' },
        { name: 'Tokyo (JST)', tz: 'Asia/Tokyo' }
    ],

    stopwatch: {
        running: false,
        startTime: 0,
        elapsed: 0,
        intervalId: null,
        laps: []
    },

    timer: {
        running: false,
        totalSecs: 300,
        remainingSecs: 300,
        intervalId: null
    },

    alarms: [
        { id: 1, time: '08:00', label: 'Morning Standup & Sync', active: true }
    ]
};

/* ==========================================================================
    SYNTHESIZER SOUND ENGINE
    ========================================================================== */
let audioCtx = null;
function playSynthesizerBeep(freq = 880, type = 'sine', duration = 0.15) {
    if (!appState.soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn('Audio contextual initialization held', e);
    }
}

let alarmChimeTimer = null;
function triggerAlarmAlert(title, timeStr) {
    document.getElementById('modal-alert-title').textContent = title;
    document.getElementById('modal-alert-time').textContent = timeStr;
    document.getElementById('alarm-trigger-modal').classList.remove('hidden');

    if (alarmChimeTimer) clearInterval(alarmChimeTimer);
    alarmChimeTimer = setInterval(() => {
        playSynthesizerBeep(880, 'triangle', 0.2);
        setTimeout(() => playSynthesizerBeep(1174.66, 'triangle', 0.25), 150);
    }, 800);
}

function dismissTriggerAlert() {
    if (alarmChimeTimer) {
        clearInterval(alarmChimeTimer);
        alarmChimeTimer = null;
    }
    document.getElementById('alarm-trigger-modal').classList.add('hidden');
}

function toggleAudioEngine() {
    appState.soundEnabled = !appState.soundEnabled;
    const icon = document.getElementById('icon-audio-mute');
    if (appState.soundEnabled) {
        icon.className = 'fa-solid fa-volume-high text-[11px]';
    } else {
        icon.className = 'fa-solid fa-volume-xmark text-[11px] text-rose-400';
    }
}

/* ==========================================================================
    TAB SWITCHING & VIEW MODES (UPDATED FOR SIDEBAR CONTROLS)
    ========================================================================== */
function switchMainTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.chrono-view').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${tabId}`).classList.remove('hidden');

    const tabButtons = ['clock', 'stopwatch', 'timer', 'alarms'];
    tabButtons.forEach(btn => {
        const b = document.getElementById(`sidebar-btn-${btn}`);
        if (btn === tabId) {
            b.className = 'py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5';
        } else {
            b.className = 'py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5';
        }
    });
}

function setVisualDialMode(mode) {
    appState.dialMode = mode;
    const digi = document.getElementById('dial-digital-wrapper');
    const analog = document.getElementById('dial-analog-wrapper');
    const btnDigi = document.getElementById('btn-dial-digital');
    const btnAnalog = document.getElementById('btn-dial-analog');

    if (mode === 'digital') {
        digi.classList.remove('hidden');
        analog.classList.add('hidden');
        btnDigi.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5';
        btnAnalog.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5';
    } else {
        digi.classList.add('hidden');
        analog.classList.remove('hidden');
        btnAnalog.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5';
        btnDigi.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5';
    }
}

function setTimeFormatMode(fmt) {
    appState.format = fmt;
    const btn12 = document.getElementById('btn-fmt-12');
    const btn24 = document.getElementById('btn-fmt-24');
    if (fmt === 12) {
        btn12.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer';
        btn24.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer';
    } else {
        btn24.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer';
        btn12.className = 'py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer';
    }
    renderWorldGrid();
}

function handleTimezoneChange() {
    appState.selectedTimezone = document.getElementById('sel-timezone').value;
    const pill = document.getElementById('tz-offset-pill');
    const liveBadge = document.getElementById('zone-live-badge');
    
    if (appState.selectedTimezone === 'AUTO') {
        pill.textContent = 'Local';
        liveBadge.textContent = 'Node: Auto-Detect';
    } else {
        pill.textContent = appState.selectedTimezone.split('/')[1] || appState.selectedTimezone;
        liveBadge.textContent = `Node: ${appState.selectedTimezone}`;
    }
}

function addWorldCity() {
    const select = document.getElementById('sel-add-zone');
    const tz = select.value;
    const name = select.options[select.selectedIndex].text;
    if (!appState.worldCities.some(c => c.tz === tz)) {
        appState.worldCities.push({ name, tz });
        renderWorldGrid();
    }
}

function removeWorldCity(index) {
    appState.worldCities.splice(index, 1);
    renderWorldGrid();
}

/* Build 12 Dial Ticks */
function buildDialTicks() {
    const container = document.getElementById('analog-dial-ticks');
    container.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const deg = i * 30;
        const tick = document.createElement('div');
        tick.className = 'absolute top-0 left-0 w-full h-full flex justify-center pointer-events-none';
        tick.style.transform = `rotate(${deg}deg)`;
        tick.innerHTML = `<div class="w-0.5 ${i % 3 === 0 ? 'h-3 bg-teal-400 shadow-[0_0_5px_#2dd4bf]' : 'h-1.5 bg-teal-500/30'} rounded-full mt-1.5"></div>`;
        container.appendChild(tick);
    }
}

/* ==========================================================================
    MAIN CLOCK & TELEMETRY STREAM LOOP (ACCURATE HAND ROTATIONS)
    ========================================================================== */
function updateChronoTick() {
    const now = new Date();

    let targetDate = now;
    if (appState.selectedTimezone !== 'AUTO') {
        try {
            const invDate = new Date(now.toLocaleString('en-US', { timeZone: appState.selectedTimezone }));
            targetDate = invDate;
        } catch(e) {}
    }

    let hours = targetDate.getHours();
    const minutes = targetDate.getMinutes();
    const seconds = targetDate.getSeconds();
    const millis = targetDate.getMilliseconds();

    // Date string
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('master-date-display').textContent = targetDate.toLocaleDateString('en-US', options);

    // Digital format
    let displayHours = hours;
    let ampm = '';
    if (appState.format === 12) {
        ampm = hours >= 12 ? 'PM' : 'AM';
        displayHours = hours % 12 || 12;
    }

    document.getElementById('chrono-hours').textContent = String(displayHours).padStart(2, '0');
    document.getElementById('chrono-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('chrono-seconds').textContent = String(seconds).padStart(2, '0');
    document.getElementById('chrono-ampm').textContent = ampm;
    
    const isMillisActive = document.getElementById('chk-millisecond-stream').checked;
    document.getElementById('chrono-millis').textContent = isMillisActive ? `.${String(millis).padStart(3, '0')} ms` : '.000 ms';

    // Top navbar sync badge
    document.getElementById('badge-time-display').textContent = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;

    // ================= PRECISE ANALOG ROTATIONS =================
    const secDeg = (seconds + millis / 1000) * 6;                      // 360 / 60 = 6 deg/sec
    const minDeg = (minutes + seconds / 60 + millis / 60000) * 6;     // smooth minute hand
    const hrDeg = ((hours % 12) + minutes / 60 + seconds / 3600) * 30; // 360 / 12 = 30 deg/hr

    document.getElementById('wrapper-hand-sec').style.transform = `rotate(${secDeg}deg)`;
    document.getElementById('wrapper-hand-min').style.transform = `rotate(${minDeg}deg)`;
    document.getElementById('wrapper-hand-hr').style.transform = `rotate(${hrDeg}deg)`;

    // Day Progress
    const totalSecsToday = hours * 3600 + minutes * 60 + seconds;
    const dayPercent = ((totalSecsToday / 86400) * 100).toFixed(1);
    document.getElementById('chrono-day-progress-bar').style.width = `${dayPercent}%`;
    document.getElementById('chrono-day-percent').textContent = `${dayPercent}%`;

    // Telemetry Cards
    document.getElementById('live-atomic-utc').textContent = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
    document.getElementById('live-unix-timestamp').textContent = Math.floor(now.getTime() / 1000);

    // Day of year and Week Number
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
    const weekNumber = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    document.getElementById('live-calendar-metrics').textContent = `Day ${String(dayOfYear).padStart(3, '0')} | W${String(weekNumber).padStart(2, '0')}`;

    checkScheduledAlarms(hours, minutes, seconds);
}

/* ==========================================================================
    WORLD TIME ZONE GRID
    ========================================================================== */
function renderWorldGrid() {
    const container = document.getElementById('world-cities-grid');
    const now = new Date();

    container.innerHTML = appState.worldCities.map((item, idx) => {
        const timeStr = new Intl.DateTimeFormat('en-US', {
            timeZone: item.tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: appState.format === 12
        }).format(now);

        return `
            <div class="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 flex flex-col justify-between relative group hover:border-teal-500/40 transition-all">
                <button type="button" onclick="removeWorldCity(${idx})" class="absolute top-1.5 right-1.5 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <i class="fa-solid fa-xmark text-[9px]"></i>
                </button>
                <span class="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-between">
                    <span class="truncate pr-2">${item.name}</span>
                    <i class="fa-solid fa-clock text-[8px] text-teal-400"></i>
                </span>
                <span class="text-xs font-mono font-bold text-teal-300 mt-1">${timeStr}</span>
            </div>
        `;
    }).join('');
}

/* ==========================================================================
    STOPWATCH ENGINE
    ========================================================================== */
function formatStopwatchDigits(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return {
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
        ms: String(centis).padStart(2, '0')
    };
}

function toggleStopwatch() {
    const sw = appState.stopwatch;
    const btnText = document.getElementById('lbl-sw-start');
    const icon = document.getElementById('icon-sw-start');
    const btnLap = document.getElementById('btn-sw-lap');

    if (sw.running) {
        clearInterval(sw.intervalId);
        sw.running = false;
        btnText.textContent = 'Resume';
        icon.className = 'fa-solid fa-play text-[11px]';
        btnLap.disabled = true;
    } else {
        sw.startTime = Date.now() - sw.elapsed;
        sw.intervalId = setInterval(() => {
            sw.elapsed = Date.now() - sw.startTime;
            const fmt = formatStopwatchDigits(sw.elapsed);
            document.getElementById('sw-min').textContent = fmt.m;
            document.getElementById('sw-sec').textContent = fmt.s;
            document.getElementById('sw-ms').textContent = fmt.ms;
        }, 10);
        sw.running = true;
        btnText.textContent = 'Pause';
        icon.className = 'fa-solid fa-pause text-[11px]';
        btnLap.disabled = false;
    }
}

function recordStopwatchLap() {
    const sw = appState.stopwatch;
    if (!sw.running) return;
    const lastElapsed = sw.laps.length > 0 ? sw.laps[0].total : 0;
    const split = sw.elapsed - lastElapsed;

    sw.laps.unshift({
        id: sw.laps.length + 1,
        split: split,
        total: sw.elapsed
    });
    playSynthesizerBeep(1200, 'sine', 0.05);
    renderStopwatchLaps();
}

function resetStopwatch() {
    const sw = appState.stopwatch;
    clearInterval(sw.intervalId);
    sw.running = false;
    sw.elapsed = 0;
    sw.laps = [];

    document.getElementById('sw-min').textContent = '00';
    document.getElementById('sw-sec').textContent = '00';
    document.getElementById('sw-ms').textContent = '00';
    document.getElementById('lbl-sw-start').textContent = 'Start';
    document.getElementById('icon-sw-start').className = 'fa-solid fa-play text-[11px]';
    document.getElementById('btn-sw-lap').disabled = true;
    renderStopwatchLaps();
}

function renderStopwatchLaps() {
    const container = document.getElementById('sw-laps-container');
    if (appState.stopwatch.laps.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-600 text-[11px] py-2">No split records logged</div>`;
        return;
    }
    container.innerHTML = appState.stopwatch.laps.map(lap => {
        const sFmt = formatStopwatchDigits(lap.split);
        const tFmt = formatStopwatchDigits(lap.total);
        return `
            <div class="flex justify-between items-center py-1 px-1.5 hover:bg-slate-800/40 rounded">
                <span class="text-slate-400 font-bold">Lap ${lap.id}</span>
                <span class="text-teal-400">+${sFmt.m}:${sFmt.s}.${sFmt.ms}</span>
                <span class="text-white font-bold">${tFmt.m}:${tFmt.s}.${tFmt.ms}</span>
            </div>
        `;
    }).join('');
}

/* ==========================================================================
    COUNTDOWN TIMER ENGINE
    ========================================================================== */
function setTimerPreset(mins) {
    if (appState.timer.running) resetCountdownTimer();
    document.getElementById('inp-tm-h').value = 0;
    document.getElementById('inp-tm-m').value = mins;
    document.getElementById('inp-tm-s').value = 0;
    syncTimerFromInputs();
}

function syncTimerFromInputs() {
    const h = parseInt(document.getElementById('inp-tm-h').value) || 0;
    const m = parseInt(document.getElementById('inp-tm-m').value) || 0;
    const s = parseInt(document.getElementById('inp-tm-s').value) || 0;
    const total = h * 3600 + m * 60 + s;
    appState.timer.totalSecs = total > 0 ? total : 300;
    appState.timer.remainingSecs = appState.timer.totalSecs;
    renderTimerVal();
}

function renderTimerVal() {
    const t = appState.timer.remainingSecs;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    document.getElementById('timer-display-val').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toggleCountdownTimer() {
    const tm = appState.timer;
    const btnText = document.getElementById('lbl-tm-start');
    const icon = document.getElementById('icon-tm-start');

    if (tm.running) {
        clearInterval(tm.intervalId);
        tm.running = false;
        btnText.textContent = 'Resume Timer';
        icon.className = 'fa-solid fa-play text-[11px]';
    } else {
        if (tm.remainingSecs === tm.totalSecs) syncTimerFromInputs();
        if (tm.remainingSecs <= 0) return;

        tm.running = true;
        btnText.textContent = 'Pause Timer';
        icon.className = 'fa-solid fa-pause text-[11px]';

        tm.intervalId = setInterval(() => {
            if (tm.remainingSecs > 0) {
                tm.remainingSecs--;
                renderTimerVal();
            } else {
                clearInterval(tm.intervalId);
                tm.running = false;
                triggerAlarmAlert('Timer Elapsed', '00:00:00');
                resetCountdownTimer();
            }
        }, 1000);
    }
}

function resetCountdownTimer() {
    const tm = appState.timer;
    clearInterval(tm.intervalId);
    tm.running = false;
    document.getElementById('lbl-tm-start').textContent = 'Start Timer';
    document.getElementById('icon-tm-start').className = 'fa-solid fa-play text-[11px]';
    syncTimerFromInputs();
}

/* ==========================================================================
    ALARM ENGINE
    ========================================================================== */
function addNewAlarmItem() {
    const timeVal = document.getElementById('inp-alarm-time').value;
    const labelVal = document.getElementById('inp-alarm-label').value || 'Scheduled Alert';
    if (!timeVal) return;

    appState.alarms.push({
        id: Date.now(),
        time: timeVal,
        label: labelVal,
        active: true
    });

    document.getElementById('inp-alarm-label').value = '';
    renderAlarms();
}

function toggleAlarm(id) {
    const item = appState.alarms.find(a => a.id === id);
    if (item) {
        item.active = !item.active;
        renderAlarms();
    }
}

function deleteAlarm(id) {
    appState.alarms = appState.alarms.filter(a => a.id !== id);
    renderAlarms();
}

function renderAlarms() {
    const container = document.getElementById('alarms-card-list');
    if (appState.alarms.length === 0) {
        container.innerHTML = `<div class="text-slate-600 text-center text-xs py-3">No alarms scheduled</div>`;
        return;
    }
    container.innerHTML = appState.alarms.map(a => `
        <div class="bg-slate-950/70 p-2.5 rounded-xl border ${a.active ? 'border-teal-500/30' : 'border-slate-800 opacity-60'} flex items-center justify-between">
            <div class="flex items-center gap-2.5">
                <button type="button" onclick="toggleAlarm(${a.id})" class="w-5 h-5 rounded-md flex items-center justify-center border ${a.active ? 'bg-teal-500 text-slate-950 border-teal-400' : 'border-slate-700 text-transparent'} cursor-pointer">
                    <i class="fa-solid fa-check text-[10px]"></i>
                </button>
                <div class="flex flex-col">
                    <span class="font-mono text-sm font-bold text-white">${a.time}</span>
                    <span class="text-[10px] text-slate-400">${a.label}</span>
                </div>
            </div>
            <button type="button" onclick="deleteAlarm(${a.id})" class="text-slate-600 hover:text-rose-400 p-1 cursor-pointer">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
        </div>
    `).join('');
}

let lastAlarmCheckMin = -1;
function checkScheduledAlarms(hr, min, sec) {
    if (sec !== 0 || min === lastAlarmCheckMin) return;
    lastAlarmCheckMin = min;

    const timeStr = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    appState.alarms.forEach(al => {
        if (al.active && al.time === timeStr) {
            triggerAlarmAlert(al.label, al.time);
        }
    });
}

function copyChronoReport() {
    const now = new Date();
    const report = `[FusionMint Chrono Snapshot]\nDate: ${now.toDateString()}\nUTC: ${now.toUTCString()}\nUnix: ${Math.floor(now.getTime()/1000)}\nTimezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    navigator.clipboard.writeText(report).then(() => {
        alert('Temporal Chrono Report copied to clipboard!');
    });
}

/* ==========================================================================
    INITIALIZATION ENTRY POINT
    ========================================================================== */
function initApp() {
    buildDialTicks();
    renderWorldGrid();
    renderAlarms();
    renderTimerVal();

    function tick() {
        updateChronoTick();
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    setInterval(renderWorldGrid, 1000);
}

document.addEventListener('DOMContentLoaded', initApp);