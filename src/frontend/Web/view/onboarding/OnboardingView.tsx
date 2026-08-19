import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Gender, MyProfileDTO, SexualPref } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { $user } from "@web/observables/observables";
import { GenderSelect } from "@web/component/fields/GenderSelect";
import { SexualPrefSelect } from "@web/component/fields/SexualPrefSelect";
import { BirthdateField } from "@web/component/fields/BirthdateField";
import { BioField } from "@web/component/fields/BioField";
import { TagPicker } from "@web/component/fields/TagPicker";
import { PhotoManager } from "@web/component/fields/PhotoManager";
import { LocationField, type LocationValue } from "@web/component/fields/LocationField";
import { Button } from "@shadcn/ui/button";
import { Label } from "@shadcn/ui/label";

export function OnboardingView() {
  const [profile, setProfile] = useState<MyProfileDTO | null>(null);
  const [gender, setGender] = useState<Gender>();
  const [pref, setPref] = useState<SexualPref>("bi");
  const [bio, setBio] = useState("");
  const [birthdate, setBirthdate] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationValue>({
    latitude: null,
    longitude: null,
    city: null,
    consent: false,
  });
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clear(field: string) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }

  useEffect(() => {
    API.profile.getMe().then((r) => {
      if (r.error) return;
      const p = r.data;
      setProfile(p);
      if (p.gender) setGender(p.gender);
      setPref(p.sexualPref);
      setBio(p.biography ?? "");
      if (p.birthdate) setBirthdate(p.birthdate);
      setTags(p.tags.map((t) => t.name));
      setLocation({
        latitude: p.latitude,
        longitude: p.longitude,
        city: p.city,
        consent: p.locationConsent,
      });
    });
  }, []);

  const pictures = profile?.pictures ?? [];

  // Bouton Finish actif seulement quand tout le profil requis est renseigné
  const canFinish =
    !!gender &&
    !!birthdate &&
    bio.trim() !== "" &&
    tags.length > 0 &&
    location.latitude != null &&
    location.longitude != null &&
    pictures.length > 0;

  function logout() {
    return loadingWrapper(setLoggingOut, () => API.auth.logout().then(() => $user.set(null)));
  }

  function finish() {
    const e: Record<string, string> = {};
    if (!gender) e.gender = "Please select your gender.";
    if (!birthdate) e.birthdate = "Please pick your birthdate.";
    if (!bio.trim()) e.biography = "Tell us a bit about yourself.";
    if (tags.length === 0) e.tags = "Select at least one interest.";
    if (location.latitude == null || location.longitude == null)
      e.location = "Set your location (allow GPS or pick your city).";
    if (pictures.length === 0) e.photos = "Add at least one photo.";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Please complete the highlighted fields.");
      return;
    }

    return loadingWrapper(setSaving, async () => {
      const up = await API.profile.updateProfile({
        gender,
        sexualPref: pref,
        biography: bio,
        birthdate,
      });
      if (up.error) return toast.error(String(up.data));

      const st = await API.profile.setTags({ tags });
      if (st.error) return toast.error(String(st.data));

      const loc = await API.profile.updateLocation({
        latitude: location.latitude ?? undefined,
        longitude: location.longitude ?? undefined,
        city: location.city ?? undefined,
        consent: location.consent,
      });
      if (loc.error) return toast.error(String(loc.data));

      const ob = await API.profile.completeOnboarding();
      if (ob.error) return toast.error(String(ob.data));

      $user.set(ob.data);
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Complete your profile</h1>
          <p className="text-muted-foreground text-sm">
            A few details before you can start browsing.
          </p>
        </div>
        <Button variant="ghost" size="sm" disabled={loggingOut} onClick={logout}>
          {loggingOut ? "…" : "Log out"}
        </Button>
      </div>

      <div className="space-y-1">
        <Label>Gender</Label>
        <GenderSelect
          value={gender}
          onChange={(v) => {
            setGender(v);
            clear("gender");
          }}
        />
        {errors.gender && <p className="text-destructive text-xs">{errors.gender}</p>}
      </div>

      <div className="space-y-1">
        <Label>Sexual preference</Label>
        <SexualPrefSelect value={pref} onChange={setPref} />
      </div>

      <div className="space-y-1">
        <Label>Birthdate</Label>
        <BirthdateField
          value={birthdate}
          onChange={(v) => {
            setBirthdate(v);
            clear("birthdate");
          }}
        />
        {errors.birthdate && <p className="text-destructive text-xs">{errors.birthdate}</p>}
      </div>

      <div className="space-y-1">
        <Label>Biography</Label>
        <BioField
          value={bio}
          onChange={(v) => {
            setBio(v);
            clear("biography");
          }}
        />
        {errors.biography && <p className="text-destructive text-xs">{errors.biography}</p>}
      </div>

      <div className="space-y-1">
        <Label>Interests</Label>
        <TagPicker
          value={tags}
          onChange={(v) => {
            setTags(v);
            clear("tags");
          }}
        />
        {errors.tags && <p className="text-destructive text-xs">{errors.tags}</p>}
      </div>

      <div className="space-y-1">
        <Label>Location</Label>
        <LocationField
          value={location}
          onChange={(v) => {
            setLocation(v);
            clear("location");
          }}
        />
        {errors.location && <p className="text-destructive text-xs">{errors.location}</p>}
      </div>

      <div className="space-y-1">
        <Label>Photos</Label>
        <PhotoManager
          pictures={pictures}
          onChange={(p) => {
            setProfile(p);
            clear("photos");
          }}
        />
        {errors.photos && <p className="text-destructive text-xs">{errors.photos}</p>}
      </div>

      <Button onClick={finish} disabled={saving || !canFinish}>
        {saving ? "Saving…" : "Finish"}
      </Button>
    </div>
  );
}
