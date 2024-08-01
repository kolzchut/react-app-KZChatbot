import { useState, useEffect } from "react";
import axios, { AxiosResponse, AxiosError } from "axios";

type ApiResponse<T> = {
  data: T | null;
  loading: boolean;
  error: AxiosError | null;
};

export function useFetch<T>(url: string): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AxiosError | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: AxiosResponse<T> = await axios.get(url);
        setData(response.data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      // Cleanup logic, if necessary
    };
  }, [url]);

  return { data, loading, error };
}

// Using the Custom Hook on a component
// function ExampleComponent() {
//   const { data, loading, error } = useFetch<{ /* Expected data type */ }>('https://example.com/api/data');

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (error) {
//     return <div>Error: {error.message}</div>;
//   }

//   if (!data) {
//     return <div>No data.</div>;
//   }

//   return (
//     <div>
//       {/* Rendering of the obtained data */}
//     </div>
//   );
// }
