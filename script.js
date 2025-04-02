document.getElementById("routeForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let from = document.getElementById("from").value;
    let to = document.getElementById("to").value;
    let mode = document.getElementById("mode").value;
    let fuelEfficiency = parseFloat(document.getElementById("fuelEfficiency").value);

    let map = L.map('map').setView([20.5937, 78.9629], 5); // Default India map view
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let url = `https://nominatim.openstreetmap.org/search?format=json&q=`;
    
    Promise.all([
        fetch(url + from).then(response => response.json()),
        fetch(url + to).then(response => response.json())
    ])
    .then(data => {
        let fromCoords = [data[0][0].lat, data[0][0].lon];
        let toCoords = [data[1][0].lat, data[1][0].lon];

        let routeUrl = `https://router.project-osrm.org/route/v1/${mode}/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson`;

        return fetch(routeUrl);
    })
    .then(response => response.json())
    .then(data => {
        let route = data.routes[0];
        let distance = route.distance / 1000; // Convert meters to km
        let carbonEmission = calculateCarbonEmission(distance, mode, fuelEfficiency);

        document.getElementById("result").innerHTML = `
            <p>Distance: ${distance.toFixed(2)} km</p>
            <p>Estimated Carbon Emission: ${carbonEmission.toFixed(2)} kg CO2</p>
            <p><strong>${getEcoFriendlyMessage(carbonEmission)}</strong></p>
        `;

        let coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        L.polyline(coordinates, { color: 'blue' }).addTo(map);
        map.fitBounds(L.polyline(coordinates).getBounds());
    })
    .catch(error => alert("Could not calculate route. Try again!"));
});

function calculateCarbonEmission(distance, mode, fuelEfficiency) {
    const emissionRates = {
        car: 2.3,  // kg CO2 per liter of fuel (average)
        bicycle: 0,
        foot: 0
    };

    if (mode === "car") {
        let fuelUsed = distance / fuelEfficiency;
        return fuelUsed * emissionRates[mode];
    }
    
    return distance * (emissionRates[mode] || 0);
}

function getEcoFriendlyMessage(emission) {
    if (emission === 0) return "Great choice! No carbon emissions.";
    if (emission < 1) return "Very eco-friendly choice!";
    if (emission < 5) return "Good choice, but consider alternatives.";
    return "Try a greener transport method if possible!";
}
