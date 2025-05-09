function initLive2D() {
  L2Dwidget.init({
    model: {
      jsonPath: 'https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json',
    },
    display: {
      position: 'center',
      width: window.innerWidth,
      height: window.innerHeight,
      hOffset: 0,
      vOffset: 0,
    },
    mobile: {
      show: true,
      scale: 1,
      motion: true
    },
    react: {
      opacityDefault: 1,
      opacityOnHover: 1,
      mouse: true // Explicit mouse tracking enabled
    }
  });
}

function initVideo() {
  const video = document.getElementById('video');
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      console.log("Video initialized successfully");
    })
    .catch((err) => {
      console.error("Error accessing webcam: " + err);
    });
}

function createIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'noseIndicator';
  indicator.style.position = 'absolute';
  indicator.style.width = '20px';
  indicator.style.height = '20px';
  indicator.style.backgroundColor = 'red';
  indicator.style.borderRadius = '50%';
  indicator.style.zIndex = '1000';
  indicator.style.pointerEvents = 'none';
  indicator.style.transform = 'translate(-50%, -50%)';
  document.body.appendChild(indicator);
  
  const textIndicator = document.createElement('div');
  textIndicator.id = 'trackingStatus';
  textIndicator.style.position = 'absolute';
  textIndicator.style.top = '10px';
  textIndicator.style.left = '10px';
  textIndicator.style.color = 'white';
  textIndicator.style.fontFamily = 'Arial, sans-serif';
  textIndicator.style.zIndex = '1000';
  textIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
  textIndicator.style.padding = '5px';
  textIndicator.innerHTML = 'Face tracking: Waiting...';
  document.body.appendChild(textIndicator);
  
  const debugPoints = document.createElement('div');
  debugPoints.id = 'debugPoints';
  document.body.appendChild(debugPoints);
  
  return { indicator, textIndicator, debugPoints };
}

function simulateMouseMove(x, y) {
  const event = new MouseEvent('mousemove', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  });
  document.dispatchEvent(event);
}

function start() {
  const { indicator, textIndicator, debugPoints } = createIndicator();
  const video = document.getElementById('video');
  
  console.log("Starting face tracking...");
  
  WebARRocksFaceDebugHelper.init({
    spec: {
      NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@latest/neuralNets/NN_AUTOBONES_21.json',
      videoSettings: {
        facingMode: 'user'
      }
    },
    callbackReady: function(err, spec) {
      if (err) {
        console.error('An error occurred:', err);
        textIndicator.innerHTML = 'Face tracking: Error initializing';
        textIndicator.style.color = 'red';
        return;
      }
      console.log("WebAR.rocks.face is ready!");
      textIndicator.innerHTML = 'Face tracking: Ready (waiting for face)';
      textIndicator.style.color = 'yellow';
      initLive2D();
      initVideo();
    },
// ... (Keep all previous code until the callbackTrack function)

callbackTrack: function(detectState) {
  try {
    // Added video dimension validation
    const video = document.getElementById('video');
    if (!video.videoWidth || !video.videoHeight) {
      console.warn('Video dimensions not ready yet');
      return;
    }

    // Dynamic confidence threshold
    const confidenceThreshold = 0.4; // Lowered further if needed
    if (detectState.detected < confidenceThreshold) {
      textIndicator.innerHTML = 'Face tracking: No face detected';
      textIndicator.style.color = 'orange';
      indicator.style.display = 'none';
      debugPoints.innerHTML = '';
      return;
    }

    textIndicator.innerHTML = 'Face tracking: Active';
    textIndicator.style.color = 'lime';

    if (detectState.landmarks) {
      debugPoints.innerHTML = '';
      let noseLandmark = null;

      // Debug: Log all landmarks
      console.log('Landmarks:', detectState.landmarks);

      // Try alternative nose indices
      const NOSE_INDICES = [30, 1, 5, 34]; // Common nose tip indices
      
      for (let i = 0; i < detectState.landmarks.length; i++) {
        const point = detectState.landmarks[i];
        const mirroredX = video.videoWidth - point[0];

        // Create debug points
        const debugPoint = document.createElement('div');
        debugPoint.style.position = 'absolute';
        debugPoint.style.width = '5px';
        debugPoint.style.height = '5px';
        debugPoint.style.backgroundColor = NOSE_INDICES.includes(i) ? 'green' : 'blue';
        debugPoint.style.borderRadius = '50%';
        debugPoint.style.zIndex = '999';
        debugPoint.style.left = mirroredX + 'px';
        debugPoint.style.top = point[1] + 'px';
        debugPoint.style.transform = 'translate(-50%, -50%)';
        debugPoint.title = `Landmark ${i}`;
        debugPoints.appendChild(debugPoint);

        // Find first matching nose index
        if (NOSE_INDICES.includes(i) && !noseLandmark) {
          noseLandmark = [mirroredX, point[1]];
        }
      }

      if (noseLandmark) {
        // Add dimension validation
        const validDimensions = video.videoWidth > 0 && video.videoHeight > 0;
        const screenX = validDimensions 
          ? (noseLandmark[0] / video.videoWidth) * window.innerWidth
          : noseLandmark[0];
        
        const screenY = validDimensions
          ? (noseLandmark[1] / video.videoHeight) * window.innerHeight
          : noseLandmark[1];

        console.log('Raw coordinates:', noseLandmark, 'Screen:', screenX, screenY);

        indicator.style.display = 'block';
        indicator.style.left = screenX + 'px';
        indicator.style.top = screenY + 'px';
        
        textIndicator.innerHTML = `Face tracking: Active (Nose X: ${screenX.toFixed(0)}, Y: ${screenY.toFixed(0)})`;
        simulateMouseMove(screenX, screenY);
      }
    }
  } catch (error) {
    console.error("Error in tracking callback:", error);
    textIndicator.innerHTML = `Error: ${error.message}`;
    textIndicator.style.color = 'red';
  }
}

// ... (Rest of the code remains the same)
  });
}

function main() {
  WebARRocksResizer.size_canvas({
    canvasId: 'WebARRocksFaceCanvas',
    callback: start
  });
}

window.addEventListener('load', main);
