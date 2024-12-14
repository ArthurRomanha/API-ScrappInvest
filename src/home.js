const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

const cors = require('cors');
const app = express();
const url = 'https://investidor10.com.br/fiis/';
const PORT = 3000;

app.use(cors());

let fundos = [
    { "ticker": "gare11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" },
    { "ticker": "ggrc11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" },
    { "ticker": "trxf11", cotacao: "", pvp: "", precoJusto: "", valueDividendYeldTwelveMonths: "", lastDividend: "" }
];

app.get("/fundos", async (req, res)=>{
    try {
        let fundosAtualizados = await main();
        res.status(200).json({fundosAtualizados})
    } catch {
        res.status(500);
    }
})

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

app.listen(PORT, ()=>{
    console.log("http://localhost:3000/fundos");
})