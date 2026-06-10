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
  
  // Header
  doc.setFontSize(20);
  doc.text(businessInfo.name, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Phone: ${businessInfo.phone || 'N/A'}`, 14, 30);
  doc.text(`Address: ${businessInfo.address || 'N/A'}`, 14, 35);
  
  // Invoice Details
  doc.setFontSize(12);
  const invoiceNo = `INV-${Date.now()}`;
  doc.text(`Invoice No: ${invoiceNo}`, 196, 22, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 196, 28, { align: 'right' });
  if (startDate && endDate) {
    doc.text(`Period: ${startDate} to ${endDate}`, 196, 34, { align: 'right' });
  }

  // Customer Details
  doc.setFontSize(14);
  doc.text('Bill To:', 14, 50);
  doc.setFontSize(11);
  doc.text(`Name: ${customer.name}`, 14, 56);
  doc.text(`Phone: ${customer.phone}`, 14, 61);
  doc.text(`Address: ${customer.address || ''}`, 14, 66);

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
  
  // Header
  doc.setFontSize(20);
  doc.text(businessInfo.name, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Phone: ${businessInfo.phone || 'N/A'}`, 14, 30);
  doc.text(`Address: ${businessInfo.address || 'N/A'}`, 14, 35);
  
  // Receipt Details
  doc.setFontSize(15);
  doc.text('PAYMENT RECEIPT', 140, 22);
  
  doc.setFontSize(12);
  const receiptNo = `REC-${payment.id}`;
  doc.text(`Receipt No: ${receiptNo}`, 140, 30);
  doc.text(`Date: ${payment.date}`, 140, 36);

  // Customer Details
  doc.setFontSize(12);
  doc.text(`Received from:`, 14, 50);
  doc.setFontSize(14);
  doc.text(payment.customerName, 14, 56);
  
  doc.setFontSize(12);
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
