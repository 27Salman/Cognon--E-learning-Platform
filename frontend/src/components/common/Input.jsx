import React from 'react';

/**
 * Reusable Input Component
 * @param {string} label - Input label
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} name - Input name
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {string} error - Error message
 * @param {boolean} required - Required field
 * @param {boolean} disabled - Disabled state
 */
const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  ...rest
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg border
          ${error ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-2 
          ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'}
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-all duration-200
        `}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
