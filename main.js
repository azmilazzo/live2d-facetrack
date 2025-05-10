// main.js

// Smoothing and amplification factors for nose
const smoothingFactor = 0.2;
const amplificationFactor = 1.0;

// Variables to hold smoothed nose position
let prevNoseX = null;
let prevNoseY = null;

// Get the debug canvas 2D context
const debugCanvas = document.getElementById('debugCanvas');
const debugCtx = debugCanvas.getContext('2d');

// Initialize WebAR.rocks face tracker
WEBARROCKSFACE.init({
  canvasId: 'WebARRocksFaceCanvas',
  NNCPath: 'neuralNets/NN_FACE_0.json', // path to the face model JSON
  // Called when the tracker is ready
  callbackReady: function(errCode, spec) {
    if (errCode) {
      console.error('WebAR.rocks initialization error:', errCode);
      return;
    }
    // Set debug canvas to same size as WebAR canvas
    debugCanvas.width = spec.canvasElement.width;
    debugCanvas.height = spec.canvasElement.height;
    console.log('WebAR.rocks face tracker is ready.');
  },
  // Called on each render frame with face detection data
  callbackTrack: function(detectState) {
    // If multiple faces tracked, take the first one
    if (Array.isArray(detectState)) {
      detectState = detectState[0];
    }
    if (!detectState || !detectState.detected) {
      // No face detected: clear debug overlay
      debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
      return;
    }

    // Get landmarks array (list of [x,y] in viewport coords -1..+1)
    const landmarks = detectState.landmarks;

    // Clear previous debug drawings
    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

    // Draw blue debug points for landmarks 27 through 33 (except nose tip in red later)
    for (let i = 27; i <= 33; i++) {
      if (i === 30) continue; // skip nose tip here
      const norm = landmarks[i];
      // Convert from normalized coords to pixel coords
      const px = (norm[0] + 1) * 0.5 * debugCanvas.width;
      const py = (1 - norm[1]) * 0.5 * debugCanvas.height;
      // Draw blue circle
      debugCtx.fillStyle = 'blue';
      debugCtx.beginPath();
      debugCtx.arc(px, py, 4, 0, 2 * Math.PI);
      debugCtx.fill();
    }

    // Handle the nose tip (landmark 30) with smoothing
    const noseNorm = landmarks[30];
    const rawX = (noseNorm[0] + 1) * 0.5 * debugCanvas.width;
    const rawY = (1 - noseNorm[1]) * 0.5 * debugCanvas.height;

    // Initialize previous nose position if null
    if (prevNoseX === null || prevNoseY === null) {
      prevNoseX = rawX;
      prevNoseY = rawY;
    }
    // Smooth the nose movement
    const smoothedX = prevNoseX + (rawX - prevNoseX) * smoothingFactor * amplificationFactor;
    const smoothedY = prevNoseY + (rawY - prevNoseY) * smoothingFactor * amplificationFactor;
    prevNoseX = smoothedX;
    prevNoseY = smoothedY;

    // Draw red circle at smoothed nose position
    debugCtx.fillStyle = 'red';
    debugCtx.beginPath();
    debugCtx.arc(smoothedX, smoothedY, 6, 0, 2 * Math.PI);
    debugCtx.fill();
  }
});
