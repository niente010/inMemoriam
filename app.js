window.addEventListener('load', () => {
  const extent = [
    14.5576,  // minLongitude (OVEST)
    36.4288,  // minLatitude (SUD)
    15.6647,  // maxLongitude (EST)
    37.8435   // maxLatitude (NORD)
  ];
  const transformedExtent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

  const mainLayer = new ol.layer.Image({
    source: new ol.source.ImageStatic({
      url: 'map_modified7.jpg',
      imageExtent: transformedExtent,
      projection: 'EPSG:3857'
    })
  });

  // Stili per i diversi tipi di punti
  const styles = {
    city: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({color: 'rgba(255,255,255)'}),
        stroke: new ol.style.Stroke({color: '#000', width: 2})
      })
    }),
    landmark: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({color: 'rgba(255,255,255)'}),
        stroke: new ol.style.Stroke({color: '#000', width: 2})
      })
    }),
    recording: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({color: 'rgba(255,255,255)'}),
        stroke: new ol.style.Stroke({
          color: '#000',
          width: 2,
          lineDash: [2, 2]
        })
      })
    })
  };

  // Layer punti di interesse
  const pointsSource = new ol.source.Vector({
    url: 'data/points.geojson',
    format: new ol.format.GeoJSON()
  });

  // Debug: log quando i punti vengono caricati
  pointsSource.on('addfeature', function(event) {
    console.log('Punto caricato:', event.feature.getProperties());
  });

  const pointsLayer = new ol.layer.Vector({
    source: pointsSource,
    style: function(feature) {
      return styles[feature.get('type')] || styles.landmark;
    }
  });

  const map = new ol.Map({
    target: 'map',
    layers: [mainLayer, pointsLayer],
    view: new ol.View({
      projection: 'EPSG:3857',
      center: ol.proj.fromLonLat([15.19288667801232, 37.179305076835767]),
      zoom: 11,
      minZoom: 12,
      maxZoom: 14,
      extent: transformedExtent,
      constrainOnlyCenter: false,
      constrainResolution: true,
      smoothExtentConstraint: false,
      enableRotation: false
    })
  });

  // Gestione click sui punti
  map.on('click', function(evt) {
    console.log('Click sulla mappa:', evt.pixel);
    
    let clickedFeature = null;
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      if (layer === pointsLayer) {
        clickedFeature = feature;
        return true; // Stop iterating
      }
    }, {
      hitTolerance: 10,
      layerFilter: function(layer) {
        return layer === pointsLayer;
      }
    });
    
    if (clickedFeature) {
      // Ottieni le proprietà dal GeoJSON
      const properties = clickedFeature.getProperties();
      console.log('Click su punto:', properties); // Debug

      console.log('Preparazione pannello laterale...');
      
      const sidePanel = document.getElementById('sidePanel');
      console.log('SidePanel trovato:', sidePanel);
      
      const pointTitle = document.getElementById('pointTitle');
      const pointDescription = document.getElementById('pointDescription');
      const pointMedia = document.getElementById('pointMedia');
      
      console.log('Elementi trovati:', { pointTitle, pointDescription, pointMedia });
      console.log('Proprietà da inserire:', properties);

      // Aggiorna contenuti pannello
      if (pointTitle) pointTitle.textContent = properties.name || '';
      if (pointDescription) pointDescription.textContent = properties.description || '';

      let mediaHTML = '';
      if (properties.audio_url) {
        mediaHTML += `<audio controls src="${properties.audio_url}"></audio>`;
      }
      if (properties.image_url) {
        mediaHTML += `<img src="${properties.image_url}" alt="${properties.name}">`;
      }
      
      if (pointMedia) pointMedia.innerHTML = mediaHTML;
      
      // Posiziona e mostra pannello
      if (sidePanel) {
        // Salva il punto selezionato
        selectedFeature = clickedFeature;
        
        // Aggiorna posizione pannello
        updatePanelPosition();
        
        console.log('Aggiungo classe visible al pannello');
        sidePanel.classList.add('visible');
      }
      
      // Nascondi story box
      document.getElementById('storyBox').classList.add('hidden');
    }
  });

  // Coordinate overlay
  const coordsDiv = document.createElement('div');
  coordsDiv.className = 'coords-overlay';
  document.body.appendChild(coordsDiv);

  // Variabile per tenere traccia del punto attualmente selezionato
  let selectedFeature = null;

  // Funzione per aggiornare la posizione del pannello
  let rafId = null;
  
  function updatePanelPosition() {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      const sidePanel = document.getElementById('sidePanel');
      if (selectedFeature && sidePanel && sidePanel.classList.contains('visible')) {
        const pixel = map.getPixelFromCoordinate(selectedFeature.getGeometry().getCoordinates());
        const transform = `translate3d(${pixel[0] + 20}px, ${pixel[1] - 20}px, 0)`;
        sidePanel.style.transform = transform;
      }
      rafId = null;
    });
  }

  // Aggiorna posizione pannello durante il movimento della mappa
  map.on('movestart', updatePanelPosition);
  map.on('moveend', updatePanelPosition);
  
  // Aggiorna anche durante il movimento per maggiore fluidità
  map.on('postrender', updatePanelPosition);
  
  // Aggiorna coordinate durante il movimento del mouse
  map.on('pointermove', (evt) => {
    const coords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
    coordsDiv.textContent = `LAT: ${coords[1].toFixed(4)}, LNG: ${coords[0].toFixed(4)}`;
  });

  // Gestione story box
  const btn = document.getElementById('toggleStory');
  const storyBox = document.getElementById('storyBox');

  // Click sul bottone story
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    storyBox.classList.toggle('hidden');
  });

  // Temporaneamente rimosso il click handler per chiudere i pannelli
});