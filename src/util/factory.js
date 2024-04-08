const d3 = require('d3')
const _ = {
  map: require('lodash/map'),
  uniqBy: require('lodash/uniqBy'),
  each: require('lodash/each'),
}

const Radar = require('../models/radar')
const Quadrant = require('../models/quadrant')
const Ring = require('../models/ring')
const Blip = require('../models/blip')
const GraphingRadar = require('../graphing/radar')
const config = require('../config')
const featureToggles = config().featureToggles
const { getGraphSize, graphConfig } = require('../graphing/config')
const plotRadar = function (blips, currentRadarName) {
  
  //title = title.substring(0, title.length - 4) // this is for csv

  //document.title = title
  document.title = "plotRaderTitle"

  var rings = _.map(_.uniqBy(blips, 'ring'), 'ring')
  var ringMap = {}

  _.each(rings, function (ringName, i) {
    ringMap[ringName] = new Ring(ringName, i)
  })

  var quadrants = {}
  _.each(blips, function (blip) {
    if (!quadrants[blip.quadrant]) {
      quadrants[blip.quadrant] = new Quadrant(blip.quadrant[0].toUpperCase() + blip.quadrant.slice(1))
    }
    quadrants[blip.quadrant].add(
      new Blip(blip.name, ringMap[blip.ring], blip.isNew.toLowerCase() === 'true', blip.topic, blip.description),
    )
  })

  var radar = new Radar()
  _.each(quadrants, function (quadrant) {
    radar.addQuadrant(quadrant)
  })

  if (currentRadarName !== undefined || true) {
    radar.setCurrentSheet(currentRadarName)
  }

  const size = featureToggles.UIRefresh2022
    ? getGraphSize()
    : window.innerHeight - 133 < 620
    ? 620
    : window.innerHeight - 133
  new GraphingRadar(size, radar).init().plot()
}

//TODO: Try to remove at some point
function validateInputQuadrantOrRingName(allQuadrantsOrRings, quadrantOrRing) {
  const quadrantOrRingNames = Object.keys(allQuadrantsOrRings)
  const regexToFixLanguagesAndFrameworks = /(-|\s+)(and)(-|\s+)|\s*(&)\s*/g
  const formattedInputQuadrant = quadrantOrRing.toLowerCase().replace(regexToFixLanguagesAndFrameworks, ' & ')
  return quadrantOrRingNames.find((quadrantOrRing) => quadrantOrRing.toLowerCase() === formattedInputQuadrant)
}

const plotRadarGraph = function (blips, currentRadarName) {
  // document.title = title.replace(/.(csv)$/, '')
  document.title = "Something"

  const ringMap = graphConfig.rings.reduce((allRings, ring, index) => {
    allRings[ring] = new Ring(ring, index)
    return allRings
  }, {})

  const quadrants = graphConfig.quadrants.reduce((allQuadrants, quadrant) => {
    allQuadrants[quadrant] = new Quadrant(quadrant)
    return allQuadrants
  }, {})

  blips.forEach((blip) => {
    //TODO: Try to remove at some point. These goes back to line 67
    const currentQuadrant = validateInputQuadrantOrRingName(quadrants, blip.quadrant)
    const ring = validateInputQuadrantOrRingName(ringMap, blip.ring)
    if (currentQuadrant && ring) {
      const blipObj = new Blip(
        blip.name,
        ringMap[ring],
        blip.isNew.toLowerCase() === 'true',
        blip.topic,
        blip.description,
      )
      quadrants[currentQuadrant].add(blipObj)
    }
  })

  const radar = new Radar()
  radar.addRings(Object.values(ringMap))

  _.each(quadrants, function (quadrant) {
    radar.addQuadrant(quadrant)
  })

  radar.setCurrentSheet(currentRadarName)

  const graphSize = window.innerHeight - 133 < 620 ? 620 : window.innerHeight - 133
  const size = featureToggles.UIRefresh2022 ? getGraphSize() : graphSize
  new GraphingRadar(size, radar).init().plot()
}

const CSVDocument = function (csvData) {
  var self = {}
  
  self.build = function () {
    // d3.csv(filePath)
    //   .then(createBlips)
    csvfile = d3.csvParse(csvData)
    createBlips(csvfile)
  }

  var createBlips = function (data) {
    delete data.columns
    var blips = _.map(data)
    featureToggles.UIRefresh2022
      // ? plotRadarGraph(FileName(csvData), blips, 'CSV File', [])
      // : plotRadar(FileName(csvData), blips, 'CSV File', [])
      ? plotRadarGraph(blips, 'CSV File', [])
      : plotRadar(blips, 'CSV File', [])
  }

  return self
}

// const FileName = function (filePath) {
//   var search = /([^\\/]+)$/
//   var match = search.exec(decodeURIComponent(filePath.replace(/\+/g, ' ')))
//   if (match != null) {
//     return match[1]
//   }
//   return filePath
// }

const Factory = function (test) {
  var sheet
  // https://raw.githubusercontent.com/August-Brandt/DTR-specfile-generator/main/specfile.csv
  // /data/specfile.csv
  //insert the url for the csv

  sheet = CSVDocument(test)
  sheet.build()
}

module.exports = Factory
