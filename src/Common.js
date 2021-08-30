export const ViewIds = {
    root: '91ed77a2',
    module1: '79f53cbe',
    module2: '2fe5c402',
    module1Detail: '9a7b527e',
    module2Detail: '380aca14'
}

function newPlace(router, previous, presenterClass, name) {
    if(!previous) {
        previous = function() {return true}
    }
    return function(oldPresenters, newPresenters, params) {
        if(previous.call(router, oldPresenters, newPresenters, params)) {
            var presenter = newPresenters[name] = oldPresenters[name]
            if(!presenter) {
                presenter = newPresenters[name] = new presenterClass()
                return presenter.applyParams(params, true)
            } else {
                return presenter.applyParams(params, false)
            }
        }
        return false
    }
}

export const util = {
    nullFunc: () => {
        // NOOP
    },
    newPlace: newPlace
}
