const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elementos da interface
const txtNivel = document.getElementById("txt-nivel");
const txtVidas = document.getElementById("txt-vidas");
const tituloTopo = document.getElementById("titulo-topo");
const dpad = document.getElementById("dpad");
const paineisAcao = document.getElementById("paineis-acao");

// Ativa controles visuais apenas em telas de toque (celular)
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    dpad.style.display = "block";
    paineisAcao.style.display = "block";
}

// Estados Globais do Jogo
let levelAtual = 0;
let vidas = 3;

// Jogador (Quadrado Amarelo com rostinho simples estilo a imagem)
let jogador = {
    x: 45,
    y: 45,
    tamanho: 22,
    cor: "#fadb14",
    velocidade: 3
};

// Cubinho de Chegada (Dourado/Amarelo Forte)
let objetivo = { x: 580, y: 310, tamanho: 25 };

// Configuração dos 10 Níveis (Quantidade de blocos bem reduzida)
const niveis = [
    { // Nível 1
        paredes: [{ x: 250, y: 0, w: 30, h: 260 }],
        perigos: [{ x: 400, y: 120, w: 35, h: 35, cor: "#e53e3e" }] // Quadrado vermelho
    },
    { // Nível 2
        paredes: [{ x: 200, y: 100, w: 30, h: 280 }],
        perigos: [
            { x: 380, y: 60, w: 35, h: 35, cor: "#e53e3e" },
            { x: 480, y: 220, w: 35, h: 35, cor: "#3182ce" } // Quadrado azul
        ]
    },
    { // Nível 3: Labirinto Simples
        paredes: [
            { x: 150, y: 0, w: 30, h: 250 },
            { x: 350, y: 130, w: 30, h: 250 }
        ],
        perigos: [{ x: 230, y: 300, w: 35, h: 35, cor: "#e53e3e" }]
    },
    { // Nível 4
        paredes: [{ x: 300, y: 0, w: 30, h: 380 }],
        perigos: [
            { x: 120, y: 180, w: 30, h: 30, cor: "#e53e3e" },
            { x: 450, y: 80, w: 30, h: 30, cor: "#e53e3e" }
        ]
    },
    { // Nível 5
        paredes: [{ x: 0, y: 180, w: 500, h: 30 }],
        perigos: [{ x: 520, y: 100, w: 40, h: 40, cor: "#3182ce" }]
    },
    { // Nível 6: Labirinto Semi-Invisível
        paredes: [],
        perigos: [
            { x: 200, y: 0, w: 40, h: 300, cor: "rgba(229, 62, 62, 0.08)" }, // Quase invisível
            { x: 420, y: 100, w: 40, h: 280, cor: "rgba(49, 130, 206, 0.08)" }
        ]
    },
    { // Nível 7
        paredes: [{ x: 300, y: 100, w: 200, h: 30 }],
        perigos: [
            { x: 150, y: 80, w: 30, h: 30, cor: "#e53e3e" },
            { x: 350, y: 250, w: 30, h: 30, cor: "rgba(229, 62, 62, 0.08)" }
        ]
    },
    { // Nível 8
        paredes: [{ x: 150, y: 0, w: 30, h: 380 }, { x: 450, y: 0, w: 30, h: 380 }],
        perigos: [{ x: 280, y: 160, w: 80, h: 30, cor: "#e53e3e" }]
    },
    { // Nível 9: Caminho Estreito Invisível
        paredes: [],
        perigos: [
            { x: 100, y: 0, w: 450, h: 40, cor: "rgba(49, 130, 206, 0.06)" },
            { x: 100, y: 140, w: 450, h: 240, cor: "rgba(49, 130, 206, 0.06)" }
        ]
    },
    { // Nível 10: Desafio Final Combinado
        paredes: [{ x: 310, y: 0, w: 30, h: 380 }],
        perigos: [
            { x: 120, y: 80, w: 35, h: 35, cor: "#e53e3e" },
            { x: 120, y: 260, w: 35, h: 35, cor: "#3182ce" },
            { x: 480, y: 150, w: 40, h: 40, cor: "rgba(229, 62, 62, 0.1)" }
        ]
    }
];

// Comandos de Movimento
let teclas = {};
window.addEventListener("keydown", e => teclas[e.code] = true);
window.addEventListener("keyup", e => teclas[e.code] = false);

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

// Ouvintes vazios para os botões de ação (prontos para receber funções futuras de puzzle se você quiser)
document.getElementById("btn-acao1").addEventListener("pointerdown", (e) => e.preventDefault());
document.getElementById("btn-acao2").addEventListener("pointerdown", (e) => e.preventDefault());

function resetJogador() {
    jogador.x = 45;
    jogador.y = 45;
}

function computarMorte() {
    vidas--;
    txtVidas.innerText = vidas;
    resetJogador();
    if (vidas <= 0) {
        alert("FIM DE JOGO! Reiniciando do Nível 1.");
        vidas = 3;
        levelAtual = 0;
        txtVidas.innerText = vidas;
        atualizarInterfaceTexto();
    }
}

function atualizarInterfaceTexto() {
    txtNivel.innerText = `${levelAtual + 1}/10`;
    tituloTopo.innerText = `LABIRINHO PUZZLE: NÍVEL ${levelAtual + 1}/10`;
}

function verificarPassagem(proximoX, proximoY) {
    // Limites de tela do canvas
    if (proximoX < 0 || proximoY < 0 || 
        proximoX > canvas.width - jogador.tamanho || 
        proximoY > canvas.height - jogador.tamanho) {
        return false;
    }
    // Bloqueio por paredes sólidas
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

    if (teclas["ArrowUp"] || teclas["KeyW"] || toques.up) my = -jogador.velocidade;
    if (teclas["ArrowDown"] || teclas["KeyS"] || toques.down) my = jogador.velocidade;
    if (teclas["ArrowLeft"] || teclas["KeyA"] || toques.left) mx = -jogador.velocidade;
    if (teclas["ArrowRight"] || teclas["KeyD"] || toques.right) mx = jogador.velocidade;

    if (mx !== 0 && verificarPassagem(jogador.x + mx, jogador.y)) jogador.x += mx;
    if (my !== 0 && verificarPassagem(jogador.x, jogador.y + my)) jogador.y += my;

    const lvl = niveis[levelAtual];

    // Colisão com os blocos perigosos (vermelhos, azuis ou invisíveis)
    lvl.perigos.forEach(p => {
        if (jogador.x < p.x + p.w && jogador.x + jogador.tamanho > p.x &&
            jogador.y < p.y + p.h && jogador.y + jogador.tamanho > p.y) {
            computarMorte();
        }
    });

    // Colisão com o cubinho dourado de chegada
    if (jogador.x < objetivo.x + objetivo.tamanho && jogador.x + jogador.tamanho > objetivo.x &&
        jogador.y < objetivo.y + objetivo.tamanho && jogador.y + jogador.tamanho > objetivo.y) {
        
        if (levelAtual < niveis.length - 1) {
            levelAtual++;
            atualizarInterfaceTexto();
            resetJogador();
        } else {
            alert("PARABÉNS! VOCÊ ZEROU O LABIRINTO!");
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

    // Grelha interna cinza bem sutil (estilo o piso da imagem)
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const lvl = niveis[levelAtual];

    // Desenha Paredes Sólidas (Cinza Escuro de barreira)
    ctx.fillStyle = "#475569";
    lvl.paredes.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Desenha Obstáculos Coloridos ou Semi-Invisíveis
    lvl.perigos.forEach(p => {
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // Desenha o Cubo de Chegada (Dourado)
    ctx.fillStyle = "#eab308";
    ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);

    // Desenha o Jogador (Amarelo com Olhinhos)
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.tamanho, jogador.tamanho);
    
    // Detalhe dos olhinhos para parecer com o da imagem
    ctx.fillStyle = "#000";
    ctx.fillRect(jogador.x + 4, jogador.y + 5, 3, 5);
    ctx.fillRect(jogador.x + 14, jogador.y + 5, 3, 5);
}

function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

loop();
