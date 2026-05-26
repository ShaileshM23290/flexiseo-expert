export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parsePagination(
  searchParams: { page?: string; pageSize?: string },
  defaultPageSize = DEFAULT_PAGE_SIZE
) {
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const rawSize = Number.parseInt(searchParams.pageSize ?? String(defaultPageSize), 10) || defaultPageSize;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function paginationRange(page: number, totalPages: number, delta = 2) {
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}
