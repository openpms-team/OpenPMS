---
title: Instalar o OpenPMS (Guia Completo)
description: Guia passo a passo para instalar o OpenPMS gratuitamente, mesmo sem conhecimentos técnicos.
---

## Antes de Começar

Vamos instalar o OpenPMS em 15 minutos. O processo resume-se a: criar duas contas gratuitas — uma para a base de dados (onde ficam guardadas as reservas, hóspedes, etc.) e outra para o servidor (que coloca a aplicação online) — e ligá-las. No final, vai ter o seu próprio sistema de gestão a funcionar, acessível de qualquer dispositivo.

**O que vai precisar:**

- Um computador com ligação à internet
- Um endereço de email
- 15–20 minutos

---

## Passo 1: Criar a Base de Dados (Supabase)

O Supabase é o serviço gratuito que vai guardar todos os dados do OpenPMS — propriedades, reservas, hóspedes, etc. Pense nele como o "armazém de informação" da aplicação.

1. Abrir **https://supabase.com** no browser (Chrome, Safari, Firefox — qualquer um serve)
2. Clicar no botão verde **"Start your project"**
3. Criar uma conta — pode usar o email ou a conta Google
4. Depois de entrar, clicar em **"New Project"**
5. Preencher o formulário que aparece:
   - **Organization**: já vem pré-preenchido com o seu nome — deixar como está
   - **Project name**: escrever `openpms`
   - **Database Password**: escolher uma password **forte** (mínimo 12 caracteres, com letras maiúsculas, minúsculas, números e símbolos — exemplo: `Aloj@mento2024!Seguro`). **GUARDAR ESTA PASSWORD** num local seguro — vai ser precisa mais tarde
   - **Region**: escolher **"West EU (Ireland)"** — é o servidor mais perto de Portugal
   - **Pricing Plan**: manter **"Free"** (0$/mês — não paga nada)
6. Clicar no botão **"Create new project"**
7. Esperar 1–2 minutos enquanto o projecto é criado (vai ver uma barra de progresso)

### Copiar as Chaves de Acesso (IMPORTANTE)

As "chaves" são como passwords que permitem à aplicação ligar-se à base de dados. Precisa de as copiar agora.

8. No menu do lado esquerdo, clicar em **Project Settings** (o ícone da engrenagem, quase no fundo da barra lateral)
9. No sub-menu que aparece, clicar em **API**
10. Vai ver uma página com informações técnicas. Precisa de copiar **três valores**. Abra o Bloco de Notas (ou qualquer editor de texto) e copie cada um:

    - **Project URL** — está no topo da página. Começa com `https://` e acaba em `.supabase.co`. Copiar e colar no Bloco de Notas
    - **anon public** — na secção "Project API keys". É uma string longa (texto comprido) que começa com `eyJ...`. Copiar e colar no Bloco de Notas
    - **service_role** — logo abaixo da anterior. Clicar no botão **"Reveal"** para a ver. É outra string longa. Copiar e colar no Bloco de Notas

:::caution[Aviso de Segurança]
A chave `service_role` dá acesso **total** à base de dados. Tratar como uma password — **nunca partilhar** com ninguém, **nunca publicar** online. A chave `anon public` é menos sensível, mas também deve ser tratada com cuidado.
:::

---

## Passo 2: Criar as Tabelas na Base de Dados

Agora precisamos de "preparar" a base de dados — criar as tabelas onde a aplicação vai guardar as reservas, hóspedes, propriedades, etc. Este passo é o mais técnico, mas é só copiar e colar.

1. No painel do Supabase, no menu lateral esquerdo, clicar em **SQL Editor** (o ícone que parece `<>`)
2. Vai aparecer um editor de texto grande (uma caixa branca onde se pode escrever)
3. Agora vai correr **8 ficheiros**, um de cada vez e **por ordem**. Para cada ficheiro, repetir estes passos:

   **a.** Abrir esta página no browser (pode abrir num separador novo): **https://github.com/openpms-team/OpenPMS/tree/main/supabase/migrations**

   **b.** Clicar no nome do ficheiro (ver lista abaixo)

   **c.** Na página do ficheiro, clicar no botão **"Copy raw file"** — é o ícone de copiar (dois quadrados sobrepostos) que aparece no canto superior direito do conteúdo do ficheiro

   **d.** Voltar ao separador do Supabase, ao SQL Editor

   **e.** Clicar dentro da caixa de texto grande e colar o conteúdo (atalho: `Ctrl+V` no Windows, `Cmd+V` no Mac)

   **f.** Clicar no botão verde **"Run"** (no canto inferior direito)

   **g.** Esperar até aparecer uma mensagem **"Success"** a verde na parte de baixo

   **h.** **Apagar** todo o texto da caixa (seleccionar tudo com `Ctrl+A` / `Cmd+A` e apagar) antes de passar ao próximo ficheiro

**Os 8 ficheiros, por ordem:**

| # | Nome do ficheiro | O que faz |
|---|---|---|
| 1 | `001_enable_extensions.sql` | Activa funcionalidades extra da base de dados |
| 2 | `002_core_schema.sql` | Cria as tabelas principais (propriedades, reservas, hóspedes, etc.) |
| 3 | `003_rls_policies.sql` | Configura regras de segurança para proteger os dados |
| 4 | `004_seed_icao_countries.sql` | Adiciona a lista de países (para o check-in de hóspedes) |
| 5 | `005_seed_municipalities_pt.sql` | Adiciona a lista de municípios portugueses |
| 6 | `006_seed_default_templates.sql` | Adiciona modelos padrão (mensagens, emails, etc.) |
| 7 | `007_api_keys_webhooks.sql` | Configura a gestão de integrações externas |
| 8 | `008_performance_indexes.sql` | Optimiza a velocidade da base de dados |

:::caution[Atenção à Ordem]
É **muito importante** correr os ficheiros pela ordem indicada (1, 2, 3... até 8). Se aparecer uma mensagem de erro a vermelho, verificar se o ficheiro anterior foi executado com sucesso. Se necessário, correr o ficheiro anterior outra vez antes de avançar.
:::

---

## Passo 3: Instalar a Aplicação (Vercel)

O Vercel é o serviço gratuito que vai pôr a aplicação online — é como o "alojamento" do OpenPMS na internet.

1. Abrir **https://vercel.com** no browser
2. Clicar em **"Sign Up"** (canto superior direito) e criar uma conta — pode usar email, conta Google, ou conta GitHub
3. Depois de criar a conta, clicar no botão abaixo. Este link especial abre o instalador automático do OpenPMS:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenpms-team%2FOpenPMS&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ENCRYPTION_KEY&envDescription=Chaves%20do%20Supabase%20e%20chave%20de%20encripta%C3%A7%C3%A3o&envLink=https%3A%2F%2Fgithub.com%2Fopenpms-team%2FOpenPMS%2Fblob%2Fmain%2FDEPLOY.md)

4. Se o Vercel pedir para ligar uma conta **GitHub**: clicar em "Continue with GitHub". Se ainda não tiver conta no GitHub, criar uma em **https://github.com** — é gratuito, basta um email e uma password
5. Dar um nome ao projecto — por exemplo: `openpms` ou `minha-gestao`
6. Vai aparecer um formulário com **4 campos** para preencher. Usar os valores que guardou no Passo 1:

   - **NEXT_PUBLIC_SUPABASE_URL**: colar o **Project URL** que copiou (o que começa com `https://` e acaba em `.supabase.co`)
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: colar a chave **anon public** que copiou (a que começa com `eyJ...`)
   - **SUPABASE_SERVICE_ROLE_KEY**: colar a chave **service_role** que copiou
   - **ENCRYPTION_KEY**: aqui precisa de **inventar** uma password longa, com pelo menos 32 caracteres. Esta chave é usada para encriptar (proteger) dados sensíveis dentro da aplicação. Exemplo: `MinhaChaveSegura2024ParaOpenPMS!!` — **GUARDAR esta password** no Bloco de Notas junto com as outras

:::caution[Aviso de Segurança]
A **ENCRYPTION_KEY** protege dados sensíveis como chaves de API de plataformas externas e códigos de autenticação. Escolher algo longo, único e impossível de adivinhar. Guardar num local seguro — se a perder, os dados encriptados ficam inacessíveis.
:::

7. Clicar no botão **"Deploy"**
8. Esperar 2–3 minutos enquanto o Vercel constrói a aplicação (vai ver o progresso no ecrã)
9. Quando aparecer a mensagem **"Congratulations!"** com confetti, clicar em **"Continue to Dashboard"**
10. No painel que aparece, clicar no link do domínio — será algo como `minha-gestao.vercel.app`. A aplicação vai abrir num novo separador

---

## Passo 4: Configuração Inicial

Quando a aplicação abrir pela primeira vez, vai aparecer um assistente de configuração.

1. **Dados do negócio:**
   - **Nome do negócio**: escrever o nome da sua empresa de Alojamento Local
   - **Fuso horário**: `Europe/Lisbon` (já vem pré-seleccionado — não precisa de alterar)
   - **Moeda**: `EUR` (já vem pré-seleccionado)
   - **Idioma**: `Português` (já vem pré-seleccionado)

2. **Criar a conta de administrador:**
   - **Email**: o endereço de email que vai usar para entrar na aplicação
   - **Password**: mínimo 8 caracteres — usar uma password forte e diferente das anteriores

3. **Autenticação de dois factores** (opcional mas recomendado): se activar, vai precisar do telemóvel para confirmar o login — uma camada extra de segurança

4. Clicar no botão **"Vamos Começar"**

**Parabéns!** O OpenPMS está instalado e pronto a usar. Pode começar a adicionar as suas propriedades.

---

## Passo 5: Segurança (IMPORTANTE)

Agora que a aplicação está a funcionar, há alguns passos de segurança que deve fazer para proteger os seus dados e os dos seus hóspedes.

### Proteger a sua conta OpenPMS

- **Activar autenticação de dois factores**: dentro do OpenPMS, ir a **Definições > Segurança** e activar esta opção. Vai precisar de uma app como Google Authenticator ou Authy no telemóvel
- **Usar passwords únicas**: não reutilizar passwords que usa noutros serviços
- **Não partilhar credenciais**: se precisar de dar acesso a funcionários, criar contas separadas com permissões limitadas (recepcionista, limpeza, etc.)

### Proteger o Supabase

- Voltar ao painel do Supabase (**https://supabase.com/dashboard**)
- Ir a **Authentication > Providers** e verificar que apenas **"Email"** está activo — desactivar todos os outros
- Ir a **Project Settings > API** e confirmar que não partilhou as chaves com ninguém

### Cópia de Segurança

- O Supabase faz **backups automáticos diários** — no plano gratuito, mantém os últimos 7 dias
- Não precisa de fazer nada — os backups são automáticos
- Se quiser fazer um backup manual (avançado), pode usar o SQL Editor com o comando `pg_dump`

---

## Domínio Personalizado (Opcional)

Por defeito, a aplicação fica acessível num endereço como `minha-gestao.vercel.app`. Se preferir usar o seu próprio domínio (por exemplo, `app.minhaempresa.pt`), pode fazê-lo gratuitamente no Vercel:

1. No painel do Vercel, ir a **Settings > Domains**
2. Escrever o domínio pretendido e clicar **"Add"**
3. O Vercel vai mostrar instruções para configurar o DNS (as definições no seu fornecedor de domínio — onde comprou o domínio)
4. Depois de configurar o DNS, o Vercel emite automaticamente um certificado SSL gratuito (o cadeado verde no browser)

Se não sabe o que é DNS ou como configurar, peça ajuda ao fornecedor onde comprou o domínio — normalmente têm suporte por chat ou telefone.

---

## Precisa de Ajuda?

Se tiver dificuldades durante a instalação ou utilização:

- **Email de suporte**: openpms@protonmail.com — envie a sua dúvida e respondemos o mais rápido possível
- **Documentação completa**: está neste site — explore os outros guias no menu lateral
- **Reportar problemas**: em https://github.com/openpms-team/OpenPMS/issues pode descrever o problema e a equipa vai ajudar

---

## Perguntas Frequentes

### Quanto custa o OpenPMS?

Nada. O OpenPMS é **100% gratuito e de código aberto**. O Supabase e o Vercel oferecem planos gratuitos generosos que são mais do que suficientes para a maioria dos gestores de Alojamento Local.

### Os meus dados estão seguros?

Sim. Os dados ficam na **sua própria conta** Supabase — ninguém mais tem acesso. A base de dados está protegida por encriptação, políticas de segurança ao nível de cada tabela, e autenticação obrigatória. O OpenPMS é de código aberto, o que significa que qualquer pessoa pode verificar que não há código malicioso.

### Posso usar no telemóvel?

Sim. O OpenPMS foi desenhado para funcionar em qualquer dispositivo — computador, tablet ou telemóvel. Basta abrir o endereço da aplicação no browser do dispositivo.

### E se precisar de mais capacidade?

O plano gratuito do Supabase suporta até aproximadamente 500 MB de dados e 50.000 pedidos por mês — suficiente para gerir dezenas de propriedades. Se o negócio crescer e precisar de mais, o plano Pro do Supabase custa 25 $/mês. O plano gratuito do Vercel também é generoso para a maioria dos casos.

### Posso migrar os meus dados de outro sistema?

O OpenPMS vai incluir ferramentas de importação para os formatos mais comuns. Consulte a secção de integrações na documentação para mais detalhes.

### O que acontece se o Supabase ou o Vercel ficarem indisponíveis?

Ambos os serviços têm disponibilidade superior a 99,9%. Em caso de indisponibilidade temporária, os seus dados estão seguros e a aplicação volta a funcionar automaticamente quando o serviço recuperar.
