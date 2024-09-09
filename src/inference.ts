import { InferenceConfg, ProgressCallback } from './types';
import { HF_BASE, ONNX_BASE, PATH_MAP, WASM_BASE } from './fixtures';
import { readBlob, writeBlob } from './opfs';
import { fetchBlob } from './http.js';
import { pcm2wav } from './audio';

let module: typeof import('./piper.js');
let ort: typeof import('onnxruntime-web');

/**
 * Run text to speech inference in new worker thread. Fetches the model
 * first, if it has not yet been saved to opfs yet.
 */
export async function predict(config: InferenceConfg, callback?: ProgressCallback): Promise<Blob> {
	module = module ?? (await import('./piper.js'));
	ort = ort ?? (await import('onnxruntime-web'));

	const path = PATH_MAP[config.voiceId];
	const input = JSON.stringify([{ text: config.text.trim() }]);

	ort.env.allowLocalModels = false;
	ort.env.wasm.numThreads = navigator.hardwareConcurrency;
	ort.env.wasm.wasmPaths = ONNX_BASE;

	const modelConfigBlob = await getBlob(`${HF_BASE}/${path}.json`);
	const modelConfig = JSON.parse(await modelConfigBlob.text());

	const phonemeIds: string[] = await new Promise(async (resolve) => {
		const phonemizer = await module.createPiperPhonemize({
			print: (data: any) => {
				resolve(JSON.parse(data).phoneme_ids);
			},
			printErr: (message: any) => {
				throw new Error(message);
			},
			locateFile: (url: string) => {
				if (url.endsWith('.wasm')) return `${WASM_BASE}.wasm`;
				if (url.endsWith('.data')) return `${WASM_BASE}.data`;
				return url;
			},
		});

		phonemizer.callMain([
			'-l',
			modelConfig.espeak.voice,
			'--input',
			input,
			'--espeak_data',
			'/espeak-ng-data',
		]);
	});

	const speakerId = 0;
	const sampleRate = modelConfig.audio.sample_rate;
	const noiseScale = modelConfig.inference.noise_scale;
	const lengthScale = modelConfig.inference.length_scale;
	const noiseW = modelConfig.inference.noise_w;

	const modelBlob = await getBlob(`${HF_BASE}/${path}`, callback);
	const session = await ort.InferenceSession.create(await modelBlob.arrayBuffer());
	const feeds = {
		input: new ort.Tensor('int64', phonemeIds, [1, phonemeIds.length]),
		input_lengths: new ort.Tensor('int64', [phonemeIds.length]),
		scales: new ort.Tensor('float32', [noiseScale, lengthScale, noiseW]),
	};
	if (Object.keys(modelConfig.speaker_id_map).length) {
		Object.assign(feeds, { sid: new ort.Tensor('int64', [speakerId]) });
	}

	const {
		output: { data: pcm },
	} = await session.run(feeds);

	return new Blob([pcm2wav(pcm as Float32Array, 1, sampleRate)], { type: 'audio/x-wav' });
}

/**
 * Tries to get blob from opfs, if it's not stored
 * yet the method will fetch the blob.
 */
async function getBlob(url: string, callback?: ProgressCallback) {
	let blob: Blob | undefined = await readBlob(url);

	if (!blob) {
		blob = await fetchBlob(url, callback);
		await writeBlob(url, blob);
	}

	return blob;
}
