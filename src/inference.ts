import { InferenceConfg, ProgressCallback } from "./types";
import { HF_BASE, ONNX_BASE, PATH_MAP, WASM_BASE } from './fixtures';
import { readBlob, writeBlob } from './opfs';
import { fetchBlob } from './http.js';
import { pcm2wav } from './audio';

/**
 * Run text to speech inference in new worker thread. Fetches the model
 * first, if it has not yet been saved to opfs yet.
 */
export async function predict(config: InferenceConfg, callback?: ProgressCallback): Promise<Blob> {
  // @ts-ignore
  const { createPiperPhonemize } = await import('./piper.js');
  const ort = await import('onnxruntime-web');

  const path = PATH_MAP[config.voiceId];
  const input = JSON.stringify([{ text: config.text.trim() }])

  const piperPhonemizeWasm = (await createBlobUrl(`${WASM_BASE}.wasm`)).url;
  const piperPhonemizeData = (await createBlobUrl(`${WASM_BASE}.data`)).url;

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
        throw new Error(message);
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

  const modelBlob = (await createBlobUrl(`${HF_BASE}/${path}`, callback)).url;
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

  return new Blob([pcm2wav(pcm as Float32Array, 1, sampleRate)], { type: "audio/x-wav" });
}

async function createBlobUrl(url: string, callback?: ProgressCallback) {
  let blob: Blob | undefined = await readBlob(url);

  if (!blob) {
    blob = await fetchBlob(url, callback);
    await writeBlob(url, blob);
  }

  return {
    url: URL.createObjectURL(blob),
    blob
  };
}

