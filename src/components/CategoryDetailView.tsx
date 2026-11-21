import React, { useMemo, useState } from 'react';
import {
  Apple,
  ArrowLeft,
  CarFront,
  Landmark,
  Mic,
  MicOff,
  Phone,
  QrCode,
  Scissors,
  Search,
  ShoppingBag,
  ShoppingBasket,
  Stethoscope,
  Store,
  Ticket,
  X,
} from 'lucide-react';
import { CategoryId, Lang, MarketplaceListing } from '../types';
import { CATEGORIES, UI_TEXT } from '../i18n/translations';
import { GENERATED_IMAGES } from '../data/seedData';
import { useVoiceInput } from '../hooks/useSpeech';
import { SpeakButton } from './SpeakButton';

interface CategoryDetailViewProps {
  categoryId: CategoryId;
  lang: Lang;
  listings: MarketplaceListing[];
  initialSearchQuery?: string;
  onBack: () => void;
  onSelectListing: (listing: MarketplaceListing) => void;
  onOpenUpi: (listing: MarketplaceListing) => void;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
}

const renderCategoryIcon = (id: CategoryId, className = 'w-6 h-6') => {
  switch (id) {
    case 'auto':
      return <CarFront className={className} />;
    case 'sabji':
      return <Apple className={className} />;
    case 'kirana':
      return <ShoppingBasket className={className} />;
    case 'csc':
      return <Landmark className={className} />;
    case 'salon':
      return <Scissors className={className} />;
    case 'clinic':
      return <Stethoscope className={className} />;
    case 'showroom':
      return <Store className={className} />;
  }
};

export const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({
  categoryId,
  lang,
  listings,
  initialSearchQuery = '',
  onBack,
  onSelectListing,
  onOpenUpi,
  speakingId,
  onSpeak,
}) => {
  const t = UI_TEXT[lang];
  const catMeta = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[1];
  const [localQuery, setLocalQuery] = useState(initialSearchQuery);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const voice = useVoiceInput(lang, (spoken) => {
    setLocalQuery(spoken);
  });

  const isQueueCategory =
    categoryId === 'csc' || categoryId === 'clinic' || categoryId === 'salon';

  const categoryListings = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    return listings.filter((l) => {
      if (l.category !== categoryId) return false;
      if (onlyOpen && !l.isAvailable) return false;
      if (!q) return true;
      const hay = [
        l.nameHi,
        l.nameEn,
        l.ownerName,
        l.areaHi,
        l.areaEn,
        ...l.items.flatMap((i) => [i.nameHi, i.nameEn]),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [listings, categoryId, onlyOpen, localQuery]);

  const catTitle = lang === 'hi' ? catMeta.nameHi : catMeta.nameEn;
  const catSub = lang === 'hi' ? catMeta.subHi : catMeta.subEn;

  const headerSpeech =
    lang === 'hi'
      ? `${catMeta.nameHi}। यहाँ ${categoryListings.length} दुकानें और सेवाएँ उपलब्ध हैं। किसी भी कार्ड पर टैप करके ${
          isQueueCategory ? 'तुरंत टोकन बुक करें।' : 'सामान और ताज़ा भाव देखें।'
        }`
      : `${catMeta.nameEn}. Showing ${categoryListings.length} available local shops and services.`;

  const fallbackImg =
    categoryId === 'sabji'
      ? GENERATED_IMAGES.sabji
      : categoryId === 'kirana' || categoryId === 'showroom'
      ? GENERATED_IMAGES.kirana
      : GENERATED_IMAGES.csc;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      {/* Top Bar: Back Button + Voice Guide */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 font-bold text-sm flex items-center gap-2 shadow-2xs transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{lang === 'hi' ? 'वापस जाएं' : 'Back'}</span>
        </button>

        <SpeakButton
          id={`cat-screen-speak-${categoryId}`}
          text={headerSpeech}
          speakingId={speakingId}
          onSpeak={onSpeak}
          lang={lang}
          label
        />
      </div>

      {/* Category Header + Search / Open Filter */}
      <section className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${catMeta.iconBgClass}`}
            >
              {renderCategoryIcon(categoryId, 'w-7 h-7')}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-500">
                {categoryListings.length} {lang === 'hi' ? 'उपलब्ध' : 'available'}
                {' · '}
                {isQueueCategory
                  ? lang === 'hi'
                    ? 'लाइव टोकन सेवा'
                    : 'Live Queue Token'
                  : lang === 'hi'
                  ? 'सीधा ऑर्डर व कॉल'
                  : 'Direct Order & Call'}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 truncate mt-0.5">
                {catTitle}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 truncate">{catSub}</p>
            </div>
          </div>
        </div>

        {/* In-Category Typing + Voice Search & Open Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <div className="flex-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-1 focus-within:bg-white focus-within:border-emerald-700">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder={
                lang === 'hi'
                  ? `${catMeta.nameHi} में खोजें या बोलें...`
                  : `Search inside ${catMeta.nameEn}...`
              }
              className="w-full min-h-[44px] bg-transparent text-sm font-medium text-stone-900 outline-none placeholder:text-stone-400"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => setLocalQuery('')}
                className="p-1.5 text-stone-500 hover:text-stone-900"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              className={`min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                voice.isListening
                  ? 'bg-orange-600 text-white'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
              aria-label={lang === 'hi' ? 'बोलकर खोजें' : 'Voice search'}
            >
              {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOnlyOpen((v) => !v)}
            className={`min-h-[46px] px-4 rounded-2xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
              onlyOpen
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {lang === 'hi' ? 'केवल खुली दुकानें' : 'Open Now Only'}
          </button>
        </div>
      </section>

      {/* Selected Category Shops & Cards Grid */}
      {categoryListings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 text-center space-y-3">
          <p className="font-bold text-stone-800 text-base">{t.noResults}</p>
          <p className="text-sm text-stone-600">
            {lang === 'hi'
              ? 'खोज शब्द हटाएँ या वापस होम पर जाकर दूसरी श्रेणी देखें।'
              : 'Clear your search filter or go back to browse other categories.'}
          </p>
          <div className="flex items-center justify-center gap-2.5 pt-2">
            {localQuery && (
              <button
                type="button"
                onClick={() => {
                  setLocalQuery('');
                  setOnlyOpen(false);
                }}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-700 text-white font-bold text-sm"
              >
                {t.resetFilter}
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm"
            >
              {lang === 'hi' ? 'वापस होम' : 'Back Home'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryListings.map((listing) => {
            const name = lang === 'hi' ? listing.nameHi : listing.nameEn;
            const area = lang === 'hi' ? listing.areaHi : listing.areaEn;
            const topItems = listing.items.slice(0, 4);
            const imgSrc = listing.imageUrl || fallbackImg;

            const cardSpeech =
              lang === 'hi'
                ? `${listing.nameHi}, पता ${listing.areaHi}। ${
                    isQueueCategory
                      ? `अभी टोकन नंबर ${listing.currentToken || 1} चल रहा है और ${
                          listing.waitingCount || 0
                        } लोग लाइन में हैं।`
                      : topItems
                          .map((i) => `${i.nameHi} ${i.price} रुपये प्रति ${i.unitHi}`)
                          .join(', ')
                  }`
                : `${listing.nameEn}, at ${listing.areaEn}. ${
                    isQueueCategory
                      ? `Now serving token ${listing.currentToken || 1} with ${
                          listing.waitingCount || 0
                        } people waiting.`
                      : topItems
                          .map((i) => `${i.nameEn} ${i.price} rupees per ${i.unitEn}`)
                          .join(', ')
                  }`;

            return (
              <article
                key={listing.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-stone-100 overflow-hidden">
                    {!failedImages[listing.id] ? (
                      <img
                        src={imgSrc}
                        alt={name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((f) => ({ ...f, [listing.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-orange-100 flex items-center justify-center text-emerald-900">
                        {renderCategoryIcon(listing.category, 'w-10 h-10')}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 text-white">
                      <span className="text-xs font-bold drop-shadow-xs">
                        {listing.isAvailable ? t.openNow : t.closedNow}
                        {listing.subscriptionStatus === 'active'
                          ? ` · ${t.verifiedPartner}`
                          : ''}
                      </span>
                      {isQueueCategory && (
                        <span className="text-xs font-extrabold tabular-nums drop-shadow-xs">
                          {lang === 'hi'
                            ? `टोकन #${listing.currentToken || 1}`
                            : `Token #${listing.currentToken || 1}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-stone-900 leading-snug">
                          {name}
                        </h2>
                        <p className="text-xs text-stone-600 mt-1">
                          {listing.ownerName} · {area}
                        </p>
                      </div>
                      <SpeakButton
                        id={`cat-card-speak-${listing.id}`}
                        text={cardSpeech}
                        speakingId={speakingId}
                        onSpeak={onSpeak}
                        lang={lang}
                        size="sm"
                      />
                    </div>

                    {topItems.length > 0 && (
                      <div className="divide-y divide-stone-100 border-t border-b border-stone-100 py-1">
                        {topItems.map((it) => (
                          <div
                            key={it.id}
                            className="py-2 flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="text-stone-700 font-medium truncate">
                              {lang === 'hi' ? it.nameHi : it.nameEn}
                            </span>
                            <span className="font-extrabold text-emerald-800 tabular-nums whitespace-nowrap shrink-0">
                              ₹{it.price}/{lang === 'hi' ? it.unitHi : it.unitEn}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectListing(listing)}
                    className="flex-1 min-h-[46px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    {isQueueCategory ? (
                      <>
                        <Ticket className="w-4 h-4 shrink-0" />
                        <span>{t.getToken}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>{t.viewShop}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`tel:${listing.businessPhone}`}
                    className="min-h-[46px] min-w-[46px] rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 flex items-center justify-center shrink-0"
                    aria-label={`${t.callNow} ${name}`}
                    title={t.callNow}
                  >
                    <Phone className="w-5 h-5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => onOpenUpi(listing)}
                    className="min-h-[46px] min-w-[46px] rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 flex items-center justify-center shrink-0"
                    aria-label={`${t.payUpi} ${name}`}
                    title={t.payUpi}
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
