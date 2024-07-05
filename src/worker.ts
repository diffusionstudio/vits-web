import * as ort from 'onnxruntime-web';
// @ts-ignore
import { createPiperPhonemize } from './piper.js';
import { ErrorMessage, FetchMessage, InferenceConfg, OutputMessage } from './types';
import { HF_BASE, ONNX_BASE, PATH_MAP } from './fixtures';
import { readBlob, writeBlob } from './opfs';
import { fetchBlob } from './http.js';
import { pcm2wav } from './audio';

type MessageData = InferenceConfg & { type?: 'init' }

const WASM_URL = new URL('/piper.wasm', import.meta.url).href;
const DATA_URL = new URL('/piper.data', import.meta.url).href;

async function handleMessage(event: MessageEvent<MessageData>) {
  const data = event.data;

  if (data?.type != 'init') return;

  const path = PATH_MAP[data.voiceId];
  const input = JSON.stringify([{ text: data.text.trim() }])

  const piperPhonemizeWasm = (await createBlobUrl(WASM_URL)).url;
  const piperPhonemizeData = (await createBlobUrl(DATA_URL)).url;

  ort.env.wasm.numThreads = navigator.hardwareConcurrency;
  ort.env.wasm.wasmPaths = ONNX_BASE;

  const modelConfigBlob = (await createBlobUrl(`${HF_BASE}/${path}.json`)).blob;
  const modelConfig = JSON.parse(await modelConfigBlob.text());

  const phonemeIds: string[] = await new Promise(async resolve => {
    const module = await createPiperPhonemize({
      print: (data: any) => {
        resolve(JSON.parse(data).phoneme_ids);
      },
      printErr: (message: any) => {
        self.postMessage({ type: "stderr", message } satisfies ErrorMessage);
      },
      locateFile: (url: string) => {
        if (url.endsWith(".wasm")) return piperPhonemizeWasm;
        if (url.endsWith(".data")) return piperPhonemizeData;
        return url;
      }
    });

    module.callMain(["-l", modelConfig.espeak.voice, "--input", input, "--espeak_data", "/espeak-ng-data"]);
  });

  const speakerId = 0;
  const sampleRate = modelConfig.audio.sample_rate;
  const noiseScale = modelConfig.inference.noise_scale;
  const lengthScale = modelConfig.inference.length_scale;
  const noiseW = modelConfig.inference.noise_w;

  const modelBlob = (await createBlobUrl(`${HF_BASE}/${path}`)).url;
  const session = await ort.InferenceSession.create(modelBlob);
  const feeds = {
    input: new ort.Tensor("int64", phonemeIds, [1, phonemeIds.length]),
    input_lengths: new ort.Tensor("int64", [phonemeIds.length]),
    scales: new ort.Tensor("float32", [noiseScale, lengthScale, noiseW])
  }
  if (Object.keys(modelConfig.speaker_id_map).length) {
    Object.assign(feeds, { sid: new ort.Tensor("int64", [speakerId]) })
  }

  const { output: { data: pcm } } = await session.run(feeds);

  const file = new Blob([pcm2wav(pcm as Float32Array, 1, sampleRate)], { type: "audio/x-wav" });

  self.postMessage({ type: "output", file } satisfies OutputMessage);
}

async function createBlobUrl(url: string) {
  let blob: Blob | undefined = await readBlob(url);

  if (!blob) {
    blob = await fetchBlob(url, (data) => {
      if (url.match('https://huggingface.co')) {
        self.postMessage({
          ...data,
          type: "fetch"
        } satisfies FetchMessage)
      }
    });
    await writeBlob(url, blob);
  }

  return {
    url: URL.createObjectURL(blob),
    blob
  };
}

self.addEventListener("message", handleMessage);
