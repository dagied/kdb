import QRCode from 'qrcode';

export async function generateQRCode(data) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

export function generateQRData(resident) {
  return {
    id: resident.id_number,
    name: resident.full_name,
    father: resident.father_name,
    birth: resident.birth_date_gc,
    issue: resident.issue_date_gc,
    expiry: resident.expiry_date_gc,
    kebele: resident.kebele_name
  };
}