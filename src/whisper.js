import { pipeline } from "@huggingface/transformers";

let transcriber = null;

export async function loadWhisper(onProgress) {
  if (transcriber) return transcriber;

  // Use tiny model, small size, suitable for browser; first load requires network, subsequent uses cache
  transcriber = await pipeline(
    "automatic-speech-recognition",
    "Xenova/whisper-tiny.en", // English model,
    { progress_callback: onProgress },
  );
  return transcriber;
}

export async function transcribeAudio(audioBlob) {
  if (!transcriber) await loadWhisper();

  // Convert Blob to AudioBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Extract mono channel, get Float32Array
  const audioData = audioBuffer.getChannelData(0);

  // Whisper requires 16kHz, if original sample rate differs, simple resampling needed (omitted here, assume recording already processed)
  const result = await transcriber(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: "en", // Chinese change to 'zh'
    task: "transcribe",
  });

  return result.text;
}
