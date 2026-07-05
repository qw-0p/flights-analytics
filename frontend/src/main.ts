import { createApp } from 'vue';
import naive from 'naive-ui';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { PAGES, DEFAULT_PAGE } from './pages';
import './echarts';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/login', component: () => import('./views/Login.vue') },
		{ path: '/', redirect: '/' + DEFAULT_PAGE },
		...PAGES.map(p => ({
			path: '/' + p.key,
			component: p.component,
			meta: { requiresAuth: true },
		})),
	],
});

import { useAuth } from './composables/useAuth';

router.beforeEach(async to => {
	const { authed, ready, check } = useAuth();
	if (!ready.value) await check();
	if (to.meta.requiresAuth && !authed.value) return '/login';
	if (to.path === '/login' && authed.value) return '/' + DEFAULT_PAGE;
});

createApp(App).use(createPinia()).use(naive).use(router).mount('#app');
