-- ═══════════════════════════════════════════════════════════════════════
--  SEVİYE 1 GÖÇÜ — statik veri ve temel mantık düzeltmeleri
--  Sıra: schema.sql → forum-schema.sql → BU DOSYA.   Tekrar çalıştırmak güvenlidir.
--
--  İçerik
--   1) forum_threads: istemcinin kullandığı sütunlar (title_en, body_en, kanon, anket)
--   2) forum_threads_guard: günlük tavan, kopya engeli, yeni hesaba bağlantı yasağı,
--      kanon alanlarının istemciden yazılmasını engelleme, yönetici muafiyeti
--   3) comments_guard: aynı korumalar + geçersiz konu kimliğinde okunaklı hata
--   4) kurultay_bump_view: silinmiş konuda sayaç artmasın
--   5) Hız/tavan sorguları için indeksler
--
--  Ayarlanabilir sabitler her fonksiyonun başındaki "declare" bölümündedir.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1) Sütunlar ────────────────────────────────────────────────────────
alter table public.forum_threads
  add column if not exists title_en          text,
  add column if not exists body_en           text,
  add column if not exists is_canonized      boolean not null default false,
  add column if not exists canonized_note    text,
  add column if not exists canonized_chapter text,
  add column if not exists poll              jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'forum_threads_title_en_len') then
    alter table public.forum_threads add constraint forum_threads_title_en_len
      check (title_en is null or char_length(title_en) <= 140);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'forum_threads_body_en_len') then
    alter table public.forum_threads add constraint forum_threads_body_en_len
      check (body_en is null or char_length(body_en) <= 8000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'forum_threads_canon_len') then
    alter table public.forum_threads add constraint forum_threads_canon_len
      check ((canonized_note is null or char_length(canonized_note) <= 300)
         and (canonized_chapter is null or char_length(canonized_chapter) <= 80));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'forum_threads_poll_size') then
    alter table public.forum_threads add constraint forum_threads_poll_size
      check (poll is null or char_length(poll::text) <= 4000);
  end if;
end $$;

-- ── 5) İndeksler (günlük tavan / kopya sorguları için) ─────────────────
create index if not exists comments_user_created_idx
  on public.comments (user_id, created_at desc);
create index if not exists forum_threads_user_created_idx
  on public.forum_threads (user_id, created_at desc);

-- ── 2) Konu koruması ───────────────────────────────────────────────────
create or replace function public.forum_threads_guard()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  c_min_gap     constant interval := interval '30 seconds';
  c_daily_cap   constant int      := 10;                      -- 24 saatte en fazla konu
  c_new_acct    constant interval := interval '24 hours';     -- "yeni hesap" süresi
  last_at   timestamptz;
  acct_at   timestamptz;
  day_count int;
begin
  new.title      := btrim(new.title);
  new.body       := btrim(new.body);
  new.title_en   := nullif(btrim(coalesce(new.title_en, '')), '');
  new.body_en    := nullif(btrim(coalesce(new.body_en, '')), '');

  -- Sunucu-yönetimli alanlar: istemci bunları belirleyemez
  new.is_pinned          := false;
  new.is_locked          := false;
  new.is_deleted         := false;
  new.is_canonized       := false;
  new.canonized_note     := null;
  new.canonized_chapter  := null;
  new.view_count         := 0;
  new.reply_count        := 0;
  new.last_activity_at   := now();

  if new.body = '' then
    raise exception 'Konu içeriği boş olamaz.' using errcode = 'P0001';
  end if;

  if public.is_admin() then
    return new;                                              -- yöneticiler muaf
  end if;

  -- Hız sınırı
  select max(created_at) into last_at from public.forum_threads where user_id = new.user_id;
  if last_at is not null and now() - last_at < c_min_gap then
    raise exception 'Çok hızlı konu açıyorsun, biraz yavaşla.' using errcode = 'P0001';
  end if;

  -- Günlük tavan
  select count(*) into day_count from public.forum_threads
   where user_id = new.user_id and created_at > now() - interval '24 hours';
  if day_count >= c_daily_cap then
    raise exception 'Bugün açabileceğin konu sınırına ulaştın; yarın tekrar dene.' using errcode = 'P0001';
  end if;

  -- Kopya konu (aynı başlık, 24 saat)
  if exists (select 1 from public.forum_threads t
              where t.user_id = new.user_id
                and lower(t.title) = lower(new.title)
                and t.created_at > now() - interval '24 hours') then
    raise exception 'Aynı başlıkla zaten bir konu açtın.' using errcode = 'P0001';
  end if;

  -- Yeni hesaplarda bağlantı yasağı (spam/oltalama)
  select created_at into acct_at from public.profiles where id = new.user_id;
  if acct_at is not null and now() - acct_at < c_new_acct
     and (new.title || ' ' || new.body || ' ' || coalesce(new.body_en, '')) ~* '(https?://|www\.)' then
    raise exception 'Yeni hesaplar ilk 24 saat içinde bağlantı paylaşamaz.' using errcode = 'P0001';
  end if;

  return new;
end
$$;

-- ── 3) Yorum koruması ──────────────────────────────────────────────────
create or replace function public.comments_guard()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  c_min_gap     constant interval := interval '8 seconds';
  c_daily_cap   constant int      := 200;                     -- 24 saatte en fazla yorum
  c_dup_min_len constant int      := 20;                      -- bundan kısa yorumlar kopya sayılmaz
  c_new_acct    constant interval := interval '24 hours';
  par       public.comments%rowtype;
  last_at   timestamptz;
  acct_at   timestamptz;
  day_count int;
  th        public.forum_threads%rowtype;
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

  -- Kurultay konusu: kimlik biçimi ve kilit denetimi (yönetici kilitte de yazabilir)
  if new.page_type = 'forum_thread' then
    if new.page_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Geçersiz konu kimliği.' using errcode = 'P0001';
    end if;
    if not public.is_admin() then
      select * into th from public.forum_threads t where t.id = new.page_id::uuid;
      if found and th.is_locked then
        raise exception 'Bu konu kilitlendi; yeni yanıt eklenemez.' using errcode = 'P0001';
      end if;
    end if;
  end if;

  if public.is_admin() then
    return new;                                              -- yöneticiler hız/tavan/kopya kurallarından muaf
  end if;

  -- Hız sınırı
  select max(c.created_at) into last_at from public.comments c where c.user_id = new.user_id;
  if last_at is not null and last_at > now() - c_min_gap then
    raise exception 'Çok hızlı yorum yazıyorsunuz; birkaç saniye bekleyin.' using errcode = 'P0001';
  end if;

  -- Günlük tavan
  select count(*) into day_count from public.comments c
   where c.user_id = new.user_id and c.created_at > now() - interval '24 hours';
  if day_count >= c_daily_cap then
    raise exception 'Bugünkü yorum sınırına ulaştınız; yarın tekrar deneyin.' using errcode = 'P0001';
  end if;

  -- Kopya yorum (aynı metin, 24 saat, silinmemiş)
  if char_length(new.body) >= c_dup_min_len and exists (
       select 1 from public.comments c
        where c.user_id = new.user_id and c.is_deleted = false
          and c.body = new.body and c.created_at > now() - interval '24 hours') then
    raise exception 'Aynı yorumu tekrar gönderemezsiniz.' using errcode = 'P0001';
  end if;

  -- Yeni hesaplarda bağlantı yasağı
  select created_at into acct_at from public.profiles where id = new.user_id;
  if acct_at is not null and now() - acct_at < c_new_acct
     and new.body ~* '(https?://|www\.)' then
    raise exception 'Yeni hesaplar ilk 24 saat içinde bağlantı paylaşamaz.' using errcode = 'P0001';
  end if;

  return new;
end
$$;

-- ── 4) Görüntülenme sayacı: silinmiş konuyu artırma ────────────────────
create or replace function public.kurultay_bump_view(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.forum_threads
     set view_count = view_count + 1
   where id = p_id and is_deleted = false;
$$;
