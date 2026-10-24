-- ═══════════════════════════════════════════════════════════════════════
--  STALLHART WIKI — KURULTAY (Forum) Şeması  (Supabase / PostgreSQL)
-- ───────────────────────────────────────────────────────────────────────
--  ÖNKOŞUL: supabase/schema.sql ÖNCE çalıştırılmış olmalı — bu dosya
--  public.profiles, public.comments, public.is_admin(), public.
--  current_user_banned() nesnelerini kullanır.
--
--  KULLANIM: Supabase paneli → SQL Editor → New query → bu dosyanın
--  TAMAMINI yapıştırın → Run. İdempotenttir, tekrar çalıştırmak veri
--  silmez.
--
--  NE KURAR
--    forum_categories   Kurultay kategorileri (sabit liste, admin yönetir)
--    forum_threads      Konu başlıkları (ilk gönderi = başlık + gövde)
--    (yanıtlar)         mevcut public.comments tablosu yeniden kullanılır:
--                        page_type = 'forum_thread', page_id = thread id
--
--  TASARIM NOTU
--    Yanıtlar için ayrı bir tablo AÇILMADI — Divan Tartışması bileşeni
--    (community-divan.js → mountComments) zaten iç içe yanıt, mühür
--    (beğeni), spoiler ve moderasyonu destekliyor. Bu yüzden bir konunun
--    yanıtları da aynı comments altyapısını, yalnızca yeni bir
--    page_type değeriyle kullanır. Tek değişiklik: aşağıdaki adım 1'de
--    comments_type_chk kısıtı 'forum_thread' değerini de kabul edecek
--    şekilde genişletiliyor.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- 0) comments TABLOSUNU KURULTAY'A AÇ
-- ───────────────────────────────────────────────────────────────────────
alter table public.comments drop constraint if exists comments_type_chk;
alter table public.comments add constraint comments_type_chk
  check (page_type in ('character', 'kingdom', 'chapter', 'house', 'god', 'lore', 'forum_thread'));


-- ───────────────────────────────────────────────────────────────────────
-- 1) KATEGORİLER
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.forum_categories (
  id          text primary key,
  name_tr     text not null,
  name_en     text not null,
  desc_tr     text not null default '',
  desc_en     text not null default '',
  icon        text not null default 'sohbet',
  sort_order  integer not null default 0,
  is_locked   boolean not null default false,   -- true: yalnızca admin konu açabilir (duyurular)
  created_at  timestamptz not null default now()
);

insert into public.forum_categories (id, name_tr, name_en, desc_tr, desc_en, icon, sort_order, is_locked) values
  ('duyuru', 'Duyurular', 'Announcements', 'Yazardan haberler, yayın takvimi ve site güncellemeleri.', 'News from the author, release schedule and site updates.', 'duyuru', 0, true),
  ('sohbet', 'Genel Sohbet', 'General Chat', 'Bölümler dışında, Stallhart üzerine serbest kürsü.', 'Open floor for anything Stallhart, outside the chapters.', 'sohbet', 1, false),
  ('teori', 'Teoriler & Analizler', 'Theories & Analysis', 'Kehanetler, ipuçları ve "asıl kim bu?" tartışmaları.', 'Prophecies, foreshadowing and "who is this really?" threads.', 'teori', 2, false),
  ('hane', 'Hane & Karakter Tartışmaları', 'House & Character Talk', 'Belirli haneler, karakterler ve aralarındaki ilişkiler.', 'Specific houses, characters and the ties between them.', 'hane', 3, false),
  ('evren', 'Evren & Dünya İnşası', 'Lore & Worldbuilding', 'Coğrafya, tanrılar, dil ve tarih üzerine derin dalışlar.', 'Deep dives into geography, gods, language and history.', 'evren', 4, false),
  ('sanat', 'Fan Sanatı & Yaratıcı Köşe', 'Fan Art & Creations', 'Çizimler, haritalar, fanfiction ve diğer üretimler.', 'Art, maps, fanfiction and other creations.', 'sanat', 5, false),
  ('oneri', 'Öneri & Geri Bildirim', 'Suggestions & Feedback', 'Site ve okuma deneyimiyle ilgili öneriler.', 'Suggestions about the site and reading experience.', 'oneri', 6, false),
  ('yardim', 'Yardım & SSS', 'Help & FAQ', 'Hesap, bildirim ve site kullanımıyla ilgili sorular.', 'Questions about accounts, notifications and site use.', 'yardim', 7, false)
on conflict (id) do update set
  name_tr = excluded.name_tr, name_en = excluded.name_en,
  desc_tr = excluded.desc_tr, desc_en = excluded.desc_en,
  icon = excluded.icon, sort_order = excluded.sort_order, is_locked = excluded.is_locked;

alter table public.forum_categories enable row level security;

drop policy if exists forum_categories_select on public.forum_categories;
create policy forum_categories_select on public.forum_categories for select using (true);
-- insert/update/delete: istemciden YOK — kategori listesi bu dosyayı yeniden çalıştırarak yönetilir.


-- ───────────────────────────────────────────────────────────────────────
-- 2) KONULAR
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.forum_threads (
  id                uuid primary key default gen_random_uuid(),
  category_id       text not null references public.forum_categories(id),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  body              text not null,
  is_pinned         boolean not null default false,
  is_locked         boolean not null default false,
  is_deleted        boolean not null default false,
  view_count        integer not null default 0,
  reply_count       integer not null default 0,
  last_activity_at  timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  constraint forum_threads_title_len check (char_length(btrim(title)) between 4 and 140),
  constraint forum_threads_body_len  check (char_length(body) <= 8000)
);

create index if not exists forum_threads_cat_idx  on public.forum_threads (category_id, is_pinned desc, last_activity_at desc);
create index if not exists forum_threads_user_idx on public.forum_threads (user_id, created_at desc);
create index if not exists forum_threads_recent_idx on public.forum_threads (is_pinned desc, last_activity_at desc);

alter table public.forum_threads enable row level security;

drop policy if exists forum_threads_select on public.forum_threads;
create policy forum_threads_select on public.forum_threads for select using (is_deleted = false or public.is_admin());

drop policy if exists forum_threads_insert on public.forum_threads;
create policy forum_threads_insert on public.forum_threads for insert to authenticated
  with check (
    user_id = auth.uid()
    and not public.current_user_banned()
    and not exists (select 1 from public.forum_categories c where c.id = category_id and c.is_locked and not public.is_admin())
  );

-- update/delete doğrudan istemciden yok: sabitleme/kilitleme/silme aşağıdaki RPC'lerden yapılır.


-- ───────────────────────────────────────────────────────────────────────
-- 3) BAŞLIK TEMİZLEME + HIZ DENETİMİ (comments_guard ile aynı desen)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.forum_threads_guard()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  last_at timestamptz;
begin
  new.title      := btrim(new.title);
  new.body       := btrim(new.body);
  new.is_pinned  := false;
  new.is_locked  := false;
  new.is_deleted := false;
  new.view_count := 0;
  new.reply_count := 0;
  new.last_activity_at := now();

  if new.body = '' then
    raise exception 'Konu içeriği boş olamaz.' using errcode = 'P0001';
  end if;

  select max(created_at) into last_at from public.forum_threads where user_id = new.user_id;
  if last_at is not null and now() - last_at < interval '30 seconds' then
    raise exception 'Çok hızlı konu açıyorsun, biraz yavaşla.' using errcode = 'P0001';
  end if;

  return new;
end
$$;

drop trigger if exists forum_threads_guard_trg on public.forum_threads;
create trigger forum_threads_guard_trg before insert on public.forum_threads
  for each row execute function public.forum_threads_guard();


-- ───────────────────────────────────────────────────────────────────────
-- 4) YANIT SAYACI + SON ETKİNLİK — comments'ten otomatik senkron
--    (yalnızca page_type = 'forum_thread' olan yorumları etkiler)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.forum_reply_sync()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  tid := coalesce(new.page_id, old.page_id)::uuid;
  if coalesce(new.page_type, old.page_type) <> 'forum_thread' then
    return coalesce(new, old);
  end if;
  update public.forum_threads t set
    reply_count = (select count(*) from public.comments c where c.page_type = 'forum_thread' and c.page_id = tid::text and c.is_deleted = false),
    last_activity_at = greatest(t.created_at, coalesce((select max(created_at) from public.comments c where c.page_type = 'forum_thread' and c.page_id = tid::text), t.created_at))
  where t.id = tid;
  return coalesce(new, old);
end
$$;

drop trigger if exists forum_reply_sync_trg on public.comments;
create trigger forum_reply_sync_trg after insert or update or delete on public.comments
  for each row execute function public.forum_reply_sync();


-- ───────────────────────────────────────────────────────────────────────
-- 5) MODERASYON RPC'LERİ (yalnızca admin)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.kurultay_set_pin(p_id uuid, p_pinned boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Yetkiniz yok.' using errcode = '42501'; end if;
  update public.forum_threads set is_pinned = p_pinned where id = p_id;
end $$;

create or replace function public.kurultay_set_lock(p_id uuid, p_locked boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Yetkiniz yok.' using errcode = '42501'; end if;
  update public.forum_threads set is_locked = p_locked where id = p_id;
end $$;

-- Silme: yazarı YA DA admin. p_purge yalnızca admin için kalıcı siler.
create or replace function public.kurultay_delete_thread(p_id uuid, p_purge boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare th public.forum_threads%rowtype;
begin
  select * into th from public.forum_threads where id = p_id;
  if not found then raise exception 'Konu bulunamadı.' using errcode = 'P0001'; end if;
  if not (th.user_id = auth.uid() or public.is_admin()) then
    raise exception 'Bu konuyu silme yetkiniz yok.' using errcode = '42501';
  end if;

  if p_purge and public.is_admin() then
    delete from public.comments where page_type = 'forum_thread' and page_id = p_id::text;
    delete from public.forum_threads where id = p_id;
    return 'purged';
  end if;

  update public.forum_threads set is_deleted = true where id = p_id;
  return 'soft';
end $$;

-- Görüntülenme sayacı: girişsiz de çağrılabilir, admin denetimi gerekmez.
create or replace function public.kurultay_bump_view(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.forum_threads set view_count = view_count + 1 where id = p_id;
$$;

grant execute on function public.kurultay_set_pin(uuid, boolean)      to authenticated;
grant execute on function public.kurultay_set_lock(uuid, boolean)     to authenticated;
grant execute on function public.kurultay_delete_thread(uuid, boolean) to authenticated;
grant execute on function public.kurultay_bump_view(uuid)             to anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────
-- 6) YANIT KİLİDİ — kilitli konuya sunucu tarafında da yanıt engeli
--    (schema.sql'deki comments_guard()'ın TAMAMI aynen korunur, tek
--    ek: page_type = 'forum_thread' ise ilgili konunun is_locked
--    durumuna bakılır. Bu blok schema.sql değişirse elle senkron
--    tutulmalıdır.)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.comments_guard()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  par     public.comments%rowtype;
  last_at timestamptz;
  th      public.forum_threads%rowtype;
begin
  new.body       := btrim(new.body);
  new.is_deleted := false;
  new.seal_count := 0;

  if new.body = '' then
    raise exception 'Yorum boş olamaz.' using errcode = 'P0001';
  end if;

  if new.parent_id is not null then
    select * into par from public.comments c where c.id = new.parent_id;
    if not found then
      raise exception 'Yanıtlanan yorum bulunamadı.' using errcode = 'P0001';
    end if;
    if par.is_deleted then
      raise exception 'Silinmiş bir yoruma yanıt verilemez.' using errcode = 'P0001';
    end if;
    if par.page_type <> new.page_type or par.page_id <> new.page_id then
      raise exception 'Yanıt, aynı sayfadaki bir yoruma verilmelidir.' using errcode = 'P0001';
    end if;
  end if;

  -- Hız sınırı: spam'e karşı (yöneticiler muaf)
  if not public.is_admin() then
    select max(c.created_at) into last_at from public.comments c where c.user_id = new.user_id;
    if last_at is not null and last_at > now() - interval '8 seconds' then
      raise exception 'Çok hızlı yorum yazıyorsunuz; birkaç saniye bekleyin.' using errcode = 'P0001';
    end if;
  end if;

  -- Kurultay: kilitli konuya yeni yanıt yasak (yönetici muaf)
  if new.page_type = 'forum_thread' and not public.is_admin() then
    select * into th from public.forum_threads t where t.id = new.page_id::uuid;
    if found and th.is_locked then
      raise exception 'Bu konu kilitlendi; yeni yanıt eklenemez.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end
$$;
-- (comments_guard_trg tetikleyicisi schema.sql'de zaten tanımlı; fonksiyon
--  "create or replace" ile güncellendiği için yeniden oluşturmaya gerek yok.)


-- ───────────────────────────────────────────────────────────────────────
-- 7) SİTE GENELİ İSTATİSTİK (Kurultay ana sayfası için ucuz sayım)
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.kurultay_stats()
returns table(threads bigint, posts bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.forum_threads where is_deleted = false),
    (select count(*) from public.comments where page_type = 'forum_thread' and is_deleted = false);
$$;
grant execute on function public.kurultay_stats() to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
--  BİTTİ. Kontrol:  select * from public.forum_categories order by sort_order;
--                    select * from public.kurultay_stats();
-- ═══════════════════════════════════════════════════════════════════════
