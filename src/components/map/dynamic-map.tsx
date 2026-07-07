"use client"
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const DynamicMap = dynamic(
  () => import('./map-view'),
  { 
    ssr: false,
    loading: () => <Skeleton className="w-full h-full min-h-[400px] rounded-lg" />
  }
);
