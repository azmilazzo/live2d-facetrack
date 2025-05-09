function initLive2D() {
  // Initialize Live2D widget
  L2Dwidget.init({
    model: {
      jsonPath: 'https://unpkg.com/live2d-widget-model-shizuku @1.0.5/assets/shizuku.model.json',
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
      opacityOnHover: 1
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

// Create a visual indicator
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

  // Create text indicator
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

  // Add debug points container
  const debugPoints = document.createElement('div');
  debugPoints.id = 'debugPoints';
  document.body.appendChild(debugPoints);

  return { indicator, textIndicator, debugPoints };
}

// Function to dispatch a mousemove event
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
  console.log("Starting face tracking...");

  WebARRocksFaceDebugHelper.init({
    spec: {
      NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face @latest/neuralNets/NN_FACE_DETECTOR_68.json',
      minDetectionConfidence: 0.1,
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
        // Update status text
        if (!detectState.detected) {
          textIndicator.innerHTML = 'Face tracking: No face detected';
          textIndicator.style.color = 'orange';
          indicator.style.display = 'none';
          debugPoints.innerHTML = '';
          return;
        }

        textIndicator.innerHTML = 'Face tracking: Active';
        textIndicator.style.color = 'lime';

        // Log detection state
        console.log("Detection state:", detectState);
        
        // Visualize all landmarks
        if (detectState.landmarks) {
          debugPoints.innerHTML = '';
          
          // Show ALL landmarks (68 for this model)
          detectState.landmarks.forEach((point, i) => {
            const debugPoint = document.createElement('div');
            debugPoint.style.position = 'absolute';
            debugPoint.style.width = '5px';
            debugPoint.style.height = '5px';
            debugPoint.style.backgroundColor = 'blue';
            debugPoint.style.borderRadius = '50%';
            debugPoint.style.zIndex = '999';
            debugPoint.style.left = point[0] + 'px';
            debugPoint.style.top = point[1] + 'px';
            debugPoint.style.transform = 'translate(-50%, -50%)';
            debugPoint.title = `Landmark ${i}`;
            debugPoints.appendChild(debugPoint);
          });

          // Use correct nose landmark index (33 for 68-point model)
          const NOSE_LANDMARK_INDEX = 33;
          if (detectState.landmarks.length > NOSE_LANDMARK_INDEX) {
            const noseLandmark = detectState.landmarks[NOSE_LANDMARK_INDEX];
            
            // Update indicator
            indicator.style.display = 'block';
            indicator.style.left = noseLandmark[0] + 'px';
            indicator.style.top = noseLandmark[1] + 'px';
            
            // Update text
            textIndicator.innerHTML = `Face tracking: Active (Nose X: ${noseLandmark[0].toFixed(0)}, Y: ${noseLandmark[1].toFixed(0)})`;
            
            // Simulate mouse movement
            simulateMouseMove(noseLandmark[0], noseLandmark[1]);
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
  console.log("Main function called");
  WebARRocksResizer.size_canvas({
    canvasId: 'WebARRocksFaceCanvas',
    callback: start
  });
}

window.addEventListener('load', main);
