import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// НАЛАШТУВАННЯ SUPABASE
export const supabaseUrl = 'https://mqvznnhiniqadngotizq.supabase.co';
export const supabaseKey = 'sb_publishable_GmsljKr6QkiBMpljKEXg9Q_cD-iGU1u';
export const supabase = createClient(supabaseUrl, supabaseKey);

// ГЛОБАЛЬНІ ФУНКЦІЇ ДОСТУПУ ДО ДАНИХ
export const getClients = () => JSON.parse(localStorage.getItem("clients")) || [];
export const currentUser = () => JSON.parse(localStorage.getItem("currentUser"));

// ІНІЦІАЛІЗАЦІЯ (Стягування клієнтів з бази)
export async function initData() {
    try {
        const { data: clients, error: clError } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (clError) throw clError;
        localStorage.setItem("clients", JSON.stringify(clients || []));
    } catch (e) {
        console.error("Помилка ініціалізації:", e.message);
    }
}