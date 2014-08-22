        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            var USER_IS_MOBILE = true;
        }
        var map,
        main_controls, display_container, info_display, image_display, video_display,
    	stop_data, path_data,
    	currentLocationMarker,
        tourPath,
        CURRENT_DISPLAY;
    	var STOP_MARKERS = [];
    	var PATHS = []
		var MY_MAPTYPE_ID = 'custom_style';
		var SELECTED_MARKER = null;
		var DISPLAY_STATE = false;
		
		// URL to json file containing tour stops
		var stop_json_url = "http://sandbox.bierfeldt.me/vt/json/tour_stops2.json";
		var path_json_url = "http://sandbox.bierfeldt.me/vt/json/tour_path.json";
		
		var ne_bound = new google.maps.LatLng(41.799562,-87.587342);
		var sw_bound = new google.maps.LatLng(41.780332,-87.605882);
		var bounds = new google.maps.LatLngBounds(sw_bound, ne_bound);
		
		var icons = {
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
		
		var featureOpts = [
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

		var mapOptions = {
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
        
        var geo_options = {
			enableHighAccuracy: true, 
			maximumAge        : 3, 
		};
		
		var mouseoverInfoBox = new InfoBox({
				content: '',
				boxClass: "stop-info-box",
				maxWidth: 0,
				closeBoxURL: "",
				disableAutoPan: true,
				pixelOffset: new google.maps.Size(-85, 10)
		});
		
		var clickInfoBox = new InfoBox({
				content: '',
				boxClass: "stop-info-box",
				maxWidth: 0,
				closeBoxURL: "",
				disableAutoPan: true,
				pixelOffset: new google.maps.Size(-85, 10)
		});
