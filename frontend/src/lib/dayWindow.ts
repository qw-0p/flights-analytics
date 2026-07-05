export const dayWindow = (base: number) => {
	const d = new Date(base)
	const end = new Date(
		Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 16, 0, 0),
	)
	const start = new Date(end)
	start.setUTCDate(start.getUTCDate() - 1)
	return { from: start.toISOString(), to: end.toISOString() }
}
