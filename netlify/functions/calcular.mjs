export default async (req, context) => {
    // Pega os query params da URL
    const url = new URL(req.url);
    const valor = url.searchParams.get("valor");
    const taxa = url.searchParams.get("taxa");

    if (!valor || !taxa) {
        return new Response("Parâmetros ausentes.", { status: 400 });
    }

    const resultado = parseFloat(valor) * (1 + parseFloat(taxa));

    const html = `
    <h1>Resultado do Cálculo</h1>
    <p>O resultado exato processado foi: <strong>${resultado}</strong></p>
  `;

    return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
};