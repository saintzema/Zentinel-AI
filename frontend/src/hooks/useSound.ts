import { useRef, useCallback } from 'react';

type SoundType =
    | 'activation'
    | 'deactivation'
    | 'detection'
    | 'alert_high'
    | 'tracking'
    | 'ui_beep';

interface UseSoundOptions {
    volume?: number;
    enabled?: boolean;
}

export function useSound(options: UseSoundOptions = {}) {
    const { volume = 0.5, enabled = true } = options;
    const audioCtxRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    // Synthesized beep as fallback
    const playBeep = useCallback((type: SoundType) => {
        try {
            const audioCtx = getAudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            // Different frequencies for different sounds
            const frequencies: Record<SoundType, number> = {
                activation: 120, // Low rumble start
                deactivation: 440,
                detection: 1200,
                alert_high: 1600,
                tracking: 600,
                ui_beep: 800
            };

            if (type === 'activation') {
                // HACKING / COMPUTING SOUND "TRIRIRIIRIRI"
                // Rapid sequence of beeps (Arpeggio)
                const now = audioCtx.currentTime;
                const baseFreq = 800;
                const steps = 8;
                const speed = 0.08; // Fast 

                for (let i = 0; i < steps; i++) {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();

                    osc.type = 'square'; // Computer-like tone
                    // Alternate frequencies
                    osc.frequency.value = baseFreq + (i % 2 === 0 ? 0 : 400) + (i * 100);

                    osc.connect(gain);
                    gain.connect(audioCtx.destination);

                    const startTime = now + (i * speed);
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.01); // Lower volume
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + speed - 0.01);

                    osc.start(startTime);
                    osc.stop(startTime + speed);
                }

                // "TIM TIM" - Final confirmation tones
                setTimeout(() => {
                    const ctx = getAudioContext(); // Reuse same context
                    const now2 = ctx.currentTime;
                    [1200, 1800].forEach((freq, idx) => {
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sine';
                        o.frequency.value = freq;
                        o.connect(g);
                        g.connect(ctx.destination);

                        const t = now2 + (idx * 0.2);
                        g.gain.setValueAtTime(0, t);
                        g.gain.linearRampToValueAtTime(volume * 0.2, t + 0.05);
                        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

                        o.start(t);
                        o.stop(t + 0.3);
                    });
                }, steps * speed * 1000 + 100);

                return;
            }

            // Standard Beeps
            oscillator.frequency.value = frequencies[type] || 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

            oscillator.connect(gainNode);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
        } catch (err) {
            console.warn('Audio synthesis failed:', err);
        }
    }, [volume, getAudioContext]);

    const playSound = useCallback((type: SoundType) => {
        if (!enabled) return;
        // Force synthesized sound for reliability
        playBeep(type);
    }, [enabled, playBeep]);

    const setVolume = useCallback((_newVolume: number) => {
        // Placeholder if needed later
    }, []);

    const stopAll = useCallback(() => {
        if (audioCtxRef.current) {
            audioCtxRef.current.suspend();
        }
    }, []);

    return {
        playSound,
        setVolume,
        stopAll,
        speaking: false // For future voice integration
    };
}
