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

  L2Dwidget.on('modelReady', function() {
    const live2dModel = L2Dwidget.getModel();

    WebARRocksFaceExpressionsEvaluator.add_trigger('FACE_TRACKING', {
      threshold: 0.1,
      hysteresis: 0.05,
      onStart: function() {
        console.log('FACE TRACKING START');
      },
      onEnd: function() {
        console.log('FACE TRACKING END');
      },
      onUpdate: function(detectState) {
        const faceX = detectState.x; // Get face position
        const faceY = detectState.y;
        live2dModel.setParamFloat('PARAM_ANGLE_X', faceX * 30); // Update parameters
        live2dModel.setParamFloat('PARAM_ANGLE_Y', faceY * 30);
      }
    });
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
      const faceX = detectState.expressions['FACE_TRACKING'];
      const faceY = detectState.expressions['FACE_TRACKING'];
      L2Dwidget.getModel().setParamFloat('PARAM_ANGLE_X', faceX * 30);
      L2Dwidget.getModel().setParamFloat('PARAM_ANGLE_Y', faceY * 30);
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
