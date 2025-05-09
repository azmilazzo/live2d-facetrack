// Smoothing variables and system status
let smoothedX = 0;
let smoothedY = 0;
const smoothingFactor = 0.4;
let cameraStream = null;
const systemStatus = {
    camera: 'Not initialized',
    faceTracking: 'Not started',
    lastError: null
};

// Mouse simulation function
function simulateMouseMove(x, y) {
  const event = new MouseEvent('mousemove', {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  });
  document.dispatchEvent(event);
}

// Rest of the code remains the same
function initLive2D() { /* ... */ }
async function initVideo() { /* ... */ }
function createStatusMonitor() { /* ... */ }

function startFaceTracking() {
  systemStatus.faceTracking = 'Initializing';
  
  WebARRocksFaceDebugHelper.init({
    spec: {
      NNCPath: 'https://cdn.jsdelivr.net/gh/WebAR-rocks/WebAR.rocks.face@latest/neuralNets/NN_AUTOBONES_21.json',
      videoSettings: { facingMode: 'user' }
    },
    callbackReady: (err, spec) => {
      if (err) {
        systemStatus.faceTracking = 'Init failed';
        systemStatus.lastError = `Face tracking init error: ${err.message}`;
        console.error(err);
        return;
      }
      systemStatus.faceTracking = 'Ready';
      console.log('Face tracking initialized');
    },
    callbackTrack: (detectState) => {
      try {
        if (!detectState.detected || detectState.detected < 0.4) {
          systemStatus.faceTracking = 'No face detected';
          return;
        }
        
        systemStatus.faceTracking = 'Tracking active';
        const video = document.getElementById('video');
        
        if (detectState.landmarks?.length >= 30) {
          const noseIndex = 30;
          const rawLandmark = detectState.landmarks[noseIndex];
          const mirroredX = video.videoWidth - rawLandmark[0];
          
          const screenX = (mirroredX / video.videoWidth) * window.innerWidth;
          const screenY = (rawLandmark[1] / video.videoHeight) * window.innerHeight;
          
          smoothedX = smoothingFactor * screenX + (1 - smoothingFactor) * smoothedX;
          smoothedY = smoothingFactor * screenY + (1 - smoothingFactor) * smoothedY;
          
          simulateMouseMove(smoothedX, smoothedY); // Now properly defined
        }
      } catch (error) {
        systemStatus.lastError = `Tracking error: ${error.message}`;
        console.error(error);
      }
    }
  });
}

async function main() { /* ... */ }
window.addEventListener('load', main);
