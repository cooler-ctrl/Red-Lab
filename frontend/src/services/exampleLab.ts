import type { GraphData } from '../types';

export function createExampleLab(): GraphData {
  return {
    nodes: [
      {
        id: 'igw-1',
        type: 'internet_gateway',
        position: { x: 50, y: 200 },
        label: 'Internet Gateway',
        config: {
          name: 'Main IGW',
          vpc_id: 'vpc-1',
        },
      },
      {
        id: 'vpc-1',
        type: 'vpc',
        position: { x: 300, y: 200 },
        label: 'Production VPC',
        config: {
          name: 'Production VPC',
          cidr_block: '10.0.0.0/16',
          region: 'us-east-1',
        },
      },
      {
        id: 'subnet-1',
        type: 'subnet',
        position: { x: 580, y: 90 },
        label: 'Public Subnet',
        config: {
          name: 'Public Subnet',
          cidr_block: '10.0.1.0/24',
          vpc_id: 'vpc-1',
          is_public: true,
        },
      },
      {
        id: 'subnet-2',
        type: 'subnet',
        position: { x: 580, y: 320 },
        label: 'Private Subnet',
        config: {
          name: 'Private Subnet',
          cidr_block: '10.0.2.0/24',
          vpc_id: 'vpc-1',
          is_public: false,
        },
      },
      {
        id: 'sg-1',
        type: 'security_group',
        position: { x: 880, y: -50 },
        label: 'Insecure Web SG',
        config: {
          name: 'Insecure Web SG',
          inbound_rules: [
            {
              protocol: 'tcp',
              port_range: '22',
              source: '0.0.0.0/0',
              description: 'SSH 0.0.0.0/0 exposure',
            },
            {
              protocol: 'tcp',
              port_range: '80',
              source: '0.0.0.0/0',
              description: 'HTTP 0.0.0.0/0 exposure',
            },
            {
              protocol: '-1',
              port_range: '0-65535',
              source: '0.0.0.0/0',
              description: 'All traffic exposed to internet',
            },
          ],
          outbound_rules: [
            {
              protocol: '-1',
              port_range: '0-65535',
              source: '0.0.0.0/0',
              description: 'Allow all outbound',
            },
          ],
        },
      },
      {
        id: 'ec2-1',
        type: 'ec2',
        position: { x: 880, y: 90 },
        label: 'Web Server',
        config: {
          name: 'Web Server',
          instance_type: 't3.micro',
          subnet_id: 'subnet-1',
          security_group_ids: ['sg-1'],
          public_ip: true,
          iam_role_id: 'iam-1',
        },
      },
      {
        id: 'iam-1',
        type: 'iam_role',
        position: { x: 1180, y: 50 },
        label: 'Overprivileged IAM Role',
        config: {
          name: 'OverprivilegedAppRole',
          policies: [
            {
              name: 'AdminAccess',
              actions: ['*'],
              resources: ['*'],
            },
          ],
        },
      },
      {
        id: 's3-1',
        type: 's3',
        position: { x: 1180, y: 220 },
        label: 'Sensitive Data Bucket',
        config: {
          name: 'corporate-data-lake-unencrypted',
          public_access: true,
          block_public_access: false,
          encryption: false,
          versioning: false,
        },
      },
      {
        id: 'rds-1',
        type: 'rds',
        position: { x: 880, y: 320 },
        label: 'Customer Database',
        config: {
          name: 'Customer Database',
          engine: 'postgresql',
          subnet_id: 'subnet-2',
          publicly_accessible: true,
          encryption: false,
          security_group_ids: ['sg-2'],
        },
      },
      {
        id: 'sg-2',
        type: 'security_group',
        position: { x: 880, y: 460 },
        label: 'Permissive DB SG',
        config: {
          name: 'Permissive DB SG',
          inbound_rules: [
            {
              protocol: 'tcp',
              port_range: '5432',
              source: '0.0.0.0/0',
              description: 'Postgres open to 0.0.0.0/0',
            },
          ],
          outbound_rules: [
            {
              protocol: '-1',
              port_range: '0-65535',
              source: '0.0.0.0/0',
              description: 'Allow all outbound',
            },
          ],
        },
      },
    ],
    edges: [
      {
        id: 'e-subnet-1-vpc-1',
        source: 'subnet-1',
        target: 'vpc-1',
        relationship_type: 'contains',
        metadata: {},
      },
      {
        id: 'e-subnet-2-vpc-1',
        source: 'subnet-2',
        target: 'vpc-1',
        relationship_type: 'contains',
        metadata: {},
      },
      {
        id: 'e-ec2-1-subnet-1',
        source: 'ec2-1',
        target: 'subnet-1',
        relationship_type: 'contains',
        metadata: {},
      },
      {
        id: 'e-rds-1-subnet-2',
        source: 'rds-1',
        target: 'subnet-2',
        relationship_type: 'contains',
        metadata: {},
      },
      {
        id: 'e-igw-1-vpc-1',
        source: 'igw-1',
        target: 'vpc-1',
        relationship_type: 'attaches',
        metadata: {},
      },
      {
        id: 'e-sg-1-ec2-1',
        source: 'sg-1',
        target: 'ec2-1',
        relationship_type: 'attaches',
        metadata: {},
      },
      {
        id: 'e-sg-2-rds-1',
        source: 'sg-2',
        target: 'rds-1',
        relationship_type: 'attaches',
        metadata: {},
      },
      {
        id: 'e-iam-1-ec2-1',
        source: 'iam-1',
        target: 'ec2-1',
        relationship_type: 'references',
        metadata: {},
      },
    ],
  };
}
