"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return ( 
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </QueryClientProvider>
  );
}
