/* ===== Typing effect ===== */
const textArray = [
  "I am M. Choirul Rozikin.",
  "I build and secure networks.",
  "Debian | MikroTik | Cisco | Windows Server",
  "Learning cyber security every day.",
  "Welcome to my portfolio."
];
let textIndex = 0;
let charIndex = 0;
const typewriterElement = document.getElementById("typewriter");

function type() {
  if (charIndex < textArray[textIndex].length) {
    typewriterElement.textContent += textArray[textIndex].charAt(charIndex);
    charIndex++;
    setTimeout(type, 80);
  } else {
    setTimeout(erase, 2000);
  }
}

function erase() {
  if (charIndex > 0) {
    typewriterElement.textContent = textArray[textIndex].substring(0, charIndex - 1);
    charIndex--;
    setTimeout(erase, 40);
  } else {
    textIndex = (textIndex + 1) % textArray.length;
    setTimeout(type, 500);
  }
}
setTimeout(type, 800);

/* ===== Sidebar logs ===== */
const logContainer = document.getElementById("sidebar-logs");
const logMessages = [
  "SCANNING PORT 80...",
  "ESTABLISHING VPN TUNNEL...",
  "LOAD BALANCING IN PROGRESS...",
  "MTCNA PROTOCOL ACTIVE...",
  "FIREWALL ROUTING: OK",
  "DEBIAN SERVER ONLINE",
  "CCNA RULESET APPLIED",
  "IP SPOOFING ATTEMPT BLOCKED",
  "THREAT LEVEL: LOW",
  "ROUTING PACKET RECEIVED",
  "ACCESS GRANTED TO PORTFOLIO",
  "BACKUP SEQUENCE STAGED"
];

function addSidebarLog() {
  if (!logContainer) return;
  const line = document.createElement("div");
  line.textContent = "> " + logMessages[Math.floor(Math.random() * logMessages.length)];
  logContainer.appendChild(line);
  while (logContainer.childNodes.length > 5) {
    logContainer.removeChild(logContainer.firstChild);
  }
  setTimeout(addSidebarLog, Math.random() * 1500 + 800);
}
setTimeout(addSidebarLog, 1500);

/* ===== Live telemetry bars ===== */
function setBar(barId, value, labelId) {
  document.getElementById(barId).style.width = value + "%";
  document.getElementById(labelId).textContent = value + "%";
}

function tickTelemetry() {
  setBar("b-cpu", 30 + Math.floor(Math.random() * 35), "v-cpu");
  setBar("b-mem", 55 + Math.floor(Math.random() * 25), "v-mem");
}
tickTelemetry();
setInterval(tickTelemetry, 2000);