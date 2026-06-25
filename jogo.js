const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const txtNivel = document.getElementById("txt-nivel");
const txtMoedas = document.getElementById("txt-moedas");
const tituloTopo = document.getElementById("titulo-topo");

// Menus DOM
const menuPausa = document.getElementById("menu-pausa");
const menuNiveis = document.getElementById("menu-niveis");
const gridNiveis = document.getElementById("grid-niveis");

let levelAtual = 0;
let moedasGlobais = 0;
let jogoPausado = false;

// Jogador menor (14px) para navegar em túneis claustrofóbicos e apertados
let jogador = { x: 25, y: 25, tamanho: 14, cor: "#fadb14", velocidade: 3.5 };
let objetivo = { x: 805, y: 415, tamanho: 25 };

// GERADOR DE 25 NÍVEIS HIPER APERTADOS E DIFÍCEIS
// Cada nível possui exatamente 3 moedas fixas locais
const niveis = [];
for (let i = 0; i < 25; i++) {
    let perigosLocais = [];
    let paredesLocais = [];
    
    // Níveis ímpares ganham paredes horizontais restritivas, pares ganham verticais
    if (i % 2 === 0) {
        paredesLocais.push({ x: 150 + (i*15)%300, y: 0, w: 35, h: 360 });
        paredesLocais.push({ x: 450 + (i*20)%250, y: 100, w: 35, h: 360 });
    } else {
        paredesLocais.push({ x: 0, y: 120 + (i*10)%120, w: 700, h: 35 });
        paredesLocais.push({ x: 150, y: 280 + (i*8)%100, w: 700, h: 35 });
    }

    // Adicionando obstáculos assassinos móveis ou semi-invisíveis progressivos
    if (i > 5) {
        perigosLocais.push({ x: 300, y: 50, w: 25, h: 25, vx: 0, vy: 4 + (i%5), cor: "#e53e3e" });
    }
    if (i > 12) {
        perigosLocais.push({ x: 600, y: 200, w: 25, h: 25, vx: 3 + (i%4), vy: 0, cor: "#3182ce" });
    }
    if (i > 18) { // Zonas invisíveis sufocantes nos níveis finais
        perigosLocais.push({ x: i*10, y: 150, w: 180, h: 45, vx: 0, vy: 0, cor: "rgba(229,62,62,0.18)" });
    }

    // Criação de 3 posições de moedas variadas e distantes por nível
    let moedasLocais = [
        { id: 0, x: 200 + (i * 20) % 200, y: 60 + (i * 15) % 300, coletada: false, tamanho: 10 },
        { id: 1, x: 400 + (i * 10) % 200, y: 200 + (i * 5) % 200, coletada: false, tamanho: 10 },
        { id: 2, x: 650 + (i * 5) % 100, y: 80 + (i * 12) % 300, coletada: false, tamanho: 10 }
    ];

    niveis.push({
        paredes: paredesLocais,
        perigos: perigosLocais,
        moedas: moedasLocais
    });
}

// Controles unificados
let teclas = {};
window.addEventListener("keydown", e => { if(!jogoPausado) teclas[e.code] = true; });
window.addEventListener("keyup", e => teclas[e.code] = false);

let toques = { up: false, down: false, left: false, right: false };
configurarBotao("btn-up", "up"); configurarBotao("btn-down", "down");
configurarBotao("btn-left", "left"); configurarBotao("btn-right", "right");

function configurarBotao(id, direcao) {
    const btn = document.getElementById(id);
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); if(!jogoPausado) toques[direcao] = true; });
    btn.addEventListener("pointerup", (e) => { e.preventDefault(); toques[direcao] = false; });
    btn.addEventListener("pointerleave", (e) => { e.preventDefault(); toques[direcao] = false; });
}

// Botão AÇÃO 2: Controla a abertura do Menu de Pausa
document.getElementById("btn-acao2").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    alternarMenuPausa();
});

// Ações internas do Menu
document.getElementById("m-btn-voltar").onclick = alternarMenuPausa;
document.getElementById("m-btn-niveis").onclick = abrirMenuNiveis;
document.getElementById("m-btn-fechar-niveis").onclick = fecharMenuNiveis;
document.getElementById("m-btn-skills").onclick = () => alert("Árvore de Habilidade (Em Breve!)");

function alternarMenuPausa() {
    jogoPausado = !jogoPausado;
    menuPausa.style.display = jogoPausado ? "flex" : "none";
    if(!jogoPausado) menuNiveis.style.display = "none";
    // Zera os movimentos vigentes ao pausar
    teclas = {}; toques = { up: false, down: false, left: false, right: false };
}

function abrirMenuNiveis() {
    menuPausa.style.display = "none";
    menuNiveis.style.display = "flex";
    renderizarListaNiveis();
}

function fecharMenuNiveis() {
    menuNiveis.style.display = "none";
    menuPausa.style.display = "flex";
}

// Constrói visualmente o Menu de Níveis com os quadradinhos cinzas/amarelos das moedas
function renderizarListaNiveis() {
    gridNiveis.innerHTML = "";
    niveis.forEach((lvl, index) => {
        const item = document.createElement("div");
        item.className = "item-nivel";
        item.innerHTML = `<div>NIV ${index + 1}</div>`;
        
        // Área dos 3 quadradinhos sob o nível
        const containerMoedas = document.createElement("div");
        containerMoedas.className = "moedas-status";
        
        lvl.moedas.forEach(m => {
            const quad = document.createElement("div");
            quad.className = `quadradinho-moeda ${m.coletada ? "coletado" : ""}`;
            containerMoedas.appendChild(quad);
        });
        
        item.appendChild(containerMoedas);
        
        // Clique para teletransportar de nível através do menu
        item.onclick = () => {
            levelAtual = index;
            atualizarInterfaceTexto();
            resetJogador();
            alternarMenuPausa();
        };
        
        gridNiveis.appendChild(item);
    });
}

function resetJogador() {
    jogador.x = 25;
    jogador.y = 25;
}

function computarMorte() {
    resetJogador(); // Sem perda de vidas, apenas reinicia o posicionamento
}

function atualizarInterfaceTexto() {
    txtNivel.innerText = `${levelAtual + 1}/25`;
    tituloTopo.innerText = `LABIRINTO CLAUSTRÓFOBICO: NÍVEL ${levelAtual + 1}/25`;
    txtMoedas.innerText = moedasGlobais;
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
    if (jogoPausado) return;

    let mx = 0;
    let my = 0;

    if (teclas["ArrowUp"] || teclas["KeyW"] || toques.up) my = -jogador.velocidade;
    if (teclas["ArrowDown"] || teclas["KeyS"] || toques.down) my = jogador.velocidade;
    if (teclas["ArrowLeft"] || teclas["KeyA"] || toques.left) mx = -jogador.velocidade;
    if (teclas["ArrowRight"] || teclas["KeyD"] || toques.right) mx = jogador.velocidade;

    if (mx !== 0 && verificarPassagem(jogador.x + mx, jogador.y)) jogador.x += mx;
    if (my !== 0 && verificarPassagem(jogador.x, jogador.y + my)) jogador.y += my;

    const lvl = niveis[levelAtual];

    // Interseção e Coleta de Moedas (Persistente)
    lvl.moedas.forEach(m => {
        if (!m.coletada) {
            if (jogador.x < m.x + m.tamanho && jogador.x + jogador.tamanho > m.x &&
                jogador.y < m.y + m.tamanho && jogador.y + jogador.tamanho > m.y) {
                m.coletada = true;
                moedasGlobais++;
                atualizarInterfaceTexto();
            }
        }
    });

    // Colisão com Obstáculos Ativos
    lvl.perigos.forEach(p => {
        if (jogador.x < p.x + p.w && jogador.x + jogador.tamanho > p.x &&
            jogador.y < p.y + p.h && jogador.y + jogador.tamanho > p.y) {
            computarMorte();
        }
        
        if(p.vx) p.x += p.vx;
        if(p.vy) p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width - p.w) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height - p.h) p.vy *= -1;
    });

    // Ponto de Chegada
    if (jogador.x < objetivo.x + objetivo.tamanho && jogador.x + jogador.tamanho > objetivo.x &&
        jogador.y < objetivo.y + objetivo.tamanho && jogador.y + jogador.tamanho > objetivo.y) {
        
        if (levelAtual < niveis.length - 1) {
            levelAtual++;
            atualizarInterfaceTexto();
            resetJogador();
        } else {
            alert("INCRÍVEL! VOCÊ SOBREVIVEU AOS 25 NÍVEIS DO LABIRINTO!");
            levelAtual = 0;
            atualizarInterfaceTexto();
            resetJogador();
        }
    }
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grelha apertada do fundo
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const lvl = niveis[levelAtual];

    // Desenha Paredes Sólidas Claustrofóbicas
    ctx.fillStyle = "#334155";
    lvl.paredes.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Desenha Moedas Locais Ativas (Apenas se não coletadas antes)
    lvl.moedas.forEach(m => {
        if (!m.coletada) {
            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            ctx.arc(m.x + m.tamanho/2, m.y + m.tamanho/2, m.tamanho/2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Desenha Obstáculos
    lvl.perigos.forEach(p => {
        ctx.fillStyle = p.cor;
        ctx.fillRect(p.x, p.y, p.w, p.h);
    });

    // Desenha Ponto de Chegada
    ctx.fillStyle = "#10b981";
    ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(objetivo.x + 3, objetivo.y + 3, objetivo.tamanho - 6, objetivo.tamanho - 6);

    // Desenha o Personagem
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.tamanho, jogador.tamanho);
    
    ctx.fillStyle = "#000";
    ctx.fillRect(jogador.x + 2, jogador.y + 3, 2, 4);
    ctx.fillRect(jogador.x + 9, jogador.y + 3, 2, 4);
}

function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

loop();
