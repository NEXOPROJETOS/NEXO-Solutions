-- Remove somente as solicitações fictícias usadas para testar o formulário.
delete from public.quote_requests
where email = 'teste@nexo.invalid'
  and company = 'TESTE — EXCLUIR APÓS VALIDAR'
returning id, name, email, company, created_at;
