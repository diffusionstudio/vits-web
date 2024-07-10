import * as tts from '../src';
import Worker from './worker.ts?worker';
import Worker2 from './worker2.ts?worker';

// required for e2e
Object.assign(window, { tts });

document.querySelector('#app')!.innerHTML = `
<button id="btn" type="button">Predict</button>
<button id="btn2" type="button">Predict with Session Reuse</button>
`

document.getElementById('btn')?.addEventListener('click', async () => {
  const worker = new Worker();

  worker.postMessage({
    type: 'init',
    text: "As the waves crashed against the shore, they carried tales of distant lands and adventures untold.",
    voiceId: 'en_US-hfc_female-medium',
  });

  worker.addEventListener('message', (event: MessageEvent<{ type: 'result', audio: Blob }>) => {
    if (event.data.type != 'result') return;

    const audio = new Audio();
    audio.src = URL.createObjectURL(event.data.audio);
    audio.play();
    worker.terminate();
  });
});

const mainWorker = new Worker2();

document.getElementById('btn2')?.addEventListener('click', async () => {
  mainWorker.postMessage({
    type: 'init',
    text: "As the waves crashed against the shore, they carried tales of distant lands and adventures untold.",
    voiceId: 'en_US-hfc_female-medium',
  });

  mainWorker.addEventListener('message', (event: MessageEvent<{ type: 'result', audio: Blob }>) => {
    if (event.data.type != 'result') return;

    const audio = new Audio();
    audio.src = URL.createObjectURL(event.data.audio);
    audio.play();
  }, { once: true });
});
