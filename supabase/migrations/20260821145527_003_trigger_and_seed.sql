/*
# Profile auto-creation trigger and seed data

1. Functions
- handle_new_user(): trigger function that creates a profiles row on auth.users insert
2. Triggers
- on_auth_user_created: fires after a new auth user is created
3. Seed Data
- college_settings: single default row
- announcements: 3 sample announcements
- chatbot_knowledge: BCA-related knowledge chunks for the RAG chatbot
- courses: BCA + sample courses
- faqs: sample FAQs
*/

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed college_settings (single row)
INSERT INTO public.college_settings (id, college_name, address, phone, email, website, hero_subtitle, about_text)
VALUES (
  1,
  'University College Of Science, Tumkur University Campus',
  'BH Road, Tumkur - 572103',
  '0816-2203500',
  'ucscience@tumkuruniversity.ac.in',
  'https://tumkuruniversity.ac.in',
  'Empowering students through quality education and innovation in science and technology.',
  'University College Of Science, Tumkur University Campus, is a premier institution of higher learning situated on BH Road, Tumkur. The college offers undergraduate and postgraduate programs in science and computer applications, with a strong commitment to academic excellence, research, and holistic student development. Our campus provides a conducive learning environment with modern facilities, experienced faculty, and a vibrant academic community.'
)
ON CONFLICT (id) DO NOTHING;

-- Seed announcements
INSERT INTO public.announcements (message, is_active, sort_order) VALUES
  ('Admissions Open for BCA 2026-27 Batch! Apply Now.', true, 1),
  ('Last date for BCA application submission: 30th September 2026.', true, 2),
  ('New AI Enquiry Chatbot launched - Ask your questions anytime!', true, 3)
ON CONFLICT DO NOTHING;

-- Seed courses
INSERT INTO public.courses (name, code, duration, eligibility, fees, description, sort_order) VALUES
  ('Bachelor of Computer Applications (BCA)', 'BCA', '3 Years (6 Semesters)', 'Pass in PUC/10+2 or equivalent examination from a recognized board with Mathematics/Computer Science/Statistics as one of the subjects.', 'Rs. 25,000 per year (approximate)', 'BCA is a three-year undergraduate degree program focused on computer applications and software development. The curriculum covers programming, web technologies, databases, and emerging areas like AI.', 1),
  ('Bachelor of Science (B.Sc) - Computer Science', 'BSc-CS', '3 Years (6 Semesters)', 'Pass in PUC/10+2 with Science stream.', 'Rs. 20,000 per year (approximate)', 'B.Sc Computer Science covers core computer science theory, programming, and applications.', 2),
  ('Bachelor of Science (B.Sc) - Mathematics', 'BSc-Maths', '3 Years (6 Semesters)', 'Pass in PUC/10+2 with Mathematics.', 'Rs. 18,000 per year (approximate)', 'B.Sc Mathematics provides a strong foundation in pure and applied mathematics.', 3),
  ('Master of Computer Applications (MCA)', 'MCA', '2 Years (4 Semesters)', 'Recognized bachelor''s degree with Mathematics at 10+2 or degree level.', 'Rs. 40,000 per year (approximate)', 'MCA is a postgraduate program in computer applications for advanced software careers.', 4)
ON CONFLICT DO NOTHING;

-- Seed FAQs
INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
  ('How do I apply for BCA admission?', 'You can apply for BCA admission by submitting the application form available at the college office or on the college website. The application must be submitted along with required documents before the last date mentioned in the announcement.', 'Admission', 1),
  ('What documents are required for admission?', 'Required documents typically include: 10th and 12th/PUC marks cards, transfer certificate (TC), migration certificate (if applicable), caste/income certificate (if applicable), passport-size photographs, and Aadhaar card.', 'Admission', 2),
  ('Is there a hostel facility?', 'Yes, the college provides hostel facilities for both boys and girls. Contact the college office for availability and fee details.', 'Facilities', 3),
  ('What is the medium of instruction?', 'The medium of instruction for all courses is English.', 'General', 4),
  ('Does the college provide placement assistance?', 'Yes, the college has a placement cell that organizes campus recruitment drives, training programs, and career guidance sessions.', 'Placements', 5)
ON CONFLICT DO NOTHING;

-- Seed chatbot knowledge (the RAG source)
INSERT INTO public.chatbot_knowledge (topic, question_patterns, keywords, content) VALUES
  (
    'BCA Eligibility',
    'bca eligibility,can i join bca after puc,bca ge eligibility,bca eligibility enu,bca eligibility ಏನು,who can apply for bca,am i eligible for bca',
    'bca eligibility puc 12th pass science mathematics computer science admission qualification',
    'To be eligible for BCA at University College Of Science, Tumkur University Campus, a student must have passed PUC (10+2) or an equivalent examination from a recognized board. Having Mathematics, Computer Science, or Statistics as one of the subjects in PUC is preferred. Students from any stream (Science, Commerce, Arts) who have completed PUC may apply. There is no separate entrance exam for BCA admission; admission is based on merit as per university norms.'
  ),
  (
    'BCA Fees',
    'bca fees,bca fee structure,bca total fees,bca fees enu,bca fees ಎಷ್ಟು,how much is bca,bca course cost',
    'bca fees fee structure cost payment amount year semester',
    'The approximate fee for the BCA program at University College Of Science, Tumkur University Campus is Rs. 25,000 per year. The total fee for the three-year BCA program is approximately Rs. 75,000. Fees may vary slightly each academic year. For the exact current fee structure, please contact the college office at BH Road, Tumkur - 572103 or call 0816-2203500.'
  ),
  (
    'BCA Course Duration',
    'bca duration,how long is bca,bca years,bca semesters,bca ಎಷ್ಟು ವರ್ಷ',
    'bca duration years semesters three 3 six course',
    'The BCA (Bachelor of Computer Applications) program is a three-year (6 semesters) full-time undergraduate degree course at University College Of Science, Tumkur University Campus. Each academic year consists of two semesters with continuous assessment and end-semester examinations.'
  ),
  (
    'BCA Course Description',
    'what is bca,bca course details,bca subjects,bca syllabus,bca enu,bca ಏನು,bca about',
    'bca computer applications programming software web database syllabus subjects curriculum',
    'BCA (Bachelor of Computer Applications) is a three-year undergraduate degree program focused on computer applications, software development, and IT. The curriculum includes subjects like C/C++ programming, Java, Python, Web Technologies (HTML, CSS, JavaScript), Database Management Systems (SQL), Data Structures, Operating Systems, Computer Networks, Software Engineering, and emerging areas like Artificial Intelligence and Machine Learning. The program combines theory with practical lab sessions and a final-year project.'
  ),
  (
    'Admission Process',
    'admission process,how to apply,admission enu,admission ಹೇಗೆ,admission procedure,how to get admission',
    'admission apply application process procedure form documents steps how',
    'The admission process at University College Of Science, Tumkur University Campus involves: 1) Obtain the application form from the college office or website. 2) Fill in the application with personal and academic details. 3) Submit the application along with required documents (PUC/10+2 marks card, Transfer Certificate, Migration Certificate, photographs, Aadhaar card, and caste/income certificate if applicable). 4) Admission is granted based on merit as per university norms. 5) Pay the prescribed fees to confirm the seat. The last date for application is announced on the college website and notice board.'
  ),
  (
    'Required Documents',
    'required documents,documents needed,documents for admission,what documents,enudu documents,ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳು',
    'documents marks card tc migration certificate photographs aadhaar caste income required admission',
    'Documents required for admission at University College Of Science, Tumkur University Campus: 1) 10th Standard Marks Card, 2) PUC/12th Marks Card, 3) Transfer Certificate (TC) from previous institution, 4) Migration Certificate (if from another board/university), 5) Caste and Income Certificate (if applicable for reservation), 6) Passport-size photographs (4 copies), 7) Aadhaar Card photocopy. Original documents must be produced for verification at the time of admission.'
  ),
  (
    'College Facilities',
    'facilities,infrastructure,amenities,college facilities enu,ಸೌಲಭ್ಯಗಳು,what facilities',
    'facilities library lab hostel canteen sports internet wifi infrastructure classroom',
    'University College Of Science, Tumkur University Campus provides the following facilities: 1) Well-equipped Computer Laboratories with latest hardware and software, 2) Central Library with a large collection of books, journals, and digital resources, 3) Separate Hostel facilities for boys and girls, 4) Canteen serving hygienic food, 5) Sports ground and indoor games, 6) High-speed Internet and Wi-Fi across campus, 7) Spacious classrooms with audio-visual aids, 8) Seminar Hall for events and guest lectures, 9) Placement Cell for career guidance, 10) Medical/First-aid facilities.'
  ),
  (
    'Important Dates',
    'important dates,admission dates,key dates,deadline,important dates enu,ಮುಖ್ಯ ದಿನಾಂಕಗಳು',
    'important dates admission last date deadline application start end 2026',
    'Important dates for BCA Admission 2026-27 at University College Of Science, Tumkur University Campus: Application Start Date: 1st August 2026, Last Date for Application Submission: 30th September 2026, Merit List Announcement: 10th October 2026, Counselling and Document Verification: 15th-20th October 2026, Classes Commence: 1st November 2026. Please check the college notice board or website for any updates to these dates.'
  ),
  (
    'College Contact',
    'contact,phone number,address,email,college contact enu,ಸಂಪರ್ಕ,how to contact',
    'contact phone address email website call reach tumkur bh road',
    'University College Of Science, Tumkur University Campus, BH Road, Tumkur - 572103. Phone: 0816-2203500. Email: ucscience@tumkuruniversity.ac.in. Website: https://tumkuruniversity.ac.in. You can visit the college office during working hours (9:00 AM to 5:00 PM, Monday to Saturday) for any enquiries regarding admissions, courses, or facilities.'
  ),
  (
    'Courses Available',
    'courses available,courses list,what courses,enudu courses,ಕೋರ್ಸ್‌ಗಳು,courses offered',
    'courses available list offered bca bsc mca science computer mathematics',
    'University College Of Science, Tumkur University Campus offers the following courses: 1) BCA - Bachelor of Computer Applications (3 years), 2) B.Sc Computer Science (3 years), 3) B.Sc Mathematics (3 years), 4) MCA - Master of Computer Applications (2 years). All undergraduate courses require PUC/10+2 qualification. Postgraduate courses require a relevant bachelor''s degree.'
  ),
  (
    'College About',
    'about college,about,college info,college enu,ಕಾಲೇಜು ಬಗ್ಗೆ,tell me about college',
    'about college information tumkur university campus science bh road history vision',
    'University College Of Science, Tumkur University Campus, is a premier institution of higher learning situated on BH Road, Tumkur - 572103. The college offers undergraduate and postgraduate programs in science and computer applications, with a strong commitment to academic excellence, research, and holistic student development. The campus provides a conducive learning environment with modern facilities, experienced faculty, and a vibrant academic community. It is affiliated to Tumkur University and follows the university curriculum and regulations.'
  ),
  (
    'Departments',
    'departments,department list,department enu,ಇಲಾಖೆಗಳು,how many departments',
    'departments computer science mathematics physics chemistry commerce',
    'University College Of Science, Tumkur University Campus has the following departments: 1) Department of Computer Science, 2) Department of Mathematics, 3) Department of Physics, 4) Department of Chemistry, 5) Department of Commerce. Each department is staffed with qualified faculty and equipped with dedicated laboratories where applicable.'
  ),
  (
    'Placements',
    'placement,placements,campus recruitment,job,placement enu,ಪ್ಲೇಸ್ಮೆಂಟ್',
    'placement campus recruitment job career company salary software',
    'University College Of Science, Tumkur University Campus has an active Placement Cell that organizes campus recruitment drives, training programs in soft skills and technical interview preparation, and career guidance sessions. Many BCA and MCA graduates have been placed in reputed IT companies. The placement cell maintains connections with industry partners to facilitate student internships and final placements.'
  ),
  (
    'Hostel Facility',
    'hostel,hostel facility,hostel fees,hostel enu,ಹಾಸ್ಟೆಲ್',
    'hostel facility boys girls accommodation fees food room',
    'Yes, the college provides separate hostel facilities for boys and girls at University College Of Science, Tumkur University Campus. The hostels offer furnished rooms, mess facilities, and a safe living environment. For details regarding hostel fees, room availability, and admission to the hostel, please contact the college office at 0816-2203500 or visit the campus at BH Road, Tumkur - 572103.'
  ),
  (
    'Medium of Instruction',
    'medium of instruction,language,english or kannada,medium enu,ಮಾಧ್ಯಮ',
    'medium instruction language english kannada teaching',
    'The medium of instruction for all courses (BCA, B.Sc, MCA) at University College Of Science, Tumkur University Campus is English. All lectures, textbooks, examinations, and study materials are in English. Students are encouraged to develop English communication skills for better career opportunities.'
  )
ON CONFLICT DO NOTHING;

-- Seed departments
INSERT INTO public.departments (name, head, description, sort_order) VALUES
  ('Department of Computer Science', 'Dr. Ramesh K', 'Offers BCA, B.Sc Computer Science, and MCA programs with modern computer labs.', 1),
  ('Department of Mathematics', 'Dr. Lakshmi Devi', 'Offers B.Sc Mathematics with focus on pure and applied mathematics.', 2),
  ('Department of Physics', 'Dr. Suresh M', 'Offers B.Sc Physics with well-equipped physics laboratories.', 3),
  ('Department of Chemistry', 'Dr. Gayathri R', 'Offers B.Sc Chemistry with modern chemistry labs.', 4),
  ('Department of Commerce', 'Dr. Narendra B', 'Offers commerce programs with industry-relevant curriculum.', 5)
ON CONFLICT DO NOTHING;
