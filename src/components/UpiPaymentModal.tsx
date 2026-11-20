import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, QrCode, Smartphone, X } from 'lucide-react';
import { Lang } from '../types';
import { buildUpiUri, generateUpiQrDataUrl } from '../utils/qrHelper';
import { SpeakButton } from './SpeakButton';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  payeeName: string;
  upiId?: string;
  uploadedQrUrl?: string;
  amount?: number;
  note?: string;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
  onPaidConfirm?: (method: 'upi' | 'cash') => void;
  allowCash?: boolean;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  lang,
  payeeName,
  upiId = '',
  uploadedQrUrl,
  amount,
  note = 'ApnaBazaar Payment',
  speakingId,
  onSpeak,
  onPaidConfirm,
  allowCash = true,
}) => {
  const [generatedQr, setGeneratedQr] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isOpen) return;
    if (!uploadedQrUrl && upiId) {
      generateUpiQrDataUrl({ upiId, payeeName, amount, note })
        .then((url) => {
          if (active) setGeneratedQr(url);
        })
        .catch(() => {
          if (active) setGeneratedQr('');
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen, upiId, payeeName, amount, note, uploadedQrUrl]);

  if (!isOpen) return null;

  const qrToDisplay = uploadedQrUrl || generatedQr;
  const upiUri = upiId ? buildUpiUri({ upiId, payeeName, amount, note }) : '';

  const handleCopy = async () => {
    if (!upiId) return;
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard restriction
    }
  };

  const voiceHelpText =
    lang === 'hi'
      ? `${payeeName} को सीधा UPI भुगतान करें। ${
          amount ? `राशि ${amount} रुपये है।` : ''
        } आप QR कोड स्कैन करके PhonePe, Google Pay या Paytm से भुगतान कर सकते हैं।`
      : `Pay ${payeeName} directly via UPI. ${
          amount ? `Amount is ${amount} rupees.` : ''
        } Scan the QR code using PhonePe, Google Pay, or Paytm.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-stone-100">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-stone-900 truncate">
              {lang === 'hi' ? 'सीधा UPI भुगतान' : 'Direct UPI Payment'}
            </h3>
            <p className="text-xs text-stone-600 truncate">{payeeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <SpeakButton
              id="upi-modal-speak"
              text={voiceHelpText}
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

        <div className="p-5 space-y-5">
          {amount && amount > 0 ? (
            <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-200/80">
              <div className="text-xs font-medium text-emerald-800">
                {lang === 'hi' ? 'कुल भुगतान राशि' : 'Total Payable Amount'}
              </div>
              <div className="text-3xl font-extrabold text-emerald-900 tabular-nums mt-0.5">
                ₹{amount}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col items-center justify-center bg-stone-50 rounded-2xl p-5 border border-stone-200/80">
            {qrToDisplay ? (
              <img
                src={qrToDisplay}
                alt={`${payeeName} UPI QR`}
                referrerPolicy="no-referrer"
                className="w-52 h-52 object-contain rounded-xl bg-white p-2 border border-stone-200"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl bg-white border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-500 p-4 text-center">
                <QrCode className="w-12 h-12 mb-2 text-stone-400" />
                <span className="text-xs">
                  {lang === 'hi'
                    ? 'दुकानदार ने अभी QR कोड नहीं जोड़ा है'
                    : 'Vendor has not added a QR code yet'}
                </span>
              </div>
            )}

            {upiId && (
              <div className="mt-4 w-full flex items-center justify-between gap-2 bg-white rounded-xl px-3.5 py-2.5 border border-stone-200">
                <div className="min-w-0">
                  <div className="text-[11px] text-stone-500">UPI ID</div>
                  <div className="text-sm font-bold text-stone-900 truncate tabular-nums">
                    {upiId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="min-h-[40px] px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>{lang === 'hi' ? 'कॉपी हुआ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'कॉपी' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {upiUri && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-stone-600">
                {lang === 'hi' ? 'सीधे ऐप से भुगतान करें:' : 'Open directly in UPI app:'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['PhonePe', 'Google Pay', 'Paytm'].map((appName) => (
                  <a
                    key={appName}
                    href={upiUri}
                    className="min-h-[48px] rounded-xl border border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 flex flex-col items-center justify-center px-2 py-2 text-xs font-bold text-stone-800 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-700 mb-0.5" />
                    <span className="whitespace-nowrap">{appName}</span>
                  </a>
                ))}
              </div>
              <a
                href={upiUri}
                className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>
                  {lang === 'hi' ? 'कोई भी UPI ऐप खोलें' : 'Open Any UPI App'}
                </span>
              </a>
            </div>
          )}

          {onPaidConfirm && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => onPaidConfirm('upi')}
                className="min-h-[48px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-4 transition-colors"
              >
                {lang === 'hi' ? 'UPI भुगतान हो गया' : 'Paid via UPI'}
              </button>
              {allowCash && (
                <button
                  type="button"
                  onClick={() => onPaidConfirm('cash')}
                  className="min-h-[48px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-sm px-4 transition-colors"
                >
                  {lang === 'hi' ? 'नकद (कैश) देंगे' : 'Pay Cash Instead'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
