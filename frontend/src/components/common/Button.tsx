import React from 'react'
import './Button.scss'

const Button = ({
  children,
  variant = 'secondary',
  size = 'default',
  selected = false,
  icon: Icon = null,
  className = '',
  ...props
}) => {
  const getButtonClasses = () => {
    let classes = ['button', variant]

    if (size !== 'default') classes.push(size)
    if (selected) classes.push('selected')
    if (className) classes.push(className)

    return classes.join(' ')
  }

  return (
    <button className={getButtonClasses()} {...props}>
      {Icon && <Icon className="button-icon" />}
      {children}
    </button>
  )
}

export default Button
