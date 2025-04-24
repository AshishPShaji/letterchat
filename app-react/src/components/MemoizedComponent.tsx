"use client";

import { memo, useMemo, useCallback, type ReactNode, type ComponentType } from 'react';

// Generic type for memoizing any component props
export function withMemo<T extends object>(Component: ComponentType<T>, propsAreEqual?: (prevProps: Readonly<T>, nextProps: Readonly<T>) => boolean): ComponentType<T> {
  // Use React.memo to prevent unnecessary re-renders
  return memo(Component, propsAreEqual);
}

// Wrapper for children components to optimize renders
interface MemoizedChildrenProps {
  children: ReactNode;
  id?: string | number;
}

// MemoizedChildren component that only re-renders when children or id props change
export const MemoizedChildren = memo(function MemoizedChildren({ children }: MemoizedChildrenProps) {
  return <>{children}</>;
});

// Hook to memoize expensive calculations
export function useMemoizedCalculation<T>(calculation: () => T, dependencies: any[]): T {
  return useMemo(calculation, dependencies);
}

// Hook to memoize handlers to prevent unnecessary re-renders in child components
export function useMemoizedHandler<T extends (...args: any[]) => any>(handler: T, dependencies: any[] = []): T {
  return useCallback(handler, dependencies);
}

// Component for optimizing lists where each item has a unique id
interface MemoizedListItemProps<T> {
  item: T;
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string | number;
}

export function MemoizedListItem<T>({ item, renderItem, keyExtractor }: MemoizedListItemProps<T>) {
  const key = useMemo(() => keyExtractor(item), [item, keyExtractor]);
  
  return (
    <MemoizedChildren key={key} id={key}>
      {renderItem(item)}
    </MemoizedChildren>
  );
}

// HOC for list components to prevent unnecessary re-renders
export function optimizeList<T extends { id: string | number } | { _id: string | number }>(Component: ComponentType<any>) {
  return memo(Component, (prevProps, nextProps) => {
    // Default implementation that checks if the list data has changed
    if (prevProps.data && nextProps.data) {
      // If lengths are different, the list has changed
      if (prevProps.data.length !== nextProps.data.length) {
        return false;
      }
      
      // Compare ids to see if any items have changed
      const prevIds = prevProps.data.map((item: any) => item._id || item.id);
      const nextIds = nextProps.data.map((item: any) => item._id || item.id);
      
      return prevIds.every((id: string | number, index: number) => id === nextIds[index]);
    }
    
    // Default to re-render if we can't determine
    return false;
  });
} 