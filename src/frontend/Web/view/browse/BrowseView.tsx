import { useEffect, useState } from "react";
import type { ProfilePreviewDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Placeholder } from "@web/component/Placeholder";

const PAGE_SIZE = 20;

export function BrowseView() {
  const [suggestions, setSuggestions] = useState<ProfilePreviewDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadingWrapper(setLoading, () =>
      API.profiles.search({ limit: PAGE_SIZE, offset: 0 }).then((r) => {
        if (r.error) return;
        setSuggestions(r.data.items);
      }),
    );
  }, []);

  return <Placeholder title={loading ? "Browse" : `Browse (${suggestions.length} ready)`} />;
}
