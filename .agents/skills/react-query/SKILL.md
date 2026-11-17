---
name: react-query
description: TanStack Query v5 conventions — query hooks, mutation hooks, service layer, callbacks, and cache invalidation. Use when writing data fetching, creating query/mutation hooks, working with services, or handling loading/error/success states from API calls.
---

# TanStack Query Conventions

## Pattern

```
Component → Query/Mutation hook → Service → ApiClient
```

Never call `fetch` or `ApiClient` directly from a component. Always go through a hook.

---

## Query Hooks

Query hooks live in `src/queries/<feature>.query.ts` and export from `src/queries/index.ts`.

```ts
// queries/items.query.ts
import { useQuery } from '@tanstack/react-query';
import { ItemService } from '@/services';

export const ITEM_KEYS = {
  all: ['items'] as const,
  detail: (id: string) => ['items', id] as const,
};

export function useItems() {
  return useQuery({
    queryKey: ITEM_KEYS.all,
    queryFn: () => ItemService.getItems(),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ITEM_KEYS.detail(id),
    queryFn: () => ItemService.getItem(id),
  });
}
```

---

## Mutation Hooks

Use **sync callbacks** (`onSuccess`, `onError`, `onSettled`) — not async `.mutateAsync()`.

The query file should only contain `mutationFn`. Callbacks that are specific to a call site (e.g. showing a toast, closing a dialog, resetting a form) belong in the component:

```ts
// queries/items.query.ts — only mutationFn here
export function useIngestItem() {
  return useMutation({
    mutationFn: (data: IngestInput) => ItemService.ingest(data),
  });
}
```

```tsx
// component — callbacks go here
const ingestItem = useIngestItem();

function handleSubmit(data: IngestInput) {
  ingestItem.mutate(data, {
    onSuccess: () => toast.success('Saved to inbox'),
    onError: (error) => toast.error(error.message),
  });
}
```

Put callbacks in the query file only when they are truly shared across every call site (e.g. cache invalidation that must always happen):

```ts
export function useIngestItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IngestInput) => ItemService.ingest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEM_KEYS.all });
    },
  });
}
```

Only use `.mutateAsync()` when you must `await` the result inline (rare).

---

## Service Layer

Services live in `src/services/<feature>.service.ts` and export from `src/services/index.ts`.

Services are **static classes** that call `ApiClient`. No hooks, no state.

```ts
// services/items.service.ts
import { ApiClient } from '@/lib/api-client';
import type { IngestInput, Item } from '@/types';

export class ItemService {
  static getItems() {
    return ApiClient.get<Item[]>('/items');
  }

  static getItem(id: string) {
    return ApiClient.get<Item>(`/items/${id}`);
  }

  static ingest(data: IngestInput) {
    return ApiClient.post<Item>('/ingest', data);
  }
}
```

Then use in query hooks:

```ts
queryFn: () => ItemService.getItems(),
mutationFn: (data) => ItemService.ingest(data),
```

---

## Cache Keys

Always define query keys as a const object in the query file. Co-locate keys with the hooks that use them.

```ts
export const ITEM_KEYS = {
  all: ['items'] as const,
  detail: (id: string) => ['items', id] as const,
};
```

---

## Loading / Error / Empty States

Destructure and handle all states explicitly:

```tsx
const { data: items, isLoading, isError, error } = useItems();

if (isLoading) return <Skeleton />;
if (isError) return <AlertMessage variant="error">{error.message}</AlertMessage>;
if (!items?.length) return <Empty />;
```

Never render nothing silently while loading or on error.
