import 'reflect-metadata'
import { FieldMetadata, Observable } from './Observable.class-decorator'

export function observe(): PropertyDecorator {
    return (target: object, key: string | symbol) => {
        if (typeof key !== 'string') {
            return
        }

        const proto = target.constructor ? target.constructor.prototype : undefined
        if (!proto) {
            return
        }

        const type = Reflect.getMetadata('design:type', target, key)
        const properties = proto[Observable.PROPERTY_OBSERVERS_METADATA] as FieldMetadata[]

        if (properties) {
            properties.push({ key, type })
        } else {
            proto[Observable.PROPERTY_OBSERVERS_METADATA] = [{ key, type }]
        }
    }
}
