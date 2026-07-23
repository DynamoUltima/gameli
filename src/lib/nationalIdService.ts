import { supabase } from "@/integrations/supabase/client";

/**
 * National ID verification for home visits.
 *
 * The ID is stored once on the patient's profile (the `users` collection,
 * exposed as `profiles` via the shim) and reused for every future home visit,
 * so patients don't re-upload it each time they book.
 *
 * Ghana Card requires a front AND back image; Voter's ID and Driving License
 * take a single image (stored as the "front").
 */

export type NationalIdType = "ghana_card" | "voter_id" | "drivers_license";
export type NationalIdStatus = "pending" | "verified" | "rejected";

export interface NationalIdTypeOption {
  value: NationalIdType;
  label: string;
  /** Ghana Card needs a separate back image; others don't. */
  requiresBack: boolean;
}

export const NATIONAL_ID_TYPES: NationalIdTypeOption[] = [
  { value: "ghana_card", label: "Ghana Card", requiresBack: true },
  { value: "voter_id", label: "Voter's ID", requiresBack: false },
  { value: "drivers_license", label: "Driving License", requiresBack: false },
];

const STORAGE_BUCKET = "hms";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export interface NationalIdRecord {
  national_id_type: NationalIdType | null;
  national_id_front_url: string | null;
  national_id_back_url: string | null;
  national_id_status: NationalIdStatus | null;
  national_id_verified_by: string | null;
  national_id_verified_at: string | null;
  national_id_updated_at: string | null;
}

export const labelForNationalIdType = (type?: string | null): string =>
  NATIONAL_ID_TYPES.find((t) => t.value === type)?.label || "National ID";

export const nationalIdRequiresBack = (type?: string | null): boolean =>
  !!NATIONAL_ID_TYPES.find((t) => t.value === type)?.requiresBack;

/**
 * Validate an image file chosen for an ID upload.
 * Returns an error message string, or null if the file is acceptable.
 */
export const validateIdImage = (file: File): string | null => {
  if (!file.type.startsWith("image/")) {
    return "Please upload an image (JPG or PNG).";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "The image must be under 5MB.";
  }
  return null;
};

const uploadOne = async (uid: string, side: "front" | "back", file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `national-ids/${uid || "anon"}-${side}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);
  if (uploadError) throw uploadError;
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return publicUrl;
};

export interface UploadNationalIdArgs {
  uid: string;
  type: NationalIdType;
  frontFile: File;
  /** Required only when the type requires a back image (Ghana Card). */
  backFile?: File | null;
}

/**
 * Upload the ID image(s) to storage and return their public URLs.
 * Does not persist anything to the profile — call {@link saveNationalIdToProfile} for that.
 */
export const uploadNationalId = async ({
  uid,
  type,
  frontFile,
  backFile,
}: UploadNationalIdArgs): Promise<{
  national_id_front_url: string;
  national_id_back_url: string | null;
}> => {
  const front_url = await uploadOne(uid, "front", frontFile);
  let back_url: string | null = null;
  if (nationalIdRequiresBack(type)) {
    if (!backFile) throw new Error("The back of the Ghana Card is required.");
    back_url = await uploadOne(uid, "back", backFile);
  }
  return { national_id_front_url: front_url, national_id_back_url: back_url };
};

/**
 * Persist the uploaded ID onto the patient's profile. Resets verification to
 * "pending" since a new/replaced ID must be re-verified by an admin.
 */
export const saveNationalIdToProfile = async (
  uid: string,
  fields: {
    national_id_type: NationalIdType;
    national_id_front_url: string;
    national_id_back_url: string | null;
  }
): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update({
      national_id_type: fields.national_id_type,
      national_id_front_url: fields.national_id_front_url,
      national_id_back_url: fields.national_id_back_url,
      national_id_status: "pending",
      national_id_verified_by: null,
      national_id_verified_at: null,
      national_id_updated_at: new Date().toISOString(),
    })
    .eq("id", uid);
  if (error) throw error;
};

/** Read the ID fields back from a patient's profile (for prefill / display). */
export const fetchNationalId = async (uid: string): Promise<NationalIdRecord | null> => {
  const { data } = await supabase
    .from("profiles")
    .select(
      "national_id_type, national_id_front_url, national_id_back_url, national_id_status, national_id_verified_by, national_id_verified_at, national_id_updated_at"
    )
    .eq("id", uid)
    .maybeSingle();
  if (!data) return null;
  const row = data as Partial<NationalIdRecord>;
  return {
    national_id_type: row.national_id_type ?? null,
    national_id_front_url: row.national_id_front_url ?? null,
    national_id_back_url: row.national_id_back_url ?? null,
    national_id_status: row.national_id_status ?? null,
    national_id_verified_by: row.national_id_verified_by ?? null,
    national_id_verified_at: row.national_id_verified_at ?? null,
    national_id_updated_at: row.national_id_updated_at ?? null,
  };
};

/**
 * Admin action: set the verification status on a patient's profile.
 * Records who verified and when (cleared when reset to pending).
 */
export const updateNationalIdStatus = async (
  patientId: string,
  status: NationalIdStatus,
  verifiedBy: string
): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update({
      national_id_status: status,
      national_id_verified_by: status === "pending" ? null : verifiedBy,
      national_id_verified_at: status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", patientId);
  if (error) throw error;
};
