const NOMINATIM = "https://nominatim.openstreetmap.org";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  county?: string;
  country?: string;
}

function pickCity(addr: NominatimAddress | undefined): string | null {
  if (!addr) return null;
  const name = addr.suburb ?? addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county;
  if (!name) return null;
  return addr.country ? `${name}, ${addr.country}` : name;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: NominatimAddress };
    return pickCity(data.address);
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
      city: pickCity(first.address) ?? first.display_name,
    };
  } catch {
    return null;
  }
}
