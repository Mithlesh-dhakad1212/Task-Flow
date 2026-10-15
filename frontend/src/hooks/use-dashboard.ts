'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-keys';

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => dashboardApi.get(signal),
  });
}
