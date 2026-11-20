import { CategoryId, Lang, SubscriptionTierId } from '../types';

export interface CategoryMeta {
  id: CategoryId;
  nameHi: string;
  nameEn: string;
  subHi: string;
  subEn: string;
  bgClass: string;
  iconBgClass: string;
  accentText: string;
  voicePromptHi: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'auto',
    nameHi: 'ऑटो रिक्शा',
    nameEn: 'Auto Rickshaw',
    subHi: 'ऑटो और ई-रिक्शा बुक करें',
    subEn: 'Auto & E-Rickshaw rides',
    bgClass: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200/80',
    iconBgClass: 'bg-amber-500 text-white',
    accentText: 'text-amber-900',
    voicePromptHi: 'ऑटो रिक्शा बुक करो',
  },
  {
    id: 'sabji',
    nameHi: 'सब्जी और फल',
    nameEn: 'Vegetables & Fruits',
    subHi: 'ठेला से मंडी तक ताज़ा भाव',
    subEn: 'Fresh carts & mandi rates',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/80',
    iconBgClass: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-950',
    voicePromptHi: 'टमाटर का भाव',
  },
  {
    id: 'kirana',
    nameHi: 'किराना स्टोर',
    nameEn: 'Kirana & Grocery',
    subHi: 'राशन, तेल, दाल व घर का सामान',
    subEn: 'Daily groceries & staples',
    bgClass: 'bg-orange-50 hover:bg-orange-100/80 border-orange-200/80',
    iconBgClass: 'bg-orange-600 text-white',
    accentText: 'text-orange-950',
    voicePromptHi: 'किराना स्टोर दिखाओ',
  },
  {
    id: 'csc',
    nameHi: 'जन सेवा / CSC',
    nameEn: 'CSC Center',
    subHi: 'आधार, पैन, प्रमाण पत्र टोकन',
    subEn: 'Aadhaar, PAN, certificates',
    bgClass: 'bg-sky-50 hover:bg-sky-100/80 border-sky-200/80',
    iconBgClass: 'bg-sky-600 text-white',
    accentText: 'text-sky-950',
    voicePromptHi: 'CSC सेंटर',
  },
  {
    id: 'salon',
    nameHi: 'सैलून',
    nameEn: 'Salons',
    subHi: 'हेयर कट, दाढ़ी बिना इंतज़ार',
    subEn: 'Haircut & grooming queue',
    bgClass: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200/80',
    iconBgClass: 'bg-rose-600 text-white',
    accentText: 'text-rose-950',
    voicePromptHi: 'सैलून बुकिंग',
  },
  {
    id: 'clinic',
    nameHi: 'क्लिनिक / डॉक्टर',
    nameEn: 'Clinics & Doctors',
    subHi: 'डॉक्टर अपॉइंटमेंट व टोकन',
    subEn: 'Doctor visit & token',
    bgClass: 'bg-teal-50 hover:bg-teal-100/80 border-teal-200/80',
    iconBgClass: 'bg-teal-600 text-white',
    accentText: 'text-teal-950',
    voicePromptHi: 'डॉक्टर क्लिनिक',
  },
  {
    id: 'showroom',
    nameHi: 'बड़े शोरूम / दुकानें',
    nameEn: 'Big Showrooms',
    subHi: 'कपड़े, मोबाइल, इलेक्ट्रॉनिक्स',
    subEn: 'Retail stores & showrooms',
    bgClass: 'bg-yellow-50 hover:bg-yellow-100/80 border-yellow-200/80',
    iconBgClass: 'bg-yellow-600 text-white',
    accentText: 'text-yellow-950',
    voicePromptHi: 'बड़े शोरूम दिखाओ',
  },
];

export interface SubscriptionPlanMeta {
  id: SubscriptionTierId;
  amount: number;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanMeta[] = [
  {
    id: 'basic_99',
    amount: 99,
    titleHi: 'ऑटो / छोटे दुकानदार',
    titleEn: 'Auto / Small Vendors',
    descHi: 'ऑटो ड्राइवर, सब्जी ठेला, छोटे किराना',
    descEn: 'Auto drivers, street carts, small kirana',
  },
  {
    id: 'pro_299',
    amount: 299,
    titleHi: 'CSC / सैलून / क्लिनिक',
    titleEn: 'CSC / Salon / Clinic',
    descHi: 'लाइव टोकन क्यू, ऑटो-बुकिंग व डॉक्यूमेंट गाइड',
    descEn: 'Live queue tokens, auto-booking & checklists',
  },
  {
    id: 'showroom_599',
    amount: 599,
    titleHi: 'बड़े शोरूम / दुकानें',
    titleEn: 'Big Showrooms & Retail',
    descHi: 'अनलिमिटेड प्रोडक्ट लिस्टिंग व टॉप प्राथमिकता',
    descEn: 'Unlimited catalog listings & priority placement',
  },
];

export const TIME_SLOTS = [
  { id: '10:00', hi: 'सुबह 10:00 बजे', en: '10:00 AM' },
  { id: '11:00', hi: 'सुबह 11:00 बजे', en: '11:00 AM' },
  { id: '12:30', hi: 'दोपहर 12:30 बजे', en: '12:30 PM' },
  { id: '15:00', hi: 'दोपहर 3:00 बजे', en: '03:00 PM' },
  { id: '17:00', hi: 'शाम 5:00 बजे', en: '05:00 PM' },
  { id: '18:30', hi: 'शाम 6:30 बजे', en: '06:30 PM' },
];

export const UI_TEXT: Record<
  Lang,
  {
    brand: string;
    brandSub: string;
    navHome: string;
    navVoice: string;
    navBookings: string;
    navProfile: string;
    installApp: string;
    searchPlaceholder: string;
    speakToSearch: string;
    listeningNow: string;
    tapMicHint: string;
    allCategories: string;
    popularNearby: string;
    available: string;
    busy: string;
    openNow: string;
    closedNow: string;
    callNow: string;
    whatsapp: string;
    payUpi: string;
    bookAuto: string;
    getToken: string;
    viewShop: string;
    addToCart: string;
    cartTitle: string;
    homeDelivery: string;
    storePickup: string;
    cashPay: string;
    upiPay: string;
    placeOrder: string;
    offlineBanner: string;
    enableNotifications: string;
    notificationsOn: string;
    listenAloud: string;
    stopReading: string;
    noResults: string;
    resetFilter: string;
    verifiedPartner: string;
    pendingApproval: string;
    pickupLabel: string;
    dropLabel: string;
    estimatedFare: string;
    liveQueueTitle: string;
    currentTokenLabel: string;
    waitingLabel: string;
    docsRequiredTitle: string;
    listenDocsBtn: string;
    confirmInstantToken: string;
    vendorPanelTitle: string;
    adminPanelTitle: string;
    customerView: string;
    googleSync: string;
    signOut: string;
  }
> = {
  hi: {
    brand: 'अपना बाज़ार',
    brandSub: 'गाँव और शहर की हर दुकान अब आपकी आवाज़ पर',
    navHome: 'होम',
    navVoice: 'बोलकर खोजें',
    navBookings: 'मेरी बुकिंग',
    navProfile: 'प्रोफ़ाइल',
    installApp: 'ऐप इंस्टॉल करें',
    searchPlaceholder: 'खोजें: टमाटर, ऑटो, CSC सेंटर, सैलून...',
    speakToSearch: 'बोलकर खोजें',
    listeningNow: 'सुन रहे हैं... अब हिंदी में बोलें',
    tapMicHint: 'माइक दबाएँ और बोलें — जैसे "ऑटो रिक्शा बुक करो" या "टमाटर का भाव"',
    allCategories: 'सभी सेवाएँ और दुकानें',
    popularNearby: 'आपके पास की दुकानें और सेवाएँ',
    available: 'उपलब्ध',
    busy: 'व्यस्त',
    openNow: 'खुला है',
    closedNow: 'बंद है',
    callNow: 'कॉल करें',
    whatsapp: 'व्हाट्सऐप',
    payUpi: 'UPI से भुगतान',
    bookAuto: 'ऑटो बुक करें',
    getToken: 'तुरंत टोकन लें',
    viewShop: 'सामान देखें',
    addToCart: 'जोड़ें',
    cartTitle: 'मेरा झोला',
    homeDelivery: 'घर पर डिलीवरी',
    storePickup: 'दुकान से खुद लें',
    cashPay: 'नकद (कैश)',
    upiPay: 'सीधा UPI QR',
    placeOrder: 'ऑर्डर पक्का करें',
    offlineBanner: 'ऑफ़लाइन मोड — सेव की गई दुकानें और टोकन दिख रहे हैं',
    enableNotifications: 'बुकिंग अलर्ट चालू करें',
    notificationsOn: 'अलर्ट चालू हैं',
    listenAloud: 'सुनें',
    stopReading: 'रोकें',
    noResults: 'कोई दुकान या सेवा नहीं मिली',
    resetFilter: 'सभी दिखाएँ',
    verifiedPartner: 'सत्यापित दुकानदार',
    pendingApproval: 'सत्यापन लंबित',
    pickupLabel: 'कहाँ से बैठना है (पिकअप)',
    dropLabel: 'कहाँ जाना है (ड्रॉप)',
    estimatedFare: 'अनुमानित किराया',
    liveQueueTitle: 'लाइव कतार की स्थिति',
    currentTokenLabel: 'अभी चल रहा टोकन',
    waitingLabel: 'लाइन में लोग',
    docsRequiredTitle: 'ज़रूरी कागज़ात (साथ लेकर आएँ)',
    listenDocsBtn: 'कागज़ात की सूची सुनें',
    confirmInstantToken: 'तुरंत टोकन बुक करें',
    vendorPanelTitle: 'दुकानदार / ऑटो ड्राइवर पैनल',
    adminPanelTitle: 'सुपर एडमिन पैनल',
    customerView: 'ग्राहक प्रोफ़ाइल',
    googleSync: 'Google से क्लाउड सिंक करें',
    signOut: 'लॉग आउट',
  },
  en: {
    brand: 'ApnaBazaar',
    brandSub: 'Local shops, autos & town services by voice or touch',
    navHome: 'Home',
    navVoice: 'Voice Search',
    navBookings: 'My Bookings',
    navProfile: 'Profile',
    installApp: 'Install App',
    searchPlaceholder: 'Search: Tomato, Auto, CSC Center, Salon...',
    speakToSearch: 'Speak to Search',
    listeningNow: 'Listening... speak now',
    tapMicHint: 'Tap mic & say "Book auto rickshaw", "Tomato rate", or "CSC center"',
    allCategories: 'All Local Services & Shops',
    popularNearby: 'Nearby Shops & Services',
    available: 'Available',
    busy: 'Busy',
    openNow: 'Open Now',
    closedNow: 'Closed',
    callNow: 'Call',
    whatsapp: 'WhatsApp',
    payUpi: 'Pay via UPI',
    bookAuto: 'Book Auto',
    getToken: 'Instant Token',
    viewShop: 'View Items',
    addToCart: 'Add',
    cartTitle: 'My Basket',
    homeDelivery: 'Home Delivery',
    storePickup: 'Store Pickup',
    cashPay: 'Cash',
    upiPay: 'Direct UPI QR',
    placeOrder: 'Confirm Order',
    offlineBanner: 'Offline Mode — Showing saved shops & tokens',
    enableNotifications: 'Enable Alerts',
    notificationsOn: 'Alerts On',
    listenAloud: 'Listen',
    stopReading: 'Stop',
    noResults: 'No matching shop or service found',
    resetFilter: 'Show All',
    verifiedPartner: 'Verified Partner',
    pendingApproval: 'Pending Approval',
    pickupLabel: 'Pickup Location',
    dropLabel: 'Drop Location',
    estimatedFare: 'Estimated Fare',
    liveQueueTitle: 'Live Queue Status',
    currentTokenLabel: 'Now Serving Token',
    waitingLabel: 'People Waiting',
    docsRequiredTitle: 'Required Documents (Bring with you)',
    listenDocsBtn: 'Listen Document Checklist',
    confirmInstantToken: 'Book Instant Token',
    vendorPanelTitle: 'Vendor / Auto Driver Panel',
    adminPanelTitle: 'Super Admin Panel',
    customerView: 'Customer Profile',
    googleSync: 'Sync with Google Cloud',
    signOut: 'Sign Out',
  },
};
