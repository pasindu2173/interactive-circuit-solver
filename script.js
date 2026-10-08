// ==========================================
// 1. MODULE SWITCHING LOGIC
// ==========================================
document.getElementById("module-select").addEventListener("change", function() {
    const selected = this.value;
    document.getElementById("opamp-section").style.display = (selected === "opamp") ? "block" : "none";
    document.getElementById("bjt-section").style.display = (selected === "bjt") ? "block" : "none";
    document.getElementById("timer555-section").style.display = (selected === "timer555") ? "block" : "none";
    document.getElementById("filter-section").style.display = (selected === "filter") ? "block" : "none";

    updateResults();
});

// ==========================================
// 2. HELPER CALCULATIONS & E24 MATCHING
// ==========================================
const E24_BASE = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];

function getNearestE24(rValue) {
    if (isNaN(rValue) || rValue <= 0) return "-";
    let exponent = Math.floor(Math.log10(rValue));
    let baseVal = rValue / Math.pow(10, exponent);

    let closest = E24_BASE.reduce((prev, curr) => Math.abs(curr - baseVal) < Math.abs(prev - baseVal) ? curr : prev);
    let finalRes = closest * Math.pow(10, exponent);

    if (finalRes >= 1e6) return (finalRes / 1e6).toFixed(2) + " MΩ";
    if (finalRes >= 1e3) return (finalRes / 1e3).toFixed(2) + " kΩ";
    return finalRes.toFixed(1) + " Ω";
}

// ==========================================
// 3. CORE CIRCUIT CALCULATION LOGIC
// ==========================================

// Op-Amp Calculation Logic
function calculateOpAmp(type, Vin, Rf, Rin, Vcc, Vee) {
    let gain = (type === "non-inverting") ? (1 + Rf / Rin) : -(Rf / Rin);
    let Vcalc = Vin * gain;
    let Vout = 0;
    let isSaturated = false;

    if (Vcalc > Vcc) {
        Vout = Vcc;
        isSaturated = true;
    } else if (Vcalc < Vee) {
        Vout = Vee;
        isSaturated = true;
    } else {
        Vout = Vcalc;
    }

    return { gain, Vcalc, Vout, isSaturated };
}

// BJT DC Biasing Logic
function calculateBJT(Vcc, R1, R2, Rc, Re, Beta) {
    const Vbe = 0.7;
    let Vb = Vcc * (R2 / (R1 + R2));
    let Ve = Vb - Vbe;
    let Ic = 0;
    let Vce = 0;
    let region = "";

    if (Ve <= 0) {
        Ve = 0;
        Ic = 0;
        Vce = Vcc;
        region = "Cut-off";
    } else {
        let Ie = Ve / Re;
        Ic = Ie;
        let Vc = Vcc - (Ic * Rc);
        Vce = Vc - Ve;

        if (Vce <= 0.2) {
            Vce = 0.2;
            region = "Saturation";
            Ic = (Vcc - 0.2) / (Rc + Re);
        } else {
            region = "Active";
        }
    }

    return { Vb, Ic, Vce, region };
}

// 555 Timer Astable Multivibrator Logic
function calculate555(R1, R2, C_uF) {
    let C = C_uF * 1e-6; // Convert uF to Farads
    let Thigh = 0.693 * (R1 + R2) * C;
    let Tlow = 0.693 * R2 * C;
    let T = Thigh + Tlow;
    let freq = 1 / T;
    let duty = (Thigh / T) * 100;

    return { freq, T, Thigh, Tlow, duty };
}

// RC Filter Calculation Logic
function calculateFilter(R, C_nF) {
    let C = C_nF * 1e-9; // Convert nF to Farads
    let fc = 1 / (2 * Math.PI * R * C);
    let tau = R * C;
    let nearestE24 = getNearestE24(R);

    return { fc, tau, nearestE24 };
}

// ==========================================
// 4. CANVAS WAVEFORM DRAWING LOGIC
// ==========================================

// Draw Sine Wave for Op-Amp
function drawWaveforms(Vin, VoutCalc, Vcc, Vee, isInverting) {
    const canvas = document.getElementById("waveCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    const maxVal = Math.max(Math.abs(Vin), Math.abs(VoutCalc), Math.abs(Vcc), Math.abs(Vee), 1);
    const scale = (height / 2 - 20) / maxVal;

    // Vin Waveform (Blue)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
        let t = (x / width) * Math.PI * 4;
        let y = centerY - (Vin * Math.sin(t)) * scale;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Vout Waveform (Red)
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
        let t = (x / width) * Math.PI * 4;
        let rawVout = isInverting ? -Math.abs(VoutCalc) * Math.sin(t) : Math.abs(VoutCalc) * Math.sin(t);
        let clampedVout = Math.min(Math.max(rawVout, Vee), Vcc);
        let y = centerY - clampedVout * scale;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

// Draw Square Wave for 555 Timer
function drawSquareWave(dutyCycle) {
    const canvas = document.getElementById("timerCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padding = 25;
    const highY = padding;
    const lowY = height - padding;
    const cycleWidth = width / 3;

    const highWidth = cycleWidth * (dutyCycle / 100);
    const lowWidth = cycleWidth - highWidth;

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let currentX = 0;
    ctx.moveTo(currentX, lowY);

    for (let i = 0; i < 3; i++) {
        ctx.lineTo(currentX, highY);
        currentX += highWidth;
        ctx.lineTo(currentX, highY);
        ctx.lineTo(currentX, lowY);
        currentX += lowWidth;
        ctx.lineTo(currentX, lowY);
    }

    ctx.stroke();
}

// ==========================================
// 5. MASTER RESULTS UPDATER FUNCTION
// ==========================================
function updateResults() {
    const moduleType = document.getElementById("module-select").value;

    if (moduleType === "opamp") {
        let type = document.getElementById("type").value;
        let Vin = parseFloat(document.getElementById("vin").value);
        let Rf = parseFloat(document.getElementById("rf").value);
        let Rin = parseFloat(document.getElementById("rin").value);
        let Vcc = parseFloat(document.getElementById("vcc").value);
        let Vee = parseFloat(document.getElementById("vee").value);

        if (isNaN(Vin) || isNaN(Rf) || isNaN(Rin) || isNaN(Vcc) || isNaN(Vee) || Rin === 0) return false;

        let res = calculateOpAmp(type, Vin, Rf, Rin, Vcc, Vee);
        document.getElementById("gain-val").innerText = res.gain.toFixed(2);
        document.getElementById("vout-val").innerText = res.isSaturated ? res.Vout.toFixed(2) + " V (Saturated!)" : res.Vout.toFixed(2) + " V";
        drawWaveforms(Vin, res.Vcalc, Vcc, Vee, type === "inverting");

    } else if (moduleType === "bjt") {
        let Vcc = parseFloat(document.getElementById("bjt-vcc").value);
        let R1 = parseFloat(document.getElementById("bjt-r1").value);
        let R2 = parseFloat(document.getElementById("bjt-r2").value);
        let Rc = parseFloat(document.getElementById("bjt-rc").value);
        let Re = parseFloat(document.getElementById("bjt-re").value);
        let Beta = parseFloat(document.getElementById("bjt-beta").value);

        if (isNaN(Vcc) || isNaN(R1) || isNaN(R2) || isNaN(Rc) || isNaN(Re) || isNaN(Beta)) return false;

        let res = calculateBJT(Vcc, R1, R2, Rc, Re, Beta);
        document.getElementById("vb-val").innerText = res.Vb.toFixed(2) + " V";
        document.getElementById("ic-val").innerText = (res.Ic * 1000).toFixed(2) + " mA";
        document.getElementById("vce-val").innerText = res.Vce.toFixed(2) + " V";
        document.getElementById("region-val").innerText = res.region;

    } else if (moduleType === "timer555") {
        let R1 = parseFloat(document.getElementById("t555-r1").value);
        let R2 = parseFloat(document.getElementById("t555-r2").value);
        let C = parseFloat(document.getElementById("t555-c").value);

        if (isNaN(R1) || isNaN(R2) || isNaN(C) || R1 <= 0 || R2 <= 0 || C <= 0) return false;

        let res = calculate555(R1, R2, C);

        if (res.freq >= 1000) {
            document.getElementById("t555-freq").innerText = (res.freq / 1000).toFixed(2) + " kHz";
        } else {
            document.getElementById("t555-freq").innerText = res.freq.toFixed(2) + " Hz";
        }

        document.getElementById("t555-period").innerText = (res.T * 1000).toFixed(2) + " ms";
        document.getElementById("t555-thigh").innerText = (res.Thigh * 1000).toFixed(2) + " ms";
        document.getElementById("t555-tlow").innerText = (res.Tlow * 1000).toFixed(2) + " ms";
        document.getElementById("t555-duty").innerText = res.duty.toFixed(1) + " %";

        drawSquareWave(res.duty);

    } else if (moduleType === "filter") {
        let R = parseFloat(document.getElementById("filter-r").value);
        let C = parseFloat(document.getElementById("filter-c").value);

        if (isNaN(R) || isNaN(C) || R <= 0 || C <= 0) return false;

        let res = calculateFilter(R, C);

        if (res.fc >= 1e6) {
            document.getElementById("fc-val").innerText = (res.fc / 1e6).toFixed(2) + " MHz";
        } else if (res.fc >= 1e3) {
            document.getElementById("fc-val").innerText = (res.fc / 1e3).toFixed(2) + " kHz";
        } else {
            document.getElementById("fc-val").innerText = res.fc.toFixed(2) + " Hz";
        }

        document.getElementById("tau-val").innerText = (res.tau * 1e6).toFixed(2) + " µs";
        document.getElementById("e24-r-val").innerText = res.nearestE24;
    }
    return true;
}

// ==========================================
// 6. EVENT LISTENERS SETUP
// ==========================================

// Calculate Button Event
document.getElementById("calc-btn").addEventListener("click", function() {
    let ok = updateResults();
    if (!ok) alert("Please enter valid numerical values for all required fields.");
});

// Reset Button Event
document.getElementById("reset-btn").addEventListener("click", function() {
    const moduleType = document.getElementById("module-select").value;
    if (moduleType === "opamp") {
        document.getElementById("vin").value = "";
        document.getElementById("rf").value = "";
        document.getElementById("rin").value = "";
        document.getElementById("vcc").value = "15";
        document.getElementById("vee").value = "-15";
        document.getElementById("gain-val").innerText = "-";
        document.getElementById("vout-val").innerText = "-";
        const canvas = document.getElementById("waveCanvas");
        if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    } else if (moduleType === "bjt") {
        document.getElementById("bjt-vcc").value = "12";
        document.getElementById("bjt-r1").value = "";
        document.getElementById("bjt-r2").value = "";
        document.getElementById("bjt-rc").value = "";
        document.getElementById("bjt-re").value = "";
        document.getElementById("bjt-beta").value = "100";
        document.getElementById("vb-val").innerText = "-";
        document.getElementById("ic-val").innerText = "-";
        document.getElementById("vce-val").innerText = "-";
        document.getElementById("region-val").innerText = "-";
    } else if (moduleType === "timer555") {
        document.getElementById("t555-r1").value = "";
        document.getElementById("t555-r2").value = "";
        document.getElementById("t555-c").value = "";
        document.getElementById("t555-freq").innerText = "-";
        document.getElementById("t555-period").innerText = "-";
        document.getElementById("t555-thigh").innerText = "-";
        document.getElementById("t555-tlow").innerText = "-";
        document.getElementById("t555-duty").innerText = "-";
        const canvas = document.getElementById("timerCanvas");
        if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    } else if (moduleType === "filter") {
        document.getElementById("filter-r").value = "";
        document.getElementById("filter-c").value = "";
        document.getElementById("fc-val").innerText = "-";
        document.getElementById("tau-val").innerText = "-";
        document.getElementById("e24-r-val").innerText = "-";
    }
});

// Live Event Listeners for Input Fields
const allInputs = [
    "vin", "rf", "rin", "vcc", "vee", "type",
    "bjt-vcc", "bjt-r1", "bjt-r2", "bjt-rc", "bjt-re", "bjt-beta",
    "t555-r1", "t555-r2", "t555-c",
    "filter-r", "filter-c"
];

allInputs.forEach(id => {
    let el = document.getElementById(id);
    if (el) {
        el.addEventListener("input", updateResults);
        el.addEventListener("change", updateResults);
    }
});