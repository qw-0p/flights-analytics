import type { Component } from 'vue';
import DayReport from './views/DayReport.vue';
import Dashboard from './views/Dashboard.vue';
import Settings from './views/Settings.vue';

export interface PageDef {
	key: string;
	label: string;
	component: Component;
}

export const PAGES: PageDef[] = [
	{ key: 'report', label: 'Звіт за добу', component: DayReport },
	{ key: 'dashboard', label: 'Дашборд', component: Dashboard },
	{ key: 'settings', label: 'Налаштування', component: Settings },
];

export const DEFAULT_PAGE = PAGES[0].key;
