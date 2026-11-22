-- Dummy content to judge the design with real data. Everything is tagged 'contoh' (or named "Contoh") so it is
-- easy to find and delete later. Safe to run twice: rows with an existing slug or name are skipped.

insert into app_owner values ('babacokis@gmail.com') on conflict do nothing;

-- ── Writing: two per category, both languages, with code, images, quotes and lists ──
insert into entries (type, visibility, slug, category, tags, title_id, title_en, excerpt_id, excerpt_en, body_id, body_en, published_at) values
('article', 'public', 'membangun-personal-os-minggu-pertama', 'work', '{contoh,nextjs,supabase}',
 'Membangun Personal OS: minggu pertama', 'Building a Personal OS: week one',
 'Portofolio yang sekaligus jadi tempat saya mengatur hidup. Ini catatan minggu pertamanya.',
 'A portfolio that doubles as the place I run my life from. Notes from the first week.',
 '<p>Saya ingin satu tempat untuk semuanya: karya, tulisan, kalender, dan keuangan. Minggu pertama habis untuk fondasi.</p><h2>Yang sudah jalan</h2><ul><li>Halaman depan dengan cerita yang dibuka sambil menggulir</li><li>Admin untuk tulisan dan proyek</li><li>Keamanan data lewat Row Level Security</li></ul><p>Aturan aksesnya sederhana: pengunjung hanya bisa membaca yang publik.</p><pre><code>create policy "public reads shared entries" on entries for select
  using (visibility in (''public'', ''unlisted''));</code></pre><blockquote><p>Sistem yang baik itu membosankan dari luar dan rapi di dalam.</p></blockquote><p>Minggu depan: kalender dan pencatatan keuangan.</p>',
 '<p>I want one place for everything: work, writing, calendar and money. Week one went into the foundations.</p><h2>What works</h2><ul><li>A home page that tells its story as you scroll</li><li>An admin for writing and projects</li><li>Data safety through Row Level Security</li></ul><p>The access rule is simple: visitors can only read what is public.</p><pre><code>create policy "public reads shared entries" on entries for select
  using (visibility in (''public'', ''unlisted''));</code></pre><blockquote><p>Good systems are boring on the outside and tidy on the inside.</p></blockquote><p>Next week: calendar and money tracking.</p>',
 now() - interval '2 days'),

('article', 'public', 'monitor-panel-surya-esp32', 'work', '{contoh,esp32,hardware}',
 'Monitor panel surya dengan ESP32', 'A solar panel monitor with an ESP32',
 'Dari sensor arus murah sampai grafik di HP: membaca produksi listrik atap rumah.',
 'From a cheap current sensor to a chart on my phone: reading the roof''s power output.',
 '<p>Panel surya di rumah tidak punya monitor. Jadi saya buat sendiri dengan ESP32 dan sensor INA219.</p><img src="https://picsum.photos/seed/jejak-solar/1200/700" alt="Rangkaian ESP32 di atas papan percobaan"><h2>Membaca sensor</h2><pre><code>#include &lt;Adafruit_INA219.h&gt;
Adafruit_INA219 ina;

void loop() {
  float watt = ina.getPower_mW() / 1000.0;
  Serial.printf("%.2f W\n", watt);
  delay(1000);
}</code></pre><p>Kalibrasi ternyata bagian tersulit: hasil awal meleset hampir 8% sampai shunt-nya diukur ulang.</p>',
 '<p>The solar panels at home have no monitor. So I built one with an ESP32 and an INA219 sensor.</p><img src="https://picsum.photos/seed/jejak-solar/1200/700" alt="ESP32 circuit on a breadboard"><h2>Reading the sensor</h2><pre><code>#include &lt;Adafruit_INA219.h&gt;
Adafruit_INA219 ina;

void loop() {
  float watt = ina.getPower_mW() / 1000.0;
  Serial.printf("%.2f W\n", watt);
  delay(1000);
}</code></pre><p>Calibration turned out to be the hard part: early readings were off by almost 8% until I re-measured the shunt.</p>',
 now() - interval '9 days'),

('article', 'public', 'belajar-rtos-dari-nol', 'learn', '{contoh,rtos,stm32}',
 'Belajar RTOS dari nol di STM32', 'Learning an RTOS from scratch on an STM32',
 'Kenapa satu loop besar tidak cukup lagi, dan apa yang berubah saat tugas dibagi.',
 'Why one big loop stopped being enough, and what changed once the work was split into tasks.',
 '<p>Selama ini semua firmware saya berupa satu <code>while(1)</code> besar. Begitu ada tiga sensor dan satu layar, mulai berantakan.</p><h2>Tiga hal yang saya pelajari</h2><ol><li>Tugas itu murah, tapi stack-nya tidak</li><li>Queue lebih aman daripada variabel global</li><li>Prioritas yang salah bisa membuat sistem terlihat hang</li></ol><pre><code>xTaskCreate(readSensors, "sensors", 256, NULL, 2, NULL);
xTaskCreate(drawScreen,  "screen",  512, NULL, 1, NULL);
vTaskStartScheduler();</code></pre><p>Masih banyak yang belum saya pahami, terutama soal mutex. Itu untuk tulisan berikutnya.</p>',
 '<p>Until now all my firmware was one big <code>while(1)</code>. With three sensors and a screen, it started to fall apart.</p><h2>Three things I learned</h2><ol><li>Tasks are cheap, their stacks are not</li><li>Queues are safer than globals</li><li>Wrong priorities can make a system look frozen</li></ol><pre><code>xTaskCreate(readSensors, "sensors", 256, NULL, 2, NULL);
xTaskCreate(drawScreen,  "screen",  512, NULL, 1, NULL);
vTaskStartScheduler();</code></pre><p>There is a lot I still do not understand, mutexes especially. That is for the next post.</p>',
 now() - interval '16 days'),

('article', 'public', 'catatan-membaca-datasheet', 'learn', '{contoh,hardware}',
 'Cara saya membaca datasheet', 'How I read a datasheet',
 'Seratus halaman, tapi yang penting biasanya hanya lima. Begini cara saya mencarinya.',
 'A hundred pages, but usually only five matter. This is how I find them.',
 '<p>Datasheet bukan buku untuk dibaca dari depan. Saya selalu mulai dari tiga tempat:</p><ul><li><strong>Absolute maximum ratings</strong>, supaya tidak ada yang terbakar</li><li><strong>Typical application</strong>, rangkaian yang sudah pasti jalan</li><li><strong>Timing diagram</strong>, kalau ada komunikasi</li></ul><img src="https://picsum.photos/seed/jejak-datasheet/1200/700" alt="Halaman datasheet dengan catatan tangan"><p>Sisanya saya baca saat ada masalah.</p>',
 '<p>A datasheet is not a book to read front to back. I always start in three places:</p><ul><li><strong>Absolute maximum ratings</strong>, so nothing burns</li><li><strong>Typical application</strong>, a circuit known to work</li><li><strong>Timing diagram</strong>, when there is communication</li></ul><img src="https://picsum.photos/seed/jejak-datasheet/1200/700" alt="Datasheet page with handwritten notes"><p>The rest I read when something goes wrong.</p>',
 now() - interval '30 days'),

('article', 'public', 'kenapa-saya-mendokumentasikan-semuanya', 'thought', '{contoh}',
 'Kenapa saya mulai mendokumentasikan semuanya', 'Why I started documenting everything',
 'Ingatan itu bocor. Tulisan tidak.', 'Memory leaks. Writing does not.',
 '<p>Tahun lalu saya memperbaiki masalah yang sama tiga kali, karena lupa bagaimana saya memperbaikinya pertama kali.</p><blockquote><p>Kalau tidak ditulis, sebenarnya belum selesai.</p></blockquote><p>Sejak itu semua yang saya kerjakan saya tulis, sekecil apa pun. Bukan untuk orang lain, tapi untuk saya enam bulan lagi.</p><p>Situs ini adalah versi publik dari kebiasaan itu.</p>',
 '<p>Last year I fixed the same problem three times, because I forgot how I fixed it the first time.</p><blockquote><p>If it is not written down, it is not really done.</p></blockquote><p>Since then I write down everything I work on, however small. Not for others, but for me six months from now.</p><p>This site is the public version of that habit.</p>',
 now() - interval '5 days'),

('article', 'public', 'teknologi-yang-tenang', 'thought', '{contoh}',
 'Teknologi yang tenang', 'Calm technology',
 'Alat terbaik adalah yang tidak minta diperhatikan.', 'The best tools are the ones that do not ask for attention.',
 '<p>Lampu indikator yang berkedip terus, notifikasi yang tidak penting, dashboard dengan dua puluh angka. Semua itu bising.</p><p>Saya lebih suka sistem yang diam saat semuanya baik, dan bicara jelas saat ada yang salah.</p><img src="https://picsum.photos/seed/jejak-calm/1200/700" alt="Meja kerja yang rapi"><p>Itu juga alasan halaman ini sederhana.</p>',
 '<p>Indicator lights that never stop blinking, pointless notifications, dashboards with twenty numbers. All of it is noise.</p><p>I prefer systems that stay quiet when all is well, and speak clearly when something is wrong.</p><img src="https://picsum.photos/seed/jejak-calm/1200/700" alt="A tidy desk"><p>That is also why this page is simple.</p>',
 now() - interval '21 days')
on conflict (slug) do nothing;

-- Private side: notes, ideas at different stages, a draft.
insert into entries (type, visibility, idea_stage, tags, title_id, body_id)
select * from (values
  ('note', 'private', null, '{contoh}'::text[], 'Contoh: rapat dengan klien HMI', '<p>Mereka butuh tampilan alarm yang lebih jelas. Kirim mockup Jumat.</p>'),
  ('note', 'private', null, '{contoh}'::text[], 'Contoh: daftar belanja komponen', '<ul><li>INA219 x2</li><li>Kapasitor 100uF</li><li>Header pin</li></ul>'),
  ('idea', 'private', 'new', '{contoh}'::text[], 'Contoh: jam meja dengan e-ink', '<p>Menampilkan agenda hari ini dari kalender.</p>'),
  ('idea', 'private', 'exploring', '{contoh}'::text[], 'Contoh: bot pencatat pengeluaran', '<p>Kirim foto struk, otomatis masuk ke keuangan.</p>'),
  ('idea', 'private', 'new', '{contoh}'::text[], 'Contoh: seri tulisan tentang PCB pertama', ''),
  ('article', 'draft', null, '{contoh}'::text[], 'Contoh draft: desain PCB empat lapis', '<p>Belum selesai…</p>')
) as v(type, visibility, idea_stage, tags, title_id, body_id)
where not exists (select 1 from entries where title_id = v.title_id);

-- ── Projects: articles in the 'project' category; the featured ones are the home page's selected work ──
insert into entries (type, visibility, slug, category, featured, published_at, tags, title_id, title_en, excerpt_id, excerpt_en, body_id, body_en)
select 'article', 'public', v.slug, 'project', v.featured, make_timestamptz(v.year, 6, 1, 0, 0, 0),
       '{contoh}'::text[] || v.tags::text[] || v.stack::text[], v.title_id, v.title_en, v.summary_id, v.summary_en, v.body_id, v.body_en
from (values
('personal-os', true, true, 'building', 1, 2026, '{Software}', '{Next.js,Supabase,TypeScript}', '[{"label":"GitHub","url":"https://github.com"}]',
 'Personal OS', 'Personal OS', 'Portofolio yang sekaligus jadi tempat saya mengatur kalender, catatan, dan keuangan.', 'A portfolio that is also where I run my calendar, notes and money.',
 '<p>Situs yang sedang Anda lihat. Sisi depan untuk publik, sisi belakang untuk saya.</p>', '<p>The site you are looking at. The front is public, the back is mine.</p>'),
('monitor-panel-surya', true, true, 'done', 2, 2026, '{Hardware}', '{ESP32,INA219,C++}', '[]',
 'Monitor panel surya', 'Solar panel monitor', 'Mengukur produksi listrik atap rumah dan menampilkannya di HP.', 'Measures the roof''s power output and shows it on a phone.',
 '<p>Lihat tulisan lengkapnya di bagian Tulisan.</p>', '<p>The full write-up is in Writing.</p>'),
('hmi-lini-produksi', true, true, 'done', 3, 2025, '{Industri}', '{Node-RED,Modbus,PLC}', '[]',
 'HMI lini produksi', 'Production line HMI', 'Layar operator untuk memantau mesin dan alarm secara langsung.', 'An operator screen to watch machines and alarms live.', '', ''),
('pengendali-motor-stm32', true, false, 'done', 4, 2025, '{Embedded}', '{STM32,FreeRTOS,C}', '[]',
 'Pengendali motor STM32', 'STM32 motor controller', 'Kontrol kecepatan motor BLDC dengan umpan balik.', 'Closed-loop speed control for a BLDC motor.', '', ''),
('dashboard-energi-gedung', true, false, 'archived', 5, 2024, '{Software}', '{React,InfluxDB,Grafana}', '[]',
 'Dashboard energi gedung', 'Building energy dashboard', 'Pemakaian listrik per lantai dalam satu layar.', 'Power use per floor on one screen.', '', ''),
('sensor-kualitas-udara', true, false, 'building', 6, 2026, '{Hardware}', '{ESP32,SEN55,KiCad}', '[]',
 'Sensor kualitas udara', 'Air quality sensor', 'Papan sensor buatan sendiri untuk PM2.5, suhu, dan kelembapan.', 'A home-made sensor board for PM2.5, temperature and humidity.', '', '')
) as v(slug, visible, featured, status, sort, year, tags, stack, links, title_id, title_en, summary_id, summary_en, body_id, body_en)
where not exists (select 1 from entries where slug = v.slug);

-- Thumbnails on some posts only, so both the photo and the generated default cover can be judged.
update entries set cover_url = 'https://picsum.photos/seed/' || slug || '/1200/800'
where cover_url is null and slug in ('personal-os', 'monitor-panel-surya', 'membangun-personal-os-minggu-pertama');


-- Journal: two short days, private.
insert into entries (type, visibility, tags, title_id, body_id, created_at)
select * from (values
  ('journal', 'private', '{contoh}'::text[], 'Contoh jurnal: hari yang tenang', '<p>Pagi menyolder papan sensor, sore menulis. Satu hal yang saya pelajari: ukur dulu, baru potong.</p>', now() - interval '1 day'),
  ('journal', 'private', '{contoh}'::text[], 'Contoh jurnal: demo ke klien', '<p>Demo HMI lancar. Mereka minta warna alarm dibedakan untuk tiap mesin.</p>', now() - interval '3 days')
) as v(type, visibility, tags, title_id, body_id, created_at)
where not exists (select 1 from entries where title_id = v.title_id);

-- ── Money: two accounts, a few categories, this month's spending and a budget ──
insert into accounts (name, kind, opening_balance)
select * from (values ('Contoh BCA', 'bank', 5000000), ('Contoh GoPay', 'ewallet', 250000)) as v(name, kind, opening_balance)
where not exists (select 1 from accounts where name = v.name);

insert into categories (name, kind) values ('Makan', 'expense'), ('Transport', 'expense'), ('Langganan', 'expense'), ('Komponen', 'expense'), ('Gaji', 'income')
on conflict do nothing;

insert into transactions (date, amount, account_id, category_id, note)
select current_date - d, amount, (select id from accounts where name = acc), (select id from categories where name = cat), 'Contoh: ' || note
from (values
  (0, 32000, 'Contoh GoPay', 'Makan', 'makan siang'),
  (0, 15000, 'Contoh GoPay', 'Transport', 'ojek ke kantor'),
  (1, 54000, 'Contoh BCA', 'Makan', 'makan malam'),
  (2, 186000, 'Contoh BCA', 'Komponen', 'sensor INA219'),
  (3, 89000, 'Contoh BCA', 'Langganan', 'internet'),
  (4, 6500000, 'Contoh BCA', 'Gaji', 'gaji bulan ini')
) as v(d, amount, acc, cat, note)
-- once per month, so re-running the seed keeps this month's pages filled and earlier months become history
where not exists (select 1 from transactions where note like 'Contoh:%' and date >= date_trunc('month', current_date));

insert into budgets (month, category_id, amount)
select date_trunc('month', current_date)::date, id, 1500000 from categories where name = 'Makan'
on conflict do nothing;

-- ── Messages from the contact form ──
insert into messages (name, email, body)
select * from (values
  ('Contoh Rina', 'rina@example.com', 'Halo! Saya tertarik dengan monitor panel suryanya. Apakah bisa dibuat untuk kantor kami?'),
  ('Contoh Budi', 'budi@example.com', 'Tulisan RTOS-nya membantu sekali. Ditunggu bagian mutex-nya.')
) as v(name, email, body)
where not exists (select 1 from messages where name = v.name);

-- ── Comments: a thread with a visitor reply and the author's answer, and a single comment elsewhere ──
with post as (select id from entries where slug = 'belajar-rtos-dari-nol'),
c1 as (
  insert into comments (entry_id, name, body, created_at)
  select id, 'Contoh Dimas', 'Penjelasan soal prioritas task-nya jelas sekali. Apakah nanti dibahas juga soal priority inversion?', now() - interval '2 days' from post
  where not exists (select 1 from comments where name = 'Contoh Dimas')
  returning id, entry_id
),
c2 as (
  insert into comments (entry_id, parent_id, name, body, created_at)
  select entry_id, id, 'Contoh Sari', 'Ikut nunggu juga! Saya pernah kena masalah itu di proyek tugas akhir.', now() - interval '1 day' from c1
  returning id, entry_id
)
insert into comments (entry_id, parent_id, name, body, by_owner, created_at)
select entry_id, id, 'Muhammad Zaidan', 'Ada di bagian berikutnya, sekalian contoh mutex dengan priority inheritance.', true, now() - interval '20 hours' from c1;

insert into comments (entry_id, name, body, created_at)
select id, 'Contoh Andre', 'Setuju soal teknologi yang tenang. Notifikasi di HP saya sekarang tinggal tiga aplikasi.', now() - interval '5 hours'
from entries where slug = 'teknologi-yang-tenang'
and not exists (select 1 from comments where name = 'Contoh Andre');

insert into comment_emails
select c.id, lower(replace(split_part(c.name, ' ', 2), ' ', '')) || '@example.com'
from comments c where c.name like 'Contoh %' and not exists (select 1 from comment_emails e where e.comment_id = c.id);
