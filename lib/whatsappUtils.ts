import { Customer, BusinessInfo, Payment } from '@/app/context/AppContext';

export const shareInvoiceViaWhatsApp = async (
  customer: Customer,
  businessInfo: BusinessInfo,
  invoiceNo: string,
  pdfBlob: Blob
) => {
  const fileName = `Invoice_${customer.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
  
  const message = `Namaste ${customer.name} 👋\n\nAapka JalSejiwan bill ready hai.\n\n📄 Invoice Number: ${invoiceNo}\n💰 Total Due: ₹${customer.due}\n\nKripya PDF dekhkar payment karein.\n\nDhanyavaad 🙏\n${businessInfo.name}`;

  // Try using Web Share API if files are supported (e.g. mobile)
  if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
    try {
      await navigator.share({
        title: `Invoice - ${businessInfo.name}`,
        text: message,
        files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
      });
      return { success: true, method: 'share_api' };
    } catch (e) {
      console.error('Sharing failed', e);
      // Let it fall through to text fallback if user cancelled or error
    }
  }

  // Fallback to text message via wa.me link
  const textMessage = `${message}\n\n(Invoice PDF available offline. Please ask us to resend if needed.)`;
  const encodedMessage = encodeURIComponent(textMessage);
  
  // Format phone number, assuming India +91 if length is 10
  let phone = customer.phone;
  if (phone.length === 10) phone = `91${phone}`;
  else phone = phone.replace(/\D/g, ''); // strip non numeric

  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  return { success: true, method: 'wa_link' };
};

export const sendPaymentReceiptWhatsApp = async (
  payment: Payment,
  customer: Customer,
  businessInfo: BusinessInfo,
  receiptNo: string,
  pdfBlob: Blob
) => {
  const fileName = `Receipt_${receiptNo}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
  
  const message = `Namaste ${payment.customerName} 👋\n\nAapka payment (₹${payment.amount} via ${payment.mode}) receive ho gaya hai.\n\n📄 Receipt No: ${receiptNo}\n💰 Remaining Due: ₹${customer.due}\n\nDhanyavaad 🙏\n${businessInfo.name}`;

  if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
    try {
      await navigator.share({
        title: `Receipt - ${businessInfo.name}`,
        text: message,
        files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
      });
      return { success: true, method: 'share_api' };
    } catch (e) {
      console.error('Sharing failed', e);
    }
  }

  const encodedMessage = encodeURIComponent(message);
  let phone = customer.phone;
  if (phone.length === 10) phone = `91${phone}`;
  else phone = phone.replace(/\D/g, '');

  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  return { success: true, method: 'wa_link' };
};
export const sendReminderWhatsApp = (customer: Customer, businessInfo: BusinessInfo) => {
  const message = `Namaste ${customer.name} 👋\n\nYeh monthly payment reminder hai.\n\n💰 Aapka total due: ₹${customer.due}\n🔄 Pending Empty Cans: ${customer.emptyBalance}\n\nKripya apna due clear karein.\n\nDhanyavaad 🙏\n${businessInfo.name}`;
  
  const encodedMessage = encodeURIComponent(message);
  let phone = customer.phone;
  if (phone.length === 10) phone = `91${phone}`;
  else phone = phone.replace(/\D/g, '');

  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
};
