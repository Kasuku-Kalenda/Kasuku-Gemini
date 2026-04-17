import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  value: number;
}

export const Slider: React.FC<SliderProps> = ({ label, value, ...props }) => {
  return (
    <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <input
            type="range"
            value={value}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            {...props}
        />
    </div>
  );
};