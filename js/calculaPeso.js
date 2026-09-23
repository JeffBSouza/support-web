document.querySelectorAll('.calc-input').forEach(input => {
    input.addEventListener('input', calcularTudoRealTime);
});
function calcularTudoRealTime() {
    const peso = parseFloat(document.getElementById('pesoProduto').value);
    const precoKg = parseFloat(document.getElementById('precoKg').value);
    const precoFinal = parseFloat(document.getElementById('precoFinal').value);
    const tolGeral = parseFloat(document.getElementById('tolGeral').value);
    const tolItem = parseFloat(document.getElementById('tolItem').value);

    if (!isNaN(peso) && !isNaN(precoKg) && peso > 0 && precoKg > 0) {
        const res = peso * precoKg;
        document.getElementById('formula-preco').innerText = `${peso.toFixed(3)} Kg * R$ ${precoKg.toFixed(2)}`;
        document.getElementById('res-val-preco').innerText = `R$ ${res.toFixed(2).replace('.', ',')}`;
        document.getElementById('card-gerar-preco').classList.remove('faded'); document.getElementById('card-gerar-preco').classList.add('active-result');
    } else { document.getElementById('formula-preco').innerText = "—"; document.getElementById('res-val-preco').innerText = "—"; document.getElementById('card-gerar-preco').classList.add('faded'); document.getElementById('card-gerar-preco').classList.remove('active-result'); }

    if (!isNaN(precoFinal) && !isNaN(precoKg) && precoFinal > 0 && precoKg > 0) {
        const res = precoFinal / precoKg;
        document.getElementById('formula-peso').innerText = `R$ ${precoFinal.toFixed(2)} / R$ ${precoKg.toFixed(2)}`;
        document.getElementById('res-val-peso').innerText = `${res.toFixed(3).replace('.', ',')} Kg`;
        document.getElementById('card-gerar-peso').classList.remove('faded'); document.getElementById('card-gerar-peso').classList.add('active-result');
    } else { document.getElementById('formula-peso').innerText = "—"; document.getElementById('res-val-peso').innerText = "—"; document.getElementById('card-gerar-peso').classList.add('faded'); document.getElementById('card-gerar-peso').classList.remove('active-result'); }

    if (!isNaN(peso) && !isNaN(tolGeral) && peso > 0 && tolGeral >= 0) {
        const margem = peso * (tolGeral / 100); const aceito = peso + margem;
        document.getElementById('formula-tol-geral').innerText = `${tolGeral}% + ${peso.toFixed(3)} Kg`;
        document.getElementById('res-aceito-geral').innerText = `${aceito.toFixed(3).replace('.', ',')} Kg`;
        document.getElementById('res-tol-geral').innerText = `${margem.toFixed(3).replace('.', ',')} Kg`;
        document.getElementById('card-tol-geral').classList.remove('faded'); document.getElementById('card-tol-geral').classList.add('active-result');
    } else { document.getElementById('formula-tol-geral').innerText = "—"; document.getElementById('res-aceito-geral').innerText = "—"; document.getElementById('res-tol-geral').innerText = "—"; document.getElementById('card-tol-geral').classList.add('faded'); document.getElementById('card-tol-geral').classList.remove('active-result'); }

    if (!isNaN(peso) && !isNaN(tolItem) && peso > 0 && tolItem >= 0) {
        const margem = peso * (tolItem / 100); const aceito = peso + margem;
        document.getElementById('formula-tol-item').innerText = `${tolItem}% + ${peso.toFixed(3)} Kg`;
        document.getElementById('res-aceito-item').innerText = `${aceito.toFixed(3).replace('.', ',')} Kg`;
        document.getElementById('res-tol-item').innerText = `${margem.toFixed(3).replace('.', ',')} Kg`;
        document.getElementById('card-tol-item').classList.remove('faded'); document.getElementById('card-tol-item').classList.add('active-result');
    } else { document.getElementById('formula-tol-item').innerText = "—"; document.getElementById('res-aceito-item').innerText = "—"; document.getElementById('res-tol-item').innerText = "—"; document.getElementById('card-tol-item').classList.add('faded'); document.getElementById('card-tol-item').classList.remove('active-result'); }
}
function limparCalculadora() {
    document.querySelectorAll('.calc-input').forEach(input => input.value = ""); calcularTudoRealTime();
}