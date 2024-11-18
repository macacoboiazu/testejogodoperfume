// Verificar autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupLogout();
    setupSmoothScroll();
    setupProductCards();
    setupExpandedView();
    setupModal();
    setupFullscreenView();
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
            logout();
        });
    }
}

function logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

function setupProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const detailsBtn = card.querySelector('.btn-details');
        const productImage = card.querySelector('.product-image');
        const img = productImage.querySelector('img');
        const magnifier = productImage.querySelector('.magnifier');

        if (detailsBtn) {
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                expandProduct(card);
            });
        }

        if (productImage && img && magnifier) {
            let isMouseDown = false;
            let startX, startY;
            let imgX = 0, imgY = 0;
            const maxMove = 50; // Quantidade máxima de movimento em pixels

            productImage.addEventListener('mousemove', (e) => {
                const rect = productImage.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Calcula a posição relativa do mouse (0-1)
                const xPercent = x / rect.width;
                const yPercent = y / rect.height;

                // Calcula o zoom (2x)
                const zoomLevel = 2;
                const bgX = xPercent * (rect.width * (zoomLevel - 1));
                const bgY = yPercent * (rect.height * (zoomLevel - 1));

                // Posiciona a lupa
                magnifier.style.left = `${x - magnifier.offsetWidth / 2}px`;
                magnifier.style.top = `${y - magnifier.offsetHeight / 2}px`;

                // Define a imagem de fundo ampliada na lupa
                magnifier.style.backgroundImage = `url(${img.src})`;
                magnifier.style.backgroundSize = `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`;
                magnifier.style.backgroundPosition = `-${bgX}px -${bgY}px`;

                // Calcula a direção e intensidade do movimento
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const moveX = (x - centerX) / centerX * maxMove;
                const moveY = (y - centerY) / centerY * maxMove;

                // Aplica o movimento suave à imagem
                img.style.transform = `translate(${-moveX}px, ${-moveY}px)`;
            });

            // Reseta a posição da imagem quando o mouse sai
            productImage.addEventListener('mouseleave', () => {
                magnifier.style.opacity = '0';
                img.style.transform = 'translate(0, 0)';
            });

            // Mostra a lupa quando o mouse entra
            productImage.addEventListener('mouseenter', () => {
                magnifier.style.opacity = '1';
            });
        }

        // Removendo o evento de clique anterior para evitar conflito
        card.removeEventListener('click', showProductModal);
    });
}

function setupExpandedView() {
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeExpanded');

    if (overlay) {
        overlay.addEventListener('click', collapseProduct);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', collapseProduct);
    }

    // Fechar com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            collapseProduct();
        }
    });
}

function expandProduct(card) {
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeExpanded');
    
    // Armazenar a posição original do card
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--original-top', rect.top + 'px');
    card.style.setProperty('--original-left', rect.left + 'px');
    card.style.setProperty('--original-width', rect.width + 'px');
    card.style.setProperty('--original-height', rect.height + 'px');

    // Adicionar classes para expansão
    card.classList.add('expanded');
    overlay.classList.add('show');
    closeBtn.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Animar a expansão
    requestAnimationFrame(() => {
        card.style.transform = 'translate(-50%, -50%)';
    });
}

function collapseProduct() {
    const expandedCard = document.querySelector('.product-card.expanded');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeExpanded');

    if (expandedCard) {
        // Remover classes de expansão
        expandedCard.classList.remove('expanded');
        overlay.classList.remove('show');
        closeBtn.style.display = 'none';
        document.body.style.overflow = '';

        // Resetar transformações
        expandedCard.style.transform = '';
    }
}

function setupModal() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close-modal');
    const contactButton = document.querySelector('.contact-button');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideProductModal();
        });
    }

    if (contactButton) {
        contactButton.addEventListener('click', () => {
            const phone = document.getElementById('modalSellerPhone').textContent;
            const productName = document.getElementById('modalProductName').textContent;
            const message = encodeURIComponent(`Olá! Tenho interesse no produto ${productName}. Poderia me fornecer mais informações?`);
            window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`);
        });
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideProductModal();
        }
    });
}

function showProductModal(productId) {
    const modal = document.getElementById('productModal');
    const data = productData[productId];

    if (!data) return;

    // Atualizar conteúdo do modal
    document.getElementById('modalProductImage').src = data.image;
    document.getElementById('modalProductName').textContent = data.name;
    document.getElementById('modalProductPrice').textContent = data.price;
    document.getElementById('modalProductDescription').textContent = data.description;

    // Atualizar especificações
    const specsList = document.getElementById('modalProductSpecs');
    specsList.innerHTML = data.specs.map(spec => `<li>${spec}</li>`).join('');

    // Mostrar modal com animação
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function hideProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function setupFullscreenView() {
    const overlay = document.querySelector('.fullscreen-overlay');
    const fullscreenImage = document.querySelector('.fullscreen-image');
    const closeButton = document.querySelector('.close-fullscreen');
    
    // Função para abrir imagem em tela cheia
    function openFullscreen(imageSrc) {
        fullscreenImage.src = imageSrc;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Função para fechar imagem em tela cheia
    function closeFullscreen() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            fullscreenImage.src = '';
        }, 300);
    }
    
    // Adiciona eventos para todas as imagens de produtos
    document.querySelectorAll('.product-image').forEach(container => {
        const img = container.querySelector('img');
        
        container.addEventListener('click', (e) => {
            if (e.target.closest('.btn-details')) return; // Ignora clique no botão
            openFullscreen(img.src);
        });
    });
    
    // Fecha ao clicar no botão de fechar
    closeButton.addEventListener('click', closeFullscreen);
    
    // Fecha ao clicar no overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeFullscreen();
        }
    });
    
    // Fecha ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeFullscreen();
        }
    });
}

// Dados dos produtos
const productData = {
    'relogio-luxo': {
        name: 'Relógio Luxury Diamond',
        price: 'R$ 25.999,00',
        description: 'Um relógio excepcional que combina artesanato tradicional com tecnologia moderna. Feito com materiais premium e acabamento em ouro 18k.',
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80',
        specs: [
            'Movimento automático suíço',
            'Caixa em ouro 18k',
            'Vidro de safira resistente a riscos',
            'Resistente à água até 100m',
            'Garantia de 5 anos'
        ]
    },
    'bolsa-premium': {
        name: 'Bolsa Premium Collection',
        price: 'R$ 15.499,00',
        description: 'Bolsa artesanal confeccionada em couro italiano legítimo, com acabamentos em ouro e design exclusivo.',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        specs: [
            'Couro italiano premium',
            'Acabamentos em ouro 18k',
            'Forro em seda natural',
            'Compartimentos organizadores',
            'Certificado de autenticidade'
        ]
    },
    'perfume-royal': {
        name: 'Perfume Royal Essence',
        price: 'R$ 3.999,00',
        description: 'Uma fragrância única e sofisticada, desenvolvida pelos melhores perfumistas franceses com ingredientes raros e preciosos.',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
        specs: [
            'Fragrância exclusiva',
            'Ingredientes naturais raros',
            'Frasco em cristal francês',
            'Concentração parfum',
            'Edição limitada'
        ]
    },
    'joia-premium': {
        name: 'Colar Diamond Collection',
        price: 'R$ 45.999,00',
        description: 'Um deslumbrante colar em ouro branco 18k com diamantes certificados, criado por mestres joalheiros.',
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        specs: [
            'Ouro branco 18k',
            'Diamantes certificados GIA',
            'Design exclusivo',
            'Acabamento artesanal',
            'Estojo premium incluso'
        ]
    }
};
