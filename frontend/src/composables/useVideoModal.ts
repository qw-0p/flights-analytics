import { ref } from 'vue'

const open = ref(false)
const url = ref('')
const original = ref('')

const toPreview = (u: string) =>
	u.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview')

export function useVideoModal() {
	const show = (link: string) => {
		original.value = link
		url.value = toPreview(link)
		open.value = true
	}
	return { open, url, original, show }
}
