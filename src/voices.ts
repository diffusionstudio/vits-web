import { Voice } from "./types";

export async function voices(): Promise<Voice[]> {
  const res = await fetch('https://huggingface.co/diffusionstudio/piper-voices/raw/main/voices.json');

  if (!res.ok) {
    throw new Error('Could not retrieve voices file from huggingface')
  }

  return Object.values(await res.json());
}