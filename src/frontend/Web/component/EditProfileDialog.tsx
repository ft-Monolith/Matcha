import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye, Heart, Ban } from "lucide-react";
import { toast } from "sonner";
import type { Gender, MyProfileDTO, SexualPref } from "@common/dto/profile.dto";
import { API } from "@web/API/api";
import { WebRoutes } from "@web/routes";
import { loadingWrapper } from "@web/utils/loadingWrapper";
import { GenderSelect } from "@web/component/fields/GenderSelect";
import { SexualPrefSelect } from "@web/component/fields/SexualPrefSelect";
import { BirthdateField } from "@web/component/fields/BirthdateField";
import { BioField } from "@web/component/fields/BioField";
import { TagPicker } from "@web/component/fields/TagPicker";
import { PhotoManager } from "@web/component/fields/PhotoManager";
import { LocationField, type LocationValue } from "@web/component/fields/LocationField";
import { Button } from "@shadcn/ui/button";
import { Input } from "@shadcn/ui/input";
import { Label } from "@shadcn/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shadcn/ui/dialog";

interface EditProfileDialogProps {
  profile: MyProfileDTO;
  onChange: (profile: MyProfileDTO) => void;
}

function sameTags(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((t) => setB.has(t));
}

export function EditProfileDialog({
  profile,
  onChange,
}: EditProfileDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [gender, setGender] = useState<Gender | undefined>(
    profile.gender ?? undefined,
  );
  const [pref, setPref] = useState<SexualPref>(profile.sexualPref);
  const [bio, setBio] = useState(profile.biography ?? "");
  const [birthdate, setBirthdate] = useState<string | undefined>(
    profile.birthdate ?? undefined,
  );
  const [tags, setTags] = useState<string[]>(profile.tags.map((t) => t.name));
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [location, setLocation] = useState<LocationValue>({
    latitude: profile.latitude,
    longitude: profile.longitude,
    city: profile.city,
    consent: profile.locationConsent,
  });

  function reset() {
    setGender(profile.gender ?? undefined);
    setPref(profile.sexualPref);
    setBio(profile.biography ?? "");
    setBirthdate(profile.birthdate ?? undefined);
    setTags(profile.tags.map((t) => t.name));
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setEmail(profile.email);
    setLocation({
      latitude: profile.latitude,
      longitude: profile.longitude,
      city: profile.city,
      consent: profile.locationConsent,
    });
  }

  const profileDirty =
    gender !== (profile.gender ?? undefined) ||
    pref !== profile.sexualPref ||
    bio !== (profile.biography ?? "") ||
    birthdate !== (profile.birthdate ?? undefined);
  const accountDirty =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    email !== profile.email;
  const tagsDirty = !sameTags(tags, profile.tags.map((t) => t.name));
  const locationDirty =
    location.latitude !== profile.latitude ||
    location.longitude !== profile.longitude ||
    location.city !== profile.city ||
    location.consent !== profile.locationConsent;
  const dirty = profileDirty || accountDirty || tagsDirty || locationDirty;

  function save() {
    if (!dirty) return;
    return loadingWrapper(setSaving, async () => {
      let latest: MyProfileDTO | null = null;

      if (profileDirty) {
        const r = await API.profile.updateProfile({ gender, sexualPref: pref, biography: bio, birthdate });
        if (r.error) return toast.error(String(r.data));
        latest = r.data;
      }
      if (accountDirty) {
        const r = await API.profile.updateAccount({ firstName, lastName, email });
        if (r.error) return toast.error(String(r.data));
        latest = r.data;
      }
      if (tagsDirty) {
        const r = await API.profile.setTags({ tags });
        if (r.error) return toast.error(String(r.data));
        latest = r.data;
      }
      if (locationDirty) {
        const r = await API.profile.updateLocation({
          latitude: location.latitude ?? undefined,
          longitude: location.longitude ?? undefined,
          city: location.city ?? undefined,
          consent: location.consent,
        });
        if (r.error) return toast.error(String(r.data));
        latest = r.data;
      }

      if (latest) onChange(latest);
      toast.success("Profile updated");
      setOpen(false);
    });
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (o) reset();
          setOpen(o);
        }}
      >
      <DialogTrigger asChild>
        <Button className="h-11 w-full rounded-xl text-base font-semibold shadow-sm">
          <Pencil className="size-4" />
          Edit profile
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-6 py-5">
          <Section title="Photos">
            <PhotoManager pictures={profile.pictures} onChange={onChange} />
          </Section>

          <Section title="About you">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender">
                <GenderSelect value={gender} onChange={setGender} />
              </Field>
              <Field label="Sexual preference">
                <SexualPrefSelect value={pref} onChange={setPref} />
              </Field>
            </div>
            <Field label="Birthdate">
              <BirthdateField value={birthdate} onChange={setBirthdate} />
            </Field>
            <Field label="Biography">
              <BioField value={bio} onChange={setBio} />
            </Field>
            <Field label="Interests">
              <TagPicker value={tags} onChange={setTags} />
            </Field>
          </Section>

          <Section title="Account">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </Section>

          <Section title="Location">
            <LocationField value={location} onChange={setLocation} />
          </Section>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-2">
        <NavTile icon={Eye} label="Views" onClick={() => navigate(WebRoutes.Visits)} />
        <NavTile icon={Heart} label="Likes" onClick={() => navigate(WebRoutes.Likes)} />
        <NavTile icon={Ban} label="Blocked" onClick={() => navigate(WebRoutes.Blocked)} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NavTile({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-auto flex-col gap-1.5 rounded-xl py-3"
    >
      <Icon className="text-muted-foreground size-5" />
      <span className="text-xs font-normal">{label}</span>
    </Button>
  );
}
