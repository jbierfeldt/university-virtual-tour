// Building BF_QUIZ Module according to the principles outlined here: http://yuiblog.com/blog/2007/06/12/module-pattern/
var VT = {};

VT.settings = function () {
	return {
		USER_IS_MOBILE: false,
		tour_json_path:  "http://oesa-sb.uchicago.edu/vt/json/tour_path.json",
		stops_json_path: "http://oesa-sb.uchicago.edu/vt/json/tour_stops4.json",
		init: function() {
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            	this.USER_IS_MOBILE = true;
        	}
			// console.log("Settings for Virtual Tour");
		}
	};
}();

VT.loader = function () {
	return {
		stop_data: new Array(),
		init: function() {
			// Load Modules
			VT.settings.init();
			VT.displayManager.init();
			VT.mapManager.init();
			VT.markerManager.init();
			VT.locationServices.init();
			VT.tourManager.init();
			VT.stopManager.init();
			VT.infoBoxManager.init();
			google.maps.event.addListenerOnce(VT.mapManager.map, 'bounds_changed', function() {
				VT.stopManager.updateSelectedMarker(VT.stopManager.stop_markers[0]);
				if (!VT.settings.USER_IS_MOBILE) {
					VT.displayManager.updateVideoDisplay();
				}
			});
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
		// Public function for getting icon
		getIcon: function (icon_kind) {
			return icons[icon_kind];
		},
		init: function() {
			// console.log("loaded markerManager");
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
			// console.log("tracking location");
		} else {
			// console.log("not tracking location (outside of bounds)");
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
        	if (VT.settings.USER_IS_MOBILE) {
                if (navigator.geolocation) {
                	navigator.geolocation.getCurrentPosition(
                		displayAndWatchCurrentLocation, null, geo_options
                	);
                }
            }
        	// console.log("loaded locationServices");
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
			// console.log("loaded tourManager");
		}
	};
}();

VT.stopManager = function ($) {
	var loadStopJSON, loadStopMarkers, updateSelectedMarker, nextStopMarker,
	previousStopMarker;

	// Asynchronously Load the Tour Path Data from its JSON file
	loadStopJSON = function (json_file) {
		var stop_json_data, request;
		request = new XMLHttpRequest();
        request.open("GET", json_file, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // After loading, set the Tour Data to the parsed JSON data
                stop_json_data = JSON.parse(request.responseText);
                // Save stop data to loader module for use by displayManager
                VT.loader.stop_data = stop_json_data;
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

			// Add click event in closure per 
			// (http://stackoverflow.com/questions/8909652/adding-click-event-listeners-in-loop)
			(function (marker) {
				google.maps.event.addListener(marker, 'click', function() {
				    // if clicked marker is already selected, open display
				    if (VT.stopManager.selected_marker == this){
				    	VT.displayManager.openDisplay();
				    }
				    // Set selected marker to clicked marker
					updateSelectedMarker(this);
				});
			})(marker);

			// Add hover events only if user is not on mobile (has a mouse)
			if (!VT.settings.USER_IS_MOBILE) {
				(function (marker) {
					google.maps.event.addListener(marker, 'mouseover', function() {
						VT.infoBoxManager.updateMouseoverInfoBox(this, "on");
					});
					google.maps.event.addListener(marker, 'mouseout', function() {
						VT.infoBoxManager.updateMouseoverInfoBox(this, "off");
					});
				})(marker);
			}

			VT.stopManager.stop_markers.push(marker);
		}
	};

	updateSelectedMarker = function (marker) {
		// If there is a marker already selected, unselect it.
		if (VT.stopManager.selected_marker != null) {
			VT.stopManager.selected_marker.setIcon(VT.markerManager.getIcon("unselected"));
		}

		// If a marker instance is passed to this function, set some things
		if (marker != null) {
			VT.stopManager.selected_marker = marker;
			VT.displayManager.updateTitle();
			marker.setIcon(VT.markerManager.getIcon("selected"));
			VT.mapManager.panToMarker(marker);
			VT.infoBoxManager.updateClickInfoBox(marker);
			VT.displayManager.engageControls();

			// If the display is active, refresh it on new marker selection
			if (VT.displayManager.display_state == true) {
				VT.displayManager.updateDisplay();
			}
		}

		if (marker == null) {
			VT.stopManager.selected_marker = null;
			VT.infoBoxManager.updateClickInfoBox(null);
			VT.displayManager.toggleButton();
			VT.displayManager.disengageControls();
		}

		// Update the Title regardless
		VT.displayManager.updateTitle();
	};

	nextStopMarker = function (marker) {
		var index, nextMarker;
		index = VT.stopManager.stop_markers.indexOf(marker);
		if ( index >= 0 && index < (VT.stopManager.stop_markers.length - 1)) {
			nextMarker = VT.stopManager.stop_markers[index + 1];
		}
		// If at the end, loop to beginning
		if ( index == VT.stopManager.stop_markers.length - 1) {
			nextMarker = VT.stopManager.stop_markers[0];
		}
		updateSelectedMarker(nextMarker);
	};

	previousStopMarker = function (marker) {
		var index, previousMarker;
		index = VT.stopManager.stop_markers.indexOf(marker);
		if ( index <= (VT.stopManager.stop_markers.length - 1) && index > 0) {
			previousMarker = VT.stopManager.stop_markers[index - 1];
		}
		// If at the beginning, loop to end
		if ( index == 0) {
			previousMarker = VT.stopManager.stop_markers[VT.stopManager.stop_markers.length - 1];
		}
		updateSelectedMarker(previousMarker);
	};

	return {
		stop_markers: new Array(),
		selected_marker: null,
		updateSelectedMarker: function(marker) {
			updateSelectedMarker(marker);
		},
		nextStopMarker: function(marker) {
			nextStopMarker(marker);
		},
		previousStopMarker: function(marker) {
			previousStopMarker(marker);
		},
		init: function() {
			loadStopJSON(VT.settings.stops_json_path);
			// console.log("loaded stopManager");
		}
	};
}();

VT.infoBoxManager = function () {
	var mouseoverInfoBox, clickInfoBox;

	// Set the InfoBox for both the mouseover and click boxes
	// Requires InfoBox.js
	mouseoverInfoBox = new InfoBox({
		content: '',
		boxClass: "stop-info-box",
		maxWidth: 0,
		closeBoxURL: "",
		disableAutoPan: true,
		// Pixel offset is assuming width: 130px and padding: 10px
		// for the stop-info-box class
		pixelOffset: new google.maps.Size(-85, 10)
	});

	clickInfoBox = new InfoBox({
		content: '',
		boxClass: "stop-info-box",
		maxWidth: 0,
		closeBoxURL: "",
		disableAutoPan: true,
		// Pixel offset is assuming width: 130px and padding: 10px
		// for the stop-info-box class
		pixelOffset: new google.maps.Size(-85, 10)
	});

	return {
		updateMouseoverInfoBox: function (marker, state) {
        	if (state == "on"){
        		mouseoverInfoBox.setContent(marker.html);
        		mouseoverInfoBox.open(VT.mapManager.map, marker)
        	}
        	if (state == "off"){
        		mouseoverInfoBox.close()
        	}
        },
        updateClickInfoBox: function (marker) {
			//Close previous ClickInfoBox
			clickInfoBox.close();

            //If functin is passed an actual marker, update to it
            if (marker != null){
            	clickInfoBox.setContent(marker.html);
            	clickInfoBox.open(VT.mapManager.map, marker)
            }
        },
		init: function() {
			// console.log("Loaded infoBoxManager");
		}
	};
}();

VT.mapManager = function () {
    "use strict";

    var panToMarker, offsetLatlng, addClickEvents, MY_MAPTYPE_ID, mapOptions,
    featureOpts, styledMapOptions;

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

    panToMarker = function (marker) {
    	var container_height;
    	container_height = document.getElementById('map-container').clientHeight;
		//If the top bar is open, should pan to under. If not, should pan to center.
		//Offset target Latlng point by 1/4 of the height of the viewport
		VT.mapManager.map.panTo(offsetLatlng(marker.position,0,(-(container_height/4))));
	};
		
	//Function used to offset target Latlng by pixels
	offsetLatlng = function (targetlatlng,offsetxpixels,offsetypixels) {
		var scale, nw, worldCoordinateCenter, pixelOffset,
		worldCoordinateNewCenter, newLatlng;
		// latlng is the apparent centre-point
		// offsetx is the distance you want that point to move to the right, in pixels
		// offsety is the distance you want that point to move upwards, in pixels
		// offset can be negative
		// offsetx and offsety are both optional
		
		scale = Math.pow(2, VT.mapManager.map.getZoom());
		nw = new google.maps.LatLng(
			VT.mapManager.map.getBounds().getNorthEast().lat(),
			VT.mapManager.map.getBounds().getSouthWest().lng()
			);
		
		worldCoordinateCenter = VT.mapManager.map.getProjection().fromLatLngToPoint(targetlatlng);
		pixelOffset = new google.maps.Point((offsetxpixels/scale) || 0,(offsetypixels/scale) ||0)
		
		worldCoordinateNewCenter = new google.maps.Point(
			worldCoordinateCenter.x - pixelOffset.x,
			worldCoordinateCenter.y + pixelOffset.y
			);
		
		newLatlng = VT.mapManager.map.getProjection().fromPointToLatLng(worldCoordinateNewCenter);
		
		return newLatlng;
	};

	addClickEvents = function () {
		// Close display and deselect marker when user clicks map
		google.maps.event.addListener(VT.mapManager.map, "click", function() {
			// Close Display
           	VT.displayManager.closeDisplay();
           	// Pause Video
           	$("#youtube-player-container").tubeplayer("pause");
           	// Unselect Markers
            VT.stopManager.updateSelectedMarker(null);
            });
	};
    
    return {
    	map: null,
    	increaseZoom: function () {
    		this.map.setZoom(this.map.getZoom()+1);
    	},
    	decreaseZoom: function () {
    		this.map.setZoom(this.map.getZoom()-1);
    	},
    	panToMarker: function (marker) {
    		panToMarker(marker);
    	},
        init: function() {
        	this.map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);
            var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
            this.map.mapTypes.set(MY_MAPTYPE_ID, customMapType);
            addClickEvents();
            // console.log("loaded mapManager");
        }
    };
}();

VT.displayManager = function () {
	var getElements, updateTitle, toggleDisplay, closeDisplay, openDisplay, setDisplay, updateDisplay,
	updateVideoDisplay, updateImageDisplay, updateInfoDisplay, toggleButton, engageControls, disengageControls,
	addClickEvents, map_container, main_controls, control_title, display_controls, video_display,
	image_display, info_display, youtube_player, slideShow, toggle_button, control_engagement,
	next_video_window;

	getElements = function () {
		map_container = document.getElementById("map-container");
		main_controls = document.getElementById("main-controls-container");
		control_title = document.getElementById("control-bar-title-container");
        display_container = document.getElementById("display-container");
        video_display = document.getElementById('video-display');
        image_display = document.getElementById('image-display');
        info_display = document.getElementById('info-display');
        youtube_player = document.getElementById('youtube-player-container');
        slideShow = document.getElementById("cycle-slideshow-div");
        toggle_button = document.getElementById("toggle-btn");
        control_engagement = document.getElementById('control-bar-menu');
        next_video_window = document.getElementById('next-video-window');
	};

	updateTitle = function () {
		var index;
		if (VT.stopManager.selected_marker != null) {
			index = VT.stopManager.stop_markers.indexOf(
				VT.stopManager.selected_marker
			);
			control_title.innerHTML = VT.loader.stop_data[index].marker.title;
		} else {
			control_title.innerHTML = "Select a stop on the map";
		}
	};
	
	toggleDisplay = function () {
		if (VT.displayManager.display_state == false) {
			display_container.style["display"] = "inherit";
			VT.displayManager.display_state = true;
			VT.displayManager.updateDisplay();
			toggleButton();
			return;
		}
		if  (VT.displayManager.display_state == true) {
			display_container.style["display"] = "none";
			VT.displayManager.display_state = false;
			// pause the video if it's playing
			$("#youtube-player-container").tubeplayer("pause");
			toggleButton();
			return;
		}
	};

	closeDisplay = function () {
		display_container.style["display"] = "none";
		VT.displayManager.display_state = false;
	};
	
	openDisplay = function () {
    	setDisplay(VT.displayManager.current_display);
	}

	setDisplay = function(display_mode) {
		// Anytime setDisplay is called,
		// close the next-video-window
		VT.displayManager.removeNextVideoWindow();
		// Anytime setDisplay is called,
		// pause the video if it's playing
		$("#youtube-player-container").tubeplayer("pause");

		if (VT.displayManager.display_state == false) {
			display_container.style["display"] = "inherit";
			VT.displayManager.display_state = true;
		}
		info_display.style["display"] = "none";
		image_display.style["display"] = "none";
		video_display.style["display"] = "none";

		display_mode.style["display"] = "inherit";
		VT.displayManager.current_display = display_mode;
		toggleButton();
	};

	updateDisplay = function () {
		if (VT.displayManager.current_display == info_display) {
			updateInfoDisplay();
		}
		if (VT.displayManager.current_display == image_display) {
			updateImageDisplay();
		}
		if (VT.displayManager.current_display == video_display) {
			updateVideoDisplay();
		} 
	};

	updateVideoDisplay = function () {
		var index;
		if (VT.stopManager.selected_marker != null) {
			index = VT.stopManager.stop_markers.indexOf(
				VT.stopManager.selected_marker
			);
			$("#youtube-player-container").tubeplayer("cue", VT.loader.stop_data[index].video);
			setDisplay(video_display);
			$('#control-bar-menu > li').removeClass('active');
			$($('#video-btn').addClass('active'));
		}
	};

	updateImageDisplay = function () {
		var index, newSlide;
		if (VT.stopManager.selected_marker != null) {
			index = VT.stopManager.stop_markers.indexOf(
				VT.stopManager.selected_marker
			);
			// Remove previous Slides
			while (slideShow.firstChild) {
            	slideShow.removeChild(slideShow.firstChild);
            }
            // Reinitialize the Slideshow
			$(slideShow).cycle('reinit');
			// Add new slides
			for (var i = 0; i < VT.loader.stop_data[index].images.length; i++) {
				newSlide = document.createElement("img");
				newSlide.src = VT.loader.stop_data[index].images[i].image.image_url;
				newSlide.alt = VT.loader.stop_data[index].images[i].image.image_caption;
				$(slideShow).cycle('add', newSlide);
			}
			setDisplay(image_display);
			$('#control-bar-menu > li').removeClass('active');
			$($('#image-btn').addClass('active'));
		}
	};

	updateInfoDisplay = function () {
		var index;
		if (VT.stopManager.selected_marker != null) {
			index = VT.stopManager.stop_markers.indexOf(
				VT.stopManager.selected_marker
			);
			info_display.innerHTML = "<p>"+VT.loader.stop_data[index].info+"</p>";
			setDisplay(info_display);
			$('#control-bar-menu > li').removeClass('active');
			$($('#info-btn').addClass('active'));
		}
	};

	// function to change the button image on toggle
	toggleButton = function () {
		if (VT.displayManager.display_state == true) {
			toggle_button.className = ""
		}
		if (VT.displayManager.display_state == false) {
			toggle_button.className = "toggle-open"
		}
	};

	engageControls = function () {
		control_engagement.className = "engaged";
	};

	disengageControls = function () {
		control_engagement.className = "";
	};

	addClickEvents = function () {
		var video_button, image_button, info_button, next_button,
		increase_zoom_button, decrease_zoom_button, next_video_button, play_again_button;

		video_button = document.getElementById("video-btn");
		image_button = document.getElementById("image-btn");
		info_button = document.getElementById("info-btn");
		next_button = document.getElementById("next-btn");
		increase_zoom_button = document.getElementById("inc-zoom-btn");
		decrease_zoom_button = document.getElementById("dec-zoom-btn");
		next_video_button = document.getElementById("next-video-btn");
		play_again_button = document.getElementById("watch-again-btn");

		video_button.onclick = function () {
			updateVideoDisplay();
		};
		image_button.onclick = function () {
			updateImageDisplay();
		};
		info_button.onclick = function () {
			updateInfoDisplay();
		};
		next_button.onclick = function () {
			VT.stopManager.nextStopMarker(VT.stopManager.selected_marker);
		};
		toggle_button.onclick = function () {
			// disable toggle button if no marker is selected
			if (VT.stopManager.selected_marker) {
				toggleDisplay();
			}
		};
		increase_zoom_button.onclick = function () {
			VT.mapManager.increaseZoom();
		};
		decrease_zoom_button.onclick = function () {
			VT.mapManager.decreaseZoom();
		};
		play_again_button.onclick = function () {
			$("#youtube-player-container").tubeplayer("play");
			VT.displayManager.removeNextVideoWindow();
		};
		next_video_button.onclick = function () {
			VT.stopManager.nextStopMarker(VT.stopManager.selected_marker);
			VT.displayManager.removeNextVideoWindow();
		};
	};

	return {
		display_state: false,
		current_display: null,
		updateTitle: function() {
			updateTitle();
		},
		updateVideoDisplay: function() {
			updateVideoDisplay();
		},
		updateDisplay: function() {
			updateDisplay();
		},
		closeDisplay: function() {
			closeDisplay();
		},
		openDisplay: function() {
    		openDisplay();
		},
		toggleButton: function() {
			toggleButton();
		},
		engageControls: function() {
			engageControls();
		},
		disengageControls: function() {
			disengageControls();
		},
		removeNextVideoWindow: function () {
			next_video_window.style["display"] = "none";
		},
		init: function() {
			getElements();
			$("#youtube-player-container").tubeplayer({
                initialVideo: "6AYafYVqIOY", // the video that is loaded into the player
                preferredQuality: "default",// preferred quality: default, small, medium, large, hd720
                onPlayerEnded: function(){
                	next_video_window.style["display"] = "inherit";
                },
            });
            addClickEvents();
			// console.log("loaded displayManager")
		}
	};
}();
