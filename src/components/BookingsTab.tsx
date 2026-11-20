import React from 'react';
import {
  CarFront,
  CheckCircle2,
  Clock,
  FileCheck2,
  Phone,
  QrCode,
  ShoppingBag,
  Ticket,
  XCircle,
} from 'lucide-react';
import { BookingRecord, Lang, MarketplaceListing } from '../types';
import { SpeakButton } from './SpeakButton';

interface BookingsTabProps {
  lang: Lang;
  bookings: BookingRecord[];
  listings: MarketplaceListing[];
  onCancelBooking: (bookingId: string) => void;
  onOpenUpiDirect: (params: {
    payeeName: string;
    upiId?: string;
    qrImageUrl?: string;
    amount: number;
  }) => void;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
  onGoHome: () => void;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  lang,
  bookings,
  listings,
  onCancelBooking,
  onOpenUpiDirect,
  speakingId,
  onSpeak,
  onGoHome,
}) => {
  const statusLabel = (status: BookingRecord['status']) => {
    if (lang === 'hi') {
      switch (status) {
        case 'confirmed':
          return 'पक्का हो गया';
        case 'in_progress':
          return 'चालू है';
        case 'completed':
          return 'पूरा हुआ';
        case 'cancelled':
          return 'रद्द किया गया';
      }
    }
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900">
            {lang === 'hi' ? 'मेरी बुकिंग और लाइव टोकन' : 'My Bookings & Live Tokens'}
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">
            {lang === 'hi'
              ? 'आपके ऑटो, CSC/सैलून/क्लिनिक टोकन और दुकान के ऑर्डर'
              : 'Your auto rides, digital queue tokens, and shop orders'}
          </p>
        </div>
        <span className="text-sm font-bold text-stone-500 tabular-nums">
          {bookings.length} {lang === 'hi' ? 'बुकिंग' : 'total'}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 text-center space-y-4">
          <Ticket className="w-12 h-12 text-emerald-700/40 mx-auto" />
          <h3 className="text-lg font-bold text-stone-900">
            {lang === 'hi' ? 'अभी कोई बुकिंग नहीं है' : 'No bookings yet'}
          </h3>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            {lang === 'hi'
              ? 'होम स्क्रीन पर जाकर ऑटो बुक करें, CSC/डॉक्टर का टोकन लें, या सब्जी-किराना ऑर्डर करें।'
              : 'Book an auto rickshaw, generate an instant CSC/Clinic/Salon token, or order groceries from Home.'}
          </p>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[48px] px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm"
          >
            {lang === 'hi' ? 'होम पर जाएँ' : 'Explore Marketplace'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => {
            const linkedListing = listings.find((l) => l.id === b.listingId);
            const liveCurrentToken = linkedListing?.currentToken;
            const title = lang === 'hi' ? b.listingNameHi : b.listingNameEn || b.listingNameHi;
            const summary = lang === 'hi' ? b.summaryHi : b.summaryEn || b.summaryHi;
            const voiceText =
              lang === 'hi'
                ? `${b.listingNameHi}। ${b.summaryHi}। ${
                    b.tokenNumber ? `आपका डिजिटल टोकन नंबर ${b.tokenNumber} है।` : ''
                  } कुल राशि ${b.totalAmount} रुपये। स्थिति: ${statusLabel(b.status)}।`
                : `${title}. ${summary}. ${
                    b.tokenNumber ? `Your digital token is ${b.tokenNumber}.` : ''
                  } Total ${b.totalAmount} rupees. Status: ${statusLabel(b.status)}.`;

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          b.bookingType === 'auto'
                            ? 'bg-amber-100 text-amber-800'
                            : b.bookingType === 'queue'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {b.bookingType === 'auto' ? (
                          <CarFront className="w-5 h-5" />
                        ) : b.bookingType === 'queue' ? (
                          <Ticket className="w-5 h-5" />
                        ) : (
                          <ShoppingBag className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
                          <span
                            className={
                              b.status === 'cancelled'
                                ? 'text-red-700'
                                : b.status === 'completed'
                                ? 'text-emerald-700'
                                : 'text-orange-700'
                            }
                          >
                            {statusLabel(b.status)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">₹{b.totalAmount}</span>
                          <span aria-hidden="true">·</span>
                          <span>{b.paymentMethod === 'upi' ? 'UPI' : lang === 'hi' ? 'नकद' : 'Cash'}</span>
                        </div>
                        <h3 className="font-extrabold text-stone-900 text-base truncate">{title}</h3>
                      </div>
                    </div>

                    <SpeakButton
                      id={`booking-speak-${b.id}`}
                      text={voiceText}
                      speakingId={speakingId}
                      onSpeak={onSpeak}
                      lang={lang}
                      size="sm"
                    />
                  </div>

                  {/* Digital Token Highlight */}
                  {b.tokenNumber && (
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-emerald-900">
                          {lang === 'hi' ? 'डिजिटल टोकन नंबर' : 'Digital Token'}
                        </div>
                        <div className="text-3xl font-extrabold text-emerald-900 tabular-nums">
                          {b.tokenNumber}
                        </div>
                        {b.slotTime && (
                          <div className="text-xs text-emerald-800 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{b.slotTime}</span>
                          </div>
                        )}
                      </div>
                      {liveCurrentToken !== undefined && (
                        <div className="text-right bg-white rounded-xl px-3 py-2 border border-emerald-200">
                          <div className="text-[11px] text-stone-500">
                            {lang === 'hi' ? 'अभी चल रहा' : 'Now Serving'}
                          </div>
                          <div className="text-xl font-extrabold text-orange-600 tabular-nums">
                            #{liveCurrentToken}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-stone-700">{summary}</p>

                  {b.pickup && b.drop && (
                    <div className="text-xs text-stone-600 bg-stone-50 rounded-xl p-3 border border-stone-100 space-y-1">
                      <div>
                        <strong>{lang === 'hi' ? 'पिकअप:' : 'Pickup:'}</strong> {b.pickup}
                      </div>
                      <div>
                        <strong>{lang === 'hi' ? 'ड्रॉप:' : 'Drop:'}</strong> {b.drop}
                      </div>
                    </div>
                  )}

                  {b.requiredDocs && b.requiredDocs.length > 0 && (
                    <div className="bg-sky-50 rounded-xl p-3 border border-sky-200/80 space-y-1.5">
                      <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4" />
                        <span>{lang === 'hi' ? 'साथ ले जाने वाले कागज़ात:' : 'Bring Documents:'}</span>
                      </div>
                      <ul className="text-xs text-sky-900 space-y-0.5 pl-1">
                        {b.requiredDocs.map((d) => (
                          <li key={d.id}>• {lang === 'hi' ? d.nameHi : d.nameEn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                  {b.vendorPhone && (
                    <a
                      href={`tel:${b.vendorPhone}`}
                      className="flex-1 min-h-[44px] px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'कॉल करें' : 'Call'}</span>
                    </a>
                  )}

                  {(b.vendorUpiId || b.vendorQrImageUrl) && b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenUpiDirect({
                          payeeName: title,
                          upiId: b.vendorUpiId,
                          qrImageUrl: b.vendorQrImageUrl,
                          amount: b.totalAmount,
                        })
                      }
                      className="flex-1 min-h-[44px] px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'UPI पेमेंट' : 'Pay UPI'}</span>
                    </button>
                  )}

                  {b.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => onCancelBooking(b.id)}
                      className="min-h-[44px] px-3 rounded-xl bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 font-bold text-xs flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</span>
                    </button>
                  )}

                  {b.status === 'completed' && (
                    <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {lang === 'hi' ? 'पूर्ण' : 'Done'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
