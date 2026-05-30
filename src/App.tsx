/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playCounterSound, triggerVibration } from './utils/audioVibe';

export default function App() {
  const [value, setValue] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('android-tally-value');
      return saved ? parseInt(saved) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });

  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('android-tally-step');
      return saved ? parseInt(saved) || 1 : 1;
    } catch (e) {
      return 1;
    }
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('android-tally-value', String(value));
  }, [value]);

  useEffect(() => {
    localStorage.setItem('android-tally-step', String(step));
  }, [step]);

  // --- MUTATORS ---
  const handleIncrement = () => {
    setValue((v) => {
      const nextVal = v + step;
      playCounterSound('up', 'sine');
      triggerVibration('up');
      return nextVal;
    });
  };

  const handleDecrement = () => {
    setValue((v) => {
      const nextVal = Math.max(0, v - step);
      playCounterSound('down', 'sine');
      triggerVibration('down');
      return nextVal;
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset counter to 0?')) {
      setValue(0);
      playCounterSound('reset', 'sine');
      triggerVibration('reset');
    }
  };

  // Sync state to mutable refs for immediate event updates outside stale React closure state
  const incrementRef = useRef(handleIncrement);
  const decrementRef = useRef(handleDecrement);

  useEffect(() => {
    incrementRef.current = handleIncrement;
    decrementRef.current = handleDecrement;
  });

  // --- HARDWARE VOLUME BUTTON CAPTURE ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key, keyCode } = e;
      const isVolUp = key === 'VolumeUp' || key === 'AudioVolumeUp' || keyCode === 24;
      const isVolDown = key === 'VolumeDown' || key === 'AudioVolumeDown' || keyCode === 25;

      if (isVolUp || isVolDown) {
        e.preventDefault();
        if (isVolUp) {
          incrementRef.current();
        } else {
          decrementRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // --- METADATA ACTION PROVIDER (MEDIA SESSION API FOR BG COUNTS) ---
  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('volumeup' as any, () => {
          incrementRef.current();
        });
        navigator.mediaSession.setActionHandler('volumedown' as any, () => {
          decrementRef.current();
        });
      } catch (err) {
        console.warn('Skipped Navigator MediaSession actions setup:', err);
      }
    }
    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('volumeup' as any, null);
          navigator.mediaSession.setActionHandler('volumedown' as any, null);
        } catch (e) {}
      }
    };
  }, []);

  // Dynamically calculate font size to prevent overflow for huge numbers on smaller screens
  const getFontSize = (val: number) => {
    const len = val.toString().length;
    if (len >= 8) return 'clamp(3rem, 11vw, 5rem)';
    if (len >= 6) return 'clamp(4rem, 15vw, 7.5rem)';
    if (len >= 5) return 'clamp(5rem, 18vw, 9.5rem)';
    if (len >= 4) return 'clamp(6rem, 23vw, 12rem)';
    return 'clamp(7.5rem, 30vw, 16rem)';
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#090d16] text-white flex flex-col justify-between p-6 select-none touch-none">
      
      {/* High precision atmospheric backing ambient gradients */}
      <div className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-indigo-500/5 rounded-full blur-[100px] sm:blur-[130px] -top-20 -left-10 pointer-events-none z-0"></div>
      <div className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-emerald-500/5 rounded-full blur-[100px] sm:blur-[130px] -bottom-20 -right-10 pointer-events-none z-0"></div>

      {/* TOP HEADER CONTROLLER (Minimal glass stepper with non-propagating clicks) */}
      <header 
        className="w-full max-w-sm mx-auto flex justify-center z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-2xl">
          <label htmlFor="increment-step-input" className="text-xs font-mono text-white/40 uppercase font-black tracking-widest whitespace-nowrap">
            Count Step:
          </label>
          <input
            id="increment-step-input"
            type="number"
            value={step}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              setStep(val);
            }}
            onFocus={(e) => e.target.select()}
            className="w-16 bg-[#090d16]/60 border border-white/10 text-white font-mono font-black text-center focus:ring-1 focus:ring-white/30 focus:border-white/30 rounded-xl py-1 px-2.5 transition-all outline-none"
            min="1"
            title="Increment Step Amount"
          />
        </div>
      </header>

      {/* CORE MASSIVE COUNT VIEWER (Active Information Area only - No tapping trigger) */}
      <main 
        className="flex-1 flex flex-col justify-center items-center select-none z-10 w-full relative"
        title="Volume keys active. Press Volume Up to count up, Volume Down to count down."
      >
        {/* Decorative central overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center pointer-events-none w-full px-4 text-center">
          
          {/* Fluid display box accommodating any mobile orientation/width perfectly */}
          <div className="relative h-[25vh] md:h-[35vh] flex items-center justify-center overflow-hidden w-full max-w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 70, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -70, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 220, damping: 25 }}
                style={{ fontSize: getFontSize(value) }}
                className="absolute font-mono font-black tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.12)] selection:bg-transparent leading-none"
              >
                {value}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Interactive tactile assistive label */}
          <motion.div 
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-white/35 uppercase font-black text-center mt-6"
          >
            PRESS PHYSICAL VOLUME KEYS TO COUNT
          </motion.div>
        </div>
      </main>

      {/* FOOTER BAR (Reset option & information) */}
      <footer 
        className="w-full max-w-sm mx-auto flex justify-between items-center text-[10px] font-mono text-white/30 z-20 border-t border-white/5 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="tracking-wide">VOL KEYS INTEGRATED</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="hover:text-rose-400 active:scale-95 transition-all uppercase tracking-widest font-black px-3 py-1.5 selection:bg-transparent cursor-pointer hover:bg-white/5 rounded-xl border border-white/5 active:bg-rose-500/10 active:border-rose-500/20"
        >
          Reset
        </button>
      </footer>

    </div>
  );
}
