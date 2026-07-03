import { ref, computed } from 'vue';
import { darkTheme, type GlobalTheme } from 'naive-ui';

const isDark = ref(true);

export function useTheme() {
	const theme = computed<GlobalTheme | null>(() =>
		isDark.value ? darkTheme : null,
	);
	const toggle = () => {
		isDark.value = !isDark.value;
	};
	return { isDark, theme, toggle };
}
