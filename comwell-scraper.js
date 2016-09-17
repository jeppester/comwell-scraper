#!/usr/bin/env node
const Promise = require('bluebird')
const request = Promise.promisify(require('request').defaults({jar: true}))
const repl = require('repl')
const defaultPostData = require('./default-post-data')
const formatDate = require('./format-date')
const prompt = require('prompt')
prompt.getPromise = Promise.promisify(prompt.get)
prompt.message = '||'
prompt.delimiter = ' '

// UTILITY FUNCTIONS
const paramDate = (date) => date.toISOString().substr(0, 10)
const prettyDate = (date) => formatDate(date, 'l \\d. j. F Y')

const getSessionId = () => request('http://www.comwell.dk').then((response) =>
  response.headers['set-cookie'][0].match(/PHPSESSID=([^;]*)/)[1]
)

const postQueryData = (data) => request({
  url: 'https://www.comwell.dk/files/design/php/booking2014/catchValuesAndSendToBooking_one_acco.php',
  method: 'POST',
  form: data
})

const fetchPriceHTML = (accommodationId) => () => request(`https://www.comwell.dk/booking/vaelg-vaerelse/&accoid=${accommodationId}`)
const getPriceFromResponse = (resp) => {
  m = resp.body.match(/<span id="hotelinfototalprice">(.+)<\/span> DKK/)
  return m && m[1].replace(/[^0-9]/, '')
}

const getPriceForDate = (options) => () => new Promise((res, rej) => {
  const data = Object.assign({}, defaultPostData)
  data.arrivaldate = paramDate(options.fromDate)
  data.departuredate = paramDate(options.toDate)
  data.PHPSESSID = options.sessionId
  data.accoid = options.accommodationId.toString()
  data.hotel = options.hotelId.toString()

  postQueryData(data)
    .then(fetchPriceHTML(options.accommodationId))
    .then(getPriceFromResponse)
    .then(res)
  ;
})

// LOG AND PROMPT FUNCTIONS
const getVars = () => {
  console.log('|||||||||||||||||||||||||||||||||||||||||||||||||||||||')
  console.log('||')
  const defaultDate = new Date()
  defaultDate.setDate(defaultDate.getDate() + 5)
  prompt.start()
  return prompt.getPromise({
    properties: {
      startDate: {
        description: 'Enter start date',
        default: paramDate(defaultDate),
        required: true,
        message: 'Must be a date in the format: YYYY-MM-DD',
        pattern: /20[1-2][0-9]-[0-1][0-9]-[0-3][0-9]/,
      },
      nights: {
        description: 'Enter the number of nights you want to stay for',
        default: 1,
        required: true,
        message: 'Must be 1 or higher',
        pattern: /[1-9][0-9]*/,
      },
      datesToCheck: {
        description: 'How many dates into the future do you want to check the prices?',
        default: 100,
        required: true,
        message: 'Must be a number',
        pattern: /[0-9]+/,
      },
    }
  })
}

const printUrlHelp = () => console.log(`
||
||====================================================='
||
|| Find your accommodation type here:
|| http://www.comwell.dk/spa/spaophold/
||
|| When you have found your accommodation type, press "Book nu".
||
|| Copy the url to the accommodation type page, for instance:
|| http://www.comwellkellerspark.dk/landingpage/&accoid=5273117&hotelid=3272
||
`.trim())

const getUrl = () => {
  prompt.start()
  return prompt.getPromise({
    properties: {
      accommodationURL: {
        description: 'Enter accommodation type URL',
        required: true,
        default: 'http://www.comwellkellerspark.dk/landingpage/&accoid=5273117&hotelid=3272',
        message: 'Required!',
        pattern: /\.+/,
      }
    }
  })
}

const parseUrl = (results) => {
  m = results.accommodationURL.match(/accoid=([0-9]+)&hotelid=([0-9]+)/)
  if (!m) { return getUrl }
  return {
    accommodationId: m[1],
    hotelId: m[2],
  }
}

const printFetching = () => console.log(`
||
|| Fetching price info, please wait :D
||
|||||||||||||||||||||||||||||||||||||||||||||||||||||||
`.trim())

const logDates = (d1, d2) => () => {

}

const logPriceAndDates = (d1, d2) => (price) => {
  console.log('\n\n|||||||||||||||||||||||||||||||||||||||||||||||||||||||')
  console.log('||')
  console.log(`|| FRA:    ${prettyDate(d1)}`)
  console.log(`|| TIL:    ${prettyDate(d2)}`)
  console.log('||')

  if (price) {
    console.log(`|| PRIS:   ${price} kr.`)
  }
  else {
    console.log('|| Ingen værelser! :-/')
  }
  console.log('||')
  console.log('|||||||||||||||||||||||||||||||||||||||||||||||||||||||')
}

// SCRIPT
let options = {}
Promise.resolve()
  .then(getVars)
  .then(results => { Object.assign(options, results) })
  .then(printUrlHelp)
  .then(getUrl)
  .then(parseUrl)
  .then(urlData => {
    options.accommodationId = urlData.accommodationId
    options.hotelId = urlData.hotelId
  })
  .then(printFetching)
  .then(getSessionId)
  .then((sessionId) => {
    p = Promise.resolve()
    options.sessionId = sessionId

    for (let i = 0; i < options.datesToCheck; i ++) {
      const fromDate = new Date(options.startDate)
      fromDate.setDate(fromDate.getDate() + i)

      const toDate = new Date(fromDate)
      toDate.setDate(toDate.getDate() + 1)

      p = p
        .then(getPriceForDate(Object.assign({}, options, { fromDate, toDate })))
        .then(logPriceAndDates(fromDate, toDate))
    }
  })
;
