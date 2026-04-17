
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  isLoading?: boolean;
}

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  searchPlaceholder = "Rechercher...",
  searchKey,
  isLoading = false
}: AdminDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item => {
    if (!searchQuery || !searchKey) return true;
    const value = item[searchKey];
    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border bg-card shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-bottom bg-muted/30">
              {columns.map((col, i) => (
                <th key={i} className={`p-4 text-xs font-black uppercase tracking-widest text-muted-foreground ${col.className}`}>
                  {col.header}
                </th>
              ))}
              <th className="p-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-12 text-center text-muted-foreground italic">
                    Aucun résultat trouvé.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border-t hover:bg-muted/10 transition-colors group"
                  >
                    {columns.map((col, i) => (
                      <td key={i} className={`p-4 ${col.className}`}>
                        {typeof col.accessor === 'function' 
                          ? col.accessor(item) 
                          : (item[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full px-4 h-8 text-xs font-bold"
                          onClick={() => onEdit(item)}
                        >
                          Éditer
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                          onClick={() => onDelete(item)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground px-4">
        {filteredData.length} élément(s) affiché(s)
      </div>
    </div>
  );
}
