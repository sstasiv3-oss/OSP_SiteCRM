// =====================
// 1. НАЛАШТУВАННЯ ТА ДАНІ
// =====================
let currentPage = 1;
const itemsPerPage = 6; 
let currentFilteredList = []; 

async function initData() {
    if (!localStorage.getItem("clients") || localStorage.getItem("clients") === "[]") {
        try {
            const res = await fetch("clients.json");
            const data = await res.json();
            localStorage.setItem("clients", JSON.stringify(data));
        } catch (e) { console.error("Помилка завантаження clients.json:", e); }
    }
    if (!localStorage.getItem("users")) {
        try {
            const res = await fetch("users.json");
            localStorage.setItem("users", JSON.stringify(await res.json()));
        } catch (e) { console.error("Помилка завантаження users.json:", e); }
    }
}

const getClients = () => JSON.parse(localStorage.getItem("clients")) || [];
const currentUser = () => JSON.parse(localStorage.getItem("currentUser"));

// =====================
// 2. ВІДОБРАЖЕННЯ ТА ПАГІНАЦІЯ
// =====================

function updateCounters(count) {
    const mainCounter = document.getElementById("client-count");
    const adminCounter = document.getElementById("admin-results-count");
    if (mainCounter) mainCounter.innerText = count;
    if (adminCounter) adminCounter.innerText = count;
}

function renderPagination(totalItems) {
    const paginationEl = document.getElementById("pagination");
    if (!paginationEl) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;

    const prevLi = document.createElement("li");
    prevLi.innerHTML = `<button class="btn-pag" ${currentPage === 1 ? 'disabled' : ''}>←</button>`;
    prevLi.onclick = () => { if (currentPage > 1) { currentPage--; renderMainGrid(currentFilteredList); } };
    paginationEl.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.innerHTML = `<button class="btn-pag ${currentPage === i ? 'active' : ''}">${i}</button>`;
        li.onclick = () => { currentPage = i; renderMainGrid(currentFilteredList); };
        paginationEl.appendChild(li);
    }

    const nextLi = document.createElement("li");
    nextLi.innerHTML = `<button class="btn-pag" ${currentPage === totalPages ? 'disabled' : ''}>→</button>`;
    nextLi.onclick = () => { if (currentPage < totalPages) { currentPage++; renderMainGrid(currentFilteredList); } };
    paginationEl.appendChild(nextLi);
}

function renderMainGrid(list) {
    const grid = document.getElementById("clientsGrid");
    if (!grid) return;

    currentFilteredList = list;
    updateCounters(list.length);
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = list.slice(start, start + itemsPerPage);

    grid.innerHTML = paginatedItems.length === 0 ? "<p>Нічого не знайдено</p>" : 
    paginatedItems.map(c => `
        <article class="card-item">
        <h4 class="card-item__title" style="word-break: break-all;">${c.name}</h4>
            <p class="card-company" style="color: #5c59f2; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; text-transform: uppercase;">
                ${c.company || "Приватна особа"}
            </p>
            <p>📧 ${c.email}</p>
            <p>📞 ${c.phone}</p>
            <span class="card-itemtag">${c.status}</span>
        </article>
    `).join("");
    renderPagination(list.length);
}

function renderAdminTable(list) {
    const table = document.getElementById("adminTableBody");
    if (!table) return;
    updateCounters(list.length);
    table.innerHTML = list.map((c) => {
        const all = getClients();
        const realIndex = all.findIndex(orig => orig.email === c.email);
        return `<tr>
            <td><b>${c.name}</b></td>
            <td style="color: #5c59f2; font-weight: 600;">${c.company || "—"}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td><span class="card-itemtag">${c.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button onclick="prepareEdit(${realIndex})" class="btn-action btn-edit">Ред.</button>
                    <button onclick="deleteClient(${realIndex})" class="btn-action btn-del">Вид.</button>
                </div>
            </td>
        </tr>`;
    }).join("");
}

// =====================
// 3. ПОШУК ТА ФІЛЬТРИ
// =====================
function applyAllFilters() {
    currentPage = 1;
    const text = (document.getElementById("adminSearchInput")?.value || document.getElementById("searchInput")?.value || "").toLowerCase();
    const status = document.getElementById("adminStatusFilter")?.value || document.getElementById("statusFilter")?.value || "all";
    const filtered = getClients().filter(c => {
        const matchT = c.name.toLowerCase().includes(text) || c.email.toLowerCase().includes(text) || (c.company && c.company.toLowerCase().includes(text));
        const matchS = (status === "all") || (c.status === status);
        return matchT && matchS;
    });
    renderAdminTable(filtered);
    renderMainGrid(filtered);
}

// =====================
// 4. CRUD ОПЕРАЦІЇ
// =====================
function deleteClient(index) {
    if (confirm("Видалити клієнта?")) {
        const clients = getClients();
        clients.splice(index, 1);
        localStorage.setItem("clients", JSON.stringify(clients));
        refreshAll();
    }
}

function prepareEdit(index) {
    const c = getClients()[index];
    if (!c) return;
    document.getElementById("objName").value = c.name;
    document.getElementById("objCompany").value = c.company || "";
    document.getElementById("objEmail").value = c.email;
    document.getElementById("objPhone").value = c.phone;
    document.getElementById("objStatus").value = c.status;
    document.getElementById("editIndex").value = index;
    document.getElementById("submitBtn").innerText = "Оновити дані";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshAll() {
    const data = getClients();
    renderAdminTable(data);
    renderMainGrid(data);
}

// =====================
// 5. ЗАХИСТ ТА ЗАПУСК
// =====================
function checkAccess() {
    const user = currentUser();
    const path = window.location.pathname;
    const adminLink = document.querySelector('a[href="admin.html"]');
    const bugManagerLink = document.querySelector('a[href="bugmanager.html"]');
    const authSidebar = document.getElementById("auth-status-sidebar");

    if (!user) {
        if (authSidebar) authSidebar.innerHTML = `<li><a href="login.html" style="color:#4ade80; font-weight:bold;">Вхід у систему</a></li>`;
        if (adminLink) adminLink.parentElement.style.display = "none";
        if (bugManagerLink) bugManagerLink.parentElement.style.display = "none";
    } else if (user.role !== "admin") {
        if (adminLink) adminLink.parentElement.style.display = "none";
        if (bugManagerLink) bugManagerLink.parentElement.style.display = "none";
    }

    if ((path.includes("admin.html") || path.includes("bugmanager.html")) && (!user || user.role !== "admin")) {
        window.location.href = "index.html";
    }
}

window.onload = () => {
    initData().then(() => {
        const user = currentUser();
        const authStatus = document.getElementById("auth-status");
        if (authStatus) {
            if (user) {
                authStatus.innerHTML = `<span>${user.fullName} (<b>${user.role}</b>)</span> 
                <button onclick="localStorage.removeItem('currentUser'); location.reload();" class="btn-top-auth btn-logout">Вийти</button>`;
            } else {
                authStatus.innerHTML = `<a href="login.html" class="btn-top-auth" style="background-color:#22c55e;">Увійти</a>`;
            }
        }

        refreshAll();
        checkAccess();
        if (window.location.pathname.includes("bugmanager")) renderBugReports();

        ["adminSearchInput", "searchInput", "adminStatusFilter", "statusFilter"].forEach(id => {
            document.getElementById(id)?.addEventListener("input", applyAllFilters);
            document.getElementById(id)?.addEventListener("change", applyAllFilters);
        });

        document.getElementById("adminCrudForm")?.addEventListener("submit", (e) => {
            e.preventDefault();
            const clients = getClients();
            const index = document.getElementById("editIndex").value;
            const data = {
                name: document.getElementById("objName").value,
                company: document.getElementById("objCompany").value,
                email: document.getElementById("objEmail").value,
                phone: document.getElementById("objPhone").value,
                status: document.getElementById("objStatus").value
            };
            if (index === "") clients.unshift(data);
            else clients[index] = data;
            localStorage.setItem("clients", JSON.stringify(clients));
            location.reload();
        });
    });
};

// =====================
// 6. СИСТЕМА БАГІВ
// =====================
const bugForm = document.getElementById("bugReportForm");
if (bugForm) {
    bugForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = currentUser();
        const report = {
            id: Date.now(),
            subject: document.getElementById("bugSubject").value,
            category: document.getElementById("bugCategory").value,
            description: document.getElementById("bugText").value,
            userName: user ? user.fullName : "Гість",
            userRole: user ? user.role : "немає",
            date: new Date().toLocaleString(),
            status: "Новий"
        };
        const bugs = JSON.parse(localStorage.getItem("systemBugs")) || [];
        bugs.unshift(report);
        localStorage.setItem("systemBugs", JSON.stringify(bugs));
        bugForm.style.display = "none";
        document.getElementById("reportSuccess").style.display = "block";
        setTimeout(() => { window.location.href = "index.html"; }, 2500);
    });
}

function renderBugReports() {
    const container = document.getElementById("bugReportsList");
    const countEl = document.getElementById("bug-count");
    if (!container) return;
    const bugs = JSON.parse(localStorage.getItem("systemBugs")) || [];
    if (countEl) countEl.innerText = bugs.length;
    
    container.innerHTML = bugs.map((bug, index) => `
        <article class="card-item" style="border-left: 5px solid ${getStatusColor(bug.status)}">
            <h4 class="card-itemtitle">${bug.subject}</h4>
            <div class="card-company">${bug.category}</div>
            <p style="background: #f8fafc; padding: 10px; border-radius: 8px;">${bug.description}</p>
            <p style="font-size: 0.8rem;">Від: <b>${bug.userName}</b> | ${bug.date}</p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="changeBugStatus(${index})" class="btn-action btn-edit">Статус</button>
                <button onclick="deleteBug(${index})" class="btn-action btn-del">Видалити</button>
            </div>
        </article>`).join("");
}

function getStatusColor(s) { return s === "Виправлено" ? "#22c55e" : s === "В процесі" ? "#3b82f6" : "#f59e0b"; }
function deleteBug(i) { let b = JSON.parse(localStorage.getItem("systemBugs")); b.splice(i,1); localStorage.setItem("systemBugs", JSON.stringify(b)); renderBugReports(); }
function changeBugStatus(i) {
    let b = JSON.parse(localStorage.getItem("systemBugs"));
    const s = ["Новий", "В процесі", "Виправлено"];
    b[i].status = s[(s.indexOf(b[i].status) + 1) % 3];
    localStorage.setItem("systemBugs", JSON.stringify(b));
    renderBugReports();
}