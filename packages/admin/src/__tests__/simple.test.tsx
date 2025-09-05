import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test to check if React rendering works
describe('Simple Test', () => {
  it('should render a simple component', () => {
    const SimpleComponent = () => <div>Hello World</div>;
    render(<SimpleComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});