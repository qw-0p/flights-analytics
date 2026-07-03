import { ref } from 'vue';
import { api } from '../api';

const authed = ref(false);

export function useAuth() {
	async function check() {
		try {
			authed.value = (await api.authStatus()).authed;
		} catch {
			authed.value = false;
		}
		return authed.value;
	}
	async function login() {
		window.location.href = await api.authUrl();
	}
	function logout() {
		authed.value = false;
	}
	return { authed, check, login, logout };
}
