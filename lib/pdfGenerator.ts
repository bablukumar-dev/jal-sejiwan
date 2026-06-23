import { Customer, Delivery, Payment, BusinessInfo } from '@/app/context/AppContext';
import { checkClientRateLimit } from './rateLimit';

const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAMAAAAOusbgAAAAHlBMVEW90Nu/0dz///8BTbbU4Of0+PiCps+kv9hNgMIjYbn2IWTvAAAACXBIWXMAAC4jAAAuIwF4pT92AAAEUElEQVRo3u2a63akMAiAoRN0fP8XXrWaACEo0bP7Y5OettPq+E0It0Dg5x8NGOABHuABHuABHuABHmA96PZ4D0wpJYyMlOg5mBKCGNuT1x/HH+sXYL7CXl+yL8Aaqz6Ed+0C7YLJxXrU7Y1IveDkz8nj7gsCqQ+cbhB+l9ya8b78qQecXDmymaE94/1VioNTi5kfyi1IfCSEcleKgomvLx4y5Zzjhf4Xn/X+QSgITlyvsDyHSfrkMD6zsvM/KQZOasnYep44kCIHZHfkVWkLuwHGyjiQT1B4kIIty3sKf/uOgEkKubWQV0779y4KgJOyVP1AhBvs85Z0H0yXD1YxA7x7bNcJF7YkTEY91OZxNXNkDZ6kj6hXPdXyKVmlzzeAL2sHfLl41U31uzrBp7GK+VqeOYcLNfdOMLdKMKbLp1gLKHvtEDinMXICxS1sv+aZezRgnlN+ghC4iupFr/K1ZQHhpVsWEBM1SuUxYu/38/miis6GSnatsaPQOH3WMTHh5AghXFx4xkqXK481f/YxoaHQPJh0rLHhi8rsYPkFL0XBoOiCVP3gjPOHzwbMBf39HOOLUvUBVWraB0ZUaQBf4CJsJZoHYBR5VlYctcBC2EyvnoDR0+ki6EPYjjPv8FxQh7ta0FrYShfiWm0ns4egFwnehG2vMXZotQKzR0pBm8KWSV+/AxHbEqFZx5hrjQDsB0vBtScspwxPfbWVWhiaJfQL6ll3JAJHDiEsef29WOAFlXcH5sniYdHKLM0JVyb1MB5b4K8N/r4HNh2XpdK1YsMTsE1uTdiZ8ht59ZZntcCLsTh96W0O6yzqtCW9y/pNMLMpR6cPvVZ52hlHw+CS0+QE6hIsHTa+sHeCGJgL6q+A2ZYmv3wENnKeO8rVBQZrK+6a00t2bAk75kCOtD6cc1ngyVniN8C6vnUnSJwmz6pfv39Ho5OZ3VaZHkuuVU74KDrBTYuamP2IovXjRKCUEi3yVO8oz+1bl3LVKf3+qEnn1dZelb2nA9woqcxyC3O6jkYI7wLbHgFX9Lk/XrHolsQ682qwKoa74szTOua67lFvQp56Lhnr1ovJLmqCrrPFy01o1PWw7kUJH4OsIAadQQLKfo3VIxC0gWV/hdWGvqcGYu2PW1v1VlUxOmOSm7YrrFNP339QrEJve0yoA4e9RWTVG4r0JLBuqKkOMrryYPlx+omBQVe+bbGCbessQ42ACZsdB7P5AeqKiJAU7rTpMjTrpCWUXZQsPGNqggmFY2jK1erDqTI+RZuawBsNXn+Jt3YBZTM73NQs6Q8/hlAsW6iA0ZUBv83mgYlvmXRzVlq1cVoDLwTtteqphAOj41d35c0OO/UcTiDUfXdLd6DFbfqs6+MYlACsHi6KLNI+i7JvXaj75Auhki7C7ZMwmJ4cuTmO+oTOGN077APX56lS+PjLSqVXznPRdrLq9rh3pGscnRvgAR7gAR7g/wj8BzxBWqkgwlZwAAAAAElFTkSuQmCC';

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
  await import('jspdf-autotable');

  const doc = new jsPDF();
  
  // --- Custom Premium Header with Business Logo & Contact Details ---
  // Draw official brand logo at top-left
  doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
  
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
  await import('jspdf-autotable');

  const doc = new jsPDF();
  
  // --- Custom Premium Header with Business Logo & Contact Details ---
  // Draw official brand logo at top-left
  doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
  
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
  await import('jspdf-autotable');

  const doc = new jsPDF();
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Header Logic (reuse logo/business info logic)
  doc.addImage(LOGO_BASE64, 'PNG', 14, 14, 16, 16);
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
  doc.autoTable({
    startY: 45,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  return { doc };
};
