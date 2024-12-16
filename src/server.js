const axios = require('axios');//axios é uma biblioteca que permite fazer requisições http, com base em promises (async, await)
const cheerio = require('cheerio');//cheerio é uma biblioteca que nos permite manipular o conteúdo html da url fornecida

const url = 'https://investidor10.com.br/fiis/';

let fundos = [
    { "ticker": "gare11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" },
    { "ticker": "ggrc11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" },
    { "ticker": "trxf11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // cabeçalho http que permite acesso de todas as origens
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // define que os métodos permitidos são apenas get e options, logo não é possível alterar nada

    if (req.method === 'OPTIONS') {//caso o método selecionado seja options
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {//caso o método selecionado seja get
        try {
            let fundosAtualizados = await main();//vai executar a main
            res.status(200).json({ fundosAtualizados });//se tudo correr bem vai retornar um json com os dados 
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).json({ error: 'Erro ao coletar dados' });
        }
    } else {//se a requisição não for nem get nem options, retorna dizendo que a requisição não é permitida
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

async function main() {
    for (let i = 0; i < fundos.length; i++) {
        try {
            const response = await axios.get(url + fundos[i].ticker, {//acessa a url com um método do tipo get
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    //O cabeçalho User-Agent informa ao servidor quem está fazendo a requisição. Neste caso, está sendo enviado um valor que simula um navegador comum (Chrome), o que pode ser útil para evitar bloqueios de acesso a determinadas APIs que rejeitam requisições sem um User-Agent adequado ou que são feitas por scripts.
                }
            });

            const html = response.data;//armazena os dados da requisição http, que no caso é um html
            const $ = cheerio.load(html);//lê os elementos html

            //aqui é onde acessamos partes específicas do html para extrair os dados que queremos:

            // cotação
            $("._card.cotacao ._card-body div").each(function () {
                fundos[i].cotacao = $(this).find(".value").text().trim();
            });

            // p/vp
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
