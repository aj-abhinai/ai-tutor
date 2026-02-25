import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId } from "./shared";

type FirestoreFetcher<T> = () => Promise<T>;
type ErrorPayload = { error: string; details?: string };

export function createPhysicsRoute<T, K extends string>(
  dataKey: K,
  fetcher: FirestoreFetcher<T>,
  errorMessage: string
) {
  return async function (
    request: NextRequest
  ): Promise<NextResponse<{ [P in K]: T } | ErrorPayload>> {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json<ErrorPayload>(
        { error: "Student login required." },
        { status: 401 }
      );
    }
    try {
      const data = await fetcher();
      return NextResponse.json<{ [P in K]: T }>({ [dataKey]: data } as { [P in K]: T });
    } catch (err) {
      const details = err instanceof Error ? err.message : String(err);
      const payload: ErrorPayload =
        process.env.NODE_ENV !== "production"
          ? { error: errorMessage, details }
          : { error: errorMessage };
      return NextResponse.json(
        payload,
        { status: 500 }
      );
    }
  };
}
