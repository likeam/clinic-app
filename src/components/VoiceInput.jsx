import { useState, useRef } from "react";
import { transcribeAudio } from "../whisper";

export default function VoiceInput({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setLoading(true);
      try {
        const text = await transcribeAudio(blob);
        onTranscript(text);
      } catch (err) {
        console.error("Transcription failed:", err);
        alert("Speech recognition failed, please ensure model is loaded");
      }
      setLoading(false);
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-lg text-white font-medium ${
          isRecording ? "bg-red-600" : "bg-blue-600"
        }`}
      >
        {isRecording ? "Stop Recording" : "Start Voice Input"}
      </button>
      {loading && <span className="text-sm text-gray-500">Recognizing...</span>}
    </div>
  );
}
