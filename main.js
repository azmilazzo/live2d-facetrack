function initLive2D() {
  L2Dwidget.init({
    model: {
      jsonPath: 'https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json',
    },
    display: {
      position: 'right',
      width: 150,
      height: 300,
    }
  });

  L2Dwidget.on('modelReady', function() {
    const live2dModel = L2Dwidget.getModel();
    
    WebARRocksFaceExpressionsEvaluator.add_trigger('OPEN_MOUTH', {
      threshold: 0.4,
      hysteresis: 0.05,
      onStart: function() {
        console.log('MOUTH OPEN START');
        live2dModel.motionManager.startMotion('motion', 0, 2); // Example motion
      },
      onEnd: function() {
        console.log('MOUTH OPEN END');
        live2dModel.motionManager.stopAllMotions();
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
      const expressionsValues = WebARRocksFaceExpressionsEvaluator.evaluate_expressions(detectState);
      WebARRocksFaceExpressionsEvaluator.run_triggers(expressionsValues);
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