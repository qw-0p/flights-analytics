import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api';

export type OptKey = 'loss_zone' | 'reason' | 'reason_desc';

export const useOptionsStore = defineStore('options', () => {
	const items = ref<Record<OptKey, string[]>>({
		loss_zone: [],
		reason: [],
		reason_desc: [],
	});
	const loaded = ref(false);

	async function load(force = false) {
		if (loaded.value && !force) return;
		items.value = await api.getSettings();
		loaded.value = true;
	}

	async function save(key: OptKey) {
		await api.saveSetting(key, items.value[key]);
	}

	return { items, loaded, load, save };
});
