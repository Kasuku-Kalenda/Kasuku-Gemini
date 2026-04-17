import React from 'react';

// This is a simplified implementation to mimic shadcn's Select for our forms
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
    onValueChange: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({ children, onValueChange, ...props }) => {
    return (
        <select 
            onChange={e => onValueChange(e.target.value)} 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
        >
            {children}
        </select>
    );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const SelectValue: React.FC<{ placeholder: string }> = ({ placeholder }) => <>{placeholder}</>;
export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => <option value={value}>{children}</option>;
