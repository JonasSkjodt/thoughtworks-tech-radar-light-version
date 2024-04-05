/* eslint no-constant-condition: "off" */

const d3 = require('d3')
const _ = {
  map: require('lodash/map'),
  uniqBy: require('lodash/uniqBy'),
  each: require('lodash/each'),
}

const InputSanitizer = require('./inputSanitizer')
const Radar = require('../models/radar')
const Quadrant = require('../models/quadrant')
const Ring = require('../models/ring')
const Blip = require('../models/blip')
const GraphingRadar = require('../graphing/radar')
const config = require('../config')
const featureToggles = config().featureToggles
const { getDocumentOrSheetId } = require('./urlUtils')
const { getGraphSize, graphConfig } = require('../graphing/config')
const plotRadar = function (title, blips, currentRadarName, /*alternativeRadars*/) {
  
  title = title.substring(0, title.length - 4) // this is for csv

  document.title = title
  d3.selectAll('.loading').remove()

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

  // if (alternativeRadars !== undefined || true) {
  //   alternativeRadars.forEach(function (sheetName) {
  //     radar.addAlternative(sheetName)
  //   })
  // }

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

const plotRadarGraph = function (title, blips, currentRadarName/*, alternativeRadars*/) {
  document.title = title.replace(/.(csv)$/, '')

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

  // alternativeRadars.forEach(function (sheetName) {
  //   radar.addAlternative(sheetName)
  // })

  radar.setCurrentSheet(currentRadarName)

  const graphSize = window.innerHeight - 133 < 620 ? 620 : window.innerHeight - 133
  const size = featureToggles.UIRefresh2022 ? getGraphSize() : graphSize
  new GraphingRadar(size, radar).init().plot()
}

const CSVDocument = function (filePath) {
  var self = {}

  //try with url to csv directly as filepath
  self.build = function () {
    d3.csv(filePath)
      .then(createBlips)
  }

  var createBlips = function (data) {
    delete data.columns
    var blips = _.map(data, new InputSanitizer().sanitize)
    featureToggles.UIRefresh2022
      ? plotRadarGraph(FileName(filePath), blips, 'CSV File', [])
      : plotRadar(FileName(filePath), blips, 'CSV File', [])
  }

  return self
}

const FileName = function (filePath) {
  var search = /([^\\/]+)$/
  var match = search.exec(decodeURIComponent(filePath.replace(/\+/g, ' ')))
  if (match != null) {
    return match[1]
  }
  return filePath
}

const Factory = function () {
  var sheet

  const paramId = getDocumentOrSheetId()
  
  //for csv
  sheet = CSVDocument(paramId)
  sheet.build()
}

module.exports = Factory
