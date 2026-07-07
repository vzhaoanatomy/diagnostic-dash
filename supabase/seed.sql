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
    teacher_id, title, category, patient_age, patient_sex,
    chief_complaint, case_intro, accepted_diagnoses, alternate_accepted_answers,
    starting_budget, teacher_notes, debrief_content
  ) values (
    v_teacher_id,
    'The Tired Teenager',
    'Endocrinology',
    16,
    'Female',
    'Fatigue and weight gain for 3 months',
    'Sarah is a 16-year-old high school student who presents to your clinic with her mother. Over the past 3 months, she has been increasingly tired despite sleeping 10+ hours nightly. She has gained 8 kg without changes to her diet. Her mother notes she seems "slowed down" — she takes longer to get ready in the morning and has been doing poorly in track practice. Sarah denies chest pain, shortness of breath, or fever. She has no significant past medical history and takes no medications.',
    ARRAY['hypothyroidism', 'primary hypothyroidism', 'hashimoto thyroiditis', 'hashimoto''s thyroiditis'],
    ARRAY['myxedema', 'underactive thyroid', 'thyroid failure'],
    1000,
    'Key teaching points: TSH is the best initial screening test. Elevated TSH with low free T4 confirms primary hypothyroidism. Anti-TPO antibodies suggest Hashimoto''s. Students often forget to order TSH first and jump to MRI.',
    E'## Debrief: Hypothyroidism\n\n**Correct diagnosis:** Primary hypothyroidism (likely Hashimoto''s thyroiditis)\n\n**Expected workup path:**\n1. TSH (elevated: 12.4 mIU/L) — $50\n2. Free T4 (low: 0.6 ng/dL) — $75\n3. Anti-TPO antibodies (positive: 340 IU/mL) — $120\n\n**Clinical reasoning:** Fatigue + weight gain + bradycardia + delayed reflexes in a teenage girl is classic hypothyroidism. The thyroid exam finding of diffuse enlargement with anti-TPO positivity confirms Hashimoto''s.\n\n**Common mistakes:** Ordering brain MRI first, diagnosing depression without labs, missing the delayed relaxation phase of reflexes.'
  ) returning id into v_case_id;

  insert into public.case_menu_items (case_id, name, cost, description, clue_content, sort_order) values
  (v_case_id, 'Vital Signs', 25, 'Heart rate, blood pressure, temperature, respiratory rate, O2 saturation', E'BP: 108/68 mmHg\nHR: 52 bpm (regular)\nTemp: 36.4°C (97.5°F)\nRR: 14/min\nSpO2: 99% on room air\n\nNote: Bradycardia in a teenager who is not an athlete.', 1),
  (v_case_id, 'Physical Exam — General', 50, 'General appearance, HEENT, neck, cardiac, pulmonary, abdominal, neuro', E'General: Appears fatigued, speaks slowly\nHEENT: Puffy face, dry skin, thinning hair\nNeck: Diffuse, non-tender thyroid enlargement (~2x normal)\nCardiac: Bradycardic, regular, no murmurs\nLungs: Clear bilaterally\nAbdomen: Soft, non-tender\nNeuro: Delayed relaxation phase of deep tendon reflexes (ankle jerk)\nExtremities: Non-pitting edema of lower legs', 2),
  (v_case_id, 'TSH', 50, 'Thyroid-stimulating hormone', E'TSH: 12.4 mIU/L (reference: 0.4–4.0)\n\nSignificantly elevated.', 3),
  (v_case_id, 'Free T4', 75, 'Free thyroxine level', E'Free T4: 0.6 ng/dL (reference: 0.8–1.8)\n\nLow — consistent with primary hypothyroidism.', 4),
  (v_case_id, 'Anti-TPO Antibodies', 120, 'Thyroid peroxidase antibodies', E'Anti-TPO: 340 IU/mL (reference: <35)\n\nStrongly positive — suggests Hashimoto''s thyroiditis.', 5),
  (v_case_id, 'Complete Blood Count', 40, 'CBC with differential', E'WBC: 6.2 K/μL\nHgb: 12.8 g/dL\nHct: 38.2%\nPlt: 245 K/μL\n\nMild normocytic anemia (common in hypothyroidism).', 6),
  (v_case_id, 'Basic Metabolic Panel', 45, 'Electrolytes, BUN, creatinine, glucose', E'Na: 138 | K: 4.8 | Cl: 102 | CO2: 24\nBUN: 14 | Cr: 0.7 | Glucose: 88\n\nAll within normal limits.', 7),
  (v_case_id, 'Lipid Panel', 55, 'Total cholesterol, LDL, HDL, triglycerides', E'Total cholesterol: 248 mg/dL\nLDL: 162 mg/dL\nHDL: 48 mg/dL\nTriglycerides: 110 mg/dL\n\nMild hypercholesterolemia (secondary to hypothyroidism).', 8),
  (v_case_id, 'Thyroid Ultrasound', 200, 'Ultrasound of the thyroid gland', E'Bilateral thyroid enlargement with heterogeneous echotexture. No dominant nodules. Increased vascularity. Findings consistent with thyroiditis.', 9),
  (v_case_id, 'Brain MRI', 800, 'MRI of the brain with contrast', E'Brain MRI: Normal. No pituitary abnormality. No intracranial pathology.\n\n(This was likely unnecessary given the clinical picture.)', 10);

  raise notice 'Seed case created with id: %', v_case_id;
end $$;
