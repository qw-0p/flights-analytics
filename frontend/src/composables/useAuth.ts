import { ref } from 'vue';
import { api } from '../api';

const authed = ref(false);
const email = ref<string | null>(null);
const ready = ref(false);

export function useAuth() {
	async function check() {
		try {
			const s = await api.authStatus();
			authed.value = s.authed;
			email.value = s.email;
		} catch {
			authed.value = false;
			email.value = null;
		}
		ready.value = true;
		return authed.value;
	}
	async function login() {
		window.location.href = await api.authUrl();
	}
	async function logout() {
		await api.logout();
		authed.value = false;
		email.value = null;
		location.reload();
	}
	return { authed, email, ready, check, login, logout };
}
