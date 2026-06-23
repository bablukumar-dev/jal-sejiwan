export const generatePdfFromCustomer = async (customerId: any, customers: any[], deliveries: any[], payments: any[], businessInfo: any) => {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) throw new Error('Customer not found');
  
  const customerDeliveries = deliveries.filter(d => d.customerId === customerId);
  const customerPayments = payments.filter(p => p.customerId === customerId);
  
  const { generateInvoicePDF } = await import('@/lib/pdfGenerator');
  const { doc, invoiceNo } = await generateInvoicePDF(customer, customerDeliveries, customerPayments, businessInfo);
  
  if (!doc) {
    throw new Error('Could not instantiate PDF document.');
  }
  
  // Create a log in localStorage
  try {
    const history = JSON.parse(localStorage.getItem('pdfHistory') || '[]');
    history.push({
      id: Date.now(),
      customerId,
      date: new Date().toISOString(),
      invoiceNo
    });
    localStorage.setItem('pdfHistory', JSON.stringify(history));
  } catch(e) {
    console.error('Failed to save pdfHistory', e);
  }

  // Save locally
  doc.save(`Invoice_${customer.name}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`);
  return { success: true, invoiceNo };
};
