export default function handler(req, res) {
    // 1. Pega os parâmetros passados na URL (ex: /api/calcular?valor=100&taxa=0.05)
    const { valor, taxa } = req.query;

    // Validação simples de entrada
    if (!valor || !taxa) {
        return res.status(400).send("<h1>Erro:</h1><p>Parâmetros 'valor' e 'taxa' são obrigatórios.</p>");
    }

    // 2. Executa o cálculo exato e determinístico (Sem IA!)
    const valorNum = parseFloat(valor);
    const taxaNum = parseFloat(taxa);
    const resultado = valorNum * (1 + taxaNum);

    // 3. Monta um HTML/Markdown limpo pra IA ler sem ruído
    const htmlResposta = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><title>Resultado do Cálculo</title></head>
    <body>
      <h1>Relatório do Processamento Exato</h1>
      <p><strong>Valor Base:</strong> R$ ${valorNum.toFixed(2)}</p>
      <p><strong>Taxa Aplicada:</strong> ${(taxaNum * 100).toFixed(2)}%</p>
      <hr>
      <h2>Resultado Final: R$ ${resultado.toFixed(2)}</h2>
      <p><em>Dados processados com sucesso pelo backend.</em></p>
    </body>
    </html>
  `;

    // 4. Retorna a resposta com o Content-Type correto
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlResposta);
}