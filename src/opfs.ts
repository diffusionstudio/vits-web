export async function writeBlob(url: string, blob: Blob): Promise<void> {
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
  } catch (e) { }
}

export async function removeBlob(url: string) {
  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('piper');
    const path = url.split('/').at(-1)!;
    const file = await dir.getFileHandle(path); // @ts-ignore
    file.remove();
  } catch (e) { }
}