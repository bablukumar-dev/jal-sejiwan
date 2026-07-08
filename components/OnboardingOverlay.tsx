'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { getFirebase } from '@/src/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface OnboardingOverlayProps {
  onClose: () => void;
}

export default function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
  const { currentUser } = useAppContext();
  const [step, setStep] = useState(1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Define steps configuration
  const steps = [
    {
      step: 1,
      title: "Welcome to Your Water Delivery Management System",
      description: "JalSejiwan helps you manage customer records, track daily water delivery drops, monitor cylinder inventory, and record payments efficiently.",
      targetId: null,
      tooltip: null
    },
    {
      step: 2,
      title: "Add your first customer",
      description: "Start by adding your first customer.",
      targetId: "onboarding-add-customer",
      tooltip: "Start by adding your first customer."
    },
    {
      step: 3,
      title: "Record your first delivery",
      description: "Record your daily deliveries here.",
      targetId: "onboarding-deliveries",
      tooltip: "Record your daily deliveries here."
    },
    {
      step: 4,
      title: "Track payments",
      description: "Track dues and collect payments easily.",
      targetId: "onboarding-payments",
      tooltip: "Track dues and collect payments easily."
    },
    {
      step: 5,
      title: "You're ready!",
      description: "Explore the dashboards, setup delivery routes, manage your staff, and drive efficiency in your water delivery business.",
      targetId: null,
      tooltip: null
    }
  ];

  const currentStepData = steps[step - 1];

  // Update highlight bounding box when active step changes
  useEffect(() => {
    const activeTargetId = currentStepData.targetId;

    const updatePosition = () => {
      const el = activeTargetId ? document.getElementById(activeTargetId) : null;
      if (el) {
        // Scroll into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Set exact box coordinates
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    // Delay slightly to allow any scrolling/rendering to finalize
    const timer = setTimeout(updatePosition, 100);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step, currentStepData.targetId]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    if (typeof window === 'undefined') return;

    if (currentUser) {
      try {
        const { db } = getFirebase();
        if (db) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            dashboardTourCompleted: true,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to update dashboardTourCompleted in Firestore:", err);
      }
    }

    const ownerId = localStorage.getItem('ownerId');
    if (ownerId) {
      localStorage.setItem(`onboardingCompleted_${ownerId}`, 'true');
    }
    // Close overlay state
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none" id="onboarding-overlay-root">
      {/* Spotlight highlight backdrop */}
      {rect ? (
        <>
          {/* Custom absolute mask div using border-shadow spotlight */}
          <div
            className="fixed z-[9998] rounded-2xl pointer-events-none transition-all duration-300 border-2 border-blue-500 bg-transparent ring-4 ring-blue-500/30"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
            }}
          />
          {/* Capture outside clicks to prevent background interference */}
          <div className="fixed inset-0 z-[9997] bg-transparent pointer-events-auto" />
        </>
      ) : (
        /* Full flat dark backdrop for screens without highlighted elements */
        <div className="fixed inset-0 z-[9997] bg-slate-900/75 backdrop-blur-sm transition-opacity duration-300" />
      )}

      {/* Main Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              id="onboarding-welcome-modal"
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative pointer-events-auto"
            >
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
                id="onboarding-welcome-close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
                <Droplet className="w-8 h-8 fill-current" />
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Quick Start Onboarding</span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
                {currentStepData.title}
              </h2>

              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {currentStepData.description}
              </p>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  id="onboarding-welcome-next"
                >
                  <span>Start Guide</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-semibold py-2 px-6 rounded-xl transition-all active:scale-[0.98]"
                  id="onboarding-welcome-skip"
                >
                  Skip Guide
                </button>
              </div>
            </motion.div>
          )}

          {(step === 2 || step === 3 || step === 4) && (
            <motion.div
              key={`step-${step}`}
              id={`onboarding-step-${step}-modal`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 w-full max-w-sm absolute pointer-events-auto flex flex-col"
              style={{
                // Beautifully position at lower third of screen on mobile
                bottom: '10%'
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
                  Step {step - 1} of 4
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {step - 1}/4
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                {currentStepData.title}
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {currentStepData.tooltip}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((step - 1) / 4) * 100}%` }}
                />
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleSkip}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  id={`onboarding-step-${step}-skip`}
                >
                  Skip
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 active:scale-95"
                    id={`onboarding-step-${step}-back`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleNext}
                    className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-blue-500/15 active:scale-95"
                    id={`onboarding-step-${step}-next`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step-5"
              id="onboarding-finish-modal"
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative pointer-events-auto"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                <span>Setup Complete</span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
                {currentStepData.title}
              </h2>

              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {currentStepData.description}
              </p>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleNext}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
                  id="onboarding-finish-action"
                >
                  <span>Finish & Explore</span>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleBack}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-semibold py-2 px-6 rounded-xl transition-all active:scale-[0.98]"
                  id="onboarding-finish-back"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
