import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Upload, ExternalLink } from "lucide-react";
import {
    NATIONAL_ID_TYPES,
    type NationalIdRecord,
    type NationalIdType,
    labelForNationalIdType,
    nationalIdRequiresBack,
    uploadNationalId,
    saveNationalIdToProfile,
    validateIdImage,
} from "@/lib/nationalIdService";

interface PatientIdentificationProps {
    uid: string;
    nationalId: NationalIdRecord | null;
    /** Called after a successful save with the freshly saved record so the parent can update state. */
    onSaved: (record: NationalIdRecord) => void;
}

const StatusBadge = ({ status }: { status: string | null }) => {
    if (status === "verified") {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} /> Verified
            </span>
        );
    }
    if (status === "rejected") {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2} /> Rejected
            </span>
        );
    }
    if (status === "pending") {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full">
                <ShieldQuestion className="w-3.5 h-3.5" strokeWidth={2} /> Pending review
            </span>
        );
    }
    return null;
};

export const PatientIdentification = ({ uid, nationalId, onSaved }: PatientIdentificationProps) => {
    const hasSaved = !!nationalId?.national_id_front_url;
    const [editing, setEditing] = useState(false);
    const [idType, setIdType] = useState<NationalIdType>(
        (nationalId?.national_id_type as NationalIdType) || "ghana_card"
    );
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const requiresBack = nationalIdRequiresBack(idType);

    const handleFile = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setter(null);
            return;
        }
        const err = validateIdImage(file);
        if (err) {
            toast.error(err);
            e.target.value = "";
            return;
        }
        setter(file);
    };

    const resetForm = () => {
        setEditing(false);
        setFrontFile(null);
        setBackFile(null);
        setIdType((nationalId?.national_id_type as NationalIdType) || "ghana_card");
    };

    const handleSave = async () => {
        if (!frontFile) {
            toast.error("Please upload the front of your ID.");
            return;
        }
        if (requiresBack && !backFile) {
            toast.error("Please upload the back of your Ghana Card.");
            return;
        }
        setSaving(true);
        try {
            const { national_id_front_url, national_id_back_url } = await uploadNationalId({
                uid,
                type: idType,
                frontFile,
                backFile,
            });
            await saveNationalIdToProfile(uid, {
                national_id_type: idType,
                national_id_front_url,
                national_id_back_url,
            });
            onSaved({
                national_id_type: idType,
                national_id_front_url,
                national_id_back_url,
                national_id_status: "pending",
                national_id_verified_by: null,
                national_id_verified_at: null,
                national_id_updated_at: new Date().toISOString(),
            });
            toast.success("ID saved. It will be reviewed before your next home visit.");
            resetForm();
        } catch (err) {
            console.error("Error saving national ID:", err);
            toast.error("We couldn't save your ID. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                    <h2 className="text-lg font-medium tracking-tight text-slate-900 dark:text-white">
                        Identification
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Used to verify home visits. Uploaded once, reused for every visit.
                    </p>
                </div>
                {hasSaved && !editing && <StatusBadge status={nationalId?.national_id_status || null} />}
            </div>

            {/* Saved ID view */}
            {hasSaved && !editing && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ID type</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                            {labelForNationalIdType(nationalId?.national_id_type)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {nationalId?.national_id_front_url && (
                            <a
                                href={nationalId.national_id_front_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"
                            >
                                <img
                                    src={nationalId.national_id_front_url}
                                    alt="ID front"
                                    className="w-full h-28 object-cover"
                                />
                                <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                                    Front
                                </span>
                            </a>
                        )}
                        {nationalId?.national_id_back_url && (
                            <a
                                href={nationalId.national_id_back_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"
                            >
                                <img
                                    src={nationalId.national_id_back_url}
                                    alt="ID back"
                                    className="w-full h-28 object-cover"
                                />
                                <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                                    Back
                                </span>
                            </a>
                        )}
                    </div>
                    {nationalId?.national_id_status === "rejected" && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            Your ID was rejected. Please upload a clearer image.
                        </p>
                    )}
                    <button
                        onClick={() => setEditing(true)}
                        className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                    >
                        <Upload className="w-4 h-4" strokeWidth={1.5} />
                        Replace ID
                    </button>
                </div>
            )}

            {/* Upload / replace form */}
            {(!hasSaved || editing) && (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            ID type
                        </label>
                        <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value as NationalIdType)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            {NATIONAL_ID_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {requiresBack ? "Front of card" : "ID image"}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFile(setFrontFile)}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white dark:file:bg-slate-100 dark:file:text-slate-900 hover:file:opacity-90 file:cursor-pointer cursor-pointer"
                        />
                    </div>

                    {requiresBack && (
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Back of card
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFile(setBackFile)}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white dark:file:bg-slate-100 dark:file:text-slate-900 hover:file:opacity-90 file:cursor-pointer cursor-pointer"
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-60 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                            {saving ? "Saving..." : "Save ID"}
                        </button>
                        {hasSaved && (
                            <button
                                onClick={resetForm}
                                disabled={saving}
                                className="px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
