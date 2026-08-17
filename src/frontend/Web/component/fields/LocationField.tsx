import { useState } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { reverseGeocode, forwardGeocode } from "@web/utils/geocode";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  consent: boolean;
}

interface LocationFieldProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
  });
}


export function LocationField({ value, onChange }: LocationFieldProps) {
  const [busy, setBusy] = useState(false);
  const [cityInput, setCityInput] = useState(value.city ?? "");

  function useGPS() {
    return loadingWrapper(setBusy, async () => {
      try {
        const pos = await getPosition();
        const { latitude, longitude } = pos.coords;
        const city = await reverseGeocode(latitude, longitude);
        setCityInput(city ?? "");
        onChange({ latitude, longitude, city: city ?? value.city, consent: true });
      } catch {
        toast.error("Could not get your location. Enter it manually.");
      }
    });
  }

  function search() {
    const q = cityInput.trim();
    if (!q) return;
    return loadingWrapper(setBusy, async () => {
      const geo = await forwardGeocode(q);
      if (geo) {
        setCityInput(geo.city);
        onChange({ latitude: geo.latitude, longitude: geo.longitude, city: geo.city, consent: false });
      } else {
        onChange({ latitude: null, longitude: null, city: q, consent: false });
      }
    });
  }

  function clear() {
    setCityInput("");
    onChange({ latitude: null, longitude: null, city: null, consent: false });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" disabled={busy} onClick={useGPS}>
        <MapPin className="size-4" />
        Use my GPS location
      </Button>

      <div className="flex gap-2">
        <Input
          placeholder="Or type a city"
          value={cityInput}
          disabled={busy}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
        />
        <Button type="button" variant="secondary" disabled={busy} onClick={search}>
          Search
        </Button>
      </div>

      {value.city && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            Selected: <span className="text-foreground">{value.city}</span>
            {value.consent && <span className="text-muted-foreground"> · GPS</span>}
          </p>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={clear}>
            Remove location
          </Button>
        </div>
      )}
    </div>
  );
}
