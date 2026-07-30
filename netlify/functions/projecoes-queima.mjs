import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import RelativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br.js";

dayjs.extend(duration);
dayjs.extend(RelativeTime);
dayjs.locale("pt-br");

export default async (req, context) => {
    const url = new URL(req.url);

    const dtRef = url.searchParams.get("dtRef") ?? dayjs().format('YYYY-MM-DD');
    const estoqueAtual = url.searchParams.get("estoqueAtual");
    const consumoDiario = url.searchParams.get("consumoDiario");
    const limiarAlertaUn = url.searchParams.get("limiarAlertaUn");

    if (!estoqueAtual || !consumoDiario || !limiarAlertaUn) {
        return new Response(
            "<h1>Erro</h1><p>Por favor, forneça o parâmetro 'estoqueAtual', 'consumoDiario' e 'limiarAlertaUn' na URL.</p>",
            { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    try {
        if(Number(consumoDiario) <= 0) {
            return new Response(
                "<h1>Erro</h1><p>Não faz sentido o consumo diario ser menor ou igual a 0</p>",
                { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
        }

        const diasRestante = Number(estoqueAtual) / Number(consumoDiario);
        const dtEsgotamento = dayjs(dtRef).add(diasRestante, 'day');
        const periodoRestante = dayjs.duration(dtEsgotamento.diff(dayjs(dtRef)));
        const limiarAtingido = Number(limiarAlertaUn) > Number(estoqueAtual);
        const qtPraLimiar = (Number(estoqueAtual) - Number(limiarAlertaUn)) / Number(consumoDiario);
        const dtLimiarAtingido = dayjs(dtRef).add(qtPraLimiar, 'day');

        let html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="UTF-8"><title>Resultado de calculo de Consumo</title></head>
          <body>
            <p><b>Dias Restantes:</b> ${periodoRestante.humanize()} (${diasRestante} dias(s))</p>
            <p><b>Data de Esgotamento:</b> ${dtEsgotamento.format('DD/MM/YYYY')}</p>
            <p><b>Status de limiar:</b> ${limiarAtingido ? 'Limiar de reposição atingido' : 'Estoque seguro'}</p>
            <p><b>Data do limiar atingido:</b> ${dtLimiarAtingido.format('DD/MM/YYYY')}</p>
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
