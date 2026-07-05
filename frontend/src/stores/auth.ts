import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api';

export const useAuthStore = defineStore('auth', () => {
	const authed = ref(false);
	const email = ref<string | null>(null);
	const ready = ref(false);

	async function check() {
		const { authed: a, email: e } = await api.authStatus();
		authed.value = a;
		email.value = e;
		ready.value = true;
		return a;
	}

	return { authed, email, ready, check };
});
