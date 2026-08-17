import { Customer, Delivery, Payment, BusinessInfo } from '@/app/context/AppContext';
import { checkClientRateLimit } from './rateLimit';

const LOGO_BASE64 = 'data:image/png;base64,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';

const loadImageAsBase64 = async (url: string): Promise<string> => {
  if (typeof window === 'undefined') return '';
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Error loading image as base64:", err);
    return '';
  }
};

export const generateInvoicePDF = async (
  customer: Customer,
  deliveries: Delivery[],
  payments: Payment[],
  businessInfo: BusinessInfo,
  startDate?: string,
  endDate?: string
) => {
  if (!customer || !deliveries) return { doc: null, invoiceNo: '' };

  const limitStatus = checkClientRateLimit('pdf_generation', 10, 60);
  if (limitStatus.limited) {
    if (typeof window !== 'undefined') {
      alert(limitStatus.msg || 'Too many PDF generation requests. Please wait a minute.');
    }
    throw new Error('Rate limit exceeded for PDF generation');
  }

  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  
  // --- Custom Premium Header with Business Logo & Contact Details ---
  // Draw official brand logo at top-left
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 14, 16, 16);
    } else {
      doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
    }
  } catch (err) {
    console.error("Failed to add base64 loaded logo, attempting fallback:", err);
    try {
      doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
    } catch (fallbackErr) {
      console.error("Fallback logo failed as well:", fallbackErr);
    }
  }
  
  // Business Info Text
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185); // Theme Blue
  doc.text(businessInfo.name, 34, 21);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  
  const phoneStr = `Phone: ${businessInfo.phone || 'N/A'}`;
  const addressStr = `Address: ${businessInfo.address || 'N/A'}`;
  const gstStr = businessInfo.gstNumber ? `GSTIN: ${businessInfo.gstNumber}` : '';
  
  let contactLine = `${phoneStr}  |  ${addressStr}`;
  if (gstStr) {
    contactLine += `  |  ${gstStr}`;
  }
  doc.text(contactLine, 34, 27);

  // Invoice Details / Header Right
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.text('INVOICE', 196, 20, { align: 'right' });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  const invoiceNo = `INV-${Date.now()}`;
  doc.text(`Invoice No: ${invoiceNo}`, 196, 25, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 196, 29, { align: 'right' });
  if (startDate && endDate) {
    doc.text(`Period: ${startDate} to ${endDate}`, 196, 33, { align: 'right' });
  }

  // Beautiful Accent Divider Line
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  // Customer Details / BILL TO Section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(41, 128, 185);
  doc.text('BILL TO:', 14, 46);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(customer.name, 14, 52);
  doc.setTextColor(110, 110, 110);
  doc.setFontSize(9);
  doc.text(`Phone: ${customer.phone}`, 14, 57);
  doc.text(`Address: ${customer.address || 'N/A'}`, 14, 62);

  // Parse transactions (deliveries and payments)
  let transactions: { date: string, desc: string, qty: number | string, rate: number | string, amount: number, type: string }[] = [];
  
  deliveries.forEach(d => {
    if (d.status?.toLowerCase() === 'delivered') {
       const amount = d.deliveredQty * customer.rate;
       transactions.push({
         date: d.date,
         desc: `Delivery (${d.deliveredQty} cans)`,
         qty: d.deliveredQty,
         rate: customer.rate,
         amount: amount,
         type: 'charge'
       });
     }
  });

  payments.forEach(p => {
     transactions.push({
        date: p.date,
        desc: `Payment Received (${p.mode})`,
        qty: '-',
        rate: '-',
        amount: -p.amount,
        type: 'payment'
     });
  });

  // Sort by date
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let totalDelivered = 0;
  let totalPayments = 0;

  const tableBody = transactions.map(t => {
     if (t.type === 'charge') totalDelivered += t.amount;
     if (t.type === 'payment') totalPayments += Math.abs(t.amount);
     return [
       t.date,
       t.desc,
       t.qty,
       t.rate !== '-' ? `Rs ${t.rate}` : '-',
       t.amount > 0 ? `Rs ${t.amount}` : `- Rs ${Math.abs(t.amount)}`
     ];
  });

  // @ts-ignore
  autoTable(doc, {
    startY: 75,
    head: [['Date', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 75;
  const pageHeight = doc.internal.pageSize.getHeight();
  const summaryHeight = 45;
  const rightX = 196;

  if (finalY + summaryHeight > pageHeight - 15) {
    doc.addPage();
    const newY = 20;
    doc.setFontSize(11);
    doc.text(`Total Delivery Amount: Rs ${totalDelivered}`, rightX, newY + 10, { align: 'right' });
    doc.text(`Total Payments Received: Rs ${totalPayments}`, rightX, newY + 16, { align: 'right' });
    doc.setFontSize(13);
    doc.setTextColor(231, 76, 60);
    doc.text(`Total Outstanding Due: Rs ${customer.due}`, rightX, newY + 24, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 14, newY + 40);
  } else {
    doc.setFontSize(11);
    doc.text(`Total Delivery Amount: Rs ${totalDelivered}`, rightX, finalY + 10, { align: 'right' });
    doc.text(`Total Payments Received: Rs ${totalPayments}`, rightX, finalY + 16, { align: 'right' });
    doc.setFontSize(13);
    doc.setTextColor(231, 76, 60);
    doc.text(`Total Outstanding Due: Rs ${customer.due}`, rightX, finalY + 24, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 14, finalY + 40);
  }
  
  return { doc, invoiceNo };
};

export const generatePaymentReceiptPDF = async (
  payment: Payment,
  businessInfo: BusinessInfo
) => {
  if (!payment) return { doc: null, receiptNo: '' };

  const limitStatus = checkClientRateLimit('pdf_generation', 10, 60);
  if (limitStatus.limited) {
    if (typeof window !== 'undefined') {
      alert(limitStatus.msg || 'Too many PDF generation requests. Please wait a minute.');
    }
    throw new Error('Rate limit exceeded for PDF generation');
  }

  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  
  // --- Custom Premium Header with Business Logo & Contact Details ---
  // Draw official brand logo at top-left
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 14, 16, 16);
    } else {
      doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
    }
  } catch (err) {
    console.error("Failed to add base64 loaded logo, attempting fallback:", err);
    try {
      doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
    } catch (fallbackErr) {
      console.error("Fallback logo failed as well:", fallbackErr);
    }
  }
  
  // Business Info Text
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185); // Theme Blue
  doc.text(businessInfo.name, 34, 21);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  
  const phoneStr = `Phone: ${businessInfo.phone || 'N/A'}`;
  const addressStr = `Address: ${businessInfo.address || 'N/A'}`;
  const gstStr = businessInfo.gstNumber ? `GSTIN: ${businessInfo.gstNumber}` : '';
  
  let contactLine = `${phoneStr}  |  ${addressStr}`;
  if (gstStr) {
    contactLine += `  |  ${gstStr}`;
  }
  doc.text(contactLine, 34, 27);

  // Receipt Details / Header Right
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text('PAYMENT RECEIPT', 196, 20, { align: 'right' });
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  const receiptNo = `REC-${payment.id}`;
  doc.text(`Receipt No: ${receiptNo}`, 196, 25, { align: 'right' });
  doc.text(`Date: ${payment.date}`, 196, 29, { align: 'right' });

  // Beautiful Accent Divider Line
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  // Customer Details / RECEIVED FROM Section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(41, 128, 185);
  doc.text('RECEIVED FROM:', 14, 46);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(payment.customerName, 14, 52);
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(41, 128, 185);
  doc.text('Payment Details:', 14, 75);
  
  const transactions = [
    [payment.date, `Payment via ${payment.mode}`, `Rs ${payment.amount}`]
  ];

  // @ts-ignore
  autoTable(doc, {
    startY: 80,
    head: [['Date', 'Description', 'Amount']],
    body: transactions,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 80;

  doc.setFontSize(14);
  doc.text(`Total Amount Received: Rs ${payment.amount}`, 140, finalY + 15);
  
  doc.setFontSize(10);
  doc.text('Thank you!', 14, finalY + 30);
  
  return { doc, receiptNo };
};

export const generateConsolidatedMonthlyReportPDF = async (
  customers: Customer[],
  deliveries: Delivery[],
  payments: Payment[],
  businessInfo: BusinessInfo
) => {
  if (!customers || !deliveries) return { doc: null };

  const limitStatus = checkClientRateLimit('pdf_generation', 10, 60);
  if (limitStatus.limited) {
    if (typeof window !== 'undefined') {
      alert(limitStatus.msg || 'Too many PDF generation requests. Please wait a minute.');
    }
    throw new Error('Rate limit exceeded for PDF generation');
  }

  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Header Logic (reuse logo/business info logic)
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 14, 16, 16);
    } else {
      doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
    }
  } catch (err) {
    console.error("Failed to add base64 loaded logo, attempting fallback:", err);
    try {
      doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
    } catch (fallbackErr) {
      console.error("Fallback logo failed as well:", fallbackErr);
    }
  }
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185);
  doc.text(businessInfo.name, 34, 21);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Consolidated Operational Report - ${currentMonth}`, 14, 35);

  // Aggregate Data
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthDeliveries = deliveries.filter(d => new Date(d.date) >= monthStart);
  const monthPayments = payments.filter(p => new Date(p.date) >= monthStart);
  
  const totalCans = monthDeliveries.reduce((sum, d) => sum + d.deliveredQty, 0);
  const totalRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDue = customers.reduce((sum, c) => sum + c.due, 0);
  const activeCustomers = customers.filter(c => c.due > 0 || monthDeliveries.some(d => d.customerId === c.id)).length;

  const summaryData = [
    ['Metric', 'Value'],
    ['Total Deliveries (Cans)', totalCans.toString()],
    ['Total Revenue Collected', `Rs ${totalRevenue}`],
    ['Total Outstanding Due', `Rs ${totalDue}`],
    ['Active Customers Served', activeCustomers.toString()],
  ];

  // @ts-ignore
  autoTable(doc, {
    startY: 45,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  return { doc };
};
