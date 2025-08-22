export async function getEndingRentAgreements() {
  const response = await fetch("/api/main/endingRents");
  return await response.json();
}
