import { test, expect, Page } from '@playwright/test';
import * as tts from '.';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('The voices method', () => {
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

	test('should be able to fetch more than one hundred voices', async () => {
		const voices = await page.evaluate(async () => {
			return await tts.voices();
		});
		expect(voices.length).toBeGreaterThan(100);

		for (const voice of voices) {
			expect(typeof voice.key == 'string').toBe(true);
			expect(voice.key.length).toBeGreaterThan(0);

			expect(typeof voice.name == 'string').toBe(true);
			expect(voice.name.length).toBeGreaterThan(0);

			expect(typeof voice.language.code == 'string').toBe(true);
			expect(voice.language.code.length).toBeGreaterThan(0);

			expect(typeof voice.quality == 'string').toBe(true);
			expect(voice.quality.length).toBeGreaterThan(0);

			expect(typeof voice.num_speakers == 'number').toBe(true);

			expect(Object.keys(voice.files).length).toBe(3);
		}
	});
});
