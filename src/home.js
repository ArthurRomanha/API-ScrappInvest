const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://investidor10.com.br/fiis/';

let fundos = [
    { "ticker": "gare11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" },
    { "ticker": "ggrc11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" },
    { "ticker": "trxf11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir todas as origens
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Métodos permitidos

    if (req.method === 'OPTIONS') {
        // Responder a preflight requests
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            let fundosAtualizados = await main();
            res.status(200).json({ fundosAtualizados });
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).json({ error: 'Erro ao coletar dados' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

async function main() {
    for (let i = 0; i < fundos.length; i++) {
        try {
            const response = await axios.get(url + fundos[i].ticker, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // cotação
            $("._card.cotacao ._card-body div").each(function () {
                fundos[i].cotacao = $(this).find(".value").text().trim();
            });

            // p/pvp
            $("._card.vp ._card-body").each(function () {
                fundos[i].pvp = $(this).find("span").text().trim();
            });

            // preço justo
            $(".cell").eq(12).children(".desc").each(function () {
                fundos[i].precoJusto = $(this).find(".value").text().trim();
            });

            // DY 12 meses
            fundos[i].valueDividendYeldTwelveMonths = $('.content--info .content--info--item').eq(3).children('.content--info--item--value').eq(0).text().trim();

            // último dividendo
            $(".cell").eq(14).children(".desc").each(function () {
                fundos[i].lastDividend = $(this).find(".value").text().trim();
            });
        } catch (error) {
            console.error('Erro ao fazer a requisição:', error);
        }
    }
    return fundos;
}
