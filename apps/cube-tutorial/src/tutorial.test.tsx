import React from 'react'
import ReactDOM from 'react-dom'
import { MainView } from './main/Main.view'

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<MainView />, div)
})
