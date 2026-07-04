import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'

export type OptKey = 'loss_zone' | 'reason' | 'reason_desc'

export const useOptionsStore = defineStore('options', () => {
	const items = ref<Record<OptKey, string[]>>({
		loss_zone: [],
		reason: [],
		reason_desc: [],
	})
	const loaded = ref(false)

	async function load(force = false) {
		if (loaded.value && !force) return
		const data = await api.getSettings()
		items.value = {
			loss_zone: data?.loss_zone ?? [],
			reason: data?.reason ?? [],
			reason_desc: data?.reason_desc ?? [],
		}
		loaded.value = true
	}

	async function save(key: OptKey) {
		await api.saveSetting(key, items.value[key])
	}

	return { items, loaded, load, save }
})
