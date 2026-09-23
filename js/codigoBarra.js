document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.barcode-input').forEach(input => {
        input.addEventListener('input', processar);
    });
});

function processar() {
    const codigo = document.getElementById('codigo').value.trim();
    const codInformado = document.getElementById('codInformado').value.trim();
    const iniProd = parseInt(document.getElementById('iniProd').value) || 0;
    const tamProd = parseInt(document.getElementById('tamProd').value) || 0;
    const iniPreco = parseInt(document.getElementById('iniPreco').value) || 0;
    const tamPreco = parseInt(document.getElementById('tamPreco').value) || 0;
    const statusMsg = document.getElementById('statusMsg');
    
    if (!codigo) { 
        document.getElementById('resProd').innerText = "—"; 
        document.getElementById('resPreco').innerText = "—";
        document.getElementById('resCodInf').innerText = codInformado || "—";
        statusMsg.innerText = ""; 
        statusMsg.className = "status"; 
        return; 
    }
    
    try {
        let prodCalculado = "—"; let precoCalculado = "—";
        if (iniProd > 0 && tamProd > 0 && codigo.length >= (iniProd - 1 + tamProd)) { 
            prodCalculado = codigo.substring(iniProd - 1, (iniProd - 1) + tamProd); 
        }
        if (iniPreco > 0 && tamPreco > 0 && codigo.length >= (iniPreco - 1 + tamPreco)) {
            let stringPreco = codigo.substring(iniPreco - 1, (iniPreco - 1) + tamPreco);
            let valorNumerico = parseFloat(stringPreco) / 100;
            if (!isNaN(valorNumerico)) { precoCalculado = "R$ " + valorNumerico.toFixed(2).replace('.', ','); }
        }
        
        document.getElementById('resProd').innerText = prodCalculado;
        document.getElementById('resPreco').innerText = precoCalculado;
        document.getElementById('resCodInf').innerText = codInformado || "—";
        
        // Validation with leading zeros rule
        if (codInformado && prodCalculado !== "—") {
            const numCalculado = parseInt(prodCalculado, 10);
            const numInformado = parseInt(codInformado, 10);
            
            if (isNaN(numCalculado) || isNaN(numInformado) || numCalculado !== numInformado) {
                statusMsg.innerText = "Erro: O código informado não coincide com o código da etiqueta!";
                statusMsg.className = "status erro";
                return;
            }
        }
        
        statusMsg.innerText = "Processado!"; statusMsg.className = "status sucesso";
    } catch (e) { 
        statusMsg.innerText = "Erro: " + e.message; statusMsg.className = "status erro"; 
    }
}

function limparCampos() {
    document.getElementById('codigo').value = ""; document.getElementById('codInformado').value = "";
    document.getElementById('resProd').innerText = "—"; document.getElementById('resPreco').innerText = "—";
    document.getElementById('resCodInf').innerText = "—"; 
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.innerText = ""; statusMsg.className = "status";
}