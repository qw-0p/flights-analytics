import axios from 'axios';

export const http = axios.create({ baseURL: '/', withCredentials: true });

export interface Filters {
	from?: string;
	to?: string;
	crew?: string;
	dronType?: string;
	controlType?: string;
	dayNight?: string;
	result?: string;
	location?: string;
}

const clean = (f: Filters) =>
	Object.fromEntries(Object.entries(f).filter(([, v]) => v));

export const api = {
	authStatus: () => http.get('/auth/status').then(r => r.data),
	authUrl: () => http.get('/auth/url').then(r => r.data.url as string),
	status: () => http.get('/api/status').then(r => r.data),
	triggerSync: () => http.post('/api/sync').then(r => r.data),
	filters: () => http.get('/api/filters').then(r => r.data),
	summary: (f: Filters) =>
		http.get('/api/summary', { params: clean(f) }).then(r => r.data),
	timeseries: (f: Filters) =>
		http.get('/api/timeseries', { params: clean(f) }).then(r => r.data),
	breakdown: (dim: string, f: Filters) =>
		http
			.get('/api/breakdown', { params: { dim, ...clean(f) } })
			.then(r => r.data),
	records: (f: Filters) =>
		http.get('/api/records', { params: clean(f) }).then(r => r.data),
	annOptions: () => http.get('/api/annotation/options').then(r => r.data),
	saveAnn: (uuid: string, body: any) =>
		http.put(`/api/annotation/${uuid}`, body).then(r => r.data),
	logout: () => http.post('/auth/logout').then(r => r.data),
};
