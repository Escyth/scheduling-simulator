// FCFS Algorithm
window.runFCFS = function (engine) {
  // Criteria is based on arrival time
  let queue = [...engine.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

  for (let i = 0; i < queue.length; i++) {
    let p = queue[i];

    // If the process has not arrived yet, add an idle block
    if (engine.time < p.arrivalTime) {
      engine.totalIdleTime += (p.arrivalTime - engine.time);
      engine.addGanttBlock("IDLE", engine.time, p.arrivalTime);
      engine.time = p.arrivalTime;
    }

    // If the context switch is enabled, add a context switch block
    if (i > 0 && engine.config.contextSwitch > 0) {
      engine.contextSwitches++;
      let csStart = engine.time;
      engine.time += parseInt(engine.config.contextSwitch);
      engine.addGanttBlock("CS", csStart, engine.time, true);
    }

    p.startTime = engine.time;
    // Response time is the time between the process's arrival and start time (first response)
    p.responseTime = p.startTime - p.arrivalTime;
    engine.log(`Process ${p.pid} started execution`);

    // Start execution of the process
    let execStart = engine.time;
    engine.time += p.burstTime;
    p.completionTime = engine.time;
    p.remainingTime = 0;
    p.isCompleted = true;

    engine.addGanttBlock(p.pid, execStart, engine.time);
    engine.log(`Process ${p.pid} completed execution`);

    // Add the process to the completed processes
    engine.completedProcesses.push(p);
  }
};

// SJF (Non-Preemptive)
window.runSJF = function (engine) {
  let remaining = [...engine.processes];
  let lastPid = null;

  while (remaining.length > 0) {
    // Filter to all processes that have arrived by the current time
    let available = remaining.filter(p => p.arrivalTime <= engine.time);

    // If no processes are available, add an idle block until first process arrives
    if (available.length === 0) {
      let nextArrival = Math.min(...remaining.map(p => p.arrivalTime));
      engine.totalIdleTime += (nextArrival - engine.time);
      engine.addGanttBlock("IDLE", engine.time, nextArrival);
      engine.time = nextArrival;
      continue;
    }

    // Sort the available processes by burst time (shortest), then by arrival time (earliest)
    available.sort((a, b) => {
      if (a.burstTime === b.burstTime) return a.arrivalTime - b.arrivalTime;
      return a.burstTime - b.burstTime;
    });

    let p = available[0];
    remaining = remaining.filter(proc => proc.pid !== p.pid);

    // If the context switch is enabled, add a context switch block
    if (lastPid !== null && engine.config.contextSwitch > 0) {
      engine.contextSwitches++;
      let csStart = engine.time;
      engine.time += parseInt(engine.config.contextSwitch);
      engine.addGanttBlock("CS", csStart, engine.time, true);
    }

    p.startTime = engine.time;
    p.responseTime = p.startTime - p.arrivalTime;
    engine.log(`Process ${p.pid} started execution`);

    let execStart = engine.time;
    engine.time += p.burstTime;
    p.completionTime = engine.time;
    p.remainingTime = 0;
    p.isCompleted = true;

    engine.addGanttBlock(p.pid, execStart, engine.time);
    engine.log(`Process ${p.pid} completed execution`);

    // Add the process to the completed processes
    engine.completedProcesses.push(p);
    lastPid = p.pid;
  }
};

// Round Robin
window.runRR = function (engine) {
  let quantum = parseInt(engine.config.quantum);
  let queue = [];
  let remaining = [...engine.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let lastPid = null;

  // Helper to add arrived processes to queue
  const checkArrivals = () => {
    while (remaining.length > 0 && remaining[0].arrivalTime <= engine.time) {
      queue.push(remaining.shift());
    }
  };

  // Initialize the queue with arrived processes
  checkArrivals();

  // While there are processes in the queue or remaining, continue the simulation
  while (queue.length > 0 || remaining.length > 0) {
    // If the queue is empty, add an idle block until first process arrives
    if (queue.length === 0) {
      let nextArrival = remaining[0].arrivalTime;
      engine.totalIdleTime += (nextArrival - engine.time);
      engine.addGanttBlock("IDLE", engine.time, nextArrival);
      engine.time = nextArrival;
      checkArrivals();
    }

    let p = queue.shift();

    // If the context switch is enabled, add a context switch block
    if (lastPid !== null && lastPid !== p.pid && engine.config.contextSwitch > 0) {
      engine.contextSwitches++;
      let csStart = engine.time;
      engine.time += parseInt(engine.config.contextSwitch);
      engine.addGanttBlock("CS", csStart, engine.time, true);
      checkArrivals();
    }

    // If the process has not started yet, set the start time and response time (first response)
    if (p.startTime === -1) {
      p.startTime = engine.time;
      p.responseTime = p.startTime - p.arrivalTime;
      engine.log(`Process ${p.pid} started execution`);
    }

    // Calculate the execution time (quantum or remaining time, whichever is less)
    let execTime = Math.min(p.remainingTime, quantum);
    let execStart = engine.time;
    engine.time += execTime;
    p.remainingTime -= execTime;

    engine.addGanttBlock(p.pid, execStart, engine.time);
    lastPid = p.pid;

    checkArrivals();

    // Two cases: if the process has completed or if it has been preempted
    if (p.remainingTime === 0) {
      p.completionTime = engine.time;
      p.isCompleted = true;
      engine.log(`Process ${p.pid} completed execution`);
      engine.completedProcesses.push(p);
    } else {
      engine.log(`Process ${p.pid} preempted (quantum expired)`);
      queue.push(p);
    }
  }
};

// Priority Scheduling
window.runPriority = function (engine) {
  let isPreemptive = engine.config.priorityMode === "preemptive";
  let remaining = [...engine.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let readyQueue = [];
  let currentProcess = null;
  let lastPid = null;

  const checkArrivals = () => {
    while (remaining.length > 0 && remaining[0].arrivalTime <= engine.time) {
      readyQueue.push(remaining.shift());
    }
  };

  while (remaining.length > 0 || readyQueue.length > 0 || currentProcess !== null) {
    checkArrivals();

    // If the priority mode is preemptive, and there is a current process and ready queue, check for preemption due to higher priority
    // Otherwise, continue with the current process
    if (isPreemptive && currentProcess !== null && readyQueue.length > 0) {
      readyQueue.sort((a, b) => {
        if (a.priority === b.priority) return a.arrivalTime - b.arrivalTime;
        return a.priority - b.priority;
      });

      if (readyQueue[0].priority < currentProcess.priority) {
        engine.log(`Process ${currentProcess.pid} preempted by higher priority process ${readyQueue[0].pid}`);
        readyQueue.push(currentProcess);
        currentProcess = null;
      }
    }

    // If the current process is null, check if there are any processes in the ready queue
    if (currentProcess === null) {
      if (readyQueue.length === 0) {
        let nextArrival = remaining[0].arrivalTime;
        engine.totalIdleTime += (nextArrival - engine.time);
        engine.addGanttBlock("IDLE", engine.time, nextArrival);
        engine.time = nextArrival;
        continue;
      }

      readyQueue.sort((a, b) => {
        if (a.priority === b.priority) return a.arrivalTime - b.arrivalTime;
        return a.priority - b.priority;
      });

      currentProcess = readyQueue.shift();

      // If the context switch is enabled, add a context switch block
      if (lastPid !== null && lastPid !== currentProcess.pid && engine.config.contextSwitch > 0) {
        engine.contextSwitches++;
        let csStart = engine.time;
        engine.time += parseInt(engine.config.contextSwitch);
        engine.addGanttBlock("CS", csStart, engine.time, true);
        checkArrivals();
      }

      if (currentProcess.startTime === -1) {
        currentProcess.startTime = engine.time;
        currentProcess.responseTime = currentProcess.startTime - currentProcess.arrivalTime;
        engine.log(`Process ${currentProcess.pid} started execution`);
      }
    }

    // Calculate the execution time (quantum or remaining time, whichever is less)
    let execTime = 0;
    if (isPreemptive && remaining.length > 0) {
      let nextArrival = remaining[0].arrivalTime;
      if (nextArrival < engine.time + currentProcess.remainingTime) {
        execTime = nextArrival - engine.time;
      } else {
        execTime = currentProcess.remainingTime;
      }
    } else {
      execTime = currentProcess.remainingTime;
    }

    if (execTime === 0) execTime = 1; // Safety fallback because it cannot be 0

    let execStart = engine.time;
    engine.time += execTime;
    currentProcess.remainingTime -= execTime;

    engine.addGanttBlock(currentProcess.pid, execStart, engine.time);
    lastPid = currentProcess.pid;

    if (currentProcess.remainingTime === 0) {
      currentProcess.completionTime = engine.time;
      currentProcess.isCompleted = true;
      engine.log(`Process ${currentProcess.pid} completed execution`);
      engine.completedProcesses.push(currentProcess);
      currentProcess = null;
    }
  }
};
