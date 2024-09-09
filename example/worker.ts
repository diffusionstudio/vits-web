import * as tts from '../src/index';

async function main(event: MessageEvent<tts.InferenceConfg & { type: 'init' }>) {
  if (event.data?.type != 'init') return;

  const start = performance.now();
  const blob = await tts.predict({
    text: event.data.text,
    voiceId: event.data.voiceId,
  });
  console.log('Time taken:', performance.now() - start + ' ms');

  self.postMessage({ type: 'result', audio: blob })
}

self.addEventListener('message', main);
