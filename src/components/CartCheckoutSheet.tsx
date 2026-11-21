import React, { useState } from 'react';
import {
  CheckCircle2,
  Home,
  Mic,
  MicOff,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { CartItem, Lang } from '../types';
import { UI_TEXT } from '../i18n/translations';
import { useVoiceInput } from '../hooks/useSpeech';
import { SpeakButton } from './SpeakButton';

interface CartCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  cart: CartItem[];
  onUpdateQty: (listingId: string, itemId: string, delta: number) => void;
  onClearCart: () => void;
  onPlaceOrder: (params: {
    deliveryMode: 'delivery' | 'pickup';
    address: string;
    paymentMethod: 'upi' | 'cash';
  }) => void;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
}

export const CartCheckoutSheet: React.FC<CartCheckoutSheetProps> = ({
  isOpen,
  onClose,
  lang,
  cart,
  onUpdateQty,
  onClearCart,
  onPlaceOrder,
  speakingId,
  onSpeak,
}) => {
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [address, setAddress] = useState(
    lang === 'hi' ? 'मुख्य गली, हनुमान मंदिर के पास' : 'Main Lane, Near Hanuman Mandir'
  );

  const voice = useVoiceInput(lang, (spoken) => setAddress(spoken));

  if (!isOpen) return null;

  const t = UI_TEXT[lang];
  const total = cart.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  const cartSummarySpeech =
    lang === 'hi'
      ? `आपके झोले में ${cart.length} तरह के सामान हैं। कुल बिल ${total} रुपये है। आप घर पर डिलीवरी या दुकान से खुद लेना चुन सकते हैं।`
      : `You have ${cart.length} items in your basket. Total amount is ${total} rupees.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-[#FAFBF8] rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        <div className="bg-white px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-extrabold text-stone-900">{t.cartTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <SpeakButton
                id="cart-summary-speak"
                text={cartSummarySpeech}
                speakingId={speakingId}
                onSpeak={onSpeak}
                lang={lang}
                size="sm"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="font-bold text-stone-800">
                {lang === 'hi' ? 'आपका झोला अभी खाली है' : 'Your basket is empty'}
              </p>
              <p className="text-sm text-stone-500 mt-1">
                {lang === 'hi'
                  ? 'सब्जी, फल, किराना या शोरूम से सामान जोड़ें'
                  : 'Add vegetables, fruits, groceries, or store items'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {cart.map((entry) => (
                  <div
                    key={`${entry.listingId}-${entry.item.id}`}
                    className="bg-white rounded-2xl border border-stone-200 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-stone-500 truncate">
                        {lang === 'hi' ? entry.listingNameHi : entry.listingNameEn}
                      </div>
                      <div className="font-bold text-stone-900 text-sm sm:text-base">
                        {lang === 'hi' ? entry.item.nameHi : entry.item.nameEn}
                      </div>
                      <div className="text-sm font-extrabold text-emerald-800 tabular-nums">
                        ₹{entry.item.price * entry.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(entry.listingId, entry.item.id, -1)}
                        className="w-9 h-9 rounded-lg bg-white text-stone-800 flex items-center justify-center"
                        aria-label="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center font-bold tabular-nums">
                        {entry.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(entry.listingId, entry.item.id, 1)}
                        className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center"
                        aria-label="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'झोला खाली करें' : 'Clear Basket'}</span>
                </button>
              </div>

              {/* Delivery vs Pickup */}
              <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
                <div className="text-xs font-bold text-stone-700">
                  {lang === 'hi' ? 'सामान कैसे लेंगे?' : 'How would you like to receive?'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('delivery')}
                    className={`min-h-[46px] rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                      deliveryMode === 'delivery'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-stone-50 text-stone-800 border-stone-200'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>{t.homeDelivery}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('pickup')}
                    className={`min-h-[46px] rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                      deliveryMode === 'pickup'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-stone-50 text-stone-800 border-stone-200'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>{t.storePickup}</span>
                  </button>
                </div>

                {deliveryMode === 'delivery' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      {lang === 'hi' ? 'घर का पता (बोलकर या लिखकर बताएँ)' : 'Delivery Address (Speak or type)'}
                    </label>
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full min-h-[42px] bg-transparent text-sm text-stone-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={voice.isListening ? voice.stopListening : voice.startListening}
                        className={`min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center ${
                          voice.isListening ? 'bg-orange-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                        aria-label="Speak address"
                      >
                        {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-100">
                  <div className="text-xs font-bold text-stone-700 mb-2">
                    {lang === 'hi' ? 'भुगतान का तरीका (सीधे दुकानदार को):' : 'Direct Payment to Shopkeeper:'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`min-h-[44px] rounded-xl border font-bold text-xs sm:text-sm ${
                        paymentMethod === 'upi'
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-stone-50 text-stone-800 border-stone-200'
                      }`}
                    >
                      {t.upiPay}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`min-h-[44px] rounded-xl border font-bold text-xs sm:text-sm ${
                        paymentMethod === 'cash'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-800 border-stone-200'
                      }`}
                    >
                      {t.cashPay}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-white px-5 py-4 border-t border-stone-200 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-stone-600">
                {lang === 'hi' ? 'कुल राशि' : 'Total Amount'}
              </span>
              <span className="text-2xl font-extrabold text-stone-900 tabular-nums">₹{total}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onPlaceOrder({
                  deliveryMode,
                  address,
                  paymentMethod,
                })
              }
              className="w-full min-h-[52px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t.placeOrder}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
