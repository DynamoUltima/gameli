import { ClipboardList, CheckCircle2, ArrowRight } from "lucide-react";

export interface MedicalForm {
    id: string;
    form_type?: string;
    status?: string;
    data?: Record<string, any>;
    created_at?: string;
    submitted_at?: string;
}

interface PatientQuestionnairesProps {
    forms: MedicalForm[];
    onOpenForm: (formId: string, formType: string) => void;
}

const formLabel = (formType?: string) =>
    formType === "male_fertility" ? "Male Fertility Questionnaire" :
    formType === "female_fertility" ? "Female Fertility Questionnaire" :
    formType === "couple_fertility" ? "Couple Fertility Questionnaire" :
    "Medical Questionnaire";

const formatFormDate = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export const PatientQuestionnaires = ({ forms, onOpenForm }: PatientQuestionnairesProps) => {
    // Nothing to show for patients with no questionnaires assigned.
    if (!forms || forms.length === 0) return null;

    const pending = forms.filter((f) => f.status === "pending");
    const completed = forms.filter((f) => f.status !== "pending");

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                    <h2 className="text-lg font-medium tracking-tight text-slate-900 dark:text-white">
                        Medical Questionnaires
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Complete these before your fertility consultation.
                    </p>
                </div>
                {pending.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full shrink-0">
                        {pending.length} to complete
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {/* Pending — action needed */}
                {pending.map((form) => (
                    <button
                        key={form.id}
                        onClick={() => onOpenForm(form.id, form.form_type || "")}
                        className="w-full flex items-center gap-3 text-left rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 p-4 hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors group"
                    >
                        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <ClipboardList className="w-4.5 h-4.5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {formLabel(form.form_type)}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                                Action needed — tap to complete
                            </p>
                            {formatFormDate(form.created_at) && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    Requested {formatFormDate(form.created_at)}
                                </p>
                            )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                ))}

                {/* Completed — submitted */}
                {completed.map((form) => (
                    <div
                        key={form.id}
                        className="w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4"
                    >
                        <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {formLabel(form.form_type)}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-0.5">
                                Submitted{formatFormDate(form.submitted_at || form.created_at) ? ` ${formatFormDate(form.submitted_at || form.created_at)}` : ""}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
