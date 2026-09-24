-- ═══════════════════════════════════════════════════════════════════════
--  STALLHART WIKI — Topluluk Katmanı Şeması  (Supabase / PostgreSQL)
-- ───────────────────────────────────────────────────────────────────────
--  KULLANIM
--    Supabase paneli → SQL Editor → New query → bu dosyanın TAMAMINI
--    yapıştırın → Run. Dosya yeniden çalıştırılabilir (idempotent):
--    ikinci kez çalıştırmak veri silmez, yalnızca fonksiyon/politikaları
--    günceller.
--
--  NE KURAR
--    profiles             Üye profili (avatar, hane, unvan, rol)
--    comments             "Divan Tartışması" yorumları (thread destekli)
--    comment_seals        Mühür (beğeni) kayıtları
--    pending_suggestions  "Vakanüvise Öneri Sun" kutusu
--    content_patches      Onaylanmış, siteye canlı bindirilen içerik yamaları
--
--  GÜVENLİK MODELİ
--    · Tüm tablolarda Row Level Security (RLS) AÇIKTIR. Sitedeki "anon"
--      anahtarı herkese açıktır; yetkiyi bu dosyadaki politikalar belirler.
--    · Rol (member/admin) ve yasak (is_banned) kullanıcı tarafından
--      değiştirilemez: sütun yetkileri kapalıdır, yalnızca yönetici RPC'leri
--      (SECURITY DEFINER) değiştirebilir.
--    · Yorum silme, öneri onay/red gibi işlemler RPC üzerinden yapılır;
--      istemciye doğrudan UPDATE/DELETE yetkisi verilmez.
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────
-- 1) PROFİLLER
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text not null,
  avatar         text not null default 'initial',
  favorite_house text,
  title          text,
  role           text not null default 'member',
  is_banned      boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint profiles_role_chk     check (role in ('member', 'admin')),
  constraint profiles_username_len check (char_length(username) between 3 and 20),
  constraint profiles_username_chr check (username !~ '[\s<>"''`&]'),
  constraint profiles_avatar_len   check (char_length(avatar) <= 24),
  constraint profiles_house_len    check (favorite_house is null or char_length(favorite_house) <= 60),
  constraint profiles_title_chk    check (title is null or (char_length(title) <= 32 and title !~* 'vakan|admin|moderat'))
);

create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username));


-- ───────────────────────────────────────────────────────────────────────
-- 2) YARDIMCI FONKSİYONLAR
-- ───────────────────────────────────────────────────────────────────────
-- Şu anki oturumdaki kullanıcı yönetici mi? (RLS politikalarında kullanılır)
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid()), false)
$$;

-- Şu anki kullanıcı yasaklı mı?
create or replace function public.current_user_banned()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select p.is_banned from public.profiles p where p.id = auth.uid()), false)
$$;

-- Kayıt formu için: kullanıcı adı boş mu? (giriş yapmadan çağrılabilir)
create or replace function public.username_available(p_name text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles p where lower(p.username) = lower(btrim(coalesce(p_name, '')))
  )
$$;


-- ───────────────────────────────────────────────────────────────────────
-- 3) YENİ ÜYE → OTOMATİK PROFİL
--    Kayıt sırasında istemci kullanıcı adını user_metadata.username olarak
--    gönderir. Geçersiz ya da alınmışsa kayıt ASLA düşmez; benzersiz bir
--    ad üretilir (kayıt akışını bozmamak için).
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  raw    text;
  uname  text;
  suffix text;
begin
  raw    := btrim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  suffix := substr(replace(new.id::text, '-', ''), 1, 5);

  if char_length(raw) between 3 and 20 and raw !~ '[\s<>"''`&]' then
    uname := raw;
  else
    uname := 'katip-' || suffix;
  end if;

  if exists (select 1 from public.profiles p where lower(p.username) = lower(uname)) then
    uname := left(uname, 14) || '-' || suffix;
  end if;

  insert into public.profiles (id, username) values (new.id, uname);
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ───────────────────────────────────────────────────────────────────────
-- 4) PROFİL POLİTİKALARI
--    Herkes profilleri okuyabilir (yorum yazarı bilgisi için).
--    Kullanıcı yalnızca KENDİ profilinde avatar / hane / unvan değiştirir.
-- ───────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

revoke insert, update, delete on public.profiles from anon, authenticated;
grant  update (avatar, favorite_house, title) on public.profiles to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 5) YORUMLAR  — "Divan Tartışması"
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  page_type  text not null,
  page_id    text not null,
  parent_id  uuid references public.comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  is_deleted boolean not null default false,
  seal_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint comments_type_chk check (page_type in ('character', 'kingdom', 'chapter', 'house', 'god', 'lore')),
  constraint comments_page_len check (char_length(page_id) between 1 and 80),
  constraint comments_body_len check (char_length(body) <= 2000)
);

create index if not exists comments_page_idx   on public.comments (page_type, page_id, created_at);
create index if not exists comments_user_idx   on public.comments (user_id, created_at desc);
create index if not exists comments_parent_idx on public.comments (parent_id);

-- Eklemeden önce: boşluk temizle, sayaçları sıfırla, thread ve hız denetimi.
create or replace function public.comments_guard()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  par     public.comments%rowtype;
  last_at timestamptz;
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

  return new;
end
$$;

drop trigger if exists comments_guard_trg on public.comments;
create trigger comments_guard_trg
  before insert on public.comments
  for each row execute function public.comments_guard();

alter table public.comments enable row level security;

drop policy if exists comments_select_all on public.comments;
create policy comments_select_all on public.comments
  for select using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (user_id = auth.uid() and not public.current_user_banned());

-- İstemci yalnızca bu beş sütunu ekleyebilir; güncelleme/silme yetkisi YOK
-- (silme → delete_comment RPC'si).
revoke insert, update, delete on public.comments from anon, authenticated;
grant  insert (page_type, page_id, parent_id, user_id, body) on public.comments to authenticated;

-- Yorum silme: sahibi veya yönetici. Yanıtı olan yorum "silindi" izine
-- dönüşür (thread bozulmasın), yanıtsız yorum tamamen kalkar.
-- p_purge = true yalnızca yöneticide çalışır ve tüm alt yanıtlarla siler.
create or replace function public.delete_comment(p_id uuid, p_purge boolean default false)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  c            public.comments%rowtype;
  has_children boolean;
begin
  select * into c from public.comments x where x.id = p_id;
  if not found then
    raise exception 'Yorum bulunamadı.' using errcode = 'P0001';
  end if;
  if not (c.user_id = auth.uid() or public.is_admin()) then
    raise exception 'Bu yorumu silme yetkiniz yok.' using errcode = '42501';
  end if;

  if p_purge and public.is_admin() then
    delete from public.comments x where x.id = p_id;
    return 'purged';
  end if;

  select exists (select 1 from public.comments x where x.parent_id = p_id) into has_children;
  if has_children then
    update public.comments x set is_deleted = true, body = '' where x.id = p_id;
    return 'soft';
  end if;

  delete from public.comments x where x.id = p_id;
  return 'hard';
end
$$;


-- ───────────────────────────────────────────────────────────────────────
-- 6) MÜHÜR (beğeni)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.comment_seals (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create or replace function public.seal_count_sync()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments c set seal_count = c.seal_count + 1 where c.id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.comments c set seal_count = greatest(c.seal_count - 1, 0) where c.id = old.comment_id;
  end if;
  return null;
end
$$;

drop trigger if exists comment_seals_sync_trg on public.comment_seals;
create trigger comment_seals_sync_trg
  after insert or delete on public.comment_seals
  for each row execute function public.seal_count_sync();

alter table public.comment_seals enable row level security;

-- Kullanıcı yalnızca KENDİ mühürlerini görür (toplam sayı comments.seal_count'ta).
drop policy if exists seals_select_own on public.comment_seals;
create policy seals_select_own on public.comment_seals
  for select to authenticated using (user_id = auth.uid());

drop policy if exists seals_insert_own on public.comment_seals;
create policy seals_insert_own on public.comment_seals
  for insert to authenticated
  with check (user_id = auth.uid() and not public.current_user_banned());

drop policy if exists seals_delete_own on public.comment_seals;
create policy seals_delete_own on public.comment_seals
  for delete to authenticated using (user_id = auth.uid());

revoke insert, update, delete on public.comment_seals from anon, authenticated;
grant  insert (comment_id, user_id) on public.comment_seals to authenticated;
grant  delete on public.comment_seals to authenticated;
revoke select on public.comment_seals from anon;


-- ───────────────────────────────────────────────────────────────────────
-- 7) ÖNERİ KUTUSU — "Vakanüvise Öneri Sun"
--    Tablo adı istenildiği gibi pending_suggestions. Onaylanan / reddedilen
--    kayıtlar da burada (status sütunuyla) kalır; böylece kullanıcı
--    profilinde geçmişini görür.
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.pending_suggestions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  page_url    text,
  title       text not null,
  message     text not null default '',
  patch       jsonb,
  status      text not null default 'pending',
  admin_note  text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint sugg_kind_chk    check (kind in ('fix', 'new_character', 'new_term', 'other')),
  constraint sugg_status_chk  check (status in ('pending', 'approved', 'rejected')),
  constraint sugg_title_len   check (char_length(title) between 3 and 140),
  constraint sugg_message_len check (char_length(message) <= 4000),
  constraint sugg_url_len     check (page_url is null or char_length(page_url) <= 300),
  constraint sugg_note_len    check (admin_note is null or char_length(admin_note) <= 1000),
  constraint sugg_patch_size  check (patch is null or octet_length(patch::text) <= 20000)
);

create index if not exists sugg_status_idx on public.pending_suggestions (status, created_at desc);
create index if not exists sugg_user_idx   on public.pending_suggestions (user_id, created_at desc);

-- Bir kullanıcının bekleyen öneri sayısı sınırlıdır (kutuyu doldurmasın).
create or replace function public.suggestions_guard()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  new.title      := btrim(new.title);
  new.status     := 'pending';
  new.admin_note := null;
  new.reviewed_by := null;
  new.reviewed_at := null;

  if (select count(*) from public.pending_suggestions s
        where s.user_id = new.user_id and s.status = 'pending') >= 15 then
    raise exception 'En fazla 15 bekleyen öneriniz olabilir. Vakanüvisin bakmasını bekleyin.'
      using errcode = 'P0001';
  end if;
  return new;
end
$$;

drop trigger if exists suggestions_guard_trg on public.pending_suggestions;
create trigger suggestions_guard_trg
  before insert on public.pending_suggestions
  for each row execute function public.suggestions_guard();

alter table public.pending_suggestions enable row level security;

drop policy if exists sugg_select on public.pending_suggestions;
create policy sugg_select on public.pending_suggestions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists sugg_insert_own on public.pending_suggestions;
create policy sugg_insert_own on public.pending_suggestions
  for insert to authenticated
  with check (user_id = auth.uid() and not public.current_user_banned());

-- Kullanıcı yalnızca BEKLEYEN kendi önerisini geri çekebilir.
drop policy if exists sugg_delete_own_pending on public.pending_suggestions;
create policy sugg_delete_own_pending on public.pending_suggestions
  for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

revoke all on public.pending_suggestions from anon, authenticated;
grant  select, delete on public.pending_suggestions to authenticated;
grant  insert (user_id, kind, page_url, title, message, patch) on public.pending_suggestions to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 8) İÇERİK YAMALARI — onaylanan önerilerin canlı bindirmesi
--    Site, data/*.json dosyalarını yükledikten sonra bu tablodaki
--    (merged_at IS NULL) yamaları üzerine uygular. JSON'a işlendiğinde
--    (elle dışa aktarma veya GitHub Action ile) merged_at doldurulur ve
--    yama artık siteye bindirilmez.
--
--    path  : JSON içindeki dizinin noktalı yolu ("characters", "glossary",
--            "provinces.*.houses" …); "*" dizideki her öğe demektir.
--    op    : upsert (yoksa ekle, varsa alan alan birleştir)
--            merge  (yalnızca varsa birleştir)
--            delete (kaydı sil)
-- ───────────────────────────────────────────────────────────────────────
create table if not exists public.content_patches (
  id            uuid primary key default gen_random_uuid(),
  file          text not null,
  path          text not null,
  record_id     text not null,
  op            text not null,
  data          jsonb not null default '{}'::jsonb,
  suggestion_id uuid references public.pending_suggestions(id) on delete set null,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  merged_at     timestamptz,
  constraint patches_file_chk check (file in (
    'characters.json', 'chapters.json', 'quotes.json', 'lore.json',
    'houses.json', 'kingdoms.json', 'geography.json', 'language.json')),
  constraint patches_path_chk   check (path ~ '^[A-Za-z0-9_.*-]{1,80}$'),
  constraint patches_record_len check (char_length(record_id) between 1 and 120),
  constraint patches_op_chk     check (op in ('upsert', 'merge', 'delete')),
  constraint patches_data_obj   check (jsonb_typeof(data) = 'object'),
  constraint patches_data_size  check (octet_length(data::text) <= 40000)
);

create index if not exists patches_open_idx on public.content_patches (created_at) where merged_at is null;

alter table public.content_patches enable row level security;

-- Herkes YALNIZCA henüz JSON'a işlenmemiş yamaları okur; yönetici hepsini.
drop policy if exists patches_select on public.content_patches;
create policy patches_select on public.content_patches
  for select using (merged_at is null or public.is_admin());

drop policy if exists patches_admin_write on public.content_patches;
create policy patches_admin_write on public.content_patches
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.content_patches from anon, authenticated;
grant  select on public.content_patches to anon, authenticated;
grant  insert, update, delete on public.content_patches to authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 9) YÖNETİCİ RPC'LERİ
-- ───────────────────────────────────────────────────────────────────────
-- Öneriyi onayla: yamayı content_patches'e yazar + öneriyi 'approved' yapar
-- (tek işlem). p_patch verilmezse öneride kayıtlı yama kullanılır; ikisi de
-- yoksa (genel not) yalnızca 'approved' işaretlenir.
create or replace function public.approve_suggestion(
  p_id    uuid,
  p_patch jsonb default null,
  p_note  text  default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  s      public.pending_suggestions%rowtype;
  fin    jsonb;
  pid    uuid;
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yöneticiler öneri onaylayabilir.' using errcode = '42501';
  end if;

  select * into s from public.pending_suggestions x where x.id = p_id for update;
  if not found then
    raise exception 'Öneri bulunamadı.' using errcode = 'P0001';
  end if;
  if s.status <> 'pending' then
    raise exception 'Bu öneri zaten işlenmiş.' using errcode = 'P0001';
  end if;

  -- JSON 'null' değeri de "verilmedi" sayılır (istemciler null'ı bu biçimde gönderebilir)
  fin := case when p_patch is null or jsonb_typeof(p_patch) = 'null' then s.patch else p_patch end;

  if fin is not null and jsonb_typeof(fin) = 'object' then
    insert into public.content_patches (file, path, record_id, op, data, suggestion_id, created_by)
    values (
      fin ->> 'file', fin ->> 'path', fin ->> 'record_id', fin ->> 'op',
      coalesce(fin -> 'data', '{}'::jsonb), s.id, auth.uid()
    )
    returning id into pid;
  end if;

  update public.pending_suggestions x
     set status      = 'approved',
         patch       = coalesce(fin, x.patch),
         admin_note  = nullif(btrim(coalesce(p_note, '')), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where x.id = s.id;

  return pid;
end
$$;

create or replace function public.reject_suggestion(p_id uuid, p_note text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yöneticiler öneri reddedebilir.' using errcode = '42501';
  end if;

  update public.pending_suggestions x
     set status      = 'rejected',
         admin_note  = nullif(btrim(coalesce(p_note, '')), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where x.id = p_id and x.status = 'pending';

  if not found then
    raise exception 'Bekleyen öneri bulunamadı.' using errcode = 'P0001';
  end if;
end
$$;

-- JSON dosyaları depoya işlendikten sonra yamaları "işlendi" say.
-- p_ids boşsa bekleyen tüm yamalar; doluysa yalnızca listedekiler.
create or replace function public.mark_patches_merged(p_ids uuid[] default null)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yöneticiler bu işlemi yapabilir.' using errcode = '42501';
  end if;

  update public.content_patches x
     set merged_at = now()
   where x.merged_at is null
     and (p_ids is null or x.id = any (p_ids));
  get diagnostics n = row_count;
  return n;
end
$$;

-- Kullanıcı listesi (e-posta dahil) — yalnızca yönetici.
create or replace function public.admin_list_users()
returns table (
  id               uuid,
  username         text,
  email            text,
  role             text,
  is_banned        boolean,
  created_at       timestamptz,
  comment_count    bigint,
  suggestion_count bigint
)
language plpgsql security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yöneticiler kullanıcı listesini görebilir.' using errcode = '42501';
  end if;

  return query
    select p.id,
           p.username,
           u.email::text,
           p.role,
           p.is_banned,
           p.created_at,
           (select count(*) from public.comments c
              where c.user_id = p.id and not c.is_deleted),
           (select count(*) from public.pending_suggestions s
              where s.user_id = p.id)
      from public.profiles p
      left join auth.users u on u.id = p.id
     order by p.created_at desc;
end
$$;

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yöneticiler rol değiştirebilir.' using errcode = '42501';
  end if;
  if p_role not in ('member', 'admin') then
    raise exception 'Geçersiz rol.' using errcode = 'P0001';
  end if;
  if p_user = auth.uid() then
    raise exception 'Kendi rolünüzü değiştiremezsiniz.' using errcode = 'P0001';
  end if;

  update public.profiles x set role = p_role where x.id = p_user;
  if not found then
    raise exception 'Kullanıcı bulunamadı.' using errcode = 'P0001';
  end if;
end
$$;

create or replace function public.admin_set_ban(p_user uuid, p_banned boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Yalnızca yöneticiler yasak koyabilir.' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'Kendinize yasak koyamazsınız.' using errcode = 'P0001';
  end if;

  update public.profiles x set is_banned = coalesce(p_banned, false)
   where x.id = p_user and x.role <> 'admin';
  if not found then
    raise exception 'Kullanıcı bulunamadı ya da yönetici hesabına yasak konamaz.' using errcode = 'P0001';
  end if;
end
$$;


-- ───────────────────────────────────────────────────────────────────────
-- 10) FONKSİYON YETKİLERİ
--     Yönetici fonksiyonları yalnızca giriş yapmış kullanıcıya açılır
--     (yine de her biri içeride is_admin() denetler).
-- ───────────────────────────────────────────────────────────────────────
revoke all on function public.approve_suggestion(uuid, jsonb, text) from public, anon;
revoke all on function public.reject_suggestion(uuid, text)         from public, anon;
revoke all on function public.mark_patches_merged(uuid[])           from public, anon;
revoke all on function public.admin_list_users()                    from public, anon;
revoke all on function public.admin_set_role(uuid, text)            from public, anon;
revoke all on function public.admin_set_ban(uuid, boolean)          from public, anon;
revoke all on function public.delete_comment(uuid, boolean)         from public, anon;

grant execute on function public.approve_suggestion(uuid, jsonb, text) to authenticated;
grant execute on function public.reject_suggestion(uuid, text)         to authenticated;
grant execute on function public.mark_patches_merged(uuid[])           to authenticated;
grant execute on function public.admin_list_users()                    to authenticated;
grant execute on function public.admin_set_role(uuid, text)            to authenticated;
grant execute on function public.admin_set_ban(uuid, boolean)          to authenticated;
grant execute on function public.delete_comment(uuid, boolean)         to authenticated;
grant execute on function public.username_available(text)              to anon, authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- 11) İLK YÖNETİCİYİ ATAMA  (bir kez, elle)
--     1. Sitede normal kayıt olun (Kâtip hesabı oluşur).
--     2. Aşağıdaki satırı, e-postanızı yazarak SQL Editor'da çalıştırın.
--     (Satırın başındaki "--" işaretlerini kaldırın.)
-- ───────────────────────────────────────────────────────────────────────
-- update public.profiles
--    set role = 'admin'
--  where id = (select id from auth.users where email = 'SIZIN-EPOSTANIZ@ornek.com');
