/* ------------------------------------------------------------------
   baixaCredRotativo.js - identifica quais titulos de credito rotativo
   provavelmente receberam a baixa de um pagamento.

   Entradas:
     campo 1 - linha de log do comando 158 (consulta dos titulos em aberto)
     campo 2 - linha de log do comando 38 (recibo) ou apenas o valor pago
     campo 3 - CPF, codigo ou nome do cliente, para validar que 1 e 2 sao
               da mesma pessoa

   Regra da analise: o pagamento quita os titulos do vencimento mais antigo
   para o mais novo, e o ultimo titulo alcancado pode ficar parcial.
   ------------------------------------------------------------------ */

let textoResultado = "";
let idsResultado = "";

/* Qualquer erro inesperado aparece na tela - sem isso a pagina so parava de
   responder e nao dava pista nenhuma do motivo. */
window.addEventListener("error", function (evento) {
    const status = document.getElementById("statusAnalise");
    if (!status) return;
    const arquivo = (evento.filename || "").split("/").pop();
    status.innerText = "Erro na página: " + evento.message +
        (arquivo ? " (" + arquivo + ":" + evento.lineno + ")" : "") +
        ". Tire um print desta mensagem.";
    status.className = "status erro";
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btnGerar").addEventListener("click", analisar);

    /* Diferente das outras paginas, aqui a analise NAO roda sozinha: os campos
       recebem blocos grandes de log colados, e nada deve disparar no momento
       da colagem. Ao mexer nos campos so marcamos o resultado como vencido. */
    ["campo158", "campo38", "campoIdent"].forEach(id => {
        const campo = document.getElementById(id);
        campo.addEventListener("input", marcarPendente);
        campo.addEventListener("keydown", function (e) {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                analisar();
            }
        });
    });

    document.getElementById("campo158").focus();
});

function marcarPendente() {
    const status = document.getElementById("statusAnalise");
    status.innerText = "Dados alterados — clique em Gerar análise.";
    status.className = "status";
    document.getElementById("blocoResultado").classList.add("faded");
}

function analisar() {
    try {
        executarAnalise();
    } catch (erro) {
        const detalhe = (erro && erro.message) ? erro.message : String(erro);
        limpar("Erro inesperado ao analisar: " + detalhe + ". Tire um print desta mensagem.", "status erro");
        if (window.console && console.error) console.error(erro);
    }
}

/* ----------------------------- Parsing ----------------------------- */

/* Isola a linha que contem o comando pedido - o log costuma vir com varias linhas coladas. */
function acharLinhaComando(texto, cmd) {
    const linhas = texto.split(/\r?\n/).filter(l => l.trim());
    return linhas.find(l => l.includes("Comando: " + cmd + "|"))
        || linhas.find(l => new RegExp("(^|[\\s\\t])" + cmd + "\\|").test(l))
        || texto;
}

/* Prefixo do log: 22/09/2026 11:13:58 <tab> 103 <tab> 01 */
function extrairCarimbo(linha) {
    const m = linha.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})\s+(\d+)\s+(\d+)/);
    if (!m) return null;
    return { data: m[1], hora: m[2], ecf: m[3], idLoja: m[4] };
}

/* Corpo do comando, entre "Comando: <cmd>|" e ", Retorno:" */
function extrairCorpoComando(linha, cmd) {
    let m = linha.match(new RegExp("Comando:\\s*" + cmd + "\\|(.*?)(?:,\\s*Retorno:|$)"));
    if (!m) {
        m = linha.match(new RegExp("(?:^|[\\s\\t])" + cmd + "\\|(.*?)(?:,\\s*Retorno:|$)"));
    }
    return m ? m[1] : null;
}

/* Teto do texto aceito e do trabalho de varredura. Sem isso, colar um trecho
   grande do log faz a pagina congelar: a busca do array era quadratica. */
const LIMITE_TEXTO = 1048576;        /* 1 MB por campo */
const MAX_TENTATIVAS = 40;           /* candidatos a array JSON testados */
const ORCAMENTO_VARREDURA = 2000000; /* caracteres percorridos no total */

/* Primeiro caractere nao branco a partir da posicao, olhando so um pedaco curto. */
function proximoNaoBranco(texto, inicio) {
    const fim = Math.min(texto.length, inicio + 40);
    for (let i = inicio; i < fim; i++) {
        const c = texto.charAt(i);
        if (c !== " " && c !== "\t" && c !== "\n" && c !== "\r") return c;
    }
    return "";
}

/* Acha o ] que fecha o [ da posicao indicada, ignorando colchetes dentro de
   strings. Para quando estoura o orcamento, para nao varrer o texto inteiro
   atras de um colchete que nunca fecha. */
function acharFechamento(texto, inicio, orcamento) {
    let nivel = 0, emString = false, escape = false, percorrido = 0;
    for (let i = inicio; i < texto.length; i++) {
        if (++percorrido > orcamento) return { fim: -1, percorrido: percorrido };
        const c = texto.charAt(i);
        if (escape) { escape = false; continue; }
        if (c === "\\") { escape = true; continue; }
        if (c === "\"") { emString = !emString; continue; }
        if (emString) continue;
        if (c === "[") nivel++;
        else if (c === "]") { nivel--; if (nivel === 0) return { fim: i, percorrido: percorrido }; }
    }
    return { fim: -1, percorrido: percorrido };
}

/* Devolve o primeiro array JSON de objetos encontrado depois de "Retorno:".
   So testa colchetes que abrem um array de verdade - "[{" ou "[]" - o que
   descarta de imediato os [INFO], [main] e afins que enchem o log. */
function extrairTitulos(texto) {
    const posRetorno = texto.indexOf("Retorno:");
    const origem = posRetorno >= 0 ? texto.substring(posRetorno) : texto;

    let vazioEncontrado = null;
    let tentativas = 0;
    let orcamento = ORCAMENTO_VARREDURA;
    let i = origem.indexOf("[");

    while (i >= 0 && tentativas < MAX_TENTATIVAS && orcamento > 0) {
        const abertura = proximoNaoBranco(origem, i + 1);
        if (abertura === "{" || abertura === "]") {
            tentativas++;
            const r = acharFechamento(origem, i, orcamento);
            orcamento -= r.percorrido;
            if (r.fim >= 0) {
                let lista = null;
                try {
                    lista = JSON.parse(origem.substring(i, r.fim + 1));
                } catch (e) {
                    lista = null;
                }
                if (Array.isArray(lista)) {
                    if (lista.length && typeof lista[0] === "object" && lista[0] !== null) return lista;
                    if (lista.length === 0 && vazioEncontrado === null) vazioEncontrado = lista;
                }
            }
        }
        i = origem.indexOf("[", i + 1);
    }
    return vazioEncontrado;
}

/* Valor digitado solto: aceita 490, 490.0, 490,00, R$ 1.234,56 */
function lerValorLivre(texto) {
    let limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "").trim();
    if (!/^\d[\d.,]*$/.test(limpo)) return NaN;
    if (limpo.includes(",")) {
        limpo = limpo.replace(/\./g, "").replace(",", ".");
    }
    return parseFloat(limpo);
}

/* ---------------------------- Validacao ---------------------------- */

function soDigitos(v) {
    return (v || "").replace(/\D/g, "").replace(/^0+/, "");
}

function normalizarNome(v) {
    return (v || "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toUpperCase().replace(/\s+/g, " ").trim();
}

function identBate(informado, alvo) {
    if (!informado || !alvo) return false;
    const a = soDigitos(informado);
    const b = soDigitos(alvo);
    return a !== "" && a === b;
}

/* O recibo corta o nome em 30 caracteres, entao prefixo vale como acerto. */
function nomeBate(informado, alvo) {
    const a = normalizarNome(informado);
    const b = normalizarNome(alvo);
    if (a.length < 3 || !b) return false;
    return b.startsWith(a) || a.startsWith(b) || b.includes(a);
}

/* ----------------------------- Analise ----------------------------- */

function executarAnalise() {
    const texto158 = document.getElementById("campo158").value.trim();
    const texto38 = document.getElementById("campo38").value.trim();
    const ident = document.getElementById("campoIdent").value.trim();

    if (!texto158 || !texto38 || !ident) {
        limpar("Preencha os três campos e clique em Gerar análise.", "status");
        return;
    }

    const grande = [["1", texto158], ["2", texto38]].find(c => c[1].length > LIMITE_TEXTO);
    if (grande) {
        limpar("Campo " + grande[0] + ": você colou " + Math.round(grande[1].length / 1024) +
            " KB. Cole apenas a linha do comando, não o trecho inteiro do log.", "status erro");
        return;
    }

    /* ---- campo 1: comando 158 ---- */
    const linha158 = acharLinhaComando(texto158, "158");
    const titulos = extrairTitulos(texto158);
    if (!titulos) {
        limpar("Campo 1: não encontrei a lista de títulos do comando 158. Cole a linha inteira do log, incluindo o trecho \"Retorno: 158|[...]\" — e confira se o colchete final não ficou de fora.", "status erro");
        return;
    }
    if (titulos.length === 0) {
        limpar("Campo 1: o comando 158 retornou a lista vazia — este cliente não tinha nenhum título em aberto no momento da consulta.", "status aviso");
        return;
    }
    const carimbo = extrairCarimbo(linha158);
    const corpo158 = extrairCorpoComando(linha158, "158");
    const ident158 = corpo158 ? corpo158.split("|")[0].trim() : "";

    /* ---- campo 2: comando 38 ou valor solto ---- */
    let valorPago, ident38 = "", nome38 = "", matricula38 = "", pagamentos38 = "", carimbo38 = null;
    const temComando38 = /38\|/.test(texto38);

    if (temComando38) {
        const linha38 = acharLinhaComando(texto38, "38");
        const corpo38 = extrairCorpoComando(linha38, "38");
        if (!corpo38) {
            limpar("Campo 2: não consegui ler o comando 38. Cole a linha do log ou informe apenas o valor pago.", "status erro");
            return;
        }
        const partes = corpo38.split("|");
        ident38 = (partes[0] || "").trim();
        valorPago = parseFloat(partes[1]);
        nome38 = (partes[2] || "").trim();
        matricula38 = (partes[3] || "").trim();
        pagamentos38 = (partes[4] || "").trim();
        carimbo38 = extrairCarimbo(linha38);
    } else {
        valorPago = lerValorLivre(texto38);
    }

    if (isNaN(valorPago) || valorPago <= 0) {
        limpar("Campo 2: não identifiquei o valor pago. Cole a linha do comando 38 ou digite só o valor (ex.: 490,00).", "status erro");
        return;
    }

    /* ---- campo 3: a identificacao precisa bater ----
       Com a linha do 38 em maos da para cruzar CPF/codigo e nome, entao uma
       divergencia bloqueia. Com apenas o valor pago nao ha nome para comparar,
       entao a analise segue e o aviso fica no resultado. */
    const bate158 = identBate(ident, ident158);
    const bate38 = temComando38 && (identBate(ident, ident38) || nomeBate(ident, nome38));
    let avisoIdent = "";

    if (!bate158 && !bate38) {
        const vistos = [ident158, ident38, nome38].filter(Boolean).join(" / ") || "nenhum";
        if (temComando38) {
            limpar("Campo 3: \"" + ident + "\" não confere com o que está nos comandos (" + vistos + "). Os logs podem ser de outro cliente.", "status erro");
            return;
        }
        avisoIdent = "\"" + ident + "\" não confere com o identificador do comando 158 (" + (ident158 || "não encontrado") + "). Como o campo 2 traz apenas o valor, não há nome para cruzar — confira se o log é do cliente certo.";
    }

    if (temComando38 && ident158 && ident38 && !identBate(ident158, ident38)) {
        limpar("Os comandos 158 e 38 são de clientes diferentes (" + ident158 + " x " + ident38 + "). A análise não se aplica.", "status erro");
        return;
    }

    /* ---- cascata por vencimento ---- */
    const emAberto = titulos
        .filter(t => Math.round(Number(t.valorRestante) * 100) > 0)
        .sort((a, b) => {
            const va = String(a.dataVencimento || ""), vb = String(b.dataVencimento || "");
            if (va !== vb) return va < vb ? -1 : 1;
            return Number(a.id) - Number(b.id);
        });

    let saldo = Math.round(valorPago * 100);
    const baixados = [];

    for (const t of emAberto) {
        if (saldo <= 0) break;
        const restante = Math.round(Number(t.valorRestante) * 100);
        const baixa = Math.min(saldo, restante);
        saldo -= baixa;
        baixados.push({ titulo: t, restante: restante, baixa: baixa, sobraTitulo: restante - baixa });
    }

    montarResultado({
        baixados: baixados,
        sobra: saldo,
        valorPago: valorPago,
        totalTitulos: titulos.length,
        carimbo: carimbo,
        carimbo38: carimbo38,
        ident: ident158 || ident38 || ident,
        nome: nome38,
        matricula: matricula38,
        pagamentos: pagamentos38,
        avisoIdent: avisoIdent
    });
}

/* ---------------------------- Resultado ---------------------------- */

function moeda(centavos) {
    const partes = (centavos / 100).toFixed(2).split(".");
    const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return "R$ " + inteiro + "," + partes[1];
}

function dataBr(iso) {
    if (!iso) return "—";
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso);
}

function montarResultado(dados) {
    const { baixados, sobra, valorPago, totalTitulos, carimbo, carimbo38 } = dados;
    const pagoCentavos = Math.round(valorPago * 100);
    const totalBaixado = pagoCentavos - sobra;

    /* Cabecalho */
    const resumo = document.getElementById("resumo");
    resumo.innerHTML = "";
    linhaResumo(resumo, "Cliente", dados.nome || "— (não informado no campo 2)");
    linhaResumo(resumo, "CPF / Código", dados.ident || "—");
    linhaResumo(resumo, "Valor pago", moeda(pagoCentavos));
    if (dados.pagamentos) linhaResumo(resumo, "Forma(s) de pagamento", dados.pagamentos);
    if (dados.matricula) linhaResumo(resumo, "Matrícula do operador", dados.matricula);
    linhaResumo(resumo, "Títulos consultados", String(totalTitulos));
    linhaResumo(resumo, "Prováveis baixados", String(baixados.length));

    /* Cards dos titulos */
    const lista = document.getElementById("listaTitulos");
    lista.innerHTML = "";
    baixados.forEach((b, i) => lista.appendChild(cardTitulo(b, i + 1, baixados.length)));

    /* Texto para copiar */
    const linhas = [];
    linhas.push("=== BAIXA DE CREDITO ROTATIVO - PROVAVEIS TITULOS ===");
    linhas.push("");
    linhas.push("Cliente.............: " + (dados.nome || "nao informado"));
    linhas.push("CPF/Codigo..........: " + (dados.ident || "nao informado"));
    linhas.push("Valor pago..........: " + moeda(pagoCentavos));
    linhas.push("Titulos consultados.: " + totalTitulos);
    linhas.push("Provaveis baixados..: " + baixados.length);

    baixados.forEach((b, i) => {
        const t = b.titulo;
        const estado = b.sobraTitulo === 0 ? "quitado" : "baixa parcial";
        linhas.push("");
        linhas.push("--- TITULO " + (i + 1) + " de " + baixados.length + " (" + estado + ") ---");
        linhas.push("ID do ReceberCreditoRotativo: " + t.id);
        linhas.push("Data Emissao do Debito......: " + dataBr(t.dataEmissao));
        linhas.push("Valor do Debito.............: " + moeda(b.restante));
        linhas.push("Valor Baixado...............: " + moeda(b.baixa));
        if (b.sobraTitulo > 0) {
            linhas.push("Restante apos a baixa.......: " + moeda(b.sobraTitulo));
        }
    });

    linhas.push("");
    linhas.push("Total baixado: " + moeda(totalBaixado) + " de " + moeda(pagoCentavos) + " pagos");
    if (sobra > 0) {
        linhas.push("ATENCAO: sobraram " + moeda(sobra) + " sem titulo correspondente - o valor pago excede os titulos em aberto da consulta.");
    }
    if (dados.avisoIdent) {
        linhas.push("ATENCAO: identificacao do cliente nao confirmada - " + dados.avisoIdent.replace(/—/g, "-"));
    }
    linhas.push("");
    if (carimbo) {
        linhas.push("Data, hora, ecf e idloja da Baixa: " + carimbo.data + " " + carimbo.hora + "   " + carimbo.ecf + "   " + carimbo.idLoja);
    } else {
        linhas.push("Data, hora, ecf e idloja da Baixa: nao identificado no campo 1");
    }
    if (carimbo38) {
        linhas.push("Recibo impresso em...............: " + carimbo38.data + " " + carimbo38.hora + "   " + carimbo38.ecf + "   " + carimbo38.idLoja);
    }
    linhas.push("");
    linhas.push("OBSERVACAO: a data da baixa pode variar conforme o dia que o registro subiu do concentrador para o PDV");

    textoResultado = linhas.join("\n");
    idsResultado = baixados.map(b => b.titulo.id).join(",");

    document.getElementById("saida").innerText = textoResultado;

    /* Carimbo em destaque */
    const boxCarimbo = document.getElementById("carimboBaixa");
    boxCarimbo.innerText = carimbo
        ? carimbo.data + " " + carimbo.hora + "   " + carimbo.ecf + "   " + carimbo.idLoja
        : "não identificado no campo 1";

    /* Status */
    const avisos = [];
    if (dados.avisoIdent) avisos.push(dados.avisoIdent);
    if (sobra > 0) {
        avisos.push("Sobraram " + moeda(sobra) + " sem título correspondente — o valor pago é maior que os títulos em aberto da consulta.");
    }

    const status = document.getElementById("statusAnalise");
    if (avisos.length) {
        status.innerText = avisos.join(" ");
        status.className = "status aviso";
    } else {
        status.innerText = "Análise concluída: " + baixados.length + " título(s) fecham exatamente os " + moeda(pagoCentavos) + " pagos.";
        status.className = "status sucesso";
    }

    document.getElementById("blocoResultado").classList.remove("faded");
}

function linhaResumo(container, nome, valor) {
    const div = document.createElement("div");
    div.className = "campo-linha";
    const n = document.createElement("span");
    n.className = "campo-nome";
    n.innerText = nome;
    const v = document.createElement("span");
    v.className = "campo-valor";
    v.innerText = valor;
    div.appendChild(n);
    div.appendChild(v);
    container.appendChild(div);
}

function cardTitulo(b, pos, total) {
    const t = b.titulo;
    const parcial = b.sobraTitulo > 0;

    const card = document.createElement("div");
    card.className = "bloco titulo-card " + (parcial ? "parcial" : "quitado");

    const header = document.createElement("div");
    header.className = "bloco-header";
    const titulo = document.createElement("div");
    titulo.className = "bloco-titulo";
    titulo.innerText = "Título " + pos + " de " + total;
    const tag = document.createElement("span");
    tag.className = "tag " + (parcial ? "tag-parcial" : "tag-quitado");
    tag.innerText = parcial ? "Baixa parcial" : "Baixa integral";
    header.appendChild(titulo);
    header.appendChild(tag);
    card.appendChild(header);

    const campos = [
        ["ID do ReceberCreditoRotativo", String(t.id)],
        ["Data Emissão do Débito", dataBr(t.dataEmissao)],
        ["Valor do Débito", moeda(b.restante)],
        ["Valor Baixado", moeda(b.baixa)]
    ];
    if (parcial) campos.push(["Restante após a baixa", moeda(b.sobraTitulo)]);

    campos.forEach(([nome, valor]) => linhaResumo(card, nome, valor));
    return card;
}

function limpar(mensagem, classe) {
    textoResultado = "";
    idsResultado = "";
    document.getElementById("resumo").innerHTML = "";
    document.getElementById("listaTitulos").innerHTML = "";
    document.getElementById("saida").innerHTML = '<span class="vazio">O resultado aparece aqui ao clicar em Gerar análise.</span>';
    document.getElementById("carimboBaixa").innerText = "—";
    document.getElementById("blocoResultado").classList.add("faded");
    const status = document.getElementById("statusAnalise");
    status.innerText = mensagem;
    status.className = classe;
}

/* ------------------------------ Acoes ------------------------------ */

function copiarResultadoBaixa() {
    copiarTexto(textoResultado, "Resultado");
}

function copiarIdsBaixa() {
    copiarTexto(idsResultado, "IDs");
}

function limparBaixa() {
    ["campo158", "campo38", "campoIdent"].forEach(id => {
        document.getElementById(id).value = "";
    });
    analisar();
    document.getElementById("campo158").focus();
}
