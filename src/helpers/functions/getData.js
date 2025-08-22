export async function getData({
                                  url = "",
                                  setLoading,
                                  page,
                                  limit,
                                  filters,
                                  search,
                                  sort,
                                  others,
                              }) {
    try {
        setLoading(true);
        const response = await fetch(
              `/api/${url}?page=${page}&limit=${limit}&filters=${JSON.stringify(filters)}&search=${search}&sort=${JSON.stringify(sort)}&${others}`,
              {
                  headers: {
                      "Content-Type": "application/json",
                  },
                  method: "GET",
              },
        );
        return await response.json();
    } catch (e) {
        console.log(e);
    } finally {
        setLoading(false);
    }
}
