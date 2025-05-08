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

function init_evaluators() {
  WebARRocksFaceExpressionsEvaluator.add_expressionEvaluator('OPEN_MOUTH', {
    refLandmarks: ["lowerLipBot", "chin"],
    landmarks: ["lowerLipBot", "upperLipTop"],
    range: [0.7, 1.2],
    isInv: false,
    isDebug: true
  });
}

function init_triggers() {
  WebARRocksFaceExpressionsEvaluator.add_trigger('OPEN_MOUTH', {
    threshold: 0.4,
    hysteresis: 0.05,
    onStart: function() {
      console.log('MOUTH OPEN START');
      L2Dwidget.getModel().setParamFloat("PARAM_MOUTH_OPEN_Y", 1.0);
    },
    onEnd: function() {
      console.log('MOUTH OPEN END');
      L2Dwidget.getModel().setParamFloat("PARAM_MOUTH_OPEN_Y", 0.0);
    }
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
      init_evaluators();
      init_triggers();
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