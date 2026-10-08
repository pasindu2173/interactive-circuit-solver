# Interactive Electronics Lab & Circuit Analyzer

An interactive, web-based circuit analysis and signal visualization suite designed to simplify analog circuit design calculations and dynamic waveform plotting. Built with pure Vanilla JavaScript and HTML5 Canvas API without any external dependencies.

---

## Key Modules & Features

### 1. Op-Amp Gain & Saturation Visualizer
- Supports both Inverting and Non-Inverting configurations.
- Calculates closed-loop voltage gain and projected output voltage.
- Accounts for operational amplifier supply rail clipping (Vcc / Vee saturation).
- Renders real-time, scaled sine wave input (Vin) and output (Vout) waveforms using HTML5 Canvas.

### 2. BJT DC Biasing Analyzer
- Solves Voltage Divider Biasing networks for NPN transistors.
- Computes Q-Point parameters: Base Voltage (Vb), Collector Current (Ic), and Collector-Emitter Voltage (Vce).
- Automatically determines and displays the transistor's operating region (Cut-off, Active, or Saturation).

### 3. 555 Timer Astable Multivibrator
- Calculates oscillation frequency (f), total period (T), high time (Thigh), low time (Tlow), and duty cycle percentage.
- Dynamically generates the corresponding square wave output waveform based on the calculated duty cycle.

### 4. Active RC Filter & E24 Resistor Matcher
- Calculates cut-off frequency (fc) and time constant (tau) for first-order RC networks.
- E24 Matcher: Maps calculated theoretical resistance values to the nearest standard E24 resistor series value for practical prototyping.

---

## Tech Stack

- Frontend: HTML5, CSS3 (Modern Dark Theme UI)
- Logic Engine: JavaScript (ES6+)
- Graphics & Rendering: HTML5 Canvas API
- Version Control & Hosting: Git, GitHub Pages

---

## Project Structure

├── index.html      # Structure & Layout for all 4 modules  
├── style.css       # Custom styling, dark mode theme & responsive design  
├── script.js       # Core mathematical logic, canvas rendering & DOM event handling  
└── README.md       # Project documentation  

---

## Local Setup & Installation

1. Clone the repository:  
   `git clone https://github.com/pasindu2173/interactive-circuit-solver.git`

2. Navigate to the project directory:  
   `cd interactive-circuit-solver`

3. Run the application:  
   Simply open index.html in any modern web browser or use VS Code's Live Server extension.

---

## Author

Developed by Pasindu Milan
(Computer Engineering Undergraduate at University of Sri Jayewardenepura)