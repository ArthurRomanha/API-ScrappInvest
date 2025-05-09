const axios = require('axios'); // biblioteca para acessar a internet
const cheerio = require('cheerio'); // biblioteca para manipular HTML

let dados = {
    indicesPadrao: [
        { "indice": "Selic", "valor": "" },
        { "indice": "IPCA", "valor": "" },
        { "indice": "Ibovespa", "valor": "" },
        { "indice": "IFIX", "valor": "" },
    ]
};

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { fundos } = req.body;
        try {
            dados.fundosPadrao = fundos;
            const fundosAtualizados = await main(fundos);
            return res.status(200).json({ fundosAtualizados });
        } catch (error) {
            console.error('Erro:', error);
            return res.status(500).json({ error: 'Erro ao coletar dados' });
        }
    }

    if (req.method === 'GET') {
        try {
            const dadosAtt = await main([]);
            return res.status(200).json({ dadosAtt });
        } catch (error) {
            console.error('Erro:', error);
            return res.status(500).json({ error: 'Erro ao coletar dados' });
        }
    }

    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
};

async function main(fundos) {
    await Promise.all([
        fetchIndicesData(),
        ...fundos.map(fundo => fetchFundData(fundo))
    ]);
    return dados;
}

async function fetchIndicesData() {
    const url = 'https://investidor10.com.br/indices/';
    try {
        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);
        
        dados.indicesPadrao[0].valor = $(".indices-grid .index-card").eq(2).find(".body p strong").text().trim(); // Selic
        //IPCA
        $(".indices-grid .index-card").eq(1).children(".body").eq(0).children("p").each(function () {
            dados.indicesPadrao[2].valor = $(this).find("strong").text().trim();
        });
        
        //IBOV
        $(".indices-grid .index-card").eq(3).children(".body").eq(0).children("p").each(function () {
            dados.indicesPadrao[3].valor = $(this).find("strong").text().trim();
        });

        //IFIX
        $(".indices-grid .index-card").eq(5).children(".body").eq(0).children("p").each(function () {
            dados.indicesPadrao[4].valor = $(this).find("strong").text().trim();
        });
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error);
    }
}
async function fetchFundData(fundo) {
    const url = `https://investidor10.com.br/fiis/${fundo.ticker}`;
    try {
        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);
        
        fundo.cotacao = $("._card.cotacao ._card-body div .value").text().trim();
        fundo.pvp = $("._card.vp ._card-body span").text().trim();
        fundo.precoJusto = $(".cell").eq(12).find(".desc .value").text().trim();
        fundo.valueDividendYeldTwelveMonths = $('.content--info .content--info--item').eq(3).children('.content--info--item--value').eq(0).text().trim();
        fundo.lastDividend = $(".cell").eq(14).find(".desc .value").text().trim();
        fundo.liquidez = $("._card.val ._card-body span").text().trim();
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error);
    }
}
