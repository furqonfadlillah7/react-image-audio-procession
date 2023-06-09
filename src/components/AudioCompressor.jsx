import React, { useState } from "react";
import lamejs from "lamejs";

const Audio = () => {
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [processAudio, setProcessAudio] = useState(null);

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    setSelectedAudio(file);
  };

  const compressAudio = (audioBuffer) => {
    const mp3Encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 32);
    const samples = audioBuffer.getChannelData(0);
    const sampleBlockSize = 1152;
    const mp3Data = [];

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    const mergedMp3Data = new Uint8Array(
      mp3Data.reduce((acc, val) => acc + val.length, 0)
    );
    let offset = 0;
    for (let i = 0; i < mp3Data.length; i++) {
      mergedMp3Data.set(mp3Data[i], offset);
      offset += mp3Data[i].length;
    }

    const blob = new Blob([mergedMp3Data], { type: "audio/mp3" });
    return blob;
  };

  const handleAudioCompression = async () => {
    if (selectedAudio) {
      try {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const compressedAudioBlob = compressAudio(audioBuffer);
          setProcessAudio(compressedAudioBlob);
        };
        reader.readAsArrayBuffer(selectedAudio);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleDownloadAudio = () => {
    const url = URL.createObjectURL(processAudio);
    const link = document.createElement("a");
    link.href = url;
    link.download = "compressed_audio.mp3";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="text-center">
        <h1>Audio Compression</h1>
        <br></br>
      </div>
      <div className="d-flex justify-content-center">
        <div className="d-flex-table">
          <input type="file" accept="audio/*" onChange={handleAudioUpload} />
          {selectedAudio && (
            <audio controls>
              <source
                src={URL.createObjectURL(selectedAudio)}
                type="audio/mp3"
              />
            </audio>
          )}
          <button onClick={handleAudioCompression}>Compress Audio</button>
          {processAudio && (
            <div>
              <h4>Processed Audio</h4>
              <audio controls>
                <source
                  src={URL.createObjectURL(processAudio)}
                  type="audio/mp3"
                />
              </audio>
              <button onClick={handleDownloadAudio}>Download Audio</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Audio;
