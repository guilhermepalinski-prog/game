const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelDisplay = document.getElementById("level-display");

let levelAtual = 0;
let gameRunning = true;

// Configuração do Jogador
let jogador = {
    x: 50,
    y: 250,
    tamanho: 20,
    cor: "#2196F3",
    velocidade: 4,
    destX: 50, // Para controle de toque
    destY: 250
};

// Definição do Objetivo (Cubinho Dourado)
let objetivo = { x: 740, y: 235, tamanho: 30 };

// Estrutura de Níveis (Inimigos e Obstáculos)
// Inimigos podem ser: x, y, largura, altura, velX, velY, cor
const niveis = [
    { // Nível 1: Introdução
        inimigos: [
            { x: 300, y: 100, w: 30, h: 30, vx: 0, vy: 4, cor: "red" }
        ]
    },
    { // Nível 2: Dois Inimigos
        inimigos: [
            { x: 200, y: 50, w: 30, h: 30, vx: 0, vy: 5, cor: "red" },
            { x: 500, y: 400, w: 30, h: 30, vx: 0, vy: -5, cor: "red" }
        ]
    },
    { // Nível 3: Cruzamento
        inimigos: [
            { x: 400, y: 100, w: 40, h: 40, vx: 0, vy: 6, cor: "blue" },
            { x: 100, y: 230, w: 40, h: 40, vx: 6, vy: 0, cor: "red" }
        ]
    },
    { // Nível 4: O Corredor
        inimigos: [
            { x: 200, y: 0, w: 20, h: 300, vx: 3, vy: 0, cor: "red" },
            { x: 600, y: 200, w: 20, h: 300, vx: -3, vy: 0, cor: "blue" }
        ]
    },
    { // Nível 5: Labirinto Simples
        inimigos: [
            { x: 250, y: 0, w: 300, h: 20, vx: 0, vy: 4, cor: "red" },
            { x: 250, y: 480, w: 300, h: 20, vx: 0, vy: -4, cor: "red" }
        ]
    },
    { // Nível 6: Velocidade
        inimigos: [
            { x: 150, y: 10, w: 50, h: 50, vx: 0, vy: 10, cor: "blue" },
            { x: 350, y: 10, w: 50, h: 50, vx: 0, vy: 12, cor: "blue" },
            { x: 550, y: 10, w: 50, h: 50, vx: 0, vy: 14, cor: "blue" }
        ]
    },
    { // Nível 7: Cercado
        inimigos: [
            { x: 380, y: 230, w: 40, h: 40, vx: 8, vy: 8, cor: "red" },
            { x: 380, y: 230, w: 40, h: 40, vx: -8, vy: -8, cor: "red" }
        ]
    },
    { // Nível 8: Frequência
        inimigos: Array.from({length: 5}, (_, i) => ({ x: 150 + i*100, y: 50, w: 20, h: 20, vx: 0, vy: 5 + i, cor: "red" }))
    },
    { // Nível 9: Parede Invisível (quase)
        inimigos: [
            { x: 100, y: 0, w: 600, h: 10, vx: 0, vy: 3, cor: "#ddd" },
            { x: 400, y: 250, w: 20, h: 20, vx: 10, vy: 0, cor: "red" }
        ]
    },
    { // Nível 10: Caos Final
        inimigos: [
            { x: 400, y: 250, w: 100, h: 100, vx: 5, vy: 5, cor: "red" },
            { x: 100, y: 100, w: 50, h: 50, vx: 7, vy: -7, cor: "blue" },
            { x: 700, y: 400, w: 30, h: 30, vx: -10, vy: 2, cor: "green" }
        ]
    }
];

// Input: Teclado
let teclas = {};
window.addEventListener("keydown", e => teclas[e.code] = true);
window.addEventListener("keyup", e => teclas[e.code] = false);

// Input: Toque / Mouse (Híbrido)
canvas.addEventListener("pointerdown", moverPara);
canvas.addEventListener("pointermove", e => { if(e.buttons > 0) moverPara(e); });

function moverPara(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    jogador.destX = (e.clientX - rect.left) * scaleX - jogador.tamanho/2;
    jogador.destY = (e.clientY - rect.top) * scaleY - jogador.tamanho/2;
}

function resetJogador() {
    jogador.x = 50;
    jogador.y = 250;
    jogador.destX = 50;
    jogador.destY = 250;
}

function atualizar() {
    if (!gameRunning) return;

    // Movimentação Teclado
    if (teclas["ArrowUp"]) jogador.y -= jogador.velocidade;
    if (teclas["ArrowDown"]) jogador.y += jogador.velocidade;
    if (teclas["ArrowLeft"]) jogador.x -= jogador.velocidade;
    if (teclas["ArrowRight"]) jogador.x += jogador.velocidade;

    // Suavização da Movimentação por Toque
    let dx = jogador.destX - jogador.x;
    let dy = jogador.destY - jogador.y;
    if (Math.abs(dx) > 2) jogador.x += dx * 0.15;
    if (Math.abs(dy) > 2) jogador.y += dy * 0.15;

    // Colisão com bordas do canvas
    if (jogador.x < 0) jogador.x = 0;
    if (jogador.y < 0) jogador.y = 0;
    if (jogador.x > canvas.width - jogador.tamanho) jogador.x = canvas.width - jogador.tamanho;
    if (jogador.y > canvas.height - jogador.tamanho) jogador.y = canvas.height - jogador.tamanho;

    // Atualizar Inimigos do nível atual
    niveis[levelAtual].inimigos.forEach(inimigo => {
        inimigo.x += inimigo.vx;
        inimigo.y += inimigo.vy;

        // Rebater nas bordas
        if (inimigo.x < 0 || inimigo.x > canvas.width - inimigo.w) inimigo.vx *= -1;
        if (inimigo.y < 0 || inimigo.y > canvas.height - inimigo.h) inimigo.vy *= -1;

        // Colisão com Jogador (Morte)
        if (jogador.x < inimigo.x + inimigo.w &&
            jogador.x + jogador.tamanho > inimigo.x &&
            jogador.y < inimigo.y + inimigo.h &&
            jogador.y + jogador.tamanho > inimigo.y) {
            resetJogador();
        }
    });

    // Colisão com Objetivo (Próximo Nível)
    if (jogador.x < objetivo.x + objetivo.tamanho &&
        jogador.x + jogador.tamanho > objetivo.x &&
        jogador.y < objetivo.y + objetivo.tamanho &&
        jogador.y + jogador.tamanho > objetivo.y) {
        
        if (levelAtual < niveis.length - 1) {
            levelAtual++;
            levelDisplay.innerText = `Nível: ${levelAtual + 1}`;
            resetJogador();
        } else {
            alert("VOCÊ VENCEU O DESAFIO AGRINHO!");
            levelAtual = 0;
            resetJogador();
        }
    }
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo quadriculado (estilo puzzle clássico)
    ctx.fillStyle = "#ddd";
    for(let i=0; i<canvas.width; i+=40) {
        for(let j=0; j<canvas.height; j+=40) {
            if((i+j)%80==0) ctx.fillRect(i,j,40,40);
        }
    }

    // Desenhar Objetivo
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);
    ctx.strokeStyle = "#DAA520";
    ctx.strokeRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);

    // Desenhar Jogador
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.tamanho, jogador.tamanho);

    // Desenhar Inimigos
    niveis[levelAtual].inimigos.forEach(inimigo => {
        ctx.fillStyle = inimigo.cor;
        ctx.fillRect(inimigo.x, inimigo.y, inimigo.w, inimigo.h);
    });
}

function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

loop();
