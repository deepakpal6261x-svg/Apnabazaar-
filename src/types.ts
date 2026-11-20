export type Lang = 'hi' | 'en';

export type CategoryId =
  | 'auto'
  | 'sabji'
  | 'kirana'
  | 'csc'
  | 'salon'
  | 'clinic'
  | 'showroom';

export type SubscriptionTierId = 'basic_99' | 'pro_299' | 'showroom_599';

export type ActiveTab = 'home' | 'voice' | 'bookings' | 'profile';

export interface CscDocumentItem {
  id: string;
  icon: 'aadhaar' | 'photo' | 'phone' | 'bank' | 'ration' | 'certificate';
  nameHi: string;
  nameEn: string;
}

export interface ProductOrServiceItem {
  id: string;
  nameHi: string;
  nameEn: string;
  price: number;
  unitHi: string;
  unitEn: string;
  durationMin?: number;
  requiredDocs?: CscDocumentItem[];
}

export interface MarketplaceListing {
  id: string;
  ownerUid: string;
  category: CategoryId;
  nameHi: string;
  nameEn: string;
  ownerName: string;
  areaHi: string;
  areaEn: string;
  businessPhone: string;
  upiId?: string;
  qrImageUrl?: string;
  isAvailable: boolean;
  isPublished: boolean;
  vehicleType?: string;
  baseFare?: number;
  distanceKm?: number;
  currentToken?: number;
  waitingCount?: number;
  subscriptionTier: SubscriptionTierId;
  subscriptionStatus: 'active' | 'pending' | 'expired';
  items: ProductOrServiceItem[];
  imageUrl?: string;
  fromFirestore?: boolean;
}

export interface BookingRecord {
  id: string;
  customerUid: string;
  customerName: string;
  customerMobile: string;
  listingId: string;
  vendorUid: string;
  listingNameHi: string;
  listingNameEn?: string;
  bookingType: 'auto' | 'queue' | 'order';
  summaryHi: string;
  summaryEn?: string;
  tokenNumber?: string;
  slotTime?: string;
  pickup?: string;
  drop?: string;
  deliveryMode: 'delivery' | 'pickup' | 'onsite';
  paymentMethod: 'upi' | 'cash';
  totalAmount: number;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  requiredDocs?: CscDocumentItem[];
  vendorPhone?: string;
  vendorUpiId?: string;
  vendorQrImageUrl?: string;
  createdAtIso: string;
}

export interface SubscriptionPayment {
  id: string;
  vendorUid: string;
  listingId: string;
  vendorName: string;
  vendorMobile: string;
  planId: SubscriptionTierId;
  amount: number;
  utrNumber: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAtIso: string;
}

export interface AdminUpiConfig {
  adminName: string;
  upiId: string;
  qrImageUrl?: string;
  updatedAtIso: string;
}

export interface CartItem {
  listingId: string;
  listingNameHi: string;
  listingNameEn: string;
  vendorPhone: string;
  vendorUpiId?: string;
  vendorQrImageUrl?: string;
  vendorUid: string;
  item: ProductOrServiceItem;
  quantity: number;
}

export interface VendorSession {
  mobile: string;
  name: string;
  role: 'vendor' | 'driver' | 'admin';
  listingId?: string;
}

export interface AppToast {
  id: string;
  title: string;
  body: string;
  tone: 'success' | 'info' | 'warning';
}
