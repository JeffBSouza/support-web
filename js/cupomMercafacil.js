/* ------------------------------------------------------------------
   cupomMercafacil.js - decodifica o codigo de cupom Mercafacil (34 digitos)
   Porte do CouponMercafacil.bat, processando em tempo real.

   Layout do codigo (posicoes, base 0):
     00-02  id_loja (3)      03-08  data ddmmaa (6)   09-14  hora hhmmss (6)
     15-20  operador (6)     21-23  ecf (3)           24-33  cupom (10)
   ------------------------------------------------------------------ */

const TAMANHO_CODIGO = 34;

let infosResultado = "";
let formatadoResultado = "";
let sqlResultado = "";

document.addEventListener("DOMContentLoaded", function () {
    const campo = document.getElementById("codigoCupom");
    campo.addEventListener("input", processarCupom);
    campo.focus();
    processarCupom();
});

function processarCupom() {
    const campo = document.getElementById("codigoCupom");
    const codigo = somenteDigitos(campo.value);

    /* Remove qualquer caractere nao numerico colado junto, como o .bat fazia. */
    if (campo.value !== codigo) {
        campo.value = codigo;
    }

    atualizarContadorCupom(codigo.length);

    if (codigo.length !== TAMANHO_CODIGO) {
        limparSaidaCupom(codigo.length);
        return;
    }

    const idLoja = codigo.substring(0, 3);
    const dataDd = codigo.substring(3, 5);
    const dataMm = codigo.substring(5, 7);
    const dataAa = codigo.substring(7, 9);
    const horaHh = codigo.substring(9, 11);
    const horaMi = codigo.substring(11, 13);
    const horaSs = codigo.substring(13, 15);
    const operador = codigo.substring(15, 21);
    const ecf = codigo.substring(21, 24);
    const cupom = codigo.substring(24, 34);

    const dataFormatada = `${dataDd}/${dataMm}/20${dataAa}`;
    const horaFormatada = `${horaHh}:${horaMi}:${horaSs}`;
    const dataSql = `20${dataAa}-${dataMm}-${dataDd}`;

    preencherCampo("cup-loja", idLoja);
    preencherCampo("cup-data", dataFormatada);
    preencherCampo("cup-hora", horaFormatada);
    preencherCampo("cup-operador", operador);
    preencherCampo("cup-ecf", ecf);
    preencherCampo("cup-cupom", cupom);

    infosResultado =
`ID-LOJA.......: ${idLoja}
DATA..........: ${dataFormatada}
HORA..........: ${horaFormatada}
ID-OPERADOR...: ${operador}
ECF...........: ${ecf}
CUPOM.........: ${cupom}`;

    formatadoResultado = `${idLoja}|${dataDd}${dataMm}${dataAa}|${horaHh}${horaMi}${horaSs}|${operador}|${ecf}|${cupom}`;

    sqlResultado =
`SELECT v.id, v.id_loja, l.descricao, v.DATA, v.horainicio, o.id, o.nome, o.matricula, v.ecf, v.numerocupom
FROM pdv.venda AS v LEFT JOIN pdv.operador AS o ON o.id_loja=v.id_loja AND o.matricula=v.matricula
INNER JOIN loja AS l ON v.id_loja=l.id
WHERE v.ecf = ${ecf} AND v.DATA = '${dataSql}' AND v.id_loja = ${idLoja} AND numerocupom = ${cupom}`;

    document.getElementById("saidaFormatado").innerText = formatadoResultado;
    document.getElementById("saidaSql").innerText = sqlResultado;

    mostrarStatusCupom(dataDd, dataMm, dataAa, horaHh, horaMi, horaSs);
}

function preencherCampo(id, valor) {
    document.getElementById(id).innerText = valor;
}

function atualizarContadorCupom(tamanho) {
    const chip = document.getElementById("contadorCupom");
    chip.innerText = tamanho + "/" + TAMANHO_CODIGO;
    chip.className = "chip " + (tamanho === TAMANHO_CODIGO ? "ok" : (tamanho === 0 ? "" : "nok"));
}

/* Avisa quando a data ou a hora extraidas nao formam valores validos -
   sinal tipico de codigo digitado errado ou com layout diferente. */
function mostrarStatusCupom(dd, mm, aa, hh, mi, ss) {
    const status = document.getElementById("statusCupom");
    const dia = parseInt(dd, 10);
    const mes = parseInt(mm, 10);
    const hora = parseInt(hh, 10);
    const minuto = parseInt(mi, 10);
    const segundo = parseInt(ss, 10);

    const dataValida = mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
    const horaValida = hora <= 23 && minuto <= 59 && segundo <= 59;

    if (dataValida && horaValida) {
        status.innerText = "Código processado com sucesso.";
        status.className = "status sucesso";
    } else {
        status.innerText = "Atenção: a data ou a hora extraídas não são válidas (" +
            dd + "/" + mm + "/20" + aa + " " + hh + ":" + mi + ":" + ss +
            "). Confira se o código foi informado corretamente.";
        status.className = "status aviso";
    }
}

function limparSaidaCupom(tamanho) {
    infosResultado = "";
    formatadoResultado = "";
    sqlResultado = "";

    ["cup-loja", "cup-data", "cup-hora", "cup-operador", "cup-ecf", "cup-cupom"]
        .forEach(id => preencherCampo(id, "—"));

    document.getElementById("saidaFormatado").innerHTML = '<span class="vazio">Informe o código para ver o resultado.</span>';
    document.getElementById("saidaSql").innerHTML = '<span class="vazio">Informe o código para gerar o SQL.</span>';

    const status = document.getElementById("statusCupom");
    if (tamanho === 0) {
        status.innerText = "";
        status.className = "status";
    } else if (tamanho > TAMANHO_CODIGO) {
        status.innerText = "CÓDIGO ACIMA DE " + TAMANHO_CODIGO + " DÍGITOS (" + tamanho + ")";
        status.className = "status erro";
    } else {
        status.innerText = "CÓDIGO MENOR DO QUE " + TAMANHO_CODIGO + " DÍGITOS (" + tamanho + ")";
        status.className = "status aviso";
    }
}

function copiarInfosCupom() {
    copiarTexto(infosResultado, "Informações");
}

function copiarFormatadoCupom() {
    copiarTexto(formatadoResultado, "Código formatado");
}

function copiarSqlCupom() {
    copiarTexto(sqlResultado, "Comando SQL");
}

function limparCupom() {
    document.getElementById("codigoCupom").value = "";
    processarCupom();
    document.getElementById("codigoCupom").focus();
}
