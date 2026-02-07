"use client";

// Sound Effects System using Web Audio API
// Generates soothing synthesized sounds for UI interactions

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
};

// Base sound creator with envelope
const createSound = (
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.15
) => {
    try {
        const ctx = getAudioContext();

        // Wait for context to be running
        if (ctx.state !== 'running') {
            ctx.resume().then(() => {
                playTone(ctx, frequency, duration, type, volume);
            });
        } else {
            playTone(ctx, frequency, duration, type, volume);
        }
    } catch (e) {
        console.error('Audio error:', e);
    }
};

// Actual tone playback
const playTone = (
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number
) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Smooth envelope for soothing sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
};

// Chord sound (multiple frequencies)
const createChord = (frequencies: number[], duration: number, volume: number = 0.1) => {
    frequencies.forEach((freq, i) => {
        setTimeout(() => createSound(freq, duration, 'sine', volume), i * 30);
    });
};

// ============================================
// SOUND EFFECTS
// ============================================

// Widget Created - Bright, ascending chime
export const playCreateSound = () => {
    createChord([523.25, 659.25, 783.99], 0.4, 0.12); // C5, E5, G5 major chord
    setTimeout(() => createSound(1046.5, 0.3, 'sine', 0.08), 100); // C6 sparkle
};

// Widget Updated - Gentle confirmation tone
export const playUpdateSound = () => {
    createSound(440, 0.15, 'sine', 0.12); // A4
    setTimeout(() => createSound(523.25, 0.2, 'sine', 0.1), 80); // C5
};

// Widget Deleted - Soft descending tone
export const playDeleteSound = () => {
    createSound(392, 0.15, 'sine', 0.1); // G4
    setTimeout(() => createSound(329.63, 0.2, 'sine', 0.08), 70); // E4
    setTimeout(() => createSound(261.63, 0.25, 'sine', 0.06), 140); // C4
};

// New Chat - Welcoming ascending arpeggio
export const playNewChatSound = () => {
    const notes = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
        setTimeout(() => createSound(freq, 0.3, 'sine', 0.1), i * 60);
    });
};

// Add to Chat - Soft click/pop
export const playAddToChatSound = () => {
    createSound(880, 0.08, 'sine', 0.1); // A5 short pop
};

// Widget Select - Gentle tap
export const playSelectSound = () => {
    createSound(659.25, 0.1, 'triangle', 0.08); // E5 soft tap
};

// Success/Complete - Pleasant resolution
export const playSuccessSound = () => {
    createChord([523.25, 659.25, 783.99, 1046.5], 0.5, 0.1); // C major with octave
};

// Error/Warning - Gentle two-tone
export const playErrorSound = () => {
    createSound(349.23, 0.15, 'sine', 0.1); // F4
    setTimeout(() => createSound(329.63, 0.2, 'sine', 0.08), 100); // E4
};

// Message Sent (WhatsApp style) - Quick ascending swoosh
export const playMessageSentSound = () => {
    createSound(523.25, 0.08, 'sine', 0.1); // C5
    setTimeout(() => createSound(659.25, 0.06, 'sine', 0.08), 40); // E5
    setTimeout(() => createSound(783.99, 0.05, 'sine', 0.06), 70); // G5
};

// Message Received (WhatsApp style) - Soft double pop
export const playMessageReceivedSound = () => {
    createSound(880, 0.1, 'triangle', 0.12); // A5 pop
    setTimeout(() => createSound(1046.5, 0.08, 'triangle', 0.1), 80); // C6 higher pop
};

// ============================================
// SOUND STATE MANAGEMENT
// ============================================

let soundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
    soundEnabled = enabled;
    if (typeof window !== 'undefined') {
        localStorage.setItem('soundEnabled', JSON.stringify(enabled));
    }
};

export const getSoundEnabled = (): boolean => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('soundEnabled');
        if (stored !== null) {
            soundEnabled = JSON.parse(stored);
        }
    }
    return soundEnabled;
};

// Wrapper that respects sound settings
export const sounds = {
    create: () => getSoundEnabled() && playCreateSound(),
    update: () => getSoundEnabled() && playUpdateSound(),
    delete: () => getSoundEnabled() && playDeleteSound(),
    newChat: () => getSoundEnabled() && playNewChatSound(),
    addToChat: () => getSoundEnabled() && playAddToChatSound(),
    select: () => getSoundEnabled() && playSelectSound(),
    success: () => getSoundEnabled() && playSuccessSound(),
    error: () => getSoundEnabled() && playErrorSound(),
    messageSent: () => getSoundEnabled() && playMessageSentSound(),
    messageReceived: () => getSoundEnabled() && playMessageReceivedSound(),
};

export default sounds;
