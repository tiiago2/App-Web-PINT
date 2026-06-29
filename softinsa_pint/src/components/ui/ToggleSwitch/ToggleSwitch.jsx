import React from 'react';
import './ToggleSwitch.css';

export default function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="switch m-0">
      <input 
        type="checkbox" 
        checked={checked}
        onChange={onChange}
      />
      <span className="slider round"></span>
    </label>
  );
}
