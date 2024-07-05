import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import * as tts from './index';

document.querySelector('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="btn" type="button">Predict</button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

document.getElementById('btn')?.addEventListener('click', async () => {


  const voices = await tts.predict({
    text: "Upload and Download progress tracking with Fetch and Axios",
    voiceId: 'en_US-hfc_male-medium'
  }, console.log);

  const audio = new Audio();
  audio.src = URL.createObjectURL(voices);
  audio.play();

});
