import { dayWindow } from './dayWindow';

const daysAgo = (n: number): [number, number] => {
	const d = dayWindow(Date.now());
	return [Date.parse(d.from) - (n - 1) * 86400000, Date.parse(d.to)];
};

export const rangeShortcuts = {
	Сьогодні: (): [number, number] => {
		const d = dayWindow(Date.now());
		return [Date.parse(d.from), Date.parse(d.to)];
	},
	'3 дні': () => daysAgo(3),
	'7 днів': () => daysAgo(7),
	'30 днів': () => daysAgo(30),
	'За весь час': (): [number, number] => [Date.parse('2020-01-01'), Date.now()],
};
