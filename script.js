const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6uZlCfhgSGGCGfZeQAwhZdTLZmnfi19ljMknQKfpvJR3jOxSnNAJcWw-ZeUqaU1GY/exec';

// 1. AUTO-FORMAT & IDLE RESET TRIGGER
document.getElementById('carReg').addEventListener('input', function (e) {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, ''); 
    e.target.value = value;
    resetIdleTimer(); // Restarts the 30s countdown
});

// 2. TOGGLE LOGS
function toggleLogsView() {
    const panel = document.getElementById('logsPanel');
    const button = document.getElementById('toggleLogsBtn');
    if (panel.style.display === "none" || panel.style.display === "") {
        panel.style.display = "block";
        button.innerText = "HIDE RECENT ENTRIES";
        fetchLogs();
    } else {
        panel.style.display = "none";
        button.innerText = "SHOW RECENT ENTRIES";
    }
    resetIdleTimer();
}

// 3. SEND DATA
async function sendData() {
    const input = document.getElementById('carReg');
    const btn = document.getElementById('submitBtn');
    const status = document.getElementById('status');
    const panel = document.getElementById('logsPanel');
    const toggleBtn = document.getElementById('toggleLogsBtn');
    const reg = input.value.trim().toUpperCase();
    
    if (!reg) return;

    // Duplicate Check
    const existingEntries = Array.from(document.querySelectorAll('.reg-cell')).map(td => td.innerText.toUpperCase());
    if (existingEntries.includes(reg)) {
        status.innerText = "VEHICLE ALREADY REGISTERED";
        status.style.color = "#e53e3e";
        input.value = "";
        setTimeout(() => { status.innerText = ""; }, 5000);
        return; 
    }

    // Success Animation Trigger
    status.classList.remove('animate-status');
    void status.offsetWidth; 
    status.classList.add('animate-status');

    // Optimistic UI: Instant Success
    const savedReg = reg; 
    input.value = ""; 
    status.innerText = "REGISTRATION COMPLETED";
    status.style.color = "#c5a059";
    
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 1000);

    // Background transmission with Error Catch
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ reg: savedReg }) })
    .then(() => {
        fetchLogs();
    })
    .catch(err => {
        status.innerText = "CONNECTION ERROR - CHECK WI-FI";
        status.style.color = "#e53e3e";
    });

    // Post-Submit Reset: Hides message and logs after 10 seconds
    setTimeout(() => {
        if (status.innerText === "REGISTRATION COMPLETED") {
            status.innerText = "";
            panel.style.display = "none";
            toggleBtn.innerText = "SHOW RECENT ENTRIES";
        }
    }, 10000);
}

// 4. FETCH LOGS
async function fetchLogs() {
    const tbody = document.getElementById('logBody');
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        tbody.innerHTML = "";
        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:#718096; padding:20px;">No entries today</td></tr>`;
            return;
        }
        data.forEach(row => {
            const time = new Date(row[1]).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            tbody.innerHTML += `<tr><td class="reg-cell">${row[0]}</td><td class="time-cell">${time}</td></tr>`;
        });
    } catch (e) { console.log("Logs updated."); }
}

// 5. INACTIVITY WATCHER (30s Reset)
let idleTimer;
function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        const input = document.getElementById('carReg');
        const status = document.getElementById('status');
        const panel = document.getElementById('logsPanel');
        const toggleBtn = document.getElementById('toggleLogsBtn');

        // Wipe everything if tablet is untouched for 30 seconds
        input.value = "";
        status.innerText = "";
        panel.style.display = "none";
        toggleBtn.innerText = "SHOW RECENT ENTRIES";
        console.log("Kiosk auto-reset performed");
    }, 30000); // 30 seconds
}

// Initialize
window.onload = () => {
    fetchLogs();
    resetIdleTimer();
};

// Reset timer on any screen interaction
document.addEventListener('touchstart', resetIdleTimer);
document.addEventListener('mousedown', resetIdleTimer);