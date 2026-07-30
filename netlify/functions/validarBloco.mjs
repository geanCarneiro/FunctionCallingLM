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
            const mapAnterior = parseBlocoToMap(blocoAnterior.replaceAll('p', '+'));
            const mapAtual = parseBlocoToMap(bloco.replaceAll('p', '+'));

            ausentes = compararFragmentos(mapAnterior, mapAtual);
        }

        const blocoSemSegur = bloco
            .split(";")
            .filter(i => i.length > 0 && i.split(":")[0] !== campoSegur)
            .join(';');

        const listaAusentes = ausentes.map(aus => `<li>${aus}</li>`).join('\n');

        let html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="UTF-8"><title>Resultado da validação</title></head>
          <body>
            <p><b>${campoSegur}:</b> ${crypto.createHash('sha256').update(blocoSemSegur, 'utf8').digest('hex')};</p>
        `;

        if (ausentes.length > 0) {
            html += `
                <h5>Lista de campos ausentes</h5>
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
        return new Response(
            `<p>erro na validação de bloco</p>`,
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }
};

/**
 * Converte a string do bloco em um Map respeitando chaves aninhadas {...}
 */
function parseBlocoToMap(str) {
    const map = new Map();
    if (!str) return map;

    let buffer = "";
    let level = 0;
    const items = [];

    // Separa os itens por ';' ignorando os ';' dentro de {...}
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '{') level++;
        if (char === '}') level--;

        if (char === ';' && level === 0) {
            if (buffer.trim()) items.push(buffer.trim());
            buffer = "";
        } else {
            buffer += char;
        }
    }
    if (buffer.trim()) items.push(buffer.trim());

    // Separa chave e valor no PRIMEIRO ':'
    for (const item of items) {
        const idx = item.indexOf(':');
        if (idx !== -1) {
            const chave = item.slice(0, idx).trim();
            const valor = item.slice(idx + 1).trim();
            map.set(chave, valor);
        }
    }

    return map;
}

/**
 * Compara dois Maps recursivamente
 */
function compararFragmentos(fragmentosAnterior, fragmentos, prefixo = "") {
    let ausentes = [];

    for (const [key, valAnt] of fragmentosAnterior.entries()) {
        const caminhoAtual = prefixo ? `${prefixo}.${key}` : key;

        if (!fragmentos.has(key)) {
            // Se a chave/bloco não existe no atual, adiciona apenas ela (sem expandir subChaves)
            ausentes.push(caminhoAtual);
        } else {
            const valAtual = fragmentos.get(key);

            // Se ambos são objetos aninhados ({...}), entra recursivamente pra buscar subChaves ausentes
            if (valAnt.startsWith("{") && valAnt.endsWith("}") && valAtual.startsWith("{") && valAtual.endsWith("}")) {
                const subMapAnt = parseBlocoToMap(valAnt.slice(1, -1));
                const subMapAtual = parseBlocoToMap(valAtual.slice(1, -1));

                ausentes.push(...compararFragmentos(subMapAnt, subMapAtual, caminhoAtual));
            }
        }
    }

    return ausentes;
}