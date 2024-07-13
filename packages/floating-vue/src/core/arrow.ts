import {
  type Middleware,
  type Padding,
  arrow as arrowCore,
} from '@floating-ui/dom'

import { toValue } from 'vue'
import { unwrapElement } from './utils/unwrapElement.ts'
import type { MaybeElement, MaybeReadonlyRefOrGetter } from './types.ts'

export interface ArrowOptions {
  /**
   * The arrow element or template ref to be positioned.
   * @required
   */
  element: MaybeReadonlyRefOrGetter<MaybeElement<Element>>
  /**
   * The padding between the arrow element and the floating element edges. Useful when the floating element has rounded corners.
   * @default 0
   */
  padding?: Padding
}

/**
 * Positions an inner element of the floating element such that it is centered to the reference element.
 * @param options The arrow options.
 * @see https://floating-ui.com/docs/arrow
 */
export function arrow(options: ArrowOptions): Middleware {
  return {
    name: 'arrow',
    options,
    fn(state) {
      const element = unwrapElement(toValue(options.element))

      if (element == null) {
        return {}
      }

      return arrowCore({ element, padding: options.padding }).fn(state)
    },
  }
}
