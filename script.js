mapboxgl.accessToken = 'pk.eyJ1IjoiYWJ1YmFrYXI0MzQzIiwiYSI6ImNtYnRocTF4NzAzdWcybG9tNHpyeHFzcHIifQ.wIRLBqeEDOWq7UhuzBngTQ';  // Replace with your actual Mapbox access token

// Declare map only once
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [122.56, 13.41],  // Center the map on the Philippines
  zoom: 5.5  // Set zoom level
});

// Wait for the map style to load before adding markers or lines
map.on('style.load', function () {
  console.log("Map style loaded!");

  // Manually provided data (no need to read CSV)
  const sites = [
{"EP Site ID": "PH-NUE-00616", "Latitude": 15.657687, "Longitude": 120.768786},
{"EP Site ID": "PH-ISA-00232", "Latitude": 16.908815, "Longitude": 121.80662}

  ];

  const coordinates = [];
  let markersAdded = 0;

  sites.forEach(site => {
    // Clean up extra spaces (if any)
    const siteID = (site['EP Site ID'] || "").trim();
    const lat = parseFloat(site.Latitude);
    const lon = parseFloat(site.Longitude);

    // Log the site information for debugging
    console.log(`Processing site: ${siteID}, Latitude: ${lat}, Longitude: ${lon}`);

    // Validate site data
    if (!siteID || isNaN(lat) || isNaN(lon)) {
      console.log('Skipping invalid site data:', site);
      return;
    }

    coordinates.push({ lat, lon, siteID });

    // Add marker to the map
    const marker = new mapboxgl.Marker({ color: '#1d9bf0' })
      .setLngLat([lon, lat])  // Set marker position
      .addTo(map);

    // Create the popup with the full EP Site ID (only showing on hover)
    const popup = new mapboxgl.Popup({ closeButton: false })  // Hide close button on hover
      .setText(siteID);  // Show full Site ID on hover

    // Attach hover event listener to show the popup
    marker.getElement().addEventListener('mouseenter', function () {
      console.log(`Showing popup for: ${siteID}`);
      popup.addTo(map);
      popup.setLngLat(marker.getLngLat());  // Position the popup near the marker
    });

    // Attach mouseleave event listener to remove the popup
    marker.getElement().addEventListener('mouseleave', function () {
      popup.remove();
    });

    markersAdded++;  // Increment markers counter
  });

  // Log the number of markers added
  console.log('Markers added:', markersAdded);

  // Success message in the console
  if (markersAdded > 0) {
    console.log(`Successfully added ${markersAdded} markers.`);
  } else {
    console.log('No markers were added. Check the data for errors.');
  }

  // Now calculate and display distances between sites
  for (let i = 0; i < coordinates.length - 1; i++) {
    const current = coordinates[i];
    const next = coordinates[i + 1];

    const from = [current.lon, current.lat];
    const to = [next.lon, next.lat];

    // Calculate distance using Turf.js (in kilometers)
    const distance = turf.distance(turf.point(from), turf.point(to), { units: 'kilometers' }).toFixed(2);

    // Add line between sites if distance is greater than a threshold (optional)
    const line = turf.lineString([from, to]);

    // Add GeoJSON source for the line
    map.addSource(`line-${i}`, {
      type: 'geojson',
      data: line
    });

    // Draw the line on the map
    map.addLayer({
      id: `line-${i}`,
      type: 'line',
      source: `line-${i}`,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#FF0000',
        'line-width': 2,
        'line-dasharray': [2, 4]  // Dotted line
      }
    });

    // Add midpoint label with the distance
    const midpoint = turf.midpoint(turf.point(from), turf.point(to));
    const midCoord = midpoint.geometry.coordinates;

    new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    })
      .setLngLat(midCoord)
      .setHTML(`<div style="font-size: 12px;">Distance: ${distance} km</div>`)
      .addTo(map);
  }
});
