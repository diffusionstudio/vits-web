import { InferenceConfg, MessageData, ProgressCallback } from "./types";
import Worker from './worker.ts?worker'

/**
 * Run text to speech inference in new worker thread. Fetches the model
 * first, if it has not yet been saved to opfs yet.
 */
export async function predict(config: InferenceConfg, callback?: ProgressCallback): Promise<Blob> {
  const worker = new Worker()

  worker.postMessage({ type: 'init', ...config });

  return await new Promise<Blob>((resolve, reject) => {
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
