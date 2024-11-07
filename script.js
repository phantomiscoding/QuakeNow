let cachedData = null
let lastFetchTime = 0

async function fetchEarthquakes(sortByMagnitude = false) {
    const now = new Date()
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const api = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${past24Hours.toISOString()}&endtime=${now.toISOString()}`

    const cacheDuration = 120000 
    if (cachedData && now - lastFetchTime < cacheDuration) {
        displayEarthquakes(cachedData, sortByMagnitude)
        return
    }

    showLoading(true)

    try {
        const response = await fetch(api)
        const data = await response.json()
        cachedData = data
        lastFetchTime = now

        displayEarthquakes(data, sortByMagnitude)
        showNotification("The list of earthquakes has been updated!")
    } catch (error) {
        console.error("Error fetching data:", error)
    } finally {
        showLoading(false)
    }
}

function displayEarthquakes(data, sortByMagnitude = false) {
    const list = document.querySelector('.earthquake-list')
    list.innerHTML = ""

    const earthquakes = data.features
    if (earthquakes.length === 0) {
        list.innerHTML = "<p>No earthquakes registered in the last 24 hours.</p>"
        return
    }

    if (sortByMagnitude) {
        earthquakes.sort((a, b) => b.properties.mag - a.properties.mag)
    } else {
        earthquakes.sort((a, b) => b.properties.time - a.properties.time) 
    }

    earthquakes.forEach(earthquake => {
        const { mag: magnitude, place, time, url } = earthquake.properties
        if (magnitude <= 0) return

        const magnitudeClass = magnitude < 5 ? "low-magnitude" : magnitude < 6 ? "moderate-magnitude" : "high-magnitude"
        const item = document.createElement("div")
        item.classList.add("earthquake-item", magnitudeClass)
        item.innerHTML = `
            <p><i class="fa-solid fa-bolt-lightning"></i> ${magnitude.toFixed(1)}</p>
            <p><i class="fa-solid fa-location-dot"></i> ${place}</p>
            <p><i class="fa-solid fa-clock"></i> ${new Date(time).toLocaleString()}</p>
            <a href="${url}" target="_blank">More Info</a>
        `
        list.appendChild(item)
    })
}

function showNotification(message) {
    const notification = document.querySelector(".notification")
    notification.textContent = message
    notification.classList.add("show")
    setTimeout(() => notification.classList.remove("show"), 5000)
}

function showLoading(isLoading) {
    const loader = document.querySelector(".loader")
    if (isLoading) {
        loader.style.display = "block"
    } else {
        loader.style.display = "none"
    }
}

document.querySelector(".magnitude").addEventListener("click", () => fetchEarthquakes(true))

document.querySelector(".clear-filters").addEventListener("click", () => {
    const magnitudeButton = document.querySelector(".magnitude");
    magnitudeButton.classList.remove("active");
    fetchEarthquakes(false);
});

window.onload = () => {
    fetchEarthquakes()
    setInterval(() => fetchEarthquakes(), 120000)
}
