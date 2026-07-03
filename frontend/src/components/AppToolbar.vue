<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PAGES } from '../pages';
import { useTheme } from '../composables/useTheme';
import { useAuth } from '../composables/useAuth';

const route = useRoute();
const router = useRouter();
const { isDark, toggle } = useTheme();
const { authed, login, logout } = useAuth();

const SHOW_ZONE = 8;
const HIDE_DELAY = 400;

const visible = ref(false);
const hovered = ref(false);
let hideTimer: any;

function onMove(e: MouseEvent) {
	if (e.clientY <= SHOW_ZONE) show();
	else if (!hovered.value) scheduleHide();
}
function show() {
	clearTimeout(hideTimer);
	visible.value = true;
}
function scheduleHide() {
	clearTimeout(hideTimer);
	hideTimer = setTimeout(() => {
		if (!hovered.value) visible.value = false;
	}, HIDE_DELAY);
}

const tabValue = () => route.path.slice(1) || PAGES[0].key;
const go = (key: string) => router.push('/' + key);

onMounted(() => window.addEventListener('mousemove', onMove));
onUnmounted(() => {
	window.removeEventListener('mousemove', onMove);
	clearTimeout(hideTimer);
});
</script>

<template>
	<!-- невидима смужка-тригер у самого верху -->
	<div class="trigger" @mouseenter="show" />

	<div
		class="bar"
		:class="{ show: visible }"
		@mouseenter="
			hovered = true;
			show();
		"
		@mouseleave="
			hovered = false;
			scheduleHide();
		"
	>
		<n-space align="center" justify="space-between" style="width: 100%">
			<n-tabs :value="tabValue()" type="line" size="small" @update:value="go">
				<n-tab v-for="p in PAGES" :key="p.key" :name="p.key" :tab="p.label" />
			</n-tabs>

			<n-space align="center" :size="8">
				<n-button quaternary circle size="small" @click="toggle">
					{{ isDark ? '🌙' : '☀️' }}
				</n-button>
				<n-button v-if="authed" size="small" @click="logout">Вийти</n-button>
				<n-button v-else size="small" type="primary" @click="login">
					Увійти
				</n-button>
			</n-space>
		</n-space>
	</div>
</template>

<style scoped>
.trigger {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 8px;
	z-index: 1001;
}
.bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	padding: 6px 16px;
	background: var(--toolbar-bg, rgba(24, 24, 28, 0.92));
	backdrop-filter: blur(8px);
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	transform: translateY(-100%);
	transition: transform 0.22s ease;
}
.bar.show {
	transform: translateY(0);
}
</style>
