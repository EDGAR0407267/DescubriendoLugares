-- Read-only snapshot audit. Run with an owner connection, never the anon key.
select p.id, d.slug as destination, p.slug, p.name, p.status, p.is_verified,
  array_remove(array[
    case when nullif(btrim(p.featured_image_url), '') is null then 'image' end,
    case when nullif(btrim(p.featured_image_credit), '') is null then 'image_credit' end,
    case when p.latitude is null or p.longitude is null then 'coordinates' end,
    case when p.rating is null then 'rating' end,
    case when not exists (select 1 from place_translations t where t.place_id = p.id
      and editorial_text_length(t.full_description) >= 160) then 'full_description' end,
    case when not exists (select 1 from place_categories pc where pc.place_id = p.id) then 'categories' end,
    case when not exists (select 1 from place_features pf where pf.place_id = p.id) then 'features' end,
    case when p.ranking_score is null then 'ranking_score' end,
    case when nullif(btrim(p.website), '') is null then 'website' end,
    case when nullif(btrim(p.address_line), '') is null then 'address' end,
    case when not p.is_verified then 'editorial_review' end
  ], null) as missing,
  array(select t.locale from place_translations t where t.place_id = p.id
    and place_locale_indexable(p.id, t.locale) order by t.locale) as indexable_locales,
  coalesce((select string_agg(distinct array_to_string(r.review_flags, ', '), '; ')
    from place_import_records r where r.place_id = p.id), '') as source_flags
from places p join destinations d on d.id = p.destination_id
where not p.is_demo
order by d.slug, p.slug;
