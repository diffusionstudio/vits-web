import * as tts from '../src';
import Worker from './worker.ts?worker';

// required for e2e
Object.assign(window, { tts });

document.querySelector('#app')!.innerHTML = `
<button id="btn" type="button">Predict</button>
`

const worker = new Worker();

document.getElementById('btn')?.addEventListener('click', async () => {

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
  });
});
