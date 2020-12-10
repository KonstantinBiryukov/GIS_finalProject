mapboxgl.accessToken = 'pk.eyJ1Ijoia29uc3RhbnRpbmJpcml1a292IiwiYSI6ImNrMWsxYjc1bjBrdjQzZHBiNTlhbjBqdmwifQ.vAlGhe7KTCajh5VvGfMJow';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [31.4606, 20.7927],
    zoom: 0.5
});

var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

function filterBy(month) {
    var filters = ['==', 'month', month];
    map.setFilter('earthquake-circles', filters);
    map.setFilter('earthquake-labels', filters);

    // Set the label to the month
    document.getElementById('month').textContent = months[month];
}

map.on('load', function () {
    // Data courtesy of http://earthquake.usgs.gov/
    // Query for significant earthquakes in 2015 URL request looked like this:
    // http://earthquake.usgs.gov/fdsnws/event/1/query
    //    ?format=geojson
    //    &starttime=2015-01-01
    //    &endtime=2015-12-31
    //    &minmagnitude=6'
    //
    // Here we're using d3 to help us make the ajax request but you can use
    // Any request method (library or otherwise) you wish.
    d3.json(
        'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2020-01-01&endtime=2020-12-31&minmagnitude=6',
        function (err, data) {
            if (err) throw err;

            // Create a month property value based on time used to filter against.
            data.features = data.features.map(function (d) {
                d.properties.month = new Date(d.properties.time).getMonth();
                return d;
            });

            map.addSource('earthquakes', {
                'type': 'geojson',
                data: data
            });

            map.addLayer({
                'id': 'earthquake-circles',
                'type': 'circle',
                'source': 'earthquakes',
                'paint': {
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        6,
                        '#FCA107',
                        8,
                        '#7F3121'
                    ],
                    'circle-opacity': 0.75,
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        6,
                        20,
                        8,
                        40
                    ]
                }
            });

            map.addLayer({
                'id': 'earthquake-labels',
                'type': 'symbol',
                'source': 'earthquakes',
                'layout': {
                    'text-field': [
                        'concat',
                        ['to-string', ['get', 'mag']],
                        'm'
                    ],
                    'text-font': [
                        'Open Sans Bold',
                        'Arial Unicode MS Bold'
                    ],
                    'text-size': 12
                },
                'paint': {
                    'text-color': 'rgba(0,0,0,0.5)'
                }
            });

            // Set filter to first month of the year
            // 0 = January
            filterBy(0);

            map.on('click', 'earthquake-circles', function (e) {
                let coordinates = e.features[0].geometry.coordinates.slice();
                // var description = e.features[0].properties.title;
                var link = e.features[0].properties.url;
                var description = '<a href="' + link + '" target="blank">' + e.features[0].properties.title + '</a>';


                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);

            });

            document
                .getElementById('slider')
                .addEventListener('input', function (e) {
                    var month = parseInt(e.target.value, 10);
                    filterBy(month);
                });
        }
    );
});