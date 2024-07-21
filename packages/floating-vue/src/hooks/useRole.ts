import { type MaybeRefOrGetter, computed, toValue } from 'vue'
import type { ElementProps, FloatingRootContext } from '../types.ts'
import { useId } from './useId.ts'
import type { ExtendedUserProps } from './useInteractions.ts'

type AriaRole =
  | 'tooltip'
  | 'dialog'
  | 'alertdialog'
  | 'menu'
  | 'listbox'
  | 'grid'
  | 'tree'
type ComponentRole = 'select' | 'label' | 'combobox'

export interface UseRoleProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * The role of the floating element.
   * @default 'dialog'
   */
  role?: AriaRole | ComponentRole
}

const componentRoleToAriaRoleMap = new Map<
  AriaRole | ComponentRole,
  AriaRole | false
>([
  ['select', 'listbox'],
  ['combobox', 'listbox'],
  ['label', false],
])

export function useRole(
  context: FloatingRootContext,
  props: UseRoleProps = {},
) {
  const { open, floatingId } = context
  const { role = 'dialog' } = props

  const enabled = computed(() => toValue(props.enabled || true))

  const ariaRole = (componentRoleToAriaRoleMap.get(role) ?? role) as
    | AriaRole
    | false
    | undefined

  const referenceId = useId()
  // const parentId = useFloatingParentNodeId()
  const parentId = null
  const isNested = parentId != null

  const reference = computed<ElementProps['reference']>(() => {
    if (ariaRole === 'tooltip' || role === 'label') {
      return {
        [`aria-${role === 'label' ? 'labelledby' : 'describedby'}`]: open
          ? floatingId
          : undefined,
      }
    }

    return {
      'aria-expanded': open.value ? 'true' : 'false',
      'aria-haspopup': ariaRole === 'alertdialog' ? 'dialog' : ariaRole,
      'aria-controls': open.value ? floatingId : undefined,
      ...(ariaRole === 'listbox' && { role: 'combobox' }),
      ...(ariaRole === 'menu' && { id: referenceId }),
      ...(ariaRole === 'menu' && isNested && { role: 'menuitem' }),
      ...(role === 'select' && { 'aria-autocomplete': 'none' }),
      ...(role === 'combobox' && { 'aria-autocomplete': 'list' }),
    }
  })

  function getFloating() {
    const floatingProps = {
      id: floatingId,
      ...(ariaRole && { role: ariaRole }),
    }

    if (ariaRole === 'tooltip' || role === 'label') {
      return floatingProps
    }

    return {
      ...floatingProps,
      ...(ariaRole === 'menu' && { 'aria-labelledby': referenceId }),
    }
  }

  const floating: ElementProps['floating'] = getFloating()

  const item: ElementProps['item'] = ({ active, selected }: ExtendedUserProps) => {
    const commonProps = {
      role: 'option',
      ...(active && { id: `${floatingId}-option` }),
    }

    // For `menu`, we are unable to tell if the item is a `menuitemradio`
    // or `menuitemcheckbox`. For backwards-compatibility reasons, also
    // avoid defaulting to `menuitem` as it may overwrite custom role props.
    switch (role) {
      case 'select':
        return {
          ...commonProps,
          'aria-selected': active && selected,
        }
      case 'combobox': {
        return {
          ...commonProps,
          ...(active && { 'aria-selected': true }),
        }
      }
    }

    return {}
  }

  return () => enabled.value ? { reference: reference.value, floating, item } : undefined
}
