import React from 'react'
import ReactDOM from 'react-dom'
import { ApplicationPresenter } from './ApplicationPresenter'
import { ApplicationView } from './ApplicationView'
import './index.css'

ReactDOM.render(
  <ApplicationView presenter={new ApplicationPresenter()}/>,
  document.getElementById('root')
)
