import { ProgressCallback } from './types';

export async function fetchBlob(url: string, callback?: ProgressCallback): Promise<Blob> {
	const res = await fetch(url);

	const reader = res.body?.getReader();
	const contentLength = +(res.headers.get('Content-Length') ?? 0);

	let receivedLength = 0;
	let chunks = [];
	while (true && reader) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		chunks.push(value);
		receivedLength += value.length;

		callback?.({
			url,
			total: contentLength,
			loaded: receivedLength,
		});
	}

	return new Blob(chunks, { type: res.headers.get('Content-Type') ?? undefined });
}
