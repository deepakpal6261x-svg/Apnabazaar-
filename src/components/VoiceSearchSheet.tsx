import React from 'react';
import { Mic, MicOff, Search, Sparkles } from 'lucide-react';
import { Lang } from '../types';
import { useVoiceInput } from '../hooks/useSpeech';
import { SpeakButton } from './SpeakButton';

interface VoiceSearchSheetProps {
  lang: Lang;
  onVoiceCommand: (spokenText: string) => void;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
}

const SAMPLE_COMMANDS = [
  { hi: 'ऑटो रिक्शा बुक करो', en: 'Book auto rickshaw' },
  { hi: 'टमाटर का भाव', en: 'Tomato rate' },
  { hi: 'CSC सेंटर', en: 'CSC Center' },
  { hi: 'सैलून बुकिंग', en: 'Salon booking' },
  { hi: 'डॉक्टर क्लिनिक', en: 'Doctor clinic' },
  { hi: 'किराना स्टोर', en: 'Kirana store' },
];

export const VoiceSearchSheet: React.FC<VoiceSearchSheetProps> = ({
  lang,
  onVoiceCommand,
  speakingId,
  onSpeak,
}) => {
  const { isListening, transcript, errorMsg, startListening, stopListening } = useVoiceInput(
    lang,
    (finalText) => {
      onVoiceCommand(finalText);
    }
  );

  const instructionText =
    lang === 'hi'
      ? 'बड़ा हरा माइक बटन दबाएँ और साफ हिंदी में बोलें। जैसे: ऑटो रिक्शा बुक करो, टमाटर का भाव, CSC सेंटर, या सैलून बुकिंग।'
      : 'Tap the big green microphone button and speak clearly. For example: Book auto rickshaw, Tomato rate, CSC center, or Salon booking.';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 text-center shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="text-left">
            <h2 className="text-2xl font-extrabold text-stone-900">
              {lang === 'hi' ? 'बोलकर खोजें' : 'Voice Search'}
            </h2>
            <p className="text-sm text-stone-600 mt-0.5">
              {lang === 'hi'
                ? 'लिखने की ज़रूरत नहीं — बस माइक दबाकर बोलें'
                : 'No typing needed — tap mic and speak'}
            </p>
          </div>
          <SpeakButton
            id="voice-sheet-guide"
            text={instructionText}
            speakingId={speakingId}
            onSpeak={onSpeak}
            lang={lang}
            label
          />
        </div>

        <div className="my-8 flex flex-col items-center">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg focus-visible:outline-4 focus-visible:outline-orange-500 ${
              isListening
                ? 'bg-orange-600 text-white ring-8 ring-orange-200'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white ring-8 ring-emerald-100'
            }`}
            aria-label={
              isListening
                ? lang === 'hi'
                  ? 'सुनना बंद करें'
                  : 'Stop listening'
                : lang === 'hi'
                ? 'बोलना शुरू करें'
                : 'Start speaking'
            }
          >
            {isListening ? <MicOff className="w-14 h-14" /> : <Mic className="w-14 h-14" />}
          </button>

          <p className="mt-5 text-base font-bold text-stone-900">
            {isListening
              ? lang === 'hi'
                ? 'सुन रहे हैं... अब बोलिए'
                : 'Listening... speak now'
              : lang === 'hi'
              ? 'बोलने के लिए बड़ा बटन दबाएँ'
              : 'Tap the big button to speak'}
          </p>

          {transcript && (
            <div className="mt-4 w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-emerald-950 font-semibold text-base">
              “{transcript}”
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-900 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="border-t border-stone-100 pt-5 text-left">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-800 mb-3">
            <Search className="w-4 h-4 text-emerald-700" />
            <span>
              {lang === 'hi'
                ? 'या नीचे दिए बोलने के उदाहरण पर सीधे टैप करें:'
                : 'Or tap any voice command directly:'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_COMMANDS.map((cmd) => {
              const phrase = lang === 'hi' ? cmd.hi : cmd.en;
              return (
                <button
                  key={cmd.en}
                  type="button"
                  onClick={() => onVoiceCommand(phrase)}
                  className="min-h-[52px] px-4 py-3 rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="font-semibold text-stone-900 text-sm sm:text-base">
                    “{phrase}”
                  </span>
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
