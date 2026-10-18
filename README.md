# FitTrack - App para iPhone (PWA)

Aplicativo fitness mobile-first otimizado para iPhone, com suporte a **Safe Area**, **PWA instalável**, interface no estilo nativo iOS e integração com banco de dados na nuvem (**Supabase**) sem servidor local.

---

## 📱 Funcionalidades Desenvolvidas

1. **Treino do Dia (Hoje / Treinando)**
   - Início em tempo real com cronômetro de duração.
   - Lista de exercícios divididos por séries com inputs rápidos de Peso (kg) e Repetições.
   - Botão de "Check" com vibração háptica no celular.
   - **Cronômetro de descanso integrado** com botões rápidos (+15s, 60s, 90s, 2min) que abre automaticamente após marcar a série como concluída.
   - Conclusão de treino com cálculo de volume e efeito de confetes na tela.

2. **Fichas de Treino (Treinos)**
   - Fichas pré-configuradas (Treino A, B e C) com exercícios, repetições alvo e descanso recomendado.
   - Criar novas fichas de treino personalizadas.
   - Adicionar ou remover exercícios de qualquer ficha.
   - Botão "Play" para iniciar qualquer treino diretamente.

3. **Controle de Pesos (Pesos)**
   - Registro de pesagem corporal com data e anotações.
   - Card com peso atual e cálculo automático da variação total desde o início.
   - Badge inteligente comparando com a pesagem anterior (+0.3 kg / -0.5 kg).

4. **Histórico de Evolução (Evolução)**
   - **Gráfico SVG de Evolução de Peso Corporal**: visualização intuitiva da tendência.
   - **Evolução de Cargas por Exercício**: selecione qualquer exercício (ex: *Supino Reto*) e veja o histórico de aumento de carga e repetições.
   - Linha do tempo com todos os treinos concluídos no mês e séries detalhadas.

---

## 🚀 Como testar no iPhone agora mesmo

1. No seu computador, execute:
   ```bash
   npm run dev
   ```
2. O terminal vai exibir dois endereços:
   - Local: `http://localhost:5173/`
   - **Network**: `http://192.168.X.X:5173/`
3. Certifique-se de que seu iPhone está conectado no **mesmo Wi-Fi** do computador.
4. Abra o **Safari no iPhone** e digite o endereço Network (ex: `http://192.168.1.15:5173`).
5. No Safari, toque no botão **Compartilhar (ícone do quadrado com seta para cima)**.
6. Role para baixo e selecione **"Adicionar à Tela de Início"**.
7. O ícone do app será criado na tela inicial do iPhone e abrirá **em tela cheia (sem barra do Safari)**!

---

## ☁️ Conexão com Banco na Nuvem (Supabase)

Você não precisa de servidor local ou VPS. O app funciona tanto offline (armazenamento local) quanto sincronizado com o Supabase.

1. Crie uma conta gratuita em [supabase.com](https://supabase.com).
2. Crie um projeto novo.
3. No painel do Supabase, clique em **SQL Editor** e cole o script SQL gerado automaticamente pelo app (ou use o botão "Copiar Script SQL" no menu de configurações do próprio app).
4. No app, clique no ícone de nuvem/engrenagem no topo, cole sua **Project URL** e **API Anon Key**.
5. Pronto! Todas as fichas, treinos e pesagens são sincronizados na nuvem em tempo real.
