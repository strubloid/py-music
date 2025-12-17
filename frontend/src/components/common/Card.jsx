import React from 'react'
import './Card.css'

const Card = ({ 
  children, 
  title, 
  size = 'default', 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const getCardClasses = () => {
    let classes = ['card']
    
    if (size !== 'default') classes.push(size)
    if (variant !== 'default') classes.push(variant)
    if (className) classes.push(className)
    
    return classes.join(' ')
  }

  return (
    <div className={getCardClasses()} {...props}>
      {title && (
        <div className="card-header">
          <h3 className={`card-title ${size}`}>{title}</h3>
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

export default Card