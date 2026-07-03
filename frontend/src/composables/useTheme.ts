import { ref, computed, watch } from 'vue'
import { darkTheme, type GlobalTheme } from 'naive-ui'

const stored =
	typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null
const isDark = ref(stored ? stored === 'dark' : true)

watch(isDark, v => localStorage.setItem('theme', v ? 'dark' : 'light'))

export function useTheme() {
	const theme = computed<GlobalTheme | null>(() =>
		isDark.value ? darkTheme : null,
	)
	const toggle = () => {
		isDark.value = !isDark.value
	}
	return { isDark, theme, toggle }
}
