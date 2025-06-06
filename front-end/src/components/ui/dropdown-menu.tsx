import * as React from "react"

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild = false }) => {
  if (asChild) {
    // If asChild is true, we would typically use a library like Radix's Slot
    // For now, we'll just render as a regular div
    console.warn("asChild prop is not implemented yet");
  }
  return <div className="inline-flex cursor-pointer">{children}</div>
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = "center",
  className = ""
}) => {
  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0"
  };

  return (
    <div className={`absolute mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  onClick, 
  className = "" 
}) => {
  return (
    <div 
      className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} 