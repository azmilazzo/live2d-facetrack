// Smoothing variables
let smoothedX = 0;
let smoothedY = 0;
const smoothingFactor = 0.4;
let lastDebugTime = 0;

// ... (Keep initLive2D, initVideo, createIndicator, simulateMouseMove functions unchanged)

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
      // ... (unchanged ready callback)
    },
    callbackTrack: function(detectState) {
      try {
        const now = Date.now();
        const video = document.getElementById('video');

        // 1. Log video dimensions
        if (now - lastDebugTime > 1000) { // Throttle logs
          console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight);
          lastDebugTime = now;
        }

        // 2. Log full detection state
        console.log('Detection state:', {
          detected: detectState.detected,
          isDetected: detectState.isDetected,
          landmarksCount: detectState.landmarks?.length || 0,
          hasNose: !!detectState.expressions?.nose
        });

        // 3. Confidence checks
        const confidenceThreshold = 0.3;
        if (detectState.detected < confidenceThreshold) {
          console.warn('Low confidence:', detectState.detected);
          // ... (rest of confidence handling)
          return;
        }

        // 4. Landmark processing
        if (detectState.landmarks) {
          console.log('First 5 landmarks:', detectState.landmarks.slice(0, 5));
          
          // ... (rest of landmark processing)

          if (noseLandmark) {
            // 5. Raw coordinate logging
            console.log('Raw nose coordinates:', noseLandmark);
            
            // ... (coordinate conversion and smoothing)

            // 6. Final coordinates
            console.log('Smoothed coordinates:', smoothedX, smoothedY);
          }
        }
      } catch (error) {
        // ... (error handling)
      }
    }
  });
}

// ... (Keep main function and event listener)
