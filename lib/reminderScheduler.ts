export const sendWhatsAppSummary = (customer: any, businessInfo: any, messagePrefix = '') => {
  try {
    const message = `${messagePrefix}Namaste ${customer.name} 👋\n\nAapka current balance info:\n💰 Total Due: ₹${customer.due}\n🔄 Empty Cans Pending: ${customer.emptyBalance}\n\nDhanyavaad 🙏\n${businessInfo.name}`;
    const encodedMessage = encodeURIComponent(message);
    
    let phone = customer.phone;
    if (phone.length === 10) phone = `91${phone}`;
    else phone = phone.replace(/\D/g, '');

    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    return { success: true };
  } catch (e) {
    console.error('Failed to send WhatsApp summary', e);
    return { success: false, error: e };
  }
};

export const runBulkReminder = async (customers: any[], businessInfo: any) => {
  try {
    let sentCount = 0;
    const dueCustomers = customers.filter(c => c.due > 0);
    
    for (const customer of dueCustomers) {
      sendWhatsAppSummary(customer, businessInfo, '[BULK REMINDER] \n');
      sentCount++;
      await new Promise(res => setTimeout(res, 600)); // Rate limit
    }

    // Save log
    const logs = JSON.parse(localStorage.getItem('bulkReminderLogs') || '[]');
    logs.push({
      id: Date.now(),
      date: new Date().toISOString(),
      sentCount
    });
    localStorage.setItem('bulkReminderLogs', JSON.stringify(logs));
    
    return { success: true, count: sentCount };
  } catch (e) {
    console.error('Bulk reminder failed', e);
    return { success: false };
  }
};

export const checkMonthlyAutoReminder = async (customers: any[], businessInfo: any) => {
  try {
    if (businessInfo.whatsappConfig?.enabled && businessInfo.whatsappConfig.reminderDay) {
      const todayDate = new Date();
      if (todayDate.getDate() === businessInfo.whatsappConfig.reminderDay) {
        const lastSentDate = localStorage.getItem('lastAutoReminderSent');
        const currentDateString = todayDate.toLocaleDateString();
        
        if (lastSentDate !== currentDateString) {
           const dueCustomers = customers.filter(c => c.due > 0);
           if (dueCustomers.length > 0) {
              await runBulkReminder(customers, businessInfo);
              localStorage.setItem('lastAutoReminderSent', currentDateString);
              
              const logs = JSON.parse(localStorage.getItem('reminderLogs') || '[]');
              logs.push({
                id: Date.now(),
                type: 'AUTO_MONTHLY',
                date: new Date().toISOString(),
                count: dueCustomers.length
              });
              localStorage.setItem('reminderLogs', JSON.stringify(logs));
           }
        }
      }
    }
  } catch(e) {
     console.error('Auto reminder check failed', e);
  }
};
