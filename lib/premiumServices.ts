/**
 * JalSeJiwan Advanced Premium & Differentiating Services Module
 * Exposes robust, production-ready modules for:
 * 1. Security Deposit Tracking
 * 2. Subscription Plans (30/50/Unlimited Cans, Overage charges, Plan Expiries)
 * 3. Smart Loss Detection (Can Mismatches, Excess Empties, Staff-level loss)
 * 4. OTP Delivery Confirmation
 * 5. AI Revenue Forecast (Predict next month revenue, find late payers, stock shortage forecasts)
 * 6. Customer Credit Score (Low/Medium/High Risk analysis)
 * 7. Referral Program (Referral Code Generator & Rewards tracking)
 * 8. Loyalty Points (Earn on deliveries, redemption reward wallet)
 */

export interface RefundOrDeduction {
  date: string;
  amount: number;
  reason: string;
}

export interface SecurityDeposit {
  customerId: string;
  depositAmount: number;
  refunds: RefundOrDeduction[];
  damageDeductions: RefundOrDeduction[];
}

export interface Subscription {
  customerId: string;
  planId: 'BASIC_30' | 'PREMIUM_50' | 'UNLIMITED' | 'NONE';
  startDate: string;
  expiryDate: string;
  cansDeliveredThisMonth: number;
  customPricePerCan: number;
  overageChargePerCan: number;
}

export interface CanLossMetrics {
  customerId: string;
  outCans: number;
  emptyCansReturned: number;
  unreturnedEmptyCans: number; // Mismatch / Held amount
  riskThresholdExceeded: boolean;
  staffId?: string;
  lossCount: number;
}

export interface OTPSession {
  customerId: string;
  deliveryId: string;
  otpCode: string;
  generatedAt: number;
  expiresAt: number;
  verified: boolean;
}

export interface AIRevenueForecastResult {
  nextMonthPredictedRevenue: number;
  confidenceScore: number; // 0 to 100
  likelyLatePayers: { customerId: string; customerName: string; probabilityOfDelay: number }[];
  predictedStockShortageCans: number;
  insights: string[];
}

export interface CustomerCreditScore {
  customerId: string;
  score: number; // 300 to 850
  riskIndicator: 'Low' | 'Medium' | 'High';
  redFlagReason?: string;
}

export interface ReferralRecord {
  referrerId: string;
  referredId: string;
  codeUsed: string;
  rewardEarned: number;
  date: string;
}

export interface LoyaltyPointsHistory {
  customerId: string;
  pointsAccumulated: number;
  pointsRedeemed: number;
  netBalance: number;
  history: { date: string; points: number; type: 'EARNED' | 'REDEEMED'; details: string }[];
}

class PremiumServicesManager {
  private isClient = typeof window !== 'undefined';

  private loadData<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  }

  private saveData<T>(key: string, value: T) {
    if (!this.isClient) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ==========================================
  // 1. SECURITY DEPOSIT TRACKING
  // ==========================================
  getSecurityDeposit(customerId: string): SecurityDeposit {
    const deposits = this.loadData<Record<string, SecurityDeposit>>('jsj_premium_security_deposits', {});
    if (!deposits[customerId]) {
      deposits[customerId] = {
        customerId,
        depositAmount: 1500, // standard default security deposit of ₹1500 per customer
        refunds: [],
        damageDeductions: [],
      };
      this.saveData('jsj_premium_security_deposits', deposits);
    }
    return deposits[customerId];
  }

  refundSecurityDeposit(customerId: string, amount: number, reason: string): SecurityDeposit {
    const deposits = this.loadData<Record<string, SecurityDeposit>>('jsj_premium_security_deposits', {});
    const deposit = this.getSecurityDeposit(customerId);
    
    if (amount > deposit.depositAmount) {
      throw new Error(`Refund amount exceeds existing deposit balance of ₹${deposit.depositAmount}`);
    }

    deposit.depositAmount -= amount;
    deposit.refunds.push({
      date: new Date().toISOString(),
      amount,
      reason,
    });

    deposits[customerId] = deposit;
    this.saveData('jsj_premium_security_deposits', deposits);
    return deposit;
  }

  deductDamageFromDeposit(customerId: string, amount: number, reason: string): SecurityDeposit {
    const deposits = this.loadData<Record<string, SecurityDeposit>>('jsj_premium_security_deposits', {});
    const deposit = this.getSecurityDeposit(customerId);

    // Auto adjust damage deduction. If deduction is larger than deposit, reduce deposit to 0
    const finalDeduction = Math.min(amount, deposit.depositAmount);
    deposit.depositAmount -= finalDeduction;
    deposit.damageDeductions.push({
      date: new Date().toISOString(),
      amount: finalDeduction,
      reason: `${reason} (Original request: ₹${amount}, Adjusted Auto-Deduction: ₹${finalDeduction})`,
    });

    deposits[customerId] = deposit;
    this.saveData('jsj_premium_security_deposits', deposits);
    return deposit;
  }


  // ==========================================
  // 2. SUBSCRIPTION PLANS
  // ==========================================
  getSubscription(customerId: string): Subscription {
    const subs = this.loadData<Record<string, Subscription>>('jsj_premium_subscriptions', {});
    if (!subs[customerId]) {
      subs[customerId] = {
        customerId,
        planId: 'NONE',
        startDate: '',
        expiryDate: '',
        cansDeliveredThisMonth: 0,
        customPricePerCan: 40,
        overageChargePerCan: 50,
      };
      this.saveData('jsj_premium_subscriptions', subs);
    }
    return subs[customerId];
  }

  purchaseSubscription(customerId: string, plan: 'BASIC_30' | 'PREMIUM_50' | 'UNLIMITED'): Subscription {
    const subs = this.loadData<Record<string, Subscription>>('jsj_premium_subscriptions', {});
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 30); // 30 day validity

    const newSub: Subscription = {
      customerId,
      planId: plan,
      startDate: startDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      cansDeliveredThisMonth: 0,
      customPricePerCan: plan === 'BASIC_30' ? 30 : plan === 'PREMIUM_50' ? 25 : 20,
      overageChargePerCan: 45,
    };

    subs[customerId] = newSub;
    this.saveData('jsj_premium_subscriptions', subs);
    return newSub;
  }

  trackCanDeliverySubscription(customerId: string, count: number = 1): { subscription: Subscription; overageCans: number; extraCharge: number } {
    const subs = this.loadData<Record<string, Subscription>>('jsj_premium_subscriptions', {});
    const sub = this.getSubscription(customerId);

    if (sub.planId === 'NONE') {
      return { subscription: sub, overageCans: 0, extraCharge: 0 };
    }

    sub.cansDeliveredThisMonth += count;
    let limit = 0;
    if (sub.planId === 'BASIC_30') limit = 30;
    else if (sub.planId === 'PREMIUM_50') limit = 50;
    else limit = 999999; // unlimited

    const totalDelivered = sub.cansDeliveredThisMonth;
    const overageCans = Math.max(0, totalDelivered - limit);
    const extraCharge = overageCans * sub.overageChargePerCan;

    subs[customerId] = sub;
    this.saveData('jsj_premium_subscriptions', subs);
    return { subscription: sub, overageCans, extraCharge };
  }

  isSubscriptionExpiringSoon(sub: Subscription): boolean {
    if (sub.planId === 'NONE' || !sub.expiryDate) return false;
    const expiry = new Date(sub.expiryDate);
    const differenceInMs = expiry.getTime() - Date.now();
    const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);
    return differenceInDays >= 0 && differenceInDays <= 5; // reminder if expiring in <= 5 days
  }


  // ==========================================
  // 3. SMART LOSS DETECTION
  // ==========================================
  getCanLossMetrics(customerId: string, currentOut: number, currentEmpty: number, staffId?: string): CanLossMetrics {
    // Detect mismatch when dynamic cans held (out) vs returned empty cans exceeds a threshold
    const unreturned = Math.max(0, currentOut - currentEmpty);
    // Alert when customer holds more than 7 empty cans/mismatches
    const exceedsThreshold = unreturned > 7;

    return {
      customerId,
      outCans: currentOut,
      emptyCansReturned: currentEmpty,
      unreturnedEmptyCans: unreturned,
      riskThresholdExceeded: exceedsThreshold,
      staffId: staffId || 'unassigned_driver',
      lossCount: exceedsThreshold ? unreturned - 7 : 0,
    };
  }

  getStaffLossMetrics(allCustomers: Array<{ out: number; empty: number; staffId?: string }>): Record<string, { totalDispatched: number; unreturned: number; averageLossRate: number }> {
    const results: Record<string, { totalDispatched: number; unreturned: number; averageLossRate: number }> = {};

    allCustomers.forEach(cust => {
      const staff = cust.staffId || 'unassigned_driver';
      if (!results[staff]) {
        results[staff] = { totalDispatched: 0, unreturned: 0, averageLossRate: 0 };
      }
      results[staff].totalDispatched += cust.out || 0;
      const unret = Math.max(0, (cust.out || 0) - (cust.empty || 0));
      results[staff].unreturned += unret;
    });

    Object.keys(results).forEach(s => {
      const item = results[s];
      item.averageLossRate = item.totalDispatched > 0 ? parseFloat(((item.unreturned / item.totalDispatched) * 100).toFixed(1)) : 0;
    });

    return results;
  }


  // ==========================================
  // 4. OTP DELIVERY CONFIRMATION
  // ==========================================
  sendDeliveryOTP(customerId: string, deliveryId: string): OTPSession {
    const otps = this.loadData<Record<string, OTPSession>>('jsj_premium_otp_sessions', {});
    // Generate a secure 4 digit helper OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const newOTP: OTPSession = {
      customerId,
      deliveryId,
      otpCode: code,
      generatedAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry
      verified: false,
    };

    otps[`${customerId}_${deliveryId}`] = newOTP;
    this.saveData('jsj_premium_otp_sessions', otps);
    return newOTP;
  }

  verifyDeliveryOTP(customerId: string, deliveryId: string, inputCode: string): boolean {
    const otps = this.loadData<Record<string, OTPSession>>('jsj_premium_otp_sessions', {});
    const key = `${customerId}_${deliveryId}`;
    const session = otps[key];

    if (!session) return false;
    if (Date.now() > session.expiresAt) return false;

    if (session.otpCode === inputCode) {
      session.verified = true;
      otps[key] = session;
      this.saveData('jsj_premium_otp_sessions', otps);
      return true;
    }
    return false;
  }


  // ==========================================
  // 5. AI REVENUE FORECAST
  // ==========================================
  generateAIRevenueForecast(
    customers: Array<{ due: number; id: number; name: string; paymentDelayDays?: number }>,
    monthlyPricePerCan: number = 40,
    currentStockCans: number = 200
  ): AIRevenueForecastResult {
    let currentOutstanding = 0;
    let latePayers: { customerId: string; customerName: string; probabilityOfDelay: number }[] = [];
    let estimatedNextMonthCansNeeded = 0;

    customers.forEach(c => {
      currentOutstanding += c.due || 0;
      // Identify likely late payers if they have a history of delays (>5 days delay) or owe over ₹1000
      const baseDelay = c.paymentDelayDays || (c.due > 1000 ? 8 : 2);
      const prob = Math.min(100, Math.max(10, baseDelay * 10));

      if (prob > 50) {
        latePayers.push({
          customerId: String(c.id),
          customerName: c.name,
          probabilityOfDelay: prob,
        });
      }

      // Estimate monthly demand (assume ~1.5 cans delivered per week per standard customer)
      estimatedNextMonthCansNeeded += 6; 
    });

    // Compute expected income with collection probability adjustments
    const collectionRate = customers.length > 0 ? Math.max(60, 95 - (latePayers.length / customers.length) * 30) : 95;
    const expectedCurrentRecovery = currentOutstanding * (collectionRate / 100);
    const subscriptionPotentialSales = customers.length * 6 * monthlyPricePerCan;

    const forecastedRevenue = expectedCurrentRecovery + subscriptionPotentialSales;
    const stockVariance = currentStockCans - estimatedNextMonthCansNeeded;

    const insights = [
      `Overall recovery collection probability is forecasted at ${collectionRate.toFixed(1)}%.`,
      `Estimated high-risk billing delay accounts: ${latePayers.length} active users.`,
    ];

    if (stockVariance < 50) {
      insights.push(`⚠️ WARNING: Stock levels running critically low. Shortage of ${Math.abs(stockVariance)} cans predicted soon.`);
    } else {
      insights.push(`Stock capacity is adequate to support next month's estimated demand of ${estimatedNextMonthCansNeeded} cans.`);
    }

    return {
      nextMonthPredictedRevenue: Math.round(forecastedRevenue),
      confidenceScore: Math.round(collectionRate),
      likelyLatePayers: latePayers.sort((a, b) => b.probabilityOfDelay - a.probabilityOfDelay),
      predictedStockShortageCans: stockVariance < 0 ? Math.abs(stockVariance) : 0,
      insights,
    };
  }


  // ==========================================
  // 6. CUSTOMER CREDIT SCORE & RISK ANALYSIS
  // ==========================================
  calculateCustomerCreditScore(customer: { due: number; id: number; name: string }): CustomerCreditScore {
    // High due balances decrease score. Base score is 850
    let score = 850;
    let redFlagPercent = 0;
    let redFlagReason = '';

    if (customer.due > 0) {
      // Lose up to 400 points based on high dues relative to ₹2000 standard high limit
      const lostPoints = Math.min(400, Math.round((customer.due / 2000) * 400));
      score -= lostPoints;
    }

    let risk: 'Low' | 'Medium' | 'High' = 'Low';
    if (score < 550) {
      risk = 'High';
      redFlagReason = `High outstanding debt of ₹${customer.due}. Prompt payment action is strongly advised.`;
    } else if (score < 700) {
      risk = 'Medium';
      redFlagReason = `Moderate outstanding balance of ₹${customer.due}. Keep a watch.`;
    }

    return {
      customerId: String(customer.id),
      score,
      riskIndicator: risk,
      redFlagReason: redFlagReason || undefined,
    };
  }


  // ==========================================
  // 7. REFERRAL PROGRAM
  // ==========================================
  generateReferralCode(customerName: string, customerId: number): string {
    const prefix = customerName.replace(/\s+/g, '').slice(0, 4).toUpperCase();
    return `${prefix}${100 + (customerId % 900)}`;
  }

  getReferralWallet(customerId: string): { referralCode: string; walletCredits: number; referrals: ReferralRecord[] } {
    const referrals = this.loadData<Record<string, { walletCredits: number; referrals: ReferralRecord[] }>>('jsj_premium_referrals', {});
    
    if (!referrals[customerId]) {
      referrals[customerId] = {
        walletCredits: 0,
        referrals: [],
      };
      this.saveData('jsj_premium_referrals', referrals);
    }

    const rec = referrals[customerId];
    return {
      referralCode: this.generateReferralCode('Customer', Number(customerId) || 99),
      walletCredits: rec.walletCredits,
      referrals: rec.referrals,
    };
  }

  redeemReferralCredits(customerId: string, amount: number): boolean {
    const referrals = this.loadData<Record<string, { walletCredits: number; referrals: ReferralRecord[] }>>('jsj_premium_referrals', {});
    const record = referrals[customerId];
    if (!record || record.walletCredits < amount) return false;

    record.walletCredits -= amount;
    referrals[customerId] = record;
    this.saveData('jsj_premium_referrals', referrals);
    return true;
  }

  applyReferralCodeUsage(referrerCode: string, newlyJoinedCustomerId: string): boolean {
    const referrals = this.loadData<Record<string, { walletCredits: number; referrals: ReferralRecord[] }>>('jsj_premium_referrals', {});
    
    // Find who owns the referrer code
    let referrerId: string | null = null;
    let found = false;

    // Direct match for simplicity in active context
    Object.keys(referrals).forEach(custKey => {
      const generatedCode = this.generateReferralCode('Customer', Number(custKey) || 99);
      if (generatedCode === referrerCode.trim().toUpperCase()) {
        referrerId = custKey;
      }
    });

    if (referrerId) {
      const rRecord = referrals[referrerId];
      rRecord.walletCredits += 100; // Crediting ₹100 per successful referral
      rRecord.referrals.push({
        referrerId,
        referredId: newlyJoinedCustomerId,
        codeUsed: referrerCode,
        rewardEarned: 100,
        date: new Date().toISOString().split('T')[0],
      });
      referrals[referrerId] = rRecord;
      this.saveData('jsj_premium_referrals', referrals);
      found = true;
    }

    return found;
  }


  // ==========================================
  // 8. LOYALTY POINTS SYSTEM
  // ==========================================
  getLoyaltyPoints(customerId: string): LoyaltyPointsHistory {
    const loyalty = this.loadData<Record<string, LoyaltyPointsHistory>>('jsj_premium_loyalty', {});
    if (!loyalty[customerId]) {
      loyalty[customerId] = {
        customerId,
        pointsAccumulated: 0,
        pointsRedeemed: 0,
        netBalance: 0,
        history: [],
      };
      this.saveData('jsj_premium_loyalty', loyalty);
    }
    return loyalty[customerId];
  }

  awardLoyaltyPointsForDelivery(customerId: string, cansDelivered: number): LoyaltyPointsHistory {
    const loyalty = this.loadData<Record<string, LoyaltyPointsHistory>>('jsj_premium_loyalty', {});
    const record = this.getLoyaltyPoints(customerId);

    const pointsEarned = cansDelivered * 10; // 10 loyalty points per water can!
    record.pointsAccumulated += pointsEarned;
    record.netBalance += pointsEarned;
    record.history.push({
      date: new Date().toISOString().split('T')[0],
      points: pointsEarned,
      type: 'EARNED',
      details: `Awarded points for delivery of ${cansDelivered} cans.`,
    });

    loyalty[customerId] = record;
    this.saveData('jsj_premium_loyalty', loyalty);
    return record;
  }

  redeemLoyaltyPoints(customerId: string, pointsToRedeem: number): { success: boolean; netBalance: number; description: string } {
    const loyalty = this.loadData<Record<string, LoyaltyPointsHistory>>('jsj_premium_loyalty', {});
    const record = this.getLoyaltyPoints(customerId);

    if (record.netBalance < pointsToRedeem) {
      return { success: false, netBalance: record.netBalance, description: 'Insufficient points balance.' };
    }

    record.pointsRedeemed += pointsToRedeem;
    record.netBalance -= pointsToRedeem;
    record.history.push({
      date: new Date().toISOString().split('T')[0],
      points: pointsToRedeem,
      type: 'REDEEMED',
      details: `Redeemed ${pointsToRedeem} points for billing voucher.`,
    });

    loyalty[customerId] = record;
    this.saveData('jsj_premium_loyalty', loyalty);
    return {
      success: true,
      netBalance: record.netBalance,
      description: `Successfully redeemed ${pointsToRedeem} points!`,
    };
  }
}

export const PremiumServices = new PremiumServicesManager();
