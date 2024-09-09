'use client'

import { AssemblyAI } from 'assemblyai';
import React, { useState } from 'react';

const client = new AssemblyAI({
  apiKey: '3c558628c055461e86033df7b79765c4',
});


// interface TranslationResponse {
//   translatedText: string;
// }

const TranscriptionForm: React.FC = () => {
    const [fileUrl, setFileUrl] = useState<string>('');
    const [file, setFile] = useState<File | null>(null); // New state for file upload
    const [transcript, setTranscript] = useState<string>('');
    // const [translation, setTranslation] = useState<string>('');
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [recordingTime, setRecordingTime] = useState<number>(0); // State for recording time
    const [isRecording, setIsRecording] = useState<boolean>(false); // State to track recording status
    const [speakers, setSpeakers] = useState<string[]>([]); // Specify type as string[]
    const [highlights, setHighlights] = useState<string[]>([]); // Specify type as string[]

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks((prev) => [...prev, event.data]);
            }
        };
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        
        // Start timer
        const timer = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
        }, 1000);

        // Stop timer when recording stops
        recorder.onstop = () => {
            clearInterval(timer);
            setRecordingTime(0); // Reset recording time
            setIsRecording(false);
        };
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            const audioBlob = new Blob(recordedChunks, { type: 'audio/mp3' });
            setFile(new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' }));
            setRecordedChunks([]); // Clear recorded chunks
        }
    };

    const handleTranscribe = async () => {
        if (!file && !fileUrl) {
            console.error('Please provide either a file or a URL.');
            return; // Exit if neither is provided
        }
        if (file && fileUrl) {
            console.error('Please provide either a file or a URL, not both.');
            return; // Exit if both are provided
        }

        let data;
        if (file) {
            data = { audio: file, // Use File object directly
              speaker_labels: true,
              auto_highlights: true
             }; // Use File for file upload
        } else {
            data = { audio: fileUrl,
              speaker_labels: true,
              auto_highlights: true
             }; // Use URL if no file is uploaded
        }
        try {
            const response = await client.transcripts.transcribe(data);
            setTranscript(response.text || '');

            // Assuming response contains utterances
            const utterances = response.utterances || []; // Ensure utterances is an array
            for (const utterance of utterances) { // Changed 'let' to 'const'
              console.log(`Speaker ${utterance.speaker}: ${utterance.text}`)
                setSpeakers((prev) => [...prev, `Speaker ${utterance.speaker}: ${utterance.text}`]);
            }
            for (const result of response.auto_highlights_result?.results || []) {
              console.log(`Highlight: ${result.text}, Count: ${result.count}, Rank: ${result.rank}`)
              setHighlights(
                (prev) => [...prev, `Highlight: ${result.text}, Count: ${result.count}, Rank: ${result.rank}`]
              );
            }
            
        } catch (error) {
            console.error('Error transcribing audio:', error);
        }
    };

    // const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    //     try {
    //       const res = await fetch("https://libretranslate.com/translate", {
    //         method: "POST",
    //         body: JSON.stringify({
    //           q: text,
    //           source: "en",
    //           target: targetLanguage,
    //         }),
    //         headers: { "Content-Type": "application/json" }
    //       });
    
    //       const data: TranslationResponse = await res.json();
    //       return data.translatedText;
    //     } catch (error) {
    //       console.error("Translation error:", error);
    //       return "Error translating text";
    //     }
    // };
    
    // const handleTranslation = async () => {
    //     if (transcript) {
    //         const result = await translateText(transcript, "es"); // Translating to Spanish as an example
    //         setTranslation(result);
    //     }
    // };
  
    return (
        <div className='w-full h-full flex flex-col justify-center items-center gap-2'>
          <h1>Audio Transcription and Translation</h1>
          <input
            type="text"
            placeholder="Enter audio file URL"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className='bg-gray-200 p-4'
          />
          <input
            type="file"
            accept="audio/*" // Accept audio files
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} // Set file state
            className='bg-gray-200 p-4'
          />
          <button onClick={startRecording} className='bg-blue-300 px-4 py-2 rounded-lg'>Start Recording</button>
          <button onClick={stopRecording} className='bg-red-300 px-4 py-2 rounded-lg'>Stop Recording</button>
          {isRecording && <p>Recording Time: {recordingTime} seconds</p>} {/* Display recording time */}
          <button onClick={handleTranscribe}
          className='bg-green-300 px-4 py-2 rounded-lg'>Transcribe</button>
          <div className='flex flex-col w-full py-2'>

          {transcript && (
            <div>
              <div className='flex flex-col py-2 w-full gap-2'>
              <h2 className='font-semibold'>Transcript:</h2>
              <p>{transcript}</p>
              </div>
              {/* <div>
              <button onClick={handleTranslation}
                className='bg-green-300 px-4 py-2 rounded-lg'>Translate to Spanish</button>
              </div> */}
            </div>
          )}
          {speakers && (
            <div>
              <div className='flex flex-col py-2 w-full gap-2'>
              <h2 className='font-semibold'>Speakers:</h2>
              <p>{speakers}</p>
              </div>
              {/* <div>
              <button onClick={handleTranslation}
                className='bg-green-300 px-4 py-2 rounded-lg'>Translate to Spanish</button>
              </div> */}
            </div>
          )}
          
          {highlights && (
            <div>
              <div className='flex flex-col py-2 w-full gap-2'>
              <h2 className='font-semibold'>Highlights:</h2>
              <p>{highlights}</p>
              </div>
              {/* <div>
              <button onClick={handleTranslation}
                className='bg-green-300 px-4 py-2 rounded-lg'>Translate to Spanish</button>
              </div> */}
            </div>
          )}

          {/* {translation && (
            <div className='flex flex-col py-2 w-full gap-2'>
              <h2 className='font-semibold'>Translation:</h2>
              <p>{translation}</p>
            </div>
          )} */}
          </div>
        </div>
    );
};
    
export default TranscriptionForm;