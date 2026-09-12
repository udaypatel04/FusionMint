
// Array storing weekend day indexes (0=Sun, 6=Sat)
var weekendDays = [0, 6];

document.addEventListener('DOMContentLoaded', function() {
    initDefaultTimeline();
    calculateDateDifferential();
});

function initDefaultTimeline() {
    var today = new Date();
    var nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    var startInput = document.getElementById('inp-start-date');
    var endInput = document.getElementById('inp-end-date');

    if (startInput) startInput.value = formatDateForInput(today);
    if (endInput) endInput.value = formatDateForInput(nextMonth);
}

function setStartDateToday() {
    var startInput = document.getElementById('inp-start-date');
    if (startInput) {
        startInput.value = formatDateForInput(new Date());
        calculateDateDifferential();
    }
}

function swapStartEndDates() {
    var startInput = document.getElementById('inp-start-date');
    var endInput = document.getElementById('inp-end-date');
    if (startInput && endInput) {
        var temp = startInput.value;
        startInput.value = endInput.value;
        endInput.value = temp;
        calculateDateDifferential();
    }
}

function addDurationToStart(daysToAdd) {
    var startInput = document.getElementById('inp-start-date');
    var endInput = document.getElementById('inp-end-date');
    if (!startInput || !startInput.value) return;

    var startDate = new Date(startInput.value + "T00:00:00");
    startDate.setDate(startDate.getDate() + daysToAdd);

    if (endInput) {
        endInput.value = formatDateForInput(startDate);
        calculateDateDifferential();
    }
}

function formatDateForInput(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function toggleWeekendDay(dayIndex) {
    var idx = weekendDays.indexOf(dayIndex);
    var btn = document.getElementById('day-btn-' + dayIndex);

    if (idx > -1) {
        weekendDays.splice(idx, 1);
        if (btn) btn.className = "py-1.5 text-[9px] font-mono font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-400 transition-all cursor-pointer";
    } else {
        weekendDays.push(dayIndex);
        if (btn) btn.className = "py-1.5 text-[9px] font-mono font-bold rounded-lg bg-emerald-500 text-slate-950 shadow-sm transition-all cursor-pointer";
    }

    calculateDateDifferential();
}

function calculateDateDifferential() {
    var startVal = document.getElementById('inp-start-date').value;
    var endVal = document.getElementById('inp-end-date').value;
    if (!startVal || !endVal) return;

    var d1 = new Date(startVal + "T00:00:00");
    var d2 = new Date(endVal + "T00:00:00");

    var isReverse = false;
    if (d1 > d2) {
        isReverse = true;
        var temp = d1;
        d1 = d2;
        d2 = temp;
    }

    var includeEnd = document.getElementById('chk-include-end-date').checked;
    var holidaysCount = parseInt(document.getElementById('inp-custom-holidays').value, 10) || 0;
    var holidaysBadge = document.getElementById('holidays-count-badge');
    if (holidaysBadge) holidaysBadge.innerText = holidaysCount + " days";

    // Total Gross Days Calculation
    var diffMs = d2.getTime() - d1.getTime();
    var grossDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (includeEnd) {
        grossDays += 1;
    }

    // Breakdown (Years, Months, Days)
    var y1 = d1.getFullYear();
    var m1 = d1.getMonth();
    var day1 = d1.getDate();

    var y2 = d2.getFullYear();
    var m2 = d2.getMonth();
    var day2 = d2.getDate();

    var years = y2 - y1;
    var months = m2 - m1;
    var days = day2 - day1;

    if (days < 0) {
        months--;
        var prevMonthLastDay = new Date(y2, m2, 0).getDate();
        days += prevMonthLastDay;
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    // Workday & Weekend Day Iterator
    var workingDays = 0;
    var weekendCount = 0;

    var iter = new Date(d1.getTime());
    var iterEnd = new Date(d2.getTime());
    if (!includeEnd) {
        iterEnd.setDate(iterEnd.getDate() - 1);
    }

    while (iter <= iterEnd) {
        var dayOfWeek = iter.getDay();
        if (weekendDays.indexOf(dayOfWeek) > -1) {
            weekendCount++;
        } else {
            workingDays++;
        }
        iter.setDate(iter.getDate() + 1);
    }

    // Net Working Days after Holiday Deductions
    var netWorkingDays = Math.max(0, workingDays - holidaysCount);

    // Update UI Displays
    document.getElementById('metric-diff-years').innerText = years;
    document.getElementById('metric-diff-months').innerText = months;
    document.getElementById('metric-diff-days').innerText = days + (includeEnd ? 1 : 0);

    document.getElementById('metric-total-days-summary').innerText = "Total Duration: " + grossDays.toLocaleString() + " Days" + (isReverse ? " (Reversed Order)" : "");
    document.getElementById('timeline-span-pill').innerText = grossDays + " Days Span";

    document.getElementById('stat-working-days').innerText = netWorkingDays.toLocaleString();
    document.getElementById('stat-weekend-days').innerText = weekendCount.toLocaleString();
    document.getElementById('stat-holiday-deductions').innerText = holidaysCount.toLocaleString();

    var workPct = grossDays > 0 ? ((netWorkingDays / grossDays) * 100).toFixed(1) : "0.0";
    var weekPct = grossDays > 0 ? ((weekendCount / grossDays) * 100).toFixed(1) : "0.0";

    document.getElementById('stat-working-percent').innerText = workPct + "% of total timeframe";
    document.getElementById('stat-weekend-percent').innerText = weekPct + "% of total timeframe";

    // Cumulative Unit Counters
    var totalHours = grossDays * 24;
    var totalMinutes = totalHours * 60;
    var totalSeconds = totalMinutes * 60;
    var totalWeeks = (grossDays / 7).toFixed(1);

    document.getElementById('unit-total-weeks').innerText = totalWeeks;
    document.getElementById('unit-total-hours').innerText = totalHours.toLocaleString();
    document.getElementById('unit-total-minutes').innerText = totalMinutes.toLocaleString();
    document.getElementById('unit-total-seconds').innerText = totalSeconds.toLocaleString();
}

function copyDurationReport() {
    var y = document.getElementById('metric-diff-years').innerText;
    var m = document.getElementById('metric-diff-months').innerText;
    var d = document.getElementById('metric-diff-days').innerText;
    var gross = document.getElementById('metric-total-days-summary').innerText;
    var work = document.getElementById('stat-working-days').innerText;
    var weekend = document.getElementById('stat-weekend-days').innerText;

    var report = "=== FUSIONMINT DATE DIFFERENTIAL REPORT ===\n" +
                    "Span: " + y + " Years, " + m + " Months, " + d + " Days\n" +
                    gross + "\n" +
                    "Net Workdays: " + work + "\n" +
                    "Weekend Days: " + weekend + "\n" +
                    "Generated by FusionMint Date Difference Matrix Engine.";

    navigator.clipboard.writeText(report).then(function() {
        alert("Duration report copied to clipboard!");
    });
}