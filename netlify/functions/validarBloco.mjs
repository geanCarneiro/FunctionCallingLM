import crypto from 'crypto';

export default async (req, context) => {
    const url = new URL(req.url);

    const blocoAnterior = url.searchParams.get("bAnt");
    const bloco = url.searchParams.get("b");
    const campoSegur = url.searchParams.get("campoHash") ?? 'segur';


    if (!bloco) {
        return new Response(
            "<h1>Erro</h1><p>Por favor, forneça o parâmetro 'b' na URL.</p>",
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    try {
        let ausentes = [];

        if (blocoAnterior) {
            const listaDeFragmentosBAnterior = blocoAnterior.split(";").filter(i => i.length > 0);

            const mapFragmentosBAnterior = new Map(
                listaDeFragmentosBAnterior.map( item => {
                    const [chave, valor] = item.split(":");
                    return [chave, valor];
                })
            )

            const listaDeFragmentosB = bloco.split(";").filter(i => i.length > 0);

            const mapFragmentosB = new Map(
                listaDeFragmentosB.map( item => {
                    const [chave, valor] = item.split(":");
                    return [chave, valor];
                })
            )

            ausentes.push(...compararFragmentos(mapFragmentosBAnterior, mapFragmentosB));

        }

        const blocoSemSegur = bloco
            .split(";")
            .filter(i => i.length > 0 && i.split(":")[0] !== campoSegur)
            .join(';');

        const listaAusentes = ausentes.map(aus => {
            let str = `
                <li>${aus}</li>
            `
            return str;
        }).join('\n');

        // Monta o HTML limpo pra IA/NotebookLM ler
        let html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="UTF-8"><title>Resultado da validação</title></head>
          <body>
            <p><b>${campoSegur}:</b> ${crypto.createHash('sha256').update(blocoSemSegur, 'utf8').digest('hex')};</p>
           `;

        if (ausentes.length > 0) {
            html += `
                <b>Lista de campos ausentes</b>
                <ul>
                    ${listaAusentes}
                </ul>
            `;
        }

        html += `
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
            `<p>erro na validação de bloco</p>`,
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }
};

function compararFragmentos(fragmentosAnterior, fragmentos) {
    // 1. Uso correto do Array.from (no singular)
    const keysAnt = Array.from(fragmentosAnterior.keys());
    const keys = Array.from(fragmentos.keys());

    // Pega as chaves novas que não existiam no bloco anterior
    let ausentes = keysAnt.filter(k => !keys.includes(k));

    for (const key of keys) {
        if (ausentes.includes(key)) continue;

        let valueMap = null;
        let valueAntMap = null;

        const valActual = fragmentos.get(key);
        const valAnt = fragmentosAnterior.get(key);

        // Trata sub-objetos com {...}
        if (valActual && valActual.startsWith("{") && valActual.endsWith("}")) {
            valueMap = new Map(
                valActual.slice(1, -1).split(';').filter(Boolean).map(item => {
                    const [chave, valor] = item.split(":");
                    return [chave, valor];
                })
            );
        }

        if (valAnt && valAnt.startsWith("{") && valAnt.endsWith("}")) {
            valueAntMap = new Map(
                valAnt.slice(1, -1).split(';').filter(Boolean).map(item => {
                    const [chave, valor] = item.split(":");
                    return [chave, valor];
                })
            );
        }

        // Se existia sub-objeto no anterior e no atual não
        if (valueAntMap && !valueMap) {
            ausentes.push(...Array.from(valueAntMap.keys()).map(k => `${key}.${k}`));
            continue;
        }

        // Se ambos têm sub-objetos, faz a validação recursiva passando valueMap
        if (valueMap && valueAntMap) {
            const subAusentes = compararFragmentos(valueAntMap, valueMap);
            ausentes.push(...subAusentes.map(k => `${key}.${k}`));
        }
    }

    return ausentes;
}