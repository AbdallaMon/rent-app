// helpers/hooks/useFetchMaintenances.js
import { useState, useEffect } from "react";

import dayjs from "dayjs";
import { api } from "@/app/api/upload/route";

export const useFetchMaintenances = (date) => {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenances = async () => {
      setLoading(true);
      try {
        // If a date is provided, filter maintenances by that date
        let url = `${apiEndpoints.maintenance}`;
        if (date) {
          const formattedDate = dayjs(date).format("YYYY-MM-DD");
          url = `${url}?date=${formattedDate}`;
        }

        const response = await api.get(url);
        setMaintenances(response.data.data || []);
      } catch (err) {
        console.error("Error fetching maintenances:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenances();
  }, [date]);

  return { maintenances, loading, error };
};
