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
| 💳 **Identifica Baixa CredRotativo** | A partir dos comandos 158 e 38 do log, aponta quais títulos de crédito rotativo receberam a baixa do pagamento e quanto cada um recebeu. |

As ferramentas processam **enquanto você digita** — exceto a de Baixa CredRotativo, que recebe blocos grandes de log colados e por isso roda só ao clicar em **Gerar análise** (ou `Ctrl+Enter`). Os resultados têm botão de copiar.

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
│   ├── cupomMercafacil.js
│   └── baixaCredRotativo.js
└── paginas/
    ├── codigo-barra.html
    ├── selfcheckout.html
    ├── chave-nfce.html
    ├── cupom-mercafacil.html
    └── baixa-credrotativo.html
```

## Cache do navegador

Os links de CSS e JS nas páginas carregam um número de versão — `style.css?v=20261020`.
Sem ele o navegador serve a versão antiga do arquivo mesmo depois da publicação, e a
página roda código velho sem dar nenhum sinal.

**Ao alterar qualquer arquivo de `css/` ou `js/`, troque esse número em todas as páginas**
(basta usar a data do dia). Caso contrário quem já abriu o site continuará com a versão anterior.

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
