import { useRef, useState } from "react";
import { toast } from "sonner";
import { X, Star, Plus } from "lucide-react";
import type { MyProfileDTO, PictureDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { cn } from "@shadcn/lib/utils";

const MAX_PHOTOS = 5;

interface PhotoManagerProps {
  pictures: PictureDTO[];
  onChange: (profile: MyProfileDTO) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Cannot read file"));
    reader.readAsDataURL(file);
  });
}

export function PhotoManager({ pictures, onChange }: PhotoManagerProps) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    return loadingWrapper(setBusy, async () => {
      const data = await fileToDataUrl(file);
      const r = await API.profile.addPhoto({ data });
      if (r.error) return toast.error(String(r.data));
      onChange(r.data);
    });
  }

  function remove(id: string) {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profile.deletePhoto(id);
      if (r.error) return toast.error(String(r.data));
      onChange(r.data);
    });
  }

  function setProfile(id: string) {
    return loadingWrapper(setBusy, async () => {
      const r = await API.profile.setProfilePhoto(id);
      if (r.error) return toast.error(String(r.data));
      onChange(r.data);
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {pictures.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg border",
              p.isProfile && "ring-primary ring-2 ring-offset-1",
            )}
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" />

            {pictures.length > 1 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(p.id)}
                aria-label="Delete photo"
                className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            )}

            {p.isProfile ? (
              <span className="bg-primary text-primary-foreground absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shadow">
                <Star className="size-3 fill-current" />
                Profile
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setProfile(p.id)}
                aria-label="Set as profile picture"
                className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-50"
              >
                <Star className="size-3" />
                Set
              </button>
            )}
          </div>
        ))}

        {pictures.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="text-muted-foreground hover:border-primary hover:text-primary flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition disabled:opacity-50"
          >
            <Plus className="size-6" />
            <span className="text-xs">Add</span>
          </button>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        {pictures.length}/{MAX_PHOTOS} photos · the highlighted one is your profile picture
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
