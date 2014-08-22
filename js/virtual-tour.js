// Building BF_QUIZ Module according to the principles outlined here: http://yuiblog.com/blog/2007/06/12/module-pattern/
var VT = {};

VT.loader = function () {
	return {
		init: function() {
			VT.mapManager.init();
			VT.markerManager.init();
			VT.locationServices.init();
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
		'../images/start.png',
			// (width,height)
			new google.maps.Size( 18, 32 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 9, 32 )
		),
		end: new google.maps.MarkerImage(
			// URL
			'../images/end.png',
			// (width,height)
			new google.maps.Size( 18, 32 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 9, 32 )
		),
		unselected: new google.maps.MarkerImage(
			// URL
			'../images/unselected_marker.png',
			// (width,height)
			new google.maps.Size( 36, 63 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 18, 63 )
		),
		selected: new google.maps.MarkerImage(
			// URL
			'../images/selected_marker.png',
			// (width,height)
			new google.maps.Size( 50, 87 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point( 25, 87 )
		),
		current: new google.maps.MarkerImage(
			// URL
			'../images/current_marker.png',
			// (width,height)
			new google.maps.Size( 22, 22 ),
			// The origin point (x,y)
			new google.maps.Point( 0, 0 ),
			// The anchor point (x,y)
			new google.maps.Point(11, 11 )
		)
	};

	return {
		makeMarker: function(position, icon, title) {
			var marker;
			marker = new google.maps.Marker({
				position: position,
				map: VT.mapManager.map,
				icon: icon,
				title: title
			});
			return marker;
		},
		init: function() {
			console.log("loaded markerManager");
		}
	};
}();

VT.locationServices = function () {
	"use strict";

	var watchCurrentLocation;

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
        init: function() {
        	console.log("loaded locationServices");
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
        init: function() {
        	this.map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);
            var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
            this.map.mapTypes.set(MY_MAPTYPE_ID, customMapType);
            console.log("loaded mapManager");
        }
    };
}();

