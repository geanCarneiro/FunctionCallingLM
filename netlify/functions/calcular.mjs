import {evaluate, create, all} from 'mathjs';

export const math = create(all, {number: 'BigNumber', precision: 64});

export default async (req, context) => {
    const url = new URL(req.url);

    // Pega o parâmetro 'expressao' da URL
    // Exemplo: /.netlify/functions/calcular?expressao=(1500 * 0.05) + 200
    let expressao = url.searchParams.get("exp");


    if (!expressao) {
        return new Response(
            "<h1>Erro</h1><p>Por favor, forneça o parâmetro 'expressao' na URL.</p>",
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    try {
        expressao = expressao.replaceAll('p', '+');
        const expressoes = expressao.split(';').filter(e => e.trim().length > 0);
        // Avalia a string matemática de forma ultra segura

        const expressoesListHtml = expressoes.map(exp => {
            let str = `
                ${exp}:${math.format(math.evaluate(exp), { notation: 'fixed'}) }
            `
            return str;
        }).join('; ');

        // Monta o HTML limpo pra IA/NotebookLM ler
        const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"><title>Resultado dos Cálculos</title></head>
      <body>        
        ${expressoesListHtml}
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