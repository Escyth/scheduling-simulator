# CPU Scheduling Simulator

**Course:** ICS433 - Operating Systems  
**Team:** 9  

A web-based CPU scheduling simulator that visualizes how different scheduling algorithms manage processes. This web-based project allows users to input processes with varying arrival times, burst times, and priorities, and then simulates their execution while generating detailed performance metrics and a visual Gantt chart.

## Requirements

- A modern web browser (Chrome, Firefox, Safari, Edge).
- *(Optional)* Node.js and npm, only if you wish to recompile the Tailwind CSS styles.

## How to Run

1. Clone or download the repository.

```bash
git clone https://github.com/escyth/scheduling-simulator
```

1. Open `index.html` in any modern web browser.
2. Add processes, configure context switch/quantum settings, and click **Run Simulation** or **Compare Algorithms**.

## Features

- **Supported Algorithms:**
  - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF) - Non-Preemptive
  - Round Robin (RR) - Configurable Time Quantum
  - Priority Scheduling - Preemptive & Non-Preemptive modes
- **Visualizations:** Generates a dynamic Gantt chart to visualize CPU allocation, including Idle times and Context Switches.
- **Step-by-Step Playback:** Smoothly animate and step through the simulation timeline to see exactly how processes were scheduled at any given millisecond.
- **Performance Metrics:** Calculates Waiting Time (WT), Turnaround Time (TAT), Response Time (RT), CPU Utilization, and Throughput.
- **Algorithm Comparison:** Run multiple algorithms simultaneously to compare their performance side-by-side.

## Folder Structure

```text
scheduling-simulator/
├── index.html          # Main entry point (UI layout)
└── src/
    ├── main.js         # Main Controller: Orchestrates events and data flow
    ├── simulator.js    # Simulation Engine: Manages state, timeline, and metrics
    ├── algorithms.js   # Scheduling Logic: Implementations of FCFS, SJF, RR, Priority
    └── ui.js           # UI Manager: Handles DOM updates, tables, and Gantt chart rendering
```

## Architecture Overview

The project follows a clean, modular architecture:

1. **Input:** User provides process data via the UI.
2. **Controller (`main.js`):** Captures input and initializes the simulation.
3. **Model/Engine (`simulator.js`):** Maintains the timeline and delegates execution to the selected algorithm.
4. **Strategy (`algorithms.js`):** Processes the queue and mutates the simulation state.
5. **View (`ui.js`):** Renders the final metrics, event logs, and Gantt chart back to the user.

