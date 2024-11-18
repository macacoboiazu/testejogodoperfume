// Usando Web Audio API para criar uma música 8-bit tropical
class TropicalMusic {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
        this.mainGainNode = this.audioContext.createGain();
        this.mainGainNode.gain.value = 0.3; // Volume inicial
        this.mainGainNode.connect(this.audioContext.destination);
        
        // Notas da melodia tropical
        this.notes = [
            { note: 'C4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            { note: 'A4', duration: 0.25 },
            { note: 'G4', duration: 0.5 },
            { note: 'E4', duration: 0.5 },
            { note: 'C4', duration: 0.5 },
            { note: 'D4', duration: 0.25 },
            { note: 'F4', duration: 0.25 },
            { note: 'A4', duration: 0.25 },
            { note: 'B4', duration: 0.25 },
            { note: 'A4', duration: 0.5 },
            { note: 'F4', duration: 0.5 },
            { note: 'D4', duration: 0.5 }
        ];
        
        // Mapeamento de notas para frequências
        this.frequencies = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63,
            'F4': 349.23, 'G4': 392.00, 'A4': 440.00,
            'B4': 493.88, 'C5': 523.25
        };
    }
    
    createOscillator(frequency, startTime, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configurar tipo de onda para som 8-bit
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        
        // Envelope ADSR simplificado
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.mainGainNode);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }
    
    playMelody() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        
        let currentTime = this.audioContext.currentTime;
        const loopDuration = this.notes.reduce((sum, note) => sum + note.duration, 0);
        
        const playLoop = () => {
            this.notes.forEach(note => {
                this.createOscillator(this.frequencies[note.note], currentTime, note.duration);
                currentTime += note.duration;
            });
            
            // Agendar próxima iteração
            setTimeout(() => {
                if (this.isPlaying) {
                    currentTime = this.audioContext.currentTime;
                    playLoop();
                }
            }, loopDuration * 1000);
        };
        
        playLoop();
    }
    
    stop() {
        this.isPlaying = false;
    }
    
    setVolume(value) {
        this.mainGainNode.gain.value = value;
    }
}

// Exportar a classe
window.TropicalMusic = TropicalMusic;
