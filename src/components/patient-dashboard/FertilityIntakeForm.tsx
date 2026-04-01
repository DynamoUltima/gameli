import React, { useState } from 'react';
import { Building2, Info, Loader2, Send, ArrowLeft, Check } from 'lucide-react';

interface FertilityIntakeFormProps {
  formId: string;
  formType: string;
  onBack: () => void;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
}

const ToggleQuestion: React.FC<{ name: string; text: string; options?: string[] }> = ({ 
  name, 
  text, 
  options = ['Yes', 'No', "Don't know"] 
}) => (
  <div className="py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 last:border-0">
    <label className="text-sm font-medium text-slate-700 max-w-[16rem] sm:max-w-lg leading-relaxed">{text}</label>
    <div className="flex bg-slate-100/70 p-1 rounded-xl shrink-0 w-fit">
      {options.map((opt, i) => {
        const val = opt.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          <label key={i} className="cursor-pointer">
            <input type="radio" name={name} value={val} className="peer sr-only form-toggle-radio" />
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
          <input type="radio" name={name} value="yes" className="peer sr-only form-toggle-radio" />
          <div className="px-3 py-1.5 text-[13px] font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">Yes</div>
        </label>
        <label className="cursor-pointer">
          <input type="radio" name={name} value="no" className="peer sr-only form-toggle-radio" />
          <div className="px-3 py-1.5 text-[13px] font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">No</div>
        </label>
      </div>
    </div>
    <input type="text" name={`${name}_details`} placeholder="If yes, specify..." className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all" />
  </div>
);

const RadioGroup: React.FC<{ name: string; options: string[] }> = ({ name, options }) => (
  <div className="flex bg-slate-100/70 p-1 rounded-xl shrink-0 w-fit">
    {options.map((opt, i) => {
       const val = opt.toLowerCase().replace(/[^a-z0-9]/g, '');
       return (
        <label key={i} className="cursor-pointer">
          <input type="radio" name={name} value={val} className="peer sr-only form-toggle-radio" />
          <div className="px-3 py-1 text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm">{opt}</div>
        </label>
       )
    })}
  </div>
);

const SectionSubtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-100">{children}</p>
);

const PregnancyTable: React.FC = () => (
  <div className="overflow-x-auto -mx-6 sm:mx-0">
    <table className="w-full text-sm text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
          <th className="px-4 py-3 border-b border-slate-200 min-w-[100px]">Pregnancy</th>
          <th className="px-4 py-3 border-b border-slate-200 min-w-[80px]">Year</th>
          <th className="px-4 py-3 border-b border-slate-200 min-w-[100px]">Duration (mo)</th>
          <th className="px-4 py-3 border-b border-slate-200 min-w-[80px]">Father (Current?)</th>
          <th className="px-4 py-3 border-b border-slate-200 min-w-[100px]">Outcome*</th>
          <th className="px-4 py-3 border-b border-slate-200 min-w-[120px]">Complications</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((num) => (
          <tr key={num} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 font-medium text-slate-700">{num}{num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'}</td>
            <td className="px-4 py-3"><input type="text" name={`preg_${num}_year`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" placeholder="YYYY" /></td>
            <td className="px-4 py-3"><input type="text" name={`preg_${num}_duration`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" placeholder="Months" /></td>
            <td className="px-4 py-3">
              <select name={`preg_${num}_father`} className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full text-slate-900">
                <option value="">-</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </td>
            <td className="px-4 py-3">
              <select name={`preg_${num}_outcome`} className="bg-transparent border-none p-0 focus:ring-0 text-sm w-full font-medium text-slate-900">
                <option value="">Select...</option>
                <option value="VD">Vaginal (VD)</option>
                <option value="CS">C-Section (CS)</option>
                <option value="AB">Abortion (AB)</option>
                <option value="MS">Miscarriage (MS)</option>
                <option value="EP">Ectopic (EP)</option>
              </select>
            </td>
            <td className="px-4 py-3"><input type="text" name={`preg_${num}_complications`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" placeholder="None" /></td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
      *Outcomes: Vaginal Delivery=VD; Cesarean section=CS; Abortion=AB; Miscarriage=MS; Ectopic=EP
    </div>
  </div>
);

const FertilityTherapyTable: React.FC = () => {
  const therapies = [
    'Clomiphene citrate (Clomid)',
    'Gonadotropins (Pergonal, Gonal-F, etc)',
    'HCG (Profasi, Pregnyl)',
    'GnRH Agonists (Lupron, Zoladex, etc)',
    'Progesterone',
    'Prednisone or Dexamethasone',
    'Bromcriptine (Parlodel, Dostinex)',
    'Artificial Insemination',
    'Donor Insemination',
    'In Vitro Fertilization / ICSI'
  ];
  return (
    <div className="overflow-x-auto -mx-6 sm:mx-0 mt-4">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
            <th className="px-4 py-3 border-b border-slate-200">Drug/Treatment</th>
            <th className="px-4 py-3 border-b border-slate-200">Dose</th>
            <th className="px-4 py-3 border-b border-slate-200">Duration/Cycles</th>
            <th className="px-4 py-3 border-b border-slate-200">When?</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {therapies.map((name, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-700 max-w-[200px]">{name}</td>
              <td className="px-4 py-3"><input type="text" name={`therapy_${i}_dose`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
              <td className="px-4 py-3"><input type="text" name={`therapy_${i}_duration`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
              <td className="px-4 py-3"><input type="text" name={`therapy_${i}_when`} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-900" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const femaleMedicalHistoryFields = [
  'Anemia', 'Diabetes', 'Ovarian cysts', 'Appendicitis', 'Gallbladder Problems', 
  'Arthritis', 'Heart Disease', 'Blood Transfusions', 'Hepatitis', 
  'Breast discharge-white', 'Breast pain', 'Excess facial hair', 
  'High Blood Pressure', 'Seizures', 'Cancer', 'Kidney infections', 
  'Thyroid Problems', 'Liver Problems', 'Tuberculosis (TB)', 
  'Chronic Headaches', 'Migraine Headaches', 'Ulcers', 'Vision Problems'
];

const diseases = ['Birth Defects', 'Brain/ Spinal Defects', 'Cancer', 'Diabetes', 'Heart Disease', 'High Blood Pressure', 'Sickle Cell Disease', 'Thyroid Disease'];

export const FertilityIntakeForm: React.FC<FertilityIntakeFormProps> = ({
  formId,
  formType,
  onBack,
  onSubmit,
  isSubmitting
}) => {
  const title = formType === 'male_fertility' ? 'Male Fertility Questionnaire' : 
                formType === 'female_fertility' ? 'Female Fertility Questionnaire' : 
                'Couple Fertility Questionnaire';
                
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Checkboxes for diseases
    const selectedDiseases = diseases.filter(d => formData.get(`disease_${d.replace(/\s+/g, '')}`));
    data.family_diseases = selectedDiseases.join(', ');
    
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
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-slate-900 mb-3">
          {title}
        </h1>
        <p className="text-base font-normal text-slate-500 max-w-2xl leading-relaxed">
          Please attempt to answer all the questions below. For help in answering any questions, do speak with a nurse.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6 sm:space-y-8">
        
        {/* Section 1: Personal Info */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-6 pb-4 border-b border-slate-100">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">Name</label>
              <input type="text" name="personal_name" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
            </div>
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">Marital Status</label>
              <input type="text" name="personal_marital" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
            </div>
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">Date of Birth</label>
              <input type="date" name="personal_dob" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-slate-700" />
            </div>
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">Phone Number</label>
              <input type="tel" name="personal_phone" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
            </div>
            <div className="space-y-2 text-sm sm:col-span-2">
              <label className="font-medium text-slate-700 block tracking-tight">Address</label>
              <input type="text" name="personal_address" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
            </div>
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">E-mail</label>
              <input type="email" name="personal_email" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
            </div>
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">Educational Level</label>
              <div className="relative">
                <select name="personal_education" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all appearance-none text-slate-700">
                  <option value="" disabled defaultValue="">Select level...</option>
                  <option>High School</option>
                  <option>Bachelor's Degree</option>
                  <option>Master's Degree</option>
                  <option>Doctorate</option>
                  <option>Other</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  {/* Chevron Down Icon equivalent */}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">Occupation</label>
              <input type="text" name="personal_occupation" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
            </div>
            <div className="space-y-2 text-sm sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <label className="font-medium text-slate-700 block tracking-tight">Partner's Name</label>
                <input type="text" name="partner_name" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
              </div>
              <div className="space-y-2">
                <label className="font-medium text-slate-700 block tracking-tight">Partner's Date of Birth</label>
                <input type="date" name="partner_dob" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-slate-700" />
              </div>
            </div>
            <div className="space-y-3 text-sm sm:col-span-2 pt-4 border-t border-slate-50 mt-2">
              <label className="font-medium text-slate-700 block tracking-tight">Who referred you / how did you hear about us?</label>
              <div className="flex flex-wrap gap-4">
                {['Friend', 'Signboard', 'Other'].map(ref => (
                  <label key={ref} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="referral_source" value={ref.toLowerCase()} className="peer sr-only" />
                    <div className="w-5 h-5 rounded-full border border-slate-300 peer-checked:border-[6px] peer-checked:border-slate-900 transition-all"></div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{ref}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: History of Present Illness */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-2">
            History of Present Illness
          </h2>
          <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-slate-100">Please provide details regarding your reproductive and general health history.</p>
          
          <div className="space-y-1">
            <div className="py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">
                How long have you been trying to achieve a pregnancy?
              </label>
              <input type="text" name="hpi_trying_duration" placeholder="e.g. 2 years" className="w-full sm:w-48 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all shrink-0" />
            </div>

            <ToggleQuestion name="hpi_q2" text="Has your female partner ever been pregnant before?" />
            <ToggleQuestion name="hpi_q3" text="Have you previously conceived with your current partner?" />
            <ToggleQuestion name="hpi_q4" text="Does your female partner have regular menstrual cycles?" />
            <ToggleQuestion name="hpi_q5" text="Is your female partner being seen by a fertility specialist?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q6" text="Have you conceived with a previous partner?" />
            <ToggleQuestion name="hpi_q7" text="Have you ever been evaluated for infertility before?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q8" text="Have you had any severe illness, surgery, or fever in the last 3-6 months?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q9" text="Has your female partner had any pelvic infections or pelvic surgery in the past?" />
            <ToggleQuestion name="hpi_q10" text="Have you ever had a surgery to fix hernia as a child or as an adult?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q11" text="Do you have or have you ever had an undescended testicle?" />
            <ToggleQuestion name="hpi_q12" text="Have you ever had testicular torsion (twisting of the testicles)?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q13" text="Have you had previous injury to your testicles or penis requiring hospitalization or surgery?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q14" text="Have you ever had any sexually transmitted diseases? (e.g., Gonorrhea)" />
            <ToggleQuestion name="hpi_q15" text="Have you ever tested positive for HIV infection?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q16" text="Did you have the infection MUMPS during puberty?" />
            <ToggleQuestion name="hpi_q17" text="Do you often feel very tired?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q18" text="Have had any unintentional weight loss?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q19" text="Do you have any difficulty achieving or maintaining an erection?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q20" text="Do you have a low sex drive or low desire for sex?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q21" text="Does your urine ever look cloudy after sex?" options={['Yes', 'No']} />

            <div className="py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">
                How often do you having sex (how many times per week)?
              </label>
              <input type="text" name="hpi_sex_frequency" className="w-full sm:w-48 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all shrink-0" />
            </div>

            <div className="py-4 border-b border-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">Do you ever use lubricants during sex?</label>
                <div className="flex bg-slate-100/70 p-1 rounded-xl shrink-0 w-fit">
                  <label className="cursor-pointer">
                    <input type="radio" name="hpi_lubricants" value="yes" className="peer sr-only form-toggle-radio" />
                    <div className="px-4 py-2 text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">Yes</div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="hpi_lubricants" value="no" className="peer sr-only form-toggle-radio" />
                    <div className="px-4 py-2 text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">No</div>
                  </label>
                </div>
              </div>
              <div className="pl-0 sm:pl-4 border-l-2 border-slate-100 mt-2">
                <input type="text" name="hpi_lubricants_type" placeholder="If so, what type?" className="w-full sm:w-64 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all" />
              </div>
            </div>

            <ToggleQuestion name="hpi_q24" text="When using a laptop computer, do you rest it on your lap?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q25" text="Do you have scrotal or testicular pain?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q26" text="Do you have a poor sense of smell?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q27" text="Do you ever have drainage or leakage from your nipple?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q28" text="Have had a vasectomy?" options={['Yes', 'No']} />
            <ToggleQuestion name="hpi_q30" text="Are you exposed to any chemicals or toxins at work?" options={['Yes', 'No']} />

          </div>
        </div>

        {/* Section 3: Previous Tests */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-6 pb-4 border-b border-slate-100">
            Previous Tests
          </h2>
          <div className="space-y-4">
            <div className="py-2 border-b border-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">Have you had a semen analysis before?</label>
                <div className="flex bg-slate-100/70 p-1 rounded-xl shrink-0 w-fit">
                  <label className="cursor-pointer">
                    <input type="radio" name="prev_semen" value="yes" className="peer sr-only form-toggle-radio" />
                    <div className="px-4 py-2 text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">Yes</div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="prev_semen" value="no" className="peer sr-only form-toggle-radio" />
                    <div className="px-4 py-2 text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">No</div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-4 border-l-2 border-slate-100 mb-2">
                <input type="text" name="prev_semen_date" placeholder="When was the last one done?" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all" />
                <input type="text" name="prev_semen_result" placeholder="What was the result?" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all" />
              </div>
            </div>
            
            <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">Have you ever had a scan of the scrotum?</label>
              <div className="flex bg-slate-100/70 p-1 rounded-xl shrink-0 w-fit">
                <label className="cursor-pointer">
                  <input type="radio" name="prev_scan" value="yes" className="peer sr-only form-toggle-radio" />
                  <div className="px-4 py-2 text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">Yes</div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="prev_scan" value="no" className="peer sr-only form-toggle-radio" />
                  <div className="px-4 py-2 text-sm font-medium text-slate-500 rounded-lg peer-checked:text-slate-900 peer-checked:bg-white peer-checked:shadow-sm transition-all">No</div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Social History */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-6 pb-4 border-b border-slate-100">
            Social History
          </h2>
          <div className="space-y-6">
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700 block tracking-tight">Current or Recent Employer/Position</label>
              <input type="text" name="soc_employer" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400 text-slate-900" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-slate-700">Do you drink alcohol?</label>
                  <RadioGroup name="soc_alc" options={['Yes', 'No']} />
                </div>
                <input type="text" name="soc_alc_qty" placeholder="Number of drinks per week" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-slate-700">Do you smoke?</label>
                  <RadioGroup name="soc_smk" options={['Yes', 'No']} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="soc_smk_qty" placeholder="Cigarettes per day" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
                  <input type="text" name="soc_smk_yrs" placeholder="Years smoking" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-slate-700">Use illicit drugs?</label>
                  <RadioGroup name="soc_drg" options={['Yes', 'No']} />
                </div>
                <input type="text" name="soc_drg_type" placeholder="If yes, specify (marijuana, etc.)" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-slate-700">Special exercise program?</label>
                  <RadioGroup name="soc_exc" options={['Yes', 'No']} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="soc_exc_type" placeholder="Type" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
                  <input type="text" name="soc_exc_hrs" placeholder="Hours per week" className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-slate-700">Are you on a special diet?</label>
                  <RadioGroup name="soc_diet" options={['Yes', 'No']} />
                </div>
                <input type="text" name="soc_diet_type" placeholder="Type of diet" className="w-full sm:w-1/2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Review of Systems */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-6 pb-4 border-b border-slate-100">
            Review of Systems
          </h2>
          
          <div className="space-y-4 mb-8">
            <SystemToggle name="sys1" question="Have you had more than a 10 kilogram weight gain or loss in the past 12 months?" />
            <SystemToggle name="sys2" question="Do you have problems with your vision (besides usual glasses), hearing, swallowing, sinuses, or throat?" />
            <SystemToggle name="sys3" question="Do you have heart problems, chest pain, and irregular heartbeats?" />
            <SystemToggle name="sys4" question="Do you have asthma, wheezing, shortness of breath or trouble breathing?" />
            <SystemToggle name="sys5" question="Do you have breast pain, breast discharge, or a lump in your breast?" />
            <SystemToggle name="sys6" question="Do you have urinary burning, incontinence, kidney stones or blood in your urine?" />
            <SystemToggle name="sys7" question="Do you have chronic joint or muscle pain or swelling?" />
            <SystemToggle name="sys8" question="Do you have chronic skin rashes or moles that have changed in size and appearance?" />
            <SystemToggle name="sys9" question="Do you changes in cold or hot tolerances, changes in skin tone or color, changes in your nails or body hair growth?" />
            <SystemToggle name="sys10" question="Do you history of seizures, recurrent headaches or numbness in your extremities?" />
            <SystemToggle name="sys11" question="Do you have any symptoms of depression such as sadness, frequent crying or anger, emotional liability?" />
          </div>

          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block tracking-tight">List any medical problems you may have</label>
              <textarea name="med_problems" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400 text-sm text-slate-900 resize-none"></textarea>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block tracking-tight">List any medications that you take (include prescription, OTC, herbs, supplements) and doses if known</label>
              <textarea name="med_medications" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400 text-sm text-slate-900 resize-none"></textarea>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block tracking-tight">List any surgeries that you have had</label>
              <textarea name="med_surgeries" rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400 text-sm text-slate-900 resize-none"></textarea>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block tracking-tight">List any medicines that you are allergic to, and what type of reaction you had</label>
              <textarea name="med_allergies" rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400 text-sm text-slate-900 resize-none"></textarea>
            </div>
          </div>
        </div>

        {/* Section 6: Family History */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-medium tracking-tight text-slate-900 mb-6 pb-4 border-b border-slate-100">
            Family History
          </h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <label className="text-sm font-medium text-slate-700 max-w-lg leading-relaxed">
              Do any of family members have significant health problems or inherited diseases?
            </label>
            <RadioGroup name="fam_hist" options={['Yes', 'No']} />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700 tracking-tight">Tick all that apply:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {diseases.map(d => (
                <label key={d} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 group">
                  <div className="relative flex items-center justify-center shrink-0">
                    <input type="checkbox" name={`disease_${d.replace(/\s+/g, '')}`} className="peer sr-only" />
                    <div className="w-5 h-5 border border-slate-300 rounded-md peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors"></div>
                    <Check className="w-3.5 h-3.5 absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors tracking-tight">{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label className="text-sm font-medium text-slate-700 block tracking-tight">Who? (Please specify family member and condition)</label>
            <input type="text" name="fam_who" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400 text-sm text-slate-900" />
          </div>
        </div>

        {/* Footer Notice & Submit */}
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
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Questionnaire'
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
