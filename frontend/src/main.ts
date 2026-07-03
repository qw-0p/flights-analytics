import { createApp } from 'vue'
import naive from 'naive-ui'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { PAGES, DEFAULT_PAGE } from './pages'
import './echarts'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', redirect: '/' + DEFAULT_PAGE },
		...PAGES.map(p => ({ path: '/' + p.key, component: p.component })),
	],
})

createApp(App).use(naive).use(router).mount('#app')
