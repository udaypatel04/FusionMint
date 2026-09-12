
var liveStreamingInterval = null;
var selectedTimeZone = "AUTO";
var is24HourFormat = false;

var PLANET_ORBITS = {
    mercury: 0.2408467,
    venus: 0.61519726,
    mars: 1.8808158,
    jupiter: 11.862615,
    saturn: 29.447498,
    uranus: 84.016846,
    neptune: 164.79132
};

// Approximate Hindu Lunar Months (Māsa) corresponding to Gregorian transitions
var HINDU_MASAS = [
    { name: "Pausha / Magha (પોષ / મહા)", ritu: "Shishira (Winter)" },
    { name: "Magha / Phalguna (મહા / ફાગણ)", ritu: "Shishira (Winter)" },
    { name: "Phalguna / Chaitra (ફાગણ / ચૈત્ર)", ritu: "Vasanta (Spring)" },
    { name: "Chaitra / Vaishakha (ચૈત્ર / વૈશાખ)", ritu: "Vasanta (Spring)" },
    { name: "Vaishakha / Jyeshtha (વૈશાખ / જેઠ)", ritu: "Grishma (Summer)" },
    { name: "Jyeshtha / Ashadha (જેઠ / અષાઢ)", ritu: "Grishma (Summer)" },
    { name: "Ashadha / Shravana (અષાઢ / શ્રાવણ)", ritu: "Varsha (Monsoon)" },
    { name: "Shravana / Bhadrapada (શ્રાવણ / ભાદરવો)", ritu: "Varsha (Monsoon)" },
    { name: "Bhadrapada / Ashvina (ભાદરવો / આસો)", ritu: "Sharad (Autumn)" },
    { name: "Ashvina / Kartika (આસો / કારતક)", ritu: "Sharad (Autumn)" },
    { name: "Kartika / Margashirsha (કારતક / માગશર)", ritu: "Hemanta (Pre-Winter)" },
    { name: "Margashirsha / Pausha (માગશર / પોષ)", ritu: "Hemanta (Pre-Winter)" }
];

document.addEventListener('DOMContentLoaded', function() {
    initDefaultDates();
    computeTemporalMetrics();
    toggleLiveStreaming();
    updateWorldClocks();
});

function initDefaultDates() {
    var today = new Date();
    var targetInput = document.getElementById('inp-target-date');
    var dobInput = document.getElementById('inp-dob');

    if (targetInput) {
        targetInput.value = formatDateForInput(today);
    }

    if (dobInput) {
        dobInput.value = "2000-01-01";
    }
}

function setTimeFormat(hours) {
    is24HourFormat = (hours === 24);
    var btn12 = document.getElementById('btn-fmt-12');
    var btn24 = document.getElementById('btn-fmt-24');
    if (is24HourFormat) {
        btn24.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer";
        btn12.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer";
    } else {
        btn12.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-teal-500 text-slate-950 shadow-md transition-all cursor-pointer";
        btn24.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer";
    }
    updateWorldClocks();
}

function setTargetDateToToday() {
    var targetInput = document.getElementById('inp-target-date');
    if (targetInput) {
        targetInput.value = formatDateForInput(new Date());
        computeTemporalMetrics();
    }
}

function formatDateForInput(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function handleTimezoneChange() {
    var sel = document.getElementById('sel-timezone');
    selectedTimeZone = sel ? sel.value : "AUTO";
    
    var pill = document.getElementById('tz-offset-pill');
    if (pill) {
        if (selectedTimeZone === "AUTO") {
            pill.innerText = "Local (" + Intl.DateTimeFormat().resolvedOptions().timeZone + ")";
        } else {
            pill.innerText = selectedTimeZone;
        }
    }
    computeTemporalMetrics();
}

function toggleLiveStreaming() {
    var chk = document.getElementById('chk-live-stream');
    if (chk && chk.checked) {
        if (!liveStreamingInterval) {
            liveStreamingInterval = setInterval(function() {
                updateLiveSecondsCounter();
                updateWorldClocks();
            }, 50); // 50ms sub-second smooth refresh
        }
    } else {
        if (liveStreamingInterval) {
            clearInterval(liveStreamingInterval);
            liveStreamingInterval = null;
        }
        var label = document.getElementById('metric-realtime-seconds');
        if (label) label.innerText = "00h : 00m : 00s . 000ms";
    }
}

function updateWorldClocks() {
    var now = new Date();
    var formatOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: !is24HourFormat 
    };

    var setClock = function(id, tz) {
        var el = document.getElementById(id);
        if (el) {
            try {
                el.innerText = new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: tz }, formatOptions)).format(now);
            } catch(e) {
                el.innerText = "--:--:--";
            }
        }
    };

    setClock('tz-time-london', 'Europe/London');
    setClock('tz-time-ny', 'America/New_York');
    setClock('tz-time-dubai', 'Asia/Dubai');
    setClock('tz-time-tokyo', 'Asia/Tokyo');

    // Atomic UTC Clock
    var utcEl = document.getElementById('live-atomic-utc');
    if (utcEl) {
        utcEl.innerText = now.toUTCString().split(' ')[4] + " UTC";
    }

    // Unix Epoch Seconds
    var unixEl = document.getElementById('live-unix-timestamp');
    if (unixEl) {
        unixEl.innerText = Math.floor(now.getTime() / 1000);
    }

    // Day Progress Percentage
    var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var msPassed = now.getTime() - startOfDay;
    var pctPassed = ((msPassed / (86400000)) * 100).toFixed(1);
    var bar = document.getElementById('live-day-progress-bar');
    var barVal = document.getElementById('live-day-progress-val');
    if (bar && barVal) {
        bar.style.width = pctPassed + "%";
        barVal.innerText = pctPassed + "%";
    }

    var badge = document.getElementById('badge-time-display');
    if (badge) {
        var activeTz = selectedTimeZone === "AUTO" ? Intl.DateTimeFormat().resolvedOptions().timeZone : selectedTimeZone;
        try {
            badge.innerText = new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: activeTz }, formatOptions)).format(now);
        } catch(e) {
            badge.innerText = now.toTimeString().split(' ')[0];
        }
    }
}

function updateLiveSecondsCounter() {
    var dobVal = document.getElementById('inp-dob').value;
    var timeVal = document.getElementById('inp-dob-time').value || "00:00";
    if (!dobVal) return;

    var birthDate = new Date(dobVal + "T" + timeVal + ":00");
    var now = new Date();

    if (birthDate > now) {
        var label = document.getElementById('metric-realtime-seconds');
        if (label) label.innerText = "Target is in future timeline";
        return;
    }

    var diff = now - birthDate;
    var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor((diff / (1000 * 60)) % 60);
    var seconds = Math.floor((diff / 1000) % 60);
    var ms = Math.floor(diff % 1000);

    var label = document.getElementById('metric-realtime-seconds');
    if (label) {
        label.innerText = String(hours).padStart(2, '0') + "h : " + 
                            String(minutes).padStart(2, '0') + "m : " + 
                            String(seconds).padStart(2, '0') + "s . " + 
                            String(ms).padStart(3, '0') + "ms";
    }
}

function computePlanetaryAge() {
    var dobVal = document.getElementById('inp-dob').value;
    var targetVal = document.getElementById('inp-target-date').value;
    if (!dobVal || !targetVal) return;

    var dob = new Date(dobVal + "T00:00:00");
    var target = new Date(targetVal + "T00:00:00");
    var diffDays = (target.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 0) {
        document.getElementById('info-planetary-age').innerText = "0.00 Yrs";
        return;
    }

    var earthYears = diffDays / 365.256363004;
    var sel = document.getElementById('sel-planet');
    var planet = sel ? sel.value : "mars";
    var orbitMultiplier = PLANET_ORBITS[planet] || 1;
    var planetAge = earthYears / orbitMultiplier;

    var planetName = planet.charAt(0).toUpperCase() + planet.slice(1);
    document.getElementById('info-planetary-age').innerText = planetAge.toFixed(2) + " " + planetName + " Yrs";
}

// Vikram Samvat Conversion Engine (Lunisolar Offset approx +56.7 to +57 years)
function calculateVikramSamvat(date) {
    var gYear = date.getFullYear();
    var gMonth = date.getMonth(); 
    var gDay = date.getDate();

    var vsYear = (gMonth >= 3 && gDay >= 22) ? (gYear + 57) : (gYear + 56);
    var masaInfo = HINDU_MASAS[gMonth] || HINDU_MASAS[0];

    return {
        year: vsYear,
        masa: masaInfo.name,
        ritu: masaInfo.ritu
    };
}

function computeTemporalMetrics() {
    var dobVal = document.getElementById('inp-dob').value;
    var targetVal = document.getElementById('inp-target-date').value;

    if (!dobVal || !targetVal) return;

    var dob = new Date(dobVal + "T00:00:00");
    var target = new Date(targetVal + "T00:00:00");

    if (dob > target) {
        document.getElementById('metric-years').innerText = "00";
        document.getElementById('metric-months').innerText = "00";
        document.getElementById('metric-days').innerText = "00";
        document.getElementById('info-next-bday').innerText = "DOB exceeds Target";
        return;
    }

    var y1 = dob.getFullYear();
    var m1 = dob.getMonth();
    var d1 = dob.getDate();

    var y2 = target.getFullYear();
    var m2 = target.getMonth();
    var d2 = target.getDate();

    var years = y2 - y1;
    var months = m2 - m1;
    var days = d2 - d1;

    if (days < 0) {
        months--;
        var prevMonthLastDay = new Date(y2, m2, 0).getDate();
        days += prevMonthLastDay;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    document.getElementById('metric-years').innerText = String(years).padStart(2, '0');
    document.getElementById('metric-months').innerText = String(months).padStart(2, '0');
    document.getElementById('metric-days').innerText = String(days).padStart(2, '0');

    var totalTimeMs = target.getTime() - dob.getTime();
    var totalDays = Math.floor(totalTimeMs / (1000 * 60 * 60 * 24));
    var totalWeeks = Math.floor(totalDays / 7);
    var totalMonths = (years * 12) + months;
    var totalMinutes = totalDays * 24 * 60;

    var heartbeats = Math.floor(totalMinutes * 80);
    var breaths = Math.floor(totalMinutes * 16);

    document.getElementById('unit-total-months').innerText = totalMonths.toLocaleString();
    document.getElementById('unit-total-weeks').innerText = totalWeeks.toLocaleString();
    document.getElementById('unit-total-heartbeats').innerText = heartbeats.toLocaleString();
    document.getElementById('unit-total-breaths').innerText = breaths.toLocaleString();

    var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    document.getElementById('info-birth-dayname').innerText = weekdays[dob.getDay()];

    var nextBday = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday < target) {
        nextBday.setFullYear(target.getFullYear() + 1);
    }
    var bdayDiffMs = nextBday.getTime() - target.getTime();
    var bdayDaysLeft = Math.ceil(bdayDiffMs / (1000 * 60 * 60 * 24));
    
    var nbMonths = Math.floor(bdayDaysLeft / 30.44);
    var nbDays = Math.floor(bdayDaysLeft % 30.44);
    document.getElementById('info-next-bday').innerText = nbMonths + " Mos, " + nbDays + " Days";

    // Western Zodiac Sign
    var zodiac = getZodiacSign(dob.getDate(), dob.getMonth() + 1);
    document.getElementById('astronomy-sign-badge').innerText = "Zodiac: " + zodiac;

    // Vikram Samvat Computations
    var vsDob = calculateVikramSamvat(dob);
    var vsTarget = calculateVikramSamvat(target);

    document.getElementById('lbl-vs-year').innerText = "VS " + vsTarget.year;
    document.getElementById('vs-dob-year').innerText = "VS " + vsDob.year;
    document.getElementById('vs-target-year').innerText = "VS " + vsTarget.year;
    document.getElementById('vs-birth-masa').innerText = vsDob.masa;
    document.getElementById('vs-birth-ritu').innerText = vsDob.ritu;

    computePlanetaryAge();
}

function getZodiacSign(day, month) {
    var zodiacs = [
        { name: "Capricorn", end: 19 },
        { name: "Aquarius", end: 18 },
        { name: "Pisces", end: 20 },
        { name: "Aries", end: 19 },
        { name: "Taurus", end: 20 },
        { name: "Gemini", end: 20 },
        { name: "Cancer", end: 22 },
        { name: "Leo", end: 22 },
        { name: "Virgo", end: 22 },
        { name: "Libra", end: 22 },
        { name: "Scorpio", end: 21 },
        { name: "Sagittarius", end: 21 },
        { name: "Capricorn", end: 31 }
    ];
    if (day <= zodiacs[month - 1].end) {
        return zodiacs[month - 1].name;
    } else {
        return zodiacs[month].name;
    }
}

function copyTemporalReport() {
    var y = document.getElementById('metric-years').innerText;
    var m = document.getElementById('metric-months').innerText;
    var d = document.getElementById('metric-days').innerText;
    var vsYear = document.getElementById('vs-target-year').innerText;
    var masa = document.getElementById('vs-birth-masa').innerText;
    var planetAge = document.getElementById('info-planetary-age').innerText;
    var report = "Temporal Metric Epoch: " + y + " Years, " + m + " Months, " + d + " Days | Vikram Samvat: " + vsYear + " (" + masa + ") | Planetary Solar: " + planetAge + " | Generated by FusionMint Chrono Engine.";
    
    navigator.clipboard.writeText(report).then(function() {
        alert("Temporal Report copied to clipboard!");
    });
}