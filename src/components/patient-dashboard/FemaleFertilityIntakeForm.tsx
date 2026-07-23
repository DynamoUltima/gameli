import React from 'react';
import { Building2, Info, Loader2, ArrowLeft, Check } from 'lucide-react';

interface Props {
  formId: string;
  formType: string;
  onBack: () => void;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
}

const slug = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');

const ToggleQuestion: React.FC<{ name: string; text: string; options?: string[] }> = ({
  name,
  text,
  options = ['Yes', 'No'],
}) => (
  <div className="py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 last:border-0">
    <label className="text-sm font-medium text-slate-700 max-w-[16rem] sm:max-w-lg leading-relaxed">{text}</label>
    <div className="flex bg-slate-100/70 p-1 rounded-xl shrink-0 w-fit">
      {options.map((opt, i) => {
        const val = slug(opt).toLowerCase();
        return (
          <label key={i} className="cursor-pointer">
            <input type="radio" name={name} value={val} className="peer sr-only" />
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all whitespace-nowrap">
              {opt}
            </div>
          </label>
        );
      })}
    </div>
  </div>
);

const SystemToggle: React.FC<{ name: string; question: string }> = ({ name, question }) => (
  <div className="py-3 border-b border-slate-50">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
      <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">{question}</label>
      <div className="flex bg-slate-100/70 p-1 rounded-xl shrink-0 w-fit">
        <label className="cursor-pointer">
          <input type="radio" name={name} value="yes" className="peer sr-only" />
          <div className="px-3 py-1.5 text-[13px] font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">Yes</div>
        </label>
        <label className="cursor-pointer">
          <input type="radio" name={name} value="no" className="peer sr-only" />
          <div className="px-3 py-1.5 text-[13px] font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">No</div>
        </label>
      </div>
    </div>
    <input type="text" name={`${name}_details`} placeholder="If yes, specify..." className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all" />
  </div>
);

const RadioRow: React.FC<{ name: string; label: string; options: string[] }> = ({ name, label, options }) => (
  <div className="py-3 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:border-0">
    <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">{label}</label>
    <div className="flex flex-wrap bg-slate-100/70 p-1 rounded-xl w-fit">
      {options.map((opt, i) => {
        const val = slug(opt).toLowerCase();
        return (
          <label key={i} className="cursor-pointer">
            <input type="radio" name={name} value={val} className="peer sr-only" />
            <div className="px-3 py-1.5 text-[13px] font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all whitespace-nowrap">{opt}</div>
          </label>
        );
      })}
    </div>
  </div>
);

const CheckboxGrid: React.FC<{ prefix: string; options: string[]; cols?: string }> = ({ prefix, options, cols = 'sm:grid-cols-2 md:grid-cols-3' }) => (
  <div className={`grid grid-cols-1 ${cols} gap-3`}>
    {options.map((opt) => (
      <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 group">
        <div className="relative flex items-center justify-center shrink-0">
          <input type="checkbox" name={`${prefix}_${slug(opt)}`} className="peer sr-only" />
          <div className="w-5 h-5 border border-slate-300 rounded-md peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors"></div>
          <Check className="w-3.5 h-3.5 absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
        </div>
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors tracking-tight">{opt}</span>
      </label>
    ))}
  </div>
);

const TextField: React.FC<{ name: string; label: string; type?: string; full?: boolean; placeholder?: string }> = ({ name, label, type = 'text', full, placeholder }) => (
  <div className={`space-y-2 text-sm ${full ? 'sm:col-span-2' : ''}`}>
    <label className="font-medium text-slate-700 block tracking-tight">{label}</label>
    <input type={type} name={name} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
  </div>
);

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
    <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-2">{title}</h2>
    {subtitle
      ? <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-100">{subtitle}</p>
      : <div className="mb-6 pb-4 border-b border-slate-100" />}
    {children}
  </div>
);

// ---- Checkbox group option lists (consolidated into comma-joined fields on submit) ----
const CONTRACEPTION = ['Birth control Pill', 'IUD', 'Depo (injections)', 'Condoms', 'Diaphragm', 'Foam Tablets', 'Withdrawal', 'Rhythm method', 'Tubal ligation', 'Norplant'];
const STI_OPTIONS = ['Gonorrhea', 'Veneral Warts', 'Syphilis', 'Chlamydia', 'Genital Herpes', 'Pelvic Inflammatory Disease (PID)'];
const MEDHX = ['Anemia', 'Diabetes', 'Ovarian cysts', 'Appendicitis', 'Gallbladder Problems', 'Arthritis', 'Heart Disease', 'Blood Transfusions', 'Hepatitis', 'Breast discharge-white', 'Breast pain', 'Excess facial hair', 'High Blood pressure', 'Seizures', 'Cancer', 'Kidney infections', 'Thyroid Problems', 'Liver Problems', 'Tuberculosis (TB)', 'Chronic Headaches', 'Migraine Headaches', 'Ulcers', 'Vision Problems'];
const REGULATE_MEDS = ['Birth control pills', 'Povera'];
const OV_MEDS = ['Clomiphene citrate (CLOMID)', 'Glucophage (Metformin)', 'Gonadotropins (FSH)'];
const DISEASES = ['Birth Defects', 'Brain/ Spinal Defects', 'Cancer', 'Diabetes', 'Heart Disease', 'High Blood Pressure', 'Sickle Cell Disease', 'Thyroid Disease'];

const FERTILITY_TESTS: { key: string; label: string }[] = [
  { key: 'bbt', label: 'Basal Body Temperature' },
  { key: 'lh', label: 'Urinary LH (Ovulation) Predictor kits' },
  { key: 'hormone', label: 'Hormone Tests' },
  { key: 'endometrial', label: 'Endometrial Biopsy' },
  { key: 'hsg', label: 'Hysterosalpingogram (HSG)' },
  { key: 'ultrasound', label: 'Ultrasound' },
  { key: 'laparoscopy', label: 'Laparoscopy' },
  { key: 'gc', label: 'Gonorrhea / Chlamydia Cultures' },
  { key: 'hepatitis', label: 'Hepatitis B or C' },
  { key: 'hiv', label: 'HIV' },
  { key: 'syphilis', label: 'Syphilis' },
];

const THERAPIES = [
  'Clomiphene citrate (Clomid)',
  'Gonadotropins (Pergonal, Gonal-F, etc)',
  'HCG (Profasi, Pregnyl)',
  'GnRH Agonists (Lupron, Zoladex, etc)',
  'Progesterone',
  'Prednisone or Dexamethasone',
  'Bromcriptine (Parlodel, Dostinex)',
  'Artificial Insemination',
  'Donor Insemination',
  'In Vitro Fertilization / ICSI',
];

export const FemaleFertilityIntakeForm: React.FC<Props> = ({ onBack, onSubmit, isSubmitting }) => {
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, any>;

    const collect = (opts: string[], prefix: string, field: string) => {
      const selected = opts.filter((o) => fd.get(`${prefix}_${slug(o)}`));
      data[field] = selected.join(', ');
      opts.forEach((o) => { delete data[`${prefix}_${slug(o)}`]; });
    };

    collect(CONTRACEPTION, 'contra', 'gyn_contraception');
    collect(STI_OPTIONS, 'sti', 'gyn_sti_history');
    collect(MEDHX, 'medhx', 'medhx_conditions');
    collect(REGULATE_MEDS, 'regmed', 'gyn_regulate_meds');
    collect(OV_MEDS, 'ovmed', 'ov_medications');
    collect(DISEASES, 'disease', 'family_diseases');

    onSubmit(data);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-3 bg-blue-50 w-fit px-3 py-1.5 rounded-lg border border-blue-100">
          <Building2 className="w-4 h-4" />
          St. Gamaliel's Hospital
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-slate-900 mb-3">Female Fertility Questionnaire</h1>
        <p className="text-base font-normal text-slate-500 max-w-2xl leading-relaxed">
          Please attempt to answer all the questions below. For help in answering any questions, do speak with a nurse.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6 sm:space-y-8">
        {/* Personal Information */}
        <Card title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <TextField name="personal_name" label="Name" />
            <TextField name="personal_marital" label="Marital Status" />
            <TextField name="personal_dob" label="Date of Birth" type="date" />
            <TextField name="personal_phone" label="Phone Number" type="tel" />
            <TextField name="personal_address" label="Address" full />
            <TextField name="personal_email" label="E-mail" type="email" />
            <TextField name="personal_occupation" label="Occupation" />
            <TextField name="personal_education" label="Educational Level" full />
            <TextField name="partner_name" label="Partner's Name" />
            <TextField name="partner_dob" label="Partner's Date of Birth" type="date" />
            <div className="grid grid-cols-3 gap-3 sm:col-span-2">
              <TextField name="personal_height_feet" label="Height (feet)" />
              <TextField name="personal_height_inches" label="Height (inches)" />
              <TextField name="personal_height_meters" label="Height (meters)" />
            </div>
            <TextField name="personal_weight_kg" label="Weight (kg)" />
          </div>
          <div className="mt-2">
            <ToggleQuestion name="personal_trouble_pregnant" text="Are you having trouble getting pregnant?" />
          </div>
        </Card>

        {/* Section A: Gynecological History */}
        <Card title="Section A: Gynecological History">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-4">
            <TextField name="gyn_menarche_age" label="Age when your periods started" />
            <TextField name="gyn_lmp" label="Date of your last period" type="date" />
          </div>
          <div className="space-y-1">
            <ToggleQuestion name="gyn_cycles_regular" text="Are your menstrual cycles regular and predictable?" />
            <RadioRow name="gyn_cycle_frequency" label="If regular, how often do your cycles come?" options={['<27 days', '27-29 days', '30-32 days', '33-35 days', '>35 days']} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-slate-50">
              <TextField name="gyn_interval_longest" label="If not regular — longest interval (days)" />
              <TextField name="gyn_interval_shortest" label="If not regular — shortest interval (days)" />
            </div>
            <ToggleQuestion name="gyn_regulate_med" text="Ever taken medicine to regulate your menstrual cycle?" />
            <div className="py-3 border-b border-slate-50 space-y-3">
              <p className="text-sm font-medium text-slate-700">If yes, tick all medicines you were given:</p>
              <CheckboxGrid prefix="regmed" options={REGULATE_MEDS} cols="sm:grid-cols-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField name="gyn_regulate_med_other" label="Other (name if you remember)" />
                <TextField name="gyn_regulate_med_last" label="When was the last time?" />
              </div>
            </div>
            <ToggleQuestion name="gyn_cramps" text="Do you have cramps with your periods?" />
            <RadioRow name="gyn_cramps_severity" label="If yes, how severe are they?" options={['Mild', 'Moderate', 'Severe']} />
            <ToggleQuestion name="gyn_missed_work" text="Ever missed work or school due to menstrual pains?" />
            <ToggleQuestion name="gyn_pain_intercourse" text="Do you have pain with intercourse?" />
            <ToggleQuestion name="gyn_endometriosis" text="Were you ever diagnosed with endometriosis?" options={['Yes', 'No', "I don't know"]} />
          </div>

          <div className="py-4 space-y-3 border-b border-slate-50">
            <p className="text-sm font-medium text-slate-700">What type of contraception have you used in the past? (tick all that apply)</p>
            <CheckboxGrid prefix="contra" options={CONTRACEPTION} />
          </div>
          <div className="space-y-1">
            <ToggleQuestion name="gyn_contraception_complications" text="Have you had any contraceptive complications?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-slate-50">
              <TextField name="gyn_contraception_last" label="When did you last use contraception?" />
              <TextField name="gyn_pap_smear_last" label="When was your last Pap smear?" />
            </div>
            <ToggleQuestion name="gyn_pap_smear" text="Have you ever had a Pap smear?" />
          </div>
          <div className="py-4 space-y-3 border-b border-slate-50">
            <p className="text-sm font-medium text-slate-700">Have you ever had any of the following? (tick all that apply)</p>
            <CheckboxGrid prefix="sti" options={STI_OPTIONS} />
          </div>
          <div className="space-y-1">
            <ToggleQuestion name="gyn_abnormal_mammogram" text="Have you ever had an abnormal mammogram?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
              <TextField name="gyn_mammogram_when" label="If so, when?" />
              <TextField name="gyn_mammogram_action" label="What was done about it?" />
              <TextField name="gyn_mammogram_last" label="When was your last mammogram?" full />
            </div>
          </div>
        </Card>

        {/* Section B: Medical History */}
        <Card title="Section B: Medical History" subtitle="Do you have or have you ever had any of the following? (tick all that apply)">
          <CheckboxGrid prefix="medhx" options={MEDHX} />
          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block tracking-tight">What current medications are you taking? (please include herbal medications)</label>
              <textarea name="medhx_medications" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 transition-all text-sm text-slate-900 resize-none"></textarea>
            </div>
            <ToggleQuestion name="medhx_allergic" text="Are you allergic to any medications?" />
            <TextField name="medhx_allergic_name" label="If yes, name them" full />
            <ToggleQuestion name="medhx_surgery" text="Have you had surgery before?" />
            <TextField name="medhx_surgery_detail" label="If yes, date / type" full />
          </div>
        </Card>

        {/* Section C: Pregnancy History */}
        <Card title="Section C: Pregnancy History">
          <div className="mb-4">
            <TextField name="preg_count" label="How many pregnancies (including abortions and miscarriages) have you had?" full />
          </div>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-sm text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <th className="px-3 py-3 border-b border-slate-200">Pregnancy</th>
                  <th className="px-3 py-3 border-b border-slate-200">Year</th>
                  <th className="px-3 py-3 border-b border-slate-200">Months to conceive</th>
                  <th className="px-3 py-3 border-b border-slate-200">Therapy used?</th>
                  <th className="px-3 py-3 border-b border-slate-200">Current partner father?</th>
                  <th className="px-3 py-3 border-b border-slate-200">Duration (mo)</th>
                  <th className="px-3 py-3 border-b border-slate-200">Outcome*</th>
                  <th className="px-3 py-3 border-b border-slate-200">Complications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((n) => (
                  <tr key={n}>
                    <td className="px-3 py-3 font-medium text-slate-700">{n}{n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}</td>
                    <td className="px-3 py-3"><input type="text" name={`preg_${n}_year`} className="w-16 bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" placeholder="YYYY" /></td>
                    <td className="px-3 py-3"><input type="text" name={`preg_${n}_conceive`} className="w-16 bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
                    <td className="px-3 py-3">
                      <select name={`preg_${n}_therapy`} className="bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900">
                        <option value="">-</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select name={`preg_${n}_father`} className="bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900">
                        <option value="">-</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                    <td className="px-3 py-3"><input type="text" name={`preg_${n}_duration`} className="w-16 bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
                    <td className="px-3 py-3">
                      <select name={`preg_${n}_outcome`} className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-900">
                        <option value="">-</option>
                        <option value="VD">Vaginal (VD)</option>
                        <option value="CS">C-Section (CS)</option>
                        <option value="AB">Abortion (AB)</option>
                        <option value="MS">Miscarriage (MS)</option>
                        <option value="EP">Ectopic (EP)</option>
                      </select>
                    </td>
                    <td className="px-3 py-3"><input type="text" name={`preg_${n}_complications`} className="w-28 bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" placeholder="None" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
              *Outcomes: Vaginal Delivery=VD; Cesarean section=CS; Abortion=AB; Miscarriage=MS; Ectopic=EP
            </div>
          </div>
        </Card>

        {/* Section D: Fertility History */}
        <Card title="Section D: Fertility History">
          <div className="space-y-1 mb-6">
            <TextField name="fert_trying_duration" label="How long have you and your present partner been trying to conceive?" full />
            <div className="pt-2">
              <ToggleQuestion name="fert_infertile_past" text="Have you ever been infertile with a past partner?" />
            </div>
          </div>

          <p className="text-sm font-medium text-slate-700 mb-3">Have you had any of the following tests performed? Enter date and result where applicable.</p>
          <div className="space-y-2 mb-6">
            {FERTILITY_TESTS.map((t) => (
              <div key={t.key} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3 items-center py-2 border-b border-slate-50">
                <span className="text-sm font-medium text-slate-700">{t.label}</span>
                <input type="text" name={`fert_${t.key}_date`} placeholder="Date" className="w-full sm:w-32 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
                <input type="text" name={`fert_${t.key}_result`} placeholder="Result" className="w-full sm:w-40 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
            <TextField name="fert_blood_group" label="What is your blood group?" />
          </div>
          <RadioRow name="fert_sickling" label="What is your sickling status?" options={['AA', 'AS', 'SS', 'SC', 'AC', 'CC', 'SF']} />

          <p className="text-sm font-medium text-slate-700 mt-6 mb-3">What type of fertility therapy have you received in the past?</p>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-sm text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <th className="px-3 py-3 border-b border-slate-200">Drug / Treatment</th>
                  <th className="px-3 py-3 border-b border-slate-200">Dose</th>
                  <th className="px-3 py-3 border-b border-slate-200">Duration / Cycles</th>
                  <th className="px-3 py-3 border-b border-slate-200">When?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {THERAPIES.map((name, i) => (
                  <tr key={i}>
                    <td className="px-3 py-3 font-medium text-slate-700 max-w-[200px]">{name}</td>
                    <td className="px-3 py-3"><input type="text" name={`therapy_${i}_dose`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
                    <td className="px-3 py-3"><input type="text" name={`therapy_${i}_duration`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
                    <td className="px-3 py-3"><input type="text" name={`therapy_${i}_when`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Section E: Ovulatory Dysfunction History */}
        <Card title="Section E: Ovulatory Dysfunction History">
          <div className="space-y-1">
            <ToggleQuestion name="ov_pcos" text="Has anyone told you that you have polycystic ovarian syndrome (PCOS)?" />
            <ToggleQuestion name="ov_ovulation_problem" text="Has a doctor ever told you that you have a problem with ovulating?" />
            <ToggleQuestion name="ov_diabetes" text="Do you have diabetes?" options={['Yes', 'No', "Don't know"]} />
            <ToggleQuestion name="ov_insulin_resistance" text="Do you have insulin resistance?" options={['Yes', 'No', "Don't know"]} />
            <ToggleQuestion name="ov_medication" text="Have you ever taken any medication to help you get pregnant?" />
          </div>
          <div className="py-3 border-b border-slate-50 space-y-3">
            <p className="text-sm font-medium text-slate-700">If yes, tick the medicine(s) you were given:</p>
            <CheckboxGrid prefix="ovmed" options={OV_MEDS} cols="sm:grid-cols-3" />
            <TextField name="ov_medication_other" label="Other (please list)" full />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <TextField name="ov_cycles_per_year" label="Menstrual cycles per year when NOT on any medication" full />
          </div>
          <div className="space-y-1">
            <ToggleQuestion name="ov_excess_hair" text="Do you think you have more hair than most women on some areas of your body?" />
            <ToggleQuestion name="ov_removed_hair" text="Have you ever removed hair from one of these areas?" />
            <TextField name="ov_removed_hair_area" label="If yes, what area?" full />
            <ToggleQuestion name="ov_acne" text="As an adult, have you had acne?" />
            <ToggleQuestion name="ov_acne_now" text="If yes, do you have it now?" />
          </div>
        </Card>

        {/* Section F: Review of Systems */}
        <Card title="Section F: Review of Systems">
          <div className="space-y-1">
            <ToggleQuestion name="sys1" text="Have you had more than a 10 kilogram weight gain or loss in the past 12 months?" />
            <SystemToggle name="sys2" question="Do you have problems with your vision (besides usual glasses), hearing, swallowing, sinuses, or throat?" />
            <SystemToggle name="sys3" question="Do you have heart problems, chest pain, and irregular heartbeats?" />
            <SystemToggle name="sys4" question="Do you have asthma, wheezing, shortness of breath or trouble breathing?" />
            <SystemToggle name="sys5" question="Do you have breast pain, breast discharge, or a lump in your breast?" />
            <SystemToggle name="sys6" question="Do you have urinary burning, incontinence, kidney stones or blood in your urine?" />
            <SystemToggle name="sys7" question="Do you have chronic joint or muscle pain or swelling?" />
            <SystemToggle name="sys8" question="Do you have chronic skin rashes or moles that have changed in size and appearance?" />
            <SystemToggle name="sys9" question="Do you have changes in cold or hot tolerances, changes in skin tone or color, changes in your nails or body hair growth?" />
            <SystemToggle name="sys10" question="Do you have a history of seizures, recurrent headaches or numbness in your extremities?" />
            <SystemToggle name="sys11" question="Do you have any symptoms of depression such as sadness, frequent crying or anger, emotional lability?" />
          </div>
        </Card>

        {/* Section G: Social History */}
        <Card title="Section G: Social History">
          <div className="space-y-5">
            <TextField name="soc_employer" label="Current or Recent Employer / Position" full />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <ToggleQuestion name="soc_alc" text="Do you drink alcohol?" />
                <TextField name="soc_alc_qty" label="Number of drinks per week" />
              </div>
              <div className="space-y-3">
                <ToggleQuestion name="soc_smk" text="Do you smoke?" />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="soc_smk_qty" label="Cigarettes per day" />
                  <TextField name="soc_smk_yrs" label="Years smoking" />
                </div>
              </div>
              <div className="space-y-3">
                <ToggleQuestion name="soc_drg" text="Do you use illicit drugs (marijuana, cocaine, etc.)?" />
                <TextField name="soc_drg_type" label="If yes, specify type" />
              </div>
              <div className="space-y-3">
                <ToggleQuestion name="soc_exc" text="Do you have a special exercise program?" />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="soc_exc_type" label="Type" />
                  <TextField name="soc_exc_hrs" label="Hours per week" />
                </div>
              </div>
              <div className="space-y-3 md:col-span-2">
                <ToggleQuestion name="soc_diet" text="Are you on a special diet?" />
                <TextField name="soc_diet_type" label="Type of diet" full />
              </div>
            </div>
          </div>
        </Card>

        {/* Section H: Family History */}
        <Card title="Section H: Family History">
          <div className="mb-4">
            <ToggleQuestion name="fam_hist" text="Do any of your family members have significant health problems or inherited diseases?" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-3">Tick all that apply:</p>
          <CheckboxGrid prefix="disease" options={DISEASES} cols="sm:grid-cols-2 md:grid-cols-4" />
          <div className="mt-6">
            <TextField name="fam_who" label="Who? (please specify family member and condition)" full />
          </div>
        </Card>

        {/* Footer & Submit */}
        <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-1">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-medium text-slate-900 tracking-tight mb-1">Important Instructions</h4>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Please bring this form with you to your first appointment. Ensure that all medical records and lab tests from current or past doctors are also brought for your appointment. We look forward to seeing you.
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 py-3.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 shrink-0 whitespace-nowrap disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Submitting...</>) : 'Submit Questionnaire'}
          </button>
        </div>
      </form>
    </div>
  );
};
