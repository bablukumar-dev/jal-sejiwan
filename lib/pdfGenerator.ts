import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Customer, Delivery, Payment, BusinessInfo } from '@/app/context/AppContext';

export const generateInvoicePDF = (
  customer: Customer,
  deliveries: Delivery[],
  payments: Payment[],
  businessInfo: BusinessInfo,
  startDate?: string,
  endDate?: string
) => {
  const doc = new jsPDF();
  
  // --- Custom Premium Header with Business Logo & Contact Details ---
  // Draw premium vector water droplet logo inside a blue circle
  doc.setFillColor(41, 128, 185); // Theme Blue
  doc.circle(22, 22, 8, 'F');
  
  doc.setFillColor(255, 255, 255);
  // Triangle pointing up for droplet
  doc.triangle(18.5, 23, 25.5, 23, 22, 16.5, 'F');
  // Small white circle for droplet base
  doc.circle(22, 23, 3.5, 'F');
  
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
  doc.autoTable({
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

export const generatePaymentReceiptPDF = (
  payment: Payment,
  businessInfo: BusinessInfo
) => {
  const doc = new jsPDF();
  
  // --- Custom Premium Header with Business Logo & Contact Details ---
  // Draw premium vector water droplet logo inside a blue circle
  doc.setFillColor(41, 128, 185); // Theme Blue
  doc.circle(22, 22, 8, 'F');
  
  doc.setFillColor(255, 255, 255);
  // Triangle pointing up for droplet
  doc.triangle(18.5, 23, 25.5, 23, 22, 16.5, 'F');
  // Small white circle for droplet base
  doc.circle(22, 23, 3.5, 'F');
  
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
  doc.autoTable({
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
