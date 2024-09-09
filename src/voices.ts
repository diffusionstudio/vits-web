import { HF_BASE } from './fixtures';
import { Voice } from './types';

/**
 * Retrieves all available voices from huggingface
 * @returns
 */
export async function voices(): Promise<Voice[]> {
	const res = await fetch(`${HF_BASE}/voices.json`);

	if (!res.ok) {
		throw new Error('Could not retrieve voices file from huggingface');
	}

	return Object.values(await res.json());
}
