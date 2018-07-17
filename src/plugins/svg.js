const { loadSVG } = require('../utils/helpers')

const PRIMITIVE_SVG_ELEMENTS = 'circle, ellipse, line, polygon, path, rect, g'

const patchSVGGroup = svg => {
  const $ = loadSVG(svg)

  const $svg = $('svg')
  const $primitiveShapes = $svg.children(PRIMITIVE_SVG_ELEMENTS)

  // Check if actual shapes are grouped
  if (!$primitiveShapes.filter('g').length !== 1) {
    const $group = $('<g/>')
    const $realShapes = $primitiveShapes.not('rect:first-child')

    $group.append($realShapes)
    $svg.append($group)
  }

  return $.html()
}

class SVGPlugin {
  constructor(options) {
    this.options = options || {}
  }

  apply(svg) {
    let retval = this.prepareSVG(svg)
    if (this.options.blur) {
      retval = this.applyBlurFilter(retval)
    }
    return retval
  }

  // Prepare SVG. For now, this will just ensure that the viewbox attribute is set
  prepareSVG(svg) {
    const $ = loadSVG(svg)
    const $svg = $('svg')
    const { width, height } = this.options.dimensions

    // Ensure viewbox
    if (!$svg.is('[viewBox]')) {
      if (!(width && height)) {
        throw new Error(
          `SVG is missing viewBox attribute while Width and height were not passed:\n\n${svg}`
        )
      }
      $svg.attr('viewBox', `0 0 ${width} ${height}`)
    }

    const $bgRect = $svg
      .children(PRIMITIVE_SVG_ELEMENTS)
      .filter('rect:first-child[fill]')

    // Check if filling background rectangle exists
    // This must exist for proper blur and other transformations
    if (!$bgRect.length) {
      throw new Error(
        `The SVG must have a rect as first shape element which represents the svg background color:\n\n${svg}`
      )
    }

    // Remove x and y attributes since they default to 0
    // @todo test in rare browsers
    $bgRect.attr('x', null)
    $bgRect.attr('y', null)

    // Improve compression via simplifying fill
    $bgRect.attr('width', '100%')
    $bgRect.attr('height', '100%')

    return $.html()
  }

  applyBlurFilter(svg) {
    if (!this.options.blur) {
      return svg
    }
    const patchedSVG = patchSVGGroup(svg)
    const $ = loadSVG(patchedSVG)
    const blurFilterId = 'b'
    $('svg > g').attr('filter', `url(#${blurFilterId})`)
    $('svg').prepend(
      `<filter id="${blurFilterId}"><feGaussianBlur stdDeviation="${
        this.options.blur
      }" />`
    )

    return $.html()
  }
}

module.exports = SVGPlugin
