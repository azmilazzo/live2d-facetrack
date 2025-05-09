// Smoothing variables
let smoothedX = 0;
let smoothedY = 0;
const smoothingFactor = 0.4;
let cameraStream = null;

// System status elements
const systemStatus = {
    camera: 'Not initialized',
    faceTracking: 'Not started',
    lastError: null
};

function initLive2D() {
    try {
        L2Dwidget.init({
            model: {
                jsonPath: 'https://unpkg.com/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json',
            },
            display: {
                position: 'center',
                width: window.innerWidth,
                height: window.innerHeight,
            },
            react: { mouse: true }
        });
        console.log('Live2D initialized successfully');
    } catch (error) {
        systemStatus.lastError = `Live2D init failed: ${error.message}`;
        console.error(systemStatus.lastError);
    }
}

async function initVideo() {
    const video = document.getElementById('video');
    try {
        console.log('Requesting camera access...');
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        video.srcObject = cameraStream;
        systemStatus.camera = 'Active';
        
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                console.log(`Camera resolution: ${video.videoWidth}x${video.videoHeight}`);
                resolve();
            };
        });
        
    } catch (error) {
        systemStatus.camera = 'Error';
        systemStatus.lastError = `Camera access failed: ${error.name} - ${error.message}`;
        console.error(systemStatus.lastError);
        throw error;
    }
}

function createStatusMonitor() {
    const monitor = document.createElement('div');
    monitor.id = 'systemStatus';
    monitor.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        color: white;
        background: rgba(0,0,0,0.7);
        padding: 10px;
        font-family: monospace;
        z-index: 10000;
    `;
    
    function updateStatus() {
        monitor.innerHTML = `
            System Status:<br>
            Camera: ${systemStatus.camera}<br>
            Face Tracking: ${systemStatus.faceTracking}<br>
            ${systemStatus.lastError ? `Last Error: ${systemStatus.lastError}` : ''}
        `;
    }
    
    setInterval(updateStatus, 1000);
    document.body.appendChild(monitor);
    return monitor;
}

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
                    const noseIndex = 30; // Change this if needed
                    const rawLandmark = detectState.landmarks[noseIndex];
                    const mirroredX = video.videoWidth - rawLandmark[0];
                    
                    // Convert to screen coordinates
                    const screenX = (mirroredX / video.videoWidth) * window.innerWidth;
                    const screenY = (rawLandmark[1] / video.videoHeight) * window.innerHeight;
                    
                    // Apply smoothing
                    smoothedX = smoothingFactor * screenX + (1 - smoothingFactor) * smoothedX;
                    smoothedY = smoothingFactor * screenY + (1 - smoothingFactor) * smoothedY;
                    
                    // Update mouse position
                    simulateMouseMove(smoothedX, smoothedY);
                }
            } catch (error) {
                systemStatus.lastError = `Tracking error: ${error.message}`;
                console.error(error);
            }
        }
    });
}

async function main() {
    try {
        createStatusMonitor();
        await initVideo();
        initLive2D();
        startFaceTracking();
    } catch (error) {
        console.error('Main initialization failed:', error);
    }
}

// Start the application
window.addEventListener('load', main);
