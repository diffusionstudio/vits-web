export async function writeBlob(url: string, blob: Blob): Promise<void> {
	// only store models
	if (!url.match('https://huggingface.co')) return;
	try {
		const root = await navigator.storage.getDirectory();
		const dir = await root.getDirectoryHandle('piper', {
			create: true,
		});

		const path = url.split('/').at(-1)!;
		const file = await dir.getFileHandle(path, { create: true });
		const writable = await file.createWritable();
		await writable.write(blob);
		await writable.close();
	} catch (e) {
		console.error(e);
	}
}

export async function removeBlob(url: string) {
	try {
		const root = await navigator.storage.getDirectory();
		const dir = await root.getDirectoryHandle('piper');
		const path = url.split('/').at(-1)!;
		const file = await dir.getFileHandle(path); // @ts-ignore
		await file.remove();
	} catch (e) {
		console.error(e);
	}
}

export async function readBlob(url: string): Promise<Blob | undefined> {
	if (!url.match('https://huggingface.co')) return;
	try {
		const root = await navigator.storage.getDirectory();
		const dir = await root.getDirectoryHandle('piper', {
			create: true,
		});

		const path = url.split('/').at(-1)!;
		const file = await dir.getFileHandle(path);

		return await file.getFile();
	} catch (e) {
		return undefined;
	}
}
