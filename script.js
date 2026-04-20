import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 1. НАЛАШТУВАННЯ SUPABASE
const supabaseUrl = 'https://mqvznnhiniqadngotizq.supabase.co'
const supabaseKey = 'sb_publishable_GmsljKr6QkiBMpljKEXg9Q_cD-iGU1u'
const supabase = createClient(supabaseUrl, supabaseKey)

// Налаштування пагінації
let currentPage = 1;
const itemsPerPage = 6; 
let currentFilteredList = []; 

// =====================
// 1. РОБОТА З ДАНИМИ (СИНХРОНІЗАЦІЯ З SUPABASE)
// =====================

async function initData() {
    // Отримуємо клієнтів з Supabase
    const { data: clients, error } = await supabase.from('clients').select('*');
    if (error) console.error("Помилка завантаження клієнтів:", error);
    else localStorage.setItem("clients", JSON.stringify(clients));

    // Отримуємо користувачів
    const { data: users, error: userError } = await supabase.from('users').select('*');
    if (userError) console.error("Помилка завантаження користувачів:", userError);
    else localStorage.setItem("users", JSON.stringify(users));
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
        return `<tr>
            <td><b style="word-break: break-all;">${c.name}</b></td>
            <td style="color: #5c59f2; font-weight: 600;">${c.company || "—"}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td><span class="card-itemtag">${c.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button onclick="prepareEdit('${c.id}')" class="btn-action btn-edit">Ред.</button>
                    <button onclick="deleteClient('${c.id}')" class="btn-action btn-del">Вид.</button>
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
// 4. CRUD ОПЕРАЦІЇ (SUPABASE)
// =====================
async function deleteClient(id) {
    if (confirm("Видалити клієнта?")) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) alert("Помилка видалення");
        else {
            await initData();
            refreshAll();
        }
    }
}

async function prepareEdit(id) {
    const clients = getClients();
    const c = clients.find(item => item.id === id);
    if (!c) return;
    document.getElementById("objName").value = c.name;
    document.getElementById("objCompany").value = c.company || "";
    document.getElementById("objEmail").value = c.email;
    document.getElementById("objPhone").value = c.phone;
    document.getElementById("objStatus").value = c.status;
    document.getElementById("editIndex").value = id; // Тепер тут ID бази даних
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

        document.getElementById("adminCrudForm")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("editIndex").value;
            const clientData = {
                name: document.getElementById("objName").value,
                company: document.getElementById("objCompany").value,
                email: document.getElementById("objEmail").value,
                phone: document.getElementById("objPhone").value,
                status: document.getElementById("objStatus").value
            };

            if (id === "") {
                // Створення нового
                await supabase.from('clients').insert([clientData]);
            } else {
                // Оновлення існуючого
                await supabase.from('clients').update(clientData).eq('id', id);
            }

            await initData();
            location.reload();
        });
    });
};

// =====================
// 6. СИСТЕМА БАГІВ (SUPABASE)
// =====================
const bugForm = document.getElementById("bugReportForm");
if (bugForm) {
    bugForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = currentUser();
        const report = {
            subject: document.getElementById("bugSubject").value,
            category: document.getElementById("bugCategory").value,
            description: document.getElementById("bugText").value,
            user_name: user ? user.fullName : "Гість",
            user_role: user ? user.role : "немає",
            status: "Новий"
        };

        const { error } = await supabase.from('bugs').insert([report]);
        
        if (!error) {
            bugForm.style.display = "none";
            document.getElementById("reportSuccess").style.display = "block";
            setTimeout(() => { window.location.href = "index.html"; }, 2500);
        }
    });
}

async function renderBugReports() {
    const container = document.getElementById("bugReportsList");
    if (!container) return;

    const { data: bugs, error } = await supabase.from('bugs').select('*').order('created_at', { ascending: false });
    if (error) return;

    const countEl = document.getElementById("bug-count");
    if (countEl) countEl.innerText = bugs.length;
    
    container.innerHTML = bugs.map((bug) => `
        <article class="card-item" style="border-left: 5px solid ${getStatusColor(bug.status)}">
            <h4 class="card-itemtitle" style="word-break: break-all;">${bug.subject}</h4>
            <div class="card-company">${bug.category}</div>
            <p style="background: #f8fafc; padding: 10px; border-radius: 8px; word-break: break-all;">${bug.description}</p>
            <p style="font-size: 0.8rem;">Від: <b>${bug.user_name}</b> | ${new Date(bug.created_at).toLocaleString()}</p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="changeBugStatus('${bug.id}', '${bug.status}')" class="btn-action btn-edit">Статус</button>
                <button onclick="deleteBug('${bug.id}')" class="btn-action btn-del">Видалити</button>
            </div>
        </article>`).join("");
}

function getStatusColor(s) { return s === "Виправлено" ? "#22c55e" : s === "В процесі" ? "#3b82f6" : "#f59e0b"; }

async function deleteBug(id) {
    await supabase.from('bugs').delete().eq('id', id);
    renderBugReports();
}

async function changeBugStatus(id, currentStatus) {
    const statuses = ["Новий", "В процесі", "Виправлено"];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % 3];
    await supabase.from('bugs').update({ status: nextStatus }).eq('id', id);
    renderBugReports();
}