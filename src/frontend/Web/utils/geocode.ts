const NOMINATIM = "https://nominatim.openstreetmap.org";

interface NominatimAddress {
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  city_district?: string;
  borough?: string;
  residential?: string;
  hamlet?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  country?: string;
}

function pickArea(addr: NominatimAddress | undefined): string | null {
  if (!addr) return null;
  const hood =
    addr.neighbourhood ??
    addr.quarter ??
    addr.suburb ??
    addr.city_district ??
    addr.borough ??
    addr.residential ??
    addr.hamlet;
  const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county;

  const parts = [hood, city].filter((p): p is string => Boolean(p));
  const unique = parts.filter((p, i) => parts.indexOf(p) === i); // dédoublonne si hood == city
  return unique.length > 0 ? unique.join(", ") : null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: NominatimAddress };
    return pickArea(data.address);
  } catch {
    return null;
  }
}

export async function forwardGeocode(
  query: string,
): Promise<{ latitude: number; longitude: number; city: string } | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
    );
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: NominatimAddress;
    }>;
    const first = results[0];
    if (!first) return null;
    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      city: pickArea(first.address) ?? first.display_name,
    };
  } catch {
    return null;
  }
}
