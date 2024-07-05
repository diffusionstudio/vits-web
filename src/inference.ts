import { MessageData, ProgressCallback, VoiceId } from "./types";

type PredictOptions = {
  text: string,
  voiceId: VoiceId
};

export async function predict(options: PredictOptions, callback?: ProgressCallback): Promise<File> {
  const worker = new Worker(new URL('./worker.ts', import.meta.url));

  worker.postMessage({ type: 'init', ...options });

  return await new Promise<File>((resolve, reject) => {
    function eventHandler(event: MessageEvent<MessageData>) {
      const data = event.data;

      if (data.type == 'output') {
        worker.terminate();
        resolve(data.file);
      }
      if (data.type == 'stderr') {
        worker.terminate();
        reject(data.message);
      }
      if (data.type == 'fetch') {
        const { loaded, total, url } = data;
        callback?.({ loaded, total, url });
      }
      worker.onerror = () => {
        worker.terminate();
        reject()
      }
    }

    worker.addEventListener('message', eventHandler)
  });
}
