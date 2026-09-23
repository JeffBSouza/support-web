/* ------------------------------------------------------------------
   util.js - funcoes compartilhadas por todas as paginas do support-web
   ------------------------------------------------------------------ */

/* Mostra um aviso flutuante no rodape (substitui o alert bloqueante). */
function mostrarToast(mensagem, ehErro) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerText = mensagem;
    toast.className = ehErro ? 'show erro' : 'show';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = ''; }, 2500);
}

/* Copia um texto qualquer. Usa a Clipboard API e cai para o metodo antigo
   quando a pagina roda em file:// (contexto nao seguro, sem navigator.clipboard). */
function copiarTexto(texto, rotulo) {
    const conteudo = (texto || '').trim();
    if (!conteudo) {
        mostrarToast('Nada para copiar.', true);
        return;
    }
    const aviso = rotulo ? rotulo + ' copiado!' : 'Copiado!';

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(conteudo)
            .then(() => mostrarToast(aviso))
            .catch(() => copiarFallback(conteudo, aviso));
        return;
    }
    copiarFallback(conteudo, aviso);
}

function copiarFallback(conteudo, aviso) {
    const area = document.createElement('textarea');
    area.value = conteudo;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    mostrarToast(ok ? aviso : 'Nao foi possivel copiar.', !ok);
}

/* Copia o conteudo de um elemento removendo os sufixos de unidade.
   Usada pela Calculadora Self Checkout. */
function copiarTextoValue(elementId) {
    const element = document.getElementById(elementId);
    if (!element || element.innerText === '—') {
        mostrarToast('Nada para copiar.', true);
        return;
    }
    copiarTexto(element.innerText.replace('R$', '').replace('Kg', ''), 'Valor');
}

/* Copia o conteudo bruto de um elemento. Usada pelo Gerador de Codigo de Barras. */
function copiarElementoText(elementId) {
    const element = document.getElementById(elementId);
    if (!element || element.innerText === '—') {
        mostrarToast('Nada para copiar.', true);
        return;
    }
    copiarTexto(element.innerText, 'Valor');
}

/* Mantem apenas digitos - usada nas paginas de decodificacao. */
function somenteDigitos(valor) {
    return (valor || '').replace(/\D/g, '');
}
