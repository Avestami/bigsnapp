import React from 'react';
import { render, screen } from '@testing-library/react';

function BasicComponent() {
  return <div>Basic Test</div>;
}

describe('Basic Render Test', () => {
  it('should render without providers', () => {
    render(<BasicComponent />);
    expect(screen.getByText('Basic Test')).toBeInTheDocument();
  });
});