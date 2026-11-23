// src/whisper.js
import { pipeline, env } from "@huggingface/transformers";

// Key: force WASM backend, avoid WebGPU compatibility issues
env.backends.onnx.wasm.numThreads = 1;

let transcriberPromise = null;

export function loadWhisper(onProgress) {
  if (!transcriberPromise) {
    transcriberPromise = pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en",
      {
        dtype: "fp32", // First try the most compatible fp32
        device: "wasm", // Explicitly use WASM
        progress_callback: onProgress,
      },
    ).catch((err) => {
      transcriberPromise = null; // Allow retry on failure
      throw err;
    });
  }
  return transcriberPromise;
}

export async function transcribeAudio(audioBlob) {
  const transcriber = await loadWhisper(); // Key: wait for loading to complete
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const audioData = audioBuffer.getChannelData(0);
  const result = await transcriber(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: "en",
    task: "transcribe",
  });
  return result.text;
}
