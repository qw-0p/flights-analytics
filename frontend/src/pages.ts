import type { Component } from 'vue';
import DayReport from './views/DayReport.vue';
import Dashboard from './views/Dashboard.vue';

// Єдине джерело для роутів і табів тулбару.
// Додав сторінку -> з'явилась і в роутері, і в меню.
export interface PageDef {
	key: string; // /path без слеша
	label: string; // напис у табі
	component: Component;
}

export const PAGES: PageDef[] = [
	{ key: 'report', label: 'Звіт за добу', component: DayReport },
	{ key: 'dashboard', label: 'Дашборд', component: Dashboard },
];

export const DEFAULT_PAGE = PAGES[0].key;
