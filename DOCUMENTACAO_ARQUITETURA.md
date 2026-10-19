# 📘 Documentação de Arquitetura: Git, GitHub, Vercel & Supabase

Este documento explica didaticamente como funciona todo o ecossistema do **FitTrack PRO** e o ciclo de vida do código desde a sua máquina até a tela do iPhone do aluno.

---

## 1. A Metáfora do Restaurante

| Ferramenta | O que representa? | Função no processo |
| :--- | :--- | :--- |
| **Seu Computador** | **A Bancada de Testes do Chef** | Onde você rascunha as receitas, testa os sabores e ajusta os detalhes antes de servir. |
| **Git** | **O Caderno de Versões da Receita** | Anota cada modificação feita: quem alterou, o que mudou e permite voltar atrás se algo desandar. |
| **GitHub** | **O Cofre na Nuvem** | Guarda cópias de segurança do seu caderno de receitas na internet para não perder nada. |
| **Vercel** | **O Salão do Restaurante (Garçons e Mesas)** | Pega a receita aprovada no cofre, prepara a apresentação final e entrega para os clientes no mundo inteiro. |
| **Supabase** | **A Despensa / Depósito de Ingredientes** | Onde ficam guardados os dados dos clientes (cadastros, treinos, pesos) de forma permanente e segura. |

---

## 2. Diagrama de Fluxo

```
[Seu Computador]
     │
     ├── 1. Você edita o código (React / TypeScript)
     ├── 2. git add . (prepara os arquivos para empacotar)
     ├── 3. git commit -m "..." (lacra o pacote com uma etiqueta de versão)
     └── 4. git push origin main (envia o pacote para a nuvem)
             │
             ▼
[GitHub] (Cofre na Nuvem)
     │
     └── Notifica automaticamente a Vercel através de um Webhook
             │
             ▼
[Vercel] (Hospedagem & CI/CD)
     │
     ├── Baixa a versão nova do GitHub
     ├── Executa "npm run build" (compila e otimiza o código)
     ├── Injeta as variáveis de ambiente (VITE_SUPABASE_URL e KEY)
     └── Atualiza o link público (ex: https://appacad.vercel.app)
             │
             ▼
[iPhone dos Alunos e Professores]
     │
     └── Abre o PWA instalado na tela de início
             │
             ▲
             ▼
[Supabase] (Banco de Dados Online 24h)
     └── Guarda treinos, cargas, séries e pesagens de forma independente
```

---

## 3. O Passo a Passo Detalhado

### 1. Git (Controle de Versão Local)
O Git roda dentro do seu computador, na pasta do projeto. Ele funciona como uma "máquina do tempo":
- **`git status`**: Mostra o que foi alterado no código desde o último registro.
- **`git add .`**: Coloca todos os arquivos modificados na "esteira de envio" (*Staging Area*).
- **`git commit -m "mensagem"`**: Registra uma foto oficial do projeto naquele momento. Se você errar alguma coisa amanhã, pode voltar para este ponto exato.
- **`git push origin main`**: Envia o histórico local do seu computador para o servidor remoto no GitHub.

### 2. GitHub (Repositório Remoto e Colaboração)
O GitHub é a nuvem do Git:
- Guarda seu código com segurança contra perda de arquivos ou falha no HD.
- Permite que equipes colaborem no mesmo software sem sobrescrever o trabalho um do outro.
- Comunica-se com outros serviços da nuvem (como a Vercel) através de eventos chamados **Webhooks**.

### 3. Vercel (CI/CD e Hospedagem de Alta Velocidade)
**CI/CD** significa *Continuous Integration and Continuous Deployment* (Integração e Entrega Contínuas):
- Você **não precisa** fazer upload de arquivos zip ou usar FTP como antigamente.
- No momento em que você dá `git push`, a Vercel percebe a novidade, compila seu código automaticamente e publica o site.
- Ela fornece certificados de segurança **SSL (HTTPS)** obrigatórios para o iPhone permitir a instalação do PWA.

### 4. Supabase (Backend as a Service & Banco na Nuvem)
O Supabase é um banco de dados **PostgreSQL** profissional que roda em servidores globais:
- O código do app (na Vercel) é apenas a "casca" visual (a tela do iPhone).
- Quando o aluno clica em "Concluir Treino", o aplicativo faz uma chamada de rede para o Supabase e grava a informação.
- As **Variáveis de Ambiente (`Environment Variables`)** funcionam como as chaves de acesso que dizem ao aplicativo: *"converse com o banco bpjryybqkryeoyonsqdt.supabase.co"*.

---

## 4. Colinha de Comandos para o Dia a Dia

Sempre que você terminar uma nova funcionalidade ou correção:

```bash
# 1. Veja o que mudou
git status

# 2. Prepare todos os arquivos
git add .

# 3. Crie a versão com uma descrição clara
git commit -m "feat: adicionar nova tela ou correcao"

# 4. Envie para o GitHub (e a Vercel publica sozinha!)
git push origin main
```
