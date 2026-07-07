<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { useAuth } from './composables/useAuth';
import AppToolbar from './components/AppToolbar.vue';

const { theme } = useTheme();
const { check, authed } = useAuth();

onMounted(check);
</script>

<template>
	<n-config-provider :theme="theme">
		<n-global-style />
		<n-message-provider>
			<n-layout class="root">
				<AppToolbar v-if="authed" />
				<n-layout-content class="content" :native-scrollbar="false">
					<router-view />
				</n-layout-content>
			</n-layout>
		</n-message-provider>
	</n-config-provider>
</template>
<style scoped>
.layout {
	height: 100vh;
}
.content {
	height: 100%;
}
</style>
