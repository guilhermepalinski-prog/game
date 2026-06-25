const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const txtNivel = document.getElementById("txt-nivel");
const txtVidas = document.getElementById("txt-vidas");
const tituloTopo = document.getElementById("titulo-topo");

let levelAtual = 0;
let vidas = 3;

let jogador = {
    x: 40,
    y: 40,
    tamanho: 20,
    cor: "#fadb14",
    velocidade: 4.5
};

// Ponto de Chegada (Cubo Dourado)
let objetivo = { x: 780, y: 390, tamanho: 30 };

// 10 NÍVEIS REMODELADOS COM ALTA DIFICULDADE
const niveis = [
    { // Nível 1: Introdução ao Perigo Avançado
        paredes: [{ x: 300, y: 0, w: 40, h: 320 }],
        perigos: [
            { x: 450, y: 100, w: 40, h: 40, vx: 0, vy: 5, cor: "#e53e3e" },
            { x: 620, y: 250, w: 40, h: 40, vx: 0, vy: -5, cor: "#e53e3e" }
        ]
    },
    { // Nível 2: O Duplo bloqueio Móvel
        paredes: [{ x: 200, y: 140, w: 50, h: 320 }, { x: 550, y: 0, w: 50, h: 320 }],
        perigos: [
            { x: 380, y: 50, w: 35, h: 35, vx: 5, vy: 0, cor: "#3182ce" },
            { x: 380, y: 400, w: 35, h: 35, vx: -5, vy: 0, cor: "#3182ce" }
        ]
    },
    { // Nível 3: Labirinto zigue-zague com Patrulha
        paredes: [
            { x: 220, y: 0, w: 40, h: 350 },
            { x: 440, y: 110, w: 40, h: 350 },
            { x: 660, y: 0, w: 40, h: 350 }
        ],
        perigos: [
            { x: 100, y: 380, w: 30, h: 30, vx: 0, vy: -6, cor: "#e53e3e" },
            { x: 320, y: 50, w: 30, h: 30, vx: 0, vy: 6, cor: "#e53e3e" },
            { x: 540, y: 380, w: 30, h: 30, vx: 0, vy: -6, cor: "#3182ce" }
        ]
    },
    { // Nível 4: Corredor da Morte
        paredes: [
            { x: 150, y: 120, w: 550, h: 40 },
            { x: 150, y: 280, w: 550, h: 40 }
        ],
        perigos: [
            { x: 200, y: 200, w: 30, h: 30, vx: 8, vy: 0, cor: "#e53e3e" },
            { x: 600, y: 200, w: 30, h: 30, vx: -8, vy: 0, cor: "#3182ce" }
        ]
    },
    { // Nível 5: Paredes Alternadas e Divisórias
        paredes: [
            { x: 150, y: 0, w: 30, h: 220 }, { x: 150, y: 300, w: 30, h: 160 },
            { x: 350, y: 120, w: 30, h: 340 },
            { x: 580, y: 0, w: 30, h: 300 }
        ],
        perigos: [
            { x: 230, y: 50, w: 40, h: 40, vx: 0, vy: 7, cor: "#e53e3e" },
            { x: 450, y: 400, w: 40, h: 40, vx: 0, vy: -7, cor: "#3182ce" }
        ]
    },
    { // Nível 6: Zona Semi-Invisível Avançada
        paredes: [{ x: 400, y: 100, w: 40, h: 260 }],
        perigos: [
            { x: 150, y: 0, w: 120, h: 360, vx: 0, vy: 0, cor: "rgba(229, 62, 62, 0.15)" },
            { x: 500, y: 100, w: 120, h: 360, vx: 0, vy: 0, cor: "rgba(49, 130, 206, 0.15)" },
            { x: 300, y: 200, w: 30, h: 30, vx: 0, vy: 8, cor: "#e53e3e" }
        ]
    },
    { // Nível 7: Campo Minado de Velocidade
        paredes: [],
        perigos: [
            { x: 200, y: 20, w: 35, h: 35, vx: 0, vy: 10, cor: "#e53e3e" },
            { x: 350, y: 400, w: 35, h: 35, vx: 0, vy: -11, cor: "#3182ce" },
            { x: 500, y: 20, w: 35, h: 35, vx: 0, vy: 12, cor: "#e53e3e" },
            { x: 650, y: 400, w: 35, h: 35, vx: 0, vy: -13, cor: "#3182ce" }
        ]
    },
    { // Nível 8: Labirinto de Paredes Invisíveis
        paredes: [{ x: 400, y: 0, w: 50, h: 460 }],
        perigos: [
            { x: 0, y: 160, w: 300, h: 50, vx: 0, vy: 0, cor: "rgba(229, 62, 62, 0.12)" },
            { x: 100, y: 300, w: 300, h: 50, vx: 0, vy: 0, cor: "rgba(229, 62, 62, 0.12)" },
            { x: 480, y: 200, w: 300, h: 60, vx: 0, vy: 0, cor: "rgba(49, 130, 206, 0.12)" },
            { x: 550, y: 50, w: 30, h: 30, vx: 6, vy: 0, cor: "#e53e3e" }
        ]
    },
    { // Nível 9: Funil Estreito Estático e Móvel
        paredes: [
            { x: 0, y: 140, w: 750, h: 40 },
            { x: 100, y: 280, w: 750, h: 40 }
        ],
        perigos: [
            { x: 400, y: 195, w: 45, h: 75, vx: -5, vy: 0, cor: "#e53e3e" },
            { x: 200, y: 195, w: 45, h: 75, vx: 5, vy: 0, cor: "#3182ce" }
        ]
    },
    { // Nível 10: O Labirinto do Caos Final
        paredes: [
            { x: 200, y: 0, w: 40, h: 340 },
            { x: 420, y: 120, w: 40, h: 340 },
            { x: 640, y: 0, w: 40, h: 340 }
        ],
        perigos: [
            { x: 80, y: 200, w: 35, h: 35, vx: 0, vy: 9, cor: "#e53e3e" },
            { x: 280, y: 80, w: 35, h: 35, vx: 0, vy: -9, cor: "#3182ce" },
            { x: 500, y: 380, w: 35, h: 35, vx: 0, vy: 10, cor: "#e53e3e" },
            { x: 720, y: 50, w: 35, h: 35, vx: 4, vy: 8, cor: "#3182ce" },
            { x: 450, y: 0, w: 150, h: 40, vx: 0, vy: 0, cor: "rgba(229, 62, 62, 0.15)" }
        ]
    }
];

// Configuração de Eventos das Teclas (Computador)
let teclas = {};
window.addEventListener("keydown", e => teclas[e.code] = true);
window.addEventListener("keyup", e => teclas[e.code] = false);

// Joystick Virtual Móvel (Fora do Canvas)
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

// Botões de Ação Auxiliares (Preparados para expansões de mecânicas)
document.getElementById("btn-acao1").addEventListener("pointerdown", (e) => e.preventDefault());
document.getElementById("btn-acao2").addEventListener("pointerdown", (e) => e.preventDefault());

function resetJogador() {
    jogador.x = 40;
    jogador.y = 40;
}

function computarMorte() {
    vidas--;
    txtVidas.innerText = vidas;
    resetJogador();
    if (vidas <= 0) {
        alert("GAME OVER! Voltando ao Nível 1.");
        vidas = 3;
        levelAtual = 0;
        txtVidas.innerText = vidas;
        atualizarInterfaceTexto();
    }
}

function atualizarInterfaceTexto() {
    txtNivel.innerText = `${levelAtual + 1}/10`;
    tituloTopo.innerText = `LABIRINTO INSANO: NÍVEL ${levelAtual + 1}/10`;
}

function verificarPassagem(proximoX, proximoY) {
    if (proximoX < 0 || proximoY < 0 || 
        proximoX > canvas.width - jogador.tamanho || 
        proximoY > canvas.height - jogador.tamanho) {
        return false;
    }
    const lvl = niveis[levelAtual];
    for (let p of lvl.paredes) {
        if (proximoX < p.x + p.w && proximoX + jogador.tamanho > p.x &&
            proximoY < p.y + p.h && proximoY + jogador.tamanho > p.y) {
            return false;
        }
    }
    return true;
}

function atualizar() {
    let mx = 0;
    let my = 0;

    // Movimentação Integrada (Teclado WASD/Setas + Joystick Virtual)
    if (teclas["ArrowUp"] || teclas["KeyW"] || toques.up) my = -jogador.velocidade;
    if (teclas["ArrowDown"] || teclas["KeyS"] || toques.down) my = jogador.velocidade;
    if (teclas["ArrowLeft"] || teclas["KeyA"] || toques.left) mx = -jogador.velocidade;
    if (teclas["ArrowRight"] || teclas["KeyD"] || toques.right) mx = jogador.velocidade;

    if (mx !== 0 && verificarPassagem(jogador.x + mx, jogador.y)) jogador.x += mx;
    if (my !== 0 && verificarPassagem(jogador.x, jogador.y + my)) jogador.y += my;

    const lvl = niveis[levelAtual];

    // Colisão com Obstáculos e Áreas Perigosas
    lvl.perigos.forEach(p => {
        if (jogador.x < p.x + p.w && jogador.x + jogador.tamanho > p.x &&
            jogador.y < p.y + p.h && jogador.y + jogador.tamanho > p.y) {
            computarMorte();
        }
        
        // Movimento físico dos próprios obstáculos internos rebatedores
        if(p.vx) p.x += p.vx;
        if(p.vy) p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width - p.w) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height - p.h) p.vy *= -1;
    });

    // Verificação de vitória ao alcançar o ponto de chegada
    if (jogador.x < objetivo.x + objetivo.tamanho && jogador.x + jogador.tamanho > objetivo.x &&
        jogador.y < objetivo.y + objetivo.tamanho && jogador.y + jogador.tamanho > objetivo.y) {
        
        if (levelAtual < niveis.length - 1) {
            levelAtual++;
            atualizarInterfaceTexto();
            resetJogador();
        } else {
            alert("SENSACIONAL! VOCÊ COMPLETOU O DESAFIO MÁXIMO!");
            levelAtual = 0;
            vidas = 3;
            txtVidas.innerText = vidas;
            atualizarInterfaceTexto();
            resetJogador();
        }
    }
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grelha de fundo estilizada
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const lvl = niveis[levelAtual];

    // Desenha Paredes Sólidas Cinzas
    ctx.fillStyle = "#475569";
    lvl.paredes.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Desenha Obstáculos Ativos e Invisíveis
    lvl.perigos.forEach(p => {
        ctx.fillStyle = p.cor || "#e53e3e";
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // PONTO DE CHEGADA (Design do Cubo Dourado com borda brilhante)
    ctx.fillStyle = "#eab308";
    ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(objetivo.x + 3, objetivo.y + 3, objetivo.tamanho - 6, objetivo.tamanho - 6);

    // Desenha o Jogador Amarelo com Olhinhos
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.tamanho, jogador.tamanho);
    
    ctx.fillStyle = "#000";
    ctx.fillRect(jogador.x + 3, jogador.y + 4, 3, 5);
    ctx.fillRect(jogador.x + 13, jogador.y + 4, 3, 5);
}

function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

loop();
