document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupLogout();
    initGame();
});

function checkAuthentication() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
        window.location.href = 'index.html';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isAuthenticated');
            window.location.href = 'index.html';
        });
    }
}

class LuxuryRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameOver = false;
        this.speed = 6;
        this.gravity = 0.6;
        this.jumpForce = -12;

        // Configuração do canvas
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;

        // Perfume (jogador)
        this.perfume = {
            x: 50,
            y: this.canvas.height - 60,
            height: 60,
            width: 30,
            velocityY: 0,
            isJumping: false
        };

        // Obstáculos (martelos)
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 1500; // Tempo entre os obstáculos

        // Carregar imagens
        this.perfumeImg = new Image();
        this.perfumeImg.src = 'assets/perfume.svg';
        this.hammerImg = new Image();
        this.hammerImg.src = 'assets/hammer.svg';

        // Background
        this.backgroundDayImg = new Image();
        this.backgroundDayImg.src = 'assets/beach-background.svg';
        this.backgroundNightImg = new Image();
        this.backgroundNightImg.src = 'assets/beach-background-night.svg';
        this.backgroundX = 0;
        this.backgroundSpeed = 2;
        this.isNight = false;
        this.transitionAlpha = 0;

        // Sistema de partículas
        this.particles = [];
        this.isExploding = false;
        this.explosionDuration = 1000; // 1 segundo
        this.explosionStartTime = 0;

        // Música
        this.music = new TropicalMusic();
        this.setupAudioControls();

        // Event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('touchstart', this.handleTouch.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));

        // Botão de reinício
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }

    setupAudioControls() {
        const toggleButton = document.getElementById('toggleMusic');
        const volumeSlider = document.getElementById('volumeSlider');

        toggleButton.addEventListener('click', () => {
            if (this.music.isPlaying) {
                this.music.stop();
                toggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                this.music.playMelody();
                toggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });

        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.music.setVolume(volume);
        });
    }

    handleKeyDown(e) {
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.perfume.isJumping) {
            this.jump();
        }
    }

    handleTouch() {
        if (!this.perfume.isJumping) {
            this.jump();
        }
    }

    handleResize() {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = this.canvas.parentElement.offsetHeight;
    }

    jump() {
        this.perfume.velocityY = this.jumpForce;
        this.perfume.isJumping = true;
    }

    update() {
        if (this.gameOver) {
            this.updateParticles();
            return;
        }

        // Atualizar posição do background
        this.backgroundX -= this.backgroundSpeed;
        if (this.backgroundX <= -800) { // Largura da imagem
            this.backgroundX = 0;
        }

        // Verificar transição dia/noite
        const shouldBeNight = Math.floor(this.score / 10) % 2 === 1;
        if (shouldBeNight !== this.isNight) {
            this.transitionAlpha = Math.min(1, this.transitionAlpha + 0.02);
            if (this.transitionAlpha >= 1) {
                this.isNight = shouldBeNight;
                this.transitionAlpha = 0;
            }
        }

        // Atualizar perfume
        this.perfume.velocityY += this.gravity;
        this.perfume.y += this.perfume.velocityY;

        // Verificar colisão com o chão
        if (this.perfume.y > this.canvas.height - this.perfume.height) {
            this.perfume.y = this.canvas.height - this.perfume.height;
            this.perfume.velocityY = 0;
            this.perfume.isJumping = false;
        }

        // Gerar obstáculos
        this.obstacleTimer += 16; // 60 FPS
        if (this.obstacleTimer > this.obstacleInterval) {
            this.obstacles.push({
                x: this.canvas.width,
                y: this.canvas.height - 40,
                width: 30,
                height: 40
            });
            this.obstacleTimer = 0;
            this.obstacleInterval = Math.max(1000, this.obstacleInterval - 10); // Aumentar dificuldade
        }

        // Atualizar obstáculos
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.speed;

            // Remover obstáculos fora da tela
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score++;
                document.getElementById('score').textContent = this.score.toString();
            }

            // Verificar colisão
            if (this.checkCollision(this.perfume, obstacle)) {
                this.endGame();
            }
        }
    }

    updateParticles() {
        if (!this.isExploding) return;

        const now = Date.now();
        const elapsed = now - this.explosionStartTime;

        if (elapsed > this.explosionDuration) {
            this.isExploding = false;
            this.particles = [];
            return;
        }

        for (let particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gravidade
            particle.alpha = 1 - (elapsed / this.explosionDuration);
        }
    }

    createExplosion() {
        this.isExploding = true;
        this.explosionStartTime = Date.now();
        const numParticles = 30;

        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: this.perfume.x + this.perfume.width / 2,
                y: this.perfume.y + this.perfume.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1
            });
        }
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    draw() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar background
        const currentBg = this.isNight ? this.backgroundNightImg : this.backgroundDayImg;
        const nextBg = this.isNight ? this.backgroundDayImg : this.backgroundNightImg;

        if (currentBg.complete && nextBg.complete) {
            // Desenhar background atual
            this.ctx.globalAlpha = 1;
            this.ctx.drawImage(
                currentBg,
                this.backgroundX,
                0,
                this.canvas.width,
                this.canvas.height
            );
            this.ctx.drawImage(
                currentBg,
                this.backgroundX + this.canvas.width,
                0,
                this.canvas.width,
                this.canvas.height
            );

            // Desenhar próximo background durante transição
            if (this.transitionAlpha > 0) {
                this.ctx.globalAlpha = this.transitionAlpha;
                this.ctx.drawImage(
                    nextBg,
                    this.backgroundX,
                    0,
                    this.canvas.width,
                    this.canvas.height
                );
                this.ctx.drawImage(
                    nextBg,
                    this.backgroundX + this.canvas.width,
                    0,
                    this.canvas.width,
                    this.canvas.height
                );
            }
            this.ctx.globalAlpha = 1;
        }

        // Desenhar chão
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(0, this.canvas.height - 2, this.canvas.width, 2);

        // Desenhar perfume (apenas se não estiver explodindo)
        if (!this.isExploding && this.perfumeImg.complete) {
            this.ctx.drawImage(
                this.perfumeImg,
                this.perfume.x,
                this.perfume.y,
                this.perfume.width,
                this.perfume.height
            );
        }

        // Desenhar obstáculos
        if (this.hammerImg.complete) {
            for (const obstacle of this.obstacles) {
                this.ctx.drawImage(
                    this.hammerImg,
                    obstacle.x,
                    obstacle.y,
                    obstacle.width,
                    obstacle.height
                );
            }
        }

        // Desenhar partículas de explosão
        this.drawParticles();
    }

    drawParticles() {
        if (!this.isExploding) return;

        for (const particle of this.particles) {
            this.ctx.fillStyle = `rgba(255, 68, 68, ${particle.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    endGame() {
        if (!this.gameOver) {
            this.gameOver = true;
            this.createExplosion();
            this.music.stop();

            // Aguardar a explosão terminar antes de mostrar game over
            setTimeout(() => {
                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('gameOver').classList.add('show');
            }, this.explosionDuration);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    restart() {
        // Resetar estado do jogo
        this.score = 0;
        this.gameOver = false;
        this.speed = 6;
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 1500;
        this.isExploding = false;
        this.particles = [];

        // Resetar posição do perfume
        this.perfume.y = this.canvas.height - this.perfume.height;
        this.perfume.velocityY = 0;
        this.perfume.isJumping = false;

        // Resetar posição do background
        this.backgroundX = 0;

        // Resetar transição dia/noite
        this.isNight = false;
        this.transitionAlpha = 0;

        // Atualizar interface
        document.getElementById('score').textContent = '0';
        document.getElementById('gameOver').classList.remove('show');

        this.music.playMelody();
    }
}

function initGame() {
    const game = new LuxuryRunner();
    game.gameLoop();
}
