
import { useState, useEffect, useCallback } from 'react';
import type { FavItem } from '../types';

const KEY = "kasuku_favorites_v1";

export function useFavorites() {
  const [items, setItems] = useState<FavItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsedItems = JSON.parse(raw);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
        }
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage", error);
    }
  }, []);

  const persist = useCallback((list: FavItem[]) => {
    setItems(list);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (error) {
        console.error("Failed to save favorites to localStorage", error);
    }
  }, []);

  const add = useCallback((item: FavItem) => {
    // Add item if it doesn't exist, preventing duplicates
    setItems(prevItems => {
        if (prevItems.some(i => i.type === item.type && i.id === item.id)) {
            return prevItems;
        }
        const newItems = [...prevItems, item];
        persist(newItems);
        return newItems;
    });
  }, [persist]);

  const remove = useCallback((type: FavItem["type"], id: string) => {
    setItems(prevItems => {
        const newItems = prevItems.filter(i => !(i.type === type && i.id === id));
        persist(newItems);
        return newItems;
    });
  }, [persist]);

  const exists = useCallback((type: FavItem["type"], id: string) => {
    return items.some(i => i.type === type && i.id === id);
  }, [items]);

  const toggle = useCallback((item: FavItem) => {
    if (exists(item.type, item.id)) {
      remove(item.type, item.id);
    } else {
      add(item);
    }
  }, [exists, remove, add]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kasuku-favorites.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [items]);
  
  const importJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const importedItems = JSON.parse(text);
          if (Array.isArray(importedItems) && importedItems.every(i => i.type && i.id && i.slug && i.title)) {
            persist(importedItems);
            alert(`${importedItems.length} items imported successfully!`);
          } else {
            throw new Error('Invalid file format or missing properties');
          }
        }
      } catch (error) {
        console.error('Error importing favorites', error);
        alert('Failed to import favorites. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [persist]);

  return { items, toggle, exists, exportJson, importJson };
}
