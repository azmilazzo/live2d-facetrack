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
    indicator.style.position = 'absolute';
    indicator.style.width = '20px';
    indicator.style.height = '20px';
    indicator.style.backgroundColor = 'red';
    indicator.style.borderRadius = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.display = 'block';
    indicator.style.zIndex = '9999';
    indicator.style.pointerEvents = 'none';
    document.body.appendChild(indicator);

    const textIndicator = document.createElement('div');
    textIndicator.id = 'trackingStatus';
    textIndicator.className = 'tracking-element';
    textIndicator.style.position = 'absolute';
    textIndicator.style.top = '10px';
    textIndicator.style.left = '10px';
    textIndicator.style.color = 'white';
    textIndicator.style.fontFamily = 'Arial, sans-serif';
    textIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
    textIndicator.style.padding = '5px';
    textIndicator.style.zIndex = '9999';
    textIndicator.style.pointerEvents = 'none';
    textIndicator.innerHTML = 'Face tracking: Waiting...';
    document.body.appendChild(textIndicator);

    const debugPoints = document.createElement('div');
    debugPoints.id = 'debugPoints';
    debugPoints.className = 'tracking-element';
    debugPoints.style.position = 'absolute';
    debugPoints.style.zIndex = '9999';
    debugPoints.style.pointerEvents = 'none';
    document.body.appendChild(debugPoints);

    return { indicator, textIndicator, debugPoints };
}

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

                    // The nose tip point is typically landmark 30
                    const noseTip = detectState.landmarks[30];
                    
                    if (noseTip) {
                        // Update red indicator position to nose tip
                        indicator.style.display = 'block';
                        indicator.style.left = noseTip[0] + 'px';
                        indicator.style.top = noseTip[1] + 'px';
                        
                        // Update text display
                        textIndicator.innerHTML = `Face tracking: Active (Nose X: ${noseTip[0].toFixed(0)}, Y: ${noseTip[1].toFixed(0)})`;
                        
                        // Simulate mouse movement for Live2D
                        simulateMouseMove(noseTip[0], noseTip[1]);
                    }

                    // Display all facial landmarks for debugging
                    detectState.landmarks.forEach((point, i) => {
                        const debugPoint = document.createElement('div');
                        debugPoint.className = 'tracking-element';
                        debugPoint.style.position = 'absolute';
                        debugPoint.style.width = '5px';
                        debugPoint.style.height = '5px';
                        debugPoint.style.backgroundColor = (i === 30) ? 'blue' : 'green';
                        debugPoint.style.borderRadius = '50%';
                        debugPoint.style.left = point[0] + 'px';
                        debugPoint.style.top = point[1] + 'px';
                        debugPoint.style.transform = 'translate(-50%, -50%)';
                        debugPoint.style.zIndex = '9999';
                        debugPoint.style.pointerEvents = 'none';
                        debugPoint.title = `Landmark ${i}`;
                        debugPoints.appendChild(debugPoint);
                    });
                }
            } catch (error) {
                console.error("Error in tracking callback:", error);
                textIndicator.innerHTML = `Error: ${error.message}`;
                textIndicator.style.color = 'red';
            }
        }
    });

    document.getElementById('WebARRocksFaceCanvas').style.zIndex = '3';
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