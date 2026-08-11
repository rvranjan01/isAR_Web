import { ProjectStatus } from '@/types';

export const PIPELINE_STAGES: ProjectStatus[] = [
  'Uploaded',
  'Pending Review',
  'AR In Progress',
  'Quality Check',
  'Completed',
  'Delivered'
];

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; description: string }> = {
  'Uploaded': {
    label: 'Uploaded',
    description: 'Raw product scan data uploaded to Immverse portal.'
  },
  'Pending Review': {
    label: 'Pending Review',
    description: 'Immverse AR engineering team is reviewing model specs.'
  },
  'AR In Progress': {
    label: 'AR In Progress',
    description: '3D digital twin creation and texturing underway.'
  },
  'Quality Check': {
    label: 'Quality Check',
    description: '3D model undergoing lighting and polygon QA testing.'
  },
  'Completed': {
    label: 'Completed',
    description: 'AR asset finalized! Scannable Web AR QR code generated.'
  },
  'Delivered': {
    label: 'Delivered',
    description: 'Client accepted model and deployed to production.'
  }
};

export const MOCK_ADMIN_EMAIL = 'admin@immversestudios.com';
export const MOCK_CLIENT_EMAIL = 'client@restaurant.com';
export const MOCK_CLIENT_ORDER_ID = 'ORD-8942';
