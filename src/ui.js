class UIManager {
  constructor() {
    this.colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];
    this.processColors = {};
  }

  getColor(pid) {
    if (pid === "IDLE") return "bg-gray-200";
    if (pid === "CS") return "bg-red-500";

    if (!this.processColors[pid]) {
      this.processColors[pid] = this.colors[Object.keys(this.processColors).length % this.colors.length];
    }
    return this.processColors[pid];
  }

  renderProcessTable(processes, onDelete) {
    const tbody = document.getElementById("process-table-body");
    tbody.innerHTML = "";

    processes.forEach((p, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-4 py-2 whitespace-nowrap text-center font-medium text-gray-900">${p.pid}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${p.arrivalTime}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${p.burstTime}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${p.priority}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
          <button class="text-red-600 hover:text-red-900 delete-btn" data-index="${index}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        onDelete(parseInt(e.target.getAttribute("data-index")));
      });
    });
  }

  renderGanttChart(gantt, totalTime) {
    const container = document.getElementById("gantt-chart-container");
    const timeline = document.getElementById("gantt-timeline");

    container.innerHTML = "";
    timeline.innerHTML = "";

    if (gantt.length === 0) {
      container.innerHTML = "<div class='w-full h-full flex items-center justify-center text-gray-400'>No data</div>";
      return;
    }

    // Merge adjacent blocks of same PID
    let mergedGantt = [];
    let currentBlock = null;

    gantt.forEach(block => {
      if (!currentBlock) {
        currentBlock = { ...block };
      } else if (currentBlock.pid === block.pid) {
        currentBlock.end = block.end;
      } else {
        mergedGantt.push(currentBlock);
        currentBlock = { ...block };
      }
    });
    if (currentBlock) mergedGantt.push(currentBlock);

    mergedGantt.forEach((block, index) => {
      const duration = block.end - block.start;
      const widthPercent = (duration / totalTime) * 100;

      const blockDiv = document.createElement("div");
      blockDiv.className = `h-full flex items-center justify-center text-xs font-bold text-white border-r border-white/20 ${this.getColor(block.pid)}`;
      blockDiv.style.width = `${widthPercent}%`;
      blockDiv.title = `${block.pid} (${block.start} - ${block.end})`;

      if (block.pid !== "IDLE" && block.pid !== "CS") {
        blockDiv.textContent = block.pid;
      } else if (block.pid === "CS") {
        blockDiv.textContent = "CS";
      }

      container.appendChild(blockDiv);

      // Timeline marker
      if (index === 0) {
        const startMarker = document.createElement("div");
        startMarker.className = "absolute";
        startMarker.style.left = "0%";
        startMarker.textContent = block.start;
        timeline.appendChild(startMarker);
      }

      const endMarker = document.createElement("div");
      endMarker.className = "absolute transform -translate-x-1/2";

      // Calculate cumulative width for marker position
      let cumulativeWidth = 0;
      for (let i = 0; i <= index; i++) {
        cumulativeWidth += (mergedGantt[i].end - mergedGantt[i].start);
      }

      endMarker.style.left = `${(cumulativeWidth / totalTime) * 100}%`;
      endMarker.textContent = block.end;
      timeline.appendChild(endMarker);
    });

    timeline.classList.add("relative", "h-4");
  }

  renderMetrics(processes, metrics) {
    const tbody = document.getElementById("metrics-table-body");
    tbody.innerHTML = "";

    // Sort processes by PID for consistent display
    const sorted = [...processes].sort((a, b) => a.pid.localeCompare(b.pid));

    sorted.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-3 py-2 whitespace-nowrap text-center font-medium text-gray-900">${p.pid}</td>
        <td class="px-3 py-2 whitespace-nowrap text-center text-gray-500">${p.waitingTime}</td>
        <td class="px-3 py-2 whitespace-nowrap text-center text-gray-500">${p.turnaroundTime}</td>
        <td class="px-3 py-2 whitespace-nowrap text-center text-gray-500">${p.responseTime}</td>
        <td class="px-3 py-2 whitespace-nowrap text-center text-gray-500">${p.completionTime}</td>
      `;
      tbody.appendChild(tr);
    });

    if (metrics) {
      document.getElementById("avg-wt").textContent = metrics.avgWT;
      document.getElementById("avg-tat").textContent = metrics.avgTAT;
      document.getElementById("avg-rt").textContent = metrics.avgRT;
      document.getElementById("throughput").textContent = metrics.throughput;
      document.getElementById("utilization").textContent = `${metrics.utilization}%`;
      document.getElementById("context-switches").textContent = metrics.contextSwitches;
    }
  }

  renderLogs(logs) {
    const container = document.getElementById("event-log-container");
    container.innerHTML = logs.map(log => `<div>> ${log}</div>`).join("");
    container.scrollTop = container.scrollHeight;
  }

  renderComparison(results) {
    const section = document.getElementById("comparison-section");
    const tbody = document.getElementById("comparison-table-body");

    section.classList.remove("hidden");
    tbody.innerHTML = "";

    results.forEach(res => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-4 py-2 whitespace-nowrap text-center font-medium text-gray-900">${res.algorithm}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${res.metrics.avgWT}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${res.metrics.avgTAT}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${res.metrics.avgRT}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${res.metrics.throughput}</td>
        <td class="px-4 py-2 whitespace-nowrap text-center text-gray-500">${res.metrics.contextSwitches}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

window.UIManager = UIManager;
