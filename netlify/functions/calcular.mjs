import { evaluate } from 'mathjs';

export default async (req, context) => {
    const url = new URL(req.url);

    // Pega o parâmetro 'expressao' da URL
    // Exemplo: /.netlify/functions/calcular?expressao=(1500 * 0.05) + 200
    const expressao = url.searchParams.get("expressao");

    if (!expressao) {
        return new Response(
            "<h1>Erro</h1><p>Por favor, forneça o parâmetro 'expressao' na URL.</p>",
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    try {
        // Avalia a string matemática de forma ultra segura
        const resultado = evaluate(expressao);

        // Monta o HTML limpo pra IA/NotebookLM ler
        const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"><title>Resultado do Cálculo</title></head>
      <body>
        <h1>Relatório de Processamento Exato</h1>
        <p><strong>Expressão Recebida:</strong> <code>${expressao}</code></p>
        <hr>
        <h2>Resultado Final: <strong>${resultado}</strong></h2>
        <p><em>Cálculo executado com precisão pelo servidor.</em></p>
      </body>
      </html>
    `;

        return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });

    } catch (error) {
        // Se a string contiver uma expressão inválida (ex: "2++5" ou "abc")
        return new Response(
            `<h1>Erro de Sintaxe Matemática</h1><p>Não foi possível calcular: <code>${expressao}</code></p>`,
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }
};