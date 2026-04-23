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
    ui.renderProcessTable(processes, deleteProcess);
    document.getElementById("gantt-chart-container").innerHTML = "<div class='w-full h-full flex items-center justify-center text-gray-400'>Run simulation to view Gantt chart</div>";
    document.getElementById("gantt-timeline").innerHTML = "";
    document.getElementById("metrics-table-body").innerHTML = "";
    document.getElementById("event-log-container").innerHTML = "> Ready to simulate...";
    document.getElementById("comparison-section").classList.add("hidden");

    document.getElementById("avg-wt").textContent = "-";
    document.getElementById("avg-tat").textContent = "-";
    document.getElementById("avg-rt").textContent = "-";
    document.getElementById("throughput").textContent = "-";
    document.getElementById("utilization").textContent = "-";
    document.getElementById("context-switches").textContent = "-";
  });

  runBtn.addEventListener("click", () => {
    if (processes.length === 0) {
      alert("Please add at least one process.");
      return;
    }

    const config = {
      quantum: parseInt(quantumInput.value),
      contextSwitch: parseInt(contextSwitchInput.value),
      priorityMode: priorityMode.value
    };

    const engine = new SimulationEngine(processes, algoSelect.value, config);
    const result = engine.run();

    ui.renderGanttChart(result.gantt, result.metrics.totalTime);
    ui.renderMetrics(result.processes, result.metrics);
    ui.renderLogs(result.logs);
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
