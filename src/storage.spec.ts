import { test, expect, Page } from '@playwright/test';
import * as tts from '.';
import { PATH_MAP } from './fixtures';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('The storage methods', () => {
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

	test('should be able to download new voices', async () => {
		let stored = await page.evaluate(async () => {
			return await tts.stored();
		});
		// make sure opfs is empty
		expect(stored.length).toBe(0);

		let calls = await page.evaluate(async () => {
			const calls: tts.Progress[] = [];

			const fn: tts.ProgressCallback = (progress) => {
				calls.push(progress);
			};

			await tts.download('en_US-amy-low', fn);

			return calls;
		});

		// check progress
		expect(calls.length).toBeGreaterThan(10);
		expect(calls[10].url).toMatch('en_US-amy-low');
		expect(typeof calls[10].total == 'number').toBe(true);
		expect(typeof calls[10].loaded == 'number').toBe(true);

		// check stored file
		stored = await page.evaluate(async () => {
			return await tts.stored();
		});
		expect(stored.length).toBe(1);
		expect(stored[0]).toBe('en_US-amy-low');
	});

	test('should be able to delete selected voices', async () => {
		let stored = await page.evaluate(async () => {
			return await tts.stored();
		});
		expect(stored.length).toBe(0);

		await page.evaluate(async (pathmap) => {
			const root = await navigator.storage.getDirectory();
			const dir = await root.getDirectoryHandle('piper', { create: true });

			const voice0 = pathmap['de_DE-eva_k-x_low'].split('/').at(-1)!;
			const voice1 = pathmap['ca_ES-upc_ona-medium'].split('/').at(-1)!;

			await dir.getFileHandle(voice0, { create: true });
			await dir.getFileHandle(voice0 + '.json', { create: true });

			await dir.getFileHandle(voice1, { create: true });
			await dir.getFileHandle(voice1 + '.json', { create: true });
		}, PATH_MAP);

		stored = await page.evaluate(async () => {
			return await tts.stored();
		});
		expect(stored.length).toBe(2);

		await page.evaluate(async () => {
			await tts.remove('de_DE-eva_k-x_low');
		});

		stored = await page.evaluate(async () => {
			return await tts.stored();
		});
		expect(stored.length).toBe(1);
		expect(stored[0]).toBe('ca_ES-upc_ona-medium');
	});
});
