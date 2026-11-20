import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Apple,
  CarFront,
  Download,
  Home,
  Landmark,
  Languages,
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
  User as UserIcon,
  WifiOff,
  X,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ActiveTab,
  AdminUpiConfig,
  AppToast,
  BookingRecord,
  CartItem,
  CategoryId,
  Lang,
  MarketplaceListing,
  ProductOrServiceItem,
  SubscriptionPayment,
  VendorSession,
} from './types';
import { CATEGORIES, UI_TEXT } from './i18n/translations';
import {
  DEFAULT_ADMIN_UPI,
  GENERATED_IMAGES,
  INITIAL_BOOKINGS,
  INITIAL_LISTINGS,
  INITIAL_SUBSCRIPTIONS,
} from './data/seedData';
import {
  ADMIN_EMAIL,
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
  testConnection,
} from './firebase';
import { useVoiceInput, useVoiceSpeak } from './hooks/useSpeech';
import { useOnlineStatus, usePushNotifications, usePWAInstall } from './hooks/usePWA';
import { SpeakButton } from './components/SpeakButton';
import { UpiPaymentModal } from './components/UpiPaymentModal';
import { VoiceSearchSheet } from './components/VoiceSearchSheet';
import { AutoBookingView } from './components/AutoBookingView';
import { ListingDetailSheet } from './components/ListingDetailSheet';
import { CartCheckoutSheet } from './components/CartCheckoutSheet';
import { BookingsTab } from './components/BookingsTab';
import { VendorAdminPanel } from './components/VendorAdminPanel';

const STORAGE_KEYS = {
  listings: 'apnabazaar_listings_v1',
  bookings: 'apnabazaar_bookings_v1',
  subscriptions: 'apnabazaar_subs_v1',
  adminUpi: 'apnabazaar_admin_upi_v1',
  cart: 'apnabazaar_cart_v1',
  vendorSession: 'apnabazaar_vendor_session_v1',
  lang: 'apnabazaar_lang_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const renderCategoryIcon = (id: CategoryId) => {
  switch (id) {
    case 'auto':
      return <CarFront className="w-6 h-6" />;
    case 'sabji':
      return <Apple className="w-6 h-6" />;
    case 'kirana':
      return <ShoppingBasket className="w-6 h-6" />;
    case 'csc':
      return <Landmark className="w-6 h-6" />;
    case 'salon':
      return <Scissors className="w-6 h-6" />;
    case 'clinic':
      return <Stethoscope className="w-6 h-6" />;
    case 'showroom':
      return <Store className="w-6 h-6" />;
  }
};

export default function App() {
  const [lang, setLang] = useState<Lang>(() => readStorage<Lang>(STORAGE_KEYS.lang, 'hi'));
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [showAutoScreen, setShowAutoScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [listings, setListings] = useState<MarketplaceListing[]>(() =>
    readStorage<MarketplaceListing[]>(STORAGE_KEYS.listings, INITIAL_LISTINGS)
  );
  const [bookings, setBookings] = useState<BookingRecord[]>(() =>
    readStorage<BookingRecord[]>(STORAGE_KEYS.bookings, INITIAL_BOOKINGS)
  );
  const [subscriptions, setSubscriptions] = useState<SubscriptionPayment[]>(() =>
    readStorage<SubscriptionPayment[]>(STORAGE_KEYS.subscriptions, INITIAL_SUBSCRIPTIONS)
  );
  const [adminUpiConfig, setAdminUpiConfig] = useState<AdminUpiConfig>(() =>
    readStorage<AdminUpiConfig>(STORAGE_KEYS.adminUpi, DEFAULT_ADMIN_UPI)
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );
  const [vendorSession, setVendorSession] = useState<VendorSession | null>(() =>
    readStorage<VendorSession | null>(STORAGE_KEYS.vendorSession, null)
  );

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [upiModal, setUpiModal] = useState<{
    isOpen: boolean;
    payeeName: string;
    upiId?: string;
    qrImageUrl?: string;
    amount?: number;
  }>({ isOpen: false, payeeName: '' });
  const [toast, setToast] = useState<AppToast | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const t = UI_TEXT[lang];
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { permission: notifPermission, requestPermission, notify } = usePushNotifications();
  const { speak, speakingId } = useVoiceSpeak(lang);

  const isFirebaseAdmin = Boolean(
    firebaseUser?.email === ADMIN_EMAIL && firebaseUser?.emailVerified
  );

  const pushAlert = useCallback(
    (title: string, body: string, tone: AppToast['tone'] = 'success') => {
      const id = `toast-${Date.now()}`;
      setToast({ id, title, body, tone });
      notify(title, body);
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 4500);
    },
    [notify]
  );

  // Persist offline cache to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.lang, JSON.stringify(lang));
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings));
    } catch {
      // ignore
    }
  }, [listings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    } catch {
      // ignore
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.subscriptions, JSON.stringify(subscriptions));
    } catch {
      // ignore
    }
  }, [subscriptions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.adminUpi, JSON.stringify(adminUpiConfig));
    } catch {
      // ignore
    }
  }, [adminUpiConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.vendorSession, JSON.stringify(vendorSession));
    } catch {
      // ignore
    }
  }, [vendorSession]);

  // Firebase Auth & Firestore connection check + live listeners
  useEffect(() => {
    testConnection();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    // Listen to published listings in Firestore and merge with local seed listings
    const qListings = query(
      collection(db, 'listings'),
      where('isPublished', '==', true)
    );
    const unsubListings = onSnapshot(
      qListings,
      (snap) => {
        if (snap.empty) return;
        const remoteMap = new Map<string, MarketplaceListing>();
        snap.docs.forEach((d) => {
          const data = d.data();
          remoteMap.set(d.id, {
            id: d.id,
            ownerUid: String(data.ownerUid || ''),
            category: data.category as CategoryId,
            nameHi: String(data.nameHi || ''),
            nameEn: String(data.nameEn || data.nameHi || ''),
            ownerName: String(data.ownerName || ''),
            areaHi: String(data.areaHi || ''),
            areaEn: String(data.areaEn || data.areaHi || ''),
            businessPhone: String(data.businessPhone || ''),
            upiId: data.upiId ? String(data.upiId) : undefined,
            qrImageUrl: data.qrImageUrl ? String(data.qrImageUrl) : undefined,
            isAvailable: Boolean(data.isAvailable),
            isPublished: Boolean(data.isPublished),
            vehicleType: data.vehicleType ? String(data.vehicleType) : undefined,
            baseFare: typeof data.baseFare === 'number' ? data.baseFare : undefined,
            currentToken: typeof data.currentToken === 'number' ? data.currentToken : undefined,
            waitingCount: typeof data.waitingCount === 'number' ? data.waitingCount : undefined,
            subscriptionTier: data.subscriptionTier || 'basic_99',
            subscriptionStatus: data.subscriptionStatus || 'pending',
            items: Array.isArray(data.items) ? (data.items as ProductOrServiceItem[]) : [],
            fromFirestore: true,
          });
        });

        setListings((prev) => {
          const merged = new Map<string, MarketplaceListing>();
          prev.forEach((l) => merged.set(l.id, l));
          remoteMap.forEach((remote, id) => {
            const existing = merged.get(id);
            merged.set(id, { ...existing, ...remote, imageUrl: existing?.imageUrl });
          });
          return Array.from(merged.values());
        });
      },
      (err) => {
        console.warn('Firestore listings listener warning:', err.message);
      }
    );

    // Listen to Super Admin UPI Config
    const unsubAdminUpi = onSnapshot(
      doc(db, 'platformConfig', 'admin_upi'),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        setAdminUpiConfig({
          adminName: String(d.adminName || DEFAULT_ADMIN_UPI.adminName),
          upiId: String(d.upiId || DEFAULT_ADMIN_UPI.upiId),
          qrImageUrl: d.qrImageUrl ? String(d.qrImageUrl) : '',
          updatedAtIso: new Date().toISOString(),
        });
      },
      (err) => {
        console.warn('Firestore platformConfig listener warning:', err.message);
      }
    );

    return () => {
      unsubAuth();
      unsubListings();
      unsubAdminUpi();
    };
  }, []);

  // Intelligent Hindi/English Voice Command Router
  const handleVoiceCommand = useCallback(
    (rawSpoken: string) => {
      const text = rawSpoken.trim();
      const lower = text.toLowerCase();
      setSearchQuery(text);
      setActiveTab('home');

      if (
        lower.includes('ऑटो') ||
        lower.includes('रिक्शा') ||
        lower.includes('auto') ||
        lower.includes('rickshaw')
      ) {
        setShowAutoScreen(true);
        setSelectedCategory('auto');
        speak(
          lang === 'hi'
            ? 'ऑटो रिक्शा बुकिंग खुल गई है। पास के उपलब्ध ऑटो दिख रहे हैं।'
            : 'Opening Auto Rickshaw booking with nearby available drivers.',
          'voice-route-auto'
        );
        return;
      }

      setShowAutoScreen(false);
      if (
        lower.includes('टमाटर') ||
        lower.includes('सब्जी') ||
        lower.includes('आलू') ||
        lower.includes('प्याज') ||
        lower.includes('फल') ||
        lower.includes('tomato') ||
        lower.includes('veg')
      ) {
        setSelectedCategory('sabji');
        setSearchQuery(lower.includes('टमाटर') || lower.includes('tomato') ? 'टमाटर' : '');
        speak(
          lang === 'hi'
            ? 'सब्जी और फल की दुकानें दिख रही हैं। आज देसी टमाटर 30 रुपये किलो है।'
            : 'Showing vegetables and fruits. Fresh desi tomato is 30 rupees per kg.',
          'voice-route-sabji'
        );
      } else if (
        lower.includes('csc') ||
        lower.includes('सीएससी') ||
        lower.includes('जन सेवा') ||
        lower.includes('आधार') ||
        lower.includes('पैन')
      ) {
        setSelectedCategory('csc');
        setSearchQuery('');
        speak(
          lang === 'hi'
            ? 'जन सेवा केंद्र यानी CSC सेंटर दिख रहे हैं। आप तुरंत टोकन ले सकते हैं।'
            : 'Showing CSC Centers. You can book an instant digital token.',
          'voice-route-csc'
        );
      } else if (lower.includes('सैलून') || lower.includes('बाल') || lower.includes('salon')) {
        setSelectedCategory('salon');
        setSearchQuery('');
        speak(
          lang === 'hi'
            ? 'पास के सैलून दिख रहे हैं। बिना इंतज़ार किए टोकन बुक करें।'
            : 'Showing nearby salons for instant queue booking.',
          'voice-route-salon'
        );
      } else if (
        lower.includes('डॉक्टर') ||
        lower.includes('क्लिनिक') ||
        lower.includes('अस्पताल') ||
        lower.includes('doctor') ||
        lower.includes('clinic')
      ) {
        setSelectedCategory('clinic');
        setSearchQuery('');
        speak(
          lang === 'hi'
            ? 'डॉक्टर और क्लिनिक की सूची खुल गई है।'
            : 'Showing nearby clinics and doctors.',
          'voice-route-clinic'
        );
      } else if (
        lower.includes('किराना') ||
        lower.includes('आटा') ||
        lower.includes('तेल') ||
        lower.includes('राशन') ||
        lower.includes('kirana')
      ) {
        setSelectedCategory('kirana');
        setSearchQuery('');
      } else if (lower.includes('शोरूम') || lower.includes('कपड़े') || lower.includes('showroom')) {
        setSelectedCategory('showroom');
        setSearchQuery('');
      } else {
        setSelectedCategory('all');
      }
    },
    [lang, speak]
  );

  const heroVoice = useVoiceInput(lang, handleVoiceCommand);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((l) => {
      if (selectedCategory !== 'all' && l.category !== selectedCategory) return false;
      if (!q) return true;
      const hay = [
        l.nameHi,
        l.nameEn,
        l.ownerName,
        l.areaHi,
        l.areaEn,
        l.category,
        ...l.items.flatMap((i) => [i.nameHi, i.nameEn]),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [listings, selectedCategory, searchQuery]);

  const autoListings = useMemo(
    () => listings.filter((l) => l.category === 'auto'),
    [listings]
  );

  // Cart Handlers
  const handleAddToCart = (listing: MarketplaceListing, item: ProductOrServiceItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.listingId === listing.id && c.item.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          listingId: listing.id,
          listingNameHi: listing.nameHi,
          listingNameEn: listing.nameEn,
          vendorPhone: listing.businessPhone,
          vendorUpiId: listing.upiId,
          vendorQrImageUrl: listing.qrImageUrl,
          vendorUid: listing.ownerUid,
          item,
          quantity: 1,
        },
      ];
    });
    pushAlert(
      lang === 'hi' ? 'झोले में जुड़ गया' : 'Added to Basket',
      lang === 'hi'
        ? `${item.nameHi} (₹${item.price}) जोड़ा गया`
        : `${item.nameEn} (₹${item.price}) added`,
      'info'
    );
  };

  const handleUpdateCartQty = (listingId: string, itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.listingId === listingId && c.item.id === itemId
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  // Sync booking helper (local instant + Firestore when signed in & remote listing)
  const persistBooking = async (booking: BookingRecord, listing?: MarketplaceListing) => {
    setBookings((prev) => [booking, ...prev]);

    if (firebaseUser?.emailVerified && listing?.fromFirestore) {
      const path = `bookings/${booking.id}`;
      try {
        await setDoc(doc(db, 'bookings', booking.id), {
          customerUid: firebaseUser.uid,
          customerName: booking.customerName,
          customerMobile: booking.customerMobile,
          listingId: booking.listingId,
          vendorUid: booking.vendorUid,
          listingNameHi: booking.listingNameHi,
          bookingType: booking.bookingType,
          summaryHi: booking.summaryHi,
          ...(booking.tokenNumber ? { tokenNumber: booking.tokenNumber } : {}),
          ...(booking.slotTime ? { slotTime: booking.slotTime } : {}),
          ...(booking.pickup ? { pickup: booking.pickup } : {}),
          ...(booking.drop ? { drop: booking.drop } : {}),
          deliveryMode: booking.deliveryMode,
          paymentMethod: booking.paymentMethod,
          totalAmount: booking.totalAmount,
          status: 'confirmed',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.CREATE, path);
        } catch {
          // Local booking already saved for offline resilience
        }
      }
    }
  };

  // Book Auto Rickshaw
  const handleBookAuto = ({
    listing,
    pickup,
    drop,
    fare,
    paymentMethod,
  }: {
    listing: MarketplaceListing;
    pickup: string;
    drop: string;
    fare: number;
    paymentMethod: 'upi' | 'cash';
  }) => {
    const record: BookingRecord = {
      id: `bk-auto-${Date.now()}`,
      customerUid: firebaseUser?.uid || 'guest-customer',
      customerName: firebaseUser?.displayName || (lang === 'hi' ? 'ग्राहक' : 'Customer'),
      customerMobile: vendorSession?.mobile || '9999999999',
      listingId: listing.id,
      vendorUid: listing.ownerUid,
      listingNameHi: listing.nameHi,
      listingNameEn: listing.nameEn,
      bookingType: 'auto',
      summaryHi: `${listing.ownerName} (${listing.vehicleType || 'ऑटो'}) — ${pickup} से ${drop}`,
      summaryEn: `${listing.ownerName} — ${pickup} to ${drop}`,
      pickup,
      drop,
      deliveryMode: 'onsite',
      paymentMethod,
      totalAmount: fare,
      status: 'confirmed',
      vendorPhone: listing.businessPhone,
      vendorUpiId: listing.upiId,
      vendorQrImageUrl: listing.qrImageUrl,
      createdAtIso: new Date().toISOString(),
    };

    persistBooking(record, listing);
    setShowAutoScreen(false);
    setActiveTab('bookings');

    const title = lang === 'hi' ? 'ऑटो रिक्शा बुक हो गया!' : 'Auto Rickshaw Confirmed!';
    const body =
      lang === 'hi'
        ? `${listing.ownerName} जल्द ${pickup} पहुँचेंगे। किराया ₹${fare}`
        : `${listing.ownerName} is on the way to ${pickup}. Est. fare ₹${fare}`;
    pushAlert(title, body);
    speak(body, 'auto-booked-tts');

    if (paymentMethod === 'upi' && (listing.upiId || listing.qrImageUrl)) {
      setUpiModal({
        isOpen: true,
        payeeName: lang === 'hi' ? listing.nameHi : listing.nameEn,
        upiId: listing.upiId,
        qrImageUrl: listing.qrImageUrl,
        amount: fare,
      });
    }
  };

  // Book Instant Smart Queue Digital Token (CSC / Salon / Clinic)
  const handleBookQueueToken = ({
    listing,
    service,
    slotLabel,
    paymentMethod,
  }: {
    listing: MarketplaceListing;
    service: ProductOrServiceItem;
    slotLabel: string;
    paymentMethod: 'upi' | 'cash';
  }) => {
    const prefix =
      listing.category === 'csc' ? 'CSC' : listing.category === 'clinic' ? 'DOC' : 'SLN';
    const nextNum = (listing.currentToken || 1) + (listing.waitingCount || 0) + 1;
    const tokenStr = `#${prefix}-${String(nextNum).padStart(2, '0')}`;

    // Increment waiting count live
    setListings((prev) =>
      prev.map((l) =>
        l.id === listing.id ? { ...l, waitingCount: (l.waitingCount || 0) + 1 } : l
      )
    );

    const record: BookingRecord = {
      id: `bk-tok-${Date.now()}`,
      customerUid: firebaseUser?.uid || 'guest-customer',
      customerName: firebaseUser?.displayName || (lang === 'hi' ? 'ग्राहक' : 'Customer'),
      customerMobile: vendorSession?.mobile || '9999999999',
      listingId: listing.id,
      vendorUid: listing.ownerUid,
      listingNameHi: listing.nameHi,
      listingNameEn: listing.nameEn,
      bookingType: 'queue',
      summaryHi: `${service.nameHi} (${slotLabel})`,
      summaryEn: `${service.nameEn} (${slotLabel})`,
      tokenNumber: tokenStr,
      slotTime: slotLabel,
      deliveryMode: 'onsite',
      paymentMethod,
      totalAmount: service.price,
      status: 'confirmed',
      requiredDocs: service.requiredDocs,
      vendorPhone: listing.businessPhone,
      vendorUpiId: listing.upiId,
      vendorQrImageUrl: listing.qrImageUrl,
      createdAtIso: new Date().toISOString(),
    };

    persistBooking(record, listing);
    setSelectedListing(null);
    setActiveTab('bookings');

    const title = lang === 'hi' ? `टोकन ${tokenStr} पक्का हुआ!` : `Token ${tokenStr} Confirmed!`;
    const body =
      lang === 'hi'
        ? `${listing.nameHi} में ${service.nameHi} के लिए आपका टोकन ${tokenStr} तैयार है। समय: ${slotLabel}।`
        : `Your digital token ${tokenStr} at ${listing.nameEn} for ${service.nameEn} is confirmed for ${slotLabel}.`;
    pushAlert(title, body);
    speak(body, 'token-booked-tts');

    if (paymentMethod === 'upi' && (listing.upiId || listing.qrImageUrl)) {
      setUpiModal({
        isOpen: true,
        payeeName: lang === 'hi' ? listing.nameHi : listing.nameEn,
        upiId: listing.upiId,
        qrImageUrl: listing.qrImageUrl,
        amount: service.price,
      });
    }
  };

  // Place Shop Product Order
  const handlePlaceOrder = ({
    deliveryMode,
    address,
    paymentMethod,
  }: {
    deliveryMode: 'delivery' | 'pickup';
    address: string;
    paymentMethod: 'upi' | 'cash';
  }) => {
    if (cart.length === 0) return;
    const first = cart[0];
    const total = cart.reduce((sum, e) => sum + e.item.price * e.quantity, 0);
    const itemsTextHi = cart.map((e) => `${e.item.nameHi} × ${e.quantity}`).join(', ');
    const itemsTextEn = cart.map((e) => `${e.item.nameEn} × ${e.quantity}`).join(', ');
    const linkedListing = listings.find((l) => l.id === first.listingId);

    const record: BookingRecord = {
      id: `bk-ord-${Date.now()}`,
      customerUid: firebaseUser?.uid || 'guest-customer',
      customerName: firebaseUser?.displayName || (lang === 'hi' ? 'ग्राहक' : 'Customer'),
      customerMobile: vendorSession?.mobile || '9999999999',
      listingId: first.listingId,
      vendorUid: first.vendorUid,
      listingNameHi: first.listingNameHi,
      listingNameEn: first.listingNameEn,
      bookingType: 'order',
      summaryHi: `${itemsTextHi} (${
        deliveryMode === 'delivery' ? `घर डिलीवरी: ${address}` : 'दुकान से खुद लें'
      })`,
      summaryEn: `${itemsTextEn} (${
        deliveryMode === 'delivery' ? `Delivery: ${address}` : 'Store Pickup'
      })`,
      deliveryMode,
      paymentMethod,
      totalAmount: total,
      status: 'confirmed',
      vendorPhone: first.vendorPhone,
      vendorUpiId: first.vendorUpiId,
      vendorQrImageUrl: first.vendorQrImageUrl,
      createdAtIso: new Date().toISOString(),
    };

    persistBooking(record, linkedListing);
    setCart([]);
    setIsCartOpen(false);
    setActiveTab('bookings');

    const title = lang === 'hi' ? 'ऑर्डर पक्का हो गया!' : 'Order Confirmed!';
    const body =
      lang === 'hi'
        ? `${first.listingNameHi} को ₹${total} का ऑर्डर भेज दिया गया है।`
        : `Order of ₹${total} placed with ${first.listingNameEn}.`;
    pushAlert(title, body);
    speak(body, 'order-placed-tts');

    if (paymentMethod === 'upi' && (first.vendorUpiId || first.vendorQrImageUrl)) {
      setUpiModal({
        isOpen: true,
        payeeName: lang === 'hi' ? first.listingNameHi : first.listingNameEn,
        upiId: first.vendorUpiId,
        qrImageUrl: first.vendorQrImageUrl,
        amount: total,
      });
    }
  };

  // Vendor & Admin Actions
  const handleSaveListing = async (updated: MarketplaceListing) => {
    setListings((prev) => {
      const exists = prev.some((l) => l.id === updated.id);
      return exists ? prev.map((l) => (l.id === updated.id ? updated : l)) : [updated, ...prev];
    });
    pushAlert(
      lang === 'hi' ? 'जानकारी सेव हो गई' : 'Listing Saved',
      lang === 'hi' ? `${updated.nameHi} अपडेट हो गया है।` : `${updated.nameEn} has been updated.`
    );

    if (firebaseUser?.emailVerified) {
      const path = `listings/${updated.id}`;
      try {
        await setDoc(
          doc(db, 'listings', updated.id),
          {
            ownerUid: firebaseUser.uid,
            category: updated.category,
            nameHi: updated.nameHi.slice(0, 120),
            nameEn: updated.nameEn.slice(0, 120),
            ownerName: updated.ownerName.slice(0, 80),
            areaHi: updated.areaHi.slice(0, 120),
            areaEn: updated.areaEn.slice(0, 120),
            businessPhone: updated.businessPhone.slice(0, 15),
            upiId: (updated.upiId || '').slice(0, 100),
            qrImageUrl: (updated.qrImageUrl || '').slice(0, 450000),
            isAvailable: updated.isAvailable,
            isPublished: updated.isPublished,
            ...(updated.vehicleType ? { vehicleType: updated.vehicleType.slice(0, 40) } : {}),
            ...(typeof updated.baseFare === 'number' ? { baseFare: updated.baseFare } : {}),
            ...(typeof updated.currentToken === 'number'
              ? { currentToken: updated.currentToken }
              : {}),
            ...(typeof updated.waitingCount === 'number'
              ? { waitingCount: updated.waitingCount }
              : {}),
            subscriptionTier: updated.subscriptionTier,
            subscriptionStatus: isFirebaseAdmin ? updated.subscriptionStatus : 'pending',
            items: updated.items.slice(0, 40),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: false }
        );
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch {
          // Local copy already persisted
        }
      }
    }
  };

  const handleToggleAvailability = (listingId: string) => {
    const target = listings.find((l) => l.id === listingId);
    if (!target) return;
    const nextState = !target.isAvailable;
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, isAvailable: nextState } : l))
    );
    pushAlert(
      nextState
        ? lang === 'hi'
          ? 'स्थिति: उपलब्ध (चालू)'
          : 'Status: Available'
        : lang === 'hi'
        ? 'स्थिति: व्यस्त (बंद)'
        : 'Status: Busy',
      lang === 'hi' ? target.nameHi : target.nameEn
    );
    if (firebaseUser?.emailVerified && target.fromFirestore) {
      updateDoc(doc(db, 'listings', listingId), {
        isAvailable: nextState,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  };

  const handleAdvanceQueueToken = (listingId: string) => {
    const target = listings.find((l) => l.id === listingId);
    if (!target) return;
    const nextToken = (target.currentToken || 1) + 1;
    const nextWait = Math.max(0, (target.waitingCount || 0) - 1);
    setListings((prev) =>
      prev.map((l) =>
        l.id === listingId ? { ...l, currentToken: nextToken, waitingCount: nextWait } : l
      )
    );
    const msg =
      lang === 'hi'
        ? `${target.nameHi} में अब टोकन नंबर ${nextToken} बुलाया जा रहा है।`
        : `Now serving Token #${nextToken} at ${target.nameEn}.`;
    pushAlert(lang === 'hi' ? `टोकन #${nextToken} बुलाया गया` : `Serving #${nextToken}`, msg);
    speak(msg, `advance-tok-${nextToken}`);
  };

  const handleUpdateAdminUpi = async (config: AdminUpiConfig) => {
    setAdminUpiConfig(config);
    pushAlert(
      lang === 'hi' ? 'एडमिन UPI QR सेव हुआ' : 'Admin UPI QR Updated',
      `${config.adminName} (${config.upiId})`
    );
    if (isFirebaseAdmin) {
      const path = 'platformConfig/admin_upi';
      try {
        await setDoc(doc(db, 'platformConfig', 'admin_upi'), {
          adminName: config.adminName.slice(0, 100),
          upiId: config.upiId.slice(0, 100),
          qrImageUrl: (config.qrImageUrl || '').slice(0, 450000),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch {
          // Local copy already persisted
        }
      }
    }
  };

  const handleSubmitSubscription = (
    payload: Omit<SubscriptionPayment, 'id' | 'status' | 'createdAtIso'>
  ) => {
    const entry: SubscriptionPayment = {
      ...payload,
      id: `sub-${Date.now()}`,
      status: 'pending',
      createdAtIso: new Date().toISOString(),
    };
    setSubscriptions((prev) => [entry, ...prev]);
    pushAlert(
      lang === 'hi' ? 'सब्सक्रिप्शन प्रूफ भेजा गया' : 'Payment Proof Submitted',
      lang === 'hi'
        ? `₹${entry.amount} (UTR: ${entry.utrNumber}) एडमिन जांच के लिए भेजा गया।`
        : `₹${entry.amount} (UTR: ${entry.utrNumber}) sent to Super Admin for approval.`
    );
  };

  const handleReviewSubscription = (subId: string, decision: 'approved' | 'rejected') => {
    const targetSub = subscriptions.find((s) => s.id === subId);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: decision } : s))
    );
    if (targetSub && decision === 'approved') {
      setListings((prev) =>
        prev.map((l) =>
          l.id === targetSub.listingId ||
          l.businessPhone.replace(/\D/g, '') === targetSub.vendorMobile.replace(/\D/g, '')
            ? { ...l, subscriptionStatus: 'active', subscriptionTier: targetSub.planId }
            : l
        )
      );
    }
    pushAlert(
      decision === 'approved'
        ? lang === 'hi'
          ? 'सब्सक्रिप्शन तुरंत स्वीकृत हुआ ✓'
          : 'Subscription Approved ✓'
        : lang === 'hi'
        ? 'सब्सक्रिप्शन अस्वीकार किया गया'
        : 'Subscription Rejected',
      targetSub ? `${targetSub.vendorName} (₹${targetSub.amount})` : ''
    );
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
    pushAlert(
      lang === 'hi' ? 'बुकिंग रद्द की गई' : 'Booking Cancelled',
      lang === 'hi' ? 'आपकी बुकिंग रद्द कर दी गई है।' : 'Your booking has been cancelled.',
      'warning'
    );
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBF8] text-stone-900 pb-20 md:pb-8">
      {/* Compact 3-Zone Top App Bar (56px height) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-stone-200/90">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              setShowAutoScreen(false);
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-xl font-extrabold tracking-tight text-emerald-800 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <img
              src="/icon.svg"
              alt="ApnaBazaar"
              className="w-7 h-7 rounded-lg shrink-0"
            />
            <span>{t.brand}</span>
          </button>

          {/* Zone 2: Desktop Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-bold text-stone-600">
            {(
              [
                { id: 'home', label: t.navHome },
                { id: 'voice', label: t.navVoice },
                { id: 'bookings', label: `${t.navBookings}${bookings.length ? ` (${bookings.length})` : ''}` },
                { id: 'profile', label: t.navProfile },
              ] as const
            ).map((navItem) => (
              <button
                key={navItem.id}
                type="button"
                onClick={() => {
                  setActiveTab(navItem.id);
                  setShowAutoScreen(false);
                }}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeTab === navItem.id
                    ? 'text-emerald-800 border-emerald-700'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                {navItem.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Language Toggle + Cart + Install */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'hi' ? 'en' : 'hi'))}
              className="min-h-[40px] px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
              aria-label="Toggle Hindi or English"
            >
              <Languages className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              aria-label={t.cartTitle}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {cartItemCount > 0 && (
                <span className="tabular-nums font-extrabold">{cartItemCount}</span>
              )}
            </button>

            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={install}
                className="hidden sm:inline-flex min-h-[40px] px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{t.installApp}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Offline Status Strip (only visible when offline) */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.offlineBanner}</span>
        </div>
      )}

      {/* Native In-App Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-5 sm:w-96 z-50">
          <div className="bg-stone-900 text-white rounded-2xl shadow-xl border border-stone-700 p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-emerald-300">{toast.title}</div>
              <div className="text-xs text-stone-200 mt-0.5">{toast.body}</div>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-stone-400 hover:text-white p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1">
        {activeTab === 'voice' && (
          <VoiceSearchSheet
            lang={lang}
            onVoiceCommand={handleVoiceCommand}
            speakingId={speakingId}
            onSpeak={speak}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsTab
            lang={lang}
            bookings={bookings}
            listings={listings}
            onCancelBooking={handleCancelBooking}
            onOpenUpiDirect={(p) =>
              setUpiModal({
                isOpen: true,
                payeeName: p.payeeName,
                upiId: p.upiId,
                qrImageUrl: p.qrImageUrl,
                amount: p.amount,
              })
            }
            speakingId={speakingId}
            onSpeak={speak}
            onGoHome={() => {
              setActiveTab('home');
              setShowAutoScreen(false);
            }}
          />
        )}

        {activeTab === 'profile' && (
          <VendorAdminPanel
            lang={lang}
            firebaseUser={firebaseUser}
            isFirebaseAdmin={isFirebaseAdmin}
            onGoogleSignIn={() => {
              signInWithGoogle()
                .then(() =>
                  pushAlert(
                    lang === 'hi' ? 'Google से जुड़ गया' : 'Signed in with Google',
                    lang === 'hi'
                      ? 'अब आपका डेटा क्लाउड में सेव होगा।'
                      : 'Your listings and approvals now sync with Firestore.'
                  )
                )
                .catch(() => {});
            }}
            onGoogleSignOut={() => {
              signOutUser().catch(() => {});
            }}
            vendorSession={vendorSession}
            onVendorLogin={setVendorSession}
            onVendorLogout={() => setVendorSession(null)}
            listings={listings}
            onSaveListing={handleSaveListing}
            onToggleAvailability={handleToggleAvailability}
            onAdvanceQueueToken={handleAdvanceQueueToken}
            adminUpiConfig={adminUpiConfig}
            onUpdateAdminUpi={handleUpdateAdminUpi}
            subscriptions={subscriptions}
            onSubmitSubscription={handleSubmitSubscription}
            onReviewSubscription={handleReviewSubscription}
            onOpenUpiDirect={(p) =>
              setUpiModal({
                isOpen: true,
                payeeName: p.payeeName,
                upiId: p.upiId,
                qrImageUrl: p.qrImageUrl,
                amount: p.amount,
              })
            }
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            isIOS={isIOS}
            onInstallApp={install}
            notificationPermission={notifPermission}
            onEnableNotifications={async () => {
              const res = await requestPermission();
              if (res === 'granted') {
                pushAlert(
                  lang === 'hi' ? 'अलर्ट चालू हो गए!' : 'Notifications Enabled!',
                  lang === 'hi'
                    ? 'बुकिंग और टोकन अपडेट अब सीधे मोबाइल पर मिलेंगे।'
                    : 'You will receive live booking and token alerts.'
                );
              }
            }}
            speakingId={speakingId}
            onSpeak={speak}
          />
        )}

        {activeTab === 'home' && showAutoScreen && (
          <AutoBookingView
            lang={lang}
            autos={autoListings}
            onBack={() => {
              setShowAutoScreen(false);
              setSelectedCategory('all');
            }}
            onBookAuto={handleBookAuto}
            onOpenUpi={(listing, amount) =>
              setUpiModal({
                isOpen: true,
                payeeName: lang === 'hi' ? listing.nameHi : listing.nameEn,
                upiId: listing.upiId,
                qrImageUrl: listing.qrImageUrl,
                amount,
              })
            }
            speakingId={speakingId}
            onSpeak={speak}
          />
        )}

        {activeTab === 'home' && !showAutoScreen && (
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-7">
            {/* HERO BANNER WITH BIG VOICE MIC + TYPING SEARCH */}
            <section className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-emerald-950">
              {!failedImages.hero ? (
                <img
                  src={GENERATED_IMAGES.hero}
                  alt={lang === 'hi' ? 'अपना बाज़ार स्थानीय बाज़ार' : 'ApnaBazaar Local Marketplace'}
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImages((f) => ({ ...f, hero: true }))}
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-orange-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/25" />

              <div className="relative z-10 p-5 sm:p-8 lg:p-10 max-w-3xl space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                      {lang === 'hi'
                        ? 'अपना बाज़ार — बोलकर खोजें, तुरंत बुक करें'
                        : 'ApnaBazaar — Speak or Tap Your Local Market'}
                    </h1>
                    <p className="text-sm sm:text-base text-stone-100/95 mt-1.5 max-w-xl">
                      {t.brandSub}
                    </p>
                  </div>

                  <SpeakButton
                    id="hero-welcome-speak"
                    text={
                      lang === 'hi'
                        ? 'अपना बाज़ार में आपका स्वागत है। आप माइक दबाकर हिंदी में बोल सकते हैं, जैसे ऑटो रिक्शा बुक करो, टमाटर का भाव, CSC सेंटर या सैलून बुकिंग।'
                        : 'Welcome to ApnaBazaar. Tap the orange microphone to speak or browse local shops, auto rickshaws, and CSC tokens.'
                    }
                    speakingId={speakingId}
                    onSpeak={speak}
                    lang={lang}
                    size="sm"
                    className="bg-white/95 border-transparent"
                  />
                </div>

                {/* Combined Typing Search + Prominent Big Orange Mic Button */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="flex-1 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-1.5 shadow-lg">
                    <Search className="w-5 h-5 text-stone-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full min-h-[48px] bg-transparent text-stone-900 text-sm sm:text-base font-medium outline-none placeholder:text-stone-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-2 text-stone-500 hover:text-stone-900"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={
                      heroVoice.isListening ? heroVoice.stopListening : heroVoice.startListening
                    }
                    className={`min-h-[56px] px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                      heroVoice.isListening
                        ? 'bg-red-600 text-white ring-4 ring-red-300'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {heroVoice.isListening ? (
                      <MicOff className="w-6 h-6 shrink-0" />
                    ) : (
                      <Mic className="w-6 h-6 shrink-0" />
                    )}
                    <span>
                      {heroVoice.isListening
                        ? lang === 'hi'
                          ? 'सुन रहे हैं...'
                          : 'Listening...'
                        : t.speakToSearch}
                    </span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-stone-200 font-medium">
                  {heroVoice.transcript
                    ? `“${heroVoice.transcript}”`
                    : heroVoice.errorMsg || t.tapMicHint}
                </p>
              </div>
            </section>

            {/* 7 BIG COLORFUL VISUAL ICON CATEGORIES IN HINDI */}
            <section className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                  {t.allCategories}
                </h2>
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="min-h-[40px] px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs whitespace-nowrap"
                  >
                    {t.resetFilter}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (cat.id === 'auto') {
                          setShowAutoScreen(true);
                          setSelectedCategory('auto');
                        } else {
                          setShowAutoScreen(false);
                          setSelectedCategory(isActive ? 'all' : cat.id);
                        }
                      }}
                      className={`rounded-2xl border p-4 text-left flex flex-col justify-between gap-3 transition-all active:scale-[0.98] min-h-[124px] ${
                        isActive
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                          : `${cat.bgClass}`
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                          isActive ? 'bg-white/20 text-white' : cat.iconBgClass
                        }`}
                      >
                        {renderCategoryIcon(cat.id)}
                      </div>
                      <div>
                        <div
                          className={`font-extrabold text-sm sm:text-base leading-snug ${
                            isActive ? 'text-white' : cat.accentText
                          }`}
                        >
                          {lang === 'hi' ? cat.nameHi : cat.nameEn}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 line-clamp-1 ${
                            isActive ? 'text-emerald-100' : 'text-stone-600'
                          }`}
                        >
                          {lang === 'hi' ? cat.subHi : cat.subEn}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* NEARBY LOCAL SHOPS, AUTOS & SERVICES DIRECTORY */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                  {selectedCategory === 'all'
                    ? t.popularNearby
                    : lang === 'hi'
                    ? CATEGORIES.find((c) => c.id === selectedCategory)?.nameHi
                    : CATEGORIES.find((c) => c.id === selectedCategory)?.nameEn}
                </h2>
                <span className="text-xs sm:text-sm font-semibold text-stone-500 tabular-nums">
                  {filteredListings.length} {lang === 'hi' ? 'उपलब्ध' : 'listed'}
                </span>
              </div>

              {filteredListings.length === 0 ? (
                <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
                  <p className="font-bold text-stone-800">{t.noResults}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="min-h-[44px] px-5 rounded-xl bg-emerald-700 text-white font-bold text-sm"
                  >
                    {t.resetFilter}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredListings.map((listing) => {
                    const catMeta = CATEGORIES.find((c) => c.id === listing.category);
                    const isAuto = listing.category === 'auto';
                    const isQueue =
                      listing.category === 'csc' ||
                      listing.category === 'clinic' ||
                      listing.category === 'salon';
                    const name = lang === 'hi' ? listing.nameHi : listing.nameEn;
                    const area = lang === 'hi' ? listing.areaHi : listing.areaEn;
                    const topItems = listing.items.slice(0, 3);

                    const cardSpeech =
                      lang === 'hi'
                        ? `${listing.nameHi}, ${catMeta?.nameHi || ''}, पता ${listing.areaHi}। ${
                            isAuto
                              ? `किराया ${listing.baseFare || 30} रुपये से शुरू। अभी ${
                                  listing.isAvailable ? 'उपलब्ध है' : 'व्यस्त है'
                                }।`
                              : topItems
                                  .map((i) => `${i.nameHi} ${i.price} रुपये प्रति ${i.unitHi}`)
                                  .join(', ')
                          }`
                        : `${listing.nameEn}, at ${listing.areaEn}. ${
                            isAuto
                              ? `Starts at ${listing.baseFare || 30} rupees. Currently ${
                                  listing.isAvailable ? 'Available' : 'Busy'
                                }.`
                              : topItems
                                  .map((i) => `${i.nameEn} ${i.price} rupees per ${i.unitEn}`)
                                  .join(', ')
                          }`;

                    const fallbackImg =
                      listing.category === 'auto'
                        ? GENERATED_IMAGES.auto
                        : listing.category === 'sabji'
                        ? GENERATED_IMAGES.sabji
                        : listing.category === 'kirana' || listing.category === 'showroom'
                        ? GENERATED_IMAGES.kirana
                        : GENERATED_IMAGES.csc;
                    const imgSrc = listing.imageUrl || fallbackImg;

                    return (
                      <article
                        key={listing.id}
                        className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          {/* Clean Media Frame with Fallback */}
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
                                {renderCategoryIcon(listing.category)}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 text-white">
                              <span className="text-xs font-bold drop-shadow-xs">
                                {lang === 'hi' ? catMeta?.nameHi : catMeta?.nameEn}
                                {' · '}
                                {listing.isAvailable
                                  ? isAuto
                                    ? t.available
                                    : t.openNow
                                  : isAuto
                                  ? t.busy
                                  : t.closedNow}
                              </span>
                              {isQueue && (
                                <span className="text-xs font-extrabold tabular-nums drop-shadow-xs">
                                  {lang === 'hi'
                                    ? `टोकन #${listing.currentToken || 1}`
                                    : `Token #${listing.currentToken || 1}`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="text-lg font-extrabold text-stone-900 leading-snug">
                                  {name}
                                </h3>
                                <p className="text-xs text-stone-600 mt-1">
                                  {listing.ownerName} · {area}
                                </p>
                              </div>
                              <SpeakButton
                                id={`card-speak-${listing.id}`}
                                text={cardSpeech}
                                speakingId={speakingId}
                                onSpeak={speak}
                                lang={lang}
                                size="sm"
                              />
                            </div>

                            {/* Compact Item / Fare Preview */}
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
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="px-5 pb-5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isAuto) {
                                setShowAutoScreen(true);
                              } else {
                                setSelectedListing(listing);
                              }
                            }}
                            className="flex-1 min-h-[46px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            {isAuto ? (
                              <>
                                <CarFront className="w-4 h-4 shrink-0" />
                                <span>{t.bookAuto}</span>
                              </>
                            ) : isQueue ? (
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
                            onClick={() =>
                              setUpiModal({
                                isOpen: true,
                                payeeName: name,
                                upiId: listing.upiId,
                                qrImageUrl: listing.qrImageUrl,
                                amount: isAuto ? listing.baseFare : undefined,
                              })
                            }
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
            </section>
          </div>
        )}
      </main>

      {/* NATIVE ANDROID-STYLE BOTTOM NAVIGATION BAR (Mobile only, 64px height) */}
      <nav
        aria-label="Primary Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe"
      >
        <div className="grid grid-cols-4 h-16 items-center">
          {(
            [
              { id: 'home', label: t.navHome, icon: Home },
              { id: 'voice', label: t.navVoice, icon: Mic },
              { id: 'bookings', label: t.navBookings, icon: Ticket },
              { id: 'profile', label: t.navProfile, icon: UserIcon },
            ] as const
          ).map((item) => {
            const IconComp = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'home') setShowAutoScreen(false);
                }}
                className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-emerald-800' : 'text-stone-500'
                }`}
              >
                <div
                  className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
                    item.id === 'voice'
                      ? active
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-100 text-orange-700'
                      : active
                      ? 'bg-emerald-100 text-emerald-800'
                      : ''
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MODALS & BOTTOM SHEETS */}
      <ListingDetailSheet
        listing={selectedListing}
        lang={lang}
        cart={cart}
        onClose={() => setSelectedListing(null)}
        onAddToCart={handleAddToCart}
        onUpdateCartQty={handleUpdateCartQty}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenUpi={(listing, amount) =>
          setUpiModal({
            isOpen: true,
            payeeName: lang === 'hi' ? listing.nameHi : listing.nameEn,
            upiId: listing.upiId,
            qrImageUrl: listing.qrImageUrl,
            amount,
          })
        }
        onBookQueueToken={handleBookQueueToken}
        speakingId={speakingId}
        onSpeak={speak}
      />

      <CartCheckoutSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lang={lang}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onClearCart={() => setCart([])}
        onPlaceOrder={handlePlaceOrder}
        speakingId={speakingId}
        onSpeak={speak}
      />

      <UpiPaymentModal
        isOpen={upiModal.isOpen}
        onClose={() => setUpiModal((m) => ({ ...m, isOpen: false }))}
        lang={lang}
        payeeName={upiModal.payeeName}
        upiId={upiModal.upiId}
        uploadedQrUrl={upiModal.qrImageUrl}
        amount={upiModal.amount}
        speakingId={speakingId}
        onSpeak={speak}
        onPaidConfirm={(method) => {
          setUpiModal((m) => ({ ...m, isOpen: false }));
          pushAlert(
            method === 'upi'
              ? lang === 'hi'
                ? 'UPI भुगतान दर्ज हुआ'
                : 'UPI Payment Noted'
              : lang === 'hi'
              ? 'नकद भुगतान चुना गया'
              : 'Cash Selected',
            upiModal.payeeName
          );
        }}
      />
    </div>
  );
}
