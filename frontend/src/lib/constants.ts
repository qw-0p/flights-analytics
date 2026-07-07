export const RESULTS = [
	'Неуспішно',
	'Пошкоджено',
	'Знищено',
	'Заміновано',
	'Доставлено',
	'Уражено',
	'Розміновано',
	'Успішно',
	'Дорозвідати',
	'На заборону',
	'Полонений',
] as const;

export const SUCCESS_RESULTS = RESULTS.filter(item => item !== 'Неуспішно');

export const REASON_EXCLUDE = ['ОК'] as const;
