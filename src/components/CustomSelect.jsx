import React from 'react';

/**
 * Custom Select Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - The ID for the select element
 * @param {string} props.name - The name for the select element
 * @param {string} props.value - The current value of the select
 * @param {Function} props.onChange - Function to call when value changes
 * @param {Array} props.options - Array of options [{value: string, label: string}]
 * @param {string} props.placeholder - Placeholder text for the select
 * @param {boolean} props.required - Whether the field is required
 * @param {Object} props.style - Additional styles for the select
 * @param {boolean} props.disabled - Whether the select is disabled
 */
const CustomSelect = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  style = {},
  disabled = false,
  ...rest
}) => {
  return (
    <div className="custom-select-container">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={style}
        className="custom-select"
        {...rest}
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CustomSelect;
