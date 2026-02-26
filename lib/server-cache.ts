import { unstable_cache } from "next/cache";

type AsyncFn<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

export function withServerCache<TArgs extends unknown[], TResult>(
  fn: AsyncFn<TArgs, TResult>,
  keyParts: string[],
  options: { revalidate?: number; tags?: string[] }
): AsyncFn<TArgs, TResult> {
  if (process.env.NODE_ENV === "test") {
    return fn;
  }
  return unstable_cache(fn, keyParts, options);
}
