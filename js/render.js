import { supabase, getClients } from './api.js';
import { getStatusColor } from './utils.js'; // <-- Додали цей рядок

// ... далі йде весь твій код (state, renderMainGrid і т.д.)
// Глобальні змінні для пагінації та фільтрів
export let state = {
    currentPage: 1,
    itemsPerPage: 6,
    currentFilteredList: []
};

function updateCounters(count) {
    const mainCounter = document.getElementById("client-count");
    const adminCounter = document.getElementById("admin-results-count");
    if (mainCounter) mainCounter.innerText = count;
    if (adminCounter) adminCounter.innerText = count;
}


// ГОЛОВНА СІТКА КЛІЄНТІВ
export function renderMainGrid(list) {
    const grid = document.getElementById("clientsGrid");
    if (!grid) return;
    state.currentFilteredList = list;
    updateCounters(list.length);

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const paginatedItems = list.slice(start, start + state.itemsPerPage);

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

// ПАГІНАЦІЯ
export function renderPagination(totalItems) {
    const el = document.getElementById("pagination");
    if (!el) return;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    el.innerHTML = "";
    if (totalPages <= 1) return;

    const container = document.createElement("ul");
    container.className = "pagination-container";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.gap = "10px";
    container.style.listStyle = "none";

    const prevLi = document.createElement("li");
    prevLi.innerHTML = `<button class="btn-pag" ${state.currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>«</button>`;
    prevLi.onclick = () => { if (state.currentPage > 1) { state.currentPage--; renderMainGrid(state.currentFilteredList); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
    container.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.innerHTML = `<button class="btn-pag ${state.currentPage === i ? 'active' : ''}">${i}</button>`;
        li.onclick = () => { state.currentPage = i; renderMainGrid(state.currentFilteredList); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        container.appendChild(li);
    }

    const nextLi = document.createElement("li");
    nextLi.innerHTML = `<button class="btn-pag" ${state.currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>»</button>`;
    nextLi.onclick = () => { if (state.currentPage < totalPages) { state.currentPage++; renderMainGrid(state.currentFilteredList); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
    container.appendChild(nextLi);
    el.appendChild(container);
}

// АДМІН ТАБЛИЦЯ КЛІЄНТІВ
export function renderAdminTable(list) {
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

// МЕНЕДЖМЕНТ ТАБЛИЦЯ ТА СТАТИСТИКА
export function renderManagementTable(list) {
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

export function renderManagementStats() {
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

// ТАБЛИЦЯ ПРАЦІВНИКІВ (ПРЯМО З БАЗИ)
export async function renderUsersTable() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;
    const { data: users } = await supabase.from('users').select('*');
    
    tbody.innerHTML = (!users || users.length === 0) ? "<tr><td colspan='5' style='text-align:center;'>Немає працівників</td></tr>" : 
    users.map(u => `
        <tr>
            <td><b>${u.fullName || ''}</b></td>
            <td>${u.username}</td>
            <td>${u.password}</td>
            <td><span class="card-itemtag">${u.role}</span></td>
            <td style="text-align: right;">
                <div class="action-buttons">
                    <button onclick="prepareUserEdit('${u.id}')" class="btn-action btn-edit">Ред.</button>
                    <button onclick="deleteUser('${u.id}')" class="btn-action btn-del">Вид.</button>
                </div>
            </td>
        </tr>
    `).join("");
}

// ЗВІТИ (БАГИ)
export async function renderBugReports() {
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
}

// МОДАЛКА КЛІЄНТА ТА ПАНЕЛЬ РЕДАГУВАННЯ
window.showClientDetails = function(id) {
    const client = getClients().find(c => String(c.id) === String(id));
    if (!client) return;

    let modal = document.getElementById("client-info-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "client-info-modal";
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(30,41,59,0.7); display:flex; justify-content:center; align-items:center; z-index:9999; backdrop-filter:blur(4px);";
        document.body.appendChild(modal);
    } else { modal.style.display = "flex"; }

    const managerName = client.manager || "Не призначено";

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 450px; position: relative; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
            <button onclick="document.getElementById('client-info-modal').style.display='none'" style="position: absolute; right: 20px; top: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;">&times;</button>
            <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 1.5rem; word-break: break-all;">${client.name}</h2>
            <span class="card-itemtag" style="display: inline-block; margin-bottom: 20px;">${client.status}</span>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div><div style="font-size: 0.75rem; font-weight: bold; color: #64748b;">КОМПАНІЯ</div><div style="font-size: 1rem; color: #4f46e5; font-weight: 600;">${client.company || "Приватна особа"}</div></div>
                <div><div style="font-size: 0.75rem; font-weight: bold; color: #64748b;">EMAIL</div><div><a href="mailto:${client.email}">${client.email}</a></div></div>
                <div><div style="font-size: 0.75rem; font-weight: bold; color: #64748b;">ТЕЛЕФОН</div><div><a href="tel:${client.phone}">${client.phone}</a></div></div>
                <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border-left: 3px solid #6366f1;">
                    <div style="font-size: 0.75rem; font-weight: bold; color: #64748b;">ВІДПОВІДАЛЬНИЙ МЕНЕДЖЕР</div>
                    <div style="font-size: 0.95rem; color: #1e293b; font-weight: 500;">${managerName}</div>
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 5px;">
                    <div style="font-size: 0.75rem; font-weight: bold; color: #64748b;">НОТАТКИ МЕНЕДЖЕРА</div>
                    <div style="font-size: 0.9rem; color: #334155; line-height: 1.5;">${client.note || "Немає приміток."}</div>
                </div>
            </div>
        </div>
    `;
    modal.onclick = function(event) { if (event.target === modal) modal.style.display = "none"; };
};

window.selectClientForEdit = async function(id) {
    const client = getClients().find(c => String(c.id) === String(id));
    if (!client) return;
    const editZone = document.getElementById("edit-zone");
    if (editZone) {
        editZone.style.display = "block";
        const { data: users } = await supabase.from('users').select('*');
        let managerOptions = `<option value="">Не призначено</option>`;
        if (users) {
            users.forEach(u => {
                const isSelected = (client.manager === u.fullName) ? 'selected' : '';
                managerOptions += `<option value="${u.fullName}" ${isSelected}>${u.fullName} (${u.role})</option>`;
            });
        }

        editZone.innerHTML = `
            <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: #4f46e5;">Редагування: ${client.name}</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div><label style="font-size: 0.7rem; font-weight: bold; color: #64748b;">СТАТУС</label>
                    <select id="edit-status" class="form-input" style="width: 100%; padding: 5px;">
                        <option value="Новий" ${client.status === 'Новий' ? 'selected' : ''}>Новий</option>
                        <option value="В роботі" ${client.status === 'В роботі' ? 'selected' : ''}>В роботі</option>
                        <option value="Постійний" ${client.status === 'Постійний' ? 'selected' : ''}>Постійний</option>
                        <option value="VIP" ${client.status === 'VIP' ? 'selected' : ''}>VIP</option>
                        <option value="active" ${client.status === 'active' ? 'selected' : ''}>active</option>
                    </select>
                </div>
                <div><label style="font-size: 0.7rem; font-weight: bold; color: #64748b;">МЕНЕДЖЕР</label>
                    <select id="edit-manager" class="form-input" style="width: 100%; padding: 5px;">${managerOptions}</select>
                </div>
            </div>
            <label style="font-size: 0.7rem; font-weight: bold; color: #64748b;">НОТАТКИ</label>
            <textarea id="edit-note" class="form-input" style="width: 100%; height: 50px;">${client.note || ""}</textarea>
            <button id="save-edit-btn" class="btn-submit" style="width: 100%; margin-top: 10px;">Зберегти зміни</button>
        `;
        const saveBtn = document.getElementById("save-edit-btn");
        saveBtn.onclick = async () => {
            saveBtn.innerText = "Зберігаю...";
            const updatedData = { status: document.getElementById("edit-status").value, manager: document.getElementById("edit-manager").value, note: document.getElementById("edit-note").value };
            const { error } = await supabase.from('clients').update(updatedData).eq('id', id);
            if (!error) location.reload(); else { alert("Помилка: " + error.message); saveBtn.innerText = "Зберегти зміни"; }
        };
    }
};