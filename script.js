/* ---------------------------------------------------
   DATABASE (Simulated)
-----------------------------------------------------*/
let employeeRequests = [];
let employees = [];
let tasks = [];
let completed = [];
let chatMessages = []; // {sender, receiver, text, time}

/* ---------------------------------------------------
   Navigation Helpers
-----------------------------------------------------*/
function hideAll() {
    document.querySelectorAll(".container").forEach(c => c.style.display="none");
}
function goHome() {
    hideAll();
    document.getElementById("mainMenu").style.display="block";
}
function showNewEmployee(){ hideAll(); document.getElementById("newEmployee").style.display="block"; }
function showExistingEmployee(){ hideAll(); document.getElementById("employeeLogin").style.display="block"; }
function showManagerLogin(){ hideAll(); document.getElementById("managerLogin").style.display="block"; }

/* ---------------------------------------------------
   EMPLOYEE REGISTRATION
-----------------------------------------------------*/
function registerEmployee() {
    let name = newName.value.trim();
    let email = newEmail.value.trim();
    let pass = newPass.value.trim();

    if (!email.endsWith("@gmail.com")) return alert("Email must end with @gmail.com");
    if (!name || !pass) return alert("Missing fields.");

    employeeRequests.push({name, email, pass, rank:"Junior", tasks:[], salary:[]});
    alert("Request sent to manager.");
    goHome();
}

/* ---------------------------------------------------
   MANAGER LOGIN
-----------------------------------------------------*/
function authenticateManager() {
    if (managerEmail.value !== "manager@gmail.com" || managerPass.value !== "admin123")
        return alert("Invalid Manager Credentials");

    hideAll();
    document.getElementById("managerDashboard").style.display="block";

    loadApprovalRequests();
    updateDropdowns();
    renderEmployees();
    renderTasks();
    updateChart();
    renderChatManager();
}

/* ---------------------------------------------------
   MANAGER – APPROVAL SYSTEM
-----------------------------------------------------*/
function loadApprovalRequests() {
    let section = document.getElementById("approvalSection");
    let box = document.getElementById("approvalList");

    if (employeeRequests.length === 0) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    box.innerHTML = "";

    employeeRequests.forEach((req, i) => {
        box.innerHTML += `
        <div class="emp-box">
            <b>${req.name}</b> — ${req.email}
            <button onclick="approve(${i})">Approve</button>
            <button onclick="deny(${i})">Deny</button>
        </div>`;
    });
}

function approve(i) {
    employees.push(employeeRequests[i]);
    employeeRequests.splice(i,1);
    loadApprovalRequests();
    updateDropdowns();
}

function deny(i) {
    employeeRequests.splice(i,1);
    loadApprovalRequests();
}

/* ---------------------------------------------------
   EMPLOYEE LOGIN
-----------------------------------------------------*/
let currentUser = null;

function loginEmployee() {
    let email = empEmail.value.trim();
    let pass = empPass.value.trim();

    let emp = employees.find(e => e.email === email && e.pass === pass);
    if (!emp) return alert("Invalid credentials or not approved.");

    currentUser = emp;

    hideAll();
    document.getElementById("employeeDashboard").style.display="block";
    empTitle.innerText = "Welcome " + emp.name;

    loadEmployeeTasks();
    renderChatEmployee();
}

/* ---------------------------------------------------
   TASK SYSTEM
-----------------------------------------------------*/
function updateDropdowns() {
    taskAssign.innerHTML = "";
    promoteSelect.innerHTML = "";
    salarySelect.innerHTML = "";

    employees.forEach(e => {
        taskAssign.innerHTML += `<option>${e.email}</option>`;
        promoteSelect.innerHTML += `<option>${e.email}</option>`;
        salarySelect.innerHTML += `<option>${e.email}</option>`;
    });
}

function assignTask() {
    let name = taskName.value;
    let pr = parseInt(taskPriority.value);
    let dl = parseInt(taskDeadline.value);
    let email = taskAssign.value;

    let emp = employees.find(e => e.email === email);

    let deadline = Date.now() + dl*1000;

    tasks.push({name, priority:pr, deadline, employee:email});
    emp.tasks.push({name, priority:pr});

    renderTasks();
    loadEmployeeTasks();
    updateChart();
}

function renderTasks() {
    pendingTasks.innerHTML = "";
    completedTasks.innerHTML = "";

    tasks.sort((a,b)=> b.priority - a.priority || a.deadline - b.deadline);

    tasks.forEach(t => {
        pendingTasks.innerHTML += `<div class="task-box">${t.name} - P${t.priority} - ${t.employee}</div>`;
    });

    completed.forEach(c => {
        completedTasks.innerHTML += `<div class="task-box">${c.name}</div>`;
    });
}

function executeTask() {
    if (!tasks.length) return alert("No tasks.");
    let t = tasks.shift();
    completed.push(t);
    renderTasks();
    updateChart();
}

function rescheduleTask() {
    let t = tasks.find(x => x.name === resName.value);
    if (!t) return alert("Task not found.");

    t.priority = parseInt(resPr.value);
    t.deadline = Date.now() + parseInt(resDl.value)*1000;

    renderTasks();
}

/* ---------------------------------------------------
   EMPLOYEE VIEW TASKS
-----------------------------------------------------*/
function loadEmployeeTasks() {
    if (!currentUser) return;
    empTaskList.innerHTML = "";

    currentUser.tasks.forEach(t => {
        empTaskList.innerHTML += `<div class="task-box">${t.name} — Priority ${t.priority}</div>`;
    });
}

/* ---------------------------------------------------
   EMPLOYEE LIST + PROMOTION
-----------------------------------------------------*/
function renderEmployees() {
    employeeList.innerHTML = "";
    employees.forEach(e => {
        employeeList.innerHTML += `<div class="emp-box">
            <b>${e.name}</b> (${e.email}) — <i>${e.rank}</i>
        </div>`;
    });
}

function promoteEmployee() {
    let email = promoteSelect.value;
    let rank = rankSelect.value;

    let emp = employees.find(e => e.email === email);
    emp.rank = rank;

    alert("Updated rank to " + rank);
    renderEmployees();
}

/* ---------------------------------------------------
   SALARY SYSTEM
-----------------------------------------------------*/
function paySalary() {
    let email = salarySelect.value;
    let amount = salaryAmount.value;

    let emp = employees.find(e => e.email === email);
    emp.salary.push(amount);

    salaryHistory.innerHTML += `<div class="task-box">
        Paid $${amount} to ${emp.name}
    </div>`;
}

/* ---------------------------------------------------
   ANALYTICS (Pie Chart)
-----------------------------------------------------*/
function updateChart() {
    const counts = employees.map(e => e.tasks.length);
    const labels = employees.map(e => e.name);

    if (window.taskChartInstance) window.taskChartInstance.destroy();

    window.taskChartInstance = new Chart(taskChart, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Contribution',
                data: counts,
                backgroundColor: ['#0043a7','#005dd1','#75aaff','#8cc0ff','#bad7ff']
            }]
        }
    });
}

/* ---------------------------------------------------
   CHAT SYSTEM (Slack Style)
-----------------------------------------------------*/
function sendEmployeeMessage() {
    let msg = empChatInput.value.trim();
    if (!msg) return;

    chatMessages.push({
        sender: currentUser.email,
        receiver: "manager@gmail.com",
        text: msg,
        time: new Date().toLocaleTimeString()
    });

    empChatInput.value = "";
    renderChatEmployee();
    renderChatManager();
}

function sendManagerMessage() {
    let msg = mgrChatInput.value.trim();
    if (!msg) return;

    chatMessages.push({
        sender: "manager@gmail.com",
        receiver: null,
        text: msg,
        time: new Date().toLocaleTimeString()
    });

    mgrChatInput.value = "";
    renderChatManager();
    renderChatEmployee();
}

function renderChatEmployee() {
    let box = empChatBox;
    box.innerHTML = "";

    chatMessages
        .filter(m => m.sender===currentUser.email || m.sender==="manager@gmail.com")
        .forEach(m => {
            let isMe = m.sender === currentUser.email;
            box.innerHTML += `
                <div class="message-block ${isMe ? 'msg-right' : ''}">
                    <div class="msg-user">${m.sender}</div>
                    <div class="msg-text">${m.text} <br><small>${m.time}</small></div>
                </div>`;
        });
    box.scrollTop = box.scrollHeight;
}

function renderChatManager() {
    let box = mgrChatBox;
    box.innerHTML = "";

    chatMessages.forEach(m => {
        box.innerHTML += `
            <div class="message-block">
                <div class="msg-user">${m.sender}</div>
                <div class="msg-text">${m.text} <br><small>${m.time}</small></div>
            </div>`;
    });
    box.scrollTop = box.scrollHeight;
}
