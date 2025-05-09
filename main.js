// Smoothing variables
let smoothedX = 0;
let smoothedY = 0;
const smoothingFactor = 0.4; // Adjust between 0.1 (very smooth) to 0.8 (responsive)

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
      mouse: true
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
    callbackTrack: function(detectState) {
      try {
        const video = document.getElementById('video');
        if (!video.videoWidth || !video.videoHeight) return;

        // Dynamic confidence threshold
        const confidenceThreshold = 0.4;
        if (detectState.detected < confidenceThreshold) {
          textIndicator.innerHTML = 'Face tracking: No face detected';
          textIndicator.style.color = 'orange';
          indicator.style.display = 'none';
          debugPoints.innerHTML = '';
          smoothedX = smoothedY = 0; // Reset smoothing
          return;
        }

        textIndicator.innerHTML = 'Face tracking: Active';
        textIndicator.style.color = 'lime';

        if (detectState.landmarks) {
          debugPoints.innerHTML = '';
          let noseLandmark = null;
          const NOSE_INDICES = [30, 1, 5, 34];

          for (let i = 0; i < detectState.landmarks.length; i++) {
            const point = detectState.landmarks[i];
            const mirroredX = video.videoWidth - point[0];

            // Debug points
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

            if (NOSE_INDICES.includes(i) && !noseLandmark) {
              noseLandmark = [mirroredX, point[1]];
            }
          }

          if (noseLandmark) {
            // Convert to screen coordinates with validation
            const screenX = (noseLandmark[0] / video.videoWidth) * window.innerWidth;
            const screenY = (noseLandmark[1] / video.videoHeight) * window.innerHeight;

            // Apply smoothing
            smoothedX = smoothingFactor * screenX + (1 - smoothingFactor) * smoothedX;
            smoothedY = smoothingFactor * screenY + (1 - smoothingFactor) * smoothedY;

            // Update display
            indicator.style.display = 'block';
            indicator.style.left = smoothedX + 'px';
            indicator.style.top = smoothedY + 'px';
            
            textIndicator.innerHTML = `Face tracking: Active (Nose X: ${smoothedX.toFixed(0)}, Y: ${smoothedY.toFixed(0)})`;
            simulateMouseMove(smoothedX, smoothedY);
          }
        }
      } catch (error) {
        console.error("Error in tracking callback:", error);
        textIndicator.innerHTML = `Error: ${error.message}`;
        textIndicator.style.color = 'red';
      }
    }
  });
}

function main() {
  WebARRocksResizer.size_canvas({
    canvasId: 'WebARRocksFaceCanvas',
    callback: start
  });
}

window.addEventListener('load', main);
