import React from 'react';
import styles from './Button.module.css';

/**
 * Button component with various styles and sizes
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, danger)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {string} [props.className] - Additional CSS class names
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.type='button'] - Button type attribute
 * @param {boolean} [props.disabled=false] - Disabled state
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  type = 'button',
  onClick, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 