/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playCounterSound, triggerVibration, startSilentAudioLoop } from './utils/audioVibe';
import { ShieldCheck, Smartphone, Volume2, Vibrate, CheckCircle, HelpCircle } from 'lucide-react';

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

  // Transient state for hardware volume key routing authorization.
  // Modern browsers strictly require direct user interaction before claiming audio contexts & MediaSession controls.
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

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
    if (!isAuthorized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key, keyCode } = e;
      const isVolUp = key === 'VolumeUp' || key === 'AudioVolumeUp' || keyCode === 24;
      const isVolDown = key === 'VolumeDown' || key === 'AudioVolumeDown' || keyCode === 25;

      if (isVolUp || isVolDown) {
        e.preventDefault();
        e.stopPropagation();
        if (isVolUp) {
          incrementRef.current();
        } else {
          decrementRef.current();
        }
      }
    };

    // Prevent default on keyup too! This is essential to block system volume popup on release
    const handleKeyUp = (e: KeyboardEvent) => {
      const { key, keyCode } = e;
      const isVolUp = key === 'VolumeUp' || key === 'AudioVolumeUp' || keyCode === 24;
      const isVolDown = key === 'VolumeDown' || key === 'AudioVolumeDown' || keyCode === 25;

      if (isVolUp || isVolDown) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', handleKeyUp, { capture: true, passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [isAuthorized]);

  // --- METADATA ACTION PROVIDER (MEDIA SESSION API) ---
  useEffect(() => {
    if (!isAuthorized) return;

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Physical Volume Tally Connected',
          artist: 'Tactile Web Interceptor',
          album: 'Single Handed Counter',
        });

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
  }, [isAuthorized]);

  // Handle explicit session activation (satisfying browser gesture rules)
  const handleActivateSession = () => {
    startSilentAudioLoop();
    playCounterSound('up', 'sine');
    triggerVibration('up');
    setIsAuthorized(true);
  };

  // Dynamically calculate font size based on value length to prevent overflow across all mobile viewports
  const getFontSize = (val: number) => {
    const len = val.toString().length;
    if (len >= 8) return 'clamp(3rem, 11vw, 5.5rem)';
    if (len >= 6) return 'clamp(4rem, 15vw, 8rem)';
    if (len >= 5) return 'clamp(5rem, 18vw, 10rem)';
    if (len >= 4) return 'clamp(6rem, 23vw, 13rem)';
    return 'clamp(8rem, 32vw, 17rem)';
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#090d16] text-white flex flex-col justify-between p-6 select-none touch-none">
      
      {/* High precision deep space ambient backlight elements */}
      <div className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-indigo-500/10 rounded-full blur-[100px] sm:blur-[130px] -top-20 -left-10 pointer-events-none z-0"></div>
      <div className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-emerald-500/5 rounded-full blur-[100px] sm:blur-[130px] -bottom-20 -right-10 pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {!isAuthorized ? (
          /* HIGH POLISH DEVICE KEYBOARD PERMISSION REQUEST PANEL */
          <motion.div
            key="permission-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 flex flex-col justify-center items-center z-30 px-4 w-full"
          >
            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
              {/* Backlit active target element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                
                {/* Physical Device Icon Ring */}
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-inner animate-pulse">
                  <Smartphone className="w-7 h-7 text-indigo-300" />
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight mb-3">
                  Hardware Key Access
                </h2>
                
                <p className="text-sm text-white/60 leading-relaxed mb-6 font-sans">
                  Android secure architectures require explicit permission to route physical volume signals to the page and suppress the system sound overlay.
                </p>

                {/* Simulated Permission Requirement Guidelines */}
                <div className="w-full space-y-3 bg-white/5 rounded-2xl p-4 border border-white/5 text-left mb-6 font-mono text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Safe local keyboard routing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-white/50 shrink-0" />
                    <span>Silent background audio channel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-white/50 shrink-0" />
                    <span>Haptic vibration lock</span>
                  </div>
                </div>

                {/* Glowing Permission Grant Button */}
                <button
                  id="btn-grant-permission"
                  onClick={handleActivateSession}
                  className="w-full bg-white text-[#090d16] font-bold text-sm uppercase py-4 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95 select-none"
                >
                  <CheckCircle className="w-4 h-4" />
                  Grant Permission
                </button>

              </div>
            </div>
          </motion.div>
        ) : (
          /* MINIMAL ACTIVE SCREEN: STYLISH PORTRAIT TEXT & STEP INPUT ONLY */
          <motion.div
            key="counter-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col justify-between h-full w-full"
          >
            {/* TOP HEADER STEP CONTROLLER */}
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

            {/* CORE MASSIVE DISPLAY (Absolutely no tap-to-count clicks) */}
            <main 
              className="flex-1 flex flex-col justify-center items-center select-none z-10 w-full relative"
              title="Volume keys active. Press Volume Up to count up, Volume Down to count down."
            >
              <div className="absolute inset-0 bg-transparent pointer-events-none" />
              
              <div className="flex flex-col items-center justify-center pointer-events-none w-full px-4 text-center">
                
                {/* Dynamically clamped, multi-length resilient visual counter box */}
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

                {/* Tactile Assistive User Cue */}
                <motion.div 
                  animate={{ opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-white/35 uppercase font-black text-center mt-6"
                >
                  PRESS PHYSICAL VOLUME KEYS TO COUNT
                </motion.div>
              </div>
            </main>

            {/* SECURE FOOTER BAR (Reset option & secure status indicator) */}
            <footer 
              className="w-full max-w-sm mx-auto flex justify-between items-center text-[10px] font-mono text-white/30 z-20 border-t border-white/5 pt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>INTERCEPT LIVE</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="hover:text-rose-400 active:scale-95 transition-all uppercase tracking-widest font-black px-3 py-1.5 selection:bg-transparent cursor-pointer hover:bg-white/5 rounded-xl border border-white/5 active:bg-rose-500/10 active:border-rose-500/20 text-[9px]"
              >
                Reset
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
