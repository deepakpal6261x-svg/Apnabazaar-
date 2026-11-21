import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Cloud,
  Download,
  LogOut,
  Mic,
  MicOff,
  Plus,
  QrCode,
  ShieldCheck,
  Store,
  Ticket,
  Upload,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  AdminUpiConfig,
  CategoryId,
  Lang,
  MarketplaceListing,
  ProductOrServiceItem,
  SubscriptionPayment,
  SubscriptionTierId,
  VendorSession,
} from '../types';
import { CATEGORIES, SUBSCRIPTION_PLANS, UI_TEXT } from '../i18n/translations';
import { useVoiceInput } from '../hooks/useSpeech';
import { compressImageFile } from '../utils/qrHelper';
import { SpeakButton } from './SpeakButton';

interface VendorAdminPanelProps {
  lang: Lang;
  firebaseUser: User | null;
  isFirebaseAdmin: boolean;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  vendorSession: VendorSession | null;
  onVendorLogin: (session: VendorSession) => void;
  onVendorLogout: () => void;
  listings: MarketplaceListing[];
  onSaveListing: (listing: MarketplaceListing) => void;
  onToggleAvailability: (listingId: string) => void;
  onAdvanceQueueToken: (listingId: string) => void;
  adminUpiConfig: AdminUpiConfig;
  onUpdateAdminUpi: (config: AdminUpiConfig) => void;
  subscriptions: SubscriptionPayment[];
  onSubmitSubscription: (sub: Omit<SubscriptionPayment, 'id' | 'status' | 'createdAtIso'>) => void;
  onReviewSubscription: (subId: string, decision: 'approved' | 'rejected') => void;
  onOpenUpiDirect: (params: {
    payeeName: string;
    upiId?: string;
    qrImageUrl?: string;
    amount?: number;
  }) => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstallApp: () => void;
  notificationPermission: NotificationPermission;
  onEnableNotifications: () => void;
  speakingId: string | null;
  onSpeak: (text: string, id?: string) => void;
}

export const VendorAdminPanel: React.FC<VendorAdminPanelProps> = ({
  lang,
  firebaseUser,
  isFirebaseAdmin,
  onGoogleSignIn,
  onGoogleSignOut,
  vendorSession,
  onVendorLogin,
  onVendorLogout,
  listings,
  onSaveListing,
  onToggleAvailability,
  onAdvanceQueueToken,
  adminUpiConfig,
  onUpdateAdminUpi,
  subscriptions,
  onSubmitSubscription,
  onReviewSubscription,
  onOpenUpiDirect,
  isInstallable,
  isInstalled,
  isIOS,
  onInstallApp,
  notificationPermission,
  onEnableNotifications,
  speakingId,
  onSpeak,
}) => {
  const t = UI_TEXT[lang];
  const [panelTab, setPanelTab] = useState<'vendor' | 'admin' | 'app'>('vendor');

  // Simple mobile login form
  const [loginMobile, setLoginMobile] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginRole, setLoginRole] = useState<'vendor' | 'driver'>('vendor');

  // Vendor listing editor (with Hindi Voice-to-Text!)
  const [activeVoiceTarget, setActiveVoiceTarget] = useState<
    'shopName' | 'area' | 'itemName' | 'itemPrice'
  >('shopName');
  const [newCategory, setNewCategory] = useState<CategoryId>('sabji');
  const [shopNameHi, setShopNameHi] = useState('');
  const [areaHi, setAreaHi] = useState('');
  const [vendorUpiId, setVendorUpiId] = useState('');
  const [vendorQrUrl, setVendorQrUrl] = useState('');
  const [itemNameHi, setItemNameHi] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUnitHi, setItemUnitHi] = useState('किलो');

  // Subscription submission
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionTierId>('basic_99');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptImg, setReceiptImg] = useState('');

  // Admin UPI editor
  const [adminNameInput, setAdminNameInput] = useState(adminUpiConfig.adminName);
  const [adminUpiInput, setAdminUpiInput] = useState(adminUpiConfig.upiId);
  const [adminQrInput, setAdminQrInput] = useState(adminUpiConfig.qrImageUrl || '');
  const [showIOSModal, setShowIOSModal] = useState(false);

  const voice = useVoiceInput(lang, (spoken) => {
    if (activeVoiceTarget === 'shopName') setShopNameHi(spoken);
    if (activeVoiceTarget === 'area') setAreaHi(spoken);
    if (activeVoiceTarget === 'itemName') setItemNameHi(spoken);
    if (activeVoiceTarget === 'itemPrice') {
      const digits = spoken.replace(/[^\d]/g, '');
      if (digits) setItemPrice(digits);
    }
  });

  const triggerVoiceFor = (target: 'shopName' | 'area' | 'itemName' | 'itemPrice') => {
    setActiveVoiceTarget(target);
    if (voice.isListening) voice.stopListening();
    else voice.startListening();
  };

  // Match vendor's own listing
  const myListing = useMemo(() => {
    if (!vendorSession) return null;
    if (vendorSession.listingId) {
      const found = listings.find((l) => l.id === vendorSession.listingId);
      if (found) return found;
    }
    return (
      listings.find(
        (l) =>
          l.businessPhone.replace(/\D/g, '') === vendorSession.mobile.replace(/\D/g, '') ||
          (firebaseUser && l.ownerUid === firebaseUser.uid)
      ) || null
    );
  }, [vendorSession, listings, firebaseUser]);

  const handleMobileLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = loginMobile.replace(/\D/g, '');
    if (cleaned.length < 10) return;
    const matched = listings.find((l) => l.businessPhone.replace(/\D/g, '') === cleaned);
    onVendorLogin({
      mobile: cleaned,
      name: loginName.trim() || matched?.ownerName || (lang === 'hi' ? 'दुकानदार जी' : 'Partner'),
      role: matched?.category === 'auto' ? 'driver' : loginRole,
      listingId: matched?.id,
    });
  };

  const handleQuickDemoLogin = (listing: MarketplaceListing) => {
    onVendorLogin({
      mobile: listing.businessPhone,
      name: listing.ownerName,
      role: listing.category === 'auto' ? 'driver' : 'vendor',
      listingId: listing.id,
    });
    setVendorUpiId(listing.upiId || '');
    setVendorQrUrl(listing.qrImageUrl || '');
  };

  const handleFileUpload = async (
    file: File | undefined,
    setter: (dataUrl: string) => void
  ) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setter(compressed);
    } catch {
      // ignore invalid file
    }
  };

  const handleCreateMyListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorSession || !shopNameHi.trim()) return;
    const tier: SubscriptionTierId =
      newCategory === 'showroom'
        ? 'showroom_599'
        : newCategory === 'csc' || newCategory === 'salon' || newCategory === 'clinic'
        ? 'pro_299'
        : 'basic_99';

    const created: MarketplaceListing = {
      id: `listing-${Date.now()}`,
      ownerUid: firebaseUser?.uid || `local-${vendorSession.mobile}`,
      category: vendorSession.role === 'driver' ? 'auto' : newCategory,
      nameHi: shopNameHi.trim(),
      nameEn: shopNameHi.trim(),
      ownerName: vendorSession.name,
      areaHi: areaHi.trim() || 'मुख्य बाज़ार',
      areaEn: areaHi.trim() || 'Main Bazaar',
      businessPhone: vendorSession.mobile,
      upiId: vendorUpiId.trim(),
      qrImageUrl: vendorQrUrl,
      isAvailable: true,
      isPublished: true,
      vehicleType: vendorSession.role === 'driver' ? 'ऑटो रिक्शा' : undefined,
      baseFare: vendorSession.role === 'driver' ? 30 : undefined,
      currentToken: newCategory === 'csc' || newCategory === 'salon' || newCategory === 'clinic' ? 1 : undefined,
      waitingCount: newCategory === 'csc' || newCategory === 'salon' || newCategory === 'clinic' ? 0 : undefined,
      subscriptionTier: tier,
      subscriptionStatus: 'pending',
      items: [],
    };
    onSaveListing(created);
    onVendorLogin({ ...vendorSession, listingId: created.id });
    setShopNameHi('');
    setAreaHi('');
  };

  const handleAddItemByVoiceOrText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myListing || !itemNameHi.trim() || !itemPrice) return;
    const parsedPrice = Math.max(1, Number(itemPrice) || 0);
    const newItem: ProductOrServiceItem = {
      id: `item-${Date.now()}`,
      nameHi: itemNameHi.trim(),
      nameEn: itemNameHi.trim(),
      price: parsedPrice,
      unitHi: itemUnitHi.trim() || 'पीस',
      unitEn: itemUnitHi.trim() || 'unit',
    };
    onSaveListing({
      ...myListing,
      items: [newItem, ...myListing.items],
    });
    setItemNameHi('');
    setItemPrice('');
  };

  const handleSaveVendorUpi = () => {
    if (!myListing) return;
    onSaveListing({
      ...myListing,
      upiId: vendorUpiId.trim() || myListing.upiId,
      qrImageUrl: vendorQrUrl || myListing.qrImageUrl,
    });
  };

  const handleSubscriptionFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorSession || !utrNumber.trim()) return;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];
    onSubmitSubscription({
      vendorUid: firebaseUser?.uid || `local-${vendorSession.mobile}`,
      listingId: myListing?.id || 'unlinked',
      vendorName: myListing?.nameHi || vendorSession.name,
      vendorMobile: vendorSession.mobile,
      planId: plan.id,
      amount: plan.amount,
      utrNumber: utrNumber.trim(),
      screenshotUrl: receiptImg,
    });
    setUtrNumber('');
    setReceiptImg('');
  };

  const pendingSubCount = subscriptions.filter((s) => s.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-1.5 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setPanelTab('vendor')}
          className={`min-h-[46px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap px-2 ${
            panelTab === 'vendor'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Store className="w-4 h-4 shrink-0" />
          <span>{lang === 'hi' ? 'दुकानदार / ऑटो' : 'Vendor / Auto'}</span>
        </button>

        <button
          type="button"
          onClick={() => setPanelTab('admin')}
          className={`min-h-[46px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap px-2 ${
            panelTab === 'admin'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-stone-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {lang === 'hi' ? 'सुपर एडमिन' : 'Super Admin'}
            {pendingSubCount > 0 ? ` (${pendingSubCount})` : ''}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPanelTab('app')}
          className={`min-h-[46px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap px-2 ${
            panelTab === 'app'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{lang === 'hi' ? 'ऐप व सिंक' : 'App & Sync'}</span>
        </button>
      </div>

      {/* PANEL 1: VENDOR & AUTO DRIVER PANEL */}
      {panelTab === 'vendor' && (
        <div className="space-y-5">
          {!vendorSession ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900">{t.vendorPanelTitle}</h2>
                  <p className="text-sm text-stone-600 mt-1">
                    {lang === 'hi'
                      ? 'सिर्फ मोबाइल नंबर डालें — अपनी दुकान या ऑटो तुरंत चालू करें'
                      : 'Login with your mobile number to manage your shop or auto rickshaw'}
                  </p>
                </div>
                <SpeakButton
                  id="vendor-login-speak"
                  text={
                    lang === 'hi'
                      ? 'दुकानदार और ऑटो ड्राइवर लॉगिन। अपना 10 अंकों का मोबाइल नंबर और नाम डालकर लॉगिन करें। आप बोलकर भी अपने सामान का नाम और भाव जोड़ सकते हैं।'
                      : 'Vendor and auto driver login. Enter your 10 digit mobile number and name to manage your listings and UPI QR code.'
                  }
                  speakingId={speakingId}
                  onSpeak={onSpeak}
                  lang={lang}
                  size="sm"
                />
              </div>

              <form onSubmit={handleMobileLoginSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginRole('vendor')}
                    className={`min-h-[46px] rounded-xl border font-bold text-sm ${
                      loginRole === 'vendor'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-stone-50 text-stone-800 border-stone-200'
                    }`}
                  >
                    {lang === 'hi' ? 'दुकानदार / CSC / क्लिनिक' : 'Shop / CSC / Clinic'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRole('driver')}
                    className={`min-h-[46px] rounded-xl border font-bold text-sm ${
                      loginRole === 'driver'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-stone-50 text-stone-800 border-stone-200'
                    }`}
                  >
                    {lang === 'hi' ? 'ऑटो / ई-रिक्शा ड्राइवर' : 'Auto / E-Rickshaw Driver'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {lang === 'hi' ? 'मोबाइल नंबर (10 अंक)' : 'Mobile Number (10 digits)'}
                    </label>
                    <input
                      type="tel"
                      required
                      minLength={10}
                      maxLength={12}
                      value={loginMobile}
                      onChange={(e) => setLoginMobile(e.target.value)}
                      placeholder="9876543210"
                      className="w-full min-h-[48px] px-4 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-700 outline-none text-base font-semibold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {lang === 'hi' ? 'आपका नाम' : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder={lang === 'hi' ? 'जैसे: रामू यादव' : 'e.g. Ramu Yadav'}
                      className="w-full min-h-[48px] px-4 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-700 outline-none text-base"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[52px] rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>{lang === 'hi' ? 'लॉगिन करें' : 'Login Now'}</span>
                </button>
              </form>

              {/* One-tap Demo Partner Switchers for fast exploration */}
              <div className="pt-4 border-t border-stone-100 space-y-2.5">
                <div className="text-xs font-bold text-stone-500">
                  {lang === 'hi'
                    ? 'या तुरंत डेमो अकाउंट से खोलकर देखें:'
                    : 'Or try instantly with a sample partner account:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {listings.slice(0, 1).concat(listings.filter((l) => l.category === 'sabji' || l.category === 'csc').slice(0, 2)).map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(sample)}
                      className="min-h-[48px] px-3 py-2 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 text-left"
                    >
                      <div className="text-xs font-extrabold text-stone-900 truncate">
                        {lang === 'hi' ? sample.nameHi : sample.nameEn}
                      </div>
                      <div className="text-[11px] text-stone-500 tabular-nums">
                        {sample.businessPhone}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Logged-in Partner Bar */}
              <div className="bg-white rounded-3xl border border-stone-200 p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-emerald-700">
                    {vendorSession.role === 'driver'
                      ? lang === 'hi'
                        ? 'ऑटो ड्राइवर खाता'
                        : 'Auto Driver Account'
                      : lang === 'hi'
                      ? 'दुकानदार खाता'
                      : 'Vendor Account'}
                    {' · '}
                    <span className="tabular-nums">{vendorSession.mobile}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-stone-900 mt-0.5">
                    {myListing
                      ? lang === 'hi'
                        ? myListing.nameHi
                        : myListing.nameEn
                      : vendorSession.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onVendorLogout}
                  className="min-h-[44px] px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.signOut}</span>
                </button>
              </div>

              {!myListing ? (
                /* Register New Shop / Auto with Hindi Voice Input */
                <form
                  onSubmit={handleCreateMyListing}
                  className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4"
                >
                  <h4 className="text-lg font-extrabold text-stone-900">
                    {lang === 'hi'
                      ? 'अपनी दुकान या ऑटो जोड़ें (बोलकर या लिखकर)'
                      : 'Register Your Shop or Auto (Voice or Typing)'}
                  </h4>

                  {vendorSession.role !== 'driver' && (
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        {lang === 'hi' ? 'श्रेणी चुनें' : 'Select Category'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CATEGORIES.filter((c) => c.id !== 'auto').map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNewCategory(cat.id)}
                            className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold ${
                              newCategory === cat.id
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-stone-50 text-stone-800 border-stone-200'
                            }`}
                          >
                            {lang === 'hi' ? cat.nameHi : cat.nameEn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {lang === 'hi' ? 'दुकान / ऑटो का नाम' : 'Shop / Auto Name'}
                      </label>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1">
                        <input
                          type="text"
                          required
                          value={shopNameHi}
                          onChange={(e) => setShopNameHi(e.target.value)}
                          placeholder={lang === 'hi' ? 'जैसे: गुप्ता सब्जी भंडार' : 'e.g. Gupta Veg Store'}
                          className="w-full min-h-[44px] bg-transparent text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => triggerVoiceFor('shopName')}
                          className={`min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center ${
                            voice.isListening && activeVoiceTarget === 'shopName'
                              ? 'bg-orange-600 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {voice.isListening && activeVoiceTarget === 'shopName' ? (
                            <MicOff className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {lang === 'hi' ? 'इलाका / पता' : 'Area / Landmark'}
                      </label>
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1">
                        <input
                          type="text"
                          value={areaHi}
                          onChange={(e) => setAreaHi(e.target.value)}
                          placeholder={lang === 'hi' ? 'जैसे: बस स्टैंड के पास' : 'e.g. Near Bus Stand'}
                          className="w-full min-h-[44px] bg-transparent text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => triggerVoiceFor('area')}
                          className={`min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center ${
                            voice.isListening && activeVoiceTarget === 'area'
                              ? 'bg-orange-600 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {voice.isListening && activeVoiceTarget === 'area' ? (
                            <MicOff className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[50px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base"
                  >
                    {lang === 'hi' ? 'दुकान / ऑटो लाइव करें' : 'Publish Listing'}
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left Column: Availability Switch + Queue + Add Products by Voice */}
                  <div className="space-y-5">
                    {/* Big Tactile Available / Busy Toggle */}
                    <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-extrabold text-stone-900">
                            {myListing.category === 'auto'
                              ? lang === 'hi'
                                ? 'ड्राइवर स्थिति (उपलब्ध / व्यस्त)'
                                : 'Driver Status (Available / Busy)'
                              : lang === 'hi'
                              ? 'दुकान की स्थिति'
                              : 'Shop Open Status'}
                          </h4>
                          <p className="text-xs text-stone-600 mt-0.5">
                            {lang === 'hi'
                              ? 'एक टैप में ग्राहकों को तुरंत दिख जाएगा'
                              : 'Updates live for customers immediately'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleAvailability(myListing.id)}
                          className={`min-h-[50px] px-5 rounded-2xl font-extrabold text-sm transition-colors ${
                            myListing.isAvailable
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {myListing.isAvailable
                            ? myListing.category === 'auto'
                              ? `${t.available} ✓`
                              : `${t.openNow} ✓`
                            : myListing.category === 'auto'
                            ? `${t.busy}`
                            : `${t.closedNow}`}
                        </button>
                      </div>

                      {(myListing.category === 'csc' ||
                        myListing.category === 'salon' ||
                        myListing.category === 'clinic') && (
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs text-stone-500">
                              {lang === 'hi' ? 'अभी चल रहा टोकन' : 'Live Token Counter'}
                            </div>
                            <div className="text-2xl font-extrabold text-emerald-800 tabular-nums">
                              #{myListing.currentToken || 1}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onAdvanceQueueToken(myListing.id)}
                            className="min-h-[46px] px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5"
                          >
                            <Ticket className="w-4 h-4" />
                            <span>
                              {lang === 'hi' ? 'अगला टोकन बुलाएँ (+1)' : 'Call Next Token (+1)'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add Product / Price by Hindi Voice or Typing */}
                    <form
                      onSubmit={handleAddItemByVoiceOrText}
                      className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3.5"
                    >
                      <h4 className="text-base font-extrabold text-stone-900">
                        {lang === 'hi'
                          ? 'बोलकर या लिखकर नया सामान / भाव जोड़ें'
                          : 'Add Product or Service by Voice / Typing'}
                      </h4>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {lang === 'hi' ? 'सामान या सेवा का नाम' : 'Item / Service Name'}
                        </label>
                        <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1">
                          <input
                            type="text"
                            required
                            value={itemNameHi}
                            onChange={(e) => setItemNameHi(e.target.value)}
                            placeholder={lang === 'hi' ? 'बोलें: ताज़ा आम या देसी घी' : 'e.g. Fresh Mango'}
                            className="w-full min-h-[42px] bg-transparent text-sm outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => triggerVoiceFor('itemName')}
                            className={`min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center ${
                              voice.isListening && activeVoiceTarget === 'itemName'
                                ? 'bg-orange-600 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                            aria-label="Speak product name"
                          >
                            {voice.isListening && activeVoiceTarget === 'itemName' ? (
                              <MicOff className="w-4 h-4" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            {lang === 'hi' ? 'भाव (₹ रुपये)' : 'Price (₹)'}
                          </label>
                          <div className="flex items-center gap-1 bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1">
                            <input
                              type="number"
                              required
                              min={1}
                              value={itemPrice}
                              onChange={(e) => setItemPrice(e.target.value)}
                              placeholder="40"
                              className="w-full min-h-[42px] bg-transparent text-sm font-bold tabular-nums outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => triggerVoiceFor('itemPrice')}
                              className={`min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center ${
                                voice.isListening && activeVoiceTarget === 'itemPrice'
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                              aria-label="Speak price"
                            >
                              <Mic className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            {lang === 'hi' ? 'मात्रा / इकाई' : 'Unit'}
                          </label>
                          <input
                            type="text"
                            value={itemUnitHi}
                            onChange={(e) => setItemUnitHi(e.target.value)}
                            placeholder="किलो / पीस"
                            className="w-full min-h-[44px] px-3 rounded-xl bg-stone-50 border border-stone-300 text-sm outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{lang === 'hi' ? 'सूची में जोड़ें' : 'Add to Catalog'}</span>
                      </button>

                      {myListing.items.length > 0 && (
                        <div className="pt-2 border-t border-stone-100 max-h-40 overflow-y-auto space-y-1.5">
                          {myListing.items.map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between text-xs bg-stone-50 rounded-lg px-3 py-2"
                            >
                              <span className="font-semibold text-stone-800">
                                {lang === 'hi' ? it.nameHi : it.nameEn}
                              </span>
                              <span className="font-bold text-emerald-800 tabular-nums">
                                ₹{it.price} / {lang === 'hi' ? it.unitHi : it.unitEn}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Right Column: Own UPI QR Upload + Monthly Subscription Payment to Admin */}
                  <div className="space-y-5">
                    {/* Vendor Personal UPI ID & QR Upload */}
                    <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3.5">
                      <h4 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-700" />
                        <span>
                          {lang === 'hi'
                            ? 'मेरा सीधा UPI ID और QR कोड'
                            : 'My Direct UPI ID & QR Code'}
                        </span>
                      </h4>
                      <p className="text-xs text-stone-600">
                        {lang === 'hi'
                          ? 'ग्राहक सीधे आपके PhonePe / GPay / Paytm खाते में पैसे भेजेंगे।'
                          : 'Customers pay directly to your personal UPI account with zero middleman.'}
                      </p>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {lang === 'hi' ? 'आपका UPI ID' : 'Your UPI ID'}
                        </label>
                        <input
                          type="text"
                          value={vendorUpiId || myListing.upiId || ''}
                          onChange={(e) => setVendorUpiId(e.target.value)}
                          placeholder="yourname@ybl"
                          className="w-full min-h-[44px] px-3.5 rounded-xl bg-stone-50 border border-stone-300 text-sm font-semibold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {lang === 'hi' ? 'अपना QR कोड फोटो अपलोड करें' : 'Upload Your QR Image'}
                        </label>
                        <label className="min-h-[46px] px-4 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>{lang === 'hi' ? 'QR फोटो चुनें (गैलरी से)' : 'Choose QR Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files?.[0], setVendorQrUrl)}
                          />
                        </label>
                      </div>

                      {(vendorQrUrl || myListing.qrImageUrl) && (
                        <img
                          src={vendorQrUrl || myListing.qrImageUrl}
                          alt="Vendor UPI QR"
                          className="w-32 h-32 object-contain rounded-xl border border-stone-200 mx-auto bg-white p-1"
                        />
                      )}

                      <button
                        type="button"
                        onClick={handleSaveVendorUpi}
                        className="w-full min-h-[46px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm"
                      >
                        {lang === 'hi' ? 'UPI विवरण सेव करें' : 'Save My UPI Details'}
                      </button>
                    </div>

                    {/* Monthly Subscription Payment to Super Admin UPI */}
                    <form
                      onSubmit={handleSubscriptionFormSubmit}
                      className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-extrabold text-stone-900">
                          {lang === 'hi' ? 'मासिक सब्सक्रिप्शन प्लान' : 'Monthly Subscription Plan'}
                        </h4>
                        <span
                          className={`text-xs font-bold ${
                            myListing.subscriptionStatus === 'active'
                              ? 'text-emerald-700'
                              : 'text-orange-700'
                          }`}
                        >
                          {myListing.subscriptionStatus === 'active'
                            ? t.verifiedPartner
                            : t.pendingApproval}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {SUBSCRIPTION_PLANS.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 ${
                              selectedPlanId === plan.id
                                ? 'bg-orange-50 border-orange-600'
                                : 'bg-stone-50 border-stone-200'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-extrabold text-stone-900">
                                {lang === 'hi' ? plan.titleHi : plan.titleEn}
                              </div>
                              <div className="text-xs text-stone-600">
                                {lang === 'hi' ? plan.descHi : plan.descEn}
                              </div>
                            </div>
                            <div className="text-lg font-extrabold text-orange-700 tabular-nums shrink-0">
                              ₹{plan.amount}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-emerald-900">
                            {lang === 'hi' ? 'एडमिन UPI ID पर भुगतान करें:' : 'Pay to Admin UPI ID:'}
                          </div>
                          <div className="text-sm font-extrabold text-stone-900 truncate">
                            {adminUpiConfig.upiId}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenUpiDirect({
                              payeeName: adminUpiConfig.adminName,
                              upiId: adminUpiConfig.upiId,
                              qrImageUrl: adminUpiConfig.qrImageUrl,
                              amount:
                                SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId)?.amount ||
                                99,
                            })
                          }
                          className="min-h-[42px] px-3.5 rounded-xl bg-emerald-700 text-white font-bold text-xs whitespace-nowrap shrink-0"
                        >
                          {lang === 'hi' ? 'एडमिन QR देखें' : 'Show Admin QR'}
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          {lang === 'hi'
                            ? 'भुगतान के बाद UTR / ट्रांज़ैक्शन ID लिखें'
                            : 'Enter UPI Transaction / UTR ID'}
                        </label>
                        <input
                          type="text"
                          required
                          minLength={4}
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. UTR432198765432"
                          className="w-full min-h-[44px] px-3.5 rounded-xl bg-stone-50 border border-stone-300 text-sm font-semibold tabular-nums outline-none"
                        />
                      </div>

                      <label className="min-h-[44px] px-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>
                          {receiptImg
                            ? lang === 'hi'
                              ? 'स्क्रीनशॉट जुड़ गया ✓'
                              : 'Screenshot Attached ✓'
                            : lang === 'hi'
                            ? 'पेमेंट स्क्रीनशॉट अपलोड करें'
                            : 'Upload Payment Screenshot'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files?.[0], setReceiptImg)}
                        />
                      </label>

                      <button
                        type="submit"
                        className="w-full min-h-[48px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm"
                      >
                        {lang === 'hi'
                          ? 'सब्सक्रिप्शन स्वीकृति के लिए भेजें'
                          : 'Submit for Instant Approval'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PANEL 2: SUPER ADMIN PANEL */}
      {panelTab === 'admin' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <div className="text-xs text-stone-500">
                {lang === 'hi' ? 'कुल दुकानें / ऑटो' : 'Total Listings'}
              </div>
              <div className="text-2xl font-extrabold text-stone-900 tabular-nums mt-1">
                {listings.length}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <div className="text-xs text-stone-500">
                {lang === 'hi' ? 'सक्रिय प्लान' : 'Active Plans'}
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
                {listings.filter((l) => l.subscriptionStatus === 'active').length}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <div className="text-xs text-stone-500">
                {lang === 'hi' ? 'लंबित पेमेंट' : 'Pending Proofs'}
              </div>
              <div className="text-2xl font-extrabold text-orange-600 tabular-nums mt-1">
                {pendingSubCount}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4">
              <div className="text-xs text-stone-500">
                {lang === 'hi' ? 'क्लाउड एडमिन' : 'Cloud Admin'}
              </div>
              <div className="text-sm font-extrabold text-stone-900 mt-2 truncate">
                {isFirebaseAdmin ? (lang === 'hi' ? 'सत्यापित ✓' : 'Verified ✓') : lang === 'hi' ? 'लोकल मोड' : 'Local Mode'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Super Admin Personal UPI ID & QR Code Manager */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  {lang === 'hi'
                    ? 'एडमिन UPI ID और QR कोड अपलोड करें'
                    : 'Admin Personal UPI ID & QR Code'}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  {lang === 'hi'
                    ? 'सभी दुकानदार और ऑटो ड्राइवर ₹99 / ₹299 / ₹599 प्लान सीधे इसी QR पर भेजेंगे।'
                    : 'All vendors and drivers pay monthly subscriptions (₹99 / ₹299 / ₹599) directly to this QR.'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {lang === 'hi' ? 'एडमिन का नाम' : 'Admin Payee Name'}
                  </label>
                  <input
                    type="text"
                    value={adminNameInput}
                    onChange={(e) => setAdminNameInput(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-stone-50 border border-stone-300 text-sm font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {lang === 'hi' ? 'एडमिन UPI ID' : 'Admin UPI ID'}
                  </label>
                  <input
                    type="text"
                    value={adminUpiInput}
                    onChange={(e) => setAdminUpiInput(e.target.value)}
                    placeholder="admin@okaxis"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-stone-50 border border-stone-300 text-sm font-bold outline-none"
                  />
                </div>

                <label className="min-h-[46px] px-4 rounded-xl border border-dashed border-orange-400 bg-orange-50/60 hover:bg-orange-50 text-orange-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>
                    {lang === 'hi' ? 'एडमिन QR कोड फोटो अपलोड करें' : 'Upload Admin QR Code Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], setAdminQrInput)}
                  />
                </label>

                {adminQrInput && (
                  <img
                    src={adminQrInput}
                    alt="Admin UPI QR"
                    className="w-36 h-36 object-contain rounded-xl border border-stone-200 mx-auto bg-white p-1.5"
                  />
                )}

                <button
                  type="button"
                  onClick={() =>
                    onUpdateAdminUpi({
                      adminName: adminNameInput.trim() || 'ApnaBazaar Admin',
                      upiId: adminUpiInput.trim() || 'apnabazaar.admin@okaxis',
                      qrImageUrl: adminQrInput,
                      updatedAtIso: new Date().toISOString(),
                    })
                  }
                  className="w-full min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm"
                >
                  {lang === 'hi' ? 'एडमिन UPI QR अपडेट करें' : 'Save Admin UPI QR'}
                </button>
              </div>
            </div>

            {/* Subscription Proofs & Instant Approval Queue */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4">
              <h3 className="text-lg font-extrabold text-stone-900">
                {lang === 'hi'
                  ? 'सब्सक्रिप्शन भुगतान सत्यापन (₹99 / ₹299 / ₹599)'
                  : 'Subscription Verification Queue'}
              </h3>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-stone-900 text-sm">
                          {sub.vendorName}
                        </div>
                        <div className="text-xs text-stone-600 tabular-nums mt-0.5">
                          {sub.vendorMobile} · UTR: <strong>{sub.utrNumber}</strong>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-extrabold text-emerald-800 tabular-nums">
                          ₹{sub.amount}
                        </div>
                        <div
                          className={`text-[11px] font-bold ${
                            sub.status === 'approved'
                              ? 'text-emerald-700'
                              : sub.status === 'rejected'
                              ? 'text-red-700'
                              : 'text-orange-700'
                          }`}
                        >
                          {sub.status === 'approved'
                            ? lang === 'hi'
                              ? 'स्वीकृत'
                              : 'Approved'
                            : sub.status === 'rejected'
                            ? lang === 'hi'
                              ? 'अस्वीकृत'
                              : 'Rejected'
                            : lang === 'hi'
                            ? 'लंबित'
                            : 'Pending'}
                        </div>
                      </div>
                    </div>

                    {sub.screenshotUrl && (
                      <img
                        src={sub.screenshotUrl}
                        alt="Payment proof"
                        className="w-full max-h-44 object-contain rounded-xl bg-white border border-stone-200 p-1"
                      />
                    )}

                    {sub.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onReviewSubscription(sub.id, 'approved')}
                          className="min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'hi' ? 'तुरंत स्वीकृत करें' : 'Approve Instantly'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewSubscription(sub.id, 'rejected')}
                          className="min-h-[44px] rounded-xl bg-white hover:bg-red-50 border border-stone-200 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{lang === 'hi' ? 'अस्वीकार करें' : 'Reject'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: PWA INSTALL, PUSH NOTIFICATIONS & CLOUD SYNC */}
      {panelTab === 'app' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Install App Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-stone-900">
              {lang === 'hi' ? 'फोन में ऐप इंस्टॉल करें (PWA / APK)' : 'Install ApnaBazaar App (PWA)'}
            </h3>
            <p className="text-sm text-stone-600">
              {lang === 'hi'
                ? 'होम स्क्रीन पर एक टैप में इंस्टॉल करें। बिना इंटरनेट (ऑफ़लाइन) भी आपकी बुकिंग और दुकानों के भाव दिखेंगे।'
                : 'One-tap install to your Android or iPhone home screen with offline caching and PWABuilder APK readiness.'}
            </p>

            {isInstalled ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{lang === 'hi' ? 'ऐप पहले से इंस्टॉल है' : 'App is already installed'}</span>
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={onInstallApp}
                className="w-full min-h-[50px] rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>{t.installApp}</span>
              </button>
            ) : isIOS ? (
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="w-full min-h-[50px] rounded-2xl bg-stone-900 text-white font-extrabold text-sm"
              >
                {lang === 'hi' ? 'iPhone पर इंस्टॉल करने का तरीका' : 'How to Install on iPhone'}
              </button>
            ) : (
              <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-700">
                {lang === 'hi'
                  ? 'ब्राउज़र मेन्यू (⋮) खोलें और "Add to Home Screen / Install App" पर टैप करें।'
                  : 'Open browser menu (⋮) and tap "Install App" or "Add to Home Screen".'}
              </div>
            )}

            <button
              type="button"
              onClick={onEnableNotifications}
              className={`w-full min-h-[48px] rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>
                {notificationPermission === 'granted'
                  ? t.notificationsOn
                  : t.enableNotifications}
              </span>
            </button>
          </div>

          {/* Firebase Google Cloud Sync Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-700" />
              <span>{lang === 'hi' ? 'क्लाउड डेटाबेस सिंक (Firebase)' : 'Cloud Database Sync'}</span>
            </h3>
            <p className="text-sm text-stone-600">
              {lang === 'hi'
                ? 'अपने सभी दुकानों, टोकन और एडमिन UPI QR को हर फोन पर लाइव सिंक रखने के लिए Google से जुड़ें।'
                : 'Sign in with Google to sync shops, live tokens, and Super Admin UPI approvals across devices in Firestore.'}
            </p>

            {firebaseUser ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="text-sm font-extrabold text-stone-900">
                    {firebaseUser.displayName || firebaseUser.email}
                  </div>
                  <div className="text-xs text-stone-600">{firebaseUser.email}</div>
                  {isFirebaseAdmin && (
                    <div className="text-xs font-bold text-emerald-800 mt-1">
                      {lang === 'hi' ? 'सुपर एडमिन अनुमति सक्रिय ✓' : 'Super Admin Access Active ✓'}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onGoogleSignOut}
                  className="w-full min-h-[46px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="w-full min-h-[50px] rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <Cloud className="w-5 h-5" />
                <span>{t.googleSync}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold text-stone-900">
              {lang === 'hi' ? 'iPhone / iPad पर इंस्टॉल करें' : 'Install on iPhone / iPad'}
            </h3>
            <p className="text-sm text-stone-600">
              {lang === 'hi'
                ? '1. Safari में नीचे Share बटन दबाएँ। 2. "Add to Home Screen" चुनें।'
                : '1. Tap the Share button in Safari. 2. Scroll down and tap Add to Home Screen.'}
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full min-h-[46px] rounded-xl bg-emerald-700 text-white font-bold text-sm"
            >
              {lang === 'hi' ? 'ठीक है' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
