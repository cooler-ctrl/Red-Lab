import type { GraphData } from '../types';

export function createExampleNetworkLab(): GraphData {
  return {
    nodes: [
      {
        id: 'ext-internet',
        type: 'external_network',
        position: { x: 50, y: 220 },
        label: 'Internet WAN',
        config: {
          name: 'Internet WAN',
          description: 'Public Untrusted Internet (0.0.0.0/0)',
          cidr_block: '0.0.0.0/0',
        },
      },
      {
        id: 'fw-perimeter',
        type: 'firewall',
        position: { x: 280, y: 220 },
        label: 'Perimeter Firewall',
        config: {
          name: 'Perimeter Firewall',
          ip_address: '10.0.0.1',
          cidr_prefix: '24',
          default_gateway: '',
          inbound_rules: [
            {
              id: 'fw-r1',
              priority: 10,
              action: 'allow',
              protocol: 'tcp',
              source: 'any',
              destination: 'any',
              port_range: '80',
              description: 'Allow Web Traffic (HTTP)',
              enabled: true,
            },
            {
              id: 'fw-r2',
              priority: 20,
              action: 'deny',
              protocol: 'tcp',
              source: 'any',
              destination: 'any',
              port_range: '22',
              description: 'Block External SSH Access',
              enabled: true,
            },
          ],
          outbound_rules: [],
          default_inbound_action: 'deny',
          default_outbound_action: 'allow',
        },
      },
      {
        id: 'srv-dmz',
        type: 'server',
        position: { x: 520, y: 120 },
        label: 'DMZ Web Server',
        config: {
          name: 'DMZ Web Server',
          ip_address: '10.0.0.10',
          cidr_prefix: '24',
          default_gateway: '10.0.0.1',
          services: [
            { name: 'Nginx Web', port: 80, protocol: 'tcp', enabled: true },
            { name: 'OpenSSH', port: 22, protocol: 'tcp', enabled: true },
          ],
          os: 'Ubuntu 24.04 LTS',
        },
      },
      {
        id: 'router-core',
        type: 'router',
        position: { x: 520, y: 320 },
        label: 'Core Router',
        config: {
          name: 'Core Router',
          interfaces: [
            { id: 'eth0', name: 'eth0', ip_address: '10.0.0.2', cidr_prefix: '24', enabled: true },
            { id: 'eth1', name: 'eth1', ip_address: '192.168.1.1', cidr_prefix: '24', enabled: true },
          ],
          static_routes: [],
          nat_enabled: true,
        },
      },
      {
        id: 'sw-lan',
        type: 'switch',
        position: { x: 760, y: 320 },
        label: 'Office LAN Switch',
        config: {
          name: 'Office LAN Switch',
          ports: [
            { id: 'p1', name: 'Fa0/1', vlan: 1, enabled: true },
            { id: 'p2', name: 'Fa0/2', vlan: 1, enabled: true },
            { id: 'p3', name: 'Fa0/3', vlan: 1, enabled: true },
          ],
          default_vlan: 1,
        },
      },
      {
        id: 'pc-workstation',
        type: 'pc',
        position: { x: 1000, y: 320 },
        label: 'Admin Workstation',
        config: {
          name: 'Admin Workstation',
          interfaces: [
            { id: 'eth0', name: 'eth0', ip_address: '192.168.1.10', cidr_prefix: '24', enabled: true },
          ],
          default_gateway: '192.168.1.1',
          dns_servers: ['1.1.1.1'],
          os: 'Debian Linux',
        },
      },
    ],
    edges: [
      {
        id: 'e-ext-fw',
        source: 'ext-internet',
        target: 'fw-perimeter',
        relationship_type: 'connects',
        metadata: { link_speed: '1Gbps' },
      },
      {
        id: 'e-fw-srv',
        source: 'fw-perimeter',
        target: 'srv-dmz',
        relationship_type: 'connects',
        metadata: { link_speed: '1Gbps' },
      },
      {
        id: 'e-fw-router',
        source: 'fw-perimeter',
        target: 'router-core',
        relationship_type: 'connects',
        metadata: { link_speed: '1Gbps' },
      },
      {
        id: 'e-router-sw',
        source: 'router-core',
        target: 'sw-lan',
        relationship_type: 'connects',
        metadata: { link_speed: '1Gbps' },
      },
      {
        id: 'e-sw-pc',
        source: 'sw-lan',
        target: 'pc-workstation',
        relationship_type: 'connects',
        metadata: { link_speed: '1Gbps' },
      },
    ],
  };
}
