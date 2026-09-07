/**
 * Copyright © 2025 WeDoCode Consultoria e Soluções Avançadas LTDA. All rights reserved.
 *
 * Author: Marcelo Domingos
 * Source: https://github.com/mrcdom/wdc-cube
 */

/** Configures an element as it is declared, and declares its children inside. */
export type Configure<E extends Element> = (element: E) => void

/**
 * Declares a DOM tree by nesting.
 *
 * Every container takes a function, and whatever is declared inside that
 * function becomes its children — so the nesting of the source is the nesting of
 * the tree, and no intermediate variable is needed just to say what belongs to
 * what. Each declaration returns the element, so a view captures what it will
 * later change in place, as it declares it:
 *
 * ```ts
 * Dom.render(this, (dom) => {
 *     dom.section((s) => {
 *         s.className = 'todo-app'
 *         this.title = dom.h1((h) => (h.textContent = 'todos'))
 *         this.list = dom.ul()
 *     })
 * })
 * ```
 *
 * The DOM is a live tree, so this keeps a single mutable parent and puts it back
 * on the way out — the same bookkeeping a widget toolkit would need, with
 * nothing in between.
 */
export class Dom {
    private parent: Element

    /**
     * Protected so an application can extend this with factory methods of its
     * own — `dom.actionButton(...)` reading beside `dom.div(...)` — which is how
     * the strategy this comes from expresses its reusable pieces.
     */
    protected constructor(root: Element) {
        this.parent = root
    }

    /** A plain `Dom` declaring into `root`. A subclass provides its own. */
    public static create(root: Element): Dom {
        return new Dom(root)
    }

    /**
     * Declares into `root`, which becomes the parent of everything at the top
     * level. Called on a subclass it builds that subclass, so a row declared
     * outside a view gets the same `Dom` the view itself was given.
     */
    public static render<D extends Dom>(
        this: { create(root: Element): D },
        root: Element,
        declare: (dom: D) => void
    ): void {
        declare(this.create(root))
    }

    // ========== CONTAINERS ==========

    public div(configure?: Configure<HTMLDivElement>): HTMLDivElement {
        return this.container('div', configure)
    }

    public section(configure?: Configure<HTMLElement>): HTMLElement {
        return this.container('section', configure)
    }

    public header(configure?: Configure<HTMLElement>): HTMLElement {
        return this.container('header', configure)
    }

    public footer(configure?: Configure<HTMLElement>): HTMLElement {
        return this.container('footer', configure)
    }

    public nav(configure?: Configure<HTMLElement>): HTMLElement {
        return this.container('nav', configure)
    }

    public ul(configure?: Configure<HTMLUListElement>): HTMLUListElement {
        return this.container('ul', configure)
    }

    public li(configure?: Configure<HTMLLIElement>): HTMLLIElement {
        return this.container('li', configure)
    }

    public label(configure?: Configure<HTMLLabelElement>): HTMLLabelElement {
        return this.container('label', configure)
    }

    public span(configure?: Configure<HTMLSpanElement>): HTMLSpanElement {
        return this.container('span', configure)
    }

    public h1(configure?: Configure<HTMLHeadingElement>): HTMLHeadingElement {
        return this.container('h1', configure)
    }

    public h2(configure?: Configure<HTMLHeadingElement>): HTMLHeadingElement {
        return this.container('h2', configure)
    }

    public h3(configure?: Configure<HTMLHeadingElement>): HTMLHeadingElement {
        return this.container('h3', configure)
    }

    public p(configure?: Configure<HTMLParagraphElement>): HTMLParagraphElement {
        return this.container('p', configure)
    }

    public strong(configure?: Configure<HTMLElement>): HTMLElement {
        return this.container('strong', configure)
    }

    public button(configure?: Configure<HTMLButtonElement>): HTMLButtonElement {
        return this.container('button', (element) => {
            // Buttons inside a form would submit it otherwise, and a Cube action
            // is never a form submission.
            element.type = 'button'
            configure?.(element)
        })
    }

    // ========== LEAVES ==========

    public input(configure?: Configure<HTMLInputElement>): HTMLInputElement {
        return this.leaf('input', configure)
    }

    public text(value: string): Text {
        const node = document.createTextNode(value)
        this.parent.appendChild(node)
        return node
    }

    /**
     * Puts a node that was built elsewhere into the tree.
     *
     * The methods above cover HTML, which is what a view is nearly always made
     * of. Anything in another namespace — an SVG, most often — has to be created
     * with `createElementNS` and cannot come from them, so this is the way in.
     */
    public append<N extends Node>(node: N): N {
        this.parent.appendChild(node)
        return node
    }

    /** Any element with no method of its own. */
    public element<K extends keyof HTMLElementTagNameMap>(
        tag: K,
        configure?: Configure<HTMLElementTagNameMap[K]>
    ): HTMLElementTagNameMap[K] {
        return this.container(tag, configure)
    }

    /**
     * The whole trick, in one place: point the parent at the new element, run the
     * caller's function so everything it declares lands inside, then put the
     * parent back — even if the function threw.
     */
    private container<K extends keyof HTMLElementTagNameMap>(
        tag: K,
        configure?: Configure<HTMLElementTagNameMap[K]>
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tag)
        this.parent.appendChild(element)

        const outer = this.parent
        this.parent = element
        try {
            configure?.(element)
        } finally {
            this.parent = outer
        }

        return element
    }

    /** An element that cannot hold children, so the parent never moves. */
    private leaf<K extends keyof HTMLElementTagNameMap>(
        tag: K,
        configure?: Configure<HTMLElementTagNameMap[K]>
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tag)
        this.parent.appendChild(element)
        configure?.(element)
        return element
    }
}
