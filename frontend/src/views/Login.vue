<script setup lang="ts">
import { useAuth } from '../composables/useAuth';

const { login } = useAuth();
</script>

<template>
	<div class="login">
		<n-card class="card" title="Вхід">
			<p class="hint">Увійдіть через Google, щоб продовжити.</p>
			<n-button type="primary" block @click="login">
				Увійти через Google
			</n-button>
		</n-card>
	</div>
</template>

<style scoped>
.login {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
}
.card {
	max-width: 360px;
}
.hint {
	margin: 0 0 16px;
}
</style>
