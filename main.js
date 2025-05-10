function initLive2D() {
  L2Dwidget.init({
    model: {
      jsonPath: 'https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json',
    },
    display: {
      position: 'right',
      width: 300,
      height: 500,
      hOffset: 0,
      vOffset: 0,
    },
    mobile: {
      show: true,
      scale: 0.8,
    },
    react: {
      opacityDefault: 1,
      opacityOnHover: 1
    }
  });
}

function start() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('WebARRocksFaceCanvas');
  const ctx = canvas.getContext('2d');

  WebARRocksFace.init({
    canvas: canvas,
    NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@latest/neuralNets/NN_DEFAULT.json',
    callbackReady: function(err) {
      if (err) {
        console.error('Error initializing face tracking:', err);
        return;
      }
      console.log('Face tracking initialized');
      initLive2D();

      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
          video.srcObject = stream;
          video.play();
        })
        .catch(function(err) {
          console.error('Error accessing webcam:', err);
        });
    },
    callbackTrack: function(detectState) {
      if (detectState.detected > 0.8) {  // Increased detection threshold
        const faceCenterX = detectState.landmarks[30][0];
        const faceCenterY = detectState.landmarks[30][1];

        // Normalize coordinates to viewport
        const normalizedX = (faceCenterX / canvas.width) * window.innerWidth;
        const normalizedY = (faceCenterY / canvas.height) * window.innerHeight;

        // Add smoothing
        const smoothingFactor = 0.3;
        let currentX = normalizedX;
        let currentY = normalizedY;

        currentX = currentX * smoothingFactor + normalizedX * (1 - smoothingFactor);
        currentY = currentY * smoothingFactor + normalizedY * (1 - smoothingFactor);

        // Simulate mouse movement
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: currentX,
          clientY: currentY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        document.dispatchEvent(mouseEvent);

        // Visual feedback (optional)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(faceCenterX, faceCenterY, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
}

// Initialize on page load
window.addEventListener('load', function() {
  WebARRocksResizer.size_canvas({
    canvasId: 'WebARRocksFaceCanvas',
    callback: start
  });
});

// Handle window resize
window.addEventListener('resize', function() {
  WebARRocksResizer.size_canvas({
    canvasId: 'WebARRocksFaceCanvas',
    callback: function() {
      console.log('Canvas resized');
    }
  });
});