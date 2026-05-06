document.addEventListener("DOMContentLoaded", () => {
  const ui = new UIManager();
  let processes = [];

  // DOM Elements
  const form = document.getElementById("add-process-form");
  const pidInput = document.getElementById("pid-input");
  const arrivalInput = document.getElementById("arrival-input");
  const burstInput = document.getElementById("burst-input");
  const priorityInput = document.getElementById("priority-input");

  const algoSelect = document.getElementById("algorithm-select");
  const quantumContainer = document.getElementById("quantum-container");
  const quantumInput = document.getElementById("quantum-input");
  const priorityModeContainer = document.getElementById("priority-mode-container");
  const priorityMode = document.getElementById("priority-mode");
  const contextSwitchInput = document.getElementById("context-switch-input");

  const runBtn = document.getElementById("run-simulation-btn");
  const compareBtn = document.getElementById("compare-btn");
  const clearBtn = document.getElementById("clear-processes-btn");

  // Playback Controls
  const playbackControls = document.getElementById("playback-controls");
  const timeSlider = document.getElementById("time-slider");
  const prevStepBtn = document.getElementById("prev-step-btn");
  const nextStepBtn = document.getElementById("next-step-btn");
  const currentTimeDisplay = document.getElementById("current-time-display");

  let currentSimulationResult = null;

  // Initial sample data
  processes.push(new Process("P1", 0, 5, 2));
  processes.push(new Process("P2", 1, 3, 1));
  processes.push(new Process("P3", 2, 8, 4));
  processes.push(new Process("P4", 3, 6, 3));

  ui.renderProcessTable(processes, deleteProcess);

  // Event Listeners
  algoSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    quantumContainer.classList.toggle("hidden", val !== "RR");
    priorityModeContainer.classList.toggle("hidden", val !== "Priority");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const pid = pidInput.value.trim();
    const arrival = parseInt(arrivalInput.value);
    const burst = parseInt(burstInput.value);
    const priority = parseInt(priorityInput.value);

    if (!pid || isNaN(arrival) || isNaN(burst) || isNaN(priority)) {
      alert("Please fill all fields correctly.");
      return;
    }

    if (processes.some(p => p.pid === pid)) {
      alert("Process ID must be unique.");
      return;
    }

    processes.push(new Process(pid, arrival, burst, priority));
    ui.renderProcessTable(processes, deleteProcess);

    // Auto-increment PID for convenience
    const nextNum = processes.length + 1;
    pidInput.value = `P${nextNum}`;
  });

  clearBtn.addEventListener("click", () => {
    processes = [];
    currentSimulationResult = null;
    ui.renderProcessTable(processes, deleteProcess);
    document.getElementById("gantt-chart-container").innerHTML = "<div class='w-full h-full flex items-center justify-center text-gray-400'>Run simulation to view Gantt chart</div>";
    document.getElementById("gantt-timeline").innerHTML = "";
    document.getElementById("metrics-table-body").innerHTML = "";
    document.getElementById("event-log-container").innerHTML = "> Ready to simulate...";
    document.getElementById("comparison-section").classList.add("hidden");
    playbackControls.classList.add("hidden");

    document.getElementById("avg-wt").textContent = "-";
    document.getElementById("avg-tat").textContent = "-";
    document.getElementById("avg-rt").textContent = "-";
    document.getElementById("throughput").textContent = "-";
    document.getElementById("utilization").textContent = "-";
    document.getElementById("context-switches").textContent = "-";
  });

  function updatePlaybackUI(time) {
    if (!currentSimulationResult) return;
    
    currentTimeDisplay.textContent = time;
    timeSlider.value = time;
    
    ui.updateGanttProgress(time, currentSimulationResult.metrics.totalTime);
    ui.renderMetrics(currentSimulationResult.processes, currentSimulationResult.metrics, time);
    ui.renderLogs(currentSimulationResult.logs, time);
  }

  let playInterval = null;
  const playBtn = document.createElement("button");
  playBtn.className = "p-2 rounded hover:bg-slate-100 text-slate-600 transition";
  playBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  
  // Insert play button after prev button
  prevStepBtn.parentNode.insertBefore(playBtn, prevStepBtn.nextSibling);

  playBtn.addEventListener("click", () => {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
      playBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else {
      // If at the end, restart
      if (parseInt(timeSlider.value) >= parseInt(timeSlider.max)) {
        updatePlaybackUI(0);
      }
      
      playBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      playInterval = setInterval(() => {
        const current = parseInt(timeSlider.value);
        const max = parseInt(timeSlider.max);
        if (current < max) {
          updatePlaybackUI(current + 1);
        } else {
          clearInterval(playInterval);
          playInterval = null;
          playBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        }
      }, 800); // 800ms per step
    }
  });

  timeSlider.addEventListener("input", (e) => {
    if (playInterval) playBtn.click(); // Pause if playing
    updatePlaybackUI(parseInt(e.target.value));
  });

  prevStepBtn.addEventListener("click", () => {
    if (playInterval) playBtn.click();
    const current = parseInt(timeSlider.value);
    if (current > 0) {
      updatePlaybackUI(current - 1);
    }
  });

  nextStepBtn.addEventListener("click", () => {
    if (playInterval) playBtn.click();
    const current = parseInt(timeSlider.value);
    const max = parseInt(timeSlider.max);
    if (current < max) {
      updatePlaybackUI(current + 1);
    }
  });

  runBtn.addEventListener("click", () => {
    if (processes.length === 0) {
      alert("Please add at least one process.");
      return;
    }

    if (playInterval) playBtn.click(); // Stop playback if running

    const config = {
      quantum: parseInt(quantumInput.value),
      contextSwitch: parseInt(contextSwitchInput.value),
      priorityMode: priorityMode.value
    };

    const engine = new SimulationEngine(processes, algoSelect.value, config);
    currentSimulationResult = engine.run();

    ui.renderFullGanttChart(currentSimulationResult.gantt, currentSimulationResult.metrics.totalTime);

    // Setup playback controls
    playbackControls.classList.remove("hidden");
    timeSlider.max = currentSimulationResult.metrics.totalTime;
    
    // Set to end by default
    updatePlaybackUI(currentSimulationResult.metrics.totalTime);
  });

  compareBtn.addEventListener("click", () => {
    if (processes.length === 0) {
      alert("Please add at least one process.");
      return;
    }

    const config = {
      quantum: parseInt(quantumInput.value),
      contextSwitch: parseInt(contextSwitchInput.value),
      priorityMode: priorityMode.value
    };

    const algorithms = ["FCFS", "SJF", "RR", "Priority"];
    const results = [];

    algorithms.forEach(algo => {
      const engine = new SimulationEngine(processes, algo, config);
      const res = engine.run();
      results.push({ algorithm: algo, metrics: res.metrics });
    });

    ui.renderComparison(results);

    // Also run the currently selected one to update main UI
    runBtn.click();
  });

  function deleteProcess(index) {
    processes.splice(index, 1);
    ui.renderProcessTable(processes, deleteProcess);
  }
});
