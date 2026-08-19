import { useEffect, useState, type ReactNode } from "react";
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
import {
  LocationField,
  type LocationValue,
} from "@web/component/fields/LocationField";
import { Button } from "@shadcn/ui/button";
import { Label } from "@shadcn/ui/label";
import { cn } from "@shadcn/lib/utils";

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
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const steps = [
    {
      title: "Add your photos",
      subtitle: "Show your best self — one becomes your profile picture.",
      valid: pictures.length > 0,
      content: <PhotoManager pictures={pictures} onChange={setProfile} />,
    },
    {
      title: "About you",
      subtitle: "The basics people will see on your profile.",
      valid: !!gender && !!birthdate && bio.trim() !== "",
      content: (
        <>
          <FieldRow label="Gender">
            <GenderSelect value={gender} onChange={setGender} />
          </FieldRow>
          <FieldRow label="Sexual preference">
            <SexualPrefSelect value={pref} onChange={setPref} />
          </FieldRow>
          <FieldRow label="Birthdate">
            <BirthdateField value={birthdate} onChange={setBirthdate} />
          </FieldRow>
          <FieldRow label="Biography">
            <BioField value={bio} onChange={setBio} />
          </FieldRow>
        </>
      ),
    },
    {
      title: "Your interests",
      subtitle: "Pick a few tags — they help us find better matches.",
      valid: tags.length > 0,
      content: <TagPicker value={tags} onChange={setTags} />,
    },
    {
      title: "Where are you?",
      subtitle: "Allow location or pick your city to see nearby people.",
      valid: location.latitude != null && location.longitude != null,
      content: <LocationField value={location} onChange={setLocation} />,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const allValid = steps.every((s) => s.valid);

  function next() {
    if (!current.valid) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0 });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0 });
  }

  function logout() {
    return loadingWrapper(setLoggingOut, () =>
      API.auth.logout().then(() => $user.set(null)),
    );
  }

  function finish() {
    if (!allValid) {
      toast.error("Please complete every step first.");
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">Matcha</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={loggingOut}
          onClick={logout}
        >
          {loggingOut ? "…" : "Log out"}
        </Button>
      </div>

      <div className="mt-4 flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Step {step + 1} of {steps.length}
      </p>

      <div className="flex flex-1 flex-col mt-5 py-6">
        <div>
          <h1 className="text-2xl font-semibold">{current.title}</h1>
          <p className="text-muted-foreground text-sm">{current.subtitle}</p>
        </div>
        <div className="mt-5 space-y-4">{current.content}</div>
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={back}>
            Back
          </Button>
        )}
        {isLast ? (
          <Button
            className="flex-1"
            disabled={saving || !allValid}
            onClick={finish}
          >
            {saving ? "Saving…" : "Finish"}
          </Button>
        ) : (
          <Button className="flex-1" disabled={!current.valid} onClick={next}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
