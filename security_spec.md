# ApnaBazaar Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: All unspecified Firestore paths are denied by default (`match /{document=**}`).
2. **Identity Integrity**: Users can only create/update their own `/users/{userId}` document and cannot assign themselves `admin` privileges.
3. **Public Marketplace Read vs Owner Write**: `/listings/{listingId}` is publicly readable only when `isPublished == true` (or by its `ownerUid` or Super Admin). Only the listing owner or Super Admin can update or delete it, and vendors cannot self-approve `subscriptionStatus: 'active'` without Super Admin.
4. **Booking Privacy**: `/bookings/{bookingId}` is strictly isolated to `customerUid`, `vendorUid`, or Super Admin. Once `status` reaches terminal states (`completed` or `cancelled`), non-admins cannot mutate the booking.
5. **Subscription Approval Integrity**: Vendors can only submit `/subscriptions/{subscriptionId}` with `status == 'pending'` for their own `vendorUid`. Only Super Admin (`isAdmin()`) can transition `status` to `'approved'` or `'rejected'`.
6. **Platform UPI Config**: `/platformConfig/admin_upi` is readable by signed-in and public users for subscription QR display, and writable exclusively by Super Admin.
7. **Temporal & Size Bounds**: Every string has strict `.size()` bounds, IDs match `^[a-zA-Z0-9_\-]+$`, and `createdAt`/`updatedAt` strictly equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Role Escalation**: User creates `/users/{uid}` with `role: "admin"` -> Denied (`role` must be in `['customer', 'vendor', 'driver']`).
2. **PII Cross-Read**: User B attempts `get` on `/users/{userA}` -> Denied (`!isOwner && !isAdmin`).
3. **Ghost Shadow Field**: Vendor creates `/listings/{id}` with extra field `isSuperVerified: true` -> Denied (`keys().hasOnly(...)`).
4. **Listing Spoofing**: User B creates `/listings/{id}` with `ownerUid: userA` -> Denied (`ownerUid == request.auth.uid`).
5. **Self-Subscription Activation**: Vendor updates `/listings/{id}` setting `subscriptionStatus: 'active'` -> Denied (not in vendor's `affectedKeys().hasOnly(...)`).
6. **Unverified Admin Email Spoof**: Request with admin email but `email_verified: false` -> Denied (`email_verified == true` required).
7. **Terminal Booking Mutation**: Customer updates a booking whose `existing().status == 'completed'` -> Denied (terminal lock).
8. **Cross-Customer Booking Scraping**: User C queries `/bookings` without matching `customerUid` or `vendorUid` -> Denied (`allow list` enforces `resource.data`).
9. **Vendor Self-Approving Subscription**: Vendor creates `/subscriptions/{id}` with `status: 'approved'` -> Denied (`status == 'pending'` on create).
10. **Admin UPI Hijack**: Non-admin attempts to update `/platformConfig/admin_upi` with attacker's UPI ID -> Denied (`isAdmin()` required).
11. **ID Poisoning**: Creating `/listings/{1.5KB junk string}` -> Denied (`isValidId(listingId)`).
12. **Client Timestamp Tampering**: Creating a booking with backdated `createdAt` != `request.time` -> Denied (`incoming().createdAt == request.time`).
