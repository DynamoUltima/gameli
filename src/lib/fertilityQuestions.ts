// Maps the raw field keys stored on a submitted fertility questionnaire back to
// the human-readable question text shown to the patient in FertilityIntakeForm.
// Used by the questionnaire viewers and PDF exports so a doctor/admin can read
// each answer against its actual question instead of a cryptic key like "hpi_q7".

export interface QuestionDef {
  key: string;
  label: string;
  section: string;
}

// Ordered so viewers/PDFs render in the same order the patient filled the form.
export const FERTILITY_QUESTIONS: QuestionDef[] = [
  // Personal Information
  { key: 'personal_name', label: 'Name', section: 'Personal Information' },
  { key: 'personal_marital', label: 'Marital Status', section: 'Personal Information' },
  { key: 'personal_dob', label: 'Date of Birth', section: 'Personal Information' },
  { key: 'personal_phone', label: 'Phone Number', section: 'Personal Information' },
  { key: 'personal_address', label: 'Address', section: 'Personal Information' },
  { key: 'personal_email', label: 'E-mail', section: 'Personal Information' },
  { key: 'personal_education', label: 'Educational Level', section: 'Personal Information' },
  { key: 'personal_occupation', label: 'Occupation', section: 'Personal Information' },

  // Partner Information
  { key: 'partner_name', label: "Partner's Name", section: 'Partner Information' },
  { key: 'partner_dob', label: "Partner's Date of Birth", section: 'Partner Information' },

  // Referral
  { key: 'referral_source', label: 'Who referred you / how did you hear about us?', section: 'Referral' },

  // History of Present Illness
  { key: 'hpi_trying_duration', label: 'How long have you been trying to achieve a pregnancy?', section: 'History of Present Illness' },
  { key: 'hpi_q2', label: 'Has your female partner ever been pregnant before?', section: 'History of Present Illness' },
  { key: 'hpi_q3', label: 'Have you previously conceived with your current partner?', section: 'History of Present Illness' },
  { key: 'hpi_q4', label: 'Does your female partner have regular menstrual cycles?', section: 'History of Present Illness' },
  { key: 'hpi_q5', label: 'Is your female partner being seen by a fertility specialist?', section: 'History of Present Illness' },
  { key: 'hpi_q6', label: 'Have you conceived with a previous partner?', section: 'History of Present Illness' },
  { key: 'hpi_q7', label: 'Have you ever been evaluated for infertility before?', section: 'History of Present Illness' },
  { key: 'hpi_q8', label: 'Have you had any severe illness, surgery, or fever in the last 3-6 months?', section: 'History of Present Illness' },
  { key: 'hpi_q9', label: 'Has your female partner had any pelvic infections or pelvic surgery in the past?', section: 'History of Present Illness' },
  { key: 'hpi_q10', label: 'Have you ever had a surgery to fix hernia as a child or as an adult?', section: 'History of Present Illness' },
  { key: 'hpi_q11', label: 'Do you have or have you ever had an undescended testicle?', section: 'History of Present Illness' },
  { key: 'hpi_q12', label: 'Have you ever had testicular torsion (twisting of the testicles)?', section: 'History of Present Illness' },
  { key: 'hpi_q13', label: 'Have you had previous injury to your testicles or penis requiring hospitalization or surgery?', section: 'History of Present Illness' },
  { key: 'hpi_q14', label: 'Have you ever had any sexually transmitted diseases? (e.g., Gonorrhea)', section: 'History of Present Illness' },
  { key: 'hpi_q15', label: 'Have you ever tested positive for HIV infection?', section: 'History of Present Illness' },
  { key: 'hpi_q16', label: 'Did you have the infection MUMPS during puberty?', section: 'History of Present Illness' },
  { key: 'hpi_q17', label: 'Do you often feel very tired?', section: 'History of Present Illness' },
  { key: 'hpi_q18', label: 'Have you had any unintentional weight loss?', section: 'History of Present Illness' },
  { key: 'hpi_q19', label: 'Do you have any difficulty achieving or maintaining an erection?', section: 'History of Present Illness' },
  { key: 'hpi_q20', label: 'Do you have a low sex drive or low desire for sex?', section: 'History of Present Illness' },
  { key: 'hpi_q21', label: 'Does your urine ever look cloudy after sex?', section: 'History of Present Illness' },
  { key: 'hpi_sex_frequency', label: 'How often do you have sex (times per week)?', section: 'History of Present Illness' },
  { key: 'hpi_lubricants', label: 'Do you ever use lubricants during sex?', section: 'History of Present Illness' },
  { key: 'hpi_lubricants_type', label: 'Lubricant — what type?', section: 'History of Present Illness' },
  { key: 'hpi_q24', label: 'When using a laptop computer, do you rest it on your lap?', section: 'History of Present Illness' },
  { key: 'hpi_q25', label: 'Do you have scrotal or testicular pain?', section: 'History of Present Illness' },
  { key: 'hpi_q26', label: 'Do you have a poor sense of smell?', section: 'History of Present Illness' },
  { key: 'hpi_q27', label: 'Do you ever have drainage or leakage from your nipple?', section: 'History of Present Illness' },
  { key: 'hpi_q28', label: 'Have you had a vasectomy?', section: 'History of Present Illness' },
  { key: 'hpi_q30', label: 'Are you exposed to any chemicals or toxins at work?', section: 'History of Present Illness' },

  // Previous Tests
  { key: 'prev_semen', label: 'Have you had a semen analysis before?', section: 'Previous Tests' },
  { key: 'prev_semen_date', label: 'Semen analysis — when was the last one done?', section: 'Previous Tests' },
  { key: 'prev_semen_result', label: 'Semen analysis — result', section: 'Previous Tests' },
  { key: 'prev_scan', label: 'Have you ever had a scan of the scrotum?', section: 'Previous Tests' },

  // Social History
  { key: 'soc_employer', label: 'Current or Recent Employer/Position', section: 'Social History' },
  { key: 'soc_alc', label: 'Do you drink alcohol?', section: 'Social History' },
  { key: 'soc_alc_qty', label: 'Alcohol — drinks per week', section: 'Social History' },
  { key: 'soc_smk', label: 'Do you smoke?', section: 'Social History' },
  { key: 'soc_smk_qty', label: 'Smoking — cigarettes per day', section: 'Social History' },
  { key: 'soc_smk_yrs', label: 'Smoking — years smoking', section: 'Social History' },
  { key: 'soc_drg', label: 'Do you use illicit drugs?', section: 'Social History' },
  { key: 'soc_drg_type', label: 'Illicit drugs — specify', section: 'Social History' },
  { key: 'soc_exc', label: 'Special exercise program?', section: 'Social History' },
  { key: 'soc_exc_type', label: 'Exercise — type', section: 'Social History' },
  { key: 'soc_exc_hrs', label: 'Exercise — hours per week', section: 'Social History' },
  { key: 'soc_diet', label: 'Are you on a special diet?', section: 'Social History' },
  { key: 'soc_diet_type', label: 'Diet — type', section: 'Social History' },

  // Review of Systems
  { key: 'sys1', label: 'Weight gain/loss of more than 10 kg in the past 12 months?', section: 'Review of Systems' },
  { key: 'sys2', label: 'Problems with vision, hearing, swallowing, sinuses, or throat?', section: 'Review of Systems' },
  { key: 'sys3', label: 'Heart problems, chest pain, or irregular heartbeats?', section: 'Review of Systems' },
  { key: 'sys4', label: 'Asthma, wheezing, shortness of breath or trouble breathing?', section: 'Review of Systems' },
  { key: 'sys5', label: 'Breast pain, breast discharge, or a lump in your breast?', section: 'Review of Systems' },
  { key: 'sys6', label: 'Urinary burning, incontinence, kidney stones or blood in urine?', section: 'Review of Systems' },
  { key: 'sys7', label: 'Chronic joint or muscle pain or swelling?', section: 'Review of Systems' },
  { key: 'sys8', label: 'Chronic skin rashes or moles that have changed in size/appearance?', section: 'Review of Systems' },
  { key: 'sys9', label: 'Changes in cold/hot tolerance, skin tone, nails or body hair growth?', section: 'Review of Systems' },
  { key: 'sys10', label: 'History of seizures, recurrent headaches or numbness in extremities?', section: 'Review of Systems' },
  { key: 'sys11', label: 'Symptoms of depression (sadness, frequent crying, anger, emotional lability)?', section: 'Review of Systems' },

  // Medical Notes
  { key: 'med_problems', label: 'Medical problems', section: 'Medical Notes' },
  { key: 'med_medications', label: 'Medications (prescription, OTC, herbs, supplements) and doses', section: 'Medical Notes' },
  { key: 'med_surgeries', label: 'Surgeries', section: 'Medical Notes' },
  { key: 'med_allergies', label: 'Medication allergies and reactions', section: 'Medical Notes' },

  // Family History
  { key: 'fam_hist', label: 'Do any family members have significant health problems or inherited diseases?', section: 'Family History' },
  { key: 'family_diseases', label: 'Inherited diseases in the family', section: 'Family History' },
  { key: 'fam_who', label: 'Who? (family member and condition)', section: 'Family History' },

  // ===== Female questionnaire =====
  // Personal (female extras)
  { key: 'personal_height_feet', label: 'Height (feet)', section: 'Personal Information' },
  { key: 'personal_height_inches', label: 'Height (inches)', section: 'Personal Information' },
  { key: 'personal_height_meters', label: 'Height (meters)', section: 'Personal Information' },
  { key: 'personal_weight_kg', label: 'Weight (kg)', section: 'Personal Information' },
  { key: 'personal_trouble_pregnant', label: 'Are you having trouble getting pregnant?', section: 'Personal Information' },

  // Section A: Gynecological History
  { key: 'gyn_menarche_age', label: 'Age when your periods started', section: 'Gynecological History' },
  { key: 'gyn_lmp', label: 'Date of your last period', section: 'Gynecological History' },
  { key: 'gyn_cycles_regular', label: 'Are your menstrual cycles regular and predictable?', section: 'Gynecological History' },
  { key: 'gyn_cycle_frequency', label: 'If regular, how often do your cycles come?', section: 'Gynecological History' },
  { key: 'gyn_interval_longest', label: 'If not regular — longest interval between periods (days)', section: 'Gynecological History' },
  { key: 'gyn_interval_shortest', label: 'If not regular — shortest interval between periods (days)', section: 'Gynecological History' },
  { key: 'gyn_regulate_med', label: 'Ever taken medicine to regulate your menstrual cycle?', section: 'Gynecological History' },
  { key: 'gyn_regulate_meds', label: 'Medicines taken to regulate cycle', section: 'Gynecological History' },
  { key: 'gyn_regulate_med_other', label: 'Other cycle-regulating medicine', section: 'Gynecological History' },
  { key: 'gyn_regulate_med_last', label: 'When was the last time you took it?', section: 'Gynecological History' },
  { key: 'gyn_cramps', label: 'Do you have cramps with your periods?', section: 'Gynecological History' },
  { key: 'gyn_cramps_severity', label: 'Severity of period cramps', section: 'Gynecological History' },
  { key: 'gyn_missed_work', label: 'Ever missed work or school due to menstrual pains?', section: 'Gynecological History' },
  { key: 'gyn_pain_intercourse', label: 'Do you have pain with intercourse?', section: 'Gynecological History' },
  { key: 'gyn_endometriosis', label: 'Were you ever diagnosed with endometriosis?', section: 'Gynecological History' },
  { key: 'gyn_contraception', label: 'Contraception used in the past', section: 'Gynecological History' },
  { key: 'gyn_contraception_complications', label: 'Any contraceptive complications?', section: 'Gynecological History' },
  { key: 'gyn_contraception_last', label: 'When did you last use contraception?', section: 'Gynecological History' },
  { key: 'gyn_pap_smear', label: 'Have you ever had a Pap smear?', section: 'Gynecological History' },
  { key: 'gyn_pap_smear_last', label: 'When was your last Pap smear?', section: 'Gynecological History' },
  { key: 'gyn_sti_history', label: 'Sexually transmitted infections ever had', section: 'Gynecological History' },
  { key: 'gyn_abnormal_mammogram', label: 'Have you ever had an abnormal mammogram?', section: 'Gynecological History' },
  { key: 'gyn_mammogram_when', label: 'Abnormal mammogram — when?', section: 'Gynecological History' },
  { key: 'gyn_mammogram_action', label: 'Abnormal mammogram — what was done about it?', section: 'Gynecological History' },
  { key: 'gyn_mammogram_last', label: 'When was your last mammogram?', section: 'Gynecological History' },

  // Section B: Medical History
  { key: 'medhx_conditions', label: 'Medical conditions ever had', section: 'Medical History' },
  { key: 'medhx_medications', label: 'Current medications (including herbal)', section: 'Medical History' },
  { key: 'medhx_allergic', label: 'Are you allergic to any medications?', section: 'Medical History' },
  { key: 'medhx_allergic_name', label: 'Medication allergy — name', section: 'Medical History' },
  { key: 'medhx_surgery', label: 'Have you had surgery before?', section: 'Medical History' },
  { key: 'medhx_surgery_detail', label: 'Surgery — date / type', section: 'Medical History' },

  // Section C: Pregnancy History
  { key: 'preg_count', label: 'Number of pregnancies (including abortions and miscarriages)', section: 'Pregnancy History' },

  // Section D: Fertility History
  { key: 'fert_trying_duration', label: 'How long have you and your partner been trying to conceive?', section: 'Fertility History' },
  { key: 'fert_infertile_past', label: 'Ever been infertile with a past partner?', section: 'Fertility History' },
  { key: 'fert_bbt_date', label: 'Basal Body Temperature — date', section: 'Fertility History' },
  { key: 'fert_bbt_result', label: 'Basal Body Temperature — result', section: 'Fertility History' },
  { key: 'fert_lh_date', label: 'Urinary LH predictor kits — date', section: 'Fertility History' },
  { key: 'fert_lh_result', label: 'Urinary LH predictor kits — result', section: 'Fertility History' },
  { key: 'fert_hormone_date', label: 'Hormone tests — date', section: 'Fertility History' },
  { key: 'fert_hormone_result', label: 'Hormone tests — result', section: 'Fertility History' },
  { key: 'fert_endometrial_date', label: 'Endometrial biopsy — date', section: 'Fertility History' },
  { key: 'fert_endometrial_result', label: 'Endometrial biopsy — result', section: 'Fertility History' },
  { key: 'fert_hsg_date', label: 'Hysterosalpingogram (HSG) — date', section: 'Fertility History' },
  { key: 'fert_hsg_result', label: 'Hysterosalpingogram (HSG) — result', section: 'Fertility History' },
  { key: 'fert_ultrasound_date', label: 'Ultrasound — date', section: 'Fertility History' },
  { key: 'fert_ultrasound_result', label: 'Ultrasound — result', section: 'Fertility History' },
  { key: 'fert_laparoscopy_date', label: 'Laparoscopy — date', section: 'Fertility History' },
  { key: 'fert_laparoscopy_result', label: 'Laparoscopy — result', section: 'Fertility History' },
  { key: 'fert_gc_date', label: 'Gonorrhea / Chlamydia cultures — date', section: 'Fertility History' },
  { key: 'fert_gc_result', label: 'Gonorrhea / Chlamydia cultures — result', section: 'Fertility History' },
  { key: 'fert_hepatitis_date', label: 'Hepatitis B or C — date', section: 'Fertility History' },
  { key: 'fert_hepatitis_result', label: 'Hepatitis B or C — result', section: 'Fertility History' },
  { key: 'fert_hiv_date', label: 'HIV — date', section: 'Fertility History' },
  { key: 'fert_hiv_result', label: 'HIV — result', section: 'Fertility History' },
  { key: 'fert_syphilis_date', label: 'Syphilis — date', section: 'Fertility History' },
  { key: 'fert_syphilis_result', label: 'Syphilis — result', section: 'Fertility History' },
  { key: 'fert_blood_group', label: 'Blood group', section: 'Fertility History' },
  { key: 'fert_sickling', label: 'Sickling status', section: 'Fertility History' },

  // Section E: Ovulatory Dysfunction History
  { key: 'ov_pcos', label: 'Ever told you have polycystic ovarian syndrome (PCOS)?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_ovulation_problem', label: 'Ever told you have a problem with ovulating?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_diabetes', label: 'Do you have diabetes?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_insulin_resistance', label: 'Do you have insulin resistance?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_medication', label: 'Ever taken medication to help you get pregnant?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_medications', label: 'Medications taken to get pregnant', section: 'Ovulatory Dysfunction' },
  { key: 'ov_medication_other', label: 'Other pregnancy medication', section: 'Ovulatory Dysfunction' },
  { key: 'ov_cycles_per_year', label: 'Menstrual cycles per year when not on medication', section: 'Ovulatory Dysfunction' },
  { key: 'ov_excess_hair', label: 'More hair than most women on some areas of your body?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_removed_hair', label: 'Ever removed hair from these areas?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_removed_hair_area', label: 'Hair removal — which area?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_acne', label: 'As an adult, have you had acne?', section: 'Ovulatory Dysfunction' },
  { key: 'ov_acne_now', label: 'Do you have acne now?', section: 'Ovulatory Dysfunction' },
];

const QUESTION_MAP = new Map<string, QuestionDef>(FERTILITY_QUESTIONS.map((q) => [q.key, q]));

// Section order for display; keys not in the map are bucketed by prefix or "Other".
export const SECTION_ORDER = [
  'Personal Information',
  'Partner Information',
  'Referral',
  'Gynecological History',
  'History of Present Illness',
  'Previous Tests',
  'Medical History',
  'Pregnancy History',
  'Fertility History',
  'Ovulatory Dysfunction',
  'Review of Systems',
  'Social History',
  'Medical Notes',
  'Family History',
  'Fertility Therapy',
  'Other',
];

const prettify = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Human-readable question text for a stored field key. */
export const getQuestionLabel = (key: string): string => {
  const direct = QUESTION_MAP.get(key);
  if (direct) return direct.label;

  // "If yes, specify" detail fields attached to a Review-of-Systems toggle.
  if (key.endsWith('_details')) {
    const base = QUESTION_MAP.get(key.slice(0, -'_details'.length));
    if (base) return `${base.label} — details`;
  }

  // Pregnancy history table: preg_<n>_<field>
  const preg = key.match(/^preg_(\d+)_(\w+)$/);
  if (preg) return `Pregnancy ${preg[1]} — ${prettify(preg[2])}`;

  // Fertility therapy table: therapy_<i>_<field>
  const therapy = key.match(/^therapy_(\d+)_(\w+)$/);
  if (therapy) return `Therapy ${Number(therapy[1]) + 1} — ${prettify(therapy[2])}`;

  return prettify(key);
};

/** Section a field key belongs to, for grouped display. */
export const getQuestionSection = (key: string): string => {
  const direct = QUESTION_MAP.get(key);
  if (direct) return direct.section;
  if (key.endsWith('_details')) {
    const base = QUESTION_MAP.get(key.slice(0, -'_details'.length));
    if (base) return base.section;
  }
  if (/^preg_\d+_/.test(key)) return 'Pregnancy History';
  if (/^therapy_\d+_/.test(key)) return 'Fertility Therapy';
  return 'Other';
};

/** Normalise stored answer values (e.g. "dontknow" -> "Don't know"). */
export const formatAnswer = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  const lower = str.toLowerCase();
  if (lower === 'yes') return 'Yes';
  if (lower === 'no') return 'No';
  if (lower === 'dontknow' || lower === "don'tknow") return "Don't know";
  if (lower === 'on' || lower === 'true') return 'Yes';
  return str;
};

export interface GroupedSection {
  section: string;
  rows: { key: string; label: string; value: string }[];
}

/**
 * Turn a raw questionnaire `data` object into ordered sections of
 * { question label, formatted answer } rows, skipping empty answers and the
 * internal per-disease checkbox keys (summarised by `family_diseases`).
 */
export const groupQuestionnaire = (data: Record<string, any> | undefined | null): GroupedSection[] => {
  if (!data) return [];
  const bySection = new Map<string, { key: string; label: string; value: string }[]>();

  const pushRow = (key: string) => {
    const raw = data[key];
    if (raw === null || raw === undefined || String(raw).trim() === '') return;
    if (key.startsWith('disease_')) return; // internal checkboxes; see family_diseases
    const section = getQuestionSection(key);
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push({ key, label: getQuestionLabel(key), value: formatAnswer(raw) });
  };

  // Known questions first (form order), then any remaining keys.
  const seen = new Set<string>();
  for (const q of FERTILITY_QUESTIONS) {
    if (q.key in data) { pushRow(q.key); seen.add(q.key); }
  }
  for (const key of Object.keys(data)) {
    if (!seen.has(key)) pushRow(key);
  }

  return SECTION_ORDER
    .filter((s) => bySection.has(s) && bySection.get(s)!.length > 0)
    .map((section) => ({ section, rows: bySection.get(section)! }));
};
