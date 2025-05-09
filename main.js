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

function start() {
  WebARRocksFaceDebugHelper.init({
    spec: {
      NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@latest/neuralNets/NN_AUTOBONES_21.json'
    },
    callbackReady: function(err, spec) {
      if (err) {
        console.error('An error occurred:', err);
        return;
      }
      initLive2D();
      initVideo();
    },
    callbackTrack: function(detectState) {
      if (!detectState.detected) {
        return; // No face detected
      }
      
      // Get nose position (point 30 in the landmarks)
      if (detectState.landmarks && detectState.landmarks.length > 30) {
        const nose = detectState.landmarks[30];
        
        // Calculate normalized position (-1 to 1)
        const canvasWidth = document.getElementById('WebARRocksFaceCanvas').width;
        const canvasHeight = document.getElementById('WebARRocksFaceCanvas').height;
        
        // Calculate normalized coordinates (-1 to 1)
        // Note: X is flipped because the camera is mirrored
        const noseX = -1 * (2 * (nose[0] / canvasWidth) - 1);
        const noseY = 2 * (nose[1] / canvasHeight) - 1;
        
        // Apply to Live2D model with appropriate scaling
        const model = L2Dwidget.getModel();
        if (model) {
          // Adjust the multiplier (30) to control sensitivity
          model.setParamFloat('PARAM_ANGLE_X', noseX * 30);
          model.setParamFloat('PARAM_ANGLE_Y', noseY * 30);
          
          // Optional: Add some eye tracking as well
          model.setParamFloat('PARAM_EYE_BALL_X', noseX);
          model.setParamFloat('PARAM_EYE_BALL_Y', noseY);
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
