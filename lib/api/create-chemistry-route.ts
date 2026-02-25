import { NextRequest, NextResponse } from "next/server";
import { getRequestUserId } from "./shared";

type FirestoreFetcher<T> = () => Promise<T>;

export function createChemistryRoute<T>(
  dataKey: string,
  fetcher: FirestoreFetcher<T>,
  errorMessage: string
) {
  return async function (request: NextRequest) {
    const userId = await getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Student login required." }, { status: 401 });
    }
    try {
      const data = await fetcher();
      return NextResponse.json({ [dataKey]: data });
    } catch (err) {
      const details = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        process.env.NODE_ENV !== "production"
          ? { error: errorMessage, details }
          : { error: errorMessage },
        { status: 500 }
      );
    }
  };
}
