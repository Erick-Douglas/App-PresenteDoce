begin;
-- Support store-scoped reads and FK checks without changing data or access policies.
create index audit_events_store on public.audit_events(store_id);
create index catalog_products_store_category on public.catalog_products(store_id,category_name);
create index finance_entries_replacement on public.finance_entries(replaced_by);
create index finance_entries_store_order_all on public.finance_entries(store_id,order_id);
create index order_items_store_product on public.order_items(store_id,product_id);
create index orders_store_customer on public.orders(store_id,customer_id);
create index pricing_recipes_store_product on public.pricing_recipes(store_id,product_id);
create index stock_movements_store_order on public.stock_movements(store_id,order_id);
create index stock_movements_store_product on public.stock_movements(store_id,product_id);
create index store_members_user_store on public.store_members(user_id,store_id);
commit;