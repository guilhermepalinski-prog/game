const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const txtNivel = document.getElementById("txt-nivel");
const txtVidas = document.getElementById("txt-vidas");
const tituloTopo = document.getElementById("titulo-topo");
const dpad = document.getElementById("dpad");
const paineisAcao = document.getElementById("paineis-acao");

// Exibe os controles se detectar suporte a toque
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    dpad.style.display = "block";
    paineisAcao.style.display = "block";
}

let levelAtual = 0;
let vidas = 3;

let jogador = {
    x: 45,
    y: 45,
    tamanho: 22,
    cor: "#fadb14",
    velocidade: 4.5
};

// Nova posição final do cubo no mapa expandido
let objetivo = { x: 780, y: 410, tamanho: 25 };

// Níveis redimensionados e adaptados para o campo maior (850x480)
const niveis = [
    { // Nível 1
        paredes: [{ x: 350, y: 0, w: 40, h: 340 }],
        perigos: [{ x: 550, y: 180, w: 45, h: 45, cor: "#e53e3e" }]
    },
    { // Nível 2
        paredes: [{ x: 280, y: 120, w: 40, h: 360 }],
        perigos: [
            { x: 480, y: 80, w: 45, h: 45, cor: "#e53e3e" },
            { x: 620, y: 280, w: 45, h: 45, cor: "#3182ce" }
        ]
    },
    { // Nível 3
        paredes: [
            { x: 200, y: 0, w: 40, h: 320 },
            { x: 500, y: 160, w: 40, h: 320 }
        ],
        perigos: [{ x: 350, y: 380, w: 45, h: 45, cor: "#e53e3e" }]
    },
    { // Nível 4
        paredes: [{ x: 400, y: 0, w: 40, h: 460 }],
        perigos: [
            { x: 180, y: 220, w: 40, h: 40, color: "#e53e3e" },
            { x: 600, y: 120, w: 40, h: 40, cor: "#e53e3e" }
        ]
    },
    { // Nível 5
        paredes: [{ x: 0, y: 240, w: 650, h: 40 }],
        perigos: [{ x: 700, y: 120, w: 50, h: 50, cor: "#3182ce" }]
    },
    { // Nível 6: Labirinto Semi-Invisível
        paredes: [],
        perigos: [
            { x: 250, y: 0, w: 60, h: 380, cor: "rgba(229, 62, 62, 0.08)" },
            { x: 550, y: 100, w: 60, h: 380, cor: "rgba(49, 130, 206, 0.08)" }
        ]
    },
    { // Nível 7
        paredes: [{ x: 350, y: 120, w: 300, h: 40 }],
        perigos: [
            { x: 180, y: 100, w: 40, h: 40, cor: "#e53e3e" },
            { x: 480, y: 320, w: 40, h: 40, cor: "rgba(229, 62, 62, 0.08)" }
        ]
    },
    { // Nível 8
        paredes: [{ x: 200, y: 0, w: 40, h: 480 }, { x: 600, y: 0, w: 40, h: 480 }],
        perigos: [{ x: 380, y: 220, w: 100, h: 40, cor: "#e53e3e" }]
    },
    { // Nível 9: Caminho Estreito Invisível
        paredes: [],
        perigos: [
            { x: 150, y: 0, w: 550, h: 60, cor: "rgba(49, 130, 206, 0.06)" },
            { x: 150, y: 200, w: 550, h: 280, cor: "rgba(49, 130, 206, 0.06)" }
        ]
    },
    { // Nível 10: Desafio Final
        paredes: [{ x: 420, y: 0, w: 40, h: 480 }],
        perigos: [
            { x: 180, y: 100, w: 45, h: 45, cor: "#e53e3e" },
            { x: 180, y: 320, w: 45, h: 45, cor: "#3182ce" },
            { x: 620, y: 200, w: 50, h: 50, cor: "rgba(229, 62, 62, 0.1)" }
        ]
    }
];

// Comandos unificados (Teclado e Joystick Virtual)
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

    // Captura comandos do teclado (Setas ou WASD) ou do Joystick Virtual
    if (teclas["ArrowUp"] || teclas["KeyW"] || toques.up) my = -jogador.velocidade;
    if (teclas["ArrowDown"] || teclas["KeyS"] || toques.down) my = jogador.velocidade;
    if (teclas["ArrowLeft"] || teclas["KeyA"] || toques.left) mx = -jogador.velocidade;
    if (teclas["ArrowRight"] || teclas["KeyD"] || toques.right) mx = jogador.velocidade;

    if (mx !== 0 && verificarPassagem(jogador.x + mx, jogador.y)) jogador.x += mx;
    if (my !== 0 && verificarPassagem(jogador.x, jogador.y + my)) jogador.y += my;

    const lvl = niveis[levelAtual];

    // Colisão com os perigos
    lvl.perigos.forEach(p => {
        if (jogador.x < p.x + p.w && jogador.x + jogador.tamanho > p.x &&
            jogador.y < p.y + p.h && jogador.y + jogador.tamanho > p.y) {
            computarMorte();
        }
    });

    // Colisão com a chegada
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

    // Grelha de fundo
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const lvl = niveis[levelAtual];

    // Desenha as Paredes Sólidas
    ctx.fillStyle = "#475569";
    lvl.paredes.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Desenha Obstáculos
    lvl.perigos.forEach(p => {
        ctx.fillStyle = p.cor || "#e53e3e";
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // Desenha o Cubo de Chegada
    ctx.fillStyle = "#eab308";
    ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);

    // Desenha o Jogador
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.tamanho, jogador.tamanho);
    
    // Olhinhos
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
