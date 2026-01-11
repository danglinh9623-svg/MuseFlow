import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps extends LucideIcons.LucideProps {
  name: keyof typeof LucideIcons;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const IconComponent = LucideIcons[name] as React.ElementType;
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
};