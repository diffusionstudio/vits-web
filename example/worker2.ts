import * as tts from '../src/index';

const start = performance.now();
const TtsSession = await tts.TtsSession.create({
  voiceId: 'en_US-hfc_female-medium',
});
console.log('Time taken to init session:', performance.now() - start);

async function main(event: MessageEvent<tts.InferenceConfg & { type: 'init' }>) {
  if (event.data?.type != 'init') return;

  const start = performance.now();
  const blob = await TtsSession.predict(event.data.text);
  console.log('Time taken:', performance.now() - start);

  self.postMessage({ type: 'result', audio: blob })
}

self.addEventListener('message', main);
