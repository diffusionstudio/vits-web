import * as tts from '../src/index';

async function main(event: MessageEvent<tts.InferenceConfg & { type: 'init' }>) {
  if (event.data?.type != 'init') return;

  const blob = await tts.predict({
    text: event.data.text,
    voiceId: event.data.voiceId,
  });

  self.postMessage({ type: 'result', audio: blob })
}

self.addEventListener('message', main);
