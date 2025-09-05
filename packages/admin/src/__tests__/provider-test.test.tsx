import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';

function TestComponent() {
  return <div>Provider Test</div>;
}

function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Provider Test', () => {
  it('should render with QueryClient, MemoryRouter, and ConfigProvider', () => {
    render(
      <TestProviders>
        <TestComponent />
      </TestProviders>
    );
    expect(screen.getByText('Provider Test')).toBeInTheDocument();
  });
});