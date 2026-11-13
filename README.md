# NEXO Solutions

Site institucional responsivo com quatro demonstrações de produto navegáveis e formulário de orçamento.

## Requisitos

- Node.js 20 ou superior
- npm
- Projeto Supabase (opcional para desenvolvimento; sem configuração, o formulário abre WhatsApp ou e-mail)

## Executar localmente

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

No PowerShell, substitua os valores de `.env.local` pelas credenciais públicas do seu projeto Supabase. Para gerar a versão de produção, execute `npm run build` e, para pré-visualizar o resultado, `npm run preview`.

## Configurar Supabase

1. Crie um projeto no painel do Supabase.
2. No SQL Editor, execute [`supabase/schema.sql`](./supabase/schema.sql). A tabela `quote_requests` permite inserções anônimas pelo formulário, mas não permite leitura pública dos pedidos.
3. Copie a Project URL e a chave publicável (ou a chave `anon` legada) para `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local`.
4. Reinicie o servidor Vite após alterar as variáveis.

Use apenas uma chave publicável no navegador. Nunca coloque chaves `secret` ou `service_role` em variáveis `VITE_` nem as envie ao Git.

## Dados institucionais

Edite nome, e-mail, WhatsApp, slogan e demais informações em [`src/data/config.js`](./src/data/config.js). Serviços e projetos também ficam centralizados nesse arquivo. Os projetos de portfólio são demonstrações conceituais, com dados fictícios e sem persistência.

## Estrutura

```text
src/
  components/   Componentes de navegação e apresentação
  data/         Marca, serviços, projetos e metodologia
  lib/          Cliente e funções Supabase
  pages/        Página institucional e demonstrações
  styles/       Estilos responsivos
supabase/
  schema.sql    Tabela e política de acesso para pedidos de orçamento
```

O formulário grava no Supabase quando configurado. Caso contrário, abre WhatsApp (se configurado) ou prepara um e-mail. O backend não envia notificações por e-mail automaticamente; isso pode ser acrescentado depois com uma Edge Function.

## Publicar no GitHub Pages

O site estático é hospedado pelo GitHub Pages e usa o Supabase como backend. No repositório, configure **Settings → Pages → Source: GitHub Actions**. Em **Settings → Secrets and variables → Actions → Variables**, adicione:

- `VITE_SUPABASE_URL`: URL base do projeto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave publicável do projeto (não use uma chave `secret` ou `service_role`).

Depois de enviar alterações para `main`, o workflow em `.github/workflows/deploy.yml` instala as dependências, gera o build e publica o site. O endereço padrão será `https://lslprojetos.github.io/NEXO-Solutions/`.
