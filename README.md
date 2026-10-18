# FitTrack PRO - App para iPhone (PWA) com Perfis de Aluno e Personal

Aplicativo fitness mobile-first otimizado para iPhone, com suporte a **Safe Area**, **PWA instalável**, interface no estilo nativo iOS, **sistema de Alunos e Personal Trainer** e banco de dados na nuvem (**Supabase**) sem necessidade de servidor local.

---

## 👥 Sistema de Perfis (Aluno & Professor)

### 🏋️ Visão do Aluno:
- **100% Automático**: O aluno **não precisa mexer em banco de dados ou configurações técnicas**. Ele apenas abre o app, faz login e treina.
- **Treino do Dia (Hoje)**: Executa as fichas montadas pelo seu personal com cronômetro de duração, inputs fáceis de carga e reps, vibração no iPhone e **cronômetro de descanso automático**.
- **Fichas de Treino**: Visualiza as fichas (Treino A, B, C...) criadas especificamente para ele pelo personal.
- **Controle de Peso**: Registra pesagens e vê a variação desde o início.
- **Evolução**: Gráficos de peso e evolução de cargas por exercício.

### 👨‍🏫 Visão do Professor (Personal Trainer):
- **Painel de Gestão**: Lista todos os alunos cadastrados com busca rápida.
- **Montagem de Treinos**: Entra no perfil de qualquer aluno e cria, edita ou exclui fichas (Treino A, B, etc.) e adiciona exercícios com metas de séries, repetições, descanso e carga inicial.
- **Acompanhamento**: Visualiza o histórico de treinos concluídos pelo aluno e as pesagens.
- **Simulador do Aluno**: Botão *"Simular Visão do Aluno"* para ver exatamente o que aquele aluno vê na tela dele.
- **Cadastrar Novos Alunos**: Botão para adicionar alunos diretamente pelo painel.

---

## ☁️ Como Vincular o Supabase ao seu App (Passo a Passo Simples)

Você não precisa de servidor local. O Supabase é um banco de dados PostgreSQL na nuvem gratuito.

### Passo 1: Pegar as 2 chaves no Supabase
1. Acesse [supabase.com](https://supabase.com) e entre no seu projeto.
2. No menu lateral esquerdo, clique no ícone de engrenagem (**Project Settings**).
3. Clique em **API** (ou **Data API**).
4. Lá você verá:
   - **Project URL** (algo como `https://xyzcompany.supabase.co`)
   - **Project API Keys → `anon` `public`** (chave longa começando com `eyJ...`)

### Passo 2: Criar as Tabelas no Supabase (com 1 clique)
1. No menu lateral esquerdo do Supabase, clique em **SQL Editor**.
2. Clique em **New Query**.
3. No seu app, entre como Professor, clique no ícone de banco/engrenagem no topo e clique em **"Copiar Script SQL"** (ou copie do arquivo `src/lib/supabase.ts`).
4. Cole no SQL Editor do Supabase e clique no botão verde **Run**.
5. Pronto! Todas as tabelas (`profiles`, `workout_plans`, `workout_logs`, `weight_entries`) e permissões são criadas instantaneamente.

### Passo 3: Conectar no App (ou na Vercel)
- **Opção A (Direto no App)**: No painel do professor, clique no ícone de banco no topo, cole a URL e a Anon Key e clique em **Salvar Conexão**. Ficará salvo e ativo!
- **Opção B (Automático para todos os usuários via Vercel / .env)**:
  - Crie um arquivo `.env` na raiz do projeto com:
    ```env
    VITE_SUPABASE_URL=https://seu-projeto.supabase.co
    VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui
    ```
  - Na **Vercel** (se for hospedar online): Vá em *Settings → Environment Variables*, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Assim, qualquer aluno ou professor que abrir o site já estará conectado automaticamente sem ver telas técnicas!

---

## 🚀 Como testar agora mesmo no seu iPhone ou Computador

1. No terminal do projeto, execute:
   ```bash
   npm run dev
   ```
2. Abra no navegador do computador (`http://localhost:5173`) ou no Safari do iPhone (`http://192.168.X.X:5173`).
3. Na tela inicial, utilize os botões de **Acesso Rápido para Teste**:
   - **"Visão: Igor Personal"**: abre o painel do professor.
   - **"Visão: Aluno Lucas"**: abre o app na perspectiva do aluno.
   - Ou crie uma conta nova como Aluno ou Personal!
