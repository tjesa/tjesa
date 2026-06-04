'use client';

import React, { useState } from 'react';

export default function PublicFormClient({ config }) {
  const settings = config.settings || {};
  const formTitle = settings.form_title || 'Nile Scribe Form';
  const formDescription = settings.form_description || '';
  const fields = settings.fields || [];

  // State to hold user input values
  const [formValues, setFormValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Update input states
  const handleInputChange = (columnName, value) => {
    setFormValues(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  // Handle multi-select toggle
  const handleMultiSelectToggle = (columnName, optionName) => {
    setFormValues(prev => {
      const current = prev[columnName] || [];
      const updated = current.includes(optionName)
        ? current.filter(x => x !== optionName)
        : [...current, optionName];
      return {
        ...prev,
        [columnName]: updated
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Pre-validation for required fields
    for (const field of fields) {
      if (field.required) {
        const val = formValues[field.column_name];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          setError(`"${field.field_label || field.column_name}" is a required field.`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const response = await fetch('/api/tools/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: config.id,
          values: formValues
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setFormValues({});
      } else {
        setError(data.error || 'Failed to submit form responses.');
      }
    } catch (err) {
      setError('A connection disruption occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      padding: '40px 16px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Centered Scroll Form Container */}
      <div style={{
        background: 'var(--obsidian-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: 'var(--border-gold)',
        borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.1)',
        maxWidth: '550px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        animation: 'scaleIn 0.4s ease-out'
      }}>
        {/* Glowing Top line */}
        <div style={{ height: '4px', background: 'var(--gold-gradient)' }} />

        {isSuccess ? (
          /* Success/Completion State */
          <div style={{ padding: '40px 24px', textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
            {/* Glowing Ankh Success Symbol */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 24px auto',
              color: 'var(--gold)'
            }}>
              {/* Ankh outline path SVG */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                <path d="M12 10v12" />
                <path d="M7 13h10" />
              </svg>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-headings)',
              fontSize: '24px',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '12px'
            }}>
              Record Carved In Stone
            </h2>
            
            <p style={{
              fontSize: '14px',
              color: 'var(--sand-dim)',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              Your response has been written directly into the temple archives database. Your contribution is eternal.
            </p>

            <button
              className="kemet-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setIsSuccess(false)}
            >
              Submit Another Response
            </button>
          </div>
        ) : (
          /* Input Form State */
          <div style={{ padding: '32px 24px' }}>
            {/* Form Title & Description */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: '20px', marginBottom: '24px' }}>
              <h2 style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '28px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {formTitle}
              </h2>
              {formDescription && (
                <p style={{ fontSize: '13px', color: 'var(--sand-dim)', marginTop: '8px', lineHeight: 1.5 }}>
                  {formDescription}
                </p>
              )}
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(168, 36, 36, 0.1)',
                border: '1px solid var(--scarab-red)',
                borderRadius: '6px',
                color: '#FF7F7F',
                fontSize: '13px',
                marginBottom: '20px',
                lineHeight: 1.4
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Inputs list */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fields.map(field => {
                const isRequired = !!field.required;
                const value = formValues[field.column_name] || '';

                return (
                  <div key={field.column_name} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label className="kemet-label" htmlFor={`field-${field.column_name}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                      {field.field_label || field.column_name}
                      {isRequired && <span style={{ color: 'var(--scarab-red)' }}>*</span>}
                    </label>

                    {/* Rich text -> Textarea */}
                    {field.column_type === 'rich_text' ? (
                      <textarea
                        id={`field-${field.column_name}`}
                        className="kemet-input"
                        rows="3"
                        placeholder={field.field_placeholder}
                        value={value}
                        onChange={(e) => handleInputChange(field.column_name, e.target.value)}
                        required={isRequired}
                        style={{ resize: 'none' }}
                      />
                    ) : field.column_type === 'checkbox' ? (
                      /* Checkbox -> Styled checkbox toggle */
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 0', fontSize: '13px', color: 'var(--sand-dim)' }}>
                        <input
                          id={`field-${field.column_name}`}
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => handleInputChange(field.column_name, e.target.checked)}
                          style={{ accentColor: 'var(--gold)', cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        Toggle choice
                      </label>
                    ) : field.column_type === 'select' ? (
                      /* Select -> Dropdown options */
                      <select
                        id={`field-${field.column_name}`}
                        className="kemet-select"
                        value={value}
                        onChange={(e) => handleInputChange(field.column_name, e.target.value)}
                        required={isRequired}
                        style={{ background: 'rgba(13, 13, 11, 0.75)' }}
                      >
                        <option value="">{field.field_placeholder || '-- Choose Option --'}</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.column_type === 'multi_select' ? (
                      /* Multi-select -> Checklist badges */
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                        {field.options?.map(opt => {
                          const isChecked = Array.isArray(value) && value.includes(opt);
                          return (
                            <label
                              key={opt}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                background: isChecked ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                                border: isChecked ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)',
                                color: isChecked ? 'var(--gold-bright)' : 'var(--sand-dim)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleMultiSelectToggle(field.column_name, opt)}
                                style={{ display: 'none' }}
                              />
                              {isChecked && <span>✓</span>}
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    ) : field.column_type === 'date' ? (
                      /* Date -> Date input */
                      <input
                        id={`field-${field.column_name}`}
                        className="kemet-input"
                        type="date"
                        value={value}
                        onChange={(e) => handleInputChange(field.column_name, e.target.value)}
                        required={isRequired}
                      />
                    ) : (
                      /* Fallback for title, number, url, email, phone_number */
                      <input
                        id={`field-${field.column_name}`}
                        className="kemet-input"
                        type={
                          field.column_type === 'number'
                            ? 'number'
                            : field.column_type === 'email'
                            ? 'email'
                            : field.column_type === 'url'
                            ? 'url'
                            : 'text'
                        }
                        placeholder={field.field_placeholder}
                        value={value}
                        onChange={(e) => handleInputChange(field.column_name, e.target.value)}
                        required={isRequired}
                      />
                    )}
                  </div>
                );
              })}

              <button
                type="submit"
                className="kemet-btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Carving Response...' : 'Submit Response'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Powered by tag */}
      <div style={{
        marginTop: '24px',
        fontSize: '11px',
        color: 'var(--sand-dark)',
        fontFamily: 'var(--font-headings)',
        letterSpacing: '0.1em'
      }}>
        POWERED BY TJESA SUITE
      </div>
    </div>
  );
}
