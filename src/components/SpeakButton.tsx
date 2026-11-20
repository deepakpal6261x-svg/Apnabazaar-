import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Lang } from '../types';

interface SpeakButtonProps {
  text: string;
  id: string;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
  lang: Lang;
  label?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  id,
  speakingId,
  onSpeak,
  lang,
  label = false,
  size = 'md',
  className = '',
}) => {
  const isSpeaking = speakingId === id;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSpeak(text, id);
      }}
      aria-label={
        isSpeaking
          ? lang === 'hi'
            ? 'पढ़ना रोकें'
            : 'Stop reading'
          : lang === 'hi'
          ? 'आवाज़ में सुनें'
          : 'Listen aloud'
      }
      title={lang === 'hi' ? 'सुनें' : 'Listen'}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-700 shrink-0 whitespace-nowrap ${
        size === 'sm' ? 'min-h-[40px] min-w-[40px] px-2.5 text-xs' : 'min-h-[44px] min-w-[44px] px-3 text-sm'
      } ${
        isSpeaking
          ? 'bg-orange-600 text-white shadow-sm'
          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
      } ${className}`}
    >
      {isSpeaking ? <VolumeX className="w-5 h-5 shrink-0" /> : <Volume2 className="w-5 h-5 shrink-0" />}
      {label && (
        <span>
          {isSpeaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : lang === 'hi' ? 'सुनें' : 'Listen'}
        </span>
      )}
    </button>
  );
};
