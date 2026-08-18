import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <>
      <Button variant="outline" onClick={() => navigate(WebRoutes.Visits)}>
        Who see my profile?
      </Button>
      <Button variant="outline" onClick={() => navigate(WebRoutes.Likes)}>
        Who like my profile?
      </Button>
      <Button variant="outline" onClick={() => navigate(WebRoutes.Blocked)}>
        Blocked users
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (o) reset();
          setOpen(o);
        }}
      >
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>First name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Last name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Gender</Label>
            <GenderSelect value={gender} onChange={setGender} />
          </div>

          <div className="space-y-1">
            <Label>Sexual preference</Label>
            <SexualPrefSelect value={pref} onChange={setPref} />
          </div>

          <div className="space-y-1">
            <Label>Birthdate</Label>
            <BirthdateField value={birthdate} onChange={setBirthdate} />
          </div>

          <div className="space-y-1">
            <Label>Biography</Label>
            <BioField value={bio} onChange={setBio} />
          </div>

          <div className="space-y-1">
            <Label>Interests</Label>
            <TagPicker value={tags} onChange={setTags} />
          </div>

          <div className="space-y-1">
            <Label>Location</Label>
            <LocationField value={location} onChange={setLocation} />
          </div>

          <div className="space-y-1">
            <Label>Photos</Label>
            <PhotoManager pictures={profile.pictures} onChange={onChange} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
