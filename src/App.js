import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import {util, ViewIds} from './Common';
import {router, app} from './Presentation';

/// View Utils

var ViewFactoryMap = {};

var createView = function(ui_state) {
  if(ui_state) {
    return ViewFactoryMap[ui_state.vid](ui_state);
  } else {
    return null;
  }
}

class BaseComponet extends Component {
  
  componentWillMount() {
    this.props.presenter.update = () => {
      this.setState(this.props.presenter.ui_state);
    };
    this.props.presenter.update();
  }

  componentWillUnmount() {
    this.props.presenter.update = util.nullFunc;
  }

  createListener(methodName) {
    var presenter = this.props.presenter,
          method = presenter[methodName];
    return () => {
      presenter.onChanged();
      method.apply(presenter, arguments);
      this.forceUpdate();
    }
  }

}

// RootView

const RootViewStyle = {
  self: {
    display: "flex",
    flexDirection: "column",
    margin: 10
  },

  title: {
    padding: 10
  },

  bar: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 30
  },

  btnFirst: {
  },

  btnOthers: {
    marginLeft: 10
  }
};

class RootView extends BaseComponet {

  handleModule1Click = this.createListener("onModule1Clicked");
  handleModule2Click = this.createListener("onModule2Clicked");
  handleModule1DetailClick = this.createListener("onModule1DetailClicked");
  handleModule2DetailClick = this.createListener("onModule2DetailClicked");

  render() {
    var moduleView = createView(this.props.presenter.ui_state.module);

    return (
      <div style={RootViewStyle.self}>
          <span style={RootViewStyle.title}>Exemplo de Webflow</span>
          <div style={RootViewStyle.bar}>
            <button style={RootViewStyle.btnFirst } onClick={this.handleModule1Click}>Module1</button>
            <button style={RootViewStyle.btnOthers} onClick={this.handleModule1DetailClick}>Module1-Detail</button>
            <button style={RootViewStyle.btnOthers} onClick={this.handleModule2Click}>Module2</button>
            <button style={RootViewStyle.btnOthers} onClick={this.handleModule2DetailClick}>Module2-Detail</button>
          </div>
          {moduleView}
      </div>
    );
  }

}

ViewFactoryMap[ViewIds.root] = (ui_state) => {
    return (<RootView presenter={ui_state.presenter} />);
};

///

class Module1View extends BaseComponet {

  render() {
    var detailView = createView(this.props.presenter.ui_state.detail);

    return (
      <div style={{backgroundColor: "red", padding: 20}}>
        {detailView}
      </div>
    );
  }

}

ViewFactoryMap[ViewIds.module1] = (ui_state) => {
    return (<Module1View presenter={ui_state.presenter} />);
};

class Module1DetailView extends BaseComponet {

  render() {
    return (
      <div style={{backgroundColor: "yellow", padding: 20}}>
      </div>
    );
  }

}

ViewFactoryMap[ViewIds.module1Detail] = (ui_state) => {
    return (<Module1DetailView presenter={ui_state.presenter} />);
};

///

class Module2View extends BaseComponet {

  render() {
    var detailView = createView(this.props.presenter.ui_state.detail);

    return (
      <div style={{backgroundColor: "blue", padding: 20}}>
        {detailView}
      </div>
    );
  }

}

ViewFactoryMap[ViewIds.module2] = (ui_state) => {
    return (<Module2View presenter={ui_state.presenter} />);
};

class Module2DetailView extends BaseComponet {

  render() {
    return (
      <div style={{backgroundColor: "brown", padding: 20}}>
      </div>
    );
  }

}

ViewFactoryMap[ViewIds.module2Detail] = (ui_state) => {
    return (<Module2DetailView presenter={ui_state.presenter} />);
};

// App

class App extends Component {

  constructor() {
    super();
    app.go(router.root, {});
    this.rootPresenter = app.presenters.root;
  }

  render() {
    var rootView = createView(this.rootPresenter.ui_state);

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        {rootView}
      </div>
    );
  }
}

export default App;
