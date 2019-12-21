const request = require('request-promise')
const cheerio = require('cheerio')
const fx = require('money')
const oxr = require('open-exchange-rates')

const baseURL = 'https://ezakupy.tesco.pl'
const url = 'https://ezakupy.tesco.pl/groceries/pl-PL/search?query=%C5%9Bl%C4%85ska%20kie%C5%82basa'

oxr.set({ app_id: process.env.OXR_APP_ID })
let oxrFetched = null // either null or date
const isSameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const fetchOXR = () => {
  const now = new Date()
  if (oxrFetched && isSameDate(oxrFetched, now)) {
    return new Promise(resolve => resolve())
  }
  return new Promise((resolve, reject) => oxr.latest(() => {
    fx.rates = oxr.rates
    fx.base = oxr.base
    oxrFetched = now
    resolve()
  }, reject))
}

exports.generateMsg = async () => {
  // Daily fetch of currency rates
  await fetchOXR()

  const html = await request(url)
  const $ = cheerio.load(html)

  let items = []
  $('.product-tile').each((i, elem) => {
    const headerLink = $(elem).find('.product-details--content h3 a')
    const pricePerKilo = $(elem).find('.product-controls--wrapper .price-per-quantity-weight .value')
    const priceZlotys = parseFloat(pricePerKilo.text().replace(',', '.'))
    const priceDollars = fx.convert(priceZlotys, {from: 'PLN', to: 'USD'})

    items.push({
      link: baseURL + headerLink.prop('href'),
      name: headerLink.text(),
      priceZlotys,
      priceDollars: Math.round(priceDollars * 100) / 100,
    })
  })

  items.sort((a, b) => a.priceZlotys - b.priceZlotys)
  if (items.length > 3) {
    items = items.slice(0, 3)
  }

  return `The cheapest "silesian sausages" available in Tesco Poland are as following:
${items.map(item => ` - ${item.name}
   ${item.link}
   ${item.priceZlotys} PLN / 1 kg
   ${item.priceDollars} USD / 1 kg`).join('\n')}`
}
