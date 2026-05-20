import { supabase, currentUser } from './api.js';

// ФУНКЦІЯ ВХОДУ (Прив'язуємо до window для login.html)
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

        const userData = {
            id: user.id,
            fullName: user.fullName || "Користувач",
            role: user.role || "user",
            username: user.username
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        window.location.href = "index.html";
    } catch (e) {
        console.error("Помилка входу:", e.message);
        alert("Сталася помилка при спробі входу.");
    }
};

// ЗАХИСНИК МАРШРУТІВ (Gatekeeper)
export function checkAuthAndRoles(path) {
    const user = currentUser();

    // 1. Якщо не залогінений - на сторінку входу
    if (!user && !path.includes("login.html")) {
        window.location.href = "login.html";
        return false;
    }

    if (path.includes("login.html")) return false;

    // 2. Перевірка ролей
    if (user) {
        const role = user.role ? user.role.toLowerCase().trim() : 'user';

        // Клієнт (звичайний юзер)
        if (role === 'user' || role === 'client') {
            const forbiddenLinks = document.querySelectorAll('a[href*="manage"], a[href*="manege"], a[href*="admin"], a[href*="bug_manager"]');
            forbiddenLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') link.parentElement.style.display = 'none';
                else link.style.display = 'none';
            });

            if (path.includes("manage") || path.includes("manege") || path.includes("admin.html") || path.includes("bug_manager")) {
                alert("У вас немає доступу до цієї панелі!");
                window.location.href = "index.html";
                return false;
            }
        } 
        // Менеджер
        else if (role !== 'admin' && role !== 'owner') {
            const adminLinks = document.querySelectorAll('a[href*="admin"]');
            adminLinks.forEach(link => {
                if (link.parentElement && link.parentElement.tagName === 'LI') link.parentElement.style.display = 'none';
                else link.style.display = 'none';
            });

            if (path.includes("admin.html")) {
                alert("У вас немає доступу до Адмін-панелі!");
                window.location.href = "index.html";
                return false;
            }
        }
    }
    return user;
}