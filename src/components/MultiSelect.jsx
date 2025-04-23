import React, { useState, useRef, useEffect } from 'react';

/**
 * Multi-Select Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - The ID for the select element
 * @param {string} props.name - The name for the select element
 * @param {Array} props.value - Array of selected values
 * @param {Function} props.onChange - Function to call when value changes
 * @param {Array} props.options - Array of options [{value: string, label: string}]
 * @param {string} props.placeholder - Placeholder text for the select
 * @param {boolean} props.required - Whether the field is required
 * @param {Object} props.style - Additional styles for the select
 * @param {boolean} props.disabled - Whether the select is disabled
 */
const MultiSelect = ({
  id,
  name,
  value = [],
  onChange,
  options = [],
  placeholder = "Select options",
  required = false,
  style = {},
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle option selection
  const toggleOption = (optionValue) => {
    if (disabled) return;

    const newValue = [...value];
    const index = newValue.indexOf(optionValue);

    if (index === -1) {
      newValue.push(optionValue);
    } else {
      newValue.splice(index, 1);
    }

    onChange({
      target: {
        name,
        value: newValue
      }
    });
  };

  // Remove a selected option
  const removeOption = (optionValue, e) => {
    e.stopPropagation();
    if (disabled) return;

    const newValue = value.filter(val => val !== optionValue);
    onChange({
      target: {
        name,
        value: newValue
      }
    });
  };

  // Get label for a value
  const getLabel = (optionValue) => {
    const option = options.find(opt => opt.value === optionValue);
    return option ? option.label : optionValue;
  };

  return (
    <div className="multi-select-container" ref={containerRef} style={style}>
      <div 
        className="multi-select-header"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >
        {value.length === 0 ? (
          <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
        ) : (
          <span>{`${value.length} selected`}</span>
        )}
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>

      {value.length > 0 && (
        <div className="selected-tags">
          {value.map(val => (
            <div key={val} className="selected-tag">
              {getLabel(val)}
              <button 
                type="button" 
                onClick={(e) => removeOption(val, e)}
                disabled={disabled}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {isOpen && !disabled && (
        <div className="multi-select-dropdown">
          {options.map(option => (
            <div
              key={option.value}
              className={`multi-select-option ${value.includes(option.value) ? 'selected' : ''}`}
              onClick={() => toggleOption(option.value)}
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => {}}
                style={{ marginRight: '10px' }}
              />
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
