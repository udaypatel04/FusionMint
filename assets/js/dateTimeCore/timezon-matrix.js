
var is24HourFormat = false;
var clockTimer = null;
var isCustomTimeActive = false;
var customTimeEpoch = 0;
var baseTimeZone = "Asia/Kolkata";

// Global Nations Database (200+ countries with primary IANA identifiers)
var GLOBAL_NATIONS_DB = [
    { tz: "Asia/Kabul", city: "Kabul", country: "Afghanistan", code: "AF" },
    { tz: "Europe/Tirane", city: "Tirana", country: "Albania", code: "AL" },
    { tz: "Africa/Algiers", city: "Algiers", country: "Algeria", code: "DZ" },
    { tz: "Europe/Andorra", city: "Andorra la Vella", country: "Andorra", code: "AD" },
    { tz: "Africa/Luanda", city: "Luanda", country: "Angola", code: "AO" },
    { tz: "America/Antigua", city: "St. John's", country: "Antigua and Barbuda", code: "AG" },
    { tz: "America/Argentina/Buenos_Aires", city: "Buenos Aires", country: "Argentina", code: "AR" },
    { tz: "Asia/Yerevan", city: "Yerevan", country: "Armenia", code: "AM" },
    { tz: "Australia/Sydney", city: "Sydney / Canberra", country: "Australia", code: "AU" },
    { tz: "Australia/Melbourne", city: "Melbourne", country: "Australia", code: "AU" },
    { tz: "Australia/Perth", city: "Perth", country: "Australia", code: "AU" },
    { tz: "Europe/Vienna", city: "Vienna", country: "Austria", code: "AT" },
    { tz: "Asia/Baku", city: "Baku", country: "Azerbaijan", code: "AZ" },
    { tz: "America/Nassau", city: "Nassau", country: "Bahamas", code: "BS" },
    { tz: "Asia/Bahrain", city: "Manama", country: "Bahrain", code: "BH" },
    { tz: "Asia/Dhaka", city: "Dhaka", country: "Bangladesh", code: "BD" },
    { tz: "America/Barbados", city: "Bridgetown", country: "Barbados", code: "BB" },
    { tz: "Europe/Minsk", city: "Minsk", country: "Belarus", code: "BY" },
    { tz: "Europe/Brussels", city: "Brussels", country: "Belgium", code: "BE" },
    { tz: "America/Belize", city: "Belmopan", country: "Belize", code: "BZ" },
    { tz: "Africa/Porto-Novo", city: "Porto-Novo", country: "Benin", code: "BJ" },
    { tz: "Asia/Thimphu", city: "Thimphu", country: "Bhutan", code: "BT" },
    { tz: "America/La_Paz", city: "La Paz / Sucre", country: "Bolivia", code: "BO" },
    { tz: "Europe/Sarajevo", city: "Sarajevo", country: "Bosnia and Herzegovina", code: "BA" },
    { tz: "Africa/Gaborone", city: "Gaborone", country: "Botswana", code: "BW" },
    { tz: "America/Sao_Paulo", city: "São Paulo / Brasília", country: "Brazil", code: "BR" },
    { tz: "Asia/Brunei", city: "Bandar Seri Begawan", country: "Brunei", code: "BN" },
    { tz: "Europe/Sofia", city: "Sofia", country: "Bulgaria", code: "BG" },
    { tz: "Africa/Ouagadougou", city: "Ouagadougou", country: "Burkina Faso", code: "BF" },
    { tz: "Africa/Bujumbura", city: "Gitega / Bujumbura", country: "Burundi", code: "BI" },
    { tz: "Asia/Phnom_Penh", city: "Phnom Penh", country: "Cambodia", code: "KH" },
    { tz: "Africa/Douala", city: "Yaoundé", country: "Cameroon", code: "CM" },
    { tz: "America/Toronto", city: "Toronto / Ottawa", country: "Canada", code: "CA" },
    { tz: "America/Vancouver", city: "Vancouver", country: "Canada", code: "CA" },
    { tz: "Atlantic/Cape_Verde", city: "Praia", country: "Cape Verde", code: "CV" },
    { tz: "Africa/Bangui", city: "Bangui", country: "Central African Republic", code: "CF" },
    { tz: "Africa/Ndjamena", city: "N'Djamena", country: "Chad", code: "TD" },
    { tz: "America/Santiago", city: "Santiago", country: "Chile", code: "CL" },
    { tz: "Asia/Shanghai", city: "Beijing / Shanghai", country: "China", code: "CN" },
    { tz: "America/Bogota", city: "Bogotá", country: "Colombia", code: "CO" },
    { tz: "Indian/Comoro", city: "Moroni", country: "Comoros", code: "KM" },
    { tz: "Africa/Brazzaville", city: "Brazzaville", country: "Congo", code: "CG" },
    { tz: "Africa/Kinshasa", city: "Kinshasa", country: "DR Congo", code: "CD" },
    { tz: "America/Costa_Rica", city: "San José", country: "Costa Rica", code: "CR" },
    { tz: "Europe/Zagreb", city: "Zagreb", country: "Croatia", code: "HR" },
    { tz: "America/Havana", city: "Havana", country: "Cuba", code: "CU" },
    { tz: "Asia/Nicosia", city: "Nicosia", country: "Cyprus", code: "CY" },
    { tz: "Europe/Prague", city: "Prague", country: "Czech Republic", code: "CZ" },
    { tz: "Europe/Copenhagen", city: "Copenhagen", country: "Denmark", code: "DK" },
    { tz: "Africa/Djibouti", city: "Djibouti", country: "Djibouti", code: "DJ" },
    { tz: "America/Dominica", city: "Roseau", country: "Dominica", code: "DM" },
    { tz: "America/Santo_Domingo", city: "Santo Domingo", country: "Dominican Republic", code: "DO" },
    { tz: "America/Guayaquil", city: "Quito", country: "Ecuador", code: "EC" },
    { tz: "Africa/Cairo", city: "Cairo", country: "Egypt", code: "EG" },
    { tz: "America/El_Salvador", city: "San Salvador", country: "El Salvador", code: "SV" },
    { tz: "Africa/Malabo", city: "Malabo", country: "Equatorial Guinea", code: "GQ" },
    { tz: "Africa/Asmara", city: "Asmara", country: "Eritrea", code: "ER" },
    { tz: "Europe/Tallinn", city: "Tallinn", country: "Estonia", code: "EE" },
    { tz: "Africa/Mbabane", city: "Mbabane", country: "Eswatini", code: "SZ" },
    { tz: "Africa/Addis_Ababa", city: "Addis Ababa", country: "Ethiopia", code: "ET" },
    { tz: "Pacific/Fiji", city: "Suva", country: "Fiji", code: "FJ" },
    { tz: "Europe/Helsinki", city: "Helsinki", country: "Finland", code: "FI" },
    { tz: "Europe/Paris", city: "Paris", country: "France", code: "FR" },
    { tz: "Africa/Libreville", city: "Libreville", country: "Gabon", code: "GA" },
    { tz: "Africa/Banjul", city: "Banjul", country: "Gambia", code: "GM" },
    { tz: "Asia/Tbilisi", city: "Tbilisi", country: "Georgia", code: "GE" },
    { tz: "Europe/Berlin", city: "Berlin / Frankfurt", country: "Germany", code: "DE" },
    { tz: "Africa/Accra", city: "Accra", country: "Ghana", code: "GH" },
    { tz: "Europe/Athens", city: "Athens", country: "Greece", code: "GR" },
    { tz: "America/Grenada", city: "St. George's", country: "Grenada", code: "GD" },
    { tz: "America/Guatemala", city: "Guatemala City", country: "Guatemala", code: "GT" },
    { tz: "Africa/Conakry", city: "Conakry", country: "Guinea", code: "GN" },
    { tz: "Africa/Bissau", city: "Bissau", country: "Guinea-Bissau", code: "GW" },
    { tz: "America/Guyana", city: "Georgetown", country: "Guyana", code: "GY" },
    { tz: "America/Port-au-Prince", city: "Port-au-Prince", country: "Haiti", code: "HT" },
    { tz: "America/Tegucigalpa", city: "Tegucigalpa", country: "Honduras", code: "HN" },
    { tz: "Asia/Hong_Kong", city: "Hong Kong", country: "Hong Kong", code: "HK" },
    { tz: "Europe/Budapest", city: "Budapest", country: "Hungary", code: "HU" },
    { tz: "Atlantic/Reykjavik", city: "Reykjavik", country: "Iceland", code: "IS" },
    { tz: "Asia/Kolkata", city: "New Delhi / Mumbai", country: "India", code: "IN" },
    { tz: "Asia/Jakarta", city: "Jakarta", country: "Indonesia", code: "ID" },
    { tz: "Asia/Tehran", city: "Tehran", country: "Iran", code: "IR" },
    { tz: "Asia/Baghdad", city: "Baghdad", country: "Iraq", code: "IQ" },
    { tz: "Europe/Dublin", city: "Dublin", country: "Ireland", code: "IE" },
    { tz: "Asia/Jerusalem", city: "Jerusalem / Tel Aviv", country: "Israel", code: "IL" },
    { tz: "Europe/Rome", city: "Rome / Milan", country: "Italy", code: "IT" },
    { tz: "America/Jamaica", city: "Kingston", country: "Jamaica", code: "JM" },
    { tz: "Asia/Tokyo", city: "Tokyo", country: "Japan", code: "JP" },
    { tz: "Asia/Amman", city: "Amman", country: "Jordan", code: "JO" },
    { tz: "Asia/Almaty", city: "Astana / Almaty", country: "Kazakhstan", code: "KZ" },
    { tz: "Africa/Nairobi", city: "Nairobi", country: "Kenya", code: "KE" },
    { tz: "Pacific/Tarawa", city: "Tarawa", country: "Kiribati", code: "KI" },
    { tz: "Asia/Pyongyang", city: "Pyongyang", country: "North Korea", code: "KP" },
    { tz: "Asia/Seoul", city: "Seoul", country: "South Korea", code: "KR" },
    { tz: "Asia/Kuwait", city: "Kuwait City", country: "Kuwait", code: "KW" },
    { tz: "Asia/Bishkek", city: "Bishkek", country: "Kyrgyzstan", code: "KG" },
    { tz: "Asia/Vientiane", city: "Vientiane", country: "Laos", code: "LA" },
    { tz: "Europe/Riga", city: "Riga", country: "Latvia", code: "LV" },
    { tz: "Asia/Beirut", city: "Beirut", country: "Lebanon", code: "LB" },
    { tz: "Africa/Maseru", city: "Maseru", country: "Lesotho", code: "LS" },
    { tz: "Africa/Monrovia", city: "Monrovia", country: "Liberia", code: "LR" },
    { tz: "Africa/Tripoli", city: "Tripoli", country: "Libya", code: "LY" },
    { tz: "Europe/Vaduz", city: "Vaduz", country: "Liechtenstein", code: "LI" },
    { tz: "Europe/Vilnius", city: "Vilnius", country: "Lithuania", code: "LT" },
    { tz: "Europe/Luxembourg", city: "Luxembourg City", country: "Luxembourg", code: "LU" },
    { tz: "Indian/Antananarivo", city: "Antananarivo", country: "Madagascar", code: "MG" },
    { tz: "Africa/Blantyre", city: "Lilongwe", country: "Malawi", code: "MW" },
    { tz: "Asia/Kuala_Lumpur", city: "Kuala Lumpur", country: "Malaysia", code: "MY" },
    { tz: "Indian/Maldives", city: "Malé", country: "Maldives", code: "MV" },
    { tz: "Africa/Bamako", city: "Bamako", country: "Mali", code: "ML" },
    { tz: "Europe/Malta", city: "Valletta", country: "Malta", code: "MT" },
    { tz: "Pacific/Majuro", city: "Majuro", country: "Marshall Islands", code: "MH" },
    { tz: "Africa/Nouakchott", city: "Nouakchott", country: "Mauritania", code: "MR" },
    { tz: "Indian/Mauritius", city: "Port Louis", country: "Mauritius", code: "MU" },
    { tz: "America/Mexico_City", city: "Mexico City", country: "Mexico", code: "MX" },
    { tz: "Pacific/Pohnpei", city: "Palikir", country: "Micronesia", code: "FM" },
    { tz: "Europe/Chisinau", city: "Chisinau", country: "Moldova", code: "MD" },
    { tz: "Europe/Monaco", city: "Monaco", country: "Monaco", code: "MC" },
    { tz: "Asia/Ulaanbaatar", city: "Ulaanbaatar", country: "Mongolia", code: "MN" },
    { tz: "Europe/Podgorica", city: "Podgorica", country: "Montenegro", code: "ME" },
    { tz: "Africa/Casablanca", city: "Rabat / Casablanca", country: "Morocco", code: "MA" },
    { tz: "Africa/Maputo", city: "Maputo", country: "Mozambique", code: "MZ" },
    { tz: "Asia/Yangon", city: "Naypyidaw / Yangon", country: "Myanmar", code: "MM" },
    { tz: "Africa/Windhoek", city: "Windhoek", country: "Namibia", code: "NA" },
    { tz: "Pacific/Nauru", city: "Yaren", country: "Nauru", code: "NR" },
    { tz: "Asia/Kathmandu", city: "Kathmandu", country: "Nepal", code: "NP" },
    { tz: "Europe/Amsterdam", city: "Amsterdam", country: "Netherlands", code: "NL" },
    { tz: "Pacific/Auckland", city: "Auckland / Wellington", country: "New Zealand", code: "NZ" },
    { tz: "America/Managua", city: "Managua", country: "Nicaragua", code: "NI" },
    { tz: "Africa/Niamey", city: "Niamey", country: "Niger", code: "NE" },
    { tz: "Africa/Lagos", city: "Lagos / Abuja", country: "Nigeria", code: "NG" },
    { tz: "Europe/Skopje", city: "Skopje", country: "North Macedonia", code: "MK" },
    { tz: "Europe/Oslo", city: "Oslo", country: "Norway", code: "NO" },
    { tz: "Asia/Muscat", city: "Muscat", country: "Oman", code: "OM" },
    { tz: "Asia/Karachi", city: "Karachi / Islamabad", country: "Pakistan", code: "PK" },
    { tz: "Pacific/Palau", city: "Ngerulmud", country: "Palau", code: "PW" },
    { tz: "Asia/Gaza", city: "Palestine", country: "Palestine", code: "PS" },
    { tz: "America/Panama", city: "Panama City", country: "Panama", code: "PA" },
    { tz: "Pacific/Port_Moresby", city: "Port Moresby", country: "Papua New Guinea", code: "PG" },
    { tz: "America/Asuncion", city: "Asunción", country: "Paraguay", code: "PY" },
    { tz: "America/Lima", city: "Lima", country: "Peru", code: "PE" },
    { tz: "Asia/Manila", city: "Manila", country: "Philippines", code: "PH" },
    { tz: "Europe/Warsaw", city: "Warsaw", country: "Poland", code: "PL" },
    { tz: "Europe/Lisbon", city: "Lisbon", country: "Portugal", code: "PT" },
    { tz: "Asia/Qatar", city: "Doha", country: "Qatar", code: "QA" },
    { tz: "Europe/Bucharest", city: "Bucharest", country: "Romania", code: "RO" },
    { tz: "Europe/Moscow", city: "Moscow", country: "Russia", code: "RU" },
    { tz: "Asia/Vladivostok", city: "Vladivostok", country: "Russia", code: "RU" },
    { tz: "Africa/Kigali", city: "Kigali", country: "Rwanda", code: "RW" },
    { tz: "America/St_Kitts", city: "Basseterre", country: "Saint Kitts and Nevis", code: "KN" },
    { tz: "America/St_Lucia", city: "Castries", country: "Saint Lucia", code: "LC" },
    { tz: "America/St_Vincent", city: "Kingstown", country: "Saint Vincent and the Grenadines", code: "VC" },
    { tz: "Pacific/Apia", city: "Apia", country: "Samoa", code: "WS" },
    { tz: "Europe/San_Marino", city: "San Marino", country: "San Marino", code: "SM" },
    { tz: "Africa/Sao_Tome", city: "São Tomé", country: "Sao Tome and Principe", code: "ST" },
    { tz: "Asia/Riyadh", city: "Riyadh", country: "Saudi Arabia", code: "SA" },
    { tz: "Africa/Dakar", city: "Dakar", country: "Senegal", code: "SN" },
    { tz: "Europe/Belgrade", city: "Belgrade", country: "Serbia", code: "RS" },
    { tz: "Indian/Seychelles", city: "Victoria", country: "Seychelles", code: "SC" },
    { tz: "Africa/Freetown", city: "Freetown", country: "Sierra Leone", code: "SL" },
    { tz: "Asia/Singapore", city: "Singapore", country: "Singapore", code: "SG" },
    { tz: "Europe/Bratislava", city: "Bratislava", country: "Slovakia", code: "SK" },
    { tz: "Europe/Ljubljana", city: "Ljubljana", country: "Slovenia", code: "SI" },
    { tz: "Pacific/Guadalcanal", city: "Honiara", country: "Solomon Islands", code: "SB" },
    { tz: "Africa/Mogadishu", city: "Mogadishu", country: "Somalia", code: "SO" },
    { tz: "Africa/Johannesburg", city: "Johannesburg / Cape Town", country: "South Africa", code: "ZA" },
    { tz: "Africa/Juba", city: "Juba", country: "South Sudan", code: "SS" },
    { tz: "Europe/Madrid", city: "Madrid / Barcelona", country: "Spain", code: "ES" },
    { tz: "Asia/Colombo", city: "Colombo", country: "Sri Lanka", code: "LK" },
    { tz: "Africa/Khartoum", city: "Khartoum", country: "Sudan", code: "SD" },
    { tz: "America/Paramaribo", city: "Paramaribo", country: "Suriname", code: "SR" },
    { tz: "Europe/Stockholm", city: "Stockholm", country: "Sweden", code: "SE" },
    { tz: "Europe/Zurich", city: "Zurich / Bern", country: "Switzerland", code: "CH" },
    { tz: "Asia/Damascus", city: "Damascus", country: "Syria", code: "SY" },
    { tz: "Asia/Taipei", city: "Taipei", country: "Taiwan", code: "TW" },
    { tz: "Asia/Dushanbe", city: "Dushanbe", country: "Tajikistan", code: "TJ" },
    { tz: "Africa/Dar_es_Salaam", city: "Dodoma", country: "Tanzania", code: "TZ" },
    { tz: "Asia/Bangkok", city: "Bangkok", country: "Thailand", code: "TH" },
    { tz: "Asia/Dili", city: "Dili", country: "Timor-Leste", code: "TL" },
    { tz: "Africa/Lome", city: "Lomé", country: "Togo", code: "TG" },
    { tz: "Pacific/Tongatapu", city: "Nukuʻalofa", country: "Tonga", code: "TO" },
    { tz: "America/Port_of_Spain", city: "Port of Spain", country: "Trinidad and Tobago", code: "TT" },
    { tz: "Africa/Tunis", city: "Tunis", country: "Tunisia", code: "TN" },
    { tz: "Europe/Istanbul", city: "Istanbul / Ankara", country: "Turkey", code: "TR" },
    { tz: "Asia/Ashgabat", city: "Ashgabat", country: "Turkmenistan", code: "TM" },
    { tz: "Pacific/Funafuti", city: "Funafuti", country: "Tuvalu", code: "TV" },
    { tz: "Africa/Kampala", city: "Kampala", country: "Uganda", code: "UG" },
    { tz: "Europe/Kyiv", city: "Kyiv", country: "Ukraine", code: "UA" },
    { tz: "Asia/Dubai", city: "Dubai / Abu Dhabi", country: "United Arab Emirates", code: "AE" },
    { tz: "Europe/London", city: "London", country: "United Kingdom", code: "GB" },
    { tz: "America/New_York", city: "New York", country: "United States", code: "US" },
    { tz: "America/Chicago", city: "Chicago", country: "United States", code: "US" },
    { tz: "America/Denver", city: "Denver", country: "United States", code: "US" },
    { tz: "America/Los_Angeles", city: "Los Angeles", country: "United States", code: "US" },
    { tz: "America/Anchorage", city: "Anchorage", country: "United States", code: "US" },
    { tz: "Pacific/Honolulu", city: "Honolulu", country: "United States", code: "US" },
    { tz: "America/Montevideo", city: "Montevideo", country: "Uruguay", code: "UY" },
    { tz: "Asia/Tashkent", city: "Tashkent", country: "Uzbekistan", code: "UZ" },
    { tz: "Pacific/Efate", city: "Port Vila", country: "Vanuatu", code: "VU" },
    { tz: "Europe/Vatican", city: "Vatican City", country: "Vatican City", code: "VA" },
    { tz: "America/Caracas", city: "Caracas", country: "Venezuela", code: "VE" },
    { tz: "Asia/Ho_Chi_Minh", city: "Hanoi / Ho Chi Minh", country: "Vietnam", code: "VN" },
    { tz: "Asia/Aden", city: "Sana'a / Aden", country: "Yemen", code: "YE" },
    { tz: "Africa/Lusaka", city: "Lusaka", country: "Zambia", code: "ZM" },
    { tz: "Africa/Harare", city: "Harare", country: "Zimbabwe", code: "ZW" }
];

// Active Staged Clocks
var activeClocks = [
    { tz: "Asia/Kolkata", city: "New Delhi / Mumbai", country: "India", code: "IN", isHome: true },
    { tz: "America/New_York", city: "New York", country: "United States", code: "US" },
    { tz: "America/Los_Angeles", city: "Los Angeles", country: "United States", code: "US" },
    { tz: "Europe/London", city: "London", country: "United Kingdom", code: "GB" },
    { tz: "Asia/Dubai", city: "Dubai / Abu Dhabi", country: "United Arab Emirates", code: "AE" },
    { tz: "Asia/Tokyo", city: "Tokyo", country: "Japan", code: "JP" }
];

document.addEventListener('DOMContentLoaded', function() {
    populateAllNationsDropdown(GLOBAL_NATIONS_DB);
    populateBaseZonesDropdown();
    initCustomTimeDefaults();
    renderClockCards();
    startMasterClockLoop();
});

function populateAllNationsDropdown(list) {
    var select = document.getElementById('sel-add-timezone');
    var counter = document.getElementById('nations-total-counter');
    if (!select) return;

    select.innerHTML = '';
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var opt = document.createElement('option');
        opt.value = item.tz + "|" + item.city + "|" + item.country + "|" + item.code;
        opt.textContent = item.country + " - " + item.city + " (" + item.tz + ")";
        select.appendChild(opt);
    }

    if (counter) {
        counter.innerText = list.length + " Countries Available";
    }
}

function populateBaseZonesDropdown() {
    var select = document.getElementById('sel-base-timezone');
    if (!select) return;

    select.innerHTML = '';
    for (var i = 0; i < GLOBAL_NATIONS_DB.length; i++) {
        var item = GLOBAL_NATIONS_DB[i];
        var opt = document.createElement('option');
        opt.value = item.tz;
        opt.textContent = item.country + " - " + item.city + " (" + item.tz + ")";
        if (item.tz === baseTimeZone) {
            opt.selected = true;
        }
        select.appendChild(opt);
    }
}

function filterNationsDropdown() {
    var query = document.getElementById('inp-search-country').value.toLowerCase().trim();
    if (!query) {
        populateAllNationsDropdown(GLOBAL_NATIONS_DB);
        return;
    }

    var filtered = GLOBAL_NATIONS_DB.filter(function(item) {
        return item.country.toLowerCase().includes(query) || 
                item.city.toLowerCase().includes(query) || 
                item.tz.toLowerCase().includes(query) || 
                item.code.toLowerCase().includes(query);
    });

    populateAllNationsDropdown(filtered);
}

function initCustomTimeDefaults() {
    var now = new Date();
    var dInput = document.getElementById('inp-custom-date');
    var tInput = document.getElementById('inp-custom-time');

    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    if (dInput) dInput.value = year + '-' + month + '-' + day;

    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    if (tInput) tInput.value = hours + ':' + minutes + ':' + seconds;
}

function handleBaseZoneChange() {
    var sel = document.getElementById('sel-base-timezone');
    if (sel) {
        baseTimeZone = sel.value;
        var baseObj = GLOBAL_NATIONS_DB.find(function(c) { return c.tz === baseTimeZone; });
        var baseName = baseObj ? baseObj.country + " (" + baseObj.city + ")" : baseTimeZone;
        document.getElementById('master-base-name').innerText = "Base: " + baseName;
        document.getElementById('telemetry-base-zone').innerText = baseTimeZone;
        
        for (var i = 0; i < activeClocks.length; i++) {
            activeClocks[i].isHome = (activeClocks[i].tz === baseTimeZone);
        }
        
        if (isCustomTimeActive) {
            handleCustomDateTimeChange();
        }

        renderClockCards();
        updateClockValues();
    }
}

// Exact IANA UTC Offset helper: extracts precise GMT offset minutes for any timezone on any date
function getIANATimeZoneOffsetMinutes(timeZone, targetDate) {
    var formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        timeZoneName: 'longOffset',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    var parts = formatter.formatToParts(targetDate);
    var offsetString = "GMT+00:00";
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].type === 'timeZoneName') {
            offsetString = parts[i].value;
            break;
        }
    }

    var match = offsetString.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    if (!match) return 0;

    var sign = match[1] === '+' ? 1 : -1;
    var hours = parseInt(match[2], 10) || 0;
    var minutes = parseInt(match[3], 10) || 0;

    return sign * (hours * 60 + minutes);
}

// Custom Time Engine: Calculates exact epoch from selected Base Timezone + Entered Date/Time
function handleCustomDateTimeChange() {
    var dVal = document.getElementById('inp-custom-date').value;
    var tVal = document.getElementById('inp-custom-time').value;

    if (!dVal || !tVal) return;

    isCustomTimeActive = true;

    var timeParts = tVal.split(':');
    var h = parseInt(timeParts[0], 10) || 0;
    var m = parseInt(timeParts[1], 10) || 0;
    var s = parseInt(timeParts[2], 10) || 0;

    var dParts = dVal.split('-');
    var year = parseInt(dParts[0], 10);
    var month = parseInt(dParts[1], 10) - 1;
    var day = parseInt(dParts[2], 10);

    var naiveUTC = new Date(Date.UTC(year, month, day, h, m, s));
    var baseOffsetMinutes = getIANATimeZoneOffsetMinutes(baseTimeZone, naiveUTC);

    customTimeEpoch = naiveUTC.getTime() - (baseOffsetMinutes * 60000);

    var statusStrip = document.getElementById('calculator-status-strip');
    if (statusStrip) {
        statusStrip.className = "text-[9px] font-mono text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 flex items-center justify-between";
        statusStrip.innerHTML = '<span>Status: Custom Calculated Timeline Active</span><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>';
    }

    updateClockValues();
}

function resetCustomTimeCalculatorToNow() {
    isCustomTimeActive = false;
    initCustomTimeDefaults();

    var statusStrip = document.getElementById('calculator-status-strip');
    if (statusStrip) {
        statusStrip.className = "text-[9px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 flex items-center justify-between";
        statusStrip.innerHTML = '<span>Status: Real-Time Live Clock</span><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>';
    }

    updateClockValues();
}

function setTimeNotation(fmt) {
    is24HourFormat = (fmt === 24);
    var b12 = document.getElementById('btn-fmt-12');
    var b24 = document.getElementById('btn-fmt-24');
    if (is24HourFormat) {
        b24.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-cyan-500 text-slate-950 shadow-md transition-all cursor-pointer";
        b12.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer";
    } else {
        b12.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-cyan-500 text-slate-950 shadow-md transition-all cursor-pointer";
        b24.className = "py-2 text-[10px] font-mono font-bold uppercase rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer";
    }
    updateClockValues();
}

function handleTimeShiftSlider(val) {
    var shiftHours = parseInt(val, 10);
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    
    document.getElementById('inp-custom-date').value = year + '-' + month + '-' + day;
    document.getElementById('inp-custom-time').value = String(shiftHours).padStart(2, '0') + ":00:00";
    
    var suffix = shiftHours >= 12 ? 'PM' : 'AM';
    var displayH = shiftHours % 12 || 12;
    document.getElementById('lbl-shift-hour').innerText = (is24HourFormat ? String(shiftHours).padStart(2, '0') + ":00" : displayH + ":00 " + suffix) + " (Simulated)";
    
    handleCustomDateTimeChange();
}

function addSelectedCity() {
    var sel = document.getElementById('sel-add-timezone');
    if (!sel || !sel.value) return;
    var parts = sel.value.split('|');
    var tz = parts[0];
    var city = parts[1];
    var country = parts[2];
    var code = parts[3];

    var exists = activeClocks.some(function(c) { return c.tz === tz && c.city === city; });
    if (!exists) {
        activeClocks.push({ tz: tz, city: city, country: country, code: code, isHome: (tz === baseTimeZone) });
        renderClockCards();
        updateClockValues();
    }
}

function removeCityClock(index) {
    activeClocks.splice(index, 1);
    renderClockCards();
    updateClockValues();
}

function clearNonDefaultClocks() {
    activeClocks = [
        { tz: "Asia/Kolkata", city: "New Delhi / Mumbai", country: "India", code: "IN", isHome: true },
        { tz: "America/New_York", city: "New York", country: "United States", code: "US" },
        { tz: "Europe/London", city: "London", country: "United Kingdom", code: "GB" }
    ];
    baseTimeZone = "Asia/Kolkata";
    populateBaseZonesDropdown();
    renderClockCards();
    updateClockValues();
}

function loadRegionalPreset(type) {
    if (type === 'tech') {
        activeClocks = [
            { tz: "Asia/Kolkata", city: "Bengaluru", country: "India", code: "IN", isHome: true },
            { tz: "America/Los_Angeles", city: "San Francisco", country: "United States", code: "US" },
            { tz: "America/New_York", city: "New York", country: "United States", code: "US" },
            { tz: "Europe/Berlin", city: "Berlin", country: "Germany", code: "DE" },
            { tz: "Asia/Singapore", city: "Singapore", country: "Singapore", code: "SG" },
            { tz: "Asia/Tokyo", city: "Tokyo", country: "Japan", code: "JP" }
        ];
    } else if (type === 'finance') {
        activeClocks = [
            { tz: "Europe/London", city: "London", country: "United Kingdom", code: "GB" },
            { tz: "America/New_York", city: "New York (Wall St)", country: "United States", code: "US" },
            { tz: "Asia/Hong_Kong", city: "Hong Kong", country: "Hong Kong", code: "HK" },
            { tz: "Asia/Tokyo", city: "Tokyo", country: "Japan", code: "JP" },
            { tz: "Asia/Singapore", city: "Singapore", country: "Singapore", code: "SG" },
            { tz: "Asia/Dubai", city: "Dubai", country: "United Arab Emirates", code: "AE" }
        ];
    } else if (type === 'asia') {
        activeClocks = [
            { tz: "Asia/Kolkata", city: "Mumbai", country: "India", code: "IN", isHome: true },
            { tz: "Asia/Dubai", city: "Dubai", country: "UAE", code: "AE" },
            { tz: "Asia/Bangkok", city: "Bangkok", country: "Thailand", code: "TH" },
            { tz: "Asia/Singapore", city: "Singapore", country: "Singapore", code: "SG" },
            { tz: "Asia/Tokyo", city: "Tokyo", country: "Japan", code: "JP" },
            { tz: "Australia/Sydney", city: "Sydney", country: "Australia", code: "AU" }
        ];
    }
    renderClockCards();
    updateClockValues();
}

function renderClockCards() {
    var container = document.getElementById('city-clocks-container');
    var countBadge = document.getElementById('grid-count-badge');
    if (countBadge) countBadge.innerText = activeClocks.length + " Active Zones";
    if (!container) return;

    container.innerHTML = '';

    for (var i = 0; i < activeClocks.length; i++) {
        var c = activeClocks[i];
        var card = document.createElement('div');
        card.id = 'clock-card-' + i;
        card.className = "clock-card bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-3 relative";

        card.innerHTML = 
            '<div class="flex items-start justify-between">' +
                '<div class="flex flex-col overflow-hidden">' +
                    '<div class="flex items-center gap-1.5">' +
                        '<span class="text-xs font-bold text-white tracking-tight truncate">' + c.city + '</span>' +
                        (c.isHome ? '<span class="text-[8px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">BASE ORIGIN</span>' : '') +
                    '</div>' +
                    '<span class="text-[9px] font-mono text-slate-500 truncate">' + c.country + ' (' + c.code + ')</span>' +
                '</div>' +
                '<div class="flex items-center gap-1 shrink-0">' +
                    '<span id="ahead-badge-' + i + '" class="text-[8px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400">OFFSET</span>' +
                    (!c.isHome ? '<button type="button" onclick="removeCityClock(' + i + ')" class="text-slate-600 hover:text-red-400 text-xs px-1 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>' : '') +
                '</div>' +
            '</div>' +
            '<div class="flex items-baseline justify-between pt-1 border-t border-slate-950">' +
                '<span id="clock-time-' + i + '" class="text-lg sm:text-xl font-extrabold font-mono text-cyan-300">--:--:--</span>' +
                '<span id="clock-offset-' + i + '" class="text-[9px] font-mono text-slate-500">UTC+0</span>' +
            '</div>' +
            '<div class="flex items-center justify-between text-[9px] font-mono text-slate-400 bg-slate-950/40 px-2 py-1 rounded-lg border border-slate-900">' +
                '<span id="clock-date-' + i + '">Loading date...</span>' +
                '<span id="clock-daynight-' + i + '"><i class="fa-solid fa-sun text-amber-400"></i></span>' +
            '</div>';

        container.appendChild(card);
    }
}

function startMasterClockLoop() {
    if (clockTimer) clearInterval(clockTimer);
    updateClockValues();
    clockTimer = setInterval(function() {
        updateClockValues();
    }, 1000);
}

function getCurrentEvaluationDate() {
    if (isCustomTimeActive) {
        return new Date(customTimeEpoch);
    }
    return new Date();
}

// Calculates Ahead / Behind Time Difference between Target Zone & Base Zone
function calculateAheadBehindDifference(targetTz, baseTz, dateObj) {
    var targetOffset = getIANATimeZoneOffsetMinutes(targetTz, dateObj);
    var baseOffset = getIANATimeZoneOffsetMinutes(baseTz, dateObj);

    var diffMinutes = targetOffset - baseOffset;

    if (diffMinutes === 0) {
        return { text: "Same Time", type: "same" };
    }

    var isAhead = diffMinutes > 0;
    var absMinutes = Math.abs(diffMinutes);
    var hours = Math.floor(absMinutes / 60);
    var mins = absMinutes % 60;

    var str = (isAhead ? "+" : "-") + (hours > 0 ? hours + "h " : "") + (mins > 0 ? mins + "m" : "");
    str += isAhead ? " Ahead" : " Behind";

    return { text: str.trim(), type: isAhead ? "ahead" : "behind" };
}

// Calculates how much the Custom Entered Time is Ahead / Behind real Live Clock
function calculateCustomVsLiveDelta(customEpoch) {
    var liveNow = Date.now();
    var diffMs = customEpoch - liveNow;
    var absMs = Math.abs(diffMs);

    if (absMs < 2000) {
        return { text: "Synchronized (Live ±0s)", type: "sync" };
    }

    var isAhead = diffMs > 0;
    var totalSeconds = Math.floor(absMs / 1000);
    var totalMinutes = Math.floor(totalSeconds / 60);
    var totalHours = Math.floor(totalMinutes / 60);
    var totalDays = Math.floor(totalHours / 24);

    var remHours = totalHours % 24;
    var remMinutes = totalMinutes % 60;
    var remSeconds = totalSeconds % 60;

    var parts = [];
    if (totalDays > 0) parts.push(totalDays + "d");
    if (remHours > 0) parts.push(remHours + "h");
    if (remMinutes > 0) parts.push(remMinutes + "m");
    if (totalDays === 0 && remHours === 0) parts.push(remSeconds + "s");

    var resultStr = (isAhead ? "+" : "-") + parts.join(" ") + (isAhead ? " Ahead of Live" : " Behind Live");
    return { text: resultStr, type: isAhead ? "ahead" : "behind" };
}

function updateClockValues() {
    var now = getCurrentEvaluationDate();
    var realLiveNow = new Date();

    // Master Base Clock Output
    var baseTimeStr = now.toLocaleTimeString('en-US', {
        timeZone: baseTimeZone,
        hour12: !is24HourFormat,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    var baseDateStr = now.toLocaleDateString('en-US', {
        timeZone: baseTimeZone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    var utcTimeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: !is24HourFormat,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    var masterBaseElem = document.getElementById('master-base-time-str');
    var masterUtcDate = document.getElementById('master-utc-full-date');
    var masterUtcPill = document.getElementById('master-utc-pill');
    var badgeUtc = document.getElementById('badge-utc-clock');
    
    if (masterBaseElem) masterBaseElem.innerText = baseTimeStr;
    if (masterUtcDate) masterUtcDate.innerText = baseDateStr;
    if (masterUtcPill) masterUtcPill.innerText = "UTC " + utcTimeStr;
    if (badgeUtc) badgeUtc.innerText = utcTimeStr + " UTC";

    // Live vs Custom Time Delta Telemetry Calculation
    var deltaBadge = document.getElementById('delta-live-diff-badge');
    var deltaLiveRef = document.getElementById('delta-live-clock-ref');
    var deltaCustomRef = document.getElementById('delta-custom-clock-ref');

    if (deltaBadge && deltaLiveRef && deltaCustomRef) {
        var liveBaseStr = realLiveNow.toLocaleTimeString('en-US', { timeZone: baseTimeZone, hour12: !is24HourFormat, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        deltaLiveRef.innerText = "Live: " + liveBaseStr;
        deltaCustomRef.innerText = "Target: " + baseTimeStr;

        if (isCustomTimeActive) {
            var deltaObj = calculateCustomVsLiveDelta(customTimeEpoch);
            if (deltaObj.type === 'ahead') {
                deltaBadge.className = "font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                deltaBadge.innerText = deltaObj.text;
            } else if (deltaObj.type === 'behind') {
                deltaBadge.className = "font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20";
                deltaBadge.innerText = deltaObj.text;
            } else {
                deltaBadge.className = "font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20";
                deltaBadge.innerText = deltaObj.text;
            }
        } else {
            deltaBadge.className = "font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20";
            deltaBadge.innerText = "Synchronized (Live 0s)";
        }
    }

    // Day Fraction
    var dayFraction = ((now.getUTCHours() * 60 + now.getUTCMinutes()) / 1440 * 100).toFixed(1);
    var tf = document.getElementById('telemetry-day-fraction');
    if (tf) tf.innerText = dayFraction + "%";

    // Update each city card
    for (var i = 0; i < activeClocks.length; i++) {
        var c = activeClocks[i];
        var timeElem = document.getElementById('clock-time-' + i);
        var dateElem = document.getElementById('clock-date-' + i);
        var offsetElem = document.getElementById('clock-offset-' + i);
        var aheadBadge = document.getElementById('ahead-badge-' + i);
        var dayNightElem = document.getElementById('clock-daynight-' + i);

        try {
            var cityTimeStr = now.toLocaleTimeString('en-US', {
                timeZone: c.tz,
                hour12: !is24HourFormat,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            var cityDateStr = now.toLocaleDateString('en-US', {
                timeZone: c.tz,
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            var cityHour24 = parseInt(now.toLocaleTimeString('en-US', {
                timeZone: c.tz,
                hour12: false,
                hour: '2-digit'
            }), 10);

            if (timeElem) timeElem.innerText = cityTimeStr;
            if (dateElem) dateElem.innerText = cityDateStr;

            // Ahead / Behind relative badge calculation
            if (aheadBadge) {
                var diffObj = calculateAheadBehindDifference(c.tz, baseTimeZone, now);
                if (diffObj.type === 'ahead') {
                    aheadBadge.className = "text-[8px] font-mono px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    aheadBadge.innerText = diffObj.text;
                } else if (diffObj.type === 'behind') {
                    aheadBadge.className = "text-[8px] font-mono px-1.5 py-0.5 rounded font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20";
                    aheadBadge.innerText = diffObj.text;
                } else {
                    aheadBadge.className = "text-[8px] font-mono px-1.5 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
                    aheadBadge.innerText = "BASE TIME";
                }
            }

            // Day vs Night Icon
            if (dayNightElem) {
                if (cityHour24 >= 6 && cityHour24 < 18) {
                    dayNightElem.innerHTML = '<i class="fa-solid fa-sun text-amber-400"></i> Day';
                } else {
                    dayNightElem.innerHTML = '<i class="fa-solid fa-moon text-cyan-300"></i> Night';
                }
            }

            // Offset relative to UTC
            if (offsetElem) {
                var tzParts = new Intl.DateTimeFormat('en-US', { timeZone: c.tz, timeZoneName: 'shortOffset' }).formatToParts(now);
                var tzOffsetStr = "UTC";
                for (var p = 0; p < tzParts.length; p++) {
                    if (tzParts[p].type === 'timeZoneName') {
                        tzOffsetStr = tzParts[p].value;
                        break;
                    }
                }
                offsetElem.innerText = tzOffsetStr;
            }

        } catch(e) {
            if (timeElem) timeElem.innerText = "N/A";
        }
    }
}

function copyAllTimeZonesSnapshot() {
    var now = getCurrentEvaluationDate();
    var report = "=== FUSIONMINT WORLD TIME MATRIX SNAPSHOT ===\n";
    report += "Base Reference: " + baseTimeZone + "\n";
    report += "Evaluation Time: " + now.toUTCString() + "\n\n";

    for (var i = 0; i < activeClocks.length; i++) {
        var c = activeClocks[i];
        var t = now.toLocaleTimeString('en-US', { timeZone: c.tz, hour12: !is24HourFormat });
        var d = now.toLocaleDateString('en-US', { timeZone: c.tz });
        var diff = calculateAheadBehindDifference(c.tz, baseTimeZone, now).text;
        report += c.country + " (" + c.city + "): " + t + " | " + d + " [" + diff + "]\n";
    }

    navigator.clipboard.writeText(report).then(function() {
        alert("World Time Zone comparative report copied to clipboard!");
    });
}