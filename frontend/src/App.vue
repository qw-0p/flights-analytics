<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { useAuth } from './composables/useAuth';
import AppToolbar from './components/AppToolbar.vue';

const { theme } = useTheme();
const { check } = useAuth();

onMounted(check);
</script>

<template>
	<n-config-provider :theme="theme">
		<n-message-provider>
			<AppToolbar />
			<router-view />
		</n-message-provider>
	</n-config-provider>
</template>
