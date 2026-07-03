<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from './composables/useTheme'
import { useAuth } from './composables/useAuth'
import AppToolbar from './components/AppToolbar.vue'

const { theme } = useTheme()
const { check } = useAuth()

onMounted(check)
</script>

<template>
	<n-config-provider :theme="theme">
		<n-global-style />
		<n-message-provider>
			<n-layout style="min-height: 100vh">
				<AppToolbar />
				<n-layout-content content-style="padding: 16px">
					<router-view />
				</n-layout-content>
			</n-layout>
		</n-message-provider>
	</n-config-provider>
</template>
