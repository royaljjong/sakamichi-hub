revoke execute on function public.create_private_inquiry(text, text, text, text, text) from anon, authenticated;
revoke execute on function public.read_private_inquiries(text, text) from anon, authenticated;

grant execute on function public.create_private_inquiry(text, text, text, text, text) to service_role;
grant execute on function public.read_private_inquiries(text, text) to service_role;
