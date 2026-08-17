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
