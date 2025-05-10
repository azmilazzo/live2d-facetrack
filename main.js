let previousX = window.innerWidth / 2;
let previousY = window.innerHeight / 2;

function smoothMovement(currentX, currentY) {
  const smoothingFactor = 0.2;

  if (!isFinite(currentX) || !isFinite(currentY)) {
    return [previousX, previousY]; // fallback to last known good values
  }

  const newX = previousX + (currentX - previousX) * smoothingFactor;
  const newY = previousY + (currentY - previousY) * smoothingFactor;

  previousX = newX;
  previousY = newY;

  return [newX, newY];
}

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
      zIndex: 1
    },
    mobile: {
      show: true,
      scale: 1,
      motion: true
    },
    react: {
      opacityDefault: 1,
      opacityOnHover: 1,
      expression: 'null'
    }
  });
}

function createIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'noseIndicator';
  indicator.className = 'tracking-element';
  indicator.style.width = '20px';
  indicator.style.height = '20px';
  indicator.style.backgroundColor = 'red';
  indicator.style.borderRadius = '50%';
  indicator.style.transform = 'translate(-50%, -50%)';
  indicator.style.left = (window.innerWidth / 2) + 'px';
  indicator.style.top = (window.innerHeight / 2) + 'px';
  document.body.appendChild(indicator);

  const textIndicator = document.createElement('div');
  textIndicator.id = 'trackingStatus';
  textIndicator.className = 'tracking-element';
  textIndicator.style.top = '10px';
  textIndicator.style.left = '10px';
  textIndicator.style.color = 'white';
  textIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
  textIndicator.style.padding = '5px';
  textIndicator.innerHTML = 'Face tracking: Waiting...';
  document.body.appendChild(textIndicator);

  const debugPoints = document.createElement('div');
  debugPoints.id = 'debugPoints';
  debugPoints.className = 'tracking-element';
  document.body.appendChild(debugPoints);

  return { indicator, textIndicator, debugPoints };
}

function simulateMouseMove(x, y) {
  if (!isFinite(x) || !isFinite(y)) return;

  const [smoothX, smoothY] = smoothMovement(x, y);

  const event = new MouseEvent('mousemove', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: smoothX,
    clientY: smoothY
  });
  document.dispatchEvent(event);
}

function start() {
  const { indicator, textIndicator, debugPoints } = createIndicator();

  WebARRocksFaceDebugHelper.init({
    spec: {
      NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@latest/neuralNets/NN_AUTOBONES_21.json',
      videoSettings: {
        facingMode: 'user',
        idealWidth: window.innerWidth,
        idealHeight: window.innerHeight
      },
      stabilizationSettings: {
        translationFactorRange: [0.002, 0.06],
        rotationFactorRange: [0.015, 0.1]
      }
    },
    canvasSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    callbackReady: function(err) {
      if (err) {
        textIndicator.innerHTML = 'Face tracking: Error initializing';
        textIndicator.style.color = 'red';
        return;
      }
      textIndicator.innerHTML = 'Face tracking: Ready';
      textIndicator.style.color = 'yellow';
      initLive2D();
    },
    callbackTrack: function(detectState) {
      if (!detectState.detected) {
        textIndicator.innerHTML = 'Face tracking: No face';
        textIndicator.style.color = 'orange';
        indicator.style.display = 'none';
        debugPoints.innerHTML = '';
        return;
      }

      const landmarks = detectState.landmarks;
      if (!landmarks || !Array.isArray(landmarks) || !landmarks[30]) {
        return;
      }

      textIndicator.innerHTML = 'Face tracking: Active';
      textIndicator.style.color = 'lime';

      debugPoints.innerHTML = '';
      let nose = landmarks[30];

      for (let i = 27; i <= 33; i++) {
        const point = landmarks[i];
        if (!point || point.length !== 2 || !isFinite(point[0]) || !isFinite(point[1])) continue;

        const [x, y] = point;
        const dot = document.createElement('div');
        dot.className = 'tracking-element';
        dot.style.width = '5px';
        dot.style.height = '5px';
        dot.style.borderRadius = '50%';
        dot.style.position = 'absolute';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        dot.style.transform = 'translate(-50%, -50%)';
        dot.style.backgroundColor = (i === 30 ? 'blue' : 'green');
        debugPoints.appendChild(dot);
      }

      if (nose && nose.length === 2 && isFinite(nose[0]) && isFinite(nose[1])) {
        const [smoothX, smoothY] = smoothMovement(nose[0], nose[1]);
        indicator.style.display = 'block';
        indicator.style.left = `${smoothX}px`;
        indicator.style.top = `${smoothY}px`;
        textIndicator.innerHTML = `Tracking: Nose X=${smoothX.toFixed(0)} Y=${smoothY.toFixed(0)}`;
        simulateMouseMove(smoothX, smoothY);
      }
    }
  });
}

function main() {
  WebARRocksResizer.size_canvas({
    canvasId: 'WebARRocksFaceCanvas',
    callback: start,
    overSamplingFactor: 1.0,
    isFullScreen: true,
    sizeMode: 'fullscreen'
  });
}

window.addEventListener('load', main);
