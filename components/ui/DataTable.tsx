import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { SearchIcon } from '../icons/SearchIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

export interface Column<T> {
  accessor: keyof T | ((item: T) => React.ReactNode);
  Header: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
}

export const DataTable = <T extends { id: string }>({ columns, data, searchKey }: DataTableProps<T>) => {
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    if (!filter || !searchKey) return data;
    return data.filter(item => {
        const value = item[searchKey];
        if (typeof value === 'string') {
            return value.toLowerCase().includes(filter.toLowerCase());
        }
        return false;
    });
  }, [data, filter, searchKey]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="w-full">
      {searchKey && (
        <div className="flex items-center py-4">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              placeholder={`Search by ${String(searchKey)}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>
        </div>
      )}
      <div className="rounded-md border bg-card">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              {columns.map((col, index) => (
                <th key={index} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {col.Header}
                </th>
              ))}
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {paginatedData.map((item) => (
              <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                {columns.map((col, index) => (
                  <td key={index} className="p-4 align-middle">
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : String(item[col.accessor] ?? '')}
                  </td>
                ))}
                <td className="p-4 align-middle">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
         <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
        >
            <ChevronLeftIcon className="h-4 w-4 mr-1" /> Previous
        </Button>
        <span className="text-sm">
            Page {currentPage} of {totalPages}
        </span>
        <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
        >
            Next <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};