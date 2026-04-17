import React from 'react';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, ...props }) => {
  return (
    <input 
      type="checkbox" 
      role="switch"
      checked={checked} 
      onChange={e => onCheckedChange(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      {...props}
    />
  );
};
