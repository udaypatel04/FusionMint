
/* ==========================================================================
    AUTHENTIC 2026 FESTIVAL REPOSITORY (PERMANENT & PROTECTED)
    ========================================================================== */
const OFFICIAL_FESTIVALS_2026 = [
    { id: "fest-1", title: "Makar Sankranti / Uttarayan", date: "2026-01-14", category: "holiday", isCustom: false },
    { id: "fest-2", title: "Vasi Uttarayan", date: "2026-01-15", category: "holiday", isCustom: false },
    { id: "fest-3", title: "Republic Day (77th)", date: "2026-01-26", category: "holiday", isCustom: false },
    { id: "fest-4", title: "Maha Shivaratri", date: "2026-02-15", category: "holiday", isCustom: false },
    { id: "fest-5", title: "Holika Dahan", date: "2026-03-03", category: "holiday", isCustom: false },
    { id: "fest-6", title: "Holi / Dhuleti", date: "2026-03-04", category: "holiday", isCustom: false },
    { id: "fest-7", title: "Cheti Chand / Gudi Padwa / Ugadi", date: "2026-03-19", category: "holiday", isCustom: false },
    { id: "fest-8", title: "Id-Ul-Fitr (Ramadan Eid)", date: "2026-03-21", category: "holiday", isCustom: false },
    { id: "fest-9", title: "Ram Navami", date: "2026-03-26", category: "holiday", isCustom: false },
    { id: "fest-10", title: "Mahavir Janma Kalyanak", date: "2026-03-31", category: "holiday", isCustom: false },
    { id: "fest-11", title: "Good Friday", date: "2026-04-03", category: "holiday", isCustom: false },
    { id: "fest-12", title: "Easter Sunday", date: "2026-04-05", category: "holiday", isCustom: false },
    { id: "fest-13", title: "Dr. B.R. Ambedkar Jayanti", date: "2026-04-14", category: "holiday", isCustom: false },
    { id: "fest-14", title: "Maharshi Parashuram Jayanti", date: "2026-04-19", category: "holiday", isCustom: false },
    { id: "fest-15", title: "Gujarat Statehood Day / Buddha Purnima", date: "2026-05-01", category: "holiday", isCustom: false },
    { id: "fest-16", title: "Bakrid (Eid ul-Adha)", date: "2026-05-27", category: "holiday", isCustom: false },
    { id: "fest-17", title: "Muharram", date: "2026-06-26", category: "holiday", isCustom: false },
    { id: "fest-18", title: "Jagannath Ratha Yatra", date: "2026-07-16", category: "holiday", isCustom: false },
    { id: "fest-19", title: "Independence Day", date: "2026-08-15", category: "holiday", isCustom: false },
    { id: "fest-20", title: "Parsi New Year (Pateti)", date: "2026-08-16", category: "holiday", isCustom: false },
    { id: "fest-21", title: "Eid-e-Milad (Milad-un-Nabi)", date: "2026-08-25", category: "holiday", isCustom: false },
    { id: "fest-22", title: "Raksha Bandhan / Shravan Purnima", date: "2026-08-28", category: "holiday", isCustom: false },
    { id: "fest-23", title: "Krishna Janmashtami", date: "2026-09-04", category: "holiday", isCustom: false },
    { id: "fest-24", title: "Ganesh Chaturthi (Vinayaka Chavithi)", date: "2026-09-14", category: "holiday", isCustom: false },
    { id: "fest-25", title: "Jain Samvatsari (Paryushan Parva)", date: "2026-09-17", category: "holiday", isCustom: false },
    { id: "fest-26", title: "Anant Chaturdashi (Ganesh Visarjan)", date: "2026-09-25", category: "holiday", isCustom: false },
    { id: "fest-27", title: "Mahatma Gandhi Jayanti", date: "2026-10-02", category: "holiday", isCustom: false },
    { id: "fest-28", title: "Navratri Ghatasthapana", date: "2026-10-11", category: "holiday", isCustom: false },
    { id: "fest-29", title: "Maha Ashtami / Durga Puja", date: "2026-10-19", category: "holiday", isCustom: false },
    { id: "fest-30", title: "Vijaya Dashami (Dussehra)", date: "2026-10-20", category: "holiday", isCustom: false },
    { id: "fest-31", title: "Sharad Purnima", date: "2026-10-25", category: "holiday", isCustom: false },
    { id: "fest-32", title: "Sardar Vallabhbhai Patel Jayanti", date: "2026-10-31", category: "holiday", isCustom: false },
    { id: "fest-33", title: "Dhanteras (Dhanatrayodashi)", date: "2026-11-06", category: "holiday", isCustom: false },
    { id: "fest-34", title: "Kali Chaudas (Naraka Chaturdashi)", date: "2026-11-07", category: "holiday", isCustom: false },
    { id: "fest-35", title: "Diwali (Lakshmi Pujan)", date: "2026-11-08", category: "holiday", isCustom: false },
    { id: "fest-36", title: "Gujarati New Year (Bestu Varas / VS 2083)", date: "2026-11-09", category: "holiday", isCustom: false },
    { id: "fest-37", title: "Bhai Bij (Bhai Dooj)", date: "2026-11-11", category: "holiday", isCustom: false },
    { id: "fest-38", title: "Guru Nanak Jayanti", date: "2026-11-24", category: "holiday", isCustom: false },
    { id: "fest-39", title: "Christmas Day", date: "2026-12-25", category: "holiday", isCustom: false }
];

/* ==========================================================================
    STORAGE MANAGER: ONLY CUSTOM EVENTS ARE STORED IN LOCALSTORAGE
    ========================================================================== */
const CUSTOM_STORAGE_KEY = 'fusionmint_user_custom_events_v2';

function loadCustomEvents() {
    try {
        const stored = localStorage.getItem(CUSTOM_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('LocalStorage retrieval failed', e);
    }
    return [];
}

function saveCustomEvents(customEventsList) {
    try {
        localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customEventsList));
    } catch (e) {
        console.warn('LocalStorage save failed', e);
    }
}

function clearAllCustomEvents() {
    if (confirm('Delete ALL custom events added by you? (Official festivals will stay intact)')) {
        calState.customEvents = [];
        saveCustomEvents([]);
        refreshCombinedEvents();
        renderMonthMatrix();
        if (calState.activeView === 'week') renderWeekHorizon();
        if (calState.activeView === 'year') renderAnnualMatrix();
    }
}

const calState = {
    currentDate: new Date(),
    viewYear: 2026,
    viewMonth: 8, // September
    selectedDay: 12,
    activeView: 'month',
    customEvents: loadCustomEvents(),
    allEvents: []
};

function refreshCombinedEvents() {
    calState.allEvents = [...OFFICIAL_FESTIVALS_2026, ...calState.customEvents];
}
refreshCombinedEvents();

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

/* ==========================================================================
    INTERACTIVE DRILL-DOWN & VIEW CONTROLS
    ========================================================================== */
function setMatrixView(view) {
    calState.activeView = view;
    document.querySelectorAll('.cal-viewport').forEach(el => el.classList.add('hidden'));
    document.getElementById(`viewport-${view}`).classList.remove('hidden');

    const viewButtons = ['month', 'week', 'year', 'calculator'];
    viewButtons.forEach(v => {
        const b = document.getElementById(`btn-view-${v}`);
        if (v === view) {
            b.className = 'py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1';
        } else {
            b.className = 'py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1';
        }
    });

    if (view === 'month') renderMonthMatrix();
    if (view === 'week') renderWeekHorizon();
    if (view === 'year') renderAnnualMatrix();
    if (view === 'calculator') computeDateDelta();
}

function drillDownToMonth(monthIndex, targetDay = 1) {
    calState.viewMonth = monthIndex;
    calState.selectedDay = targetDay;
    calState.currentDate = new Date(calState.viewYear, monthIndex, targetDay);
    syncSelectInputs();
    setMatrixView('month');
}

function drillDownToWeek(year, month, day) {
    calState.viewYear = year;
    calState.viewMonth = month;
    calState.selectedDay = day;
    calState.currentDate = new Date(year, month, day);
    closeDateDetailsModal();
    setMatrixView('week');
}

function navigateMonth(offset) {
    calState.viewMonth += offset;
    if (calState.viewMonth > 11) {
        calState.viewMonth = 0;
        calState.viewYear++;
    } else if (calState.viewMonth < 0) {
        calState.viewMonth = 11;
        calState.viewYear--;
    }
    syncSelectInputs();
    renderMonthMatrix();
}

function navigateWeek(offset) {
    calState.currentDate.setDate(calState.currentDate.getDate() + (offset * 7));
    calState.viewYear = calState.currentDate.getFullYear();
    calState.viewMonth = calState.currentDate.getMonth();
    syncSelectInputs();
    renderWeekHorizon();
}

function navigateYear(offset) {
    calState.viewYear += offset;
    syncSelectInputs();
    renderAnnualMatrix();
}

function jumpToToday() {
    const today = new Date();
    calState.currentDate = new Date(today);
    calState.viewYear = today.getFullYear();
    calState.viewMonth = today.getMonth();
    calState.selectedDay = today.getDate();
    syncSelectInputs();
    setMatrixView('month');
}

function onMonthYearSelectChange() {
    calState.viewMonth = parseInt(document.getElementById('sel-cal-month').value);
    calState.viewYear = parseInt(document.getElementById('inp-cal-year').value);
    if (calState.activeView === 'month') renderMonthMatrix();
    if (calState.activeView === 'year') renderAnnualMatrix();
    if (calState.activeView === 'week') {
        calState.currentDate = new Date(calState.viewYear, calState.viewMonth, 1);
        renderWeekHorizon();
    }
}

function syncSelectInputs() {
    document.getElementById('sel-cal-month').value = calState.viewMonth;
    document.getElementById('inp-cal-year').value = calState.viewYear;
}

/* ==========================================================================
    LUNISOLAR & ASTRONOMICAL COMPUTATIONS
    ========================================================================== */
function computeMoonPhase(year, month, day) {
    let c = 0, e = 0, jd = 0, b = 0;
    if (month < 3) {
        year--;
        month += 12;
    }
    month++;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    if (b >= 8) b = 0;

    const phases = [
        "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
        "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
    ];
    const illum = Math.round((1 - Math.cos(jd * 2 * Math.PI)) / 2 * 100);
    return { phase: phases[b], illum: illum };
}

function computeZodiacSign(day, month) {
    const signs = [
        { name: "Capricorn (મકર)", d: 20 },
        { name: "Aquarius (કુંભ)", d: 19 },
        { name: "Pisces (મીન)", d: 21 },
        { name: "Aries (મેષ)", d: 20 },
        { name: "Taurus (વૃષભ)", d: 21 },
        { name: "Gemini (મિથુન)", d: 21 },
        { name: "Cancer (કર્ક)", d: 23 },
        { name: "Leo (સિંહ)", d: 23 },
        { name: "Virgo (કન્યા)", d: 23 },
        { name: "Libra (તુલા)", d: 23 },
        { name: "Scorpio (વૃશ્ચિક)", d: 22 },
        { name: "Sagittarius (ધન)", d: 22 }
    ];
    return (day < signs[month].d) ? signs[(month + 11) % 12].name : signs[month].name;
}

function computeVikramSamvat(year, month, day) {
    const vsYear = year + 57;
    const masaList = [
        "Pausha / Magha", "Magha / Phalguna", "Phalguna / Chaitra", 
        "Chaitra / Vaishakha", "Vaishakha / Jyeshtha", "Jyeshtha / Ashadha",
        "Ashadha / Shravana", "Shravana / Bhadrapada", "Bhadrapada / Ashwin",
        "Ashwin / Kartika", "Kartika / Margashirsha", "Margashirsha / Pausha"
    ];
    const rituList = [
        "Hemanta (Winter)", "Shishira (Late Winter)", "Vasanta (Spring)",
        "Grishma (Summer)", "Varsha (Monsoon)", "Sharad (Autumn)"
    ];
    const rituIdx = Math.floor(month / 2);
    return {
        year: `VS ${vsYear}`,
        masa: masaList[month],
        paksha: day <= 15 ? "Shukla Paksha (સુદ)" : "Krishna Paksha (વદ)",
        ritu: rituList[rituIdx]
    };
}

/* ==========================================================================
    MONTH MATRIX RENDERING
    ========================================================================== */
function renderMonthMatrix() {
    const container = document.getElementById('month-days-container');
    const title = document.getElementById('month-grid-title');
    const telemetryHeader = document.getElementById('cal-telemetry-header-title');
    
    title.textContent = `${monthNames[calState.viewMonth]} ${calState.viewYear}`;
    telemetryHeader.textContent = `${monthNames[calState.viewMonth]} ${calState.viewYear} Matrix`;

    const firstDayIndex = new Date(calState.viewYear, calState.viewMonth, 1).getDay();
    const totalDays = new Date(calState.viewYear, calState.viewMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(calState.viewYear, calState.viewMonth, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === calState.viewYear && today.getMonth() === calState.viewMonth;

    // Update VS telemetry
    const vs = computeVikramSamvat(calState.viewYear, calState.viewMonth, calState.selectedDay || 15);
    document.getElementById('lbl-vs-year').textContent = `${vs.year} ${vs.masa.split('/')[0]}`;
    document.getElementById('vs-matrix-year').textContent = vs.year;
    document.getElementById('vs-matrix-masa').textContent = vs.masa;
    document.getElementById('vs-matrix-paksha').textContent = vs.paksha;
    document.getElementById('vs-matrix-ritu').textContent = vs.ritu;

    // Astronomy update
    const astro = computeMoonPhase(calState.viewYear, calState.viewMonth + 1, calState.selectedDay || 15);
    document.getElementById('astronomy-moon-phase').textContent = astro.phase;
    document.getElementById('astronomy-moon-illum').textContent = `${astro.illum}% Lit`;
    document.getElementById('astronomy-zodiac-sign').textContent = computeZodiacSign(calState.selectedDay || 15, calState.viewMonth);

    let html = '';

    // Previous month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = prevMonthTotalDays - i;
        html += `
            <div onclick="navigateMonth(-1)" class="bg-slate-950/30 border border-slate-900 rounded-xl p-2 min-h-[58px] opacity-30 flex flex-col justify-between cursor-pointer hover:opacity-60 transition-opacity">
                <span class="font-mono text-[10px] text-slate-600">${dayNum}</span>
            </div>
        `;
    }

    // Current month day cells
    for (let d = 1; d <= totalDays; d++) {
        const isToday = isCurrentMonth && today.getDate() === d;
        const isSelected = calState.selectedDay === d;
        const dateKey = `${calState.viewYear}-${String(calState.viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEvents = calState.allEvents.filter(e => e.date === dateKey);
        const hasHoliday = dayEvents.some(e => e.category === 'holiday');
        const hasCustom = dayEvents.some(e => e.isCustom);

        html += `
            <div onclick="openDateDetailsModal(${calState.viewYear}, ${calState.viewMonth}, ${d})" class="bg-slate-950/70 hover:bg-slate-900/90 border ${isToday ? 'border-teal-400 bg-teal-500/10 stat-glow' : (isSelected ? 'border-teal-500/60 bg-slate-900' : 'border-slate-800/80')} rounded-xl p-2 min-h-[58px] flex flex-col justify-between transition-all cursor-pointer group hover:border-teal-400">
                <div class="flex items-center justify-between">
                    <span class="font-mono text-xs font-bold ${isToday ? 'text-teal-300' : (hasHoliday ? 'text-orange-400' : 'text-slate-300')} group-hover:text-teal-400">${d}</span>
                    <div class="flex items-center gap-1">
                        ${hasHoliday ? `<span class="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#fb923c]"></span>` : ''}
                        ${hasCustom ? `<span class="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]"></span>` : ''}
                    </div>
                </div>
                <div class="space-y-0.5 mt-1">
                    ${dayEvents.slice(0, 1).map(ev => `
                        <div class="text-[9px] font-mono truncate px-1 py-0.5 rounded ${ev.category === 'holiday' ? 'bg-orange-500/15 border border-orange-500/30 text-orange-300' : 'bg-teal-500/15 border border-teal-500/30 text-teal-300'} font-semibold">
                            ${ev.title}
                        </div>
                    `).join('')}
                    ${dayEvents.length > 1 ? `<span class="text-[8px] text-slate-500 font-mono font-bold">+${dayEvents.length - 1} more</span>` : ''}
                </div>
            </div>
        `;
    }

    // Next month trailing padding
    const totalRendered = firstDayIndex + totalDays;
    const remainingCells = (7 - (totalRendered % 7)) % 7;
    for (let j = 1; j <= remainingCells; j++) {
        html += `
            <div onclick="navigateMonth(1)" class="bg-slate-950/30 border border-slate-900 rounded-xl p-2 min-h-[58px] opacity-30 flex flex-col justify-between cursor-pointer hover:opacity-60 transition-opacity">
                <span class="font-mono text-[10px] text-slate-600">${j}</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

/* ==========================================================================
    WEEK HORIZON RENDERING
    ========================================================================== */
function renderWeekHorizon() {
    const container = document.getElementById('week-agenda-grid');
    const title = document.getElementById('week-horizon-title');
    
    const curr = new Date(calState.currentDate);
    const first = curr.getDate() - curr.getDay();
    const firstDayOfWeek = new Date(curr.setDate(first));

    title.textContent = `Week Horizon: ${firstDayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(curr.setDate(first + 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    let html = '';
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(firstDayOfWeek);
        dayDate.setDate(firstDayOfWeek.getDate() + i);
        const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        const dayEvents = calState.allEvents.filter(e => e.date === dateKey);
        const isSelected = calState.selectedDay === dayDate.getDate() && calState.viewMonth === dayDate.getMonth();

        html += `
            <div class="bg-slate-950/80 border ${isSelected ? 'border-teal-400 bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-3 flex flex-col justify-between min-h-[220px] transition-all">
                <div class="border-b border-slate-800/80 pb-2 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] uppercase font-mono font-bold text-slate-400 block">${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span class="font-mono text-base font-bold text-teal-300">${dayDate.getDate()}</span>
                    </div>
                    <button type="button" onclick="drillDownToMonth(${dayDate.getMonth()}, ${dayDate.getDate()})" class="text-[9px] font-mono text-slate-500 hover:text-teal-400 p-1" title="View Month">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </button>
                </div>
                <div class="space-y-1.5 my-2 flex-1 overflow-y-auto">
                    ${dayEvents.length === 0 ? `<span class="text-[10px] text-slate-600 font-mono">No protocols</span>` : ''}
                    ${dayEvents.map(ev => `
                        <div class="bg-slate-900/90 ${ev.category === 'holiday' ? 'border border-orange-500/30 text-orange-200' : 'border border-teal-500/20 text-teal-200'} p-1.5 rounded-lg text-[10px] font-mono">
                            <span class="font-bold block truncate">${ev.title}</span>
                            <span class="text-[8px] uppercase ${ev.category === 'holiday' ? 'text-orange-400' : 'text-teal-400'} font-bold">${ev.category} ${ev.isCustom ? '• Custom' : ''}</span>
                        </div>
                    `).join('')}
                </div>
                <button type="button" onclick="openDateDetailsModal(${dayDate.getFullYear()}, ${dayDate.getMonth()}, ${dayDate.getDate()})" class="w-full py-1 text-[10px] font-mono text-slate-400 hover:text-teal-300 bg-slate-900 rounded-lg transition-colors cursor-pointer">Inspect</button>
            </div>
        `;
    }
    container.innerHTML = html;
}

/* ==========================================================================
    YEAR-AT-A-GLANCE MATRIX WITH INTERACTIVE MONTH & DAY DRILLDOWN
    ========================================================================== */
function renderAnnualMatrix() {
    const container = document.getElementById('annual-12-months-grid');
    document.getElementById('year-matrix-title').textContent = `Year ${calState.viewYear} Annual Overview`;

    let html = '';
    for (let m = 0; m < 12; m++) {
        const totalDays = new Date(calState.viewYear, m + 1, 0).getDate();
        const firstDayIdx = new Date(calState.viewYear, m, 1).getDay();

        html += `
            <div class="year-month-card bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between cursor-pointer group">
                <div onclick="drillDownToMonth(${m})" class="flex justify-between items-center border-b border-slate-800/60 pb-1.5 mb-2 group-hover:border-teal-500/40">
                    <span class="font-mono text-xs font-bold text-teal-300 group-hover:text-teal-400 flex items-center gap-1.5">
                        <span>${monthNames[m]}</span>
                        <i class="fa-solid fa-arrow-right text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </span>
                    <span class="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">${totalDays}d</span>
                </div>

                <div class="grid grid-cols-7 gap-1 text-center text-[8px] font-mono mb-1 text-slate-500">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div class="grid grid-cols-7 gap-1 text-center text-[8px] font-mono">
                    ${Array(firstDayIdx).fill('<div class="py-0.5 opacity-0 pointer-events-none">.</div>').join('')}
                    ${Array.from({ length: totalDays }, (_, i) => {
                        const dayNum = i + 1;
                        const dateKey = `${calState.viewYear}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const dayEvents = calState.allEvents.filter(e => e.date === dateKey);
                        const hasHoliday = dayEvents.some(e => !e.isCustom);
                        const hasCustom = dayEvents.some(e => e.isCustom);

                        let cellClass = 'text-slate-400 hover:text-teal-300 hover:bg-slate-900';
                        if (hasHoliday) cellClass = 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30';
                        else if (hasCustom) cellClass = 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30';

                        return `
                            <div onclick="event.stopPropagation(); drillDownToMonth(${m}, ${dayNum});" 
                                    class="py-0.5 rounded transition-all cursor-pointer ${cellClass}"
                                    title="${monthNames[m]} ${dayNum}, ${calState.viewYear}${dayEvents.length > 0 ? ` (${dayEvents.length} Event${dayEvents.length > 1 ? 's' : ''})` : ''}">
                                ${dayNum}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

/* ==========================================================================
    DATE DELTA & WORKDAYS CALCULATOR
    ========================================================================== */
function computeDateDelta() {
    const d1 = new Date(document.getElementById('calc-start-date').value);
    const d2 = new Date(document.getElementById('calc-end-date').value);

    if (isNaN(d1) || isNaN(d2)) return;

    const diffTime = Math.abs(d2 - d1);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let workdays = 0;
    let weekends = 0;
    let cur = new Date(Math.min(d1, d2));
    const end = new Date(Math.max(d1, d2));

    while (cur <= end) {
        const day = cur.getDay();
        if (day === 0 || day === 6) weekends++;
        else workdays++;
        cur.setDate(cur.getDate() + 1);
    }

    document.getElementById('delta-total-days').textContent = `${totalDays} Days`;
    document.getElementById('delta-workdays').textContent = `${workdays} Days`;
    document.getElementById('delta-weekends').textContent = `${weekends} Days`;
    document.getElementById('delta-weeks').textContent = `${(totalDays / 7).toFixed(1)} Wks`;
}

/* ==========================================================================
    EVENT ADD & DELETE ONLY CUSTOM EVENTS (PRESERVING OFFICIAL FESTIVALS)
    ========================================================================== */
function handleNewEventSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('inp-event-title').value.trim();
    const date = document.getElementById('inp-event-date').value;
    const category = document.getElementById('sel-event-category').value;

    if (!title || !date) return;

    const newEvent = {
        id: 'cust-' + Date.now(),
        title,
        date,
        category,
        isCustom: true // explicitly tagged as custom
    };

    calState.customEvents.push(newEvent);
    saveCustomEvents(calState.customEvents);
    refreshCombinedEvents();

    document.getElementById('inp-event-title').value = '';

    renderMonthMatrix();
    if (calState.activeView === 'week') renderWeekHorizon();
    if (calState.activeView === 'year') renderAnnualMatrix();

    // Flash button confirmation
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check text-[10px]"></i> Custom Event Saved!';
    btn.classList.replace('bg-teal-500', 'bg-emerald-400');
    setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.replace('bg-emerald-400', 'bg-teal-500');
    }, 1800);
}

// DELETION LOGIC: Strictly removes only custom events by ID
function removeCustomEvent(customEventId, year, month, day) {
    calState.customEvents = calState.customEvents.filter(ev => ev.id !== customEventId);
    saveCustomEvents(calState.customEvents);
    refreshCombinedEvents();

    renderMonthMatrix();
    if (calState.activeView === 'week') renderWeekHorizon();
    if (calState.activeView === 'year') renderAnnualMatrix();

    // Refresh modal live
    openDateDetailsModal(year, month, day);
}

function openDateDetailsModal(year, month, day) {
    calState.viewYear = year;
    calState.viewMonth = month;
    calState.selectedDay = day;

    const dateObj = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const vs = computeVikramSamvat(year, month, day);

    document.getElementById('modal-date-full').textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('modal-date-vs').textContent = `${vs.year} • ${vs.masa} • ${vs.paksha}`;

    // Wire drilldown action buttons in the modal
    document.getElementById('modal-btn-view-week').onclick = () => drillDownToWeek(year, month, day);
    document.getElementById('modal-btn-view-month').onclick = () => {
        closeDateDetailsModal();
        drillDownToMonth(month, day);
    };

    const dayEvents = calState.allEvents.filter(e => e.date === dateKey);
    const container = document.getElementById('modal-events-list');
    document.getElementById('modal-event-count').textContent = `${dayEvents.length} Event${dayEvents.length === 1 ? '' : 's'}`;

    if (dayEvents.length === 0) {
        container.innerHTML = `<div class="p-3 text-center text-slate-600 font-mono text-xs">No registered events for this date</div>`;
    } else {
        container.innerHTML = dayEvents.map(ev => `
            <div class="bg-slate-900 p-2.5 rounded-xl border ${ev.isCustom ? 'border-teal-500/30' : 'border-orange-500/30'} flex items-center justify-between group">
                <div class="flex items-center gap-2 max-w-[78%]">
                    <span class="w-1.5 h-1.5 rounded-full ${ev.isCustom ? 'bg-teal-400' : 'bg-orange-400'} shrink-0"></span>
                    <div class="flex flex-col truncate">
                        <span class="text-xs font-mono font-bold ${ev.isCustom ? 'text-teal-300' : 'text-orange-300'} truncate">${ev.title}</span>
                        <span class="text-[9px] uppercase font-mono text-slate-500">${ev.category} ${ev.isCustom ? '• Custom Event' : '• Official Festival'}</span>
                    </div>
                </div>
                
                <!-- Delete Button: ONLY available if it is a Custom User Event -->
                ${ev.isCustom ? `
                    <button type="button" onclick="removeCustomEvent('${ev.id}', ${year}, ${month}, ${day})" class="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer" title="Delete custom event">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                ` : `
                    <span class="text-[10px] text-orange-400/60 font-mono px-2 py-0.5 rounded bg-orange-500/5 border border-orange-500/10 flex items-center gap-1" title="Protected Official Observance">
                        <i class="fa-solid fa-lock text-[8px]"></i> Official
                    </span>
                `}
            </div>
        `).join('');
    }

    document.getElementById('cal-date-modal').classList.remove('hidden');
}

function closeDateDetailsModal() {
    document.getElementById('cal-date-modal').classList.add('hidden');
}

function exportCalendarEventsICS() {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FusionMint//Temporal Matrix//EN\n";
    calState.allEvents.forEach(ev => {
        const dateStr = ev.date.replace(/-/g, '');
        icsContent += `BEGIN:VEVENT\nSUMMARY:${ev.title}\nDTSTART;VALUE=DATE:${dateStr}\nDTEND;VALUE=DATE:${dateStr}\nDESCRIPTION:${ev.category}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `FusionMint_Almanac_${calState.viewYear}.ics`;
    link.click();
}

function copyCalendarSummaryReport() {
    const report = `[FusionMint Almanac Telemetry]\nGregorian: ${monthNames[calState.viewMonth]} ${calState.viewYear}\nVikram Samvat: ${document.getElementById('lbl-vs-year').textContent}\nZodiac: ${document.getElementById('astronomy-zodiac-sign').textContent}\nMoon: ${document.getElementById('astronomy-moon-phase').textContent} (${document.getElementById('astronomy-moon-illum').textContent})\nTotal Events (Official + Custom): ${calState.allEvents.length}`;
    navigator.clipboard.writeText(report).then(() => {
        alert('Almanac snapshot copied to clipboard!');
    });
}

/* ==========================================================================
    INITIALIZATION ENTRY POINT
    ========================================================================== */
function initCalendar() {
    syncSelectInputs();
    renderMonthMatrix();
    computeDateDelta();

    // Set default date input in event form to current date
    document.getElementById('inp-event-date').value = new Date().toISOString().split('T')[0];

    // Live top badge clock sync
    setInterval(() => {
        const now = new Date();
        document.getElementById('badge-cal-display').textContent = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', initCalendar);