import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: ReactNode;
}


const queryClient = new QueryClient();

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID}
        config={{
          loginMethods: ['email', 'google'],
          appearance: {
            theme: 'light',
            accentColor: '#676FFF',
            logo: 'https://your-logo-url',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}