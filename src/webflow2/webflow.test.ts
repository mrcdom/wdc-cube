import { CastUtils } from './CastUtils'
import { WebFlowStep } from './WebFlowStep'
import { WebFlowPlace } from './WebFlowPlace'

it('CastUtils.isArray', () => {
    expect(CastUtils.isArray(undefined)).toEqual(false)
    expect(CastUtils.isArray(null)).toEqual(false)
    expect(CastUtils.isArray(0)).toEqual(false)
    expect(CastUtils.isArray(true)).toEqual(false)
    expect(CastUtils.isArray('abc')).toEqual(false)
    expect(CastUtils.isArray([])).toEqual(true)
})

it('WebFlowPlace.toString', () => {
    const place = new WebFlowPlace(new WebFlowStep(0, 'root'))
    place.setParameter('p0', 1)
    place.setParameter('p1', 1.1)
    place.setParameter('p2', true)
    place.setParameter('p3', 'a b c')

    expect(place.toString()).toEqual('root?p0=1&p1=1.1&p2=true&p3=a+b+c')
})

it('WebFlowPlace.parse', () => {
    const expected = 'root?p0=1&p1=1.1&p2=true&p3=a+b+c'
    const place = WebFlowPlace.parse(expected)
    expect(place.toString()).toEqual(expected)
})