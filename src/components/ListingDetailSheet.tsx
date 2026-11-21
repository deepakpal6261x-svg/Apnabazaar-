import React, { useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  Landmark,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  QrCode,
  ShoppingBag,
  Smartphone,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import {
  CartItem,
  CscDocumentItem,
  Lang,
  MarketplaceListing,
  ProductOrServiceItem,
} from '../types';
import { TIME_SLOTS, UI_TEXT } from '../i18n/translations';
import { SpeakButton } from './SpeakButton';

interface ListingDetailSheetProps {
  listing: MarketplaceListing | null;
  lang: Lang;
  cart: CartItem[];
  onClose: () => void;
  onAddToCart: (listing: MarketplaceListing, item: ProductOrServiceItem) => void;
  onUpdateCartQty: (listingId: string, itemId: string, delta: number) => void;
  onOpenCart: () => void;
  onOpenUpi: (listing: MarketplaceListing, amount?: number) => void;
  onBookQueueToken: (params: {
    listing: MarketplaceListing;
    service: ProductOrServiceItem;
    slotLabel: string;
    paymentMethod: 'upi' | 'cash';
  }) => void;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
}

const renderDocIcon = (icon: CscDocumentItem['icon']) => {
  switch (icon) {
    case 'aadhaar':
      return <CreditCard className="w-5 h-5 text-sky-700" />;
    case 'photo':
      return <Camera className="w-5 h-5 text-orange-600" />;
    case 'phone':
      return <Smartphone className="w-5 h-5 text-emerald-700" />;
    case 'bank':
      return <Landmark className="w-5 h-5 text-indigo-700" />;
    case 'ration':
      return <FileText className="w-5 h-5 text-amber-700" />;
    default:
      return <FileCheck2 className="w-5 h-5 text-teal-700" />;
  }
};

export const ListingDetailSheet: React.FC<ListingDetailSheetProps> = ({
  listing,
  lang,
  cart,
  onClose,
  onAddToCart,
  onUpdateCartQty,
  onOpenCart,
  onOpenUpi,
  onBookQueueToken,
  speakingId,
  onSpeak,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(TIME_SLOTS[0].id);
  const [queuePayMethod, setQueuePayMethod] = useState<'cash' | 'upi'>('cash');

  const isQueueCategory =
    listing?.category === 'csc' ||
    listing?.category === 'clinic' ||
    listing?.category === 'salon';

  const activeService = useMemo(() => {
    if (!listing || !listing.items.length) return null;
    return listing.items.find((i) => i.id === selectedServiceId) || listing.items[0];
  }, [listing, selectedServiceId]);

  if (!listing) return null;

  const t = UI_TEXT[lang];
  const displayName = lang === 'hi' ? listing.nameHi : listing.nameEn;
  const displayArea = lang === 'hi' ? listing.areaHi : listing.areaEn;
  const cartCountForListing = cart
    .filter((c) => c.listingId === listing.id)
    .reduce((sum, c) => sum + c.quantity, 0);

  const getCartQty = (itemId: string) =>
    cart.find((c) => c.listingId === listing.id && c.item.id === itemId)?.quantity || 0;

  const whatsappText = encodeURIComponent(
    lang === 'hi'
      ? `नमस्ते ${listing.ownerName} जी, मैंने अपना बाज़ार ऐप पर आपकी दुकान "${listing.nameHi}" देखी। मुझे जानकारी चाहिए।`
      : `Hello ${listing.ownerName}, I found "${listing.nameEn}" on ApnaBazaar and would like to order/inquire.`
  );

  const docsSpeechText = activeService?.requiredDocs?.length
    ? lang === 'hi'
      ? `${activeService.nameHi} के लिए ये ज़रूरी कागज़ात साथ लेकर आएँ: ${activeService.requiredDocs
          .map((d, i) => `${i + 1}, ${d.nameHi}`)
          .join('। ')}।`
      : `Required documents for ${activeService.nameEn}: ${activeService.requiredDocs
          .map((d, i) => `${i + 1}, ${d.nameEn}`)
          .join('. ')}.`
    : '';

  const nextTokenNum = (listing.currentToken || 1) + (listing.waitingCount || 0) + 1;
  const estWaitMin = ((listing.waitingCount || 0) + 1) * (activeService?.durationMin || 12);

  const handleConfirmQueue = () => {
    if (!activeService) return;
    const slotObj = TIME_SLOTS.find((s) => s.id === selectedSlotId) || TIME_SLOTS[0];
    onBookQueueToken({
      listing,
      service: activeService,
      slotLabel: lang === 'hi' ? slotObj.hi : slotObj.en,
      paymentMethod: queuePayMethod,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-[#FAFBF8] rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        {/* Sheet Header */}
        <div className="bg-white px-5 pt-4 pb-4 border-b border-stone-200 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
              <span>{listing.ownerName}</span>
              <span aria-hidden="true">·</span>
              <span className={listing.isAvailable ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                {listing.isAvailable ? t.openNow : t.closedNow}
              </span>
              {listing.subscriptionStatus === 'active' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-semibold">{t.verifiedPartner}</span>
                </>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 mt-1">{displayName}</h3>
            <p className="text-sm text-stone-600 mt-0.5">{displayArea}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SpeakButton
              id={`detail-header-${listing.id}`}
              text={
                lang === 'hi'
                  ? `${listing.nameHi}, मालिक ${listing.ownerName}, पता ${listing.areaHi}। ${
                      isQueueCategory
                        ? `अभी टोकन नंबर ${listing.currentToken || 1} चल रहा है और ${listing.waitingCount || 0} लोग लाइन में हैं।`
                        : `यहाँ ${listing.items.length} सामान उपलब्ध हैं।`
                    }`
                  : `${listing.nameEn}, by ${listing.ownerName}, at ${listing.areaEn}.`
              }
              speakingId={speakingId}
              onSpeak={onSpeak}
              lang={lang}
              size="sm"
            />
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100"
              aria-label={lang === 'hi' ? 'बंद करें' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Direct Call / WhatsApp / Direct UPI Action Bar */}
        <div className="bg-white px-5 py-3 border-b border-stone-100 grid grid-cols-3 gap-2 shrink-0">
          <a
            href={`tel:${listing.businessPhone}`}
            className="min-h-[44px] rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>{t.callNow}</span>
          </a>
          <a
            href={`https://wa.me/91${listing.businessPhone.replace(/\D/g, '')}?text=${whatsappText}`}
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>{t.whatsapp}</span>
          </a>
          <button
            type="button"
            onClick={() => onOpenUpi(listing, activeService?.price)}
            className="min-h-[44px] rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>{t.payUpi}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isQueueCategory ? (
            <>
              {/* Live Smart Queue Status Banner */}
              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-700" />
                    <span>{t.liveQueueTitle}</span>
                  </h4>
                  <span className="text-xs font-semibold text-emerald-700">
                    {lang === 'hi' ? 'ऑटो-कन्फर्म (तुरंत टोकन)' : 'Auto-Confirmed Token'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200/70">
                    <div className="text-[11px] text-emerald-900 font-medium">
                      {t.currentTokenLabel}
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-900 tabular-nums mt-0.5">
                      #{listing.currentToken || 1}
                    </div>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70">
                    <div className="text-[11px] text-stone-600 font-medium flex items-center justify-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{t.waitingLabel}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-stone-900 tabular-nums mt-0.5">
                      {listing.waitingCount || 0}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-200/70">
                    <div className="text-[11px] text-orange-900 font-medium flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'आपका टोकन' : 'Your Token'}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-orange-700 tabular-nums mt-0.5">
                      #{nextTokenNum}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-stone-600 mt-3 text-center">
                  {lang === 'hi'
                    ? `अनुमानित इंतज़ार: लगभग ${estWaitMin} मिनट — टोकन तुरंत मोबाइल पर मिल जाएगा`
                    : `Estimated wait: ~${estWaitMin} mins — instant digital token generated`}
                </p>
              </div>

              {/* Service Selector */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-stone-900">
                  {lang === 'hi' ? '1. सेवा चुनें:' : '1. Pick a Service:'}
                </h4>
                <div className="space-y-2">
                  {listing.items.map((service) => {
                    const isSelected = activeService?.id === service.id;
                    const sName = lang === 'hi' ? service.nameHi : service.nameEn;
                    const sUnit = lang === 'hi' ? service.unitHi : service.unitEn;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedServiceId(service.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedServiceId(service.id);
                        }}
                        className={`w-full rounded-2xl p-4 border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600'
                            : 'bg-white border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 text-sm sm:text-base">
                            {sName}
                          </div>
                          <div className="text-xs text-stone-600 mt-0.5 tabular-nums">
                            ₹{service.price} / {sUnit}
                            {service.durationMin ? ` · ~${service.durationMin} ${lang === 'hi' ? 'मिनट' : 'min'}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <SpeakButton
                            id={`srv-${service.id}`}
                            text={
                              lang === 'hi'
                                ? `${service.nameHi}, शुल्क ${service.price} रुपये।`
                                : `${service.nameEn}, fee ${service.price} rupees.`
                            }
                            speakingId={speakingId}
                            onSpeak={onSpeak}
                            lang={lang}
                            size="sm"
                          />
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-300'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CSC / Clinic Visual Icon + Voice Document Checklist */}
              {activeService?.requiredDocs && activeService.requiredDocs.length > 0 && (
                <div className="bg-sky-50/80 rounded-2xl border border-sky-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-sky-950">
                      {t.docsRequiredTitle}
                    </h4>
                    <SpeakButton
                      id={`docs-${activeService.id}`}
                      text={docsSpeechText}
                      speakingId={speakingId}
                      onSpeak={onSpeak}
                      lang={lang}
                      label
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeService.requiredDocs.map((docItem) => (
                      <div
                        key={docItem.id}
                        className="bg-white rounded-xl p-3 border border-sky-100 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                          {renderDocIcon(docItem.icon)}
                        </div>
                        <span className="text-sm font-semibold text-stone-900">
                          {lang === 'hi' ? docItem.nameHi : docItem.nameEn}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Slot Picker */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-stone-900">
                  {lang === 'hi' ? '2. समय चुनें:' : '2. Choose Time Slot:'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                        selectedSlotId === slot.id
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {lang === 'hi' ? slot.hi : slot.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Choice */}
              <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-stone-200 p-3.5">
                <span className="text-xs sm:text-sm font-bold text-stone-800">
                  {lang === 'hi' ? 'भुगतान का तरीका:' : 'Payment Mode:'}
                </span>
                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQueuePayMethod('cash')}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-bold whitespace-nowrap ${
                      queuePayMethod === 'cash' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
                    }`}
                  >
                    {t.cashPay}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueuePayMethod('upi')}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-bold whitespace-nowrap ${
                      queuePayMethod === 'upi' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600'
                    }`}
                  >
                    {t.upiPay}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Product Catalog for Sabji, Kirana, Showrooms */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900">
                  {lang === 'hi' ? 'आज के ताज़ा भाव व सामान' : 'Available Products & Rates'}
                </h4>
                <span className="text-xs text-stone-500">
                  {lang === 'hi' ? 'भाव सुनने के लिए स्पीकर दबाएँ' : 'Tap speaker to hear rate'}
                </span>
              </div>

              <div className="space-y-2.5">
                {listing.items.map((item) => {
                  const qty = getCartQty(item.id);
                  const itemName = lang === 'hi' ? item.nameHi : item.nameEn;
                  const itemUnit = lang === 'hi' ? item.unitHi : item.unitEn;
                  const speech =
                    lang === 'hi'
                      ? `${item.nameHi}, भाव ${item.price} रुपये प्रति ${item.unitHi}।`
                      : `${item.nameEn}, price ${item.price} rupees per ${item.unitEn}.`;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-stone-900 text-base">{itemName}</div>
                        <div className="text-lg font-extrabold text-emerald-800 tabular-nums mt-0.5">
                          ₹{item.price}{' '}
                          <span className="text-xs font-medium text-stone-500">/ {itemUnit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <SpeakButton
                          id={`prod-${listing.id}-${item.id}`}
                          text={speech}
                          speakingId={speakingId}
                          onSpeak={onSpeak}
                          lang={lang}
                          size="sm"
                        />

                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => onAddToCart(listing, item)}
                            className="min-h-[44px] px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm flex items-center gap-1 whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{t.addToCart}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => onUpdateCartQty(listing.id, item.id, -1)}
                              className="w-9 h-9 rounded-lg bg-white text-emerald-900 flex items-center justify-center shadow-xs"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-7 text-center font-extrabold text-emerald-950 tabular-nums">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateCartQty(listing.id, item.id, 1)}
                              className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Sheet Footer CTA */}
        <div className="bg-white px-5 py-4 border-t border-stone-200 shrink-0">
          {isQueueCategory ? (
            <button
              type="button"
              onClick={handleConfirmQueue}
              disabled={!activeService}
              className="w-full min-h-[52px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Ticket className="w-5 h-5" />
              <span>
                {t.confirmInstantToken} (#{nextTokenNum} · ₹{activeService?.price || 0})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="w-full min-h-[52px] rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>
                {cartCountForListing > 0
                  ? lang === 'hi'
                    ? `मेरा झोला देखें (${cartCountForListing} सामान)`
                    : `View Basket (${cartCountForListing} items)`
                  : lang === 'hi'
                  ? 'मेरा झोला खोलें'
                  : 'Open Basket'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
