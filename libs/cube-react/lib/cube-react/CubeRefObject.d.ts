import React from 'react';
export declare class CubeRefObject<T> implements React.RefObject<T> {
    current: T | null;
    constructor(elm?: T | null);
}
