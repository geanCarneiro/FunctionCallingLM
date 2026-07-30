import { create, all } from 'mathjs';

// Instância do Math.js configurada
export const math = create(all, { number: 'BigNumber', precision: 64 });

export default async (req, context) => {
    const url = new URL(req.url);

    // Pega o parâmetro 'rules' da URL
    const regrasJson = url.searchParams.get("rules");

    // ✅ 1. Correção da checagem da variável
    if (!regrasJson) {
        return new Response(
            "<h1>Erro</h1><p>Por favor, forneça o parâmetro 'rules' na URL.</p>",
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    try {
        const rules = JSON.parse(regrasJson);

        // Valida se o JSON enviado é um Array
        if (!Array.isArray(rules)) {
            throw new Error("O parâmetro 'rules' deve ser um array JSON.");
        }

        const results = rules.map(rule => {
            // ✅ 2. Uso de Scope do Math.js em vez de replaceAll manual
            // Exemplo de rule: { name: "Dose Máxima", expr: "x <= 50", value: 30 }
            // Ou suporte a múltiplas variáveis se o 'rule.scope' for um objeto
            const scope = typeof rule.value === 'object' ? rule.value : { x: rule.value };

            // O Math.js avalia a expressão injetando o scope com segurança
            const resultadoBooleano = math.evaluate(rule.expr, scope);

            return `<p><b>${rule.name}:</b> ${resultadoBooleano ? 'Cumprida' : 'Violada'}</p>`;
        }).join('\n');

        // Monta o HTML limpo pra IA/NotebookLM ler
        const html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="UTF-8"><title>Resultado das Regras</title></head>
          <body>        
            ${results}
          </body>
          </html>
        `;

        return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });

    } catch (error) {
        return new Response(
            `<h1>Erro no Processamento</h1><p>Não foi possível fazer a validação: ${error.message}</p>`,
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }
};