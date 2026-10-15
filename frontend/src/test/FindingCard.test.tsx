import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FindingCard } from '../features/security/FindingCard';
import type { Finding } from '../types';

describe('FindingCard Component', () => {
  const sampleFinding: Finding = {
    rule_id: 'S3_PUBLIC_ACCESS',
    title: 'Publicly Accessible S3 Bucket',
    severity: 'high',
    category: 'Storage',
    affected_resource_id: 's3-insecure',
    affected_resource_name: 'Customer Backup Bucket',
    explanation: 'Public access is enabled while block public access is false.',
    impact: 'Direct internet exposure of all data.',
    remediation: 'Enable S3 Block Public Access immediately.',
    references: ['https://aws.amazon.com/s3/'],
  };

  it('renders finding title, severity badge, and affected resource', () => {
    render(<FindingCard finding={sampleFinding} />);
    expect(screen.getByText('Publicly Accessible S3 Bucket')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Customer Backup Bucket')).toBeInTheDocument();
    expect(screen.getByText('S3_PUBLIC_ACCESS')).toBeInTheDocument();
  });

  it('expands to show explanation, impact, and remediation on click', () => {
    render(<FindingCard finding={sampleFinding} />);

    // Details initially hidden
    expect(screen.queryByText(/Direct internet exposure of all data/)).not.toBeInTheDocument();

    // Click card header to expand
    fireEvent.click(screen.getByText('Publicly Accessible S3 Bucket'));

    // Details visible
    expect(screen.getByText(/Direct internet exposure of all data/)).toBeInTheDocument();
    expect(screen.getByText(/Enable S3 Block Public Access immediately/)).toBeInTheDocument();
  });

  it('triggers onSelectResource callback when resource name is clicked', () => {
    const handleSelect = vi.fn();
    render(<FindingCard finding={sampleFinding} onSelectResource={handleSelect} />);

    fireEvent.click(screen.getByText('Customer Backup Bucket'));
    expect(handleSelect).toHaveBeenCalledWith('s3-insecure');
  });
});
