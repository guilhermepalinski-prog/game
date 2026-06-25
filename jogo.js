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
let levelMaxDesbloqueado = 0; // Sistema de progressão obrigatória
let moedasGlobais = 0;
let jogoPausado = false;

// Estado das Habilidades da Skill Tree
let upgrades = {
    espada: false,
    dano: false,
    alcance: false
};

// Configurações Básicas de Combate
let jogador = { x: 25, y: 25, tamanho: 14, cor: "#fadb14", velocidade: 3.8 };
let objetivo = { x: 805, y: 415, tamanho: 25 };
let ataqueAtivo = false;
let timerAtaque = 0;

// Propriedades Estáticas de Estrelas (Fundo Espacial)
const estrelas = [];
for (let s = 0; s < 80; s++) {
    estrelas.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 });
}

// Boss Atual do nível
let bossAtual = null;
let tirosBoss = [];

// Gerador de 25 Níveis com Altíssima Dificuldade e Clausura Extrema
const niveis = [];
for (let i = 0; i < 25; i++) {
    let paredesLocais = [];
    let perigosLocais = [];
    
    // Configurações de labirintos e corredores estreitos muito mais colados
    if (i % 2 === 0) {
        paredesLocais.push({ x: 130 + (i*12)%200, y: 0, w: 45, h: 380 });
        paredesLocais.push({ x: 380 + (i*15)%200, y: 80, w: 45, h: 380 });
        paredesLocais.push({ x: 630, y: 0, w: 45, h: 380 });
    } else {
        paredesLocais.push({ x: 0, y: 100 + (i*8)%100, w: 720, h: 45 });
        paredesLocais.push({ x: 100, y: 250 + (i*6)%100, w: 750, h: 45 });
    }

    // Inimigos com velocidades punitivas e imbatíveis sem reflexo rápido
    perigosLocais.push({ x: 240, y: 40, w: 22, h: 22, vx: 0, vy: 6.5 + (i*0.4), cor: "#e53e3e" });
    if (i > 4) perigosLocais.push({ x: 480, y: 200, w: 22, h: 22, vx: 5.5 + (i*0.3), vy: 0, cor: "#3182ce" });
    if (i > 11) perigosLocais.push({ x: 100 + (i*5), y: 320, w: 160, h: 40, vx: 0, vy: 0, cor: "rgba(229,62,62,0.18)" }); // Semi-Invisível
    if (i > 18) perigosLocais.push({ x: 700, y: 40, w: 20, h: 20, vx: -7, vy: 5, cor: "#ef4444" });

    let moedasLocais = [
        { id: 0, x: 190 + (i * 15) % 150, y: 50 + (i * 10) % 250, coletada: false, tamanho: 10 },
        { id: 1, x: 340 + (i * 25) % 150, y: 180 + (i * 5) % 200, coletada: false, tamanho: 10 },
        { id: 2, x: 720 + (i * 3) % 80, y: 120 + (i * 8) % 200, coletada: false, tamanho: 10 }
    ];

    niveis.push({ paredes: paredesLocais, perigos: perigosLocais, moedas: moedasLocais });
}

// Gatilho e spawn do Boss (A cada 5 níveis)
function checarEGerarBoss() {
    tirosBoss = [];
    const n = levelAtual + 1;
    if (n % 5 === 0) {
        // Vida escalona baseado no nível do Boss
        let vidaBoss = 3 + (n / 5) * 2; 
        bossAtual = {
            x: 400, y: 200, w: 60, h: 60,
            vidaMax: vidaBoss, vida: vidaBoss,
            timerTiro: 0,
            intervaloTiro: Math.max(20, 60 - n) // Atira mais rápido em leveis maiores
        };
    } else {
        bossAtual = null;
    }
}

// Entrada de Controles
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

// AÇÕES DOS BOTÕES DE INTERFACE
document.getElementById("btn-acao1").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (upgrades.espada && !ataqueAtivo && !jogoPausado) {
        ataqueAtivo = true;
        timerAtaque = 12; // Duração visual do frame de corte
        executarAtaqueEspada();
    }
});

document.getElementById("btn-acao2").addEventListener("pointerdown", (e) => { e.preventDefault(); abrirMenuPrincipal(); });
document.getElementById("m-btn-voltar").onclick = fecharMenuPrincipal;
document.getElementById("m-btn-niveis").onclick = abrirMenuNiveis;
document.getElementById("m-btn-fechar-niveis").onclick = fecharMenuNiveis;
document.getElementById("m-btn-skills").onclick = abrirMenuSkills;
document.getElementById("m-btn-fechar-skills").onclick = fecharMenuSkills;

// Gerenciamento dos Menus
function abrirMenuPrincipal() {
    jogoPausado = true;
    menuPausa.style.display = "flex";
}
function fecharMenuPrincipal() {
    jogoPausado = false;
    menuPausa.style.display = "none";
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
function abrirMenuSkills() {
    menuPausa.style.display = "none";
    menuSkills.style.display = "flex";
    atualizarVisualSkillTree();
}
function fecharMenuSkills() {
    menuSkills.style.display = "none";
    menuPausa.style.display = "flex";
}

// Atualização da árvore de upgrades de habilidades
function atualizarVisualSkillTree() {
    skillMoedasText.innerText = moedasGlobais;
    
    const btnEspada = document.getElementById("sk-espada");
    const btnDano = document.getElementById("sk-dano");
    const btnAlcance = document.getElementById("sk-alcance");

    if(upgrades.espada) {
        btnEspada.innerText = "ESPADA: COMPRADA";
        btnEspada.className = "btn-menu bloqueado";
        
        // Habilita as ramificações seguintes
        btnDano.className = upgrades.dano ? "btn-menu bloqueado" : "btn-menu";
        btnDano.innerText = upgrades.dano ? "DANO +1: MAX" : "AUMENTAR DANO [5 MOEDAS]";
        
        btnAlcance.className = upgrades.alcance ? "btn-menu bloqueado" : "btn-menu";
        btnAlcance.innerText = upgrades.alcance ? "ALCANCE +20px: MAX" : "AUMENTAR ALCANCE [5 MOEDAS]";
    } else {
        btnDano.className = "btn-menu bloqueado";
        btnAlcance.className = "btn-menu bloqueado";
    }
}

// Cliques de compra da Skill Tree
document.getElementById("sk-espada").onclick = () => {
    if(!upgrades.espada && moedasGlobais >= 10) { moedasGlobais -= 10; upgrades.espada = true; atualizarInterfaceTexto(); atualizarVisualSkillTree(); }
};
document.getElementById("sk-dano").onclick = () => {
    if(upgrades.espada && !upgrades.dano && moedasGlobais >= 5) { moedasGlobais -= 5; upgrades.dano = true; atualizarInterfaceTexto(); atualizarVisualSkillTree(); }
};
document.getElementById("sk-alcance").onclick = () => {
    if(upgrades.espada && !upgrades.alcance && moedasGlobais >= 5) { moedasGlobais -= 5; upgrades.alcance = true; atualizarInterfaceTexto(); atualizarVisualSkillTree(); }
};

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

    // Calcula distância até o centro do Boss
    let centroJogadorX = jogador.x + jogador.tamanho / 2;
    let centroJogadorY = jogador.y + jogador.tamanho / 2;
    let centroBossX = bossAtual.x + bossAtual.w / 2;
    let centroBossY = bossAtual.y + bossAtual.h / 2;

    let dist = Math.hypot(centroBossX - centroJogadorX, centroBossY - centroJogadorY);
    if (dist <= alcanceCorte + bossAtual.w / 2) {
        bossAtual.vida -= danoCorte;
        if (bossAtual.vida <= 0) {
            // Dropa 5 moedas ao jogador e limpa boss
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

    // Moedas (Memória mantida)
    lvl.moedas.forEach(m => {
        if (!m.coletada) {
            if (jogador.x < m.x + m.tamanho && jogador.x + jogador.tamanho > m.x && jogador.y < m.y + m.tamanho && jogador.y + jogador.tamanho > m.y) {
                m.coletada = true;
                moedasGlobais++;
                atualizarInterfaceTexto();
            }
        }
    });

    // Inimigos padrão e perigos fixos de mapa
    lvl.perigos.forEach(p => {
        if (jogador.x < p.x + p.w && jogador.x + jogador.tamanho > p.x && jogador.y < p.y + p.h && jogador.y + jogador.tamanho > p.y) {
            resetJogador();
        }
        if(p.vx) p.x += p.vx;
        if(p.vy) p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width - p.w) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height - p.h) p.vy *= -1;
    });

    // IA do Boss ativo e Tiros
    if (bossAtual) {
        bossAtual.timerTiro++;
        if (bossAtual.timerTiro >= bossAtual.intervaloTiro) {
            bossAtual.timerTiro = 0;
            // Padrão de tiros multidirecionais (estrela em cruz e diagonais)
            let angulos = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
            angulos.forEach(ang => {
                tirosBoss.push({
                    x: bossAtual.x + bossAtual.w/2,
                    y: bossAtual.y + bossAtual.h/2,
                    vx: Math.cos(ang) * 4.5,
                    vy: Math.sin(ang) * 4.5,
                    tamanho: 6
                });
            });
        }

        // Colisão com o corpo do Boss
        if (jogador.x < bossAtual.x + bossAtual.w && jogador.x + jogador.tamanho > bossAtual.x &&
            jogador.y < bossAtual.y + bossAtual.h && jogador.y + jogador.tamanho > bossAtual.y) {
            resetJogador();
        }
    }

    // Movimentação e colisão com os Projéteis do Boss
    for (let t = tirosBoss.length - 1; t >= 0; t--) {
        let tiro = tirosBoss[t];
        tiro.x += tiro.vx;
        tiro.y += tiro.vy;

        // Acertou jogador
        if (jogador.x < tiro.x + tiro.tamanho && jogador.x + jogador.tamanho > tiro.x &&
            jogador.y < tiro.y + tiro.tamanho && jogador.y + jogador.tamanho > tiro.y) {
            resetJogador();
            break;
        }

        // Destrói projétil fora dos limites
        if(tiro.x < 0 || tiro.x > canvas.width || tiro.y < 0 || tiro.y > canvas.height) {
            tirosBoss.splice(t, 1);
        }
    }

    // Ponto de Chegada (Apenas desbloqueado se o Boss estiver morto)
    if (!bossAtual) {
        if (jogador.x < objetivo.x + objetivo.tamanho && jogador.x + jogador.tamanho > objetivo.x && jogador.y < objetivo.y + objetivo.tamanho && jogador.y + jogador.tamanho > objetivo.y) {
            if (levelAtual < niveis.length - 1) {
                levelAtual++;
                if(levelAtual > levelMaxDesbloqueado) levelMaxDesbloqueado = levelAtual;
                atualizarInterfaceTexto();
                resetJogador();
                checarEGerarBoss();
            } else {
                alert("IMPRESSIONANTE! VOCÊ DOMINOU O LABIRINTO MÁXIMO!");
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

    // Desenha as Estrelas Siderais no Fundo Escuro do Jogo
    ctx.fillStyle = "#ffffff";
    estrelas.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI*2);
        ctx.fill();
    });

    const lvl = niveis[levelAtual];

    // Desenha Barreiras Sólidas
    ctx.fillStyle = "#1e293b";
    lvl.paredes.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Desenha Moedas
    lvl.moedas.forEach(m => {
        if (!m.coletada) {
            ctx.fillStyle = "#eab308";
            ctx.beginPath(); ctx.arc(m.x + m.tamanho/2, m.y + m.tamanho/2, m.tamanho/2, 0, Math.PI * 2); ctx.fill();
        }
    });

    // Obstáculos normais do nível
    lvl.perigos.forEach(p => { ctx.fillStyle = p.cor; ctx.fillRect(p.x, p.y, p.w, p.h); });

    // Desenhar Boss se houver
    if (bossAtual) {
        ctx.fillStyle = "#a855f7"; // Roxo Cósmico para Bosses
        ctx.fillRect(bossAtual.x, bossAtual.y, bossAtual.w, bossAtual.h);
        
        // Barra de Vida acima do Boss
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(bossAtual.x, bossAtual.y - 12, bossAtual.w, 5);
        ctx.fillStyle = "#ef4444";
        let larguraVida = (bossAtual.vida / bossAtual.vidaMax) * bossAtual.w;
        ctx.fillRect(bossAtual.x, bossAtual.y - 12, larguraVida, 5);
    }

    // Projéteis do Boss
    ctx.fillStyle = "#ec4899";
    tirosBoss.forEach(t => { ctx.beginPath(); ctx.arc(t.x, t.y, t.tamanho, 0, Math.PI*2); ctx.fill(); });

    // Desenha Ponto de Chegada (Apenas visível se o Boss estiver derrotado)
    if (!bossAtual) {
        ctx.fillStyle = "#10b981";
        ctx.fillRect(objetivo.x, objetivo.y, objetivo.tamanho, objetivo.tamanho);
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
        ctx.strokeRect(objetivo.x + 3, objetivo.y + 3, objetivo.tamanho - 6, objetivo.tamanho - 6);
    }

    // Desenha Efeito Visual do Ataque de Espada (Arco de Corte)
    if (ataqueAtivo && upgrades.espada) {
        let rCorte = upgrades.alcance ? 55 : 35;
        ctx.strokeStyle = "rgba(14, 165, 233, 0.7)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(jogador.x + jogador.tamanho/2, jogador.y + jogador.tamanho/2, rCorte, 0, Math.PI*2);
        ctx.stroke();
    }

    // Desenha o Jogador Amarelo com Olhinhos
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
