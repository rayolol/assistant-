import React from "react"
// React function for responsiveness, theme and animations

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  fluid?: boolean
  className?: string
}

export const ContentContainer = ({ children, fluid = false, className = "", ...props }: React.PropsWithChildren<ContainerProps>) => {
  return (
    <div className={`mx-autos ${fluid ? 'w-full' : 'max-w-7xl'} ${className}`} {...props}>
      {children}
    </div>
  )
}

export const SideBarContainer = ({ children, isOpen = true, onClose, className = "", ...props }: React.PropsWithChildren<ContainerProps & { isOpen: boolean; onClose: () => void }>) => {
  return (
      <div className={`h-screen flex-col border-gray-300 bg-gray-200 dark:border-neutral-950 dark:bg-neutral-900 w-full md:w-[320px] lg:w-[360px] md:flex transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${className}`} {...props}>
        <div className="flex justify-end p-4 z-10">
          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>

)
}

// Collapsible sidebar container with toggle functionality
export const CollapsibleSideBar = ({
  children,
  isOpen,
  onClose,
  className = "",
  ...props
}: React.PropsWithChildren<ContainerProps & { isOpen: boolean; onClose: () => void }>) => {
  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 
          w-[280px] sm:w-[300px] 
          bg-gray-100 dark:bg-neutral-900
          border-r border-gray-200 dark:border-neutral-800
          shadow-lg transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:hidden ${className}`}
        {...props}
      >
        <div className="flex justify-end p-4">
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
      
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
    </>
  )
}

