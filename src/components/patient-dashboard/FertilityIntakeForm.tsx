import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Info, Send, Loader2 } from 'lucide-react';

interface FertilityIntakeFormProps {
  formId: string;
  formType: string;
  onBack: () => void;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
}

export const FertilityIntakeForm: React.FC<FertilityIntakeFormProps> = ({
  formId,
  formType,
  onBack,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    maritalStatus: '',
    durationOfInfertility: '',
    previousPregnancies: '',
    medicalConditions: '',
    surgeries: '',
    medications: '',
    allergies: '',
    additionalInfo: ''
  });

  const isFemale = formType === 'female_fertility' || formType === 'couple_fertility';
  const title = formType === 'female_fertility' ? 'Female Fertility Questionnaire' : 
                formType === 'male_fertility' ? 'Male Fertility Questionnaire' : 
                'Couple Fertility Questionnaire';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-primary/5 px-6 py-8 border-b border-primary/10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please fill out this form accurately to help our specialists understand your medical history and provide the best care possible.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* General Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2">
                General Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                    Marital Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none"
                  >
                    <option value="" disabled>Select status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                    Duration of Infertility/Trying to Conceive <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="durationOfInfertility"
                    value={formData.durationOfInfertility}
                    onChange={handleChange}
                    placeholder="e.g., 2 years"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Medical History Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2">
                Medical History
              </h3>
              
              {isFemale && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                    Previous Pregnancies / Miscarriages (if any)
                  </label>
                  <textarea
                    name="previousPregnancies"
                    value={formData.previousPregnancies}
                    onChange={handleChange}
                    placeholder="Please detail any previous pregnancies, outcomes, or miscarriages..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                  Current/Past Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  placeholder="e.g., Diabetes, Hypertension, PCOS, Thyroid issues..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                    Previous Surgeries
                  </label>
                  <textarea
                    name="surgeries"
                    value={formData.surgeries}
                    onChange={handleChange}
                    placeholder="List past surgeries and dates..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                    Current Medications
                  </label>
                  <textarea
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                    placeholder="List any medications you are currently taking..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2">
                Other Information
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                  Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g., Penicillin, Peanuts (or 'None' if applicable)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                  Any other relevant information
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  placeholder="Share anything else you think the doctor should know before your consultation..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            {/* Warning / Submit */}
            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 mt-8">
              <div className="flex items-start sm:items-center gap-2 text-sm text-slate-500 max-w-lg">
                <Info className="w-5 h-5 flex-shrink-0 text-primary" />
                <p>By submitting this form, you confirm that the information provided is accurate and true to the best of your knowledge.</p>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Form
                    <Send className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
