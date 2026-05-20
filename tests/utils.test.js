import { describe, it, expect } from 'vitest';
// ТЕПЕР ІМПОРТУЄМО З utils.js (без прив'язки до бази та інтернету)
import { getStatusColor } from '../js/utils.js'; // або '../js/utils.js', залежно від того, де в тебе папка tests

describe('Тестування UI функцій', () => {
    
    it('getStatusColor повинна повертати зелений колір для "Виправлено"', () => {
        const color = getStatusColor("Виправлено");
        expect(color).toBe("#22c55e");
    });

    it('getStatusColor повинна повертати синій колір для "В процесі"', () => {
        const color = getStatusColor("В процесі");
        expect(color).toBe("#3b82f6");
    });

    it('getStatusColor повинна повертати жовтий колір для інших статусів', () => {
        const color = getStatusColor("Новий");
        expect(color).toBe("#f59e0b");
    });

});