const canvas = document.getElementById("tela-jogo");
const ctx = canvas.getContext("2d");

// Configurações do Personagem (Inspirado no estilo 2D)
let jogador = {
    x: 50,
    y: 200,
    largura: 30,
    altura: 50,
    velocidadeX: 0,
    velocidadeY: 0,
    velocidadeMovimento: 4,
    forcaPulo: 12,
    noChao: false,
    cor: "#8b5a2b" // Cor marrom de início (como uma armadura inicial de madeira)
};

// Configurações do Cenário (Física)
const gravidade = 0.6;
const chaoY = 350; // Linha onde fica o chão

// Controles do Teclado
let teclas = {};

window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
});

window.addEventListener("keyup", (e) => {
    teclas[e.code] = false;
});

// Atualiza a física do jogo
function atualizar() {
    // Movimento para os lados (A / D ou Setas)
    if (teclas["KeyA"] || teclas["ArrowLeft"]) {
        jogador.velocidadeX = -jogador.velocidadeMovimento;
    } else if (teclas["KeyD"] || teclas["ArrowRight"]) {
        jogador.velocidadeX = jogador.velocidadeMovimento;
    } else {
        jogador.velocidadeX = 0;
    }

    // Pulo (Espaço ou Seta para Cima) - Só pula se estiver no chão
    if ((teclas["Space"] || teclas["ArrowUp"]) && jogador.noChao) {
        jogador.velocidadeY = -jogador.forcaPulo;
        jogador.noChao = false;
    }

    // Aplica gravidade
    jogador.velocidadeY += gravidade;

    // Atualiza posições
    jogador.x += jogador.velocidadeX;
    jogador.y += jogador.velocidadeY;

    // Colisão com as bordas laterais da tela
    if (jogador.x < 0) jogador.x = 0;
    if (jogador.x > canvas.width - jogador.largura) jogador.x = canvas.width - jogador.largura;

    // Colisão com o chão
    if (jogador.y >= chaoY - jogador.altura) {
        jogador.y = chaoY - jogador.altura;
        jogador.velocidadeY = 0;
        jogador.noChao = true;
    }
}

// Desenha as coisas na tela
function desenhar() {
    // Limpa a tela e desenha o céu azul do Terraria
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha o chão (Grama verde e terra)
    ctx.fillStyle = "#2e7d32"; // Grama
    ctx.fillRect(0, chaoY, canvas.width, 15);
    ctx.fillStyle = "#5c4033"; // Terra abaixo da grama
    ctx.fillRect(0, chaoY + 15, canvas.width, canvas.height - chaoY);

    // Desenha o nosso herói do RPG
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
}

// Loop principal do jogo
function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

// Inicializa o jogo
loop();
