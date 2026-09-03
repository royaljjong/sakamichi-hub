begin;
set local search_path = extensions, public;
select plan(12);
select has_table('public', 'inquiries', 'private inquiries table exists');
select has_function('public', 'create_private_inquiry', array['text','text','text','text','text'], 'create RPC exists');
select has_function('public', 'read_private_inquiries', array['text','text'], 'read RPC exists');
select policies_are('public', 'inquiries', array[]::text[], 'no direct table policies expose inquiry rows');
select is(has_table_privilege('anon', 'public.inquiries', 'select'), false, 'anon cannot select inquiry rows directly');
select is(has_table_privilege('anon', 'public.inquiries', 'insert'), false, 'anon cannot insert inquiry rows directly');
select is(has_function_privilege('anon', 'public.create_private_inquiry(text,text,text,text,text)', 'execute'), false, 'anon cannot execute the create RPC directly');
select is(has_function_privilege('service_role', 'public.create_private_inquiry(text,text,text,text,text)', 'execute'), true, 'service role can execute the create RPC');
select is(has_function_privilege('service_role', 'public.read_private_inquiries(text,text)', 'execute'), true, 'service role can execute the read RPC');
select lives_ok(
  $$select public.create_private_inquiry('pg-tap-user', 'correct horse battery', 'general', 'Test title', 'Test body')$$,
  'valid inquiry can be created'
);
select results_eq(
  $$select count(*)::bigint from public.read_private_inquiries('pg-tap-user', 'correct horse battery')$$,
  $$values (1::bigint)$$,
  'matching ID and password return the inquiry'
);
select results_eq(
  $$select count(*)::bigint from public.read_private_inquiries('pg-tap-user', 'wrong password value')$$,
  $$values (0::bigint)$$,
  'wrong password does not expose the inquiry'
);
select * from finish();
rollback;
