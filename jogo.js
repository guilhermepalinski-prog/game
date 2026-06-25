const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const txtNivel = document.getElementById("txt-nivel");
const txtMoedas = document.getElementById("txt-moedas");
const tituloTopo = document.getElementById("titulo-topo");
const skillMoedasText = document.getElementById("skill-moedas");

// Elementos DOM de Menus
const menuPausa = document.getElementById("menu-pausa");
const menuNiveis = document.getElementById("menu-niveis");
const menuSkills = document.getElementById("menu-skills");
const gridNiveis = document.getElementById("grid-niveis");

let levelAtual = 0;
let levelMaxDesbloqueado = 0; 
let moedasGlobais = 0;
let jogoPausado = false;

// Estado das Habilidades da Skill Tree
let upgrades = {
    espada: false,
    dano: false,
    alcance: false
};

// Configurações Básicas de Combate (Velocidade ligeiramente ajustada para desvios rápidos)
let jogador = { x: 25, y: 25, tamanho: 14, cor: "#fadb14", velocidade: 4.0 };
let objetivo = { x: 805, y: 415, tamanho: 25 };
let ataqueAtivo = false;
let timerAtaque = 0;

// Propriedades Estáticas de Estrelas
const estrelas = [];
for (let s = 0; s < 100; s++) {
    estrelas.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 });
}

// Boss e Projéteis
let bossAtual = null;
let tirosBoss = [];

// GERADOR DE 25 NÍVEIS VARIADOS COM QUANTIDADE MASSIVA DE INIMIGOS
const niveis = [];
for (let i = 0; i < 25; i++) {
    let paredesLocais = [];
    let perigosLocais = [];
    let tipoNivel = i % 4; // 4 variações estruturais de mapas repetidas progressivamente

    // --- VARIANTES DE MAPAS ---
    if (tipoNivel === 0) {
        // Labirinto em Grade Vertical Ultra Apertada
        for (let w = 120; w < 800; w += 140) {
            paredesLocais.push({ x: w, y: (w % 3 === 0) ? 0 : 100, w: 40, h: 360 });
        }
    } else if (tipoNivel === 1) {
        // Linhas Horizontais Consecutivas (Estilo serpentina sufocante)
        paredesLocais.push({ x: 0, y: 90, w: 730, h: 40 });
        paredesLocais.push({ x: 120, y: 200, w: 730, h: 40 });
        paredesLocais.push({ x: 0, y: 310, w: 730, h: 40 });
    } else if (tipoNivel === 2) {
        // O Funil Espiral Central
        paredesLocais.push({ x: 100, y: 100, w: 650, h: 40 });
        paredesLocais.push({ x: 100, y: 140, w: 40, h: 220 });
        paredesLocais.push({ x: 140, y: 320, w: 550, h: 40 });
        paredesLocais.push({ x: 650, y: 180, w: 40, h: 150 });
    } else {
        // Pilares Desconectados Caóticos
        for (let px = 150; px < 800; px += 160) {
            for (let py = 60; py < 400; py += 150) {
                paredesLocais.push({ x: px, y: py, w: 50, h: 50 });
            }
        }
    }

    // --- MULTIPLICAÇÃO DRÁSTICA DE INIMIGOS (Aumenta conforme o nível progride) ---
    let totalInimigos = 6 + Math.floor(i * 1.5); // Começa com 6 inimigos e termina com mais de 40 ativos simultâneos
    
    for (let k = 0; k < totalInimigos; k++) {
        let posX = 150 + (k * 45) % 600;
        let posY = 50 + (k * 35) % 360;
        
        // Padrões alternados de movimentação para os enxames
        let dirX = (k % 2 === 0) ? (4 + (i * 0.15)) : 0;
        let dirY = (k % 2 !== 0) ? (4 + (i * 0.15)) : 0;
        
        // Níveis mais altos ganham inimigos velozes que andam em diagonal livre
        if (i > 10 && k % 3 === 0) {
            dirX = 3.5 + (i * 0.1);
            dirY = 3.5 + (i * 0.1);
        }

        // Variabilidade de cores e propriedades dos perigos
        let corPerigo = "#e53e3e";
        if (k % 3 === 1) corPerigo = "#3182ce"; // Azuis velozes
        if (i > 15 && k % 4 === 0) corPerigo = "rgba(239, 68, 68, 0.25)"; // Fantasmas Semi-Invisíveis

        perigosLocais.push({
            x: posX,
            y: posY,
            w: 16,
            h: 16, // Tamanho reduzido para caber mais inimigos sem trancar o mapa completamente
            vx: dirX,
            vy: dirY,
            cor: corPerigo
        });
    }

    // 3 Moedas por Nível
    let moedasLocais = [
        { id: 0, x: 180 + (i * 22) % 120, y: 60 + (i * 14) % 200, coletada: false, tamanho: 10 },
        { id: 1, x: 390 + (i * 11) % 150, y: 220 + (i * 27) % 160, coletada: false, tamanho: 10 },
        { id: 2, x: 700 + (i * i) % 90, y: 150 + (i * 9) % 200, coletada: false, tamanho: 10 }
    ];

    niveis.push({ paredes: paredesLocais, perigos: perigosLocais, moedas: moedasLocais });
}

// Gatilho e spawn do Boss (Níveis 5, 10, 15, 20 e 25)
function checarEGerarBoss() {
    tirosBoss = [];
    const n = levelAtual + 1;
    if (n % 5 === 0) {
        let vidaBoss = 4 + (n / 5) * 3; 
        bossAtual = {
            x: 395, y: 200, w: 65, h: 65,
            vidaMax: vidaBoss, vida: vidaBoss,
            timerTiro: 0,
            intervaloTiro: Math.max(12, 50 - n) // Padrões de tiros absurdamente velozes em leveis avançados
        };
    } else {
        bossAtual = null;
    }
}

// Input Handler
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

// Botões de Ações de Menu e Combate
document.getElementById("btn-acao1").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (upgrades.espada && !ataqueAtivo && !jogoPausado) {
        ataqueAtivo = true;
        timerAtaque = 10;
        executarAtaqueEspada();
    }
});

document.getElementById("btn-acao2").addEventListener("pointerdown", (e) => { e.preventDefault(); abrirMenuPrincipal(); });
document.getElementById("m-btn-voltar").onclick = fecharMenuPrincipal;
document.getElementById("m-btn-niveis").onclick = abrirMenuNiveis;
document.getElementById("m-btn-fechar-niveis").onclick = fecharMenuNiveis;
document.getElementById("m-btn-skills").onclick = abrirMenuSkills;
document.getElementById("m-btn-fechar-skills").onclick = fecharMenuSkills;

function abrirMenuPrincipal() { jogoPausado = true; menuPausa.style.display = "flex"; }
function fecharMenuPrincipal() { jogoPausado = false; menuPausa.style.display = "none"; teclas = {}; toques = { up: false, down: false, left: false, right: false }; }
function abrirMenuNiveis() { menuPausa.style.display = "none"; menuNiveis.style.display = "flex"; renderizarListaNiveis(); }
function fecharMenuNiveis() { menuNiveis.style.display = "none"; menuPausa.style.display = "flex"; }
function abrirMenuSkills() { menuPausa.style.display = "none"; menuSkills.style.display = "flex"; atualizarVisualSkillTree(); }
function fecharMenuSkills() { menuSkills.style.display = "none"; menuPausa.style.display = "flex"; }

function atualizarVisualSkillTree() {
    skillMoedasText.innerText = moedasGlobais;
    const btnEspada = document.getElementById("sk-espada");
    const btnDano = document.getElementById("sk-dano");
    const btnAlcance = document.getElementById("sk-alcance");

    if(upgrades.espada) {
        btnEspada.innerText = "ESPADA: COMPRADA";
        btnEspada.className = "btn-menu bloqueado";
        btnDano.className = upgrades.dano ? "btn-menu bloqueado" : "btn-menu";
        btnDano.innerText = upgrades.dano ? "DANO +1: MAX" : "AUMENTAR DANO [5 MOEDAS]";
        btnAlcance.className = upgrades.alcance ? "btn-menu bloqueado" : "btn-menu";
        btnAlcance.innerText = upgrades.alcance ? "ALCANCE +20px: MAX" : "AUMENTAR ALCANCE [5 MOEDAS]";
    } else {
        btnDano.className = "btn-menu bloqueado";
        btnAlcance.className = "btn-menu bloqueado";
    }
}

document.getElementById("sk-espada").onclick = () => { if(!upgrades.espada && moedasGlobais >= 10) { moedasGlobais -= 10; upgrades.espada = true; atualizarInterfaceTexto(); atualizarVisualSkillTree(); } };
document.getElementById("sk-dano").onclick = () => { if(upgrades.espada && !upgrades.dano && moedasGlobais >= 5) { moedasGlobais -= 5; upgrades.dano = true; atualizarInterfaceTexto(); atualizarVisualSkillTree(); } };
document.getElementById("sk-alcance").onclick = () => { if(upgrades.espada && !upgrades.alcance && moedasGlobais >= 5) { moedasGlobais -= 5; upgrades.alcance = true; atualizarInterfaceTexto(); atualizarVisualSkillTree(); } };

function renderizarListaNiveis() {
    gridNiveis.innerHTML = "";
    niveis.forEach((lvl, index) => {
        const item = document.createElement("div");
        const estaTravado = index > levelMaxDesbloqueado;
        item.className = `item-nivel ${estaTravado ? "travado" : ""}`;
        item.innerHTML = `<div>NIV ${index + 1}</div>`;
        
        const containerMoedas = document.createElement("div");
        containerMoedas.className = "moedas-status";
        lvl.moedas.forEach(m => {
            const quad = document.createElement("div");
            quad.className = `quadradinho-moeda ${m.coletada ? "coletado" : ""}`;
            containerMoedas.appendChild(quad);
        });
        item.appendChild(containerMoedas);
        
        if (!estaTravado) {
            item.onclick = () => {
                levelAtual = index;
                atualizarInterfaceTexto();
                resetJogador();
                checarEGerarBoss();
                fecharMenuPrincipal();
                menuNiveis.style.display = "none";
            };
        }
        gridNiveis.appendChild(item);
    });
}

function resetJogador() {
    jogador.x = 25;
    jogador.y = 25;
}

function executarAtaqueEspada() {
    if (!bossAtual) return;
    let alcanceCorte = upgrades.alcance ? 55 : 35;
    let danoCorte = upgrades.dano ? 2 : 1;

    let centroJogadorX = jogador.x + jogador.tamanho / 2;
    let centroJogadorY = jogador.y + jogador.tamanho / 2;
    let centroBossX = bossAtual.x + bossAtual.w / 2;
    let centroBossY = bossAtual.y + bossAtual.h / 2;

    let dist = Math.hypot(centroBossX - centroJogadorX, centroBossY - centroJogadorY);
    if (dist <= alcanceCorte + bossAtual.w / 2) {
        bossAtual.vida -= danoCorte;
        if (bossAtual.vida <= 0) {
            moedasGlobais += 5;
            bossAtual = null;
            tirosBoss = [];
            atualizarInterfaceTexto();
        }
    }
}

function atualizarInterfaceTexto() {
    txtNivel.innerText = `${levelAtual + 1}/25`;
    tituloTopo.innerText = `ESPAÇO ENCLAUSURADO: NÍVEL ${levelAtual + 1}/25`;
    txtMoedas.innerText = moedasGlobais;
}

function verificarPassagem(proximoX, proximoY) {
    if (proximoX < 0 || proximoY < 0 || proximoX > canvas.width - jogador.tamanho || proximoY > canvas.height - jogador.tamanho) return false;
    const lvl = niveis[levelAtual];
    for (let p of lvl.paredes) {
        if (proximoX < p.x + p.w && proximoX + jogador.tamanho > p.x && proximoY < p.y + p.h && proximoY + jogador.tamanho > p.y) return false;
    }
    return true;
}

function atualizar() {
    if (jogoPausado) return;

    if (timerAtaque > 0) { timerAtaque--; if(timerAtaque === 0) ataqueAtivo = false; }

    let mx = 0;
    let my = 0;
    if (teclas["ArrowUp"] || teclas["KeyW"] || toques.up) my = -jogador.velocidade;
    if (teclas["ArrowDown"] || teclas["KeyS"] || toques.down) my = jogador.velocidade;
    if (teclas["ArrowLeft"] || teclas["KeyA"] || toques.left) mx = -jogador.velocidade;
    if (teclas["ArrowRight"] || teclas["KeyD"] || toques.right) mx = jogador.velocidade;

    if (mx !== 0 && verificarPassagem(jogador.x + mx, jogador.y)) jogador.x += mx;
    if (my !== 0 && verificarPassagem(jogador.x, jogador.y + my)) jogador.y += my;

    const lvl = niveis[levelAtual];

    // Moedas Estáticas
    lvl.moedas.forEach(m => {
        if (!m.coletada) {
            if (jogador.x < m.x + m.tamanho && jogador.x + jogador.tamanho > m.x && jogador.y < m.y + m.tamanho && ...
                jogador.y + jogador.tamanho > m.y) {
                m.coletada = true;
                moedasGlobais++;
                atualizarInterfaceTexto();
            }
        }
    });

    // Movimento e detecção de enxames de inimigos normais
    lvl.perigos.forEach(p => {
        if (jogador.x < p.x + p.w && jogador.x + jogador.tamanho > p.x && jogador.y < p.y + p.h && jogador.y + jogador.tamanho > p.y) {
            resetJogador();
        }
        
        if(p.vx) p.x += p.vx;
        if(p.vy) p.y += p.vy;

        // Rebater nas paredes ou bordas
        if (p.x < 0 || p.x > canvas.width - p.w) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height - p.h) p.vy *= -1;
        
        // Colisão extra física com as barreiras internas para criar padrões caóticos
        lvl.paredes.forEach(par => {
            if (p.x < par.x + par.w && p.x + p.w > par.x && p.y < par.y + par.h && p.y + p.h > par.y) {
                if(p.vx) p.vx *= -1;
                if(p.vy) p.vy *= -1;
            }
        });
    });

    // Padrão de Tiros do Boss
    if (bossAtual) {
        bossAtual.timerTiro++;
        if (bossAtual.timerTiro >= bossAtual.intervaloTiro) {
            bossAtual.timerTiro = 0;
            // 8 Ângulos de tiro explosivos simultâneos
            let angulos = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
            angulos.forEach(ang => {
                tirosBoss.push({
                    x: bossAtual.x + bossAtual.w/2,
                    y: bossAtual.y + bossAtual.h/2,
                    vx: Math.cos(ang) * 5.2,
                    vy: Math.sin(ang) * 5.2,
                    tamanho: 6
                });
            });
        }

        if (jogador.x < bossAtual.x + bossAtual.w && jogador.x + jogador.tamanho > bossAtual.x &&
            jogador.y < bossAtual.y + bossAtual.h && jogador.y + jogador.tamanho > bossAtual.y) {
            resetJogador();
        }
    }

    // Processamento de projéteis ativos
    for (let t = tirosBoss.length - 1; t >= 0; t--) {
        let tiro = tirosBoss[t];
        tiro.x += tiro.vx;
        tiro.y += tiro.vy;

        if (jogador.x < tiro.x + tiro.tamanho && jogador.x + jogador.tamanho > tiro.x &&
            jogador.y < tiro.y + tiro.tamanho && jogador.y + jogador.tamanho > tiro.y) {
            resetJogador();
            break;
        }

        if(tiro.x < 0 || tiro.x > canvas.width || tiro.y < 0 || tiro.y > canvas.height) {
            tirosBoss.splice(t, 1);
        }
    }

    // Condição de vitória no portal de chegada
    if (!bossAtual) {
        if (jogador.x < objetivo.x + objetivo.tamanho && jogador.x + jogador.tamanho > objetivo.x && jogador.y < objetivo.y + objetivo.tamanho && jogador.y + jogador.tamanho > objetivo.y) {
            if (levelAtual < niveis.length - 1) {
                levelAtual++;
                if(levelAtual > levelMaxDesbloqueado) levelMaxDesbloqueado = levelAtual;
                atualizarInterfaceTexto();
                resetJogador();
                checarEGerarBoss();
            } else {
                alert("SOBRE-HUMANO! VOCÊ CONSEGUIU ZERAR O LABIRINTO INFERNAL!");
                levelAtual = 0;
                atualizarInterfaceTexto();
                resetJogador();
                checarEGerarBoss();
            }
        }
    }
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo Estrelado
    ctx.fillStyle = "#ffffff";
    estrelas.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI*2);
        ctx.fill();
    });

    const lvl = niveis[levelAtual];

    // Paredes do Labirinto
    ctx.fillStyle = "#1e293b";
    lvl.paredes.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Moedas
    lvl.moedas.forEach(m => {
        if (!m.coletada) {
            ctx.fillStyle = "#eab308";
            ctx.beginPath(); ctx.arc(m.x + m.tamanho/2, m.y + m.tamanho/2, m.tamanho/2, 0, Math.PI * 2); ctx.fill();
        }
    });

    // Enxame de Perigos
    lvl.perigos.forEach(p => { ctx.fillStyle = p.cor; ctx.fillRect(p.x, p.y, p.w, p.h); });

    // Boss de Fase
    if (bossAtual) {
        ctx.fillStyle = "#a855f7";
        ctx.fillRect(bossAtual.x, bossAtual.y, bossAtual.w, bossAtual.h);
        
        // Barra de saúde
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(bossAtual.x, bossAtual.y - 12, bossAtual.w, 5);
        ctx.fillStyle = "#ef4444";
        let larguraVida = (bossAtual.vida / bossAtual.vidaMax) * bossAtual.w;
        ctx.fillRect(bossAtual.x, bossAtual.y - 12, larguraVida, 5);
    }

    // Tiros na tela
    ctx.fillStyle = "#ec4899";
    tirosBoss.forEach(t => { ctx.beginPath(); ctx.arc(t.x, t.y, t.tamanho, 0, Math.PI*2); ctx.fill(); });

    // Ponto de Saída Verde
    if (!bossAtual) {
        ctx.fillStyle = "#10b981";
        ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
        ctx.strokeRect(objetivo.x + 3, objetivo.y + 3, objetivo.tamanho - 6, objetivo.tamanho - 6);
    }

    // Efeito Visual de Golpe
    if (ataqueAtivo && upgrades.espada) {
        let rCorte = upgrades.alcance ? 55 : 35;
        ctx.strokeStyle = "rgba(14, 165, 233, 0.8)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(jogador.x + jogador.tamanho/2, jogador.y + jogador.tamanho/2, rCorte, 0, Math.PI*2);
        ctx.stroke();
    }

    // Personagem e Olhinhos
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

checarEGerarBoss();
loop();
