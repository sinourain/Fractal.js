const R = require('ramda')
const h = require('snabbdom/h')
const autosize = require('autosize')


let textarea = function ({
  inputStyle = {},
  isFocused = false,
  isError = false,
  isSuccess = false,
  label = '',
  message = '',
  onChange,
  onClick,
  onBlur,
  readOnly = false,
  style = {},
  value = '',
  material = defaultMaterial,
}) {

  const secondaryColor = material.secondaryColor || defaultMaterial.secondaryColor
  const errorColor = material.errorColor || defaultMaterial.errorColor
  const successColor = material.successColor || defaultMaterial.successColor

  let backgroundColor = isError ? errorColor : isSuccess ? successColor : secondaryColor
  let used = !!value && value.length > 0
  let setFocus = (vnode) => isFocused ? vnode.elm.focus() : vnode.elm.blur()

  return h('div', {style: R.merge(styles.inputGroup, style)}, [
      h('textarea', {
        hook: {
          insert: vnode => {
            setFocus(vnode)
            autosize(vnode.elm)
          },
          update: (o, vnode) => setFocus(vnode),
        },
        on: {
          click: (e) => onClick ? onClick(e) : null,
          blur: (e) => onBlur ? setTimeout(() => onBlur(e), 0) : null,
          input: (e) => onChange ? onChange(e) : null,
        },
        style: R.merge(styles.paperDivider, {
          ...styles.textarea,
          ...(used ? styles.used : {}),
          ...inputStyle,
        }),
        attrs: {
          value,
          'read-only': readOnly,
          required: 'required',
        }
      }),
      h('span', {
        style: R.merge(styles.bar, {
          backgroundColor: isError ? errorColor : isSuccess ? successColor : secondaryColor,
          ...((isError || isSuccess || isFocused) ? styles.open : {})
        })
      }),
      h('label', {style: R.merge(styles.label, (isFocused || used) ? styles.spanFocused : {})}, [
        h('span', {style: {
            color: !(isFocused || used)
              ? ''
              : isError
                ? errorColor
                : isSuccess
                  ? successColor
                  : secondaryColor,
          }
        }, [
          label
        ]),
      ]),
      h('div', {
          style: R.merge(styles.info, {
            color: isError ? errorColor : ''
          })
        }, [
        message
      ]),
    ])
}

let styles = {
  inputGroup: {
    position: 'relative',
    margin: '0',
    padding: '15px 0 26px',
  },
  bar: {
    position: 'relative',
    display: 'block',
    width: '0',
    left: '50%',
    height: '2px',
    transition: '.2s cubic-bezier(1, 0.31, 0.25, 1) all',
  },
  textarea: {
    fontSize: '18px',
    padding: '10px 0',
    display: 'block',
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    lineHeight: 'normal',
    outline: 'none',
    resize: 'none',
  },
  paperDivider: {
    boxSizing: 'border-box',
    boxShadow: '0 .5px 0 0 rgba(0,0,0,.156),0 1.5px 0 0 rgba(0,0,0,.055)',
  },
  label: {
    color: '#aaa',
    fontSize: '18px',
    fontWeight: '400',
    position: 'absolute',
    pointerEvents: 'none',
    left: '1px',
    top: '25px',
    transition: '.2s ease all',
  },
  spanFocused: {
    top: '1px',
    fontSize: '13px',
  },
  open: {
    left: '0px',
    width: '100%',
  }
}

module.exports = textarea

const transitionTime = '.3s'
const sidenavWidth = 280

let defaultMaterial = {
  primaryColor: '#FFC107',
  primaryFontColor: 'rgba(0, 0, 0, 0.7)',
  primaryFontColorDisabled: 'rgba(0, 0, 0, 0.45)',
  primaryLightWaves: false,
  secondaryColor: '#009688',
  secondaryFontColor: 'rgba(255, 255, 255, 0.9)',
  secondaryFontColorDisabled: 'rgba(255, 255, 255, 0.6)',
  secondaryLightWaves: true,
  errorColor: '#C00',
  successColor: '#090',
  typographyColor: '#212121',

  sidenav: {
    width: `${sidenavWidth}px`,
    left: `-${sidenavWidth + 10}px`,
    transition: `left ${transitionTime} ease-out`,
    delayed: {
      left: '0'
    },
    remove: {
      left: `-${sidenavWidth + 10}px`
    }
  },

  fadeInOut: {
    opacity: '0',
    transition: `opacity ${transitionTime}`,
    delayed: {
      opacity: '1'
    },
    remove: {
      opacity: '0'
    }
  }
}
