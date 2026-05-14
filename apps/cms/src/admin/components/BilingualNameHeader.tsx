// @ts-nocheck
import React from 'react';

export default function BilingualNameHeader() {
  return (
    <div style={{
      display: 'flex',
      gap: '0',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.08)',
      marginBottom: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Arabic side — green = required */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        padding: '12px 18px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        direction: 'rtl',
      }}>
        <span style={{ fontSize: '26px', lineHeight: 1 }}>🇸🇦</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.2px' }}>
            الاسم بالعربية
          </div>
          <div style={{ marginTop: '4px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.22)',
              borderRadius: '20px',
              padding: '2px 9px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.3px',
            }}>
              ✓ مطلوب
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '3px', background: 'white', flexShrink: 0 }} />

      {/* English side — blue = optional */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
        padding: '12px 18px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '26px', lineHeight: 1 }}>🇬🇧</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.2px' }}>
            Name in English
          </div>
          <div style={{ marginTop: '4px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.22)',
              borderRadius: '20px',
              padding: '2px 9px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.3px',
            }}>
              Optional
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
