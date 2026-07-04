<script setup lang="ts">
import { onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { useOptionsStore, type OptKey } from '../stores/options';

const msg = useMessage();
const store = useOptionsStore();

const SECTIONS: { key: OptKey; label: string }[] = [
	{ key: 'loss_zone', label: 'Зона втрати борта' },
	{ key: 'reason', label: 'Причина' },
	{ key: 'reason_desc', label: 'Опис причини' },
];

async function save(key: OptKey) {
	await store.save(key);
	msg.success('Збережено');
}

onMounted(() => store.load());
</script>

<template>
	<div class="page">
		<h2 style="margin: 0 0 16px">Налаштування</h2>
		<n-space vertical :size="20">
			<n-card v-for="s in SECTIONS" :key="s.key" :title="s.label" size="small">
				<n-dynamic-tags v-model:value="store.items[s.key]" />
				<template #footer>
					<n-button size="small" type="primary" @click="save(s.key)">
						Зберегти
					</n-button>
				</template>
			</n-card>
		</n-space>
	</div>
</template>

<style scoped>
.page {
	padding: 56px 16px 16px;
	max-width: 800px;
	margin: 0 auto;
}
</style>
