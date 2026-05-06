class Process {
  constructor(pid, arrivalTime, burstTime, priority) {
    this.pid = pid;
    this.arrivalTime = parseInt(arrivalTime);
    this.burstTime = parseInt(burstTime);
    this.priority = parseInt(priority);

    // Simulation state
    this.remainingTime = this.burstTime;
    this.startTime = -1;
    this.completionTime = -1;
    this.waitingTime = 0;
    this.turnaroundTime = 0;
    this.responseTime = -1;
    this.isCompleted = false;
  }

  // Clone process for multiple runs
  clone() {
    return new Process(this.pid, this.arrivalTime, this.burstTime, this.priority);
  }
}

class SimulationEngine {
  constructor(processes, algorithm, config) {
    this.processes = processes.map(p => p.clone());
    this.algorithm = algorithm; // FCFS, SJF, RR, Priority
    this.config = config; // { quantum, contextSwitch, priorityMode }

    this.time = 0;
    this.gantt = []; // { pid, start, end, isContextSwitch }
    this.logs = [];
    this.completedProcesses = [];
    this.contextSwitches = 0;
    this.totalIdleTime = 0;
  }

  log(message) {
    this.logs.push({ time: this.time, message: `[Time ${this.time}] ${message}` });
  }

  addGanttBlock(pid, start, end, isContextSwitch = false) {
    if (start === end) return;
    this.gantt.push({ pid, start, end, isContextSwitch });
  }

  calculateMetrics() {
    let totalWT = 0;
    let totalTAT = 0;
    let totalRT = 0;
    const n = this.completedProcesses.length;

    if (n === 0) return null;

    this.completedProcesses.forEach(p => {
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitingTime = p.turnaroundTime - p.burstTime;

      totalWT += p.waitingTime;
      totalTAT += p.turnaroundTime;
      totalRT += p.responseTime;
    });

    const totalTime = this.time > 0 ? this.time : 1;
    const busyTime = totalTime - this.totalIdleTime;
    const utilization = (busyTime / totalTime) * 100;
    const throughput = n / totalTime;

    return {
      avgWT: (totalWT / n).toFixed(2),
      avgTAT: (totalTAT / n).toFixed(2),
      avgRT: (totalRT / n).toFixed(2),
      utilization: utilization.toFixed(2),
      throughput: throughput.toFixed(4),
      contextSwitches: this.contextSwitches,
      totalTime
    };
  }

  run() {
    this.log(`Starting simulation with ${this.algorithm}`);

    // Sort initially by arrival time
    this.processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Delegate to specific algorithm implementations
    switch (this.algorithm) {
      case "FCFS":
        window.runFCFS(this);
        break;
      case "SJF":
        window.runSJF(this);
        break;
      case "RR":
        window.runRR(this);
        break;
      case "Priority":
        window.runPriority(this);
        break;
    }

    this.log(`Simulation finished at time ${this.time}`);
    return {
      processes: this.completedProcesses,
      gantt: this.gantt,
      logs: this.logs,
      metrics: this.calculateMetrics()
    };
  }
}

window.Process = Process;
window.SimulationEngine = SimulationEngine;
