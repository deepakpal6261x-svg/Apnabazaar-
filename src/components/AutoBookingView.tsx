import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  MapPin,
  Mic,
  MicOff,
  Navigation,
  Phone,
  QrCode,
} from 'lucide-react';
import { Lang, MarketplaceListing } from '../types';
import { useVoiceInput } from '../hooks/useSpeech';
import { SpeakButton } from './SpeakButton';
import { UI_TEXT } from '../i18n/translations';

interface AutoBookingViewProps {
  lang: Lang;
  autos: MarketplaceListing[];
  onBack: () => void;
  onBookAuto: (params: {
    listing: MarketplaceListing;
    pickup: string;
    drop: string;
    fare: number;
    paymentMethod: 'upi' | 'cash';
  }) => void;
  onOpenUpi: (listing: MarketplaceListing, amount: number) => void;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
}

const POPULAR_STOPS_HI = ['बस स्टैंड', 'रेलवे स्टेशन', 'सब्जी मंडी', 'सरकारी अस्पताल', 'तहसील चौराहा'];
const POPULAR_STOPS_EN = ['Bus Stand', 'Railway Station', 'Sabji Mandi', 'Govt Hospital', 'Tehsil Chowk'];

export const AutoBookingView: React.FC<AutoBookingViewProps> = ({
  lang,
  autos,
  onBack,
  onBookAuto,
  onOpenUpi,
  speakingId,
  onSpeak,
}) => {
  const t = UI_TEXT[lang];
  const [pickup, setPickup] = useState(lang === 'hi' ? 'बस स्टैंड चौराहा' : 'Bus Stand Chowk');
  const [drop, setDrop] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [activeField, setActiveField] = useState<'pickup' | 'drop'>('drop');
  const [selectedPay, setSelectedPay] = useState<'cash' | 'upi'>('cash');

  const voice = useVoiceInput(lang, (spoken) => {
    if (activeField === 'pickup') {
      setPickup(spoken);
    } else {
      setDrop(spoken);
    }
  });

  const startFieldMic = (field: 'pickup' | 'drop') => {
    setActiveField(field);
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  const filteredAutos = useMemo(() => {
    const list = onlyAvailable ? autos.filter((a) => a.isAvailable) : autos;
    return [...list].sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
  }, [autos, onlyAvailable]);

  const estimateFare = (baseFare = 30) => {
    if (!drop.trim()) return baseFare;
    return Math.min(250, baseFare + Math.max(10, Math.min(50, drop.trim().length * 2)));
  };

  const stops = lang === 'hi' ? POPULAR_STOPS_HI : POPULAR_STOPS_EN;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-semibold text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'वापस होम' : 'Back Home'}</span>
        </button>

        <SpeakButton
          id="auto-guide-speak"
          text={
            lang === 'hi'
              ? 'ऑटो रिक्शा और ई-रिक्शा बुकिंग। कहाँ से बैठना है और कहाँ जाना है बोलकर या लिखकर बताएँ, फिर हरे उपलब्ध ऑटो पर बुक करें दबाएँ।'
              : 'Auto Rickshaw and E-Rickshaw booking. Speak or type pickup and drop locations, then tap Book Now on any available driver.'
          }
          speakingId={speakingId}
          onSpeak={onSpeak}
          lang={lang}
          label
        />
      </div>

      {/* Pickup & Drop Voice Input Panel */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              {lang === 'hi' ? 'ऑटो / ई-रिक्शा तुरंत बुक करें' : 'Instant Auto / E-Rickshaw'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              {lang === 'hi'
                ? 'माइक दबाकर जगह का नाम बोलें या नीचे से चुनें'
                : 'Tap the mic to speak your location or pick a quick stop'}
            </p>
          </div>
          <CarFront className="w-9 h-9 text-amber-600 shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Pickup */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {t.pickupLabel}
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-1.5 focus-within:border-emerald-600 focus-within:bg-white">
              <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder={lang === 'hi' ? 'जैसे: बस स्टैंड' : 'e.g. Bus Stand'}
                className="w-full min-h-[44px] bg-transparent text-sm sm:text-base font-medium text-stone-900 outline-none"
              />
              <button
                type="button"
                onClick={() => startFieldMic('pickup')}
                className={`min-h-[42px] min-w-[42px] rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  voice.isListening && activeField === 'pickup'
                    ? 'bg-orange-600 text-white'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
                aria-label="Speak pickup location"
              >
                {voice.isListening && activeField === 'pickup' ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Drop */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {t.dropLabel}
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-1.5 focus-within:border-orange-600 focus-within:bg-white">
              <Navigation className="w-5 h-5 text-orange-600 shrink-0" />
              <input
                type="text"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                placeholder={lang === 'hi' ? 'जैसे: रेलवे स्टेशन या अस्पताल' : 'e.g. Railway Station'}
                className="w-full min-h-[44px] bg-transparent text-sm sm:text-base font-medium text-stone-900 outline-none"
              />
              <button
                type="button"
                onClick={() => startFieldMic('drop')}
                className={`min-h-[42px] min-w-[42px] rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  voice.isListening && activeField === 'drop'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
                aria-label="Speak drop location"
              >
                {voice.isListening && activeField === 'drop' ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stop Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-stone-500">
            {lang === 'hi' ? 'लोकप्रिय जगहें:' : 'Quick stops:'}
          </span>
          {stops.map((stop) => (
            <button
              key={stop}
              type="button"
              onClick={() => setDrop(stop)}
              className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                drop === stop
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {stop}
            </button>
          ))}
        </div>

        {/* Payment Method & Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedPay('cash')}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedPay === 'cash' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
              }`}
            >
              {t.cashPay}
            </button>
            <button
              type="button"
              onClick={() => setSelectedPay('upi')}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedPay === 'upi' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
              }`}
            >
              {t.upiPay}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOnlyAvailable((v) => !v)}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap ${
              onlyAvailable
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {lang === 'hi' ? 'केवल उपलब्ध ड्राइवर दिखाएँ' : 'Show Available Only'}
          </button>
        </div>
      </div>

      {/* Nearby Auto Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAutos.map((auto) => {
          const fare = estimateFare(auto.baseFare || 30);
          const displayName = lang === 'hi' ? auto.nameHi : auto.nameEn;
          const displayArea = lang === 'hi' ? auto.areaHi : auto.areaEn;
          const speechSummary =
            lang === 'hi'
              ? `${auto.nameHi}, ड्राइवर ${auto.ownerName}, ${auto.areaHi}। किराया लगभग ${fare} रुपये। स्थिति: ${
                  auto.isAvailable ? 'उपलब्ध है' : 'अभी व्यस्त है'
                }।`
              : `${auto.nameEn}, driver ${auto.ownerName}, ${auto.areaEn}. Estimated fare ${fare} rupees. Status: ${
                  auto.isAvailable ? 'Available' : 'Busy'
                }.`;

          return (
            <div
              key={auto.id}
              className={`bg-white rounded-3xl border p-5 shadow-sm flex flex-col justify-between gap-4 ${
                auto.isAvailable ? 'border-stone-200' : 'border-stone-200/70 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                    <span>{auto.vehicleType || (lang === 'hi' ? 'ऑटो रिक्शा' : 'Auto Rickshaw')}</span>
                    <span aria-hidden="true">·</span>
                    <span className={auto.isAvailable ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                      {auto.isAvailable ? t.available : t.busy}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-stone-900 mt-1">{displayName}</h3>
                  <p className="text-sm text-stone-600 mt-0.5">
                    {auto.ownerName} · {displayArea}
                  </p>
                </div>

                <SpeakButton
                  id={`auto-speak-${auto.id}`}
                  text={speechSummary}
                  speakingId={speakingId}
                  onSpeak={onSpeak}
                  lang={lang}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-3 border border-stone-100">
                <div>
                  <div className="text-xs text-stone-500">{t.estimatedFare}</div>
                  <div className="text-2xl font-extrabold text-stone-900 tabular-nums">₹{fare}</div>
                </div>
                <div className="text-right text-xs text-stone-600">
                  <div>{lang === 'hi' ? 'सीधा UPI / कैश' : 'Direct UPI / Cash'}</div>
                  <div className="font-semibold text-stone-800 mt-0.5 tabular-nums">
                    {auto.businessPhone}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!auto.isAvailable}
                  onClick={() =>
                    onBookAuto({
                      listing: auto,
                      pickup: pickup.trim() || (lang === 'hi' ? 'वर्तमान स्थान' : 'Current Location'),
                      drop: drop.trim() || (lang === 'hi' ? 'मुख्य बाज़ार' : 'Main Bazaar'),
                      fare,
                      paymentMethod: selectedPay,
                    })
                  }
                  className={`col-span-2 min-h-[48px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors ${
                    auto.isAvailable
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {auto.isAvailable
                      ? lang === 'hi'
                        ? 'तुरंत ऑटो बुक करें'
                        : 'Confirm Auto Booking'
                      : lang === 'hi'
                      ? 'अभी सवारी में व्यस्त हैं'
                      : 'Currently Busy'}
                  </span>
                </button>

                <a
                  href={`tel:${auto.businessPhone}`}
                  className="min-h-[46px] rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t.callNow}</span>
                </a>

                <button
                  type="button"
                  onClick={() => onOpenUpi(auto, fare)}
                  className="min-h-[46px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t.payUpi}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
