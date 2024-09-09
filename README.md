[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/diffusion-studio/ffmpeg-js/graphs/commit-activity)
[![Website shields.io](https://img.shields.io/website-up-down-green-red/http/shields.io.svg)](https://huggingface.co/spaces/diffusionstudio/vits-web)
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label)](https://discord.gg/n3mpzfejAb)
[![GitHub license](https://badgen.net/github/license/Naereen/Strapdown.js)](https://github.com/diffusion-studio/ffmpeg-js/blob/main/LICENSE)
[![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)

# Run VITS based text-to-speech in the browser powered by the [ONNX Runtime](https://onnxruntime.ai/)

A big shout-out goes to [Rhasspy Piper](https://github.com/rhasspy/piper), who open-sourced all the currently available models (MIT License) and to [@jozefchutka](https://github.com/jozefchutka) who came up with the wasm build steps.

## Usage
First of all, you need to install the library:
```bash
npm i @diffusionstudio/vits-web
```

Then you're able to import the library like this (ES only)
```typescript
import * as tts from '@diffusionstudio/vits-web';
```

Now you can start synthesizing speech!
```typescript
const wav = await tts.predict({
  text: "Text to speech in the browser is amazing!",
  voiceId: 'en_US-hfc_female-medium',
});

const audio = new Audio();
audio.src = URL.createObjectURL(wav);
audio.play();

// as seen in /example with Web Worker
```

With the initial run of the predict function you will download the model which will then be stored in your [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system). You can also do this manually in advance *(recommended)*, as follows:
```typescript
await tts.download('en_US-hfc_female-medium', (progress) => {
  console.log(`Downloading ${progress.url} - ${Math.round(progress.loaded * 100 / progress.total)}%`);
});
```

The predict function also accepts a download progress callback as the second argument (`tts.predict(..., console.log)`). <br>

If you want to know which models have already been stored, do the following
```typescript
console.log(await tts.stored());

// will log ['en_US-hfc_female-medium']
```

You can remove models from opfs by calling
```typescript
await tts.remove('en_US-hfc_female-medium');

// alternatively delete all

await tts.flush();
```

And last but not least use this snippet if you would like to retrieve all available voices:
```typescript
console.log(await tts.voices());

// Hint: the key can be used as voiceId
```

### **That's it!** Happy coding :)
