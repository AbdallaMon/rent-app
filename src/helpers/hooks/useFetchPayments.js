import { useEffect, useState } from "react";

export const useFetchPayments = (type, selectedDate) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      try {
        const dateParam = selectedDate
          ? `&date=${selectedDate.toISOString().split("T")[0]}`
          : "";

        const res = await fetch(`/api/main/payments?type=${type}${dateParam}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch ${type} payments`);
        }

        const data = await res.json();

        if (!data || !data.data) {
          setPayments([]);
        } else {
          setPayments(data.data);
        }
      } catch (error) {
        console.error(`Error fetching ${type} payments:`, error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [type, selectedDate]);

  return { payments, loading, setPayments };
};
