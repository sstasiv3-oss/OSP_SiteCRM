// Очищення кешу (можеш видалити ці два рядки після того, як клієнти з'являться)
localStorage.removeItem("clients");
localStorage.removeItem("users");

// =====================
// 1. БАЗА ДАНИХ (Ініціалізація з JSON у LocalStorage)
// =====================
async function initData() {
  // Завантажуємо користувачів
  if (!localStorage.getItem("users")) {
    try {
      const response = await fetch("users.json");
      const usersData = await response.json();
      localStorage.setItem("users", JSON.stringify(usersData));
    } catch (error) {
      console.error("Помилка завантаження users.json:", error);
    }
  }

  // Завантажуємо клієнтів
  if (!localStorage.getItem("clients")) {
    try {
      const response = await fetch("clients.json");
      const clientsData = await response.json();
      localStorage.setItem("clients", JSON.stringify(clientsData));
    } catch (error) {
      console.error("Помилка завантаження clients.json:", error);
    }
  }
}

// =====================
// 2. СИСТЕМА АВТОРИЗАЦІЇ ТА ДОСТУПУ
// =====================
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function currentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function signup(fullName, username, password) {
  const users = getUsers();
  const exists = users.find(user => user.username === username);

  if (exists) {
    alert("Користувач з таким логіном вже існує!");
    return { success: false, message: "Username already exists" };
  }

  const user = { id: Date.now(), username, password, role: "user", fullName };
  users.push(user);
  saveUsers(users);
  return { success: true, message: "User created" };
}

function login(username, password) {
  const users = getUsers();
  const user = users.find(item => item.username === username && item.password === password);

  if (!user) {
    alert("Невірний логін або пароль!");
    return { success: false, message: "Invalid credentials" };
  }

  setCurrentUser(user);
  window.location.href = "siteCRM_index.html"; 
  return { success: true, message: "Login success" };
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "siteCRM_index.html";
}

function checkAccess() {
    const adminLink = document.querySelector('a[href="siteCRM_admin.html"]');
    const authStatus = document.getElementById("auth-status");
    const user = currentUser();

    if (!user) {
        if (authStatus) {
            authStatus.innerHTML = `
                <span style="margin-right: 15px; color: #6c757d;">Ви не авторизовані</span>
                <a href="siteCRM_login.html" class="btn-top-auth">Увійти</a>
            `;
        }
        if (adminLink) adminLink.parentElement.style.display = "none";
        if (window.location.pathname.includes("admin")) {
            window.location.href = "siteCRM_login.html";
        }
        return; 
    }

    if (authStatus) {
        authStatus.innerHTML = `
            <span style="margin-right: 15px;">${user.fullName} (<b>${user.role}</b>)</span> 
            <button onclick="logout()" class="btn-top-auth btn-logout">Вийти</button>
        `;
    }

    if (user.role === "user") {
        if (adminLink) adminLink.parentElement.style.display = "none"; 
        if (window.location.pathname.includes("admin")) {
            alert("Доступ обмежено! Тільки для адміністраторів.");
            window.location.href = "siteCRM_index.html";
        }
    }
}

// =====================
// 3. РОБОТА З КЛІЄНТАМИ ТА ПАГІНАЦІЯ
// =====================
function getClients() {
  return JSON.parse(localStorage.getItem("clients")) || [];
}

const grid = document.getElementById("clientsGrid");
const paginationEl = document.getElementById("pagination");
const showMoreBtn = document.getElementById("showMoreBtn");

let currentPage = 1;
let itemsPerPage = 5; 
let currentList = []; 

function createCard(client) {
  return `
    <article class="card-item">
      <h4 class="card-item__title">${client.name}</h4>
      <p class="card-item__description">${client.email}</p>
      <p class="card-item__description">${client.phone}</p>
      <span class="card-item__tag">${client.status}</span>
    </article>
  `;
}

function renderClients(list, page = 1) {
  if (!grid) return; 
  
  currentList = list;
  currentPage = page;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = currentList.slice(startIndex, endIndex);

  grid.innerHTML = paginatedItems.length === 0 ? "<p>Нічого не знайдено</p>" : paginatedItems.map(c => createCard(c)).join("");
  
  const countEl = document.getElementById("client-count");
  if (countEl) countEl.innerText = list.length;

  renderPaginationControls();
}

function renderPaginationControls() {
  if (!paginationEl) return;
  
  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  paginationEl.innerHTML = ""; 

  if (totalPages <= 1) {
    if (showMoreBtn) showMoreBtn.parentElement.style.display = "none";
    return;
  }
  
  if (showMoreBtn) showMoreBtn.parentElement.style.display = "flex";

  const prevLi = document.createElement("li");
  prevLi.innerHTML = `<button ${currentPage === 1 ? 'disabled' : ''}>← Назад</button>`;
  prevLi.onclick = () => { if(currentPage > 1) renderClients(currentList, currentPage - 1); };
  paginationEl.appendChild(prevLi);

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.innerHTML = `<button class="${currentPage === i ? 'active' : ''}">${i}</button>`;
    li.onclick = () => renderClients(currentList, i);
    paginationEl.appendChild(li);
  }

  const nextLi = document.createElement("li");
  nextLi.innerHTML = `<button ${currentPage === totalPages ? 'disabled' : ''}>Вперед →</button>`;
  nextLi.onclick = () => { if(currentPage < totalPages) renderClients(currentList, currentPage + 1); };
  paginationEl.appendChild(nextLi);
}

if (showMoreBtn) {
    showMoreBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(currentList.length / itemsPerPage);
        if (currentPage < totalPages) {
            renderClients(currentList, currentPage + 1);
        }
    });
}

// =====================
// 4. ФІЛЬТРАЦІЯ ТА ПОШУК (Універсальний пошук)
// =====================
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter"); 

function applyFilters() {
    const textValue = searchInput ? searchInput.value.toLowerCase() : "";
    const statusValue = statusFilter ? statusFilter.value : "all";
    
    const allClients = getClients(); 
    
    const filtered = allClients.filter(c => {
        // Шукаємо текст в імені, пошті АБО телефоні
        const matchesText = c.name.toLowerCase().includes(textValue) || 
                            c.email.toLowerCase().includes(textValue) ||
                            c.phone.includes(textValue);
                            
        // Перевіряємо статус (якщо випадаючого списку немає, завжди буде "all")
        const matchesStatus = (statusValue === "all") || (c.status === statusValue);
        
        return matchesText && matchesStatus;
    });
    
    renderClients(filtered, 1);
}

// Вішаємо слухачів подій
if (searchInput) searchInput.addEventListener("input", applyFilters);
if (statusFilter) statusFilter.addEventListener("change", applyFilters);

// =====================
// 5. ЗАПУСК ПРОГРАМИ
// =====================
initData().then(() => {
  checkAccess();
  renderClients(getClients(), 1);
});