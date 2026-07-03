<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeVars } from 'naive-ui'
import { PAGES } from '../pages'
import { useTheme } from '../composables/useTheme'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { isDark, toggle } = useTheme()
const { authed, login, logout } = useAuth()
const vars = useThemeVars()

const barStyle = computed(() => ({
	background: vars.value.cardColor,
	borderBottom: `1px solid ${vars.value.dividerColor}`,
	padding: '6px 16px',
}))

const tabValue = () => route.path.slice(1) || PAGES[0].key
const go = (key: string) => router.push('/' + key)
</script>

<template>
	<div :style="barStyle">
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
