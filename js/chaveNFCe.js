/* ------------------------------------------------------------------
   chaveNFCe.js - decodifica a chave de acesso da NFC-e / NF-e (44 digitos)
   Processa em tempo real, sem botao "Gerar".
   ------------------------------------------------------------------ */

const UF_MAP = {
    "11": "Rondônia", "12": "Acre", "13": "Amazonas", "14": "Roraima", "15": "Pará",
    "16": "Amapá", "17": "Tocantins", "21": "Maranhão", "22": "Piauí", "23": "Ceará",
    "24": "Rio Grande do Norte", "25": "Paraíba", "26": "Pernambuco", "27": "Alagoas",
    "28": "Sergipe", "29": "Bahia", "31": "Minas Gerais", "32": "Espírito Santo",
    "33": "Rio de Janeiro", "35": "São Paulo", "41": "Paraná", "42": "Santa Catarina",
    "43": "Rio Grande do Sul", "50": "Mato Grosso do Sul", "51": "Mato Grosso",
    "52": "Goiás", "53": "Distrito Federal"
};

const MODELO_MAP = {
    "55": "NF-e (Nota Fiscal Eletrônica)",
    "65": "NFC-e (Cupom Fiscal Eletrônico)"
};

const TPEMIS_MAP = {
    "1": "ChaveNFCe gerada NORMAL",
    "2": "CONTINGÊNCIA FS-IA (formulário de segurança)",
    "3": "CONTINGÊNCIA SCAN (desativado)",
    "4": "CONTINGÊNCIA EPEC",
    "5": "CONTINGÊNCIA FS-DA (formulário de segurança)",
    "6": "CONTINGÊNCIA SVC-AN",
    "7": "CONTINGÊNCIA SVC-RS",
    "9": "ChaveNFCe gerada em CONTINGÊNCIA (offline NFC-e)"
};

/* Guarda o texto completo pronto para o botao Copiar. */
let textoResultado = "";

document.addEventListener("DOMContentLoaded", function () {
    const campo = document.getElementById("chave");
    campo.addEventListener("input", processarChave);
    campo.focus();
    processarChave();
});

function processarChave() {
    const campo = document.getElementById("chave");
    const chave = somenteDigitos(campo.value);

    /* Limpa automaticamente pontos, espacos e traços colados junto da chave. */
    if (campo.value !== chave) {
        campo.value = chave;
    }

    atualizarContador(chave.length);

    if (chave.length !== 44) {
        limparSaida(chave.length);
        return;
    }

    const cUF = chave.substring(0, 2);
    const AAMM = chave.substring(2, 6);
    const CNPJ = chave.substring(6, 20);
    const MOD = chave.substring(20, 22);
    const SERIE = chave.substring(22, 25);
    const NNF = chave.substring(25, 34);
    const TPEMIS = chave.substring(34, 35);
    const CNF = chave.substring(35, 43);
    const DV = chave.substring(43, 44);

    const ufNome = UF_MAP[cUF] || "UF desconhecida";
    const modeloNome = MODELO_MAP[MOD] || "modelo desconhecido";
    const statusChave = TPEMIS_MAP[TPEMIS] || "Tipo emissão desconhecida";
    const emissao = formatarAAMM(AAMM);
    const cnpjFormatado = formatarCNPJ(CNPJ);

    const dvEsperado = String(calcularDV(chave.substring(0, 43)));
    const dvOk = dvEsperado === DV;
    const dvDescricao = dvOk ? "OK (confere)" : "INVÁLIDO - esperado " + dvEsperado;

    preencher("campo-cUF", cUF, ufNome);
    preencher("campo-AAMM", AAMM, emissao);
    preencher("campo-CNPJ", cnpjFormatado, "CNPJ do emitente");
    preencher("campo-MOD", MOD, modeloNome);
    preencher("campo-SERIE", SERIE, "Número do ECF / série");
    preencher("campo-NNF", NNF, "Número/sequência da NFC-e/NF-e");
    preencher("campo-TPEMIS", TPEMIS, statusChave);
    preencher("campo-CNF", CNF, "Código numérico aleatório");
    preencher("campo-DV", DV, dvDescricao);

    textoResultado =
`Chave NFC-e........: ${chave}

Codigo da UF (cUF)...: ${cUF} - ${ufNome}
AAMM Emissao.........: ${AAMM} - ${emissao}
CNPJ Emitente........: ${cnpjFormatado}
Modelo (mod).........: ${MOD} - ${modeloNome}
Serie................: ${SERIE} - (Numero ECF)
Numero NFe (nNF).....: ${NNF} - (Numero/Sequencia NFCe/NFe)
Forma Emissao........: ${TPEMIS} - (${statusChave})
Codigo Numerico......: ${CNF}
Digito Verificador...: ${DV} - ${dvDescricao}`;

    document.getElementById("saida").innerText = textoResultado;

    const status = document.getElementById("statusChave");
    if (dvOk) {
        status.innerText = "Chave decodificada - dígito verificador confere.";
        status.className = "status sucesso";
    } else {
        status.innerText = "Atenção: o dígito verificador não confere (esperado " + dvEsperado + "). Confira se a chave foi digitada corretamente.";
        status.className = "status erro";
    }
}

function preencher(id, valor, descricao) {
    const el = document.getElementById(id);
    el.innerHTML = "";
    el.appendChild(document.createTextNode(valor));
    if (descricao) {
        const span = document.createElement("span");
        span.className = "campo-desc";
        span.innerText = descricao;
        el.appendChild(span);
    }
}

function atualizarContador(tamanho) {
    const chip = document.getElementById("contadorChave");
    chip.innerText = tamanho + "/44";
    chip.className = "chip " + (tamanho === 44 ? "ok" : (tamanho === 0 ? "" : "nok"));
}

function limparSaida(tamanho) {
    textoResultado = "";
    ["cUF", "AAMM", "CNPJ", "MOD", "SERIE", "NNF", "TPEMIS", "CNF", "DV"]
        .forEach(nome => preencher("campo-" + nome, "—", ""));

    const saida = document.getElementById("saida");
    saida.innerHTML = '<span class="vazio">Informe a chave para ver o resultado.</span>';

    const status = document.getElementById("statusChave");
    if (tamanho === 0) {
        status.innerText = "";
        status.className = "status";
    } else if (tamanho > 44) {
        status.innerText = "CHAVE ACIMA DE 44 DÍGITOS (" + tamanho + ")";
        status.className = "status erro";
    } else {
        status.innerText = "CHAVE MENOR DO QUE 44 DÍGITOS (" + tamanho + ")";
        status.className = "status aviso";
    }
}

function formatarCNPJ(cnpj) {
    return cnpj.padStart(14, "0")
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/* AAMM -> MM/20AA */
function formatarAAMM(aamm) {
    const ano = aamm.substring(0, 2);
    const mes = aamm.substring(2, 4);
    return mes + "/20" + ano;
}

/* Digito verificador da chave: modulo 11, pesos ciclicos de 2 a 9 da direita para a esquerda. */
function calcularDV(chave43) {
    let peso = 2;
    let soma = 0;
    for (let i = chave43.length - 1; i >= 0; i--) {
        soma += parseInt(chave43.charAt(i), 10) * peso;
        peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return (resto === 0 || resto === 1) ? 0 : 11 - resto;
}

function copiarResultadoChave() {
    copiarTexto(textoResultado, "Resultado");
}

function limparChave() {
    document.getElementById("chave").value = "";
    processarChave();
    document.getElementById("chave").focus();
}
