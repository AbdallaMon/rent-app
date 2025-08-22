"use client";
import { createContext, useContext, useState } from "react";

const DataLoaderContext = createContext();

export function DataLoaderProvider({ children }) {
  const [loading, setLoading] = useState(false);

  return (
    <DataLoaderContext.Provider value={{ loading, setLoading }}>
      {children}
    </DataLoaderContext.Provider>
  );
}

export const useDataLoader = () => useContext(DataLoaderContext);
