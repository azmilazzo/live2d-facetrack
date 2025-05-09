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
      opacityOnHover: 1
    }
  });
}

function initVideo() {
  const video = document.getElementById('video');
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
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
  indicator.style.width = '10px';
  indicator.style.height = '10px';
  indicator.style.backgroundColor = 'red';
  indicator.style.borderRadius = '50%';
  indicator.style.zIndex = '1000';
  indicator.style.pointerEvents = 'none'; // Make sure it doesn't interfere with clicks
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
  textIndicator.innerHTML = 'Face tracking: Waiting...';
  document.body.appendChild(textIndicator);
  
  return { indicator, textIndicator };
}

function start() {
  const { indicator, textIndicator } = createIndicator();
  
  WebARRocksFaceDebugHelper.init({
    spec: {
      NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@latest/neuralNets/NN_AUTOBONES_21.json'
    },
    callbackReady: function(err, spec) {
      if (err) {
        console.error('An error occurred:', err);
        textIndicator.innerHTML = 'Face tracking: Error initializing';
        textIndicator.style.color = 'red';
        return;
      }
      textIndicator.innerHTML = 'Face tracking: Ready (waiting for face)';
      textIndicator.style.color = 'yellow';
      initLive2D();
      initVideo();
    },
    callbackTrack: function(detectState) {
      if (!detectState.detected) {
        textIndicator.innerHTML = 'Face tracking: No face detected';
        textIndicator.style.color = 'orange';
        indicator.style.display = 'none';
        return;
      }
      
      textIndicator.innerHTML = 'Face tracking: Active';
      textIndicator.style.color = 'lime';
      
      // Get nose position (point 30 in the landmarks)
      if (detectState.landmarks && detectState.landmarks.length > 30) {
        const nose = detectState.landmarks[30];
        
        // Calculate normalized position (-1 to 1)
        const canvasWidth = document.getElementById('WebARRocksFaceCanvas').width;
        const canvasHeight = document.getElementById('WebARRocksFaceCanvas').height;
        
        // Update the visual indicator position
        indicator.style.display = 'block';
        indicator.style.left = nose[0] + 'px';
        indicator.style.top = nose[1] + 'px';
        
        // Calculate normalized coordinates (-1 to 1)
        // Note: X is flipped for mirroring
        const noseX = -1 * (2 * (nose[0] / canvasWidth) - 1);
        const noseY = 2 * (nose[1] / canvasHeight) - 1;
        
        // Show coordinates in the text indicator
        textIndicator.innerHTML = `Face tracking: Active (X: ${noseX.toFixed(2)}, Y: ${noseY.toFixed(2)})`;
        
        // Apply to Live2D model with appropriate scaling
        const model = L2Dwidget.getModel();
        if (model) {
          try {
            // Adjust the multiplier (30) to control sensitivity
            model.setParamFloat('PARAM_ANGLE_X', noseX * 30);
            model.setParamFloat('PARAM_ANGLE_Y', noseY * 30);
            
            // Optional: Add some eye tracking as well
            model.setParamFloat('PARAM_EYE_BALL_X', noseX);
            model.setParamFloat('PARAM_EYE_BALL_Y', noseY);
          } catch (e) {
            console.error('Error updating Live2D parameters:', e);
            textIndicator.innerHTML = 'Error updating Live2D model';
            textIndicator.style.color = 'red';
          }
        }
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
