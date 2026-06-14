import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ options, value, onChange, placeholder = 'Select an option', label, buttonStyle = {}, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => 
    typeof opt === 'object' ? opt.value === value : opt === value
  );

  const displayLabel = selectedOption
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="kemet-label" htmlFor={id}>{label}</label>}
      
      {/* Dropdown Toggle Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: 'rgba(var(--obsidian-rgb), 0.85)',
          border: isOpen ? '1px solid var(--gold)' : 'var(--border-gold)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: selectedOption ? 'var(--sand-light)' : 'var(--sand-dim)',
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'var(--transition-smooth)',
          boxShadow: isOpen ? '0 0 10px var(--gold-glow)' : 'none',
          ...buttonStyle
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        {/* Chevron Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'var(--transition-smooth)',
            marginLeft: '8px',
            flexShrink: 0
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Options List Overlay */}
      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            background: 'var(--obsidian-mid)',
            border: 'var(--border-gold)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35), 0 0 15px var(--gold-glow)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 1000,
            padding: '6px 0',
            listStyle: 'none',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease-out',
            margin: 0
          }}
        >
          {options.length === 0 ? (
            <li style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: 'var(--sand-dark)',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              No options available
            </li>
          ) : (
            options.map((opt, index) => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const isSelected = optVal === value;

              return (
                <li
                  key={index}
                  onClick={() => handleSelect(optVal)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '14px',
                    color: isSelected ? 'var(--gold-bright)' : 'var(--sand-light)',
                    background: isSelected ? 'var(--sidebar-link-active-bg)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--sidebar-link-hover-bg)';
                      e.currentTarget.style.color = 'var(--gold)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--sand-light)';
                    }
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {optLabel}
                  </span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
