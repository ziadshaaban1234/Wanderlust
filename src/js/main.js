var API_KEYS = {
    ticketmaster: "HAQMhqKNdItJ65CDbAeIMwfaUwbDQd5h",
    exchangeRate: "146aff712470093094a47a25"
};

var API_URLS = {
    nagerDate: "https://date.nager.at/api/v3",
    openMeteo: "https://api.open-meteo.com/v1",
    ticketmaster: "https://app.ticketmaster.com/discovery/v2",
    exchangeRate: "https://v6.exchangerate-api.com/v6",
    restCountries: "https://restcountries.com/v3.1",
    sunriseSunset: "https://api.sunrise-sunset.org",
    flagCdn: "https://flagcdn.com"
};

var appState = {
    countries: [],
    selectedCountry: null,
    selectedCity: "",
    selectedYear: 2026,
    countryDetails: null,
    holidays: [],
    longWeekends: [],
    events: [],
    weather: null,
    sunTimes: null,
    exchangeRates: null,
    savedPlans: [],
    currentTimezone: "UTC",
    currentUtcOffset: 0
};

// for live clock
var countryClockInterval = null;

var currencyNames = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    EGP: "Egyptian Pound",
    AED: "UAE Dirham",
    SAR: "Saudi Riyal",
    JPY: "Japanese Yen",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
    INR: "Indian Rupee",
    CNY: "Chinese Yuan",
    CHF: "Swiss Franc",
    KWD: "Kuwaiti Dinar",
    QAR: "Qatari Riyal",
    BHD: "Bahraini Dinar",
    OMR: "Omani Rial",
    JOD: "Jordanian Dinar",
    LBP: "Lebanese Pound",
    MAD: "Moroccan Dirham",
    TRY: "Turkish Lira"
};

var weatherCodes = {
    0: { description: "Clear sky", icon: "fa-sun" },
    1: { description: "Mainly clear", icon: "fa-sun" },
    2: { description: "Partly cloudy", icon: "fa-cloud-sun" },
    3: { description: "Overcast", icon: "fa-cloud" },
    45: { description: "Foggy", icon: "fa-smog" },
    48: { description: "Depositing rime fog", icon: "fa-smog" },
    51: { description: "Light drizzle", icon: "fa-cloud-rain" },
    53: { description: "Moderate drizzle", icon: "fa-cloud-rain" },
    55: { description: "Dense drizzle", icon: "fa-cloud-rain" },
    61: { description: "Slight rain", icon: "fa-cloud-rain" },
    63: { description: "Moderate rain", icon: "fa-cloud-showers-heavy" },
    65: { description: "Heavy rain", icon: "fa-cloud-showers-heavy" },
    71: { description: "Slight snow", icon: "fa-snowflake" },
    73: { description: "Moderate snow", icon: "fa-snowflake" },
    75: { description: "Heavy snow", icon: "fa-snowflake" },
    80: { description: "Slight rain showers", icon: "fa-cloud-sun-rain" },
    81: { description: "Moderate rain showers", icon: "fa-cloud-sun-rain" },
    82: { description: "Violent rain showers", icon: "fa-cloud-showers-heavy" },
    95: { description: "Thunderstorm", icon: "fa-bolt" },
    96: { description: "Thunderstorm with hail", icon: "fa-bolt" },
    99: { description: "Thunderstorm with heavy hail", icon: "fa-bolt" }
};


function getWeatherTheme(weatherCode) {

    if (weatherCode === 0 || weatherCode === 1) {
        return "weather-sunny";
    }

    if (weatherCode === 2 || weatherCode === 3) {
        return "weather-cloudy";
    }

    if (weatherCode === 45 || weatherCode === 48) {
        return "weather-foggy";
    }

    if (weatherCode >= 51 && weatherCode <= 82) {
        return "weather-rainy";
    }

    if (weatherCode >= 71 && weatherCode <= 75) {
        return "weather-snowy";
    }

    if (weatherCode >= 95) {
        return "weather-stormy";
    }

    return "weather-default";
}


var citiesByCountry = {
    EG: ["Cairo", "Alexandria", "Giza"],
    SA: ["Riyadh", "Jeddah", "Mecca"],
    AE: ["Dubai", "Abu Dhabi", "Sharjah"],
    US: ["New York", "Los Angeles", "Chicago"],
    FR: ["Paris", "Lyon", "Marseille"],
    DE: ["Berlin", "Munich", "Hamburg"],
    IT: ["Rome", "Milan", "Venice"],
    ES: ["Madrid", "Barcelona", "Valencia"],
    TR: ["Istanbul", "Ankara", "Izmir"]
};

function showLoading(message) {
    var overlay = document.getElementById("loading-overlay");
    var text = document.getElementById("loading-text");
    if (overlay) {
        overlay.classList.remove("hidden");
        if (text && message) {
            text.textContent = message;
        }
    }
}

function hideLoading() {
    var overlay = document.getElementById("loading-overlay");
    if (overlay) {
        overlay.classList.add("hidden");
    }
}

function showToast(message, type) {
    var container = document.getElementById("toast-container");
    if (!container) return;

    var toast = document.createElement("div");
    toast.className = "toast " + (type || "info");
    toast.innerHTML = '<i class="fa-solid ' + getToastIcon(type) + '"></i><span>' + message + '</span>';

    container.appendChild(toast);

    setTimeout(function () {
        toast.remove();
    }, 3000);
}

function getToastIcon(type) {
    if (type === "success") return "fa-check-circle";
    if (type === "error") return "fa-times-circle";
    if (type === "warning") return "fa-exclamation-triangle";
    return "fa-info-circle";
}

function formatNumber(num) {
    if (!num) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    var date = new Date(dateString);
    var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

function formatShortDate(dateString) {
    var date = new Date(dateString);
    var options = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

function getDayName(dateString) {
    var date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getFlagUrl(countryCode, size) {
    if (!countryCode) return "";
    var s = size || 40;
    return API_URLS.flagCdn + "/w" + s + "/" + countryCode.toLowerCase() + ".png";
}

function updateDateTime() {
    var element = document.getElementById("current-datetime");
    if (element) {
        var now = new Date();
        var options = { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
        element.textContent = now.toLocaleDateString("en-US", options);
    }
}

function updatePlansCount() {
    var badge = document.getElementById("plans-count");
    var statSaved = document.getElementById("stat-saved");
    var count = appState.savedPlans.length;

    if (badge) {
        badge.textContent = count;
        if (count > 0) {
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    }

    if (statSaved) {
        statSaved.textContent = count;
    }
}


function loadPlansFromStorage() {
    try {
        var saved = localStorage.getItem("wanderlust_plans");
        if (saved) {
            appState.savedPlans = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Error loading plans:", e);
        appState.savedPlans = [];
    }
}

function savePlansToStorage() {
    try {
        localStorage.setItem("wanderlust_plans", JSON.stringify(appState.savedPlans));
        updatePlansCount();
    } catch (e) {
        console.error("Error saving plans:", e);
    }
}

function addToPlan(item) {
    // Check if already exists
    var exists = appState.savedPlans.some(function (plan) {
        return plan.id === item.id && plan.type === item.type;
    });

    if (exists) {
        showToast("Already saved to your plans!", "warning");
        return false;
    }

    item.savedAt = new Date().toISOString();
    appState.savedPlans.push(item);
    savePlansToStorage();
    renderMyPlans();
    showToast("Added to your plans!", "success");
    return true;
}

function removeFromPlan(id, type, callback) {

    Swal.fire({
        title: "Remove this plan?",
        text: "This will delete it from your saved plans.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove it",
        cancelButtonText: "Cancel"
    }).then(function (result) {

        if (result.isConfirmed) {

            appState.savedPlans = appState.savedPlans.filter(function (plan) {
                return !(plan.id === id && plan.type === type);
            });

            savePlansToStorage();
            renderMyPlans();

            if (callback) callback();
            Swal.fire({
                title: "Removed!",
                text: "Plan removed successfully.",
                icon: "success",
                timer: 1400,
                showConfirmButton: false
            });
        }

    });
}


function clearAllPlans() {

    Swal.fire({
        title: "Clear All Plans?",
        text: "This will remove all your saved plans. This cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, clear all!"
    }).then(function (result) {

        if (result.isConfirmed) {

            appState.savedPlans = [];
            savePlansToStorage();

            renderMyPlans();

            Swal.fire({
                title: "Cleared!",
                text: "All plans removed successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
        }

    });
}


function navigateToView(viewName) {
    var newUrl = "#/" + viewName;

    if (viewName === "dashboard") {
        newUrl = "#/";
    }

    window.location.hash = newUrl;

    showView(viewName);
}


function showView(viewName) {
    // Hide all views
    var views = document.querySelectorAll(".view");
    views.forEach(function (view) {
        view.classList.remove("active");
    });

    // Show selected view
    var targetView = document.getElementById(viewName + "-view");
    if (targetView) {
        targetView.classList.add("active");
    }

    // Update nav items
    var navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(function (item) {
        item.classList.remove("active");
        if (item.getAttribute("data-view") === viewName) {
            item.classList.add("active");
        }
    });


    updatePageTitle(viewName);


    loadViewData(viewName);
}

function updatePageTitle(viewName) {
    var titles = {
        "dashboard": { title: "Dashboard", subtitle: "Welcome back! Ready to plan your next adventure?" },
        "holidays": { title: "Public Holidays", subtitle: "Browse public holidays and plan your trips" },
        "events": { title: "Events Explorer", subtitle: "Discover concerts, sports, and more" },
        "weather": { title: "Weather Forecast", subtitle: "Check 7-day weather forecasts" },
        "long-weekends": { title: "Long Weekends", subtitle: "Find holidays near weekends" },
        "currency": { title: "Currency Converter", subtitle: "Convert between currencies" },
        "sun-times": { title: "Sun Times", subtitle: "Plan around sunrise and sunset" },
        "my-plans": { title: "My Saved Plans", subtitle: "Your saved holidays, events, and trip ideas" }
    };

    var titleEl = document.getElementById("page-title");
    var subtitleEl = document.getElementById("page-subtitle");
    var info = titles[viewName] || titles["dashboard"];

    if (titleEl) titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle;
}

function loadViewData(viewName) {
    if (
        !appState.selectedCountry &&
        viewName !== "dashboard" &&
        viewName !== "currency" &&
        viewName !== "my-plans"
    ) {
        showToast("Please select a country first!", "warning");

        if (viewName === "holidays") renderHolidays();
        if (viewName === "events") renderEvents();
        if (viewName === "weather") {
            document.getElementById("weather-content").innerHTML = `
            <div class="empty-state demo-empty">
                <div class="empty-icon weather-demo-icon">
                    <div class="sun"></div>
                    <div class="cloud"></div>
                </div>
                <h3>No Country Selected</h3>
                <p>Select a country from dashboard to view weather</p>
                <button class="btn btn-primary go-dashboard-btn">
                    <i class="fa-solid fa-globe"></i>
                    Go to Dashboard
                </button>
            </div>
        `;
            setupGoDashboardButtons();
        }

        if (viewName === "long-weekends") renderLongWeekends();

        return;
    }


    switch (viewName) {
        case "dashboard":
            break;

        case "holidays":
            loadHolidays();
            break;

        case "events":
            loadEvents();
            break;

        case "weather":
            loadWeather();
            break;

        case "long-weekends":
            loadLongWeekends();
            break;

        case "currency":
            if (appState.countryDetails?.currencies) {
                var code = Object.keys(appState.countryDetails.currencies)[0];
                loadCurrencyRates(code);
            } else {
                loadCurrencyRates("USD");
            }
            break;

        case "sun-times":
            loadSunTimes();
            break;

        case "my-plans":
            renderMyPlans();
            break;
    }
}

function handlePopState() {

    var hash = window.location.hash;
    var viewName = hash.replace("#/", "") || "dashboard";

    showView(viewName);
}


// Fetch countries
async function fetchCountries() {
    try {
        var response = await fetch(API_URLS.nagerDate + "/AvailableCountries", {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch countries");

        var data = await response.json();
        appState.countries = data;
        return data;
    } catch (error) {
        console.error("Error fetching countries:", error);
        showToast("Failed to load countries", "error");
        return [];
    }
}

// Fetch country details 
async function fetchCountryDetails(countryCode) {
    try {
        var response = await fetch(API_URLS.restCountries + "/alpha/" + countryCode, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch country details");

        var data = await response.json();
        // API returns array, get first item
        appState.countryDetails = Array.isArray(data) ? data[0] : data;
        return appState.countryDetails;
    } catch (error) {
        console.error("Error fetching country details:", error);
        showToast("Failed to load country details", "error");
        return null;
    }
}

// Fetch holidays
async function fetchHolidays(year, countryCode) {
    try {
        var url = API_URLS.nagerDate + "/PublicHolidays/" + year + "/" + countryCode;
        var response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch holidays");

        var data = await response.json();
        appState.holidays = data;
        return data;
    } catch (error) {
        console.error("Error fetching holidays:", error);
        showToast("Failed to load holidays", "error");
        return [];
    }
}

// Fetch long weekends
async function fetchLongWeekends(year, countryCode) {
    try {
        var url = API_URLS.nagerDate + "/LongWeekend/" + year + "/" + countryCode;
        var response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch long weekends");

        var data = await response.json();
        appState.longWeekends = data;
        return data;
    } catch (error) {
        console.error("Error fetching long weekends:", error);
        showToast("Failed to load long weekends", "error");
        return [];
    }
}

// Fetch weather forecast
async function fetchWeather(lat, lon) {
    try {
        var params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index",
            hourly: "temperature_2m,weather_code,precipitation_probability",
            daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
            timezone: "auto"
        });

        var url = API_URLS.openMeteo + "/forecast?" + params.toString();
        var response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch weather");

        var data = await response.json();
        appState.weather = data;
        return data;
    } catch (error) {
        console.error("Error fetching weather:", error);
        showToast("Failed to load weather", "error");
        return null;
    }
}

// Fetch events from Ticketmaster
async function fetchEvents(city, countryCode) {
    try {
        var params = new URLSearchParams({
            apikey: API_KEYS.ticketmaster,
            city: city,
            countryCode: countryCode,
            size: 20
        });

        var url = API_URLS.ticketmaster + "/events.json?" + params.toString();
        var response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch events");

        var data = await response.json();

        if (data._embedded && data._embedded.events) {

            appState.events = data._embedded.events;

        } else {

            appState.events = [
                {
                    id: "demo1",
                    name: "Cultural Festival (Demo Event)",
                    url: "#",
                    dates: {
                        start: {
                            localDate: "2026-05-20"
                        }
                    },
                    classifications: [
                        {
                            segment: { name: "Festival" }
                        }
                    ],
                    images: [
                        {
                            url: "./src/images/event-demo.jpg"

                        }
                    ],
                    _embedded: {
                        venues: [
                            {
                                name: "Main City Center",
                                city: { name: city }
                            }
                        ]
                    }
                }
            ];

        }

        return appState.events;
    } catch (error) {
        console.error("Error fetching events:", error);
        appState.events = [];
        return appState.events;
    }
}

// Fetch exchange rates
async function fetchExchangeRates(baseCurrency) {
    try {
        var base = baseCurrency || "USD";
        var url = API_URLS.exchangeRate + "/" + API_KEYS.exchangeRate + "/latest/" + base;
        var response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch exchange rates");

        var data = await response.json();
        appState.exchangeRates = data;
        return data;
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
        showToast("Failed to load exchange rates", "error");
        return null;
    }
}

// Fetch sun times
async function fetchSunTimes(lat, lon, date) {
    try {
        var params = new URLSearchParams({
            lat: lat,
            lng: lon,
            formatted: 0
        });

        if (date) {
            params.append("date", date);
        }

        var url = API_URLS.sunriseSunset + "/json?" + params.toString();
        var response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch sun times");

        var data = await response.json();
        appState.sunTimes = data.results;
        return data.results;
    } catch (error) {
        console.error("Error fetching sun times:", error);
        showToast("Failed to load sun times", "error");
        return null;
    }
}

// RENDER FUNCTIONS

function populateCountryDropdown() {
    var select = document.getElementById("global-country");
    if (!select) return;

    select.innerHTML = '<option value="">Select Country</option>';

    appState.countries.forEach(function (country) {
        var option = document.createElement("option");
        option.value = country.countryCode;
        option.textContent = country.name;
        select.appendChild(option);
    });
}


async function populateCityDropdown(countryCode) {

    var citySelect = document.getElementById("global-city");
    if (!citySelect) return;

    citySelect.innerHTML =
        "<option value=''>Select City (Optional)</option>";

    var cities = citiesByCountry[countryCode];

    if (!cities || cities.length === 0) {

        var details = await fetchCountryDetails(countryCode);

        if (details?.capital?.length > 0) {

            var capital = details.capital[0];

            var option = document.createElement("option");
            option.value = capital;
            option.textContent = capital + " (Capital)";
            citySelect.appendChild(option);

            citySelect.value = capital;
            appState.selectedCity = capital;

            updateSelectedDestination();
        }

        return;
    }

    cities.forEach(function (city) {
        var option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
    // Always select first city automatically
    if (citySelect.options.length > 1) {
        citySelect.selectedIndex = 1;
        appState.selectedCity = citySelect.value;
        updateSelectedDestination();
    }

}








function renderCountryInfo(country) {
    if (!country) return;

    var container = document.querySelector(".dashboard-country-info");

    if (!container) return;

    // Get currency info
    var currencyInfo = "";
    if (country.currencies) {
        var currencyCodes = Object.keys(country.currencies);
        currencyInfo = currencyCodes.map(function (code) {
            var curr = country.currencies[code];
            return curr.name + " (" + code + " " + (curr.symbol || "") + ")";
        }).join(", ");
    }

    // Get languages
    var languages = "";
    if (country.languages) {
        languages = Object.values(country.languages).join(", ");
    }

    // Get borders
    var borders = "";
    if (country.borders && country.borders.length > 0) {
        borders = country.borders.map(function (code) {
            return '<span class="extra-tag border-tag" onclick="selectBorderCountry(\'' + code + '\')">'
                + code +
                '</span>';

        }).join("");
    } else {
        borders = '<span class="extra-tag">No land borders</span>';
    }

    // Get timezone for local time
    var timezone = country.timezones ? country.timezones[0] : "UTC";

    var html = '\
        <div class="dashboard-country-header">\
            <img src="' + getFlagUrl(country.cca2, 160) + '" alt="' + country.name.common + '" class="dashboard-country-flag">\
            <div class="dashboard-country-title">\
                <h3>' + country.name.common + '</h3>\
                <p class="official-name">' + country.name.official + '</p>\
                <span class="region"><i class="fa-solid fa-location-dot"></i> ' + country.region + ' • ' + (country.subregion || "") + '</span>\
            </div>\
        </div>\
        \
        <div class="dashboard-local-time">\
            <div class="local-time-display">\
                <i class="fa-solid fa-clock"></i>\
                <span class="local-time-value" id="country-local-time">Loading...</span>\
                <span class="local-time-zone">' + timezone + '</span>\
            </div>\
        </div>\
        \
        <div class="dashboard-country-grid">\
            <div class="dashboard-country-detail">\
                <i class="fa-solid fa-building-columns"></i>\
                <span class="label">Capital</span>\
                <span class="value">' + (country.capital ? country.capital[0] : "N/A") + '</span>\
            </div>\
            <div class="dashboard-country-detail">\
                <i class="fa-solid fa-users"></i>\
                <span class="label">Population</span>\
                <span class="value">' + formatNumber(country.population) + '</span>\
            </div>\
            <div class="dashboard-country-detail">\
                <i class="fa-solid fa-ruler-combined"></i>\
                <span class="label">Area</span>\
                <span class="value">' + formatNumber(country.area) + ' km²</span>\
            </div>\
            <div class="dashboard-country-detail">\
                <i class="fa-solid fa-globe"></i>\
                <span class="label">Continent</span>\
                <span class="value">' + (country.continents ? country.continents[0] : country.region) + '</span>\
            </div>\
            <div class="dashboard-country-detail">\
                <i class="fa-solid fa-phone"></i>\
                <span class="label">Calling Code</span>\
                <span class="value">' + (country.idd ? country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : "") : "N/A") + '</span>\
            </div>\
            <div class="dashboard-country-detail">\
                <i class="fa-solid fa-car"></i>\
                <span class="label">Driving Side</span>\
                <span class="value">' + (country.car ? country.car.side.charAt(0).toUpperCase() + country.car.side.slice(1) : "N/A") + '</span>\
            </div>\
            <div class="dashboard-country-detail">\
                <i class="fa-solid fa-calendar-week"></i>\
                <span class="label">Week Starts</span>\
                <span class="value">' + (country.startOfWeek ? country.startOfWeek.charAt(0).toUpperCase() + country.startOfWeek.slice(1) : "Monday") + '</span>\
            </div>\
        </div>\
        \
        <div class="dashboard-country-extras">\
            <div class="dashboard-country-extra">\
                <h4><i class="fa-solid fa-coins"></i> Currency</h4>\
                <div class="extra-tags">\
                    <span class="extra-tag">' + currencyInfo + '</span>\
                </div>\
            </div>\
            <div class="dashboard-country-extra">\
                <h4><i class="fa-solid fa-language"></i> Languages</h4>\
                <div class="extra-tags">\
                    <span class="extra-tag">' + languages + '</span>\
                </div>\
            </div>\
            <div class="dashboard-country-extra">\
                <h4><i class="fa-solid fa-map-location-dot"></i> Neighbors</h4>\
                <div class="extra-tags">\
                    ' + borders + '\
                </div>\
            </div>\
        </div>\
        \
        <div class="dashboard-country-actions">\
            <a href="https://www.google.com/maps/place/' + encodeURIComponent(country.name.common) + '" target="_blank" class="btn-map-link">\
                <i class="fa-solid fa-map"></i> View on Google Maps\
            </a>\
        </div>';

    // Reset animation
    container.innerHTML = "";

    // Insert content
    container.innerHTML = html;
    // Restart Animation Correctly
    container.classList.remove("animate");

    void container.offsetWidth;

    container.classList.add("animate");


    var items = container.querySelectorAll(
        ".dashboard-country-header, .dashboard-local-time, .dashboard-country-detail, .dashboard-country-extra"
    );

    items.forEach(function (el, index) {

        el.style.opacity = "0";
        el.style.transform = "translateY(25px)";

        setTimeout(function () {

            el.style.transition = "all 0.6s ease";
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";

        }, index * 120);

    });


    updateCountryLocalTime(timezone);

}


async function selectBorderCountry(borderCode) {

    try {
        var response = await fetch(API_URLS.restCountries + "/alpha/" + borderCode);
        var result = await response.json();

        var neighbor = Array.isArray(result) ? result[0] : result;

        renderCountryInfo(neighbor);

    } catch (err) {
        console.error("Neighbor load failed:", err);
    }
}


function updateCountryLocalTime(timezone) {

    if (countryClockInterval) {
        clearInterval(countryClockInterval);
    }

    // Parse
    appState.currentTimezone = timezone;
    appState.currentUtcOffset = parseTimezoneOffset(timezone);


    updateClockDisplay();

    // live
    countryClockInterval = setInterval(updateClockDisplay, 1000);
}

function parseTimezoneOffset(timezone) {
    // Handle formats
    if (!timezone || timezone === "UTC") return 0;

    var match = timezone.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (match) {
        var sign = match[1] === "+" ? 1 : -1;
        var hours = parseInt(match[2], 10);
        var minutes = parseInt(match[3], 10);
        return sign * (hours * 60 + minutes);
    }
    return 0;
}

function updateClockDisplay() {
    var element = document.getElementById("country-local-time");
    if (!element) return;

    try {
        // Get current UTC time
        var now = new Date();
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

        // Apply country's timezone 
        var countryTime = new Date(utcTime + (appState.currentUtcOffset * 60000));

        var options = {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        };
        element.textContent = countryTime.toLocaleTimeString("en-US", options);
    } catch (e) {
        element.textContent = new Date().toLocaleTimeString();
    }
}

function updateSelectedDestination() {
    var flag = document.getElementById("selected-country-flag");
    var name = document.getElementById("selected-country-name");
    var city = document.getElementById("selected-city-name");
    var container = document.getElementById("selected-destination");

    if (appState.selectedCountry) {
        if (flag) flag.src = getFlagUrl(appState.selectedCountry.countryCode, 80);
        if (name) name.textContent = appState.selectedCountry.name;
        if (city) {
            city.textContent = appState.selectedCity
                ? "• " + appState.selectedCity
                : "";
        }

        if (container) container.style.display = "flex";
    } else {
        if (container) container.style.display = "none";
    }
}

// Render Holidays
function renderHolidays() {
    var container = document.getElementById("holidays-content");
    if (!container) return;

    if (!appState.selectedCountry) {
        container.innerHTML = `
        <div class="empty-state demo-empty">
            <div class="empty-icon">
                <i class="fa-solid fa-calendar-xmark"></i>
            </div>
            <h3>No Country Selected</h3>
            <p>Select a country from dashboard to explore holidays</p>
            <button class="btn btn-primary go-dashboard-btn">
                <i class="fa-solid fa-globe"></i>
                Go to Dashboard
            </button>
        </div>
    `;

        setupGoDashboardButtons();
        return;
    }

    var selectionBadge = document.getElementById("holidays-selection");

    if (selectionBadge && appState.selectedCountry) {
        selectionBadge.innerHTML = `
            <div class="current-selection-badge">
                <img 
                    src="${getFlagUrl(appState.selectedCountry.countryCode, 40)}"
                    alt="${appState.selectedCountry.name}"
                    class="selection-flag"
                >
                <span>${appState.selectedCountry.name}</span>
                <span class="selection-year">${appState.selectedYear}</span>
            </div>
        `;
    }

    if (appState.holidays.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-calendar-xmark"></i>
                </div>
                <h3>No Holidays Found</h3>
                <p>No public holidays found for this country and year.</p>
            </div>
        `;
        return;
    }

    var html = "";

    appState.holidays.forEach(function (holiday) {

        var date = new Date(holiday.date);
        var day = date.getDate();
        var month = date.toLocaleDateString("en-US", { month: "short" });
        var dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        var types = holiday.types ? holiday.types.join(", ") : "Public";
        var isSaved = appState.savedPlans.some(function (plan) {
            return plan.id === holiday.date && plan.type === "holiday";
        });

        var heartClass = isSaved ? "fa-solid" : "fa-regular";

        html += `
            <div class="holiday-card">
                <div class="holiday-card-header">

                    <div class="holiday-date-box">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>

                    <!-- Toggle Save / Remove -->
                    <button 
                        class="holiday-action-btn"
                        onclick="toggleSaveHoliday(
                            '${holiday.date}',
                            '${escapeHtml(holiday.name)}',
                            '${escapeHtml(holiday.localName)}'
                        )"
                    >
                        <i class="${heartClass} fa-heart"></i>
                    </button>

                </div>

                <h3>${holiday.name}</h3>
                <p class="holiday-name">${holiday.localName}</p>

                <div class="holiday-card-footer">
                    <span class="holiday-day-badge">
                        <i class="fa-regular fa-calendar"></i> ${dayName}
                    </span>
                    <span class="holiday-type-badge">${types}</span>
                </div>

            </div>
        `;
    });

    container.innerHTML = html;

    // Update stats
    var statHolidays = document.getElementById("stat-holidays");
    if (statHolidays) statHolidays.textContent = appState.holidays.length;
}


function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function saveHoliday(date, name, localName) {
    var item = {
        id: date,
        type: "holiday",
        name: name,
        localName: localName,
        date: date,
        country: appState.selectedCountry ? appState.selectedCountry.name : "",
        countryCode: appState.selectedCountry ? appState.selectedCountry.countryCode : ""
    };
    addToPlan(item);
    renderHolidays();
}

function toggleSaveHoliday(date, name, localName) {

    var exists = appState.savedPlans.some(function (plan) {
        return plan.id === date && plan.type === "holiday";
    });

    if (exists) {
        removeFromPlan(date, "holiday", function () {
            renderHolidays();
        });
        return;
    }


    var item = {
        id: date,
        type: "holiday",
        name: name,
        localName: localName,
        date: date,
        country: appState.selectedCountry ? appState.selectedCountry.name : "",
        countryCode: appState.selectedCountry ? appState.selectedCountry.countryCode : ""
    };

    addToPlan(item);
    renderHolidays();
}

function renderLongWeekends() {

    var container = document.getElementById("lw-content");
    if (!container) return;

    if (!appState.selectedCountry) {
        container.innerHTML = `
            <div class="empty-state demo-empty">
                <div class="empty-icon">
                    <i class="fa-solid fa-umbrella-beach"></i>
                </div>

                <h3>No Country Selected</h3>
                <p>Select a country from dashboard to explore long weekends</p>

                <button class="btn btn-primary go-dashboard-btn">
                    <i class="fa-solid fa-globe"></i>
                    Go to Dashboard
                </button>
            </div>
        `;
        setupGoDashboardButtons();
        return;
    }

    var selectionBadge = document.getElementById("lw-selection");

    if (selectionBadge && appState.selectedCountry) {
        selectionBadge.innerHTML = `
            <div class="current-selection-badge">
                <img 
                    src="${getFlagUrl(appState.selectedCountry.countryCode, 40)}"
                    class="selection-flag"
                >
                <span>
                    ${appState.selectedCountry.name}
                    ${appState.selectedCity ? " • " + appState.selectedCity : ""}
                </span>
                <span class="selection-year">${appState.selectedYear}</span>
            </div>
        `;
    }

    if (appState.longWeekends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-calendar-xmark"></i>
                </div>

                <h3>No Long Weekends Found</h3>
                <p>No long weekends found for this country and year.</p>
            </div>
        `;
        return;
    }

    var html = "";
    var index = 1;

    appState.longWeekends.forEach(function (lw) {

        var startDate = new Date(lw.startDate);
        var endDate = new Date(lw.endDate);

        var startStr = startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

        var endStr = endDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        var isSaved = appState.savedPlans.some(function (plan) {
            return plan.id === lw.startDate && plan.type === "longweekend";
        });
        var heartClass = isSaved ? "fa-solid" : "fa-regular";
        var noteText =
            lw.dayCount >= 4
                ? "No extra days off needed!"
                : "Requires taking a bridge day off";

        var noteClass =
            lw.dayCount >= 4
                ? "success"
                : "warning";

        html += `
            <div class="longweekend-card">

                <!-- Badge -->
                <div class="longweekend-badge">
                    <i class="fa-solid fa-calendar-days"></i>
                    ${lw.dayCount} Days
                </div>

                <!-- Heart Button -->
                <button class="favorite-btn"
                    onclick="toggleSaveLongWeekend(
                        '${lw.startDate}',
                        '${lw.endDate}',
                        ${lw.dayCount}
                    )">
                    <i class="${heartClass} fa-heart"></i>
                </button>

                <h3 class="longweekend-title">
                    Long Weekend #${index}
                </h3>

                <p class="longweekend-date">
                    <i class="fa-regular fa-calendar"></i>
                    ${startStr} - ${endStr}
                </p>

                <!-- Note -->
                <div class="longweekend-note ${noteClass}">
                    ${noteText}
                </div>

            </div>
        `;

        index++;
    });

    container.innerHTML = html;
}


function saveLongWeekend(startDate, endDate, dayCount) {
    var item = {
        id: startDate,
        type: "longweekend",
        name: "Long Weekend (" + dayCount + " days)",
        startDate: startDate,
        endDate: endDate,
        dayCount: dayCount,
        country: appState.selectedCountry ? appState.selectedCountry.name : "",
        countryCode: appState.selectedCountry ? appState.selectedCountry.countryCode : ""
    };
    addToPlan(item);
    renderLongWeekends();
}

// Render Events
function renderEvents() {
    var container = document.getElementById("events-content");

    if (!container) return;
    if (appState.events.length === 0) {

        container.innerHTML = `
        <div class="empty-state demo-empty">

            <div class="empty-icon">
                <i class="fa-solid fa-ticket"></i>
            </div>

            <h3>No City Selected</h3>
            <p>Select a country and city from dashboard to discover events</p>

            <button class="btn btn-primary go-dashboard-btn">
                <i class="fa-solid fa-globe"></i>
                Go to Dashboard
            </button>

        </div>
    `;

        setupGoDashboardButtons();
        return;
    }

    var selectionBadge = document.getElementById("events-selection");

    if (selectionBadge && appState.selectedCountry) {
        selectionBadge.innerHTML = `
            <div class="current-selection-badge">
                <img 
                    src="${getFlagUrl(appState.selectedCountry.countryCode, 40)}"
                    class="selection-flag"
                >
                <span>
                    ${appState.selectedCountry.name}
                    ${appState.selectedCity ? "• " + appState.selectedCity : ""}
                </span>
                <span class="selection-year">${appState.selectedYear}</span>
            </div>
        `;
    }

    var html = "";

    appState.events.forEach(function (event) {

        var imageUrl =
            event.images && event.images[0]
                ? event.images[0].url
                : "./src/images/event-placeholder.jpg";

        var category =
            event.classifications &&
                event.classifications[0] &&
                event.classifications[0].segment
                ? event.classifications[0].segment.name
                : "Event";

        var venue =
            event._embedded &&
                event._embedded.venues &&
                event._embedded.venues[0]
                ? event._embedded.venues[0].name
                : "TBA";

        var city =
            event._embedded &&
                event._embedded.venues &&
                event._embedded.venues[0] &&
                event._embedded.venues[0].city
                ? event._embedded.venues[0].city.name
                : appState.selectedCity;

        // Date
        var dateStr = "TBA";
        var timeStr = "";

        if (event.dates && event.dates.start) {

            if (event.dates.start.localDate) {
                var eventDate = new Date(event.dates.start.localDate);
                dateStr = eventDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });
            }

            if (event.dates.start.localTime) {
                timeStr = " at " + event.dates.start.localTime.substring(0, 5);
            }
        }

        // Saved Toggle Check
        var isSaved = appState.savedPlans.some(function (plan) {
            return plan.id === event.id && plan.type === "event";
        });

        var heartClass = isSaved ? "fa-solid" : "fa-regular";
        var btnText = isSaved ? "Saved" : "Save";

        html += `
            <div class="event-card">

                <div class="event-card-image">
                    <img src="${imageUrl}" alt="${event.name}">
                    <span class="event-card-category">${category}</span>

                    <!--  Toggle Heart -->
                    <button 
                        class="event-card-save"
                        onclick="toggleSaveEvent(
                            '${event.id}',
                            '${escapeHtml(event.name)}',
                            '${dateStr}',
                            '${category}',
                            '${escapeHtml(venue)}'
                        )"
                    >
                        <i class="${heartClass} fa-heart"></i>
                    </button>
                </div>

                <div class="event-card-body">
                    <h3>${event.name}</h3>

                    <div class="event-card-info">
                        <div>
                            <i class="fa-regular fa-calendar"></i>
                            ${dateStr + timeStr}
                        </div>

                        <div>
                            <i class="fa-solid fa-location-dot"></i>
                            ${venue}, ${city}
                        </div>
                    </div>

                    <div class="event-card-footer">

                        <!--  Toggle Button -->
                        <button 
                            class="btn-event"
                            onclick="toggleSaveEvent(
                                '${event.id}',
                                '${escapeHtml(event.name)}',
                                '${dateStr}',
                                '${category}',
                                '${escapeHtml(venue)}'
                            )"
                        >
                            <i class="${heartClass} fa-heart"></i> ${btnText}
                        </button>

                        <a href="${event.url || "#"}" target="_blank" class="btn-buy-ticket">
                            <i class="fa-solid fa-ticket"></i> Buy Tickets
                        </a>

                    </div>
                </div>

            </div>
        `;
    });

    container.innerHTML = html;

    // Update stats
    var statEvents = document.getElementById("stat-events");
    if (statEvents) statEvents.textContent = appState.events.length + "+";
}

function saveEvent(id, name, date, category, venue) {
    var item = {
        id: id,
        type: "event",
        name: name,
        date: date,
        category: category,
        venue: venue,
        city: appState.selectedCity,
        country: appState.selectedCountry ? appState.selectedCountry.name : ""
    };
    addToPlan(item);
    renderEvents();
}


function toggleSaveEvent(id, name, date, category, venue) {

    var exists = appState.savedPlans.some(function (plan) {
        return plan.id === id && plan.type === "event";
    });

    if (exists) {
        removeFromPlan(id, "event", function () {
            renderEvents();
        });
        return;
    }

    var item = {
        id: id,
        type: "event",
        name: name,
        date: date,
        category: category,
        venue: venue,
        city: appState.selectedCity,
        country: appState.selectedCountry ? appState.selectedCountry.name : ""
    };

    addToPlan(item);
    renderEvents();
}


function toggleSaveLongWeekend(startDate, endDate, dayCount) {

    var exists = appState.savedPlans.some(function (plan) {
        return plan.id === startDate && plan.type === "longweekend";
    });

    if (exists) {
        removeFromPlan(startDate, "longweekend", function () {
            renderLongWeekends();
        });
        return;
    }

    var item = {
        id: startDate,
        type: "longweekend",
        name: "Long Weekend (" + dayCount + " days)",
        startDate: startDate,
        endDate: endDate,
        dayCount: dayCount,
        country: appState.selectedCountry
            ? appState.selectedCountry.name
            : ""
    };

    addToPlan(item);
    renderLongWeekends();
}


function renderWeather() {
    var container = document.getElementById("weather-content");

    if (!container || !appState.weather) return;

    var weather = appState.weather;
    var current = weather.current;
    var temp = current.temperature_2m;

    var selectionBadge = document.getElementById("weather-selection");

    if (selectionBadge && appState.selectedCountry) {
        selectionBadge.innerHTML =
            '<div class="current-selection-badge">' +
            '<img ' +
            'src="' + getFlagUrl(appState.selectedCountry.countryCode, 40) + '" ' +
            'class="selection-flag">' +
            '<span>' +
            appState.selectedCountry.name +
            (appState.selectedCity ? " • " + appState.selectedCity : "") +
            '</span>' +
            '<span class="selection-year">' + appState.selectedYear + '</span>' +
            '</div>';
    }

    var weatherClass = "weather-cold";

    if (temp >= 25) weatherClass = "weather-hot";
    else if (temp >= 15) weatherClass = "weather-warm";
    else weatherClass = "weather-cold";

    var daily = weather.daily;
    var hourly = weather.hourly;

    var weatherInfo = weatherCodes[current.weather_code] || {
        description: "Unknown",
        icon: "fa-cloud"
    };

    var themeClass = getWeatherTheme(current.weather_code);
    var uvValue = current.uv_index || 0;
    var uvText = "Low";

    if (uvValue >= 11) uvText = "Extreme";
    else if (uvValue >= 8) uvText = "Very High";
    else if (uvValue >= 6) uvText = "High";
    else if (uvValue >= 3) uvText = "Moderate";
    else uvText = "Low";

    var currentHtml = '\
        <div class="weather-hero-card ' + themeClass + ' ' + weatherClass + '">\
            <div class="weather-location">\
                <i class="fa-solid fa-location-dot"></i>\
                <span>' + appState.selectedCity + '</span>\
                <span class="weather-time">' + formatDate(new Date()) + '</span>\
            </div>\
            <div class="weather-hero-main">\
                <div class="weather-hero-left">\
                    <div class="weather-hero-icon">\
                        <i class="fa-solid ' + weatherInfo.icon + '"></i>\
                    </div>\
                    <div class="weather-hero-temp">\
                        <span class="temp-value">' + Math.round(current.temperature_2m) + '</span>\
                        <span class="temp-unit">°C</span>\
                    </div>\
                </div>\
                <div class="weather-hero-right">\
                    <div class="weather-condition">' + weatherInfo.description + '</div>\
                    <div class="weather-feels">Feels like ' + Math.round(current.apparent_temperature) + '°C</div>\
                    <div class="weather-high-low">\
                        <span class="high">\
                            <i class="fa-solid fa-arrow-up"></i> ' + Math.round(daily.temperature_2m_max[0]) + '°\
                        </span>\
                        <span class="low">\
                            <i class="fa-solid fa-arrow-down"></i> ' + Math.round(daily.temperature_2m_min[0]) + '°\
                        </span>\
                    </div>\
                </div>\
            </div>\
        </div>';


    var uvValue = current.uv_index || 0;

    var uvText = "Low";
    var uvClass = "low";

    if (uvValue >= 11) {
        uvText = "Extreme";
        uvClass = "extreme";
    }
    else if (uvValue >= 8) {
        uvText = "Very High";
        uvClass = "very-high";
    }
    else if (uvValue >= 6) {
        uvText = "High";
        uvClass = "high";
    }
    else if (uvValue >= 3) {
        uvText = "Moderate";
        uvClass = "moderate";
    }

    //Wind Direction Text
    var windDeg = current.wind_direction_10m || 0;

    function getWindDirection(deg) {
        if (deg >= 337 || deg < 23) return "N";
        if (deg >= 23 && deg < 68) return "NE";
        if (deg >= 68 && deg < 113) return "E";
        if (deg >= 113 && deg < 158) return "SE";
        if (deg >= 158 && deg < 203) return "S";
        if (deg >= 203 && deg < 248) return "SW";
        if (deg >= 248 && deg < 293) return "W";
        return "NW";
    }

    var windDirText = getWindDirection(windDeg);


    //Details Grid + Sunrise & Sunset
    var detailsHtml = '\
        <div class="weather-details-grid">\
            <div class="weather-detail-card">\
                <div class="detail-icon humidity"><i class="fa-solid fa-droplet"></i></div>\
                <div class="detail-info">\
                    <span class="detail-label">Humidity</span>\
                    <span class="detail-value">' + current.relative_humidity_2m + '%</span>\
                    <div class="detail-bar">\
                        <div class="detail-bar-fill" style="width:' + current.relative_humidity_2m + '%"></div>\
                    </div>\
                </div>\
            </div>\
            <div class="weather-detail-card">\
                <div class="detail-icon wind"><i class="fa-solid fa-wind"></i></div>\
                <div class="detail-info">\
                    <span class="detail-label">Wind</span>\
                    <span class="detail-value">' + Math.round(current.wind_speed_10m) + ' km/h</span>\
                    <span class="detail-extra">' + windDirText + '</span>\
                </div>\
            </div>\
            <div class="weather-detail-card">\
                <div class="detail-icon uv"><i class="fa-solid fa-sun"></i></div>\
                <div class="detail-info">\
                    <span class="detail-label">UV Index</span>\
                    <span class="detail-value">' + uvValue + '</span>\
                    <span class="uv-level ' + uvClass + '">' + uvText + '</span>\
                </div>\
            </div>\
            <div class="weather-detail-card">\
                <div class="detail-icon precip"><i class="fa-solid fa-cloud-rain"></i></div>\
                <div class="detail-info">\
                    <span class="detail-label">Precipitation</span>\
                    <span class="detail-value">' + (daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0) + '%</span>\
                    <span class="detail-extra">' + (daily.precipitation_sum ? daily.precipitation_sum[0] : 0) + 'mm expected</span>\
                </div>\
            </div>\
            <div class="weather-detail-card">\
                <div class="detail-icon sunrise"><i class="fa-solid fa-sun"></i></div>\
                <div class="detail-info">\
                    <span class="detail-label">Sunrise</span>\
                    <span class="detail-value">' + daily.sunrise[0].substring(11, 16) + '</span>\
                </div>\
            </div>\
            <div class="weather-detail-card">\
                <div class="detail-icon sunset"><i class="fa-solid fa-moon"></i></div>\
                <div class="detail-info">\
                    <span class="detail-label">Sunset</span>\
                    <span class="detail-value">' + daily.sunset[0].substring(11, 16) + '</span>\
                </div>\
            </div>\
        </div>';

    //Hourly Forecast
    var hourlyHtml =
        '<div class="weather-section">\
            <h3 class="weather-section-title">\
                <i class="fa-solid fa-clock"></i> Hourly Forecast\
            </h3>\
            <div class="hourly-scroll">';

    var currentHour = new Date().getHours();

    for (var i = 0; i < 20; i++) {
        var hourIndex = currentHour + i;
        if (hourIndex >= 24) hourIndex -= 24;
        if (hourIndex >= hourly.time.length) break;

        var hourTemp = hourly.temperature_2m[hourIndex];
        var hourCode = hourly.weather_code[hourIndex];
        var hourInfo = weatherCodes[hourCode] || { icon: "fa-cloud" };

        var hourRain =
            hourly.precipitation_probability
                ? hourly.precipitation_probability[hourIndex]
                : 0;


        var hourTime =
            i === 0
                ? "Now"
                : (hourIndex % 12 || 12) + (hourIndex >= 12 ? " PM" : " AM");

        var nowClass = i === 0 ? " now" : "";

        hourlyHtml += '\
            <div class="hourly-item' + nowClass + '">\
                <span class="hourly-time">' + hourTime + '</span>\
                <div class="hourly-icon"><i class="fa-solid ' + hourInfo.icon + '"></i></div>\
                <span class="hourly-temp">' + Math.round(hourTemp) + '°</span>\
                <div class="hourly-precip">\
                    <i class="fa-solid fa-droplet"></i>\
                    <span>' + hourRain + '%</span>\
                </div>\
            </div>';
    }

    hourlyHtml += '</div></div>';
    var dailyHtml =
        '<div class="weather-section">\
            <h3 class="weather-section-title">\
                <i class="fa-solid fa-calendar-week"></i> 7-Day Forecast\
            </h3>\
            <div class="forecast-list">';

    for (var d = 0; d < 7 && d < daily.time.length; d++) {

        var dayDate = new Date(daily.time[d]);

        var dayName =
            d === 0
                ? "Today"
                : dayDate.toLocaleDateString("en-US", { weekday: "short" });

        var dayDateStr = dayDate.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short"
        });

        var dayCode = daily.weather_code[d];
        var dayInfo = weatherCodes[dayCode] || { icon: "fa-cloud" };

        var todayClass = d === 0 ? " today" : "";

        var precipProb =
            daily.precipitation_probability_max
                ? daily.precipitation_probability_max[d]
                : 0;

        var precipHtml =
            precipProb > 0
                ? '<i class="fa-solid fa-droplet"></i><span>' + precipProb + '%</span>'
                : "";

        dailyHtml += '\
            <div class="forecast-day' + todayClass + '">\
                <div class="forecast-day-name">\
                    <span class="day-label">' + dayName + '</span>\
                    <span class="day-date">' + dayDateStr + '</span>\
                </div>\
                <div class="forecast-icon"><i class="fa-solid ' + dayInfo.icon + '"></i></div>\
                <div class="forecast-temps">\
                    <span class="temp-max">' + Math.round(daily.temperature_2m_max[d]) + '°</span>\
                    <span class="temp-min">' + Math.round(daily.temperature_2m_min[d]) + '°</span>\
                </div>\
                <div class="forecast-precip">' + precipHtml + '</div>\
            </div>';
    }

    dailyHtml += '</div></div>';

    //Render Everything
    container.innerHTML =
        currentHtml + detailsHtml + hourlyHtml + dailyHtml;
}




function renderSunTimes() {
    var container = document.getElementById("sun-times-content");

    if (!container || !appState.sunTimes) return;
    var selectionBadge = document.getElementById("sun-selection");

    if (selectionBadge && appState.selectedCountry) {
        selectionBadge.innerHTML = `
        <div class="current-selection-badge">
            <img 
                src="${getFlagUrl(appState.selectedCountry.countryCode, 40)}"
                class="selection-flag"
            >
            <span>
                ${appState.selectedCountry.name}
                ${appState.selectedCity ? " • " + appState.selectedCity : ""}
            </span>
            <span class="selection-year">${appState.selectedYear}</span>
        </div>
    `;
    }


    var sun = appState.sunTimes;

    function formatSunTime(isoString) {
        if (!isoString) return "N/A";
        var date = new Date(isoString);
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    }

    //Calculate day length
    function formatDayLength(seconds) {
        if (!seconds) return "N/A";
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        return hours + "h " + minutes + "m";
    }

    var dayLengthSeconds = sun.day_length;
    var dayLengthFormatted = formatDayLength(dayLengthSeconds);
    var dayPercent = ((dayLengthSeconds / 86400) * 100).toFixed(1);
    var nightSeconds = 86400 - dayLengthSeconds;
    var nightFormatted = formatDayLength(nightSeconds);

    var html = '\
        <div class="sun-main-card">\
            <div class="sun-main-header">\
                <div class="sun-location">\
                    <h2><i class="fa-solid fa-location-dot"></i> ' + appState.selectedCity + '</h2>\
                    <p>Sun times for your selected location</p>\
                </div>\
                <div class="sun-date-display">\
                    <div class="date">' + formatDate(new Date()) + '</div>\
                </div>\
            </div>\
            \
            <div class="sun-times-grid">\
                <div class="sun-time-card dawn">\
                    <div class="icon"><i class="fa-solid fa-moon"></i></div>\
                    <div class="label">Dawn</div>\
                    <div class="time">' + formatSunTime(sun.civil_twilight_begin) + '</div>\
                    <div class="sub-label">Civil Twilight</div>\
                </div>\
                <div class="sun-time-card sunrise">\
                    <div class="icon"><i class="fa-solid fa-sun"></i></div>\
                    <div class="label">Sunrise</div>\
                    <div class="time">' + formatSunTime(sun.sunrise) + '</div>\
                    <div class="sub-label">Golden Hour Start</div>\
                </div>\
                <div class="sun-time-card noon">\
                    <div class="icon"><i class="fa-solid fa-sun"></i></div>\
                    <div class="label">Solar Noon</div>\
                    <div class="time">' + formatSunTime(sun.solar_noon) + '</div>\
                    <div class="sub-label">Sun at Highest</div>\
                </div>\
                <div class="sun-time-card sunset">\
                    <div class="icon"><i class="fa-solid fa-sun"></i></div>\
                    <div class="label">Sunset</div>\
                    <div class="time">' + formatSunTime(sun.sunset) + '</div>\
                    <div class="sub-label">Golden Hour End</div>\
                </div>\
                <div class="sun-time-card dusk">\
                    <div class="icon"><i class="fa-solid fa-moon"></i></div>\
                    <div class="label">Dusk</div>\
                    <div class="time">' + formatSunTime(sun.civil_twilight_end) + '</div>\
                    <div class="sub-label">Civil Twilight</div>\
                </div>\
                <div class="sun-time-card daylight">\
                    <div class="icon"><i class="fa-solid fa-hourglass-half"></i></div>\
                    <div class="label">Day Length</div>\
                    <div class="time">' + dayLengthFormatted + '</div>\
                    <div class="sub-label">Total Daylight</div>\
                </div>\
            </div>\
        </div>\
        \
        <div class="day-length-card">\
            <h3><i class="fa-solid fa-chart-pie"></i> Daylight Distribution</h3>\
            <div class="day-progress">\
                <div class="day-progress-bar">\
                    <div class="day-progress-fill" style="width: ' + dayPercent + '%"></div>\
                </div>\
            </div>\
            <div class="day-length-stats">\
                <div class="day-stat">\
                    <div class="value">' + dayLengthFormatted + '</div>\
                    <div class="label">Daylight</div>\
                </div>\
                <div class="day-stat">\
                    <div class="value">' + dayPercent + '%</div>\
                    <div class="label">of 24 Hours</div>\
                </div>\
                <div class="day-stat">\
                    <div class="value">' + nightFormatted + '</div>\
                    <div class="label">Darkness</div>\
                </div>\
            </div>\
        </div>';

    container.innerHTML = html;
}
function renderCurrencyRates() {
    if (!appState.exchangeRates) return;

    var rates = appState.exchangeRates.conversion_rates;
    var popularCurrencies = ["EUR", "GBP", "EGP", "AED", "SAR", "JPY", "CAD", "INR"];
    var container = document.getElementById("popular-currencies");

    if (!container) return;

    var fromSelect = document.getElementById("currency-from");
    var toSelect = document.getElementById("currency-to");

    if (fromSelect && toSelect) {

        var currencyCodes = Object.keys(rates);

        //Reset dropdowns
        fromSelect.innerHTML = "";
        toSelect.innerHTML = "";

        //Placeholder for To dropdown
        var placeholderTo = document.createElement("option");
        placeholderTo.value = "";
        placeholderTo.textContent = "Select a currency...";
        toSelect.appendChild(placeholderTo);

        //Fill options dynamically
        currencyCodes.forEach(function (code) {

            var name = currencyNames[code] || code;

            // From dropdown
            var option1 = document.createElement("option");
            option1.value = code;
            option1.textContent = code + " - " + name;

            if (code === "USD") option1.selected = true;
            fromSelect.appendChild(option1);

            // To dropdown
            var option2 = document.createElement("option");
            option2.value = code;
            option2.textContent = code + " - " + name;

            toSelect.appendChild(option2);
        });

        //Auto select currency if country selected
        if (appState.countryDetails?.currencies) {

            var autoCode = Object.keys(appState.countryDetails.currencies)[0];

            if (autoCode) {
                toSelect.value = autoCode;
            }

        } else {
            toSelect.value = "";
            var resultContainer = document.getElementById("currency-result");

            if (resultContainer) {
                resultContainer.innerHTML = `
                    <div class="empty-state demo-empty">
                        <div class="empty-icon">
                            <i class="fa-solid fa-money-bill-transfer"></i>
                        </div>
                        <h3>No Currency Selected</h3>
                        <p>Select a country or choose a currency to begin.</p>
                    </div>
                `;
            }
        }
    }

    var html = "";

    popularCurrencies.forEach(function (code) {
        if (!rates[code]) return;

        var name = currencyNames[code] || code;
        var rate = rates[code].toFixed(4);
        var flagCode = code.substring(0, 2).toLowerCase();

        if (code === "EUR") flagCode = "eu";
        if (code === "GBP") flagCode = "gb";

        html += '\
            <div class="popular-currency-card" onclick="selectCurrency(\'' + code + '\')">\
                <img src="' + getFlagUrl(flagCode, 40) + '" class="flag">\
                <div class="info">\
                    <div class="code">' + code + '</div>\
                    <div class="name">' + name + '</div>\
                </div>\
                <div class="rate">' + rate + '</div>\
            </div>';
    });

    container.innerHTML = html;
}


function selectCurrency(code) {
    var toSelect = document.getElementById("currency-to");
    if (toSelect) {
        toSelect.value = code;
        convertCurrency();
    }
}

function convertCurrency() {
    if (!appState.exchangeRates) {
        showToast("Please wait for rates to load", "warning");
        return;
    }

    var amount = parseFloat(document.getElementById("currency-amount").value) || 0;
    var from = document.getElementById("currency-from").value;
    var to = document.getElementById("currency-to").value;
    if (!to) {

        var resultContainer = document.getElementById("currency-result");

        if (resultContainer) {
            resultContainer.innerHTML = `
            <div class="empty-state demo-empty">
                <div class="empty-icon">
                    <i class="fa-solid fa-money-bill-transfer"></i>
                </div>
                <h3>No Currency Selected</h3>
                <p>Please choose a currency first.</p>
            </div>
        `;
        }

        return;
    }



    var rates = appState.exchangeRates.conversion_rates;

    var fromRate = rates[from] || 1;
    var toRate = rates[to] || 1;

    // Convert to USD first, then to target
    var amountInBase = amount / fromRate;
    var result = amountInBase * toRate;

    var rate = toRate / fromRate;

    var resultContainer = document.getElementById("currency-result");
    if (resultContainer) {
        resultContainer.innerHTML = '\
            <div class="conversion-display">\
                <div class="conversion-from">\
                    <span class="amount">' + amount.toFixed(2) + '</span>\
                    <span class="currency-code">' + from + '</span>\
                </div>\
                <div class="conversion-equals"><i class="fa-solid fa-equals"></i></div>\
                <div class="conversion-to">\
                    <span class="amount">' + formatNumber(result.toFixed(2)) + '</span>\
                    <span class="currency-code">' + to + '</span>\
                </div>\
            </div>\
            <div class="exchange-rate-info">\
                <p>1 ' + from + ' = ' + rate.toFixed(4) + ' ' + to + '</p>\
                <small>Last updated: ' + appState.exchangeRates.time_last_update_utc + '</small>\
            </div>';
    }
}

function swapCurrencies() {
    var fromSelect = document.getElementById("currency-from");
    var toSelect = document.getElementById("currency-to");

    if (fromSelect && toSelect) {
        var temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        convertCurrency();
    }
}

function renderMyPlans() {
    var container = document.getElementById("plans-content");

    if (!container) return;

    // Update filter counts
    var allCount = appState.savedPlans.length;
    var holidayCount = appState.savedPlans.filter(function (p) { return p.type === "holiday"; }).length;
    var eventCount = appState.savedPlans.filter(function (p) { return p.type === "event"; }).length;
    var lwCount = appState.savedPlans.filter(function (p) {
        return p.type === "longweekend" || p.type === "long-weekend";
    }).length;


    var filterAllEl = document.getElementById("filter-all-count");
    var filterHolidayEl = document.getElementById("filter-holiday-count");
    var filterEventEl = document.getElementById("filter-event-count");
    var filterLwEl = document.getElementById("filter-lw-count");

    if (filterAllEl) filterAllEl.textContent = allCount;
    if (filterHolidayEl) filterHolidayEl.textContent = holidayCount;
    if (filterEventEl) filterEventEl.textContent = eventCount;
    if (filterLwEl) filterLwEl.textContent = lwCount;

    // Get active filter
    var activeFilter = document.querySelector(".plan-filter.active");
    var filterType = activeFilter ? activeFilter.getAttribute("data-filter") : "all";

    var filteredPlans = appState.savedPlans;
    if (filterType !== "all") {

        filteredPlans = appState.savedPlans.filter(function (p) {

            //Fix Long Weekend Filter
            if (filterType === "longweekend") {
                return p.type === "longweekend" || p.type === "long-weekend";
            }

            return p.type === filterType;
        });

    }


    if (filteredPlans.length === 0) {
        container.innerHTML = '\
            <div class="empty-state">\
                <div class="empty-icon"><i class="fa-solid fa-heart-crack"></i></div>\
                <h3>No Saved Plans Yet</h3>\
                <p>Start exploring and save holidays, events, or long weekends you like!</p>\
                <button class="btn-primary" onclick="navigateToView(\'dashboard\')">\
                    <i class="fa-solid fa-compass"></i> Start Exploring\
                </button>\
            </div>';
        return;
    }

    var html = "";

    filteredPlans.forEach(function (plan) {
        var typeClass = plan.type.replace("-", "");
        var typeLabel = "Item";

        if (plan.type === "holiday") {
            typeLabel = "Holiday";
        } else if (plan.type === "event") {
            typeLabel = "Event";
        } else if (plan.type === "longweekend" || plan.type === "long-weekend") {
            typeLabel = "Long Weekend";
        }


        var dateInfo = plan.date || "";
        if (plan.startDate && plan.endDate) {
            dateInfo = formatShortDate(plan.startDate) + " - " + formatShortDate(plan.endDate);
        }

        html += '\
            <div class="plan-card">\
                <span class="plan-card-type ' + typeClass + '">' + typeLabel + '</span>\
                <div class="plan-card-content">\
                    <h4>' + plan.name + '</h4>\
                    <div class="plan-card-details">\
                        <div><i class="fa-regular fa-calendar"></i> ' + dateInfo + '</div>\
                        <div><i class="fa-solid fa-location-dot"></i> ' + (plan.country || plan.city || "N/A") + '</div>\
                    </div>\
                    <div class="plan-card-actions">\
                        <button class="btn-plan-remove" onclick="removeFromPlan(\'' + plan.id + '\', \'' + plan.type + '\')">\
                            <i class="fa-solid fa-trash"></i> Remove\
                        </button>\
                    </div>\
                </div>\
            </div>';
    });

    container.innerHTML = html;
}

// DATA LOADING FUNCTIONS

async function loadDashboard() {
    showLoading("Loading countries...");

    try {
        // Fetch countries
        await fetchCountries();
        populateCountryDropdown();

        // Update stats
        var statCountries = document.getElementById("stat-countries");
        if (statCountries) statCountries.textContent = appState.countries.length + "+";

        hideLoading();
    } catch (error) {
        console.error("Error loading dashboard:", error);
        hideLoading();
        showToast("Failed to load dashboard", "error");
    }
}

async function loadCountryData(silent) {
    if (!appState.selectedCountry) return;

    if (!silent) {
        showLoading("Loading country details...");
    }

    try {

        var details = await fetchCountryDetails(
            appState.selectedCountry.countryCode
        );

        if (details) {

            appState.countryDetails = details;
            renderCountryInfo(details);

            if (!appState.selectedCity && details.capital?.length > 0) {
                appState.selectedCity = details.capital[0];
            }

            updateSelectedDestination();
        }

        if (!silent) {
            hideLoading();
        }

    } catch (error) {
        console.error("Error loading country data:", error);

        if (!silent) {
            hideLoading();
        }

        showToast("Failed to load country data", "error");
    }
}




async function loadHolidays() {
    if (!appState.selectedCountry) {
        showToast("Please select a country first!", "warning");
        return;
    }

    showLoading("Loading holidays...");

    try {
        await fetchHolidays(appState.selectedYear, appState.selectedCountry.countryCode);
        renderHolidays();
        hideLoading();
    } catch (error) {
        console.error("Error loading holidays:", error);
        hideLoading();
        showToast("Failed to load holidays", "error");
    }
}

async function loadLongWeekends() {
    if (!appState.selectedCountry) {
        showToast("Please select a country first!", "warning");
        return;
    }

    showLoading("Loading long weekends...");

    try {
        await fetchLongWeekends(appState.selectedYear, appState.selectedCountry.countryCode);
        renderLongWeekends();
        hideLoading();
    } catch (error) {
        console.error("Error loading long weekends:", error);
        hideLoading();
        showToast("Failed to load long weekends", "error");
    }
}

async function loadEvents() {
    if (!appState.selectedCountry) {
        showToast("Please select a country first!", "warning");
        return;
    }

    showLoading("Loading events...");

    try {
        var city = appState.selectedCity;

        if (!city && appState.countryDetails?.capital) {
            city = appState.countryDetails.capital[0];
        }

        if (!city) {
            showToast("No city available for events!", "warning");
            hideLoading();
            return;
        }

        await fetchEvents(city, appState.selectedCountry.countryCode);

        renderEvents();
        hideLoading();

    } catch (error) {
        console.error(error);
        hideLoading();
        showToast("Failed to load events", "error");
    }
}

async function loadWeather() {
    if (!appState.selectedCountry) {
        showToast("Please select a country first!", "warning");
        return;
    }

    showLoading("Loading weather...");

    try {
        if (!appState.countryDetails) {
            await loadCountryData();
        }

        var latlng = appState.countryDetails.capitalInfo?.latlng;

        if (!latlng || latlng.length < 2) {
            showToast("No weather location available for this country!", "error");
            hideLoading();
            return;
        }

        var lat = latlng[0];
        var lon = latlng[1];

        await fetchWeather(lat, lon);

        renderWeather();

        hideLoading();

    } catch (error) {
        console.error("Error loading weather:", error);
        hideLoading();
        showToast("Failed to load weather", "error");
    }
}


async function loadSunTimes() {

    if (!appState.selectedCountry) {
        showToast("Please select a country first!", "warning");
        return;
    }

    showLoading("Loading sun times...");

    try {

        if (!appState.countryDetails) {
            await loadCountryData();
        }

        var latlng = appState.countryDetails.capitalInfo?.latlng;

        if (!latlng || latlng.length < 2) {
            showToast("No sun location available!", "error");
            hideLoading();
            return;
        }

        var lat = latlng[0];
        var lon = latlng[1];

        await fetchSunTimes(lat, lon);

        renderSunTimes();

        hideLoading();

    } catch (error) {
        console.error(error);
        hideLoading();
        showToast("Failed to load sun times", "error");
    }
}



async function loadCurrencyRates(base) {

    showLoading("Loading exchange rates...");

    try {

        await fetchExchangeRates(base || "USD");

        renderCurrencyRates();
        var to = document.getElementById("currency-to").value;

        if (to) {
            convertCurrency();
        } else {
            var resultContainer = document.getElementById("currency-result");

            if (resultContainer) {
                resultContainer.innerHTML = `
                    <div class="empty-state demo-empty">
                        <div class="empty-icon">
                            <i class="fa-solid fa-money-bill-transfer"></i>
                        </div>
                        <h3>No Currency Selected</h3>
                        <p>Please choose a currency to start converting.</p>
                    </div>
                `;
            }
        }

        hideLoading();

    } catch (error) {
        console.error("Error loading currency rates:", error);
        hideLoading();
        showToast("Failed to load exchange rates", "error");
    }
}


// EVENT HANDLERS

function setupGoDashboardButtons() {

    var goDashboardBtns = document.querySelectorAll(".go-dashboard-btn");

    goDashboardBtns.forEach(function (btn) {

        btn.onclick = function () {
            navigateToView("dashboard");
        };

    });

}


function setupEventListeners() {

    // Navigation clicks
    var navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(function (item) {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            var viewName = this.getAttribute("data-view");
            navigateToView(viewName);

            var sidebar = document.getElementById("sidebar");
            var overlay = document.getElementById("sidebar-overlay");
            if (sidebar) sidebar.classList.remove("open");
            if (overlay) overlay.classList.add("hidden");
        });
    });

    // Country selection
    var countrySelect = document.getElementById("global-country");
    if (countrySelect) {
        countrySelect.addEventListener("change", async function () {

            var code = this.value;

            var country = appState.countries.find(function (c) {
                return c.countryCode === code;
            });

            if (country) {

                appState.selectedCountry = country;
                appState.selectedCity = "";

                await populateCityDropdown(code);

                updateSelectedDestination();
            }
        });

    }


    // City input
    var citySelect = document.getElementById("global-city");
    if (citySelect) {
        citySelect.addEventListener("change", function () {
            appState.selectedCity = this.value;
            updateSelectedDestination();
        });
    }

    // Year selection
    var yearSelect = document.getElementById("global-year");
    if (yearSelect) {
        yearSelect.addEventListener("change", function () {
            appState.selectedYear = parseInt(this.value);
        });
    }

    // Explore button
    var exploreBtn = document.getElementById("global-search-btn");
    if (exploreBtn) {
        exploreBtn.addEventListener("click", async function () {

            if (!appState.selectedCountry) {
                showToast("Please select a country first!", "warning");
                return;
            }

            await loadCountryData(true);
            if (appState.countryDetails?.currencies) {
                var code = Object.keys(appState.countryDetails.currencies)[0];
                loadCurrencyRates(code);
            }

            showToast("Exploring " + appState.selectedCountry.name + "!", "success");

        });







    }

    // Clear selection
    var clearBtn = document.getElementById("clear-selection-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", function () {
            app.resetUI();
            navigateToView("dashboard");
            showToast("Selection cleared", "success");
        });

    }



    // Currency converter
    var convertBtn = document.getElementById("convert-btn");
    if (convertBtn) {
        convertBtn.addEventListener("click", convertCurrency);
    }

    var swapBtn = document.getElementById("swap-currencies-btn");
    if (swapBtn) {
        swapBtn.addEventListener("click", swapCurrencies);
    }

    var amountInput = document.getElementById("currency-amount");
    if (amountInput) {
        amountInput.addEventListener("input", convertCurrency);
    }

    // My Plans filters
    var filterBtns = document.querySelectorAll(".plan-filter");
    filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            filterBtns.forEach(function (b) { b.classList.remove("active"); });
            this.classList.add("active");
            renderMyPlans();
        });
    });

    // Clear all plans
    var clearAllBtn = document.getElementById("clear-all-plans-btn");
    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", clearAllPlans);
    }

    // Start exploring button
    var startExploringBtn = document.getElementById("start-exploring-btn");
    if (startExploringBtn) {
        startExploringBtn.addEventListener("click", function () {
            navigateToView("dashboard");
        });
    }

    // Mobile menu
    var mobileMenuBtn = document.getElementById("mobile-menu-btn");
    var sidebar = document.getElementById("sidebar");
    var sidebarOverlay = document.getElementById("sidebar-overlay");

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", function () {
            sidebar.classList.toggle("open");
            sidebarOverlay.classList.toggle("hidden");
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", function () {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.add("hidden");
        });
    }

    // Browser back/forward
    window.addEventListener("hashchange", handlePopState);
    setupGoDashboardButtons();



}

// INITIALIZATION

var app;

class WanderlustApp {
    constructor() {
        this.state = appState;
    }

    async init() {
        await this.start();
    }

    async start() {
        await initApp();
    }

    resetUI() {
        var countrySelect = document.getElementById("global-country");
        var citySelect = document.getElementById("global-city");

        // Reset dropdowns
        if (countrySelect) {
            countrySelect.value = "";
        }

        if (citySelect) {
            citySelect.innerHTML = "<option value=''>Select City (Optional)</option>";
        }

        // Reset state
        this.state.selectedCountry = null;
        this.state.selectedCity = "";
        this.state.countryDetails = null;

        updateSelectedDestination();

        var infoContainer = document.querySelector(".dashboard-country-info");

        if (infoContainer) {
            infoContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-globe"></i>
                </div>
                <h3>Select a country to view detailed information</h3>
                <p>Choose a destination from above and click Explore</p>
            </div>
        `;
        }
        // Clear Sun Times Badge
        var sunBadge = document.getElementById("sun-selection");
        if (sunBadge) sunBadge.innerHTML = "";

        // Clear Currency Badge
        var currencyBadge = document.getElementById("currency-selection");
        if (currencyBadge) currencyBadge.innerHTML = "";

    }

}



async function initApp() {
    console.log("App Starting...");

    loadPlansFromStorage();
    updatePlansCount();

    updateDateTime();
    setInterval(updateDateTime, 60000);

    setupEventListeners();

    await loadDashboard();

    var countrySelect = document.getElementById("global-country");
    var citySelect = document.getElementById("global-city");

    if (countrySelect) countrySelect.value = "";
    if (citySelect) {
        citySelect.innerHTML =
            "<option value=''>Select City (Optional)</option>";
    }

    appState.selectedCountry = null;
    appState.selectedCity = "";
    appState.countryDetails = null;

    updateSelectedDestination();

    var hash = window.location.hash;
    var viewName = hash.replace("#/", "") || "dashboard";

    showView(viewName);

    console.log("App Ready.");
}



//******* */
// Expose functions to global scope
window.saveHoliday = saveHoliday;
window.toggleSaveHoliday = toggleSaveHoliday;
window.saveLongWeekend = saveLongWeekend;
window.saveEvent = saveEvent;
window.toggleSaveEvent = toggleSaveEvent;
window.toggleSaveLongWeekend = toggleSaveLongWeekend;
window.removeFromPlan = removeFromPlan;
window.navigateToView = navigateToView;
window.selectCurrency = selectCurrency;
window.convertCurrency = convertCurrency;
window.swapCurrencies = swapCurrencies;
window.clearAllPlans = clearAllPlans;
window.selectBorderCountry = selectBorderCountry;



document.addEventListener("DOMContentLoaded", function () {
    app = new WanderlustApp();
    app.init();
});
