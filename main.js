let previousX = window.innerWidth / 2;
let previousY = window.innerHeight / 2;

function smoothMovement(currentX, currentY) {
    const smoothingFactor = 0.3;
    const amplificationFactor = 5.0;
    
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    const amplifiedX = screenCenterX + (currentX - screenCenterX) * amplificationFactor;
    const amplifiedY = screenCenterY + (currentY - screenCenterY) * amplificationFactor;
    
    const newX = previousX + (amplifiedX - previousX) * smoothingFactor;
    const newY = previousY + (amplifiedY - previousY) * smoothingFactor;
    
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
            zIndex: 3
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
}

function initVideo() {
    const video = document.getElementById('video');
    navigator.mediaDevices.getUserMedia({ 
        video: {
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight }
        }
    })
    .then((stream) => {
        video.srcObject = stream;
        console.log("Video initialized successfully");
    })
    .catch((err) => {
        console.error("Error accessing webcam: " + err);
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
    textIndicator.style.fontFamily = 'Arial, sans-serif';
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

    console.log("Starting face tracking...");

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
        callbackReady: function(err, spec) {
            if (err) {
                console.error('An error occurred:', err);
                textIndicator.innerHTML = 'Face tracking: Error initializing';
                textIndicator.style.color = 'red';
                return;
            }
            console.log("WebAR.rocks.face is ready!");
            textIndicator.innerHTML = 'Face tracking: Ready (waiting for face)';
            textIndicator.style.color = 'yellow';
            initLive2D();
            initVideo();
        },
        callbackTrack: function(detectState) {
            try {
                if (!detectState.detected) {
                    textIndicator.innerHTML = 'Face tracking: No face detected';
                    textIndicator.style.color = 'orange';
                    indicator.style.display = 'none';
                    debugPoints.innerHTML = '';
                    return;
                }

                textIndicator.innerHTML = 'Face tracking: Active';
                textIndicator.style.color = 'lime';

                if (detectState.landmarks) {
                    debugPoints.innerHTML = '';

                    console.log("Number of landmarks:", detectState.landmarks.length);

                    let noseLandmark = null;

                    for (let i = 27; i <= 33; i++) {
                        if (i < detectState.landmarks.length) {
                            const point = detectState.landmarks[i];

                            const debugPoint = document.createElement('div');
                            debugPoint.className = 'tracking-element';
                            debugPoint.style.width = '5px';
                            debugPoint.style.height = '5px';
                            debugPoint.style.backgroundColor = (i === 30) ? 'blue' : 'green';
                            debugPoint.style.borderRadius = '50%';
                            debugPoint.style.left = point[0] + 'px';
                            debugPoint.style.top = point[1] + 'px';
                            debugPoint.style.transform = 'translate(-50%, -50%)';
                            debugPoint.title = `Landmark ${i}`;
                            debugPoints.appendChild(debugPoint);

                            if (i === 30) {
                                noseLandmark = point;
                            }
                        }
                    }

                    if (noseLandmark) {
                        const [smoothX, smoothY] = smoothMovement(noseLandmark[0], noseLandmark[1]);
                        
                        indicator.style.display = 'block';
                        indicator.style.left = smoothX + 'px';
                        indicator.style.top = smoothY + 'px';

                        textIndicator.innerHTML = `Face tracking: Active (Nose X: ${smoothX.toFixed(0)}, Y: ${smoothY.toFixed(0)})`;

                        simulateMouseMove(smoothX, smoothY);
                    } else {
                        textIndicator.innerHTML = 'Face tracking: No nose landmark found';
                        textIndicator.style.color = 'orange';
                    }
                }
            } catch (error) {
                console.error("Error in tracking callback:", error);
                textIndicator.innerHTML = `Error: ${error.message}`;
                textIndicator.style.color = 'red';
            }
        }
    });

    document.getElementById('WebARRocksFaceCanvas').style.zIndex = '2';
    
    setInterval(() => {
        const trackingElements = document.getElementsByClassName('tracking-element');
        for(let element of trackingElements) {
            element.style.zIndex = '9999';
        }
    }, 1000);
}

function main() {
    console.log("Main function called");
    WebARRocksResizer.size_canvas({
        canvasId: 'WebARRocksFaceCanvas',
        callback: start,
        overSamplingFactor: 1.0,
        isFullScreen: true,
        sizeMode: 'fullscreen'
    });
}

window.addEventListener('load', main);