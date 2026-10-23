const IS_MOBILE = /Android|iPhone|iPad/i.test(navigator.userAgent);

const CONFIG = {
    particleCount: IS_MOBILE ? 5000 : 40000, 
    text1: "I",
    text2: "LOVE",
    text3: "YOU",
    text4: "I LOVE YOU",
    particleSize: 0.08, 
    scatterRadius: 35,
    textScale: 0.055,
    camZ: 40,
    interactionRadius: 8.0, 
    repulsionStrength: 8.0 
};


const state = {
    targetGestureLabel: "Waiting...",
    currentWeights: [0, 0, 0, 0, 0], 
    targetWeights: [0, 0, 0, 0, 0],
    
    spreadTarget: 1.0, 
    currentSpread: 1.0, 
    
    scatterScaleTarget: 1.0, 
    currentScatterScale: 1.0,

    fingerCount: 0,
    galaxyEffectActive: false, 
    
    voiceModeActive: false,
    wasVoiceModeActive: false,
    voiceEnabledByUser: false, 

    handPositionRaw: { x: 0.5, y: 0.5 },
    handPositions: [], 
    isHandDetected: false
};
const PERMISSION_MAX_RETRY = 3; 
let permissionFailCount = Number(sessionStorage.getItem('permission_fail_count') || 0);


const btnCollapse = document.getElementById('btn-collapse');
const uiLayer = document.getElementById('ui-layer');
btnCollapse.addEventListener('click', () => {
    uiLayer.classList.toggle('collapsed');
    btnCollapse.innerText = uiLayer.classList.contains('collapsed') ? '+' : '−';
});

const camWrapper = document.getElementById('camera-wrapper');
const camHandle = document.getElementById('camera-handle');
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

camHandle.addEventListener('mousedown', (e) => {
    if (state.voiceModeActive) return;
    isDragging = true;
    const rect = camWrapper.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    camWrapper.style.bottom = 'auto';
    camWrapper.style.right = 'auto';
    camWrapper.style.left = rect.left + 'px';
    camWrapper.style.top = rect.top + 'px';
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        camWrapper.style.left = (e.clientX - dragOffset.x) + 'px';
        camWrapper.style.top = (e.clientY - dragOffset.y) + 'px';
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});


const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.012);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = CONFIG.camZ;

const vFOV = THREE.MathUtils.degToRad(camera.fov);
const heightAtZero = 2 * Math.tan(vFOV / 2) * camera.position.z;
const widthAtZero = heightAtZero * camera.aspect;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false; 
controls.enableZoom = false;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



function generateTextCoordinates(text, step = 2, scaleOverride = null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 3000; 
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.font = '900 250px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const coords = [];

    const finalScale = scaleOverride || CONFIG.textScale;

    for (let y = 0; y < height; y += step) { 
        for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            if (data[i] > 128) {
                const pX = (x - width / 2) * finalScale;
                const pY = -(y - height / 2) * finalScale;
                coords.push(new THREE.Vector3(pX, pY, 0));
            }
        }
    }
    return coords;
}

const coordsText1 = generateTextCoordinates(CONFIG.text1, 3); 
const coordsText2 = generateTextCoordinates(CONFIG.text2, 3);
const coordsText3 = generateTextCoordinates(CONFIG.text3, 3);
const coordsText4 = generateTextCoordinates(CONFIG.text4, 3); 
let coordsText5 = generateTextCoordinates("MISS LA NHO", 2); 

const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(CONFIG.particleCount * 3);
const colors = new Float32Array(CONFIG.particleCount * 3);

const posScatter = [];
const posText1 = [];
const posText2 = [];
const posText3 = [];
const posText4 = [];
const posText5 = [];

function fillPosArray(targetArray, sourceCoords) {
    targetArray.length = 0; 
    const depth = 2.0;
    const noise = 0.2;
    for (let i = 0; i < CONFIG.particleCount; i++) {
        if (sourceCoords.length === 0) {
             targetArray.push(new THREE.Vector3(0,0,0));
             continue;
        }
        const index = Math.floor(Math.random() * sourceCoords.length);
        const p = sourceCoords[index];
        targetArray.push(new THREE.Vector3(
            p.x + (Math.random() - 0.5) * noise,
            p.y + (Math.random() - 0.5) * noise,
            p.z + (Math.random() - 0.5) * depth
        ));
    }
}

for (let i = 0; i < CONFIG.particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = Math.cbrt(Math.random()) * CONFIG.scatterRadius; 
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    posScatter.push(new THREE.Vector3(x, y, z));
}

fillPosArray(posText1, coordsText1);
fillPosArray(posText2, coordsText2);
fillPosArray(posText3, coordsText3);
fillPosArray(posText4, coordsText4);
fillPosArray(posText5, coordsText5); 

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particleMaterial = new THREE.PointsMaterial({
    vertexColors: true,
    size: CONFIG.particleSize,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

function updateDynamicText(text) {
    const length = Math.max(text.length, 3);
    let optimalScale = 0.09; 
    if (length > 4) {
        optimalScale = 0.4 / length; 
    }
    optimalScale = Math.max(0.035, optimalScale);

    const newCoords = generateTextCoordinates(text, 2, optimalScale);
    fillPosArray(posText5, newCoords);
}


const galaxyCount = IS_MOBILE ? 700 : 8000;
const galaxyGeo = new THREE.BufferGeometry();
const galaxyPos = new Float32Array(galaxyCount * 3);
const galaxyColors = new Float32Array(galaxyCount * 3);

for(let i=0; i<galaxyCount; i++) {
    const r = 20 + Math.random() * 60; 
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    
    galaxyPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
    galaxyPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    galaxyPos[i*3+2] = r * Math.cos(phi);

    const c = new THREE.Color();
    const rand = Math.random();
    if(rand < 0.3) c.setHex(0x00ffff); 
    else if (rand < 0.6) c.setHex(0x0000ff); 
    else if (rand < 0.8) c.setHex(0x4b0082); 
    else c.setHex(0xffffff); 

    c.multiplyScalar(0.5 + Math.random() * 0.5);

    galaxyColors[i*3] = c.r;
    galaxyColors[i*3+1] = c.g;
    galaxyColors[i*3+2] = c.b;
}

galaxyGeo.setAttribute('position', new THREE.BufferAttribute(galaxyPos, 3));
galaxyGeo.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

const galaxyMaterial = new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.04, 
    transparent: true,
    opacity: 0, 
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const galaxySystem = new THREE.Points(galaxyGeo, galaxyMaterial);
scene.add(galaxySystem);


const voiceBtn = document.getElementById('btn-voice');
const voiceIndicator = document.getElementById('voice-indicator');
const voiceBtnText = document.getElementById('voice-btn-text');

let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        voiceIndicator.classList.add('listening');
        voiceBtnText.innerText = "Voice Mode: ON";
        voiceBtn.classList.add('active');
    };

    recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
            alert("Microphone access denied. Please reload page and allow microphone access.");
            state.voiceEnabledByUser = false;
        }
        voiceIndicator.classList.remove('listening');
    };

    recognition.onend = () => {
        voiceIndicator.classList.remove('listening');
        if (state.voiceEnabledByUser) {
            setTimeout(() => {
                try { recognition.start(); } catch(e) { }
            }, 300);
        } else {
            voiceBtnText.innerText = "Enable Voice Mode";
            voiceBtn.classList.remove('active');
        }
    };

    recognition.onresult = (event) => {
        if (!state.voiceEnabledByUser) return;

        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim().toUpperCase();
        
        const words = transcript.split(' ');
        const displayPhrase = words.slice(-3).join(' ');

        if (displayPhrase.length > 0) {
            updateDynamicText(displayPhrase);
            state.targetGestureLabel = "Voice: " + displayPhrase;
            state.targetWeights = [0, 0, 0, 0, 1];
            state.spreadTarget = 0.0; 
        }
    };
} else {
    voiceBtnText.innerText = "Voice Not Supported";
    voiceBtn.disabled = true;
}

voiceBtn.addEventListener('click', () => {
    if (permissionFailTimer) {
        clearInterval(permissionFailTimer);
        permissionFailTimer = null;
    }
    if (!recognition) return;

    state.voiceEnabledByUser = !state.voiceEnabledByUser;
    
    if (state.voiceEnabledByUser) {
        try {
            recognition.start();
            state.voiceModeActive = true;
            state.targetGestureLabel = "Listening...";
            state.spreadTarget = 0.0; 
            state.targetWeights = [0, 0, 0, 0, 1]; 
            
            updateDynamicText("MISS LA NHO");
        } catch(e) { }
    } else {
        recognition.stop();
        state.voiceModeActive = false;
        state.targetGestureLabel = "Voice Mode OFF";
        state.spreadTarget = 1.0;
    }
});


const videoElement = document.getElementById('webcam-preview');
const uiGesture = document.getElementById('gesture-val');
const uiFingers = document.getElementById('finger-val');
const loading = document.getElementById('loading');

function onResults(results) {
    loading.style.display = 'none';

    let detectedGesture = 0; 
    let fCount = 0;
    let openness = 1.0;

    state.handPositions = []; 

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        state.isHandDetected = true;
        
        for (const landmarks of results.multiHandLandmarks) {
            const palmX = 1.0 - landmarks[9].x; 
            const palmY = landmarks[9].y;
            const hPos = new THREE.Vector3(
                (palmX - 0.5) * widthAtZero,
                -(palmY - 0.5) * heightAtZero,
                0
            );
            state.handPositions.push(hPos);
        }

        const landmarks = results.multiHandLandmarks[0];
        const handedness = results.multiHandedness[0].label;
        
        const wrist = landmarks[0];
        state.handPositionRaw.x = 1.0 - wrist.x; 
        state.handPositionRaw.y = wrist.y;

        fCount = countFingers(landmarks, handedness);
        openness = getHandOpenness(landmarks);

        if (state.voiceEnabledByUser) {
            state.targetWeights = [0, 0, 0, 0, 1];
            state.spreadTarget = 0.0; 
            state.galaxyEffectActive = false; 
        } else {
            if (fCount === 1) detectedGesture = 1;
            else if (fCount === 2) detectedGesture = 2;
            else if (fCount === 3) detectedGesture = 3;
            else if (fCount === 4) detectedGesture = 4;

            if (detectedGesture > 0) {
                state.targetGestureLabel = getLabel(detectedGesture);
                state.spreadTarget = 0.0;
                state.targetWeights = getWeights(detectedGesture);
                state.galaxyEffectActive = (detectedGesture === 4);
            } else {
                state.targetGestureLabel = fCount === 0 ? "Fist (Contract)" : "Scatter (Expand)";
                state.spreadTarget = 1.0;
                state.galaxyEffectActive = false;
                const minScale = 0.1;
                const maxScale = 1.5;
                state.scatterScaleTarget = minScale + openness * (maxScale - minScale);
            }
        }

        state.fingerCount = fCount;

    } else {
        state.isHandDetected = false;

        if (state.voiceEnabledByUser) {
            state.spreadTarget = 0.0;
            state.targetWeights = [0, 0, 0, 0, 1];
            state.handPositionRaw.x = 0.5;
            state.handPositionRaw.y = 0.5;
        } else {
            state.spreadTarget = 1.0;
            state.targetGestureLabel = "Waiting...";
            state.scatterScaleTarget = 1.0;
            state.handPositionRaw.x = 0.5;
            state.handPositionRaw.y = 0.5;
        }
        
        state.fingerCount = 0;
        state.galaxyEffectActive = false;
    }

    updateUI();
}


function getLabel(g) {
    if(g===1) return CONFIG.text1;
    if(g===2) return CONFIG.text2;
    if(g===3) return CONFIG.text3;
    if(g===4) return "I LOVE YOU";
    return "";
}

function getWeights(g) {
    if(g===1) return [1,0,0,0,0];
    if(g===2) return [0,1,0,0,0];
    if(g===3) return [0,0,1,0,0];
    if(g===4) return [0,0,0,1,0];
    return state.targetWeights; 
}

function getHandOpenness(landmarks) {
    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20];
    const mcps = [5,9, 13, 17];
    let distTips = 0, distMcps = 0;
    for(let i=0; i<4; i++){
        distTips += Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y);
        distMcps += Math.hypot(landmarks[mcps[i]].x - wrist.x, landmarks[mcps[i]].y - wrist.y);
    }
    const ratio = distTips / distMcps;
    return Math.max(0, Math.min(1, (ratio - 1.0) / 1.2));
}

function countFingers(landmarks, handedness) {
    let count = 0;
    const fingerTips = [8, 12, 16, 20];
    const fingerPips = [6, 10, 14, 18];
    for (let i = 0; i < 4; i++) {
        if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) count++;
    }
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const isRightHand = handedness === 'Right';
    if (isRightHand) {
        if (thumbTip.x < thumbIp.x) count++;
    } else {
        if (thumbTip.x > thumbIp.x) count++;
    }
    return count;
}

function updateUI() {
    uiGesture.innerText = state.targetGestureLabel;
    uiFingers.innerText = state.fingerCount;
}

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 2, 
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const cameraFeed = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

let cameraDenied = false;
let micDenied = false;
let permissionFailTimer = null;
const PERMISSION_FAIL_TIMEOUT = 7000; 

function showPermissionError() {
    permissionFailCount++;
    sessionStorage.setItem('permission_fail_count', permissionFailCount);

    if (permissionFailCount > PERMISSION_MAX_RETRY) {
        loading.innerHTML = `
            <div style="color:#fff; text-align:center; line-height:1.6;">
                <b>Permission Required</b><br><br>
                You have denied permission multiple times.<br><br>
                Please enable <b>Camera</b> or <b>Microphone</b><br>
                manually in browser settings<br>
                and refresh the page.
            </div>
        `;
        return;
    }

    let secondsLeft = PERMISSION_FAIL_TIMEOUT / 1000;

    loading.innerHTML = `
        <div style="color:#fff; text-align:center; line-height:1.6;">
            <b>Permission Required</b><br><br>
            Please allow <b>Camera</b> or <b>Microphone</b><br>
            to use this website.<br><br>
            <span id="reload-timer" style="color:#ff8080;">
                Reloading in ${secondsLeft}s...
            </span>
        </div>
    `;

    const timerEl = document.getElementById('reload-timer');

    permissionFailTimer = setInterval(() => {
        secondsLeft--;
        if (timerEl) {
            timerEl.innerText = `Reloading in ${secondsLeft}s...`;
        }

        if (secondsLeft <= 0) {
            clearInterval(permissionFailTimer);
            permissionFailTimer = null;
            location.reload();
        }
    }, 1000);
}


async function startCamera() {
    try {
        loading.innerHTML = "Requesting Camera Access...";

        let cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false 
        });

        videoElement.srcObject = cameraStream;
        await videoElement.play();

        loading.innerHTML = "Starting MediaPipe...";
        await cameraFeed.start();

        sessionStorage.removeItem('permission_fail_count');
        permissionFailCount = 0;

    } catch (err) {
        cameraDenied = true;

        loading.innerHTML = "Camera denied. Trying microphone access...";
        try {
            await tryEnableVoiceFallback();
        } catch {
            showPermissionError();
        }
    }
}


function enableVoiceModeAuto() {
    sessionStorage.removeItem('permission_fail_count');
    permissionFailCount = 0;

    state.voiceEnabledByUser = false;
    state.voiceModeActive = true;

    state.targetGestureLabel = "Voice Mode (Mic)";
    state.spreadTarget = 0.0;
    state.targetWeights = [0, 0, 0, 0, 1];
    
    voiceBtnText.innerText = "Voice Mode: ON";
    voiceBtn.classList.add('active');

    if (recognition) {
        try { recognition.start(); } catch {}
    }

    loading.style.display = 'none';
}

async function tryEnableVoiceFallback() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices not supported");
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());

        enableVoiceModeAuto();
    } catch (e) {
        micDenied = true;
        throw e;
    }
}

let isMouseMode = false;
function activateMouseMode() {
    isMouseMode = true;
    state.isHandDetected = true;
    
    camWrapper.style.display = 'flex';
    camWrapper.style.justifyContent = 'center';
    camWrapper.style.alignItems = 'center';
    camWrapper.style.background = 'rgba(20, 20, 20, 0.8)';
    camWrapper.style.border = '1px solid #444';
    
    const video = document.getElementById('webcam-preview');
    video.style.opacity = '0.1';
    
    if (!document.getElementById('no-cam-msg')) {
        const msg = document.createElement('div');
        msg.id = 'no-cam-msg';
        msg.innerHTML = "NO CAMERA<br>Mouse Mode";
        msg.style.color = '#aaa';
        msg.style.textAlign = 'center';
        msg.style.fontSize = '12px';
        msg.style.position = 'absolute';
        camWrapper.appendChild(msg);
    }
    
    window.addEventListener('mousemove', (event) => {
        const vec = new THREE.Vector3();
        const pos = new THREE.Vector3();
        
        vec.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );
        
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        
        const distance = -camera.position.z / vec.z;
        pos.copy(camera.position).add(vec.multiplyScalar(distance));
        
        state.handPositions = [pos];
        
        state.handPositionRaw.x = event.clientX / window.innerWidth;
        state.handPositionRaw.y = event.clientY / window.innerHeight;
    });

    let gestureIndex = 0;
    window.addEventListener('click', () => {
        if (state.voiceModeActive) return;
        
        gestureIndex = (gestureIndex + 1) % 5;
        const g = gestureIndex;
        
        if (g === 0) {
            state.targetGestureLabel = "Mouse Click: Scatter";
            state.spreadTarget = 1.0;
            state.galaxyEffectActive = false;
        } else {
            state.targetGestureLabel = "Mouse Click: " + getLabel(g);
            state.spreadTarget = 0.0;
            state.targetWeights = getWeights(g);
            state.galaxyEffectActive = (g === 4);
        }
        updateUI();
    });
    
    const uiContent = document.getElementById('ui-content');
    const helpText = uiContent.querySelector('div[style*="font-size: 11px"]');
    if(helpText) {
        helpText.innerHTML = `
            <b>Mouse Mode Active:</b><br>
            🖱️ Move mouse to interact<br>
            🖱️ Click to cycle gestures<br>
            (I -> LOVE -> YOU -> ...)<br>
            <br>
            <b>Voice Mode:</b><br>
            🎤 Still works if Mic is available
        `;
    }
}


/**
 * ANIMATION LOOP
 */
let lastFrame = 0;
const FPS_LIMIT = IS_MOBILE ? 30 : 60;

function animate(now) {
    requestAnimationFrame(animate);

    if (now - lastFrame < 1000 / FPS_LIMIT) return;
    lastFrame = now;

    if (state.voiceModeActive !== state.wasVoiceModeActive) {
        if (state.voiceModeActive) {
            camWrapper.classList.add('fullscreen');
            if (!isMouseMode) {
                scene.background = null; 
            } else {
                scene.background = new THREE.Color(0x050505);
            }
            
            camWrapper.style.top = '';
            camWrapper.style.left = '';
            camWrapper.style.bottom = '';
            camWrapper.style.right = '';
        } else {
            camWrapper.classList.remove('fullscreen');
            scene.background = new THREE.Color(0x050505);
            if (!camWrapper.style.top) {
                camWrapper.style.bottom = '15px';
                camWrapper.style.right = '15px';
            }
        }
        state.wasVoiceModeActive = state.voiceModeActive;
    }

    state.currentSpread += (state.spreadTarget - state.currentSpread) * 0.08;
    state.currentScatterScale += (state.scatterScaleTarget - state.currentScatterScale) * 0.1;
    
    for(let i=0; i<5; i++) { 
        state.currentWeights[i] += (state.targetWeights[i] - state.currentWeights[i]) * 0.1;
    }

    const targetRotY = (state.handPositionRaw.x - 0.5) * 1.5; 
    const targetRotX = (state.handPositionRaw.y - 0.5) * 1.5;
    particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.1;
    particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.1;
    
    galaxySystem.rotation.y += 0.002;
    galaxySystem.rotation.x += 0.001;

    const positionsArray = particleGeometry.attributes.position.array;
    const colorsArray = particleGeometry.attributes.color.array;

    const time = Date.now() * 0.001;
    
    const w1 = state.currentWeights[0]; 
    const w2 = state.currentWeights[1]; 
    const w3 = state.currentWeights[2]; 
    const w4 = state.currentWeights[3]; 
    const w5 = state.currentWeights[4]; 

    const interactionRadSq = CONFIG.interactionRadius * CONFIG.interactionRadius;
    
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const p1 = posText1[i];
        const p2 = posText2[i];
        const p3 = posText3[i];
        const p4 = posText4[i];
        const p5 = posText5[i];

        const tx = p1.x*w1 + p2.x*w2 + p3.x*w3 + p4.x*w4 + p5.x*w5;
        const ty = p1.y*w1 + p2.y*w2 + p3.y*w3 + p4.y*w4 + p5.y*w5;
        const tz = p1.z*w1 + p2.z*w2 + p3.z*w3 + p4.z*w4 + p5.z*w5;

        const s = posScatter[i];
        const sX = s.x * state.currentScatterScale;
        const sY = s.y * state.currentScatterScale;
        const sZ = s.z * state.currentScatterScale;
        
        const noiseScale = 0.5 * state.currentScatterScale;
        const nX = Math.sin(time + i*0.1) * noiseScale;
        const nY = Math.cos(time + i*0.13) * noiseScale;

        let finalX = THREE.MathUtils.lerp(tx, sX + nX, state.currentSpread);
        let finalY = THREE.MathUtils.lerp(ty, sY + nY, state.currentSpread);
        let finalZ = THREE.MathUtils.lerp(tz, sZ, state.currentSpread);

        if (state.voiceModeActive && state.handPositions.length > 0) {
            for (const hPos of state.handPositions) {
                const dx = finalX - hPos.x;
                const dy = finalY - hPos.y;
                const dz = finalZ - hPos.z;
                const distSq = dx*dx + dy*dy + dz*dz;

                if (distSq < interactionRadSq) {
                    const dist = Math.sqrt(distSq);
                    const force = (CONFIG.interactionRadius - dist) / CONFIG.interactionRadius; 
                    
                    const repulsion = Math.pow(force, 2) * CONFIG.repulsionStrength; 

                    finalX += (dx / dist) * repulsion * 5; 
                    finalY += (dy / dist) * repulsion * 5;
                    finalZ += (dz / dist) * repulsion * 5;
                }
            }
        }
        const cx = positionsArray[i*3];
        const cy = positionsArray[i*3+1];
        const cz = positionsArray[i*3+2];
        const speed = 0.1;
        positionsArray[i*3]   += (finalX - cx) * speed;
        positionsArray[i*3+1] += (finalY - cy) * speed;
        positionsArray[i*3+2] += (finalZ - cz) * speed;

        const baseColor = new THREE.Color();
        const cPink1 = new THREE.Color(0xff69b4); 
        const cPurple = new THREE.Color(0xda70d6); 
        const cBlueNeon = new THREE.Color(0x00ffff); 
        const cWhite = new THREE.Color(0xffffff);

        if (state.currentSpread > 0.8) {
            const dist = Math.sqrt(finalX*finalX + finalY*finalY + finalZ*finalZ);
            const normDist = Math.min(dist / 40, 1);
            baseColor.setHSL(0.9, 0.5, 0.8 + normDist*0.2);
        } else {
            if (w5 > 0.5) {
                baseColor.copy(cBlueNeon);
                baseColor.offsetHSL(0, 0, 0.1); 
                if (Math.random() > 0.92) baseColor.setHex(0xffffff);
            } else if (w1>0.5 || w2>0.5 || w3>0.5 || w4>0.5) {
                baseColor.lerpColors(cPink1, cPurple, 0.5);
                const hueOffset = (finalX / 60) * 0.1;
                baseColor.offsetHSL(hueOffset, 0, 0);
            } else {
                baseColor.setHex(0xffffff);
            }
        }

        colorsArray[i*3] = baseColor.r;
        colorsArray[i*3+1] = baseColor.g;
        colorsArray[i*3+2] = baseColor.b;
    }

    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;

    galaxyMaterial.opacity = THREE.MathUtils.lerp(
        galaxyMaterial.opacity, 
        state.galaxyEffectActive ? 0.8 : 0.0, 
        0.03
    );

    controls.update();
    renderer.render(scene, camera);
}

startCamera();
animate();
