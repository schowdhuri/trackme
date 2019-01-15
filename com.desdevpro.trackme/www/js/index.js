var app = {
  // Application Constructor
  initialize: function() {
    if(typeof(config) === "undefined") {
      throw new Error("No config found");
    }
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    this.renderMap();
  },

  renderMap: function() {
    const mapHolder = document.getElementById("map");
    const topRight = config.topRight;
    const botLeft = config.botLeft;
    const width = config.width;
    const height = config.height;
    const tileCount = config.tileCount;
    const tilePath = config.tilePath;
    const tileName = config.tileName;
    const rows = config.rows;
    const columns = config.columns;

    const markers = [];
    const normalize = val => {
      val = "" + val;
      const parts = val.split(".");
      const zero20 = "00000000000000000000";
      if(!parts[1])
        parts[1] = zero20;
      parts[1] = (parts[1] + zero20).slice(0, 20);
      return parseInt(parts[0] + parts[1]);
    }
    const getScrollPos = () => {
      const doc = document.documentElement;
      const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
      const top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
      return { left, top };
    }
    const latLongToPx = (lat, lng) => {
      const rect = mapHolder.getBoundingClientRect();
      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const scaleX = (normalize(topRight[1]) - normalize(botLeft[1])) / width;
      const scaleY = (normalize(topRight[0]) - normalize(botLeft[0])) / height;
      const x = Math.floor((normalize(lng) - normalize(botLeft[1])) / scaleX);
      const y = Math.floor((normalize(lat) - normalize(botLeft[0])) / scaleY);
      const scrollPos = getScrollPos();
      return {
        x,
        y: rect.bottom + scrollPos.top - y - 24
      };
    };
    const placeMarker = (lat, lng) => {
      const pos = latLongToPx(lat, lng);
      const marker = document.createElement("div");
      marker.className = "marker";
      marker.style.left = `${pos.x}px`;
      marker.style.top = `${pos.y}px`;
      marker.setAttribute("data-lat", lat);
      marker.setAttribute("data-lng", lng);
      document.querySelector(".container").appendChild(marker);
      markers.push(marker);
      return marker;
    };
    const removeMarker = marker => {
      markers = markers.filter(m =>
        !(m.getAttribute("data-lat") === marker.getAttribute("data-lat") &&
        m.getAttribute("data-lng") === marker.getAttribute("data-lng"))
      )
      marker.parentNode.removeChild(marker);
    };
    const updateMarker = marker => {
      const lat = marker.getAttribute("data-lat");
      const lng = marker.getAttribute("data-lng");
      const pos = latLongToPx(lat, lng);
      marker.style.left = `${pos.x}px`;
      marker.style.top = `${pos.y}px`;
    };
    const moveMarker = (marker, lat, lng) => {
      marker.setAttribute("data-lat", lng);
      marker.setAttribute("data-lng", lng);
      const pos = latLongToPx(lat, lng);
      marker.style.left = `${pos.x}px`;
      marker.style.top = `${pos.y}px`;
    };
    const updateMarkers = () => markers.map(updateMarker);

    mapHolder.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    mapHolder.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    mapHolder.style.width = `${width}vw`;
    mapHolder.style.height = `${height}vw`;

    let scale = 1;
    for(let i=1; i<=tileCount; i++) {
      const tile = document.createElement("div");
      tile.className = "tile mirror";
      tile.setAttribute("data-num", i);
      const num = ("0000" + i).slice(-4);
      ((_tile, _num) => {
        setTimeout(() => {
          _tile.style.backgroundImage = `url("${tilePath || "tiles"}/${tileName || "tile"}-${_num}.jpg")`;
        }, 10*i);
      })(tile, num);
      mapHolder.appendChild(tile);
    }
    document.getElementById("zoomin").addEventListener("click", () => {
      if(scale < 16)
        scale = scale * 1.25;
      mapHolder.style.width = `${scale * width}vw`;
      mapHolder.style.height = `${scale * height}vw`;
      updateMarkers();
    });
    document.getElementById("zoomout").addEventListener("click", () => {
      if(scale > 1)
        scale = scale / 1.25;
      mapHolder.style.width = `${scale * width}vw`;
      mapHolder.style.height = `${scale * height}vw`;
      updateMarkers();
    });

    const btnLocateMe = document.getElementById("locateMe");
    const btnShowMyLocation = document.getElementById("showMyLocation");
    let myLocation;
    let watchHandle;
    let watching = false;
    btnLocateMe.addEventListener("click", () => {
      if(!watching) {
        watchHandle = navigator.geolocation.watchPosition(
          pos => {
            if(!myLocation) {
              myLocation = placeMarker(pos.coords.latitude, pos.coords.longitude);
            } else {
              moveMarker(myLocation, pos.coords.latitude, pos.coords.longitude);
            }
            console.log(pos.coords.latitude, pos.coords.longitude);
          },
          err => {},
          { enableHighAccuracy: true }
        );
        btnLocateMe.style.backgroundColor = "#a84263"
        btnLocateMe.style.color = "#fff";
        watching = true;
      } else {
        navigator.geolocation.clearWatch(watchHandle);
        btnLocateMe.style.backgroundColor = ""
        btnLocateMe.style.color = "";
        watching = false;
      }
    });
    btnShowMyLocation.addEventListener("click", () => {
      if(myLocation)
        myLocation.scrollIntoView();
    });
    window.addEventListener("resize", updateMarkers);
    window.addEventListener("orientationchange", updateMarkers);
  },

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: function() {
    this.receivedEvent('deviceready');
  },

  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }
};

app.initialize();
