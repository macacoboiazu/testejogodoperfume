class SoundEffects {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.mainGainNode = this.audioContext.createGain();
        this.mainGainNode.gain.value = 0.3;
        this.mainGainNode.connect(this.audioContext.destination);
    }

    playJumpSound() {
        // Som de pulo estilo 8-bit
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            600, this.audioContext.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, this.audioContext.currentTime + 0.2
        );

        oscillator.connect(gainNode);
        gainNode.connect(this.mainGainNode);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    playBreakSound() {
        // Som de quebra de vidro estilo 8-bit
        const duration = 0.3;
        const pieces = 8;

        for (let i = 0; i < pieces; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Frequência aleatória para simular diferentes pedaços de vidro
            const baseFreq = 1000 + Math.random() * 2000;
            oscillator.type = 'square';
            
            // Modulação de frequência para efeito de quebra
            oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime + i * 0.02);
            oscillator.frequency.exponentialRampToValueAtTime(
                baseFreq * 0.5,
                this.audioContext.currentTime + i * 0.02 + duration
            );

            // Envelope de amplitude
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + i * 0.02);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + i * 0.02 + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.02 + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.mainGainNode);

            oscillator.start(this.audioContext.currentTime + i * 0.02);
            oscillator.stop(this.audioContext.currentTime + i * 0.02 + duration);
        }
    }

    setVolume(value) {
        this.mainGainNode.gain.value = value;
    }
}

// Exportar a classe
window.SoundEffects = SoundEffects;
