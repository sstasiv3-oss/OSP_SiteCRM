import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ==========================================
// 1. НАЛАШТУВАННЯ SUPABASE
// ==========================================
const supabaseUrl = 'https://mqvznnhiniqadngotizq.supabase.co'
const supabaseKey = 'sb_publishable_GmsljKr6QkiBMpljKEXg9Q_cD-iGU1u'
const supabase = createClient(supabaseUrl, supabaseKey)

// Глобальні змінні
let currentPage = 1;
const itemsPerPage = 6; 
let currentFilteredList = []; 

const getClients = () => JSON.parse(localStorage.getItem("clients")) || [];
const currentUser = () => JSON.parse(localStorage.getItem("currentUser"));

// ==========================================
// 2. АВТОРИЗАЦІЯ ТА РОБОТА З ДАНИМИ
// ==========================================

// Функція входу (шукає по username та password)
window.loginUser = async function(username, password) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !user) {
            alert("Невірний логін або пароль!");
            return;
        }

        // Зберігаємо юзера в пам'ять
        const userData = {
            id: user.id,
            fullName: user.fullName || "Користувач",
            role: user.role || "manager",
            username: user.username
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        window.location.href = "index.html";
    } catch (e) {
        console.error("Помилка входу:", e.message);
        alert("Сталася помилка при спробі входу.");
    }
};

// Завантаження всіх даних
async function initData() {
    try {
        const { data: clients, error: clError } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (clError) throw clError;
        localStorage.setItem("clients", JSON.stringify(clients || []));

        const { data: users, error: usError } = await supabase.from('users').select('*');
        localStorage.setItem("users", JSON.stringify(usError ? [] : (users || [])));
    } catch (e) {
        console.error("Помилка ініціалізації:", e.message);
    }
}

// ==========================================
// 3. ВІДОБРАЖЕННЯ (ГОЛОВНА ТА АДМІНКА)
// ==========================================

function updateCounters(count) {
    const mainCounter = document.getElementById("client-count");
    const adminCounter = document.getElementById("admin-results-count");
    if (mainCounter) mainCounter.innerText = count;
    if (adminCounter) adminCounter.innerText = count;
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
        <article class="card-item" onclick="showClientDetails('${c.id}')" style="cursor: pointer; overflow-wrap: break-word; min-width: 0;">
            <h4 class="card-item__title" style="word-break: break-all;">${c.name}</h4>
            <p class="card-company" style="color: #5c59f2; font-weight: 700; word-break: break-all;">${c.company || "Приватна особа"}</p>
            <p style="word-break: break-all;">📧 ${c.email}</p>
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

    table.innerHTML = list.map((c) => `
        <tr>
            <td style="word-break: break-all; max-width: 150px;"><b>${c.name}</b></td>
            <td style="word-break: break-all;">${c.company || "—"}</td>
            <td style="word-break: break-all;">${c.email}</td>
            <td>${c.phone}</td>
            <td><span class="card-itemtag">${c.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button onclick="prepareEdit('${c.id}')" class="btn-action btn-edit">Ред.</button>
                    <button onclick="deleteClient('${c.id}')" class="btn-action btn-del">Вид.</button>
                </div>
            </td>
        </tr>
    `).join("");
}

// ==========================================
// 4. МЕНЕДЖМЕНТ-ПАНЕЛЬ ТА МОДАЛКА КЛІЄНТА
// ==========================================

window.showClientDetails = function(id) {
    const client = getClients().find(c => String(c.id) === String(id));
    if (!client) return;

    let modal = document.getElementById("client-info-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "client-info-modal";
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(30,41,59,0.7); display:flex; justify-content:center; align-items:center; z-index:9999; backdrop-filter:blur(4px);";
        document.body.appendChild(modal);
    } else {
        modal.style.display = "flex";
    }

    const managerName = client.manager || "Не призначено";

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 450px; position: relative; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <button onclick="document.getElementById('client-info-modal').style.display='none'" style="position: absolute; right: 20px; top: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;">&times;</button>
            
            <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 1.5rem; word-break: break-all;">${client.name}</h2>
            <span class="card-itemtag" style="display: inline-block; margin-bottom: 20px;">${client.status}</span>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: bold; color: #64748b; text-transform: uppercase;">Компанія</div>
                    <div style="font-size: 1rem; color: #4f46e5; font-weight: 600; word-break: break-all;">${client.company || "Приватна особа"}</div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; font-weight: bold; color: #64748b; text-transform: uppercase;">Email</div>
                    <div style="word-break: break-all;"><a href="mailto:${client.email}" style="color: #1e293b; text-decoration: none;">${client.email}</a></div>
                </div>
                <div>
                    <div style="font-size: 0.75rem; font-weight: bold; color: #64748b; text-transform: uppercase;">Телефон</div>
                    <div><a href="tel:${client.phone}" style="color: #1e293b; text-decoration: none;">${client.phone}</a></div>
                </div>
                
                <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border-left: 3px solid #6366f1;">
                    <div style="font-size: 0.75rem; font-weight: bold; color: #64748b; text-transform: uppercase;">Відповідальний менеджер</div>
                    <div style="font-size: 0.95rem; color: #1e293b; font-weight: 500; margin-top: 3px;">${managerName}</div>
                </div>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 5px;">
                    <div style="font-size: 0.75rem; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Нотатки менеджера</div>
                    <div style="font-size: 0.9rem; color: #334155; line-height: 1.5; word-break: break-word;">${client.note || "Немає приміток."}</div>
                </div>
            </div>
        </div>
    `;

    modal.onclick = function(event) {
        if (event.target === modal) modal.style.display = "none";
    };
};

function renderManagementStats() {
    const clients = getClients();
    const total = clients.length;
    
    const vip = clients.filter(c => ['vip', 'постійний'].includes(c.status?.toLowerCase())).length;
    const newLeads = clients.filter(c => ['новий', 'new'].includes(c.status?.toLowerCase())).length;

    if (document.getElementById("total-clients")) document.getElementById("total-clients").innerText = total;
    if (document.getElementById("vip-clients")) document.getElementById("vip-clients").innerText = vip;
    if (document.getElementById("new-leads")) document.getElementById("new-leads").innerText = newLeads;

    const distributionEl = document.getElementById("status-distribution");
    if (distributionEl && total > 0) {
        const statuses = {};
        clients.forEach(c => { statuses[c.status] = (statuses[c.status] || 0) + 1; });

        distributionEl.innerHTML = Object.entries(statuses).map(([name, count]) => {
            const percent = Math.round((count / total) * 100);
            return `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem;">
                        <span>${name}</span><b>${count} (${percent}%)</b>
                    </div>
                    <div style="background: #edf2f7; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background: #6366f1; width: ${percent}%; height: 100%;"></div>
                    </div>
                </div>`;
        }).join("");
    }
}

function renderManagementTable(list) {
    const tableBody = document.getElementById("client-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = (!list || list.length === 0) ? "<tr><td colspan='3'>Нічого не знайдено</td></tr>" : 
    list.map(c => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px;">
                <div style="font-weight: 700;">${c.name}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${c.email || ''}</div>
            </td>
            <td><span class="card-itemtag" style="font-size: 0.7rem; padding: 2px 8px;">${c.status}</span></td>
            <td style="text-align: right;">
                <button class="btn-action btn-edit" onclick="selectClientForEdit('${c.id}')">✎</button>
            </td>
        </tr>`).join("");
}

window.selectClientForEdit = async function(id) {
    const client = getClients().find(c => String(c.id) === String(id));
    if (!client) return;

    const editZone = document.getElementById("edit-zone");
    if (editZone) {
        editZone.style.display = "block";
        
        editZone.innerHTML = `
            <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: #4f46e5;">Редагування: ${client.name}</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                    <label style="font-size: 0.7rem; font-weight: bold; color: #64748b;">СТАТУС</label>
                    <select id="edit-status" class="form-input" style="width: 100%; padding: 5px; font-size: 0.85rem;">
                        <option value="Новий" ${client.status === 'Новий' ? 'selected' : ''}>Новий</option>
                        <option value="В роботі" ${client.status === 'В роботі' ? 'selected' : ''}>В роботі</option>
                        <option value="Постійний" ${client.status === 'Постійний' ? 'selected' : ''}>Постійний</option>
                        <option value="VIP" ${client.status === 'VIP' ? 'selected' : ''}>VIP</option>
                        <option value="active" ${client.status === 'active' ? 'selected' : ''}>active</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 0.7rem; font-weight: bold; color: #64748b;">МЕНЕДЖЕР</label>
                    <input type="text" id="edit-manager" class="form-input" placeholder="Ім'я..." value="${client.manager || ''}" style="width: 100%; padding: 5px; font-size: 0.85rem;">
                </div>
            </div>
            <label style="font-size: 0.7rem; font-weight: bold; color: #64748b;">НОТАТКИ</label>
            <textarea id="edit-note" class="form-input" style="width: 100%; height: 50px; font-size: 0.8rem;" placeholder="Примітка...">${client.note || ""}</textarea>
            <button id="save-edit-btn" class="btn-submit" style="width: 100%; margin-top: 10px; padding: 8px; font-size: 0.85rem;">Зберегти зміни</button>
        `;

        const saveBtn = document.getElementById("save-edit-btn");
        saveBtn.onclick = async () => {
            saveBtn.innerText = "Зберігаю...";
            const updatedData = {
                status: document.getElementById("edit-status").value,
                manager: document.getElementById("edit-manager").value,
                note: document.getElementById("edit-note").value
            };
            const { error } = await supabase.from('clients').update(updatedData).eq('id', id);
            if (!error) location.reload();
            else { alert("Помилка: " + error.message); saveBtn.innerText = "Зберегти зміни"; }
        };
    }
};

// ==========================================
// 5. ФІЛЬТРИ ТА КЕРУВАННЯ
// ==========================================

window.deleteClient = async (id) => { 
    if (confirm("Видалити клієнта?")) { 
        const { error } = await supabase.from('clients').delete().eq('id', id); 
        if (error) alert("Помилка: " + error.message);
        else { await initData(); location.reload(); } 
    } 
};

window.prepareEdit = function(id) {
    const client = getClients().find(item => String(item.id) === String(id));
    if (!client) return;

    document.getElementById("objName").value = client.name;
    document.getElementById("objCompany").value = client.company || "";
    document.getElementById("objEmail").value = client.email;
    document.getElementById("objPhone").value = client.phone;
    document.getElementById("objStatus").value = client.status;
    document.getElementById("editIndex").value = id; 
    document.getElementById("submitBtn").innerText = "Оновити дані";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function applyAllFilters() {
    currentPage = 1;
    const text = (document.getElementById("adminSearchInput")?.value || document.getElementById("searchInput")?.value || "").toLowerCase();
    const status = document.getElementById("adminStatusFilter")?.value || document.getElementById("statusFilter")?.value || "all";
    
    const filtered = getClients().filter(c => {
        const matchT = c.name.toLowerCase().includes(text) || c.email.toLowerCase().includes(text);
        const matchS = (status === "all") || (c.status === status);
        return matchT && matchS;
    });

    renderAdminTable(filtered);
    renderMainGrid(filtered);
}
window.applyAllFilters = applyAllFilters;

function refreshAll() {
    const data = getClients();
    renderAdminTable(data);
    renderMainGrid(data);
}

// ==========================================
// 6. ПАГІНАЦІЯ
// ==========================================

function renderPagination(totalItems) {
    const el = document.getElementById("pagination");
    if (!el) return;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    el.innerHTML = "";
    if (totalPages <= 1) return;

    const container = document.createElement("ul");
    container.className = "pagination-container";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.gap = "10px";
    container.style.listStyle = "none";

    const prevLi = document.createElement("li");
    prevLi.innerHTML = `<button class="btn-pag" ${currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>«</button>`;
    prevLi.onclick = () => { if (currentPage > 1) { currentPage--; renderMainGrid(currentFilteredList); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
    container.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.innerHTML = `<button class="btn-pag ${currentPage === i ? 'active' : ''}">${i}</button>`;
        li.onclick = () => { currentPage = i; renderMainGrid(currentFilteredList); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        container.appendChild(li);
    }

    const nextLi = document.createElement("li");
    nextLi.innerHTML = `<button class="btn-pag" ${currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>»</button>`;
    nextLi.onclick = () => { if (currentPage < totalPages) { currentPage++; renderMainGrid(currentFilteredList); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
    container.appendChild(nextLi);

    el.appendChild(container);
}

// ==========================================
// 7. СИСТЕМА БАГІВ
// ==========================================

async function renderBugReports() {
    const container = document.getElementById("bugReportsList");
    if (!container) return;
    const { data: bugs } = await supabase.from('bugs').select('*').order('created_at', { ascending: false });
    
    container.innerHTML = (!bugs || bugs.length === 0) ? "<p>Звітів немає.</p>" : 
    bugs.map(bug => `
        <article class="card-item" style="border-left: 5px solid ${getStatusColor(bug.status)}; margin-bottom: 15px; padding: 15px;">
            <h4 style="word-break: break-all;">${bug.subject}</h4>
            <div style="color: #5c59f2; font-weight: bold; font-size: 0.8rem;">${bug.category}</div>
            <p style="background: #f1f5f9; padding: 10px; border-radius: 5px; margin: 10px 0; word-break: break-all;">${bug.description}</p>
            <div style="font-size: 0.7rem; color: #64748b;">Від: ${bug.user_name} | Статус: <b>${bug.status}</b></div>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button onclick="changeBugStatus('${bug.id}', '${bug.status}')" class="btn-action btn-edit">Статус</button>
                <button onclick="deleteBug('${bug.id}')" class="btn-action btn-del">Видалити</button>
            </div>
        </article>`).join("");
        
    const countEl = document.getElementById("bug-count");
    if (countEl && bugs) countEl.innerText = bugs.length;
}

function getStatusColor(s) { return s === "Виправлено" ? "#22c55e" : s === "В процесі" ? "#3b82f6" : "#f59e0b"; }

window.changeBugStatus = async (id, s) => {
    const next = s === "Новий" ? "В процесі" : s === "В процесі" ? "Виправлено" : "Новий";
    await supabase.from('bugs').update({ status: next }).eq('id', id);
    renderBugReports();
};
window.deleteBug = async (id) => { 
    if (confirm("Видалити звіт?")) { await supabase.from('bugs').delete().eq('id', id); renderBugReports(); } 
};

// ==========================================
// 8. ГОЛОВНИЙ ЗАПУСК ТА АВТОРИЗАЦІЯ
// ==========================================

window.onload = async () => {
    const user = currentUser();
    const path = window.location.pathname.toLowerCase();

    // ЗАХИСТ 1: Якщо юзера немає і ми НЕ на сторінці логіну — викидаємо на логін
    if (!user && !path.includes("login.html")) {
        window.location.href = "login.html";
        return;
    }

    // Якщо ми на сторінці логіну, далі нічого не завантажуємо (бо форма має свою логіку)
    if (path.includes("login.html")) return;

    // ЗАХИСТ 2: Розмежування прав доступу (ховаємо адмінку від менеджерів)
    if (user && user.role !== 'admin' && user.role !== 'owner') {
        // Ховаємо кнопку в меню
        const adminLinks = document.querySelectorAll('a[href="admin.html"]');
        adminLinks.forEach(link => {
            if (link.parentElement && link.parentElement.tagName === 'LI') {
                link.parentElement.style.display = 'none';
            } else {
                link.style.display = 'none';
            }
        });

        // Забороняємо прямий перехід на сторінку
        if (path.includes("admin.html")) {
            alert("У вас немає доступу до Адмін-панелі!");
            window.location.href = "index.html";
            return;
        }
    }

    // --- ОСНОВНА ЛОГІКА ДОДАТКУ ---
    await initData(); 
    const data = getClients();

    // Авторизація UI
    if (document.getElementById("auth-status") && user) {
        document.getElementById("auth-status").innerHTML = `<span>${user.fullName} (${user.role})</span> 
        <button onclick="localStorage.removeItem('currentUser'); location.reload();" class="btn-top-auth" style="padding: 5px 10px; font-size: 12px; margin-left:10px;">Вийти</button>`;
    }

    refreshAll();

    // Сторінка Менеджменту
    if (path.includes("manage") || path.includes("manege") || document.getElementById("total-clients")) {
        renderManagementTable(data);
        renderManagementStats();
        document.getElementById("client-search")?.addEventListener("input", (e) => {
            const filtered = getClients().filter(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()));
            renderManagementTable(filtered);
        });
    }

    // Сторінка Багів
    if (path.includes("bug_manager") || document.getElementById("bugReportsList")) {
        renderBugReports();
    }
    
    // Форма Багів
    const bugForm = document.getElementById("bugReportForm");
    if (bugForm) {
        bugForm.onsubmit = async (e) => {
            e.preventDefault();
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
            } else alert("Помилка: " + error.message);
        };
    }

    // Форма CRUD
    const crudForm = document.getElementById("adminCrudForm");
    if (crudForm) {
        crudForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById("editIndex").value;
            const clientData = {
                name: document.getElementById("objName").value,
                company: document.getElementById("objCompany").value,
                email: document.getElementById("objEmail").value,
                phone: document.getElementById("objPhone").value,
                status: document.getElementById("objStatus").value
            };

            let res;
            if (!id || id === "") res = await supabase.from('clients').insert([clientData]);
            else res = await supabase.from('clients').update(clientData).eq('id', id);

            if (res.error) alert("Помилка: " + res.error.message);
            else { await initData(); location.reload(); }
        };
    }

    // Пошук
    ["adminSearchInput", "searchInput", "adminStatusFilter", "statusFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = applyAllFilters;
        if (el) el.onchange = applyAllFilters;
    });
};