import React from 'react'
import ReactDOM from 'react-dom'
import { ApplicationPresenter } from './ApplicationPresenter'
import { ApplicationView } from './ApplicationView'

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<ApplicationView presenter={new ApplicationPresenter()} />, div)
})
