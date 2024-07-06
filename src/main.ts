import * as tts from './index';

Object.assign(window, { tts });

document.querySelector('#app')!.innerHTML = `
<button id="btn" type="button">Predict</button>
`

document.getElementById('btn')?.addEventListener('click', async () => {

  const voices = await tts.predict({
    text: "Upload and Download progress tracking with Fetch and Axios",
    voiceId: 'en_US-hfc_female-medium'
  }, console.log);

  const audio = new Audio();
  audio.src = URL.createObjectURL(voices);
  audio.play();

});
