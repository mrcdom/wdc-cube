/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const rewire = require('rewire')
const defaults = rewire('react-scripts/scripts/build.js')
let config = defaults.__get__('config')

config.optimization.splitChunks = {
    cacheGroups: {
        default: false
    }
}

config.output.filename = 'static/js/chat-boat.js'

config.optimization.runtimeChunk = false
