import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	server: {
		host: true,
		watch: { usePolling: true },
		proxy: {
			'/api': 'http://backend:3030',
			'/auth': 'http://backend:3030',
		},
	},
});
