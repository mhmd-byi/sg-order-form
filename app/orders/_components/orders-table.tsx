"use client";

import { useState } from "react";
import Link from "next/link";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equals,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ARTISAN_STAGE_LABELS, CITIES } from "@/lib/constants";
import type { OrderView } from "@/lib/types";
import { StatusBadge } from "./status-badge";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString, equals: filterFn_equals },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

const helper = createColumnHelper<typeof features, OrderView>();

const GLOBAL_FILTER_COLUMNS = new Set(["orderNumber", "customerName", "customerPhone", "itemsSummary"]);

const columns = helper.columns([
  helper.accessor((row) => row.orderNumber, {
    id: "orderNumber",
    header: "Order #",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => <span className="font-medium">SG-{getValue()}</span>,
  }),
  helper.accessor((row) => row.customer.name, {
    id: "customerName",
    header: "Customer",
    sortFn: "text",
  }),
  helper.accessor((row) => row.customer.phone, {
    id: "customerPhone",
    header: "Phone",
    enableSorting: false,
  }),
  helper.accessor((row) => row.items.map((item) => item.itemType).join(", "), {
    id: "itemsSummary",
    header: "Items",
    enableSorting: false,
  }),
  helper.accessor((row) => row.status, {
    id: "status",
    header: "Status",
    filterFn: "equals",
    sortFn: "text",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.accessor((row) => (row.status === "InProgress" ? ARTISAN_STAGE_LABELS[row.artisanStage ?? "Accepted"] : ""), {
    id: "artisanStage",
    header: "Artisan Stage",
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ getValue }) => getValue() || <span className="text-zinc-400">—</span>,
  }),
  helper.accessor((row) => row.city, {
    id: "city",
    header: "City",
    filterFn: "equals",
    sortFn: "text",
    enableGlobalFilter: false,
  }),
  helper.accessor((row) => row.createdAt, {
    id: "createdAt",
    header: "Date",
    sortFn: "alphanumeric",
    enableGlobalFilter: false,
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  }),
  helper.accessor((row) => row.deliveryDate, {
    id: "deliveryDate",
    header: "Delivery",
    sortFn: "alphanumeric",
    enableGlobalFilter: false,
    cell: ({ getValue }) =>
      new Date(getValue()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  }),
  helper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.orderNumber}`} className="text-brand hover:underline">
        View
      </Link>
    ),
  }),
]);

export function OrdersTable({ orders }: { orders: OrderView[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const statusFilter = (columnFilters.find((f) => f.id === "status")?.value as string) ?? "";
  const cityFilter = (columnFilters.find((f) => f.id === "city")?.value as string) ?? "";

  function setColumnFilter(id: string, value: string) {
    setColumnFilters((prev) => {
      const rest = prev.filter((f) => f.id !== id);
      return value ? [...rest, { id, value }] : rest;
    });
  }

  const table = useTable({
    features,
    columns,
    data: orders,
    getRowId: (row) => String(row.orderNumber),
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => GLOBAL_FILTER_COLUMNS.has(column.id),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search order #, customer, phone, item…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-72 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => setColumnFilter("status", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setColumnFilter("city", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        <table.FlexRender header={header} />
                        {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? ""}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
