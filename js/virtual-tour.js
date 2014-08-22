// Building BF_QUIZ Module according to the principles outlined here: http://yuiblog.com/blog/2007/06/12/module-pattern/
var VT = {};

VT.settings = function () {
	return {
		USER_IS_MOBILE: false,
		tour_json_path: "http://sandbox.bierfeldt.me/vt/json/tour_path.json",
		stops_json_path: "http://sandbox.bierfeldt.me/vt/json/tour_stops2.json",
		init: function() {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            	this.USER_IS_MOBILE = true;
        	}
			console.log("Settings for Virtual Tour");
			alert(this.USER_IS_MOBILE);
		}
	};
}();

VT.loader = function () {
	return {
		init: function() {
			VT.settings.init();
			VT.mapManager.init();
			VT.markerManager.init();
			VT.locationServices.init();
			VT.tourManager.init();
			VT.stopManager.init();
		}
	};
}();

VT.markerManager = function () {
	"use strict";

	var icons;

	//TODO load this from JSON
	icons = {
		start: new google.maps.MarkerImage(
		// URL
		'images/start.png',
			// (width,height)
			new google.maps.Size( 18, 32 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 9, 32 )
		),
		end: new google.maps.MarkerImage(
			// URL
			'images/end.png',
			// (width,height)
			new google.maps.Size( 18, 32 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 9, 32 )
		),
		unselected: new google.maps.MarkerImage(
			// URL
			'images/unselected_marker.png',
			// (width,height)
			new google.maps.Size( 36, 63 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 18, 63 )
		),
		selected: new google.maps.MarkerImage(
			// URL
			'images/selected_marker.png',
			// (width,height)
			new google.maps.Size( 50, 87 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 25, 87 )
		),
		current: new google.maps.MarkerImage(
			// URL
			'images/current_marker.png',
			// (width,height)
			new google.maps.Size( 22, 22 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point(11, 11 )
		)
	};

	return {
		markers: new Array(),
		makeMarker: function(position, icon_kind, title) {
			var marker, icon_selection;
			icon_selection = icons[icon_kind];
			marker = new google.maps.Marker({
				position: position,
				map: VT.mapManager.map,
				icon: icon_selection,
				title: title
			});
			this.markers.push(marker);
			return marker;
		},
		setMarkerPosition: function (marker, position) {
			marker.setPosition(position);
		},
		setMap: function (map) {
			for (var i = 0; i < this.markers.length; i++) {
				this.markers[i].setMap(map);
			}
		},
		showMarkers: function () {
			this.setMap(VT.mapManager.map);
		},
		clearMarkers: function () {
			this.setMap(null);
		},
		removeAllMarkers: function () {
			this.clearMarkers();
			this.markers = new Array();
		},
		init: function() {
			console.log("loaded markerManager");
		}
	};
}();

VT.locationServices = function () {
	"use strict";

	var setCurrentLocationMarker, watchCurrentLocation, displayAndWatchCurrentLocation,
	ne_bound, sw_bound, bounds, geo_options;

	ne_bound = new google.maps.LatLng(41.799562,-87.587342);
	sw_bound = new google.maps.LatLng(41.780332,-87.605882);
	bounds = new google.maps.LatLngBounds(sw_bound, ne_bound);

	geo_options = {
		enableHighAccuracy: true, 
		maximumAge        : 3, 
	};

	setCurrentLocationMarker = function setCurrentLocationMarker(pos) {
		var user_location, currentLocationMarker;
		// Get User's location from "pos" callback passed from geolocation
		VT.locationServices.current_location = new google.maps.LatLng(
			pos.coords.latitude,
			pos.coords.longitude
		);
		// Set the User's Current Location and Make a Marker
		VT.locationServices.current_location_marker = VT.markerManager.makeMarker(
			VT.locationServices.current_location, "current", "Current Location");
	};

	displayAndWatchCurrentLocation = function displayAndWatchCurrentLocation(position) {
		if (bounds.contains(new google.maps.LatLng(position.coords.latitude,
				position.coords.longitude)) == true)
		{
			setCurrentLocationMarker(position);
			// watchCurrentLocation();
			console.log("tracking location");
		} else {
			console.log("not tracking location (outside of bounds)");
		}
	};

	watchCurrentLocation = function watchCurrentLocation() {
		var positionTimer, me;
		positionTimer = navigator.geolocation.watchPosition(
			function (position) {
				setMarkerPosition(
					currentLocationMarker,
					position
					);
				me = new google.maps.LatLng(
					position.coords.latitude,
					position.coords.longitude
					);
				CURRENT_ORIGIN = me;
			});
	};

	return {
		current_location: null,
		current_location_marker: null,
        init: function() {
        	// if (USER_IS_MOBILE) {
         //        if (navigator.geolocation) {
         //        	navigator.geolocation.getCurrentPosition(displayAndWatchCurrentLocation, null, geo_options);
         //        } else {
         //        	return
         //        }
         //    }
         	if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(displayAndWatchCurrentLocation,
                		null, geo_options);
            }
        	console.log("loaded locationServices");
        }
    };

}();

VT.tourManager = function ($) {
	var loadTourPathJSON, loadTourPath;

	// Asynchronously Load the Tour Path Data from its JSON file
	loadTourPathJSON = function (json_file) {
		var tour_json_data, request;
		request = new XMLHttpRequest();
        request.open("GET", json_file, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // After loading, set the Tour Data to the parsed JSON data
                tour_json_data = JSON.parse(request.responseText);
                for (var i = 0, length = tour_json_data.length; i < length; i++) {
					VT.tourManager.path_points.push(new google.maps.LatLng(
						tour_json_data[i].lat, tour_json_data[i].lng
					));
				}
				// Load the path and set it initially
				loadTourPath().setMap(VT.mapManager.map);
            } else {
                alert("Tour JSON error.")
            }
        };
        request.onerror = function() {
            alert("Tour JSON server connection error.")
        };
        request.send();
	};

	// function to create the polygon path from the waypoints data
	loadTourPath = function () {
		var lineSymbol, tourPath;
		lineSymbol = {
			path: 'M 0,-1 0,1',
			strokeOpacity: .5,
			scale: 3
		};
		VT.tourManager.tour_path = new google.maps.Polyline({
			path: VT.tourManager.path_points,
			strokeOpacity: 0,
			icons: [{
				icon: lineSymbol,
				offset: '0',
				repeat: '10px'
			}],
			map: VT.mapManager.map
		});
		return VT.tourManager.tour_path;
	};

	return {
		path_points: new Array(),
		tour_path: null,
		showTourPath: function () {
			this.tour_path.setMap(VT.mapManager.map);
		},
		hideTourPath: function () {
			this.tour_path.setMap(null);
		},
		init: function() {
			loadTourPathJSON(VT.settings.tour_json_path);
			console.log("loaded tourManager");
		}
	};
}();

VT.stopManager = function ($) {
	var loadStopJSON, loadStopMarkers;

	// Asynchronously Load the Tour Path Data from its JSON file
	loadStopJSON = function (json_file) {
		var stop_json_data, request;
		request = new XMLHttpRequest();
        request.open("GET", json_file, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // After loading, set the Tour Data to the parsed JSON data
                stop_json_data = JSON.parse(request.responseText);
                loadStopMarkers(stop_json_data);
            } else {
                alert("Tour JSON error.")
            }
        };
        request.onerror = function() {
            alert("Tour JSON server connection error.")
        };
        request.send();
	};

	// function to create the polygon path from the waypoints data
	loadStopMarkers = function (stop_data) {
		var position, marker;
		for (var i = 0, length = stop_data.length; i < length; i++) {
			position = new google.maps.LatLng(stop_data[i].marker.lat,
					stop_data[i].marker.lng);
			marker = VT.markerManager.makeMarker(position, "unselected",
					stop_data[i].marker.title);
			marker.html = "<span class='info-title'>"+stop_data[i].marker.title+
					"</span><br /><span class='info-description'>"+
					stop_data[i].marker.description+"</span>";
			// Add each marker to the stop_markers array
			VT.stopManager.stop_markers.push(marker);
		}
	};

	return {
		stop_markers: new Array(),
		init: function() {
			loadStopJSON(VT.settings.stops_json_path);
			console.log("loaded stopManager");
		}
	};
}();

VT.mapManager = function () {
    "use strict";

    var MY_MAPTYPE_ID, mapOptions, featureOpts, styledMapOptions;

    MY_MAPTYPE_ID = 'custom_style';

    mapOptions = {
        center: new google.maps.LatLng(41.788935,-87.599158),
		zoom: 18,
		zoomControl: false,
		mapTypeControlOptions: {
		    mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
		},
		panControl: false,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		overviewMapControl: false,
		disableDoubleClickZoom: true,
		mapTypeId: MY_MAPTYPE_ID
    };

    //TODO get from JSON
    featureOpts = [
		{
		    featureType: 'building',
		    "stylers": [
		    	{ "color": "#cbcbbe" },
		    	{ "weight": "1" },
		    	{ "visibility": "on" },
		    ]
		},
		{
		    featureType: 'transit',
		    elementType: 'all',
		    "stylers": [
		    	{ "visibility": "off" },
		    ]
		},
		{
		    featureType: "poi",
		    elementType: "labels",
		    stylers: [
		    	{ "visibility": "off" },
		    ]		  
		},
		{
		    featureType: "poi",
		    elementType: "geometry",
		    "stylers": [
		    	{ "color": "#e7e8e5" },
		    	{ "strokeColor": "ff00ff"},
		    ]
		},
		{
		    featureType: 'poi',
		    elementType: "labels.text.stroke",
		    "stylers": [
		    	{ "visibility": "off" },
		    ]
		},
		{
		    featureType: 'all',
		    elementType: 'labels.text.stroke',
		    "stylers": [
		    	{ "visibility": "off" },
		    ]
		},
		{
		    featureType: "all",
		    elementType: "labels.text",
		    "stylers": [
		    	{ "visibility": "off" },
		    ]
		},
		{
		    featureType: 'road.highway',
		    "stylers": [
		    	{ "color": "#666666" },
		    ]
		},
		{
		    featureType: 'road.arterial',
		    "stylers": [
		    	{ "color": "#999999" },
		    ]
		},
		{
		    featureType: "road.local",
		    "stylers": [
		    	{ "color": "#ffffff" },
		    	{ "weight": "2.75" },
		    ]
		},
		{
		    featureType: "water",
		    "stylers": [
		    	{ "color": "#87b0c3" },
		    ]
		}
	];

	styledMapOptions = {
        name: 'Custom Style'
    };
    
    return {
    	map: null,
    	increaseZoom: function () {
    		this.map.setZoom(this.map.getZoom()+1);
    	},
    	decreaseZoom: function () {
    		this.map.setZoom(this.map.getZoom()-1);
    	},
        init: function() {
        	this.map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);
            var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
            this.map.mapTypes.set(MY_MAPTYPE_ID, customMapType);
            console.log("loaded mapManager");
        }
    };
}();
