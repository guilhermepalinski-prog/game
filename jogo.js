const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelDisplay = document.getElementById("level-display");
const dpad = document.getElementById("dpad");

// Detecta se é celular para mostrar as setinhas
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    dpad.style.display = "block";
}

let levelAtual = 0;

// Configurações do Jogador (Quadrado Amarelo estilo a imagem)
let jogador = {
    x: 40,
    y: 240,
    tamanho: 20,
    cor: "#FFEB3B",
    velocidade: 3.5
};

// Cubinho de Chegada (Dourado)
let objetivo = { x: 740, y: 235, tamanho: 30 };

// Estrutura dos 10 Níveis
// paredes = sólidas (não passa) | armadilhas = semi-invisíveis (morre se tocar) | inimigos = se movem
const niveis = [
    { // Nível 1: Introdução às paredes e cubinho
        paredes: [{ x: 300, y: 0, w: 40, h: 350 }],
        armadilhas: [],
        inimigos: []
    },
    { // Nível 2: Primeiros Inimigos em Movimento
        paredes: [],
        armadilhas: [],
        inimigos: [{ x: 400, y: 100, w: 30, h: 30, vx: 0, vy: 5, cor: "red" }]
    },
    { // Nível 3: O Labirinto Físico Básica
        paredes: [
            { x: 200, y: 0, w: 40, h: 380 },
            { x: 450, y: 120, w: 40, h: 380 }
        ],
        armadilhas: [],
        inimigos: []
    },
    { // Nível 4: Labirinto com Inimigo Vermelho
        paredes: [{ x: 350, y: 0, w: 40, h: 400 }],
        armadilhas: [],
        inimigos: [{ x: 500, y: 50, w: 35, h: 35, vx: 0, vy: 6, cor: "red" }]
    },
    { // Nível 5: Paredes e Blocos Azuis Assassinos
        paredes: [{ x: 200, y: 150, w: 400, h: 40 }],
        armadilhas: [],
        inimigos: [
            { x: 250, y: 50, w: 30, h: 30, vx: 4, vy: 0, cor: "blue" },
            { x: 500, y: 350, w: 30, h: 30, vx: -4, vy: 0, cor: "blue" }
        ]
    },
    { // Nível 6: Labirinto Semi-Invisível (Cuidado!)
        paredes: [],
        armadilhas: [
            { x: 250, y: 0, w: 50, h: 380 },
            { x: 500, y: 120, w: 50, h: 380 }
        ],
        inimigos: []
    },
    { // Nível 7: Labirinto Invisível Cruzado com Inimigos
        paredes: [{ x: 400, y: 0, w: 40, h: 500 }],
        armadilhas: [{ x: 150, y: 100, w: 150, h: 40 }],
        inimigos: [{ x: 600, y: 200, w: 25, h: 25, vx: 0, vy: 7, cor: "red" }]
    },
    { // Nível 8: Corredor Estreito e Rápido
        paredes: [
            { x: 0, y: 180, w: 700, h: 20 },
            { x: 100, y: 300, w: 700, h: 20 }
        ],
        armadilhas: [],
        inimigos: [{ x: 300, y: 220, w: 30, h: 60, vx: 5, vy: 0, cor: "red" }]
    },
    { // Nível 9: Grades de Armadilhas Quase Invisíveis
        paredes: [],
        armadilhas: [
            { x: 200, y: 40, w: 40, h: 400 },
            { x: 400, y: 40, w: 40, h: 400 },
            { x: 600, y: 40, w: 40, h: 400 }
        ],
        inimigos: [{ x: 400, y: 200, w: 30, h: 30, vx: 8, vy: 0, cor: "blue" }]
    },
    { // Nível 10: O Caos Completo do Scratch
        paredes: [
            { x: 150, y: 0, w: 30, h: 400 },
            { x: 600, y: 100, w: 30, h: 400 }
        ],
        armadilhas: [
            { x: 300, y: 200, w: 150, h: 30 },
            { x: 450, y: 350, w: 30, h: 100 }
        ],
        inimigos: [
            { x: 350, y: 50, w: 30, h: 30, vx: 6, vy: 6, cor: "red" },
            { x: 500, y: 400, w: 25, h: 25, vx: -6, vy: -4, cor: "blue" }
        ]
    }
];

// Controles do Teclado (PC)
let teclas = {};
window.addEventListener("keydown", e => teclas[e.code] = true);
window.addEventListener("keyup", e => teclas[e.code] = false);

// Controles de Toque (Celular)
let toques = { up: false, down: false, left: false, right: false };

configurarBotao("btn-up", "up");
configurarBotao("btn-down", "down");
configurarBotao("btn-left", "left");
configurarBotao("btn-right", "right");

function configurarBotao(id, direcao) {
    const btn = document.getElementById(id);
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); toques[direcao] = true; });
    btn.addEventListener("pointerup", (e) => { e.preventDefault(); toques[direcao] = false; });
    btn.addEventListener("pointerleave", (e) => { e.preventDefault(); toques[direcao] = false; });
}

function resetJogador() {
    jogador.x = 40;
    jogador.y = 240;
}

function checarColisaoAoMover(proximoX, proximoY) {
    // Limites da tela
    if (proximoX < 0 || proximoY < 0 || 
        proximoX > canvas.width - jogador.tamanho || 
        proximoY > canvas.height - jogador.tamanho) {
        return false;
    }

    // Colisão com paredes sólidas do nível atual (bloqueia movimento)
    const lvl = niveis[levelAtual];
    for (let p of lvl.paredes) {
        if (proximoX < p.x + p.w && proximoX + jogador.tamanho > p.x &&
            proximoY < p.y + p.h && proximoY + jogador.tamanho > p.y) {
            return false; // Não pode mover para cá
        }
    }
    return true; // Movimento livre
}

function atualizar() {
    let moverX = 0;
    let moverY = 0;

    // Processa comandos do PC ou Celular
    if (teclas["ArrowUp"] || teclas["KeyW"] || toques.up) moverY = -jogador.velocidade;
    if (teclas["ArrowDown"] || teclas["KeyS"] || toques.down) moverY = jogador.velocidade;
    if (teclas["ArrowLeft"] || teclas["KeyA"] || toques.left) moverX = -jogador.velocidade;
    if (teclas["ArrowRight"] || teclas["KeyD"] || toques.right) moverX = jogador.velocidade;

    // Tenta mover no eixo X
    if (moverX !== 0 && checarColisaoAoMover(jogador.x + moverX, jogador.y)) {
        jogador.x += moverX;
    }
    // Tenta mover no eixo Y
    if (moverY !== 0 && checarColisaoAoMover(jogador.x, jogador.y + moverY)) {
        jogador.y += moverY;
    }

    const lvl = niveis[levelAtual];

    // Colisão com Armadilhas Semi-Invisíveis (Morte imediata)
    lvl.armadilhas.forEach(armadilha => {
        if (jogador.x < armadilha.x + armadilha.w &&
            jogador.x + jogador.tamanho > armadilha.x &&
            jogador.y < armadilha.y + armadilha.h &&
            jogador.y + jogador.tamanho > armadilha.y) {
            resetJogador();
        }
    });

    // Atualiza e checa os inimigos que se movem
    lvl.inimigos.forEach(inimigo => {
        inimigo.x += inimigo.vx;
        inimigo.y += inimigo.vy;

        // Rebater nas paredes ou bordas
        if (inimigo.x < 0 || inimigo.x > canvas.width - inimigo.w) inimigo.vx *= -1;
        if (inimigo.y < 0 || inimigo.y > canvas.height - inimigo.h) inimigo.vy *= -1;

        // Colisão com Inimigo (Morte)
        if (jogador.x < inimigo.x + inimigo.w &&
            jogador.x + jogador.tamanho > inimigo.x &&
            jogador.y < inimigo.y + inimigo.h &&
            jogador.y + jogador.tamanho > inimigo.y) {
            resetJogador();
        }
    });

    // Colisão com o Cubinho Dourado de Chegada
    if (jogador.x < objetivo.x + objetivo.tamanho &&
        jogador.x + jogador.tamanho > objetivo.x &&
        jogador.y < objetivo.y + objetivo.tamanho &&
        jogador.y + jogador.tamanho > objetivo.y) {
        
        if (levelAtual < niveis.length - 1) {
            levelAtual++;
            levelDisplay.innerText = `Nível: ${levelAtual + 1}/10`;
            resetJogador();
        } else {
            alert("PARABÉNS! VOCÊ COMPLETOU TODOS OS PUZZLES!");
            levelAtual = 0;
            levelDisplay.innerText = `Nível: 1/10`;
            resetJogador();
        }
    }
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo quadriculado cinza escuro
    ctx.fillStyle = "#2c2c2c";
    for(let i=0; i<canvas.width; i+=40) {
        for(let j=0; j<canvas.height; j+=40) {
            if((i+j)%80==0) ctx.fillRect(i,j,40,40);
        }
    }

    const lvl = niveis[levelAtual];

    // Desenhar Paredes Sólidas (Cinza Claro)
    ctx.fillStyle = "#777";
    lvl.paredes.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Desenhar Armadilhas Semi-Invisíveis (Quase a cor do fundo, bem discretas)
    ctx.fillStyle = "rgba(255, 0, 0, 0.07)"; // Apenas 7% de opacidade
    lvl.armadilhas.forEach(a => {
        ctx.fillRect(a.x, a.y, a.w, a.h);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeRect(a.x, a.y, a.w, a.h);
    });

    // Desenhar Inimigos Móveis (Vermelho ou Azul)
    lvl.inimigos.forEach(inimigo => {
        ctx.fillStyle = inimigo.cor;
        ctx.fillRect(inimigo.x, inimigo.y, inimigo.w, inimigo.h);
    });

    // Desenhar Cubinho Dourado de Chegada
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);

    // Desenhar Jogador (Quadrado Amarelo)
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.tamanho, jogador.tamanho);
}

function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

loop();
