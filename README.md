# support-web 🛠️

Central de ferramentas de automação comercial e suporte de PDV, em página estática (roda no GitHub Pages, sem build e sem dependências).

Sucessor do `codebar-etiqueta`, agora com quatro ferramentas no mesmo painel.

## Ferramentas

| Página | O que faz |
| --- | --- |
| 🏷️ **Gerador Código de Barras** | Extrai código do produto e preço/peso de etiquetas internas de balança, conforme os parâmetros do PDV, e confere contra o código informado. |
| 🛒 **Calculadora Self Checkout** | Calcula preço, peso estimado e as margens de tolerância geral e por item, em tempo real. |
| 🧾 **Decodificador Chave NFC-e** | Abre a chave de acesso de 44 dígitos em todos os campos (cUF, AAMM, CNPJ, modelo, série, nNF, tpEmis, cNF, DV) e valida o dígito verificador. |
| 🎟️ **Cupom Mercafácil** | Decodifica o código de 34 dígitos do cupom, monta a linha formatada e gera o SQL de consulta da venda. |

Todas as ferramentas processam **enquanto você digita** — não há botão "Gerar". Os resultados têm botão de copiar.

## Estrutura

```
support-web/
├── index.html                    painel principal
├── css/
│   └── style.css                 estilo único de todas as páginas
├── js/
│   ├── util.js                   cópia para a área de transferência e avisos
│   ├── codigoBarra.js
│   ├── calculaPeso.js
│   ├── chaveNFCe.js
│   └── cupomMercafacil.js
└── paginas/
    ├── codigo-barra.html
    ├── selfcheckout.html
    ├── chave-nfce.html
    └── cupom-mercafacil.html
```

## Como publicar no GitHub Pages

Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main` e pasta `/ (root)`.
O site fica em `https://<usuario>.github.io/support-web/`.

## Uso local

Basta abrir o `index.html` no navegador — não precisa de servidor. Em `file://` a cópia usa um método alternativo, já que a Clipboard API só funciona em HTTPS.

## Layout do código do Cupom Mercafácil

Posições do código de 34 dígitos (base 0):

| Posição | Tamanho | Campo |
| --- | --- | --- |
| 0–2 | 3 | ID da loja |
| 3–8 | 6 | Data `ddmmaa` |
| 9–14 | 6 | Hora `hhmmss` |
| 15–20 | 6 | ID do operador |
| 21–23 | 3 | ECF |
| 24–33 | 10 | Número do cupom |

Substitui o script `CouponMercafacil.bat`.
