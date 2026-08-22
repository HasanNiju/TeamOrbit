-- ---------------------------------------------------------------------------
-- TeamOrbit — demo data seed (pure SQL, no Node.js required)
--
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. Do this AFTER running supabase_schema.sql.
--
-- Safe to run only once — if you run it twice you'll get a duplicate
-- employee_id error (that's expected; it means data is already there).
--
-- Creates:
--   Managers:      SA-001 / admin123      SA-002 / admin123
--   Team Leaders:  TL-001 / leader123     TL-002 / leader123     TL-003 / leader123
--   Employees:     EMP-001 / demo123      EMP-002..EMP-008 / demo123 (EMP-008 is inactive)
-- Plus ~45 days of realistic sample submissions for each active employee.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

do $$
declare
  v_sa1 text := gen_random_uuid()::text;
  v_sa2 text := gen_random_uuid()::text;
  v_tl1 text := gen_random_uuid()::text;
  v_tl2 text := gen_random_uuid()::text;
  v_tl3 text := gen_random_uuid()::text;
  v_emp1 text := gen_random_uuid()::text;
  v_emp2 text := gen_random_uuid()::text;
  v_emp3 text := gen_random_uuid()::text;
  v_emp4 text := gen_random_uuid()::text;
  v_emp5 text := gen_random_uuid()::text;
  v_emp6 text := gen_random_uuid()::text;
  v_emp7 text := gen_random_uuid()::text;
  v_emp8 text := gen_random_uuid()::text;
begin
  -- --- Managers (Super Admins) ---------------------------------------------
  insert into users (id, employee_id, name, name_en, password_hash, role, designation, mobile, zone, language, status)
  values
    (v_sa1, 'SA-001', 'Nasrin Sultana', 'Nasrin Sultana', crypt('admin123', gen_salt('bf')), 'SUPER_ADMIN', 'General Manager', '01799999999', 'Head Office', 'en', 'active'),
    (v_sa2, 'SA-002', 'Rafiqul Islam', 'Rafiqul Islam', crypt('admin123', gen_salt('bf')), 'SUPER_ADMIN', 'Operations Manager', '01788888888', 'Head Office', 'en', 'active');

  -- --- Team Leaders (Admins) -------------------------------------------------
  insert into users (id, employee_id, name, name_en, password_hash, role, designation, mobile, zone, manager_id, language, status)
  values
    (v_tl1, 'TL-001', 'Kamal Hossain', 'Kamal Hossain', crypt('leader123', gen_salt('bf')), 'ADMIN', 'Team Leader', '01766666666', 'Dhaka North', v_sa1, 'en', 'active'),
    (v_tl2, 'TL-002', 'Shirin Akter', 'Shirin Akter', crypt('leader123', gen_salt('bf')), 'ADMIN', 'Team Leader', '01755555555', 'Chattogram', v_sa1, 'en', 'active'),
    (v_tl3, 'TL-003', 'Jahidul Karim', 'Jahidul Karim', crypt('leader123', gen_salt('bf')), 'ADMIN', 'Team Leader', '01744444444', 'Sylhet', v_sa2, 'en', 'active');

  -- --- Marketing Officers (Employees) ----------------------------------------
  insert into users (id, employee_id, name, name_en, password_hash, role, designation, mobile, address, zone, team_leader_id, manager_id, language, status)
  values
    (v_emp1, 'EMP-001', 'রহিম আহমেদ', 'Rahim Ahmed', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01711111111', 'House 12, Road 5, Mirpur, Dhaka', 'Dhaka North', v_tl1, v_sa1, 'bn', 'active'),
    (v_emp2, 'EMP-002', 'করিম উদ্দিন', 'Karim Uddin', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01712222222', 'Uttara Sector 7, Dhaka', 'Dhaka North', v_tl1, v_sa1, 'bn', 'active'),
    (v_emp3, 'EMP-003', 'সালমা বেগম', 'Salma Begum', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01713333333', 'Mohammadpur, Dhaka', 'Dhaka North', v_tl1, v_sa1, 'bn', 'active'),
    (v_emp4, 'EMP-004', 'ফরহাদ হোসেন', 'Forhad Hossain', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01714444444', 'Agrabad, Chattogram', 'Chattogram', v_tl2, v_sa1, 'bn', 'active'),
    (v_emp5, 'EMP-005', 'নাসরিন আক্তার', 'Nasrin Akter', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01715555555', 'GEC Circle, Chattogram', 'Chattogram', v_tl2, v_sa1, 'bn', 'active'),
    (v_emp6, 'EMP-006', 'তানভীর আহমেদ', 'Tanvir Ahmed', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01716666666', 'Halishahar, Chattogram', 'Chattogram', v_tl2, v_sa1, 'bn', 'active'),
    (v_emp7, 'EMP-007', 'মিলা রহমান', 'Mila Rahman', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01717777777', 'Zindabazar, Sylhet', 'Sylhet', v_tl3, v_sa2, 'bn', 'active'),
    (v_emp8, 'EMP-008', 'সোহেল রানা', 'Sohel Rana', crypt('demo123', gen_salt('bf')), 'MARKETING_OFFICER', 'Marketing Officer', '01718888888', 'Ambarkhana, Sylhet', 'Sylhet', v_tl3, v_sa2, 'bn', 'inactive');
end $$;

-- --- Sample submissions for the last 45 days, for every active employee ------
do $$
declare
  emp record;
  opinions text[] := array[
    'Visited 12 retail outlets today, distributed promotional materials and collected feedback on the new product line.',
    'Met with 5 potential clients in the assigned zone; two showed strong interest in the seasonal package.',
    'Followed up on last week''s leads, resolved two complaints, and updated shop owners on the upcoming price list.',
    'Conducted a market survey in the local bazaar to understand competitor pricing and customer preferences.',
    'Attended a team briefing in the morning, then covered the northern part of the zone for field visits.',
    'Distributed samples to 8 shops and recorded initial reactions for the weekly report.'
  ];
  d int;
  cnt int;
  i int;
  submitted timestamptz;
  dhaka_date text;
begin
  for emp in select id, employee_id, name_en, designation, address, mobile from users where role = 'MARKETING_OFFICER' and status = 'active'
  loop
    for d in 1..45 loop
      if random() < 0.22 then continue; end if; -- ~22% of days have no reports, like real usage

      cnt := 1 + floor(random() * 5)::int; -- 1 to 5 reports that day
      for i in 1..cnt loop
        -- Base = midnight UTC, d days ago, plus a random hour/minute so the
        -- Dhaka-local time lands between 08:00 and 20:00.
        submitted := date_trunc('day', now()) - (d || ' days')::interval
                     + ((2 + floor(random() * 12))::text || ' hours')::interval
                     + ((floor(random() * 60))::text || ' minutes')::interval;
        dhaka_date := to_char(submitted at time zone 'Asia/Dhaka', 'YYYY-MM-DD');

        insert into submissions (id, employee_user_id, employee_id, name_snapshot, designation_snapshot, address, mobile, opinion, submission_date, submitted_at)
        values (
          gen_random_uuid()::text,
          emp.id, emp.employee_id, emp.name_en, emp.designation,
          coalesce(emp.address, 'Dhaka, Bangladesh'), coalesce(emp.mobile, '01700000000'),
          opinions[1 + floor(random() * array_length(opinions, 1))::int],
          dhaka_date,
          submitted
        );
      end loop;
    end loop;
  end loop;
end $$;

select
  (select count(*) from users) as users_created,
  (select count(*) from submissions) as submissions_created;
