import { supabase, initData, getClients } from './api.js';
import { checkAuthAndRoles } from './auth.js';
import { renderManagementTable, renderManagementStats, renderUsersTable, renderBugReports } from './render.js';
import './actions.js'; // Просто підключаємо, щоб функції стали доступні у window

window.onload = async () => {
    const path = window.location.pathname.toLowerCase();
    
    // Перевірка ролей та доступу (Зупиняємо виконання, якщо користувача кидає на логін)
    const user = checkAuthAndRoles(path);
    if (!user && !path.includes("login.html")) return; 
    if (path.includes("login.html")) return;

    // Ініціалізація даних з бази
    await initData(); 
    const data = getClients();

    // Вивід статусу авторизації у верхній панелі
    if (document.getElementById("auth-status") && user) {
        document.getElementById("auth-status").innerHTML = `<span>${user.fullName} (${user.role})</span> 
        <button onclick="localStorage.removeItem('currentUser'); location.reload();" class="btn-top-auth" style="padding: 5px 10px; font-size: 12px; margin-left:10px;">Вийти</button>`;
    }

    // Запуск малювання карток на головній/адмінці
    if (typeof window.refreshAll === 'function') window.refreshAll();

    // --- РОУТИНГ (Що запускати на яких сторінках) ---

    // 1. Адмінка: Рендер таблиці працівників
    if (document.getElementById("usersTableBody")) {
        renderUsersTable();
    }

    // 2. Менеджмент: Таблиця та статистика
    if (path.includes("manage") || path.includes("manege") || document.getElementById("total-clients")) {
        renderManagementTable(data);
        renderManagementStats();
        document.getElementById("client-search")?.addEventListener("input", (e) => {
            const filtered = getClients().filter(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()));
            renderManagementTable(filtered);
        });
    }

    // 3. Баги: Рендер звітів
    if (path.includes("bug_manager") || document.getElementById("bugReportsList")) {
        renderBugReports();
    }

    // --- ОБРОБНИКИ ФОРМ (CRUD) ---

    // Форма додавання/редагування ПРАЦІВНИКІВ
    const userForm = document.getElementById("adminUserForm");
    if (userForm) {
        userForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById("editUserId").value;
            const userData = {
                fullName: document.getElementById("userFullName").value,
                username: document.getElementById("userLogin").value,
                password: document.getElementById("userPass").value,
                role: document.getElementById("userRole").value
            };
            let res;
            if (!id || id === "") res = await supabase.from('users').insert([userData]);
            else res = await supabase.from('users').update(userData).eq('id', id);
            
            if (res.error) alert("Помилка: " + res.error.message); 
            else { location.reload(); }
        };
    }

    // Форма додавання/редагування КЛІЄНТІВ
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

    // Форма відправки БАГ-РЕПОРТУ
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

    // Слухачі для інпутів пошуку та фільтрів
    ["adminSearchInput", "searchInput", "adminStatusFilter", "statusFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.oninput = window.applyAllFilters;
            el.onchange = window.applyAllFilters;
        }
    });
};