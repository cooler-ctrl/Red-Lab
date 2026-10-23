import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FindingCard } from '../features/security/FindingCard';
import type { Finding } from '../types';

describe('FindingCard Component', () => {
  const sampleFinding: Finding = {
    rule_id: 'FIREWALL_DEFAULT_ALLOW',
    title: 'Firewall Policy Default Allow',
    severity: 'critical',
    category: 'Network Security',
    affected_resource_id: 'fw-insecure',
    affected_resource_name: 'Border Perimeter Firewall',
    explanation: 'Inbound action is set to allow without filtering.',
    impact: 'Direct internet exposure of all data.',
    remediation: 'Set default inbound action to deny.',
    references: ['https://csrc.nist.gov/'],
  };

  it('renders finding title, severity badge, and affected resource', () => {
    render(<FindingCard finding={sampleFinding} />);
    expect(screen.getByText('Firewall Policy Default Allow')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('Border Perimeter Firewall')).toBeInTheDocument();
    expect(screen.getByText('FIREWALL_DEFAULT_ALLOW')).toBeInTheDocument();
  });

  it('expands to show explanation, impact, and remediation on click', () => {
    render(<FindingCard finding={sampleFinding} />);

    // Details initially hidden
    expect(screen.queryByText(/Direct internet exposure of all data/)).not.toBeInTheDocument();

    // Click card header to expand
    fireEvent.click(screen.getByText('Firewall Policy Default Allow'));

    // Details visible
    expect(screen.getByText(/Direct internet exposure of all data/)).toBeInTheDocument();
    expect(screen.getByText(/Set default inbound action to deny/)).toBeInTheDocument();
  });

  it('triggers onSelectResource callback when resource name is clicked', () => {
    const handleSelect = vi.fn();
    render(<FindingCard finding={sampleFinding} onSelectResource={handleSelect} />);

    fireEvent.click(screen.getByText('Border Perimeter Firewall'));
    expect(handleSelect).toHaveBeenCalledWith('fw-insecure');
  });
});
