import { useRef, useState } from "react";
import { toast } from "sonner";
import type { MyProfileDTO, PictureDTO } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { Button } from "@shadcn/ui/button";

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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {pictures.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-1">
            <img src={p.url} alt="" className="size-24 rounded-md object-cover" />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={p.isProfile ? "default" : "outline"}
                disabled={busy || p.isProfile}
                onClick={() => setProfile(p.id)}
              >
                {p.isProfile ? "Profile" : "Set"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy || pictures.length <= 1}
                onClick={() => remove(p.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

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
      <Button
        variant="outline"
        disabled={busy || pictures.length >= MAX_PHOTOS}
        onClick={() => inputRef.current?.click()}
      >
        {pictures.length >= MAX_PHOTOS ? "Maximum 5 photos" : "Add photo"}
      </Button>
    </div>
  );
}
