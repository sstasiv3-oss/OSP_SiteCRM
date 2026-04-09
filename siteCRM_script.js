// =====================
// 1. НАЛАШТУВАННЯ ТА ДАНІ
// =====================
let currentPage = 1;
const itemsPerPage = 6; // Скільки карток на сторінці
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

// ПАГІНАЦІЯ (Логіка кнопок)
function renderPagination(totalItems) {
    const paginationEl = document.getElementById("pagination");
    if (!paginationEl) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationEl.innerHTML = "";

    if (totalPages <= 1) return;

    // Кнопка Назад
    const prevLi = document.createElement("li");
    prevLi.innerHTML = `<button class="btn-pag" ${currentPage === 1 ? 'disabled' : ''}>←</button>`;
    prevLi.onclick = () => { if (currentPage > 1) { currentPage--; renderMainGrid(currentFilteredList); } };
    paginationEl.appendChild(prevLi);

    // Цифри сторінок
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.innerHTML = `<button class="btn-pag ${currentPage === i ? 'active' : ''}">${i}</button>`;
        li.onclick = () => { currentPage = i; renderMainGrid(currentFilteredList); };
        paginationEl.appendChild(li);
    }

    // Кнопка Вперед
    const nextLi = document.createElement("li");
    nextLi.innerHTML = `<button class="btn-pag" ${currentPage === totalPages ? 'disabled' : ''}>→</button>`;
    nextLi.onclick = () => { if (currentPage < totalPages) { currentPage++; renderMainGrid(currentFilteredList); } };
    paginationEl.appendChild(nextLi);
}

// МАЛЮЄМО КАРТКИ (З пагінацією)
function renderMainGrid(list) {
    const grid = document.getElementById("clientsGrid");
    if (!grid) return;

    currentFilteredList = list;
    updateCounters(list.length);

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = list.slice(start, end);

    if (paginatedItems.length === 0) {
        grid.innerHTML = "<p>Нічого не знайдено</p>";
        return;
    }

    grid.innerHTML = paginatedItems.map(c => `
        <article class="card-item">
            <h4 class="card-item__title">${c.name}</h4>
            <p class="card-company" style="color: #5c59f2; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; text-transform: uppercase;">
                ${c.company || "Приватна особа"}
            </p>
            <p>📧 ${c.email}</p>
            <p>📞 ${c.phone}</p>
            <span class="card-item__tag">${c.status}</span>
        </article>
    `).join("");

    renderPagination(list.length);
}

// МАЛЮЄМО ТАБЛИЦЮ В АДМІНЦІ (Без пагінації, повним списком)
function renderAdminTable(list) {
    const table = document.getElementById("adminTableBody");
    if (!table) return;

    updateCounters(list.length);

    if (list.length === 0) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Список порожній</td></tr>`;
        return;
    }

    table.innerHTML = list.map((c) => {
        const allClients = getClients();
        const realIndex = allClients.findIndex(orig => orig.email === c.email);
        
        return `
            <tr>
                <td><b>${c.name}</b></td>
                <td style="color: #5c59f2; font-weight: 600;">${c.company || "—"}</td>
                <td>${c.email}</td>
                <td>${c.phone}</td>
                <td><span class="card-item__tag">${c.status}</span></td>
                <td>
                    <div class="action-buttons" style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="prepareEdit(${realIndex})" class="btn-action btn-edit">Ред.</button>
                        <button onclick="deleteClient(${realIndex})" class="btn-action btn-del">Вид.</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// =====================
// 3. ПОШУК ТА ФІЛЬТРИ
// =====================
function applyAllFilters() {
    currentPage = 1; // Скидаємо на 1 сторінку при пошуку
    const text = (document.getElementById("adminSearchInput")?.value || document.getElementById("searchInput")?.value || "").toLowerCase();
    const status = document.getElementById("adminStatusFilter")?.value || document.getElementById("statusFilter")?.value || "all";
    
    const filtered = getClients().filter(c => {
        const matchesText = c.name.toLowerCase().includes(text) || 
                            c.email.toLowerCase().includes(text) || 
                            (c.company && c.company.toLowerCase().includes(text));
        const matchesStatus = (status === "all") || (c.status === status);
        return matchesText && matchesStatus;
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
// 5. ЗАПУСК
// =====================
window.onload = () => {
    initData().then(() => {
        const user = currentUser();
        const authStatus = document.getElementById("auth-status");
        if (user && authStatus) {
            authStatus.innerHTML = `<span>${user.fullName} (<b>${user.role}</b>)</span> 
            <button onclick="localStorage.removeItem('currentUser'); location.reload();" class="btn-top-auth">Вийти</button>`;
        }

        refreshAll();
        checkAccess();

        const inputs = ["adminSearchInput", "searchInput", "adminStatusFilter", "statusFilter"];
        inputs.forEach(id => {
            document.getElementById(id)?.addEventListener("input", applyAllFilters);
            document.getElementById(id)?.addEventListener("change", applyAllFilters);
        });

        document.getElementById("adminCrudForm")?.addEventListener("submit", (e) => {
            e.preventDefault();
            const clients = getClients();
            const index = document.getElementById("editIndex").value;
            
            const clientData = {
                name: document.getElementById("objName").value,
                company: document.getElementById("objCompany").value,
                email: document.getElementById("objEmail").value,
                phone: document.getElementById("objPhone").value,
                status: document.getElementById("objStatus").value
            };

            if (index === "") clients.unshift(clientData);
            else clients[index] = clientData;

            localStorage.setItem("clients", JSON.stringify(clients));
            e.target.reset();
            document.getElementById("editIndex").value = "";
            document.getElementById("submitBtn").innerText = "Записати в базу";
            
            refreshAll();
        });
    });
};

function checkAccess() {
    const user = currentUser();
    const adminLink = document.querySelector('a[href="siteCRM_admin.html"]');
    if (user?.role === "manager" && adminLink) {
        adminLink.parentElement.style.display = "none";
    }
}