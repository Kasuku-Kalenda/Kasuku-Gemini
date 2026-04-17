import React, { useState } from 'react';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

export const Accordion: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`w-full ${className}`}>{children}</div>
);

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}
export const AccordionItem: React.FC<AccordionItemProps> = ({ children, value, className }) => {
  // In a full implementation, context would be used to manage state.
  // For this simple case, we let each item manage its own open state.
  const [isOpen, setIsOpen] = useState(false);
  
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
        if (child.type === AccordionTrigger) {
            return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen), isOpen } as any);
        }
        if (child.type === AccordionContent) {
            return React.cloneElement(child, { isOpen } as any);
        }
    }
    return child;
  });

  return <div className={`border-b ${className}`}>{childrenWithProps}</div>;
};

interface AccordionTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  isOpen?: boolean;
  className?: string;
}
export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({ children, onClick, isOpen, className }) => (
  <button onClick={onClick} className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full ${className}`}>
    {children}
    <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
  </button>
);


interface AccordionContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}
export const AccordionContent: React.FC<AccordionContentProps> = ({ children, isOpen, className }) => {
    if(!isOpen) return null;
    return <div className={`overflow-hidden text-sm transition-all pb-4 ${className}`}>{children}</div>
};
