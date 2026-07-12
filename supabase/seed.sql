-- Seed: one playable case (run AFTER creating a teacher account)
-- Replace YOUR_TEACHER_ID with the auth.users UUID of your teacher account

-- Example: run this in Supabase SQL editor after signing up as a teacher
-- SELECT id FROM auth.users LIMIT 1;

do $$
declare
  v_teacher_id uuid;
  v_case_id uuid;
begin
  select id into v_teacher_id from public.teachers limit 1;
  if v_teacher_id is null then
    raise notice 'No teacher found. Sign up first, then re-run this seed.';
    return;
  end if;

  insert into public.cases (
    teacher_id, title, category, difficulty, primary_unit, patient_age, patient_sex,
    chief_complaint, case_intro, accepted_diagnoses, alternate_accepted_answers,
    starting_budget, teacher_notes, debrief_content
  ) values (
    v_teacher_id,
    'The Tired Teenager',
    'Endocrinology',
    'advanced',
    'immune',
    16,
    'Female',
    'Fatigue and weight gain for 3 months',
    'Sarah is a 16-year-old high school student who presents to your clinic with her mother for evaluation of fatigue and weight gain.',
    ARRAY['hypothyroidism', 'primary hypothyroidism', 'hashimoto thyroiditis', 'hashimoto''s thyroiditis'],
    ARRAY['myxedema', 'underactive thyroid', 'thyroid failure'],
    1000,
    'Key teaching points: TSH is the best initial screening test. Elevated TSH with low free T4 confirms primary hypothyroidism. Anti-TPO antibodies suggest Hashimoto''s. Students often forget to order TSH first and jump to MRI.',
    E'## Debrief: Hypothyroidism\n\n**Correct diagnosis:** Primary hypothyroidism (likely Hashimoto''s thyroiditis)\n\n**Expected workup path:**\n1. Symptom History + Medical Background (cheap interview clues)\n2. TSH (elevated: 12.4 mIU/L) — $50\n3. Free T4 (low: 0.6 ng/dL) — $75\n4. Anti-TPO antibodies (positive: 340 IU/mL) — $120\n\n**Clinical reasoning:** Fatigue + weight gain + bradycardia + delayed reflexes in a teenage girl is classic hypothyroidism. The thyroid exam finding of diffuse enlargement with anti-TPO positivity confirms Hashimoto''s.\n\n**Common mistakes:** Skipping the history items, ordering brain MRI first, diagnosing depression without labs, missing the delayed relaxation phase of reflexes.'
  ) returning id into v_case_id;

  insert into public.case_menu_items (case_id, name, cost, description, clue_content, item_type, sort_order, reference_range, interpretation) values
  (v_case_id, 'Symptom History', 25, 'Detailed description of what the patient is experiencing', E'Over the past 3 months, Sarah has been increasingly tired despite sleeping 10+ hours nightly. She has gained 8 kg without changes to her diet. Her mother notes she seems "slowed down" — she takes longer to get ready in the morning and has been doing poorly in track practice.\n\nShe denies chest pain, shortness of breath, fever, or palpitations. No heat or cold intolerance reported yet (you may need other clues).', 'symptom_history', 1, '', ''),
  (v_case_id, 'Medical Background', 25, 'Past medical history, medications, family history', E'Past medical history: Unremarkable\nMedications: None\nAllergies: NKDA\nFamily history: Mother has autoimmune thyroid disease (hypothyroidism on levothyroxine)\nSurgical history: None\n\nNo prior hospitalizations.', 'medical_background', 2, '', ''),
  (v_case_id, 'Lifestyle Background', 25, 'Diet, habits, and behavioral factors', E'Diet: Typical teenage diet, no intentional restriction\nExercise: Runs track (recently struggling with endurance)\nSleep: 10+ hours/night, still wakes unrefreshed\nSubstance use: Denies tobacco, alcohol, or drugs\nStress: Mild — upcoming exams, but no major life changes\n\nMenarche at age 13; periods remain regular.', 'lifestyle_background', 3, '', ''),
  (v_case_id, 'Vital Signs', 25, 'Heart rate, blood pressure, temperature, respiratory rate, O2 saturation', E'BP: 108/68 mmHg\nHR: 52 bpm (regular)\nTemp: 36.4°C (97.5°F)\nRR: 14/min\nSpO2: 99% on room air\n\nNote: Bradycardia in a teenager who is not an athlete.', 'test', 4, '', ''),
  (v_case_id, 'Physical Exam — General', 50, 'General appearance, HEENT, neck, cardiac, pulmonary, abdominal, neuro', E'General: Appears fatigued, speaks slowly\nHEENT: Puffy face, dry skin, thinning hair\nNeck: Diffuse, non-tender thyroid enlargement (~2x normal)\nCardiac: Bradycardic, regular, no murmurs\nLungs: Clear bilaterally\nAbdomen: Soft, non-tender\nNeuro: Delayed relaxation phase of deep tendon reflexes (ankle jerk)\nExtremities: Non-pitting edema of lower legs', 'test', 5, '', ''),
  (v_case_id, 'TSH', 50, 'Thyroid-stimulating hormone', E'TSH: 12.4 mIU/L (reference: 0.4–4.0)\n\nSignificantly elevated.', 'test', 6, '0.4–4.0 mIU/L', 'TSH is released by the pituitary to stimulate the thyroid. High TSH usually means the thyroid is underactive.'),
  (v_case_id, 'Free T4', 75, 'Free thyroxine level', E'Free T4: 0.6 ng/dL (reference: 0.8–1.8)\n\nLow — consistent with primary hypothyroidism.', 'test', 7, '0.8–1.8 ng/dL', 'Free T4 is the active thyroid hormone. Low levels suggest hypothyroidism when TSH is high.'),
  (v_case_id, 'Anti-TPO Antibodies', 120, 'Thyroid peroxidase antibodies', E'Anti-TPO: 340 IU/mL (reference: <35)\n\nStrongly positive — suggests Hashimoto''s thyroiditis.', 'test', 8, '<35 IU/mL', 'Anti-TPO antibodies suggest autoimmune thyroid disease such as Hashimoto''s.'),
  (v_case_id, 'Complete Blood Count', 40, 'CBC with differential', E'WBC: 6.2 K/μL\nHgb: 12.8 g/dL\nHct: 38.2%\nPlt: 245 K/μL\n\nMild normocytic anemia (common in hypothyroidism).', 'test', 9, '', ''),
  (v_case_id, 'Basic Metabolic Panel', 45, 'Electrolytes, BUN, creatinine, glucose', E'Na: 138 | K: 4.8 | Cl: 102 | CO2: 24\nBUN: 14 | Cr: 0.7 | Glucose: 88\n\nAll within normal limits.', 'test', 10, '', ''),
  (v_case_id, 'Lipid Panel', 55, 'Total cholesterol, LDL, HDL, triglycerides', E'Total cholesterol: 248 mg/dL\nLDL: 162 mg/dL\nHDL: 48 mg/dL\nTriglycerides: 110 mg/dL\n\nMild hypercholesterolemia (secondary to hypothyroidism).', 'test', 11, '', ''),
  (v_case_id, 'Thyroid Ultrasound', 200, 'Ultrasound of the thyroid gland', E'Bilateral thyroid enlargement with heterogeneous echotexture. No dominant nodules. Increased vascularity. Findings consistent with thyroiditis.', 'test', 12, '', ''),
  (v_case_id, 'Brain MRI', 800, 'MRI of the brain with contrast', E'Brain MRI: Normal. No pituitary abnormality. No intracranial pathology.\n\n(This was likely unnecessary given the clinical picture.)', 'test', 13, '', '');

  raise notice 'Seed case created with id: %', v_case_id;
end $$;
