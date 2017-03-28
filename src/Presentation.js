import {util, ViewIds} from './Common';

// Framework

export var router = {};

export var app = {
    presenters: {},
    go(place, params) {
        var newPresenters = {};
        var oldPresenters = this.presenters;
        place.call(router, oldPresenters, newPresenters, params || {});
        this.presenters = newPresenters;

        Object.keys(oldPresenters).forEach((key) => {
            if(!newPresenters[key]) {
                oldPresenters[key].release();
            }
        });
    }
};

class BasePresenter {

    constructor() {
      this.update = util.nullFunc;
      this.ui_state = {};
      this.ui_state.presenter = this;
    }

    release() {
        this.update = util.nullFunc;
        this.ui_state.presenter = null;
    }

    onChanged() {
        // NOOP
    }

    applyParams(params, initializing) {
        return true;
    }

    exportParams(params) {
        // NOOP
    }

}

// Application

export class Module1Presenter extends BasePresenter {

    constructor() {
        super();
        this.ui_state.vid = ViewIds.module1;

        var me = this;
        this.ownerSlot = function(state) {
            me.ui_state.detail = state;
        };
    }

    applyParams(params, initializing) {
        this.ui_state.detail = null;

        params.ownerSlot(this.ui_state);
        params.ownerSlot = this.ownerSlot;
        return true;
    }

}

export class Module1DetailPresenter extends BasePresenter {

    constructor() {
        super();
        this.ui_state.vid = ViewIds.module1Detail;
    }

    applyParams(params, initializing) {
        params.ownerSlot(this.ui_state);
        return true;
    }

}

export class Module2Presenter extends BasePresenter {

    constructor() {
        super();
        this.ui_state.vid = ViewIds.module2;

        var me = this;
        this.ownerSlot = function(state) {
            me.ui_state.detail = state;
        };
    }

    applyParams(params, initializing) {
        this.ui_state.detail = null;

        params.ownerSlot(this.ui_state);
        params.ownerSlot = this.ownerSlot;
        return true;
    }

}

export class Module2DetailPresenter extends BasePresenter {

    constructor() {
        super();
        this.ui_state.vid = ViewIds.module2Detail;
    }

    applyParams(params, initializing) {
        params.ownerSlot(this.ui_state);
        return true;
    }

}

export class RootPresenter extends BasePresenter {

  constructor() {
    super();
    this.ui_state.vid = ViewIds.root;

    var me = this;

    this.ownerSlot = function(state) {
        me.ui_state.module = state;
    };
  }

  applyParams(params, initializing) {
      params.ownerSlot = this.ownerSlot;
      return true;
  }

  onModule1Clicked() {
      console.log("onModule1Clicked");
      app.go(router.module1, {});
  }

  onModule1DetailClicked() {
      console.log("onModule1DetailClicked");
      app.go(router.module1Detail, {});
  }

  onModule2Clicked() {
      console.log("onModule2Clicked");
      app.go(router.module2, {});
  }

  onModule2DetailClicked() {
      console.log("onModule2DetailClicked");
      app.go(router.module2Detail, {});
  }

}

// Places 

router.root = util.newPlace(router, null, RootPresenter, "root");
{
    router.module1 = util.newPlace(router, router.root, Module1Presenter, "module1");
    {
        router.module1Detail = util.newPlace(router, router.module1, Module1DetailPresenter, "module1Detail");
    }
    router.module2 = util.newPlace(router, router.root, Module2Presenter, "module2");
    {
        router.module2Detail = util.newPlace(router, router.module2, Module2DetailPresenter, "module2Detail");
    }
}



