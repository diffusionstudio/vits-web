import { test, expect, Page } from '@playwright/test';
import * as tts from '.';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('The inference methods', () => {
	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		await page.goto('http://localhost:5173/');
	});

	test.afterEach(async () => {
		await page.evaluate(async () => {
			// @ts-ignore
			await (await navigator.storage.getDirectory()).remove({ recursive: true });
		});
	});

	test('should be able to generate a voice and download models', async () => {
		let stored = await page.evaluate(async () => {
			return await tts.stored();
		});
		// make sure opfs is empty
		expect(stored.length).toBe(0);

		// load model from huggingface

		const result = await page.evaluate(async () => {
			const calls: tts.Progress[] = [];

			const fn: tts.ProgressCallback = (progress) => {
				calls.push(progress);
			};

			const audio = await tts.predict({ text: 'Hello World', voiceId: 'en_US-danny-low' }, fn);
			const arrayBuffer = await audio.arrayBuffer();
			const { size, type } = audio;

			return {
				calls,
				size,
				type,
				byteLength: arrayBuffer.byteLength,
			};
		});

		// check progress
		expect(result.calls.length).toBeGreaterThan(10);
		expect(result.calls[10].url).toMatch('en_US-danny-low');
		expect(typeof result.calls[10].total == 'number').toBe(true);
		expect(typeof result.calls[10].loaded == 'number').toBe(true);

		expect(result.byteLength).toBeGreaterThan(1e3);
		expect(result.size).toBeGreaterThan(1e3);
		expect(result.type).toBe('audio/x-wav');

		stored = await page.evaluate(async () => {
			return await tts.stored();
		});
		// make sure opfs is empty
		expect(stored.length).toBe(1);

		// load model from memory
		// use the same model again
		const calls = await page.evaluate(async () => {
			const calls: tts.Progress[] = [];

			const fn: tts.ProgressCallback = (progress) => {
				calls.push(progress);
			};

			await tts.predict({ text: 'Hello World', voiceId: 'en_US-danny-low' }, fn);
			return calls;
		});

		expect(calls.length).toBe(0);
	});
});
