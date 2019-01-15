const RECT_SIDE = 100;

let map;
let rectangle;
let capturing = false;
let centers;

function renderMap(botLeft, topRight, zoom=15, showBounds=false) {
  if(!botLeft)
    botLeft = new google.maps.LatLng('12.654328102965474', '75.6774215488233');
  if(!topRight)
    topRight = new google.maps.LatLng('12.67496675013949', '75.71887381374836');

  const center = google.maps.geometry.spherical.interpolate(
    botLeft,
    topRight,
    0.5
  );

  map = new google.maps.Map(document.getElementById('map'), {
    center: center,
    zoom: zoom,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    mapTypeControl: false,
    zoomControl: false,
    streetViewControl: false
  });

  // 12.67496675013949, 75.71887381374836
  // 12.654328102965474, 75.6774215488233
  const bounds = new google.maps.LatLngBounds(botLeft, topRight);

  if(showBounds) {
    // Define the rectangle and set its editable property to true.
    rectangle = new google.maps.Rectangle({
      bounds: bounds,
      editable: true,
      draggable: true,
      strokeColor: "#a32020",
      fillOpacity: 0
    });
    rectangle.setMap(map);
    infoWindow = new google.maps.InfoWindow();
    rectangle.addListener('bounds_changed', (event) => {
      const ne = rectangle.getBounds().getNorthEast();
      const sw = rectangle.getBounds().getSouthWest();

      const contentString = '<b>Rectangle moved.</b><br>' +
          'New north-east corner: ' + ne.lat() + ', ' + ne.lng() + '<br>' +
          'New south-west corner: ' + sw.lat() + ', ' + sw.lng();

      // Set the info window's content and position.
      infoWindow.setContent(contentString);
      infoWindow.setPosition(ne);
      infoWindow.open(map);
    });
  }
  return {
    botLeft,
    topRight
  };
}

function calcTiles(botLeft, topRight, show=false) {
  const centers = [];
  const topLeft = new google.maps.LatLng(topRight.lat(), botLeft.lng());
  const maxLatOffset = google.maps.geometry.spherical.computeDistanceBetween(
    topLeft,
    botLeft
  );
  const maxLngOffset = google.maps.geometry.spherical.computeDistanceBetween(
    topLeft,
    topRight
  );

  for(let latOffset = RECT_SIDE; latOffset <= maxLatOffset; latOffset += RECT_SIDE) {
    for(let lngOffset = RECT_SIDE; lngOffset <= maxLngOffset; lngOffset += RECT_SIDE) {
      const top = google.maps.geometry.spherical.computeOffset(
        topLeft,
        latOffset - RECT_SIDE,
        180 // SOUTH
      ).lat();
      const bottom = google.maps.geometry.spherical.computeOffset(
        topLeft,
        latOffset,
        180 // NORTH
      ).lat();
      const right = google.maps.geometry.spherical.computeOffset(
        topLeft,
        lngOffset,
        90 // EAST
      ).lng();
      const left = google.maps.geometry.spherical.computeOffset(
        topLeft,
        lngOffset - RECT_SIDE,
        90 // EAST
      ).lng();
      // console.log(latOffset, lngOffset, top, right, bottom, left)
      if(show) {
        let rectangle = new google.maps.Rectangle({
          bounds: {
            north: top,
            east: right,
            south: bottom,
            west: left
          },
          fillOpacity: 0,
          strokeColor: 'yellow'
        });
        rectangle.setMap(map);
      }
      const rectCenter = new google.maps.LatLng(
        (top + bottom) / 2,
        (left + right) / 2
      );
      centers.push(rectCenter);
    }
  }
  return centers;
}

function onMapReady() {
  const btnRender = document.getElementById("btnRender");
  const btnUpdate = document.getElementById("btnUpdate");
  const btnStart = document.getElementById("btnStart");
  const btnEndSession = document.getElementById("btnEndSession");
  const zoomLevel = document.getElementById("zoomLevel");
  const mapType = document.getElementById("mapType");

  let centers = [];

  btnRender.addEventListener("click", () => {
    const lat1 = document.getElementById("botLeftLat").value;
    const lng1 = document.getElementById("botLeftLng").value;
    const lat2 = document.getElementById("topRightLat").value;
    const lng2 = document.getElementById("topRightLng").value;
    const zoom = document.getElementById("initZoom").value;
    const showBounds = document.getElementById("showBounds").checked;
    const points = renderMap(
      new google.maps.LatLng(lat1, lng1),
      new google.maps.LatLng(lat2, lng2),
      parseInt(zoom, 10),
      showBounds
    );
    centers = calcTiles(points.botLeft, points.topRight, showBounds);
    setTimeout(() => {
      window.mapReady = true;
    }, 4000);
  });

  btnUpdate.addEventListener("click", () => {
    map.setZoom(parseInt(zoomLevel.value, 10))
    map.setMapTypeId(google.maps.MapTypeId[mapType.value])
  });

  btnStart.addEventListener("click", () => {
    capturing = !capturing;
    if(capturing) {
      btnStart.innerHTML = "Stop Capturing";
      centerMap();
    } else {
      btnStart.innerHTML = "Start Capturing";
    }
  });

  btnEndSession.addEventListener("click", () => {
    window.endSession = true;
  });

  let count = 0;
  const centerMap = () => {
    if(count >= centers.length) {
      endSession = true;
      return;
    }
    if(!capturing)
      return;
    console.log(`${count} of ${centers.length}`);
    map.setCenter(centers[count]);
    count++;
    setTimeout(() => {
      if(window.screenshot) {
        screenshot(count);
      }
    }, 2000);
    setTimeout(centerMap, 2250);
  };
}
