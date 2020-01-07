//Init Map
//*******************************************************************************************************************************************************
var lat = 41.141376;
var lng = -8.613999;
var zoom = 14;

// add an OpenStreetMap tile layer
var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
	'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
	'Imagery © <a href="http://mapbox.com">Mapbox</a>',
	mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ';


var grayscale = L.tileLayer(mbUrl, {
	id: 'mapbox.light',
	attribution: mbAttr
}),
	streets = L.tileLayer(mbUrl, {
		id: 'mapbox.streets',
		attribution: mbAttr
	});


var map = L.map('map', {
	center: [lat, lng], // Porto
	zoom: zoom,
	layers: [streets],
	zoomControl: true,
	fullscreenControl: true,
	fullscreenControlOptions: { // optional
		title: "Show me the fullscreen !",
		titleCancel: "Exit fullscreen mode",
		position: 'bottomright'
	}
});

var baseLayers = {
	"Grayscale": grayscale, // Grayscale tile layer
	"Streets": streets, // Streets tile layer
};

layerControl = L.control.layers(baseLayers, null, {
	position: 'bottomleft'
}).addTo(map);

// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var featureGroup = L.featureGroup();

var drawControl = new L.Control.Draw({
	position: 'bottomright',
	collapsed: false,
	draw: {
		// Available Shapes in Draw box. To disable anyone of them just convert true to false
		polyline: false,
		polygon: false,
		circle: false,
		rectangle: true,
		marker: false,
	}

});
map.addControl(drawControl); // To add anything to map, add it to "drawControl"

//*******************************************************************************************************************************************************
//*****************************************************************************************************************************************
// Index Road Network by Using R-Tree
//*****************************************************************************************************************************************
var rt = cw(function (data, cb) {
	var self = this;
	var request, _resp;
	importScripts("js/rtree.js");
	if (!self.rt) {
		self.rt = RTree();
		request = new XMLHttpRequest();
		request.open("GET", data);
		request.onreadystatechange = function () {
			if (request.readyState === 4 && request.status === 200) {
				_resp = JSON.parse(request.responseText);
				self.rt.geoJSON(_resp);
				cb(true);
			}
		};
		request.send();
	} else {
		return self.rt.bbox(data);
	}
});

rt.data(cw.makeUrl("js/trips.json"));


//*****************************************************************************************************************************************
//*****************************************************************************************************************************************
// Drawing Shapes (polyline, polygon, circle, rectangle, marker) Event:
// Select from draw box and start drawing on map.
//*****************************************************************************************************************************************
map.on('draw:created', function (e) {

	var type = e.layerType,
		layer = e.layer;

	if (type === 'rectangle') {
		var bounds = layer.getBounds();
		rt.data([[bounds.getSouthWest().lng, bounds.getSouthWest().lat], [bounds.getNorthEast().lng, bounds.getNorthEast().lat]]).
			then(function (d) {
				var result = d.map(function (a) {
					return a.properties;
				});
				console.log(result);		// Trip Info: avspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames, taxiid, tripid
				DrawRS(result);
				wordCloud(result);
			});
	}
	drawnItems.addLayer(layer);			//Add your Selection to Map
});


//*****************************************************************************************************************************************
// DrawRS Function:
// Input is a list of road segments ID and their color. Then the visualization can show the corresponding road segments with the color
// Test:      var input_data = [{road:53, color:"#f00"}, {road:248, color:"#0f0"}, {road:1281, color:"#00f"}];
//            DrawRS(input_data);
//*****************************************************************************************************************************************
function DrawRS(trips) {
	clear();
	for (var j = 0; j < trips.length; j++) {  // Check Number of Segments and go through all segments
		var TPT = new Array();
		TPT = TArr[trips[j].tripid].split(',');  		 // Find each segment in TArr Dictionary.
		var polyline = new L.Polyline([]).addTo(drawnItems);
		polyline.setStyle({
			color: 'red',                      // polyline color
			weight: 1,                         // polyline weight
			opacity: 0.5,                      // polyline opacity
			smoothFactor: 1.0
		});
		for (var y = 0; y < TPT.length - 1; y = y + 2) {    // Parse latlng for each segment
			polyline.addLatLng([parseFloat(TPT[y + 1]), parseFloat(TPT[y])]);
		}
	}
}

function clear() {
	for (i in map._layers) {
		if (map._layers[i]._heat != undefined || map._layers[i]._path != undefined) {
			try {
				map.removeLayer(map._layers[i]);
			} catch (e) {
				console.log("error!! " + e + map._layers[i]);
			}
		}
	}
}

function wordCloud(trips) {

	let areas = [];
	trips.map(d => {
		d.streetnames.forEach(dt => {
			areas.push(dt);
		})
	});

	let count = Object.create(null);
	for(let i = 0; i < areas.length; i++) {
		let word = areas[i];
		if (!count[word]) {
			count[word] = 1;
		} else {
			count[word]++;
		}
	}

	let margin = {top: 10, right: 10, bottom: 10, left:10},
		width = 500,
		height = 500;

    d3.select("#chart > *").remove();

	let svg = d3.select('#chart')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom);

    let arr = d3.entries(count).slice(0,30);
    

    let scale = d3.scaleLinear()
        .domain(d3.extent(arr, d => d.value))
        .range([10, 100]);

	let focus = svg.append('g')
		.attr('width', width)
		.attr('height', height)
		.attr("transform", "translate(" + [width/2, height/2] + ")");


    let color = [];

    for(var i=0;i<50;i++){
    	color.push('#'+(Math.random()*0xFFFFFF<<0).toString(16))
    }

    drawCloud();


    function drawCloud() {
        d3.layout.cloud().size([width, height])
            .timeInterval(100)
            .words(arr)
            .fontSize(d => scale(+d.value))
            .text(d => d.key)
            .font('sans-serif')
            .on('end', output => draw(output))
            .start()
    }

    d3.layout.cloud().stop();

    function draw(words) {
    	console.log(words);
        focus.selectAll('text')
            .data(words)
            .enter()
            .append('text')
            .style('font-size', d => scale(d.value) + 'px')
            .style('font-family', 'sans-serif')
            .style('fill', (d, i) => color[Math.floor(Math.random() * color.length)])
            .attr('text-anchor', 'middle')
            .transition()
     			.duration(5000)
            .attr('transform', d => {
                return 'translate('+ [d.x, d.y] +')rotate(' + d.rotate + ')';
            })
            .text(d => d.key);
     		
    }
}
