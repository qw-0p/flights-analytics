import { ref } from 'vue';
import { api } from '../api';

const authed = ref(false);
const email = ref<string | null>(null);

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
	return { authed, email, check, login, logout };
}
