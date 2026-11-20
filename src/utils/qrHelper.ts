import QRCode from 'qrcode';

export function buildUpiUri(params: {
  upiId: string;
  payeeName: string;
  amount?: number;
  note?: string;
}): string {
  const pa = encodeURIComponent(params.upiId.trim());
  const pn = encodeURIComponent(params.payeeName.trim() || 'ApnaBazaar');
  const cu = 'INR';
  const amPart = params.amount && params.amount > 0 ? `&am=${params.amount.toFixed(2)}` : '';
  const tnPart = params.note ? `&tn=${encodeURIComponent(params.note)}` : '';
  return `upi://pay?pa=${pa}&pn=${pn}${amPart}&cu=${cu}${tnPart}`;
}

export async function generateUpiQrDataUrl(params: {
  upiId: string;
  payeeName: string;
  amount?: number;
  note?: string;
}): Promise<string> {
  const uri = buildUpiUri(params);
  return QRCode.toDataURL(uri, {
    width: 260,
    margin: 2,
    color: {
      dark: '#14532d',
      light: '#ffffff',
    },
  });
}

/**
 * Compresses an uploaded QR or payment screenshot image to a compact JPEG data URL
 * so it stays safely under Firestore's field size limits (< 350KB).
 */
export function compressImageFile(file: File, maxDim = 560, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
