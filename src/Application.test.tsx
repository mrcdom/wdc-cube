import React from 'react'
import ReactDOM from 'react-dom'
import { ApplicationView } from './ApplicationView'

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<ApplicationView />, div)
})
