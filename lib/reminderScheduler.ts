import { logActivity } from './activityLogger';

export const sendWhatsAppSummary = (customer: any, businessInfo: any, messagePrefix = '') => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const logKey = `reminder_${customer.id}_${todayStr}`;
    if (localStorage.getItem(logKey)) {
      console.log(`Reminder already sent to ${customer.name} today.`);
      return { success: false, reason: 'Duplicate reminder same day' };
    }

    const message = `${messagePrefix}Namaste ${customer.name} 👋\n\nAapka current balance info:\n💰 Total Due: ₹${customer.due}\n🔄 Empty Cans Pending: ${customer.emptyBalance}\n\nDhanyavaad 🙏\n${businessInfo.name}`;
    const encodedMessage = encodeURIComponent(message);
    
    let phone = customer.phone;
    if (phone.length === 10) phone = `91${phone}`;
    else phone = phone.replace(/\D/g, '');

    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    
    // Prevent duplicate
    localStorage.setItem(logKey, 'sent');
    
    logActivity('reminder_sent', `Sent WhatsApp reminder to ${customer.name}`, { customerId: customer.id, due: customer.due });

    return { success: true };
  } catch (e) {
    console.error('Failed to send WhatsApp summary', e);
    return { success: false, error: e };
  }
};

export const runBulkReminder = async (customers: any[], businessInfo: any) => {
  try {
    let sentCount = 0;
    
    const now = new Date();
    // Filter customers who have due and calculate their due age
    const dueCustomers = customers.filter(c => c.due > 0 && c.lastDelivery);
    
    for (const customer of dueCustomers) {
      const lastDelDate = new Date(customer.lastDelivery);
      const diffTime = Math.abs(now.getTime() - lastDelDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      let levelPrefix = '';
      if (diffDays >= 15) {
        levelPrefix = '[FINAL NOTICE - Action Required] \n';
      } else if (diffDays >= 7) {
        levelPrefix = '[MEDIUM REMINDER] \n';
      } else if (diffDays >= 3) {
        levelPrefix = '[SOFT REMINDER] \n';
      } else {
        continue; // Do not remind if under 3 days since last delivery
      }

      const res = sendWhatsAppSummary(customer, businessInfo, levelPrefix);
      if (res.success) {
        sentCount++;
      }
      await new Promise(resTimer => setTimeout(resTimer, 800)); // Rate limit 800ms between opens
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
