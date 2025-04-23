interface ForProps<T> {
  each: T[] | undefined | null;
  empty?: React.ReactNode;
  children: (item: T, index: number) => React.ReactNode;
}

export function For<T>({
  each,
  empty,
  children,
}: ForProps<T>): React.ReactNode {
  if (!each || each.length === 0) {
    return empty;
  }

  return <>{each.map(children)}</>;
}
