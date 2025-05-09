// Smoothing variables
let smoothedX = 0;
let smoothedY = 0;
const smoothingFactor = 0.4;
let cameraWorking = false;

function initLive2D() {
  // ... keep previous initLive2D implementation ...
}

function initVideo() {
  console.log('[Camera] Starting camera initialization...');
  const video = document.getElementById('video');
  
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      console.log('[Camera] Got media stream:', stream);
      video.srcObject = stream;
      
      // Add event listeners for video metadata
      video.addEventListener('loadedmetadata', () => {
        console.log('[Camera] Video metadata loaded:');
        console.log('Dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('ReadyState:', video.readyState);
        console.log('Source:', video.srcObject);
        cameraWorking = true;
      });
      
      video.addEventListener('error', (err) => {
        console.error('[Camera] Video error:', err);
        cameraWorking = false;
      });
    })
    .catch((err) => {
      console.error('[Camera] Access error:', err.name, err.message);
      cameraWorking = false;
    });
}

// ... keep createIndicator, simulateMouseMove functions ...

function start() {
  const { indicator, textIndicator, debugPoints } = createIndicator();
  const video = document.getElementById('video');
  
  console.log("[System] Starting face tracking...");
  
  WebARRocksFaceDebugHelper.init({
    spec: {
      NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@latest/neuralNets/NN_AUTOBONES_21.json',
      videoSettings: { facingMode: 'user' }
    },
    callbackReady: function(err, spec) {
      // ... keep previous ready callback ...
    },
    callbackTrack: function(detectState) {
      try {
        console.group('[Frame] Tracking Update');
        
        // 1. Camera diagnostics
        console.log('[Camera] Working:', cameraWorking);
        console.log('[Camera] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('[Camera] Ready state:', video.readyState);
        
        // 2. Detection state analysis
        console.log('[Detection] Confidence:', detectState.detected);
        console.log('[Detection] Is detected:', detectState.isDetected);
        console.log('[Detection] Landmarks count:', detectState.landmarks?.length || 0);
        
        // 3. Raw landmark dump
        if (detectState.landmarks) {
          console.log('[Landmarks] Full array:', detectState.landmarks);
          console.log('[Landmarks] First 10 points:', 
            detectState.landmarks.slice(0, 10).map(p => `${p[0]},${p[1]}`));
        }
        
        // 4. Coordinate processing
        if (detectState.landmarks?.length > 0) {
          const testIndex = 30; // Try different indices here
          const rawX = detectState.landmarks[testIndex][0];
          const rawY = detectState.landmarks[testIndex][1];
          console.log('[Coordinates] Raw (index 30):', rawX, rawY);
          
          if (video.videoWidth > 0) {
            const mirroredX = video.videoWidth - rawX;
            console.log('[Coordinates] Mirrored:', mirroredX, rawY);
            
            const screenX = (mirroredX / video.videoWidth) * window.innerWidth;
            const screenY = (rawY / video.videoHeight) * window.innerHeight;
            console.log('[Coordinates] Converted:', screenX, screenY);
          }
        }
        
        console.groupEnd();
      } catch (error) {
        console.error('[Error] Tracking callback:', error);
      }
    }
  });
}

// ... keep main function and event listener ...
