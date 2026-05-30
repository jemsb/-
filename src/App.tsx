/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playCounterSound, triggerVibration, startSilentAudioLoop } from './utils/audioVibe';
import { Smartphone, HelpCircle, X, Check, Volume2, Shield, Info, Keyboard } from 'lucide-react';

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

  // Help modal for browser focus instructions and Native Android Manifest integration guidance
  const [showAndroidGuide, setShowAndroidGuide] = useState<boolean>(false);
  
  // Audio state tracking
  const [audioContextReady, setAudioContextReady] = useState<boolean>(false);

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

  // Global auto-audio activator on user gestures
  const initAudioFeedback = () => {
    if (!audioContextReady) {
      startSilentAudioLoop();
      playCounterSound('up', 'sine');
      triggerVibration('up');
      setAudioContextReady(true);
    }
  };

  // --- HARDWARE VOLUME BUTTON CAPTURE ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key, keyCode } = e;
      const isVolUp = key === 'VolumeUp' || key === 'AudioVolumeUp' || keyCode === 24;
      const isVolDown = key === 'VolumeDown' || key === 'AudioVolumeDown' || keyCode === 25;

      if (isVolUp || isVolDown) {
        e.preventDefault();
        e.stopPropagation();
        
        // Auto-initialize sound if not yet triggered by button clicks
        if (!audioContextReady) {
          startSilentAudioLoop();
          setAudioContextReady(true);
        }

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
  }, [audioContextReady]);

  // --- METADATA ACTION PROVIDER (MEDIA SESSION API) ---
  useEffect(() => {
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
  }, []);

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
    <div 
      onClick={initAudioFeedback}
      className="fixed inset-0 overflow-hidden bg-[#090d16] text-white flex flex-col justify-between p-6 select-none touch-none"
    >
      
      {/* High precision deep space ambient backlit effects */}
      <div className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-indigo-500/10 rounded-full blur-[100px] sm:blur-[130px] -top-20 -left-10 pointer-events-none z-0"></div>
      <div className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-emerald-500/5 rounded-full blur-[100px] sm:blur-[130px] -bottom-20 -right-10 pointer-events-none z-0"></div>

      {/* TOP HEADER STEP CONTROLLER & HELP BUTTON */}
      <header 
        className="w-full max-w-sm mx-auto flex items-center justify-between gap-3 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-2xl flex-1 justify-center">
          <label htmlFor="increment-step-input" className="text-xs font-mono text-white/40 uppercase font-black tracking-widest whitespace-nowrap">
            Step:
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
            className="w-14 bg-[#090d16]/60 border border-white/10 text-white font-mono font-black text-center focus:ring-1 focus:ring-white/30 focus:border-white/30 rounded-xl py-1 px-2.5 transition-all outline-none"
            min="1"
            title="Increment Step Amount"
          />
        </div>

        {/* Dynamic Help & Manifest Guidance trigger */}
        <button
          onClick={() => {
            initAudioFeedback();
            setShowAndroidGuide(true);
          }}
          className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-indigo-300 shadow-xl cursor-pointer"
          title="See Android Permission Manifest & Setup Guide"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      {/* CORE MASSIVE DISPLAY (Absolutely no tap-to-count clicks) */}
      <main 
        className="flex-1 flex flex-col justify-center items-center select-none z-10 w-full relative"
        title="Volume keys active. Ensure window has focus. Click help guide for information."
      >
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center pointer-events-none w-full px-4 text-center">
          
          {/* Dynamically clamped, multi-length resilient visual counter box */}
          <div className="relative h-[25vh] md:h-[35vh] flex items-center justify-center overflow-hidden w-full max-w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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
            className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-white/35 uppercase font-black text-center mt-6 flex flex-col gap-1"
          >
            <span>PRESS PHYSICAL VOLUME KEYS TO COUNT</span>
            <span className="text-[9px] text-[#818cf8] font-bold tracking-normal leading-normal select-none">
              (Click inside this screen once to enable focus)
            </span>
          </motion.div>
        </div>
      </main>

      {/* SECURE FOOTER BAR (Reset option & secure status indicator) */}
      <footer 
        className="w-full max-w-sm mx-auto flex justify-between items-center text-[10px] font-mono text-white/30 z-20 border-t border-white/5 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>KEYS CONNECTED</span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            initAudioFeedback();
            handleReset();
          }}
          className="hover:text-rose-400 active:scale-95 transition-all uppercase tracking-widest font-black px-3 py-1.5 selection:bg-transparent cursor-pointer hover:bg-white/5 rounded-xl border border-white/5 active:bg-rose-500/10 active:border-rose-500/20 text-[9px]"
        >
          Reset
        </button>
      </footer>

      {/* ANDROID MANIFEST & NATIVE INTERCEPT INTEGRATION GUIDE DIALOG */}
      <AnimatePresence>
        {showAndroidGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowAndroidGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Smartphone className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-wide uppercase">Native Android Guide</span>
                </div>
                <button
                  onClick={() => setShowAndroidGuide(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable instructions */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 font-sans text-xs text-white/70 leading-relaxed scrollbar-thin">
                <div>
                  <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    Why "Grant Permission" was quiet
                  </h3>
                  <p>
                    On standard browsers (like Chrome or Safari) and inside iframes, security guidelines do not have a standard "Volume Up/Down OS Permission" dialog. By default, browsers prevent any code from capturing keys or playing audio until you touch/click inside the page. 
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider font-mono">
                    <Keyboard className="w-4 h-4 text-emerald-400" />
                    How to test in browser
                  </h4>
                  <p>
                    Simply **click once anywhere inside the tally screen** of the preview window. This shifts the browser keyboard focus to your application and instantly enables tactile audio and haptic feedback. Then, press your physical volume buttons to increment or decrement the counter!
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm mb-1">
                    How it works in a Real Android App
                  </h3>
                  <p>
                    When you run this inside a hybrid wrapper app (like **Capacitor / Cordova / WebView**) or build a Native Android Wrapper, you don't need any special user prompt! Instead, you set a manifest entry and override the default physical volume controller.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="font-bold text-white/90 text-xs block font-mono">1. AndroidManifest.xml Entry:</span>
                    <p className="text-[11px] text-white/50">
                      Standard web apps don't need a specific manifest entry to listen to general keydown events, but a Native Android activity intercept is declared like this:
                    </p>
                    <pre className="bg-[#020617] border border-white/5 text-[10px] text-indigo-200 p-2.5 rounded-xl font-mono overflow-x-auto w-full">
{`<activity 
  android:name=".MainActivity"
  android:configChanges="orientation|screenSize|keyboardHidden">
</activity>`}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-white/90 text-xs block font-mono">2. MainActivity App Override (Java/Kotlin):</span>
                    <p className="text-[11px] text-white/50">
                      To fully intercept the volume buttons in your wrapper and prevent the Android OS Volume HUD Slider from appearing on screen, you override standard volume events like this:
                    </p>
                    <pre className="bg-[#020617] border border-white/5 text-[10px] text-emerald-200 p-2.5 rounded-xl font-mono overflow-x-auto w-full">
{`@Override
public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
        // Increment command sent to your code
        webView.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown', {'key':'VolumeUp'}));", null);
        return true; // Prevents the OS volume bar from showing
    } else if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
        // Decrement command sent to your code
        webView.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown', {'key':'VolumeDown'}));", null);
        return true; // Prevents the OS volume bar from showing
    }
    return super.onKeyDown(keyCode, event);
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-end">
                <button
                  onClick={() => setShowAndroidGuide(false)}
                  className="bg-white text-[#090d16] font-bold text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer hover:bg-zinc-100 transition-all"
                >
                  Got It, Thanks!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
