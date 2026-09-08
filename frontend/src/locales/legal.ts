/**
 * Namespace `legal`: Privacidade, Termos e Contato.
 * As páginas legais têm conteúdo estruturado (seções numeradas, listas, callouts, FAQ).
 * Modelamos esse conteúdo como arrays/objetos e a tela mapeia em cima.
 * `mail` fica de fora (é literal: contato@vitalpair.app).
 */
export const legal = {
  pt: {
    back: 'Voltar',
    brandTagline: 'Saúde é melhor em dupla',
    footerRights: '© 2026 VitalPair · Saúde é melhor em dupla',
    footerPrivacy: 'Privacidade',
    footerTerms: 'Termos',
    footerContact: 'Contato',

    privacy: {
      badge: 'seus dados, sem letra miúda',
      title: 'Política de Privacidade',
      intro:
        'O VitalPair lida com informação de saúde, que é coisa delicada. Aqui a gente explica em português normal o que coletamos, por que coletamos e o que você pode mandar a gente fazer com isso. Sem juridiquês escondendo o jogo.',
      effective: 'Versão 1, setembro de 2026',
      sections: [
        {
          title: 'Quem é o responsável',
          paragraphs: [
            'O controlador dos seus dados pessoais é Alisson Pinheiro Souto, microempreendedor individual (MEI) inscrito no CNPJ 65.088.337/0001-48, nos termos da Lei nº 13.709/2018 (a LGPD). Quando falamos "a gente", "nós" ou "VitalPair" nesta página, é dele que estamos falando.',
            'O encarregado pelos dados é a mesma pessoa: Alisson Pinheiro Souto. O VitalPair é um projeto de uma pessoa só, e a lei permite que o controlador acumule esse papel. Dúvida, pedido ou reclamação: {{mail}}. A gente responde em até três dias úteis.',
          ],
        },
        {
          title: 'O que a gente coleta',
          paragraphs: [
            'Coletamos só o necessário pra o app funcionar do jeito que ele se propõe: você e mais alguém numa temporada cuidando da saúde.',
          ],
          bullets: [
            [
              'Cadastro',
              'nome, e-mail e senha (a senha não fica guardada: a gente guarda uma marca dela que não dá pra desfazer).',
            ],
            [
              'Perfil de saúde',
              'data de nascimento, sexo, altura, peso e seu objetivo. É com isso que estimamos suas metas e calorias.',
            ],
            [
              'Registros do dia a dia',
              'suas refeições (inclusive as fotos de prato que você envia) e suas atividades físicas.',
            ],
            ['Dados de jogo', 'pontuação, sequências, missões e quem é o seu par na temporada.'],
            [
              'Login pelo Google',
              'se você entra com o Google, recebemos do Google seu nome, e-mail e o identificador da conta. Nada além disso.',
            ],
            [
              'Dados técnicos',
              'informações básicas de sessão pra manter você logado e proteger a conta (mais detalhe na seção de cookies).',
            ],
          ],
          callout: {
            tone: 'rival',
            icon: 'info',
            text: 'Dados de saúde e biométricos são considerados dados sensíveis pela LGPD. Por isso tratamos altura, peso, sexo, objetivo e registros alimentares com cuidado extra, e só usamos pra te entregar o serviço.',
          },
        },
        {
          title: 'Pra que usamos',
          bullets: [
            [
              'Fazer o app funcionar',
              'criar e manter sua conta, calcular metas, montar o placar e tocar a temporada.',
            ],
            [
              'Estimar as calorias da foto',
              'quando você fotografa o prato, a imagem é analisada por IA pra estimar o que tem ali. Você confere antes de confirmar.',
            ],
            [
              'Mostrar seu progresso',
              'gráficos, sequências, histórico e comparação com o seu par.',
            ],
            [
              'Cuidar da segurança',
              'detectar acesso indevido, prevenir fraude e proteger as contas.',
            ],
            [
              'Falar com você',
              'e-mails sobre a conta, como verificação e recuperação de senha. Nada de spam.',
            ],
          ],
        },
        {
          title: 'Com que base legal',
          paragraphs: ['A LGPD exige que todo tratamento tenha uma base legal. As nossas são:'],
          bullets: [
            [
              'Execução de contrato',
              'a maior parte dos dados é tratada porque é o que faz o serviço que você contratou funcionar.',
            ],
            [
              'Consentimento',
              'pros dados sensíveis de saúde (peso, altura, sexo, objetivo, refeições e atividades) pedimos seu consentimento, que você pode retirar quando quiser.',
            ],
            [
              'Legítimo interesse',
              'pra segurança, prevenção de fraude e melhoria do produto, sempre respeitando seus direitos.',
            ],
            [
              'Cumprimento de obrigação legal',
              'quando a lei nos obriga a guardar algo por um prazo.',
            ],
          ],
        },
        {
          title: 'Com quem a gente compartilha',
          paragraphs: [
            'A gente não vende seus dados. Ponto. Compartilhamos só com quem é necessário pra o app rodar, e cada um trata os dados de forma limitada:',
          ],
          bullets: [
            [
              'Google (login)',
              'se você usa "entrar com Google", a autenticação passa pelo Google (OAuth2). O Google trata isso pela política dele.',
            ],
            [
              'Anthropic (IA da foto)',
              'a imagem do prato é enviada pra Anthropic, que processa a foto pra estimar as calorias e devolve o resultado. É um provedor de IA, atuando como operador a nosso pedido.',
            ],
            [
              'Infraestrutura',
              'A Oracle Cloud Infrastructure hospeda a aplicação e o banco de dados (PostgreSQL), na região de São Paulo, no Brasil. Os termos da Oracle incluem acordo de tratamento de dados, com obrigação de sigilo.',
            ],
            [
              'Autoridades',
              'só se formos legalmente obrigados, por ordem judicial ou requisição legítima.',
            ],
            [
              'Fora do Brasil',
              'a foto do prato é a única coisa que sai do país: vai pra Anthropic, nos Estados Unidos, pelo tempo de estimar as calorias. O resto (sua conta, refeições, pesos, temporadas) fica no Brasil, na Oracle em São Paulo. A transferência é permitida pelo artigo 33 da LGPD, pra executar o serviço que você pediu.',
            ],
          ],
          callout: {
            tone: 'brand',
            icon: 'alert',
            text: 'Seu par enxerga seu placar, suas sequências e o fato de você ter registrado algo, isso faz parte do jogo. Mas o conteúdo detalhado dos seus registros e seus dados de perfil continuam seus.',
          },
        },
        {
          title: 'Por quanto tempo guardamos',
          paragraphs: [
            'A gente guarda seus dados enquanto sua conta estiver aberta. Quando você encerra, apagamos na hora o que você registrou sobre você: refeições, treinos, pesos, planos, notificações e perfil. O que descreve uma temporada que vocês dois jogaram (o placar, os pontos, as medalhas) fica, mas sem o seu nome: é história do seu par também, e o artigo 12 da LGPD entende que dado anonimizado deixa de ser dado pessoal. Seu e-mail é liberado, então dá pra voltar com o mesmo. Backups técnicos levam um pouco mais pra expirar, no ciclo normal de rotação.',
          ],
        },
        {
          title: 'Seus direitos',
          paragraphs: ['Como titular dos dados, a LGPD te garante, e a gente respeita:'],
          bullets: [
            ['Acesso', 'saber quais dados seus a gente tem.'],
            ['Correção', 'arrumar dado incompleto ou errado.'],
            ['Exclusão', 'pedir pra apagar seus dados e encerrar a conta.'],
            ['Portabilidade', 'receber seus dados num formato legível.'],
            [
              'Revogar consentimento',
              'tirar o consentimento dos dados de saúde a qualquer momento.',
            ],
            ['Informação', 'saber com quem compartilhamos e por quê.'],
          ],
          paragraphsAfter: [
            'Pra exercer qualquer um desses, escreve pra {{mail}}. Boa parte você também resolve direto nas configurações da conta.',
          ],
        },
        {
          title: 'Cookies e sessão',
          paragraphs: [
            'A gente usa o mínimo. Guardamos um cookie ou token de sessão pra te manter logado e pra proteger a sua conta. Sem isso, você teria que digitar a senha a cada clique. Não usamos cookies pra te perseguir com publicidade por aí.',
          ],
        },
        {
          title: 'Segurança',
          paragraphs: [
            'Senha não fica guardada: fica embaralhada de um jeito que não dá pra desfazer, nem por nós. O tráfego anda em HTTPS. Nenhum sistema é infalível, e se acontecer algo grave a gente avisa você e avisa a ANPD, como a lei manda.',
          ],
        },
        {
          title: 'Mudanças nesta política',
          paragraphs: [
            'Se a gente mudar algo relevante aqui, atualiza a data de vigência no topo e, quando for mudança importante, avisa você dentro do app ou por e-mail. Continuar usando o VitalPair depois disso significa que você está de acordo com a versão nova.',
          ],
        },
        {
          title: 'Falar com o encarregado',
          paragraphs: [
            'Qualquer assunto de privacidade, dúvida sobre seus dados ou exercício de direito é só mandar pra {{mail}}. Tem gente de verdade lendo.',
          ],
        },
      ],
    },

    terms: {
      badge: 'o combinado da casa',
      title: 'Termos de Uso',
      intro:
        'Estas são as regras de usar o VitalPair. Leitura rápida, sem pegadinha. Ao criar conta ou usar o app, você concorda com o que está aqui. Se não concordar com alguma coisa, melhor não usar.',
      effective: 'Versão 1, setembro de 2026',
      sections: [
        {
          title: 'O que é o VitalPair',
          paragraphs: [
            'O VitalPair é um app web onde duas pessoas (casal, amigos, irmãos, quem topar) competem numa temporada de 30 dias cuidando da saúde: registram refeições, inclusive por foto com ajuda de IA, registram atividade física, e acompanham placar, sequências e missões. A ideia é simples: é mais fácil manter a rotina quando tem alguém junto.',
          ],
        },
        {
          title: 'Conta e quem pode usar',
          bullets: [
            ['Idade', 'você precisa ter pelo menos 18 anos pra criar uma conta.'],
            [
              'Dados de verdade',
              'use informações reais no cadastro. Altura, peso e objetivo errados estragam suas metas e o jogo.',
            ],
            [
              'Sua senha é sua',
              'mantenha a senha em segredo. Tudo que rolar na sua conta é responsabilidade sua.',
            ],
            [
              'Login pelo Google',
              'você pode entrar com Google. Nesse caso valem também os termos do Google pra autenticação.',
            ],
            ['Uma conta por pessoa', 'nada de criar várias contas pra burlar o placar.'],
          ],
        },
        {
          title: 'Conduta: o que não rola',
          paragraphs: ['Usando o VitalPair, você se compromete a não:'],
          bullets: [
            [
              'Fraudar o jogo',
              'registrar coisa falsa só pra inflar pontuação ou prejudicar seu par.',
            ],
            [
              'Atacar o sistema',
              'tentar invadir, sobrecarregar, raspar dados ou furar a segurança.',
            ],
            [
              'Usar conteúdo de terceiros',
              'enviar fotos ou conteúdo que não são seus ou que violem direitos de alguém.',
            ],
            ['Assediar', 'usar o app pra incomodar, ofender ou expor outra pessoa.'],
            ['Revender', 'explorar o serviço comercialmente sem a nossa autorização.'],
          ],
          paragraphsAfter: [
            'Se você quebrar essas regras, a gente pode suspender ou encerrar sua conta, dependendo da gravidade.',
          ],
        },
        {
          title: 'Saúde: isto NÃO é orientação médica',
          calloutFirst: true,
          callout: {
            tone: 'danger',
            icon: 'alert',
            text: 'O VitalPair é uma ferramenta de motivação e acompanhamento, não um profissional de saúde. Nada aqui (estimativa de calorias, metas, sugestões, números) substitui a orientação de médico, nutricionista ou educador físico.',
          },
          paragraphs: [
            'As estimativas de caloria a partir de foto são aproximadas, feitas por IA, e podem errar. Use como referência, não como verdade absoluta. Antes de mudar dieta, começar treino pesado ou tomar qualquer decisão de saúde, fale com um profissional qualificado. Se você tem alguma condição de saúde, isso vale em dobro.',
            'Em emergência, procure atendimento médico. O VitalPair não é canal de emergência nem de aconselhamento clínico.',
          ],
        },
        {
          title: 'Plano gratuito e plano pago',
          paragraphs: [
            'Hoje o VitalPair é de graça e não pede cartão. As temporadas vão continuar de graça: elas são o coração do produto. Um dia pode ter um plano pago com recursos extras.',
          ],
          bullets: [
            [
              'Sem surpresa',
              'a gente nunca vai cobrar de você sem você ter contratado um plano pago de forma clara.',
            ],
            [
              'Mudança de preço',
              'se lançarmos planos pagos, o preço e o que cada plano inclui ficarão visíveis antes de você assinar.',
            ],
            [
              'O grátis continua',
              'a gente pretende manter um nível gratuito, mas pode ajustar o que ele inclui ao longo do tempo.',
            ],
          ],
        },
        {
          title: 'Seu conteúdo e a nossa propriedade',
          paragraphs: [
            'O que você cria (suas fotos, seus registros, seus dados) continua seu. Você só nos dá a permissão necessária pra processar e mostrar esse conteúdo dentro do app, do jeito que o serviço precisa pra funcionar.',
            'Já a marca VitalPair, o nome, o logo, o design, o código e os textos são nossos. Usar o app não te dá direito de copiar, revender ou reaproveitar essas partes sem autorização.',
          ],
        },
        {
          title: 'Limitação de responsabilidade',
          paragraphs: [
            'A gente se esforça pra manter o VitalPair no ar e funcionando, mas o serviço é fornecido "como está". Pode ter instabilidade, manutenção ou estimativa imprecisa. Na medida permitida pela lei, não respondemos por decisões de saúde que você tome com base no app, nem por perdas indiretas decorrentes do uso.',
            'Nada nestes termos afasta direitos que a legislação brasileira, incluindo o Código de Defesa do Consumidor, garante a você como consumidor.',
          ],
        },
        {
          title: 'Encerramento de conta',
          bullets: [
            [
              'Você sai quando quiser',
              'dá pra encerrar a conta a qualquer momento nas configurações. Seus dados seguem o que diz a Política de Privacidade.',
            ],
            [
              'A gente pode encerrar',
              'se você quebrar estes termos ou usar o app de forma abusiva ou ilegal, podemos suspender ou encerrar o acesso.',
            ],
            [
              'Aviso quando der',
              'sempre que possível, a gente avisa antes de encerrar e explica o motivo.',
            ],
          ],
        },
        {
          title: 'Lei e foro',
          paragraphs: [
            'Estes termos são regidos pelas leis do Brasil. Qualquer questão que não der pra resolver de forma amigável fica no foro do domicílio do usuário, conforme o Código de Defesa do Consumidor.',
          ],
        },
        {
          title: 'Alterações nestes termos',
          paragraphs: [
            'A gente pode atualizar estes termos. Quando a mudança for relevante, atualizamos a data de vigência no topo e avisamos você no app ou por e-mail. Se você continuar usando o VitalPair depois disso, entendemos que você concordou com a versão nova. Se não concordar, é só encerrar a conta.',
          ],
        },
        {
          title: 'Fala com a gente',
          paragraphs: ['Qualquer dúvida sobre estes termos, escreve pra {{mail}}.'],
        },
      ],
    },

    contact: {
      badge: 'tem gente de verdade do outro lado',
      title: 'Fala com a gente',
      intro:
        'Bug, sugestão, dúvida sobre seus dados ou só pra contar como foi sua temporada. Escreve aqui que a gente responde. Ninguém vai te dar número de ticket.',
      nameLabel: 'Seu nome',
      namePlaceholder: 'Como te chamamos?',
      emailLabel: 'Seu e-mail',
      emailPlaceholder: 'pra gente te responder',
      messageLabel: 'Sua mensagem',
      messagePlaceholder: 'Conta o que rolou ou o que você precisa.',
      submit: 'Enviar mensagem',
      privacyNote: 'A gente usa seu e-mail só pra responder este contato.',
      sentTitle: 'Seu e-mail abriu com a mensagem pronta',
      sentText:
        'É só conferir e enviar. Se nada abriu, manda direto pra {{mail}}: a gente responde em até um dia útil.',
      nameRequired: 'Escreve teu nome pra gente saber com quem fala.',
      emailInvalid: 'Confere esse e-mail: falta algo nele.',
      messageRequired: 'Conta o que rolou. A mensagem não pode ficar vazia.',
      sendAnother: 'Mandar outra',
      directEmail: 'E-MAIL DIRETO',
      directEmailText:
        'Prefere mandar do seu próprio e-mail? Pode ser por aqui também. É o mesmo canal pra assuntos de privacidade e exercício dos seus direitos.',
      responseTime: 'Tempo de resposta',
      responseTimeText: 'Normalmente até três dias úteis. Bug grave a gente prioriza.',
      faqTitle: 'Perguntas rápidas',
      faqFreeQ: 'O VitalPair é gratuito?',
      faqFreeA:
        'Hoje tudo é de graça e a gente nem pede cartão. As temporadas vão continuar de graça. Um dia pode ter um plano pago com recursos extras, e a gente avisa antes.',
      faqPhotoQ: 'A foto do prato vai pra onde?',
      faqPhotoA:
        'A imagem é analisada por IA (Anthropic) só pra estimar as calorias e te devolver o resultado. Detalhe completo está na Política de Privacidade.',
      faqPhotoLink: 'Política de Privacidade',
      faqDeleteQ: 'Como apago minha conta e meus dados?',
      faqDeleteA:
        'Dá pra encerrar a conta nas configurações, ou mandar um e-mail pra {{mail}} que a gente resolve.',
    },
  },

  en: {
    back: 'Back',
    brandTagline: 'Health is better in pairs',
    footerRights: '© 2026 VitalPair · Health is better in pairs',
    footerPrivacy: 'Privacy',
    footerTerms: 'Terms',
    footerContact: 'Contact',

    privacy: {
      badge: 'your data, no fine print',
      title: 'Privacy Policy',
      intro:
        'VitalPair handles health information, which is sensitive stuff. Here we explain in plain words what we collect, why we collect it, and what you can tell us to do with it. No legalese hiding the ball.',
      effective: 'Version 1, September 2026',
      sections: [
        {
          title: 'Who is responsible',
          paragraphs: [
            'The controller of your personal data is Alisson Pinheiro Souto, a Brazilian sole trader (MEI) registered under CNPJ 65.088.337/0001-48, under Law 13.709/2018 (the LGPD). When we say "we" or "VitalPair" on this page, that is who we mean.',
            'The data protection officer is the same person: Alisson Pinheiro Souto. VitalPair is a one-person project, and the law lets the controller take that role. Questions, requests or complaints: {{mail}}. We answer within three business days.',
          ],
        },
        {
          title: 'What we collect',
          paragraphs: [
            'We collect only what the app needs to do what it promises: you and someone else in a season looking after your health.',
          ],
          bullets: [
            [
              'Account',
              'name, email and password (the password is not stored: we keep a fingerprint of it that cannot be reversed).',
            ],
            [
              'Health profile',
              'date of birth, sex, height, weight and your goal. That’s what we use to estimate your goals and calories.',
            ],
            [
              'Daily logs',
              'your meals (including the plate photos you upload) and your physical activities.',
            ],
            ['Game data', 'points, streaks, missions and who your partner is in the season.'],
            [
              'Google sign-in',
              'if you sign in with Google, we receive your name, email and account ID from Google. Nothing beyond that.',
            ],
            [
              'Technical data',
              'basic session info to keep you logged in and protect the account (more in the cookies section).',
            ],
          ],
          callout: {
            tone: 'rival',
            icon: 'info',
            text: 'Health and biometric data are considered sensitive under the LGPD. That’s why we treat height, weight, sex, goal and food logs with extra care, and use them only to deliver the service.',
          },
        },
        {
          title: 'What we use it for',
          bullets: [
            [
              'Run the app',
              'create and keep your account, calculate goals, build the scoreboard and run the season.',
            ],
            [
              'Estimate calories from the photo',
              'when you photograph your plate, the image is analyzed by AI to estimate what’s there. You check before confirming.',
            ],
            ['Show your progress', 'charts, streaks, history and comparison with your partner.'],
            ['Keep things secure', 'detect improper access, prevent fraud and protect accounts.'],
            [
              'Talk to you',
              'emails about your account, like verification and password recovery. No spam.',
            ],
          ],
        },
        {
          title: 'On what legal basis',
          paragraphs: ['The LGPD requires every processing to have a legal basis. Ours are:'],
          bullets: [
            [
              'Performance of a contract',
              'most data is processed because that’s what makes the service you signed up for work.',
            ],
            [
              'Consent',
              'for sensitive health data (weight, height, sex, goal, meals and activities) we ask for your consent, which you can withdraw anytime.',
            ],
            [
              'Legitimate interest',
              'for security, fraud prevention and product improvement, always respecting your rights.',
            ],
            ['Legal obligation', 'when the law requires us to keep something for a period.'],
          ],
        },
        {
          title: 'Who we share with',
          paragraphs: [
            'We don’t sell your data. Period. We share only with who’s needed to run the app, and each one handles the data in a limited way:',
          ],
          bullets: [
            [
              'Google (login)',
              'if you use "sign in with Google", authentication goes through Google (OAuth2). Google handles that under its own policy.',
            ],
            [
              'Anthropic (photo AI)',
              'the plate image is sent to Anthropic, which processes the photo to estimate the calories and returns the result. It’s an AI provider, acting as a processor at our request.',
            ],
            [
              'Infrastructure',
              'Oracle Cloud Infrastructure hosts the application and the database (PostgreSQL), in the São Paulo region, Brazil. Oracle’s terms include a data processing agreement, with a duty of confidentiality.',
            ],
            ['Authorities', 'only if legally required, by court order or legitimate request.'],
            [
              'Outside Brazil',
              'the plate photo is the only thing that leaves the country: it goes to Anthropic, in the United States, for as long as it takes to estimate the calories. Everything else (your account, meals, weights, seasons) stays in Brazil, on Oracle in São Paulo. Article 33 of the LGPD allows the transfer, to deliver the service you asked for.',
            ],
          ],
          callout: {
            tone: 'brand',
            icon: 'alert',
            text: 'Your partner sees your score, your streaks and the fact that you logged something, that’s part of the game. But the detailed content of your logs and your profile data stay yours.',
          },
        },
        {
          title: 'How long we keep it',
          paragraphs: [
            'We keep your data while your account is open. When you close it, we erase what you logged about yourself right away: meals, workouts, weights, plans, notifications and profile. What describes a season the two of you played (the scoreboard, the points, the badges) stays, but without your name on it: it is your partner’s history too, and article 12 of the LGPD treats anonymised data as no longer personal data. Your e-mail address is freed, so you can come back with the same one. Technical backups take a little longer to expire, within the normal rotation cycle.',
          ],
        },
        {
          title: 'Your rights',
          paragraphs: ['As the data subject, the LGPD guarantees you, and we respect:'],
          bullets: [
            ['Access', 'know which of your data we hold.'],
            ['Correction', 'fix incomplete or wrong data.'],
            ['Deletion', 'ask to erase your data and close the account.'],
            ['Portability', 'receive your data in a readable format.'],
            ['Withdraw consent', 'remove consent for health data at any time.'],
            ['Information', 'know who we share with and why.'],
          ],
          paragraphsAfter: [
            'To exercise any of these, write to {{mail}}. A good part you can also handle right in your account settings.',
          ],
        },
        {
          title: 'Cookies and session',
          paragraphs: [
            'We use the minimum. We store a session cookie or token to keep you logged in and protect your account. Without it, you’d have to type your password on every click. We don’t use cookies to chase you with ads around the web.',
          ],
        },
        {
          title: 'Security',
          paragraphs: [
            'Passwords are hashed, not stored: not even we can read them back. Traffic runs over HTTPS. No system is foolproof, and if something serious happens, we tell you and we tell the ANPD, as the law requires.',
          ],
        },
        {
          title: 'Changes to this policy',
          paragraphs: [
            'If we change something relevant here, we update the effective date at the top and, for important changes, notify you in the app or by email. Continuing to use VitalPair after that means you agree with the new version.',
          ],
        },
        {
          title: 'Contact the DPO',
          paragraphs: [
            'Any privacy matter, question about your data or exercise of a right, just write to {{mail}}. Real people are reading.',
          ],
        },
      ],
    },

    terms: {
      badge: 'the house rules',
      title: 'Terms of Use',
      intro:
        'These are the rules for using VitalPair. Quick read, no catch. By creating an account or using the app, you agree to what’s here. If you don’t agree with something, better not use it.',
      effective: 'Version 1, September 2026',
      sections: [
        {
          title: 'What VitalPair is',
          paragraphs: [
            'VitalPair is a web app where two people (a couple, friends, siblings, whoever) compete in a 30-day season looking after their health: they log meals, including by photo with AI help, log physical activity, and follow the scoreboard, streaks and missions. The idea is simple: it’s easier to keep the routine when someone’s in it with you.',
          ],
        },
        {
          title: 'Account and who can use it',
          bullets: [
            ['Age', 'you must be at least 18 to create an account.'],
            [
              'Real data',
              'use real info when signing up. Wrong height, weight and goal ruin your goals and the game.',
            ],
            [
              'Your password is yours',
              'keep your password secret. Everything that happens on your account is your responsibility.',
            ],
            [
              'Google sign-in',
              'you can sign in with Google. In that case Google’s authentication terms also apply.',
            ],
            ['One account per person', 'no creating multiple accounts to game the scoreboard.'],
          ],
        },
        {
          title: 'Conduct: what’s not allowed',
          paragraphs: ['By using VitalPair, you agree not to:'],
          bullets: [
            ['Cheat the game', 'log fake stuff just to inflate your score or hurt your partner.'],
            [
              'Attack the system',
              'try to break in, overload it, scrape data or get around security.',
            ],
            [
              'Use third-party content',
              'upload photos or content that aren’t yours or that violate someone’s rights.',
            ],
            ['Harass', 'use the app to bother, offend or expose another person.'],
            ['Resell', 'exploit the service commercially without our authorization.'],
          ],
          paragraphsAfter: [
            'If you break these rules, we may suspend or close your account, depending on severity.',
          ],
        },
        {
          title: 'Health: this is NOT medical advice',
          calloutFirst: true,
          callout: {
            tone: 'danger',
            icon: 'alert',
            text: 'VitalPair is a motivation and tracking tool, not a health professional. Nothing here (calorie estimates, goals, suggestions, numbers) replaces guidance from a doctor, nutritionist or trainer.',
          },
          paragraphs: [
            'Calorie estimates from photos are approximate, made by AI, and can be wrong. Use them as a reference, not absolute truth. Before changing your diet, starting heavy training or making any health decision, talk to a qualified professional. If you have a health condition, that goes double.',
            'In an emergency, seek medical care. VitalPair is not an emergency channel or clinical advice.',
          ],
        },
        {
          title: 'Free plan and paid plan',
          paragraphs: [
            'Today VitalPair is free and asks for no card. Seasons will stay free: they are the heart of the product. One day there may be a paid plan with extra features.',
          ],
          bullets: [
            [
              'No surprises',
              'we’ll never charge you without you clearly signing up for a paid plan.',
            ],
            [
              'Price changes',
              'if we launch paid plans, the price and what each plan includes will be visible before you subscribe.',
            ],
            [
              'Free stays',
              'we plan to keep a free tier, but may adjust what it includes over time.',
            ],
          ],
        },
        {
          title: 'Your content and our property',
          paragraphs: [
            'What you create (your photos, your logs, your data) stays yours. You only give us the permission needed to process and show that content inside the app, the way the service needs to work.',
            'The VitalPair brand, name, logo, design, code and text are ours. Using the app doesn’t give you the right to copy, resell or reuse those parts without authorization.',
          ],
        },
        {
          title: 'Limitation of liability',
          paragraphs: [
            'We work to keep VitalPair up and running, but the service is provided "as is". There may be instability, maintenance or imprecise estimates. To the extent allowed by law, we’re not liable for health decisions you make based on the app, nor for indirect losses from using it.',
            'Nothing in these terms removes rights that Brazilian law, including the Consumer Protection Code, guarantees you as a consumer.',
          ],
        },
        {
          title: 'Closing your account',
          bullets: [
            [
              'You leave whenever you want',
              'you can close the account anytime in settings. Your data follows the Privacy Policy.',
            ],
            [
              'We can close it',
              'if you break these terms or use the app abusively or illegally, we may suspend or close access.',
            ],
            ['Notice when we can', 'whenever possible, we warn before closing and explain why.'],
          ],
        },
        {
          title: 'Law and jurisdiction',
          paragraphs: [
            'These terms are governed by the laws of Brazil. Any matter that can’t be resolved amicably falls under the jurisdiction of the user’s domicile, per the Consumer Protection Code.',
          ],
        },
        {
          title: 'Changes to these terms',
          paragraphs: [
            'We may update these terms. When the change is relevant, we update the effective date at the top and notify you in the app or by email. If you keep using VitalPair after that, we understand you agreed with the new version. If you don’t agree, just close the account.',
          ],
        },
        {
          title: 'Talk to us',
          paragraphs: ['Any question about these terms, write to {{mail}}.'],
        },
      ],
    },

    contact: {
      badge: 'there’s a real person on the other side',
      title: 'Talk to us',
      intro:
        'A bug, a suggestion, a question about your data, or just to tell us how your season went. Write here and we answer. Nobody is going to hand you a ticket number.',
      nameLabel: 'Your name',
      namePlaceholder: 'What should we call you?',
      emailLabel: 'Your email',
      emailPlaceholder: 'so we can reply',
      messageLabel: 'Your message',
      messagePlaceholder: 'Tell us what happened or what you need.',
      submit: 'Send message',
      privacyNote: 'We use your email only to reply to this contact.',
      sentTitle: 'Your e-mail app opened with the message ready',
      sentText:
        'Just check it and send. If nothing opened, write directly to {{mail}}: we reply within one business day.',
      nameRequired: 'Write your name so we know who we’re talking to.',
      emailInvalid: 'Check that e-mail: something is missing.',
      messageRequired: 'Tell us what happened. The message can’t be empty.',
      sendAnother: 'Send another',
      directEmail: 'DIRECT EMAIL',
      directEmailText:
        'Prefer to send from your own email? That works too. It’s the same channel for privacy matters and exercising your rights.',
      responseTime: 'Response time',
      responseTimeText: 'Usually within three business days. Serious bugs we prioritise.',
      faqTitle: 'Quick questions',
      faqFreeQ: 'Is VitalPair free?',
      faqFreeA:
        'Today everything is free and we don’t ask for a card. Seasons will stay free. One day there may be a paid plan with extra features, and we’ll tell you before that happens.',
      faqPhotoQ: 'Where does the plate photo go?',
      faqPhotoA:
        'The image is analyzed by AI (Anthropic) only to estimate the calories and return the result. Full detail is in the Privacy Policy.',
      faqPhotoLink: 'Privacy Policy',
      faqDeleteQ: 'How do I delete my account and my data?',
      faqDeleteA: 'You can close the account in settings, or email {{mail}} and we’ll handle it.',
    },
  },

  es: {
    back: 'Volver',
    brandTagline: 'La salud es mejor en pareja',
    footerRights: '© 2026 VitalPair · La salud es mejor en pareja',
    footerPrivacy: 'Privacidad',
    footerTerms: 'Términos',
    footerContact: 'Contacto',

    privacy: {
      badge: 'tus datos, sin letra pequeña',
      title: 'Política de Privacidad',
      intro:
        'VitalPair maneja información de salud, que es algo delicado. Aquí te explicamos en palabras normales qué recopilamos, por qué lo recopilamos y qué puedes pedirnos hacer con ello. Sin jerga legal escondiendo nada.',
      effective: 'Versión 1, septiembre de 2026',
      sections: [
        {
          title: 'Quién es el responsable',
          paragraphs: [
            'El responsable de tus datos personales es Alisson Pinheiro Souto, microempresario individual (MEI) inscrito con el CNPJ 65.088.337/0001-48, en Brasil, según la Ley 13.709/2018 (la LGPD). Cuando decimos "nosotros" o "VitalPair" en esta página, hablamos de él.',
            'El encargado de protección de datos es la misma persona: Alisson Pinheiro Souto. VitalPair es un proyecto de una sola persona, y la ley permite que el responsable asuma ese papel. Dudas, solicitudes o reclamaciones: {{mail}}. Respondemos en hasta tres días hábiles.',
          ],
        },
        {
          title: 'Qué recopilamos',
          paragraphs: [
            'Recopilamos solo lo necesario para que la app haga lo que promete: tú y otra persona en una temporada cuidando la salud.',
          ],
          bullets: [
            [
              'Registro',
              'nombre, correo y contraseña (la contraseña no se guarda: guardamos una huella que no se puede revertir).',
            ],
            [
              'Perfil de salud',
              'fecha de nacimiento, sexo, altura, peso y tu objetivo. Con eso estimamos tus metas y calorías.',
            ],
            [
              'Registros del día a día',
              'tus comidas (incluidas las fotos de plato que envías) y tus actividades físicas.',
            ],
            [
              'Datos de juego',
              'puntuación, rachas, misiones y quién es tu pareja en la temporada.',
            ],
            [
              'Acceso con Google',
              'si entras con Google, recibimos de Google tu nombre, correo y el identificador de la cuenta. Nada más.',
            ],
            [
              'Datos técnicos',
              'información básica de sesión para mantenerte conectado y proteger la cuenta (más detalle en la sección de cookies).',
            ],
          ],
          callout: {
            tone: 'rival',
            icon: 'info',
            text: 'Los datos de salud y biométricos se consideran sensibles según la LGPD. Por eso tratamos altura, peso, sexo, objetivo y registros de comida con cuidado extra, y solo los usamos para entregarte el servicio.',
          },
        },
        {
          title: 'Para qué los usamos',
          bullets: [
            [
              'Hacer funcionar la app',
              'crear y mantener tu cuenta, calcular metas, montar el marcador y llevar la temporada.',
            ],
            [
              'Estimar las calorías de la foto',
              'cuando fotografías el plato, la imagen se analiza con IA para estimar lo que hay. Tú revisas antes de confirmar.',
            ],
            ['Mostrar tu progreso', 'gráficos, rachas, historial y comparación con tu pareja.'],
            [
              'Cuidar la seguridad',
              'detectar accesos indebidos, prevenir fraude y proteger las cuentas.',
            ],
            [
              'Hablar contigo',
              'correos sobre la cuenta, como verificación y recuperación de contraseña. Nada de spam.',
            ],
          ],
        },
        {
          title: 'Con qué base legal',
          paragraphs: [
            'La LGPD exige que todo tratamiento tenga una base legal. Las nuestras son:',
          ],
          bullets: [
            [
              'Ejecución de contrato',
              'la mayoría de los datos se trata porque es lo que hace funcionar el servicio que contrataste.',
            ],
            [
              'Consentimiento',
              'para los datos sensibles de salud (peso, altura, sexo, objetivo, comidas y actividades) pedimos tu consentimiento, que puedes retirar cuando quieras.',
            ],
            [
              'Interés legítimo',
              'para seguridad, prevención de fraude y mejora del producto, siempre respetando tus derechos.',
            ],
            [
              'Cumplimiento de obligación legal',
              'cuando la ley nos obliga a guardar algo por un plazo.',
            ],
          ],
        },
        {
          title: 'Con quién compartimos',
          paragraphs: [
            'No vendemos tus datos. Punto. Compartimos solo con quien es necesario para que la app funcione, y cada uno trata los datos de forma limitada:',
          ],
          bullets: [
            [
              'Google (acceso)',
              'si usas "entrar con Google", la autenticación pasa por Google (OAuth2). Google lo trata según su propia política.',
            ],
            [
              'Anthropic (IA de la foto)',
              'la imagen del plato se envía a Anthropic, que procesa la foto para estimar las calorías y devuelve el resultado. Es un proveedor de IA, actuando como operador a petición nuestra.',
            ],
            [
              'Infraestructura',
              'Oracle Cloud Infrastructure aloja la aplicación y la base de datos (PostgreSQL), en la región de São Paulo, Brasil. Los términos de Oracle incluyen un acuerdo de tratamiento de datos, con obligación de confidencialidad.',
            ],
            [
              'Autoridades',
              'solo si la ley nos obliga, por orden judicial o requerimiento legítimo.',
            ],
            [
              'Fuera de Brasil',
              'la foto del plato es lo único que sale del país: va a Anthropic, en Estados Unidos, el tiempo de estimar las calorías. Lo demás (cuenta, comidas, pesos, temporadas) se queda en Brasil, en Oracle São Paulo. La transferencia está prevista en el artículo 33 de la LGPD, para ejecutar el servicio que pediste.',
            ],
          ],
          callout: {
            tone: 'brand',
            icon: 'alert',
            text: 'Tu pareja ve tu marcador, tus rachas y el hecho de que registraste algo, eso es parte del juego. Pero el contenido detallado de tus registros y tus datos de perfil siguen siendo tuyos.',
          },
        },
        {
          title: 'Cuánto tiempo los guardamos',
          paragraphs: [
            'Mantenemos tus datos mientras tu cuenta esté abierta. Cuando la cierras, borramos enseguida lo que registraste sobre ti: comidas, entrenamientos, pesos, planes, notificaciones y perfil. Lo que describe una temporada que jugaron los dos (el marcador, los puntos, las medallas) se queda, pero sin tu nombre: también es la historia de tu dupla, y el artículo 12 de la LGPD considera que un dato anonimizado ya no es un dato personal. Tu correo queda libre, así que puedes volver con el mismo. Las copias de seguridad técnicas tardan un poco más en expirar, dentro del ciclo normal de rotación.',
          ],
        },
        {
          title: 'Tus derechos',
          paragraphs: ['Como titular de los datos, la LGPD te garantiza, y respetamos:'],
          bullets: [
            ['Acceso', 'saber qué datos tuyos tenemos.'],
            ['Corrección', 'arreglar datos incompletos o erróneos.'],
            ['Eliminación', 'pedir borrar tus datos y cerrar la cuenta.'],
            ['Portabilidad', 'recibir tus datos en un formato legible.'],
            [
              'Revocar consentimiento',
              'retirar el consentimiento de los datos de salud en cualquier momento.',
            ],
            ['Información', 'saber con quién compartimos y por qué.'],
          ],
          paragraphsAfter: [
            'Para ejercer cualquiera de estos, escribe a {{mail}}. Buena parte también lo resuelves directo en los ajustes de la cuenta.',
          ],
        },
        {
          title: 'Cookies y sesión',
          paragraphs: [
            'Usamos lo mínimo. Guardamos una cookie o token de sesión para mantenerte conectado y proteger tu cuenta. Sin eso, tendrías que escribir la contraseña en cada clic. No usamos cookies para perseguirte con publicidad por ahí.',
          ],
        },
        {
          title: 'Seguridad',
          paragraphs: [
            'Las contraseñas se guardan con hash, no en texto: ni nosotros podemos leerlas. El tráfico viaja por HTTPS. Ningún sistema es infalible, y si pasa algo grave, te avisamos y avisamos a la ANPD como manda la ley.',
          ],
        },
        {
          title: 'Cambios en esta política',
          paragraphs: [
            'Si cambiamos algo relevante aquí, actualizamos la fecha de vigencia arriba y, cuando sea un cambio importante, te avisamos dentro de la app o por correo. Seguir usando VitalPair después de eso significa que estás de acuerdo con la versión nueva.',
          ],
        },
        {
          title: 'Hablar con el encargado',
          paragraphs: [
            'Cualquier asunto de privacidad, duda sobre tus datos o ejercicio de un derecho, solo escribe a {{mail}}. Hay gente de verdad leyendo.',
          ],
        },
      ],
    },

    terms: {
      badge: 'el acuerdo de la casa',
      title: 'Términos de Uso',
      intro:
        'Estas son las reglas para usar VitalPair. Lectura rápida, sin trampa. Al crear cuenta o usar la app, aceptas lo que está aquí. Si no estás de acuerdo con algo, mejor no la uses.',
      effective: 'Versión 1, septiembre de 2026',
      sections: [
        {
          title: 'Qué es VitalPair',
          paragraphs: [
            'VitalPair es una app web donde dos personas (pareja, amigos, hermanos, quien se anime) compiten en una temporada de 30 días cuidando la salud: registran comidas, incluso por foto con ayuda de IA, registran actividad física, y siguen el marcador, las rachas y las misiones. La idea es simple: es más fácil mantener la rutina cuando tienes a alguien al lado.',
          ],
        },
        {
          title: 'Cuenta y quién puede usarla',
          bullets: [
            ['Edad', 'necesitas tener al menos 18 años para crear una cuenta.'],
            [
              'Datos de verdad',
              'usa información real al registrarte. Altura, peso y objetivo erróneos estropean tus metas y el juego.',
            ],
            [
              'Tu contraseña es tuya',
              'mantén la contraseña en secreto. Todo lo que pase en tu cuenta es tu responsabilidad.',
            ],
            [
              'Acceso con Google',
              'puedes entrar con Google. En ese caso también valen los términos de Google para la autenticación.',
            ],
            ['Una cuenta por persona', 'nada de crear varias cuentas para burlar el marcador.'],
          ],
        },
        {
          title: 'Conducta: lo que no se vale',
          paragraphs: ['Al usar VitalPair, te comprometes a no:'],
          bullets: [
            [
              'Hacer trampa',
              'registrar cosas falsas solo para inflar la puntuación o perjudicar a tu pareja.',
            ],
            [
              'Atacar el sistema',
              'intentar invadir, sobrecargar, raspar datos o saltarte la seguridad.',
            ],
            [
              'Usar contenido de terceros',
              'enviar fotos o contenido que no son tuyos o que violen derechos de alguien.',
            ],
            ['Acosar', 'usar la app para molestar, ofender o exponer a otra persona.'],
            ['Revender', 'explotar el servicio comercialmente sin nuestra autorización.'],
          ],
          paragraphsAfter: [
            'Si rompes estas reglas, podemos suspender o cerrar tu cuenta, según la gravedad.',
          ],
        },
        {
          title: 'Salud: esto NO es orientación médica',
          calloutFirst: true,
          callout: {
            tone: 'danger',
            icon: 'alert',
            text: 'VitalPair es una herramienta de motivación y seguimiento, no un profesional de la salud. Nada de aquí (estimación de calorías, metas, sugerencias, números) sustituye la orientación de un médico, nutricionista o entrenador.',
          },
          paragraphs: [
            'Las estimaciones de calorías a partir de foto son aproximadas, hechas por IA, y pueden fallar. Úsalas como referencia, no como verdad absoluta. Antes de cambiar tu dieta, empezar entreno pesado o tomar cualquier decisión de salud, habla con un profesional cualificado. Si tienes alguna condición de salud, eso vale el doble.',
            'En una emergencia, busca atención médica. VitalPair no es un canal de emergencia ni de consejo clínico.',
          ],
        },
        {
          title: 'Plan gratuito y plan de pago',
          paragraphs: [
            'Hoy VitalPair es gratis y no pide tarjeta. Las temporadas van a seguir gratis: son el corazón del producto. Algún día quizá haya un plan de pago con funciones extra.',
          ],
          bullets: [
            [
              'Sin sorpresas',
              'nunca te cobraremos sin que hayas contratado un plan de pago de forma clara.',
            ],
            [
              'Cambio de precio',
              'si lanzamos planes de pago, el precio y lo que incluye cada plan estarán visibles antes de suscribirte.',
            ],
            [
              'El gratis sigue',
              'pensamos mantener un nivel gratuito, pero podemos ajustar lo que incluye con el tiempo.',
            ],
          ],
        },
        {
          title: 'Tu contenido y nuestra propiedad',
          paragraphs: [
            'Lo que creas (tus fotos, tus registros, tus datos) sigue siendo tuyo. Solo nos das el permiso necesario para procesar y mostrar ese contenido dentro de la app, como el servicio necesita para funcionar.',
            'La marca VitalPair, el nombre, el logo, el diseño, el código y los textos son nuestros. Usar la app no te da derecho a copiar, revender o reutilizar esas partes sin autorización.',
          ],
        },
        {
          title: 'Limitación de responsabilidad',
          paragraphs: [
            'Nos esforzamos por mantener VitalPair en línea y funcionando, pero el servicio se ofrece "tal cual". Puede haber inestabilidad, mantenimiento o estimaciones imprecisas. En la medida permitida por la ley, no respondemos por decisiones de salud que tomes con base en la app, ni por pérdidas indirectas derivadas del uso.',
            'Nada en estos términos elimina derechos que la legislación brasileña, incluido el Código de Defensa del Consumidor, te garantiza como consumidor.',
          ],
        },
        {
          title: 'Cierre de cuenta',
          bullets: [
            [
              'Te vas cuando quieras',
              'puedes cerrar la cuenta en cualquier momento en los ajustes. Tus datos siguen lo que dice la Política de Privacidad.',
            ],
            [
              'Podemos cerrarla',
              'si rompes estos términos o usas la app de forma abusiva o ilegal, podemos suspender o cerrar el acceso.',
            ],
            [
              'Aviso cuando se pueda',
              'siempre que sea posible, avisamos antes de cerrar y explicamos el motivo.',
            ],
          ],
        },
        {
          title: 'Ley y foro',
          paragraphs: [
            'Estos términos se rigen por las leyes de Brasil. Cualquier cuestión que no se resuelva de forma amistosa queda en el foro del domicilio del usuario, según el Código de Defensa del Consumidor.',
          ],
        },
        {
          title: 'Cambios en estos términos',
          paragraphs: [
            'Podemos actualizar estos términos. Cuando el cambio sea relevante, actualizamos la fecha de vigencia arriba y te avisamos en la app o por correo. Si sigues usando VitalPair después de eso, entendemos que aceptaste la versión nueva. Si no estás de acuerdo, solo cierra la cuenta.',
          ],
        },
        {
          title: 'Habla con nosotros',
          paragraphs: ['Cualquier duda sobre estos términos, escribe a {{mail}}.'],
        },
      ],
    },

    contact: {
      badge: 'hay gente de verdad del otro lado',
      title: 'Habla con nosotros',
      intro:
        'Un bug, una sugerencia, una duda sobre tus datos o solo para contar cómo fue tu temporada. Escribe aquí y respondemos. Nadie te va a dar un número de ticket.',
      nameLabel: 'Tu nombre',
      namePlaceholder: '¿Cómo te llamamos?',
      emailLabel: 'Tu correo',
      emailPlaceholder: 'para poder responderte',
      messageLabel: 'Tu mensaje',
      messagePlaceholder: 'Cuenta qué pasó o qué necesitas.',
      submit: 'Enviar mensaje',
      privacyNote: 'Usamos tu correo solo para responder este contacto.',
      sentTitle: 'Tu correo se abrió con el mensaje listo',
      sentText:
        'Solo revísalo y envíalo. Si no se abrió nada, escribe directo a {{mail}}: respondemos en hasta un día hábil.',
      nameRequired: 'Escribe tu nombre para saber con quién hablamos.',
      emailInvalid: 'Revisa ese correo: le falta algo.',
      messageRequired: 'Cuéntanos qué pasó. El mensaje no puede quedar vacío.',
      sendAnother: 'Mandar otro',
      directEmail: 'CORREO DIRECTO',
      directEmailText:
        '¿Prefieres mandar desde tu propio correo? También vale. Es el mismo canal para temas de privacidad y ejercicio de tus derechos.',
      responseTime: 'Tiempo de respuesta',
      responseTimeText: 'Normalmente hasta tres días hábiles. Los bugs graves los priorizamos.',
      faqTitle: 'Preguntas rápidas',
      faqFreeQ: '¿VitalPair es gratis?',
      faqFreeA:
        'Hoy todo es gratis y no pedimos tarjeta. Las temporadas van a seguir gratis. Algún día quizá haya un plan de pago con funciones extra, y te lo diremos antes.',
      faqPhotoQ: '¿A dónde va la foto del plato?',
      faqPhotoA:
        'La imagen se analiza con IA (Anthropic) solo para estimar las calorías y devolverte el resultado. El detalle completo está en la Política de Privacidad.',
      faqPhotoLink: 'Política de Privacidad',
      faqDeleteQ: '¿Cómo borro mi cuenta y mis datos?',
      faqDeleteA:
        'Puedes cerrar la cuenta en los ajustes, o mandar un correo a {{mail}} y lo resolvemos.',
    },
  },

  fr: {
    back: 'Retour',
    brandTagline: 'La santé, c’est mieux à deux',
    footerRights: '© 2026 VitalPair · La santé, c’est mieux à deux',
    footerPrivacy: 'Confidentialité',
    footerTerms: 'Conditions',
    footerContact: 'Contact',

    privacy: {
      badge: 'tes données, sans petits caractères',
      title: 'Politique de Confidentialité',
      intro:
        'VitalPair traite des informations de santé, c’est quelque chose de sensible. Ici on t’explique en mots normaux ce qu’on collecte, pourquoi on le collecte et ce que tu peux nous demander d’en faire. Sans jargon juridique pour cacher le jeu.',
      effective: 'Version 1, septembre 2026',
      sections: [
        {
          title: 'Qui est responsable',
          paragraphs: [
            'Le responsable de tes données personnelles est Alisson Pinheiro Souto, micro-entrepreneur individuel (MEI) inscrit au CNPJ 65.088.337/0001-48, au Brésil, au sens de la loi 13.709/2018 (la LGPD). Quand on dit "nous" ou "VitalPair" sur cette page, c’est de lui qu’on parle.',
            'Le délégué à la protection des données, c’est la même personne : Alisson Pinheiro Souto. VitalPair est un projet d’une seule personne, et la loi permet au responsable d’assumer ce rôle. Questions, demandes ou réclamations : {{mail}}. On répond sous trois jours ouvrés.',
          ],
        },
        {
          title: 'Ce qu’on collecte',
          paragraphs: [
            'On ne collecte que ce dont l’app a besoin pour faire ce qu’elle promet : toi et quelqu’un d’autre dans une saison à prendre soin de votre santé.',
          ],
          bullets: [
            [
              'Compte',
              'nom, e-mail et mot de passe (le mot de passe n’est pas stocké : on en garde une empreinte qu’on ne peut pas inverser).',
            ],
            [
              'Profil de santé',
              'date de naissance, sexe, taille, poids et ton objectif. C’est avec ça qu’on estime tes objectifs et tes calories.',
            ],
            [
              'Enregistrements du quotidien',
              'tes repas (y compris les photos d’assiette que tu envoies) et tes activités physiques.',
            ],
            ['Données de jeu', 'points, séries, missions et qui est ton binôme dans la saison.'],
            [
              'Connexion Google',
              'si tu te connectes avec Google, on reçoit de Google ton nom, ton e-mail et l’identifiant du compte. Rien de plus.',
            ],
            [
              'Données techniques',
              'infos basiques de session pour te garder connecté et protéger le compte (plus de détail dans la section cookies).',
            ],
          ],
          callout: {
            tone: 'rival',
            icon: 'info',
            text: 'Les données de santé et biométriques sont considérées comme sensibles par la LGPD. C’est pourquoi on traite taille, poids, sexe, objectif et enregistrements alimentaires avec un soin supplémentaire, et on ne les utilise que pour te fournir le service.',
          },
        },
        {
          title: 'À quoi ça sert',
          bullets: [
            [
              'Faire fonctionner l’app',
              'créer et maintenir ton compte, calculer les objectifs, monter le classement et gérer la saison.',
            ],
            [
              'Estimer les calories de la photo',
              'quand tu photographies l’assiette, l’image est analysée par IA pour estimer ce qu’il y a. Tu vérifies avant de confirmer.',
            ],
            [
              'Montrer ta progression',
              'graphiques, séries, historique et comparaison avec ton binôme.',
            ],
            [
              'Veiller à la sécurité',
              'détecter les accès indus, prévenir la fraude et protéger les comptes.',
            ],
            [
              'Te parler',
              'e-mails sur le compte, comme la vérification et la récupération du mot de passe. Pas de spam.',
            ],
          ],
        },
        {
          title: 'Sur quelle base légale',
          paragraphs: ['La LGPD exige que tout traitement ait une base légale. Les nôtres sont :'],
          bullets: [
            [
              'Exécution du contrat',
              'la plupart des données sont traitées parce que c’est ce qui fait fonctionner le service auquel tu as souscrit.',
            ],
            [
              'Consentement',
              'pour les données de santé sensibles (poids, taille, sexe, objectif, repas et activités) on demande ton consentement, que tu peux retirer quand tu veux.',
            ],
            [
              'Intérêt légitime',
              'pour la sécurité, la prévention de la fraude et l’amélioration du produit, toujours en respectant tes droits.',
            ],
            [
              'Obligation légale',
              'quand la loi nous oblige à conserver quelque chose pendant un délai.',
            ],
          ],
        },
        {
          title: 'Avec qui on partage',
          paragraphs: [
            'On ne vend pas tes données. Point. On partage seulement avec qui est nécessaire pour faire tourner l’app, et chacun traite les données de façon limitée :',
          ],
          bullets: [
            [
              'Google (connexion)',
              'si tu utilises "se connecter avec Google", l’authentification passe par Google (OAuth2). Google traite ça selon sa propre politique.',
            ],
            [
              'Anthropic (IA de la photo)',
              'l’image de l’assiette est envoyée à Anthropic, qui traite la photo pour estimer les calories et renvoie le résultat. C’est un fournisseur d’IA, agissant comme sous-traitant à notre demande.',
            ],
            [
              'Infrastructure',
              'Oracle Cloud Infrastructure héberge l’application et la base de données (PostgreSQL), dans la région de São Paulo, au Brésil. Les conditions d’Oracle incluent un accord de traitement des données, avec obligation de confidentialité.',
            ],
            [
              'Autorités',
              'seulement si la loi nous y oblige, sur décision de justice ou réquisition légitime.',
            ],
            [
              'Hors du Brésil',
              'la photo du plat est le seul élément qui quitte le pays : elle part chez Anthropic, aux États-Unis, le temps d’estimer les calories. Le reste (compte, repas, poids, saisons) reste au Brésil, chez Oracle à São Paulo. Le transfert est prévu par l’article 33 de la LGPD, pour exécuter le service que tu as demandé.',
            ],
          ],
          callout: {
            tone: 'brand',
            icon: 'alert',
            text: 'Ton binôme voit ton score, tes séries et le fait que tu as enregistré quelque chose, ça fait partie du jeu. Mais le contenu détaillé de tes enregistrements et tes données de profil restent à toi.',
          },
        },
        {
          title: 'Combien de temps on conserve',
          paragraphs: [
            'On garde tes données tant que ton compte est ouvert. Quand tu le fermes, on efface tout de suite ce que tu as noté sur toi : repas, entraînements, poids, programmes, notifications et profil. Ce qui décrit une saison disputée à deux (le classement, les points, les badges) reste, mais sans ton nom : c’est aussi l’histoire de ton binôme, et l’article 12 de la LGPD considère qu’une donnée anonymisée n’est plus une donnée personnelle. Ton adresse e-mail est libérée, tu peux donc revenir avec la même. Les sauvegardes techniques mettent un peu plus de temps à expirer, dans le cycle normal de rotation.',
          ],
        },
        {
          title: 'Tes droits',
          paragraphs: ['En tant que titulaire des données, la LGPD te garantit, et on respecte :'],
          bullets: [
            ['Accès', 'savoir quelles données te concernant on détient.'],
            ['Correction', 'corriger une donnée incomplète ou erronée.'],
            ['Suppression', 'demander d’effacer tes données et fermer le compte.'],
            ['Portabilité', 'recevoir tes données dans un format lisible.'],
            [
              'Retrait du consentement',
              'retirer le consentement aux données de santé à tout moment.',
            ],
            ['Information', 'savoir avec qui on partage et pourquoi.'],
          ],
          paragraphsAfter: [
            'Pour exercer l’un de ces droits, écris à {{mail}}. Une bonne partie se règle aussi directement dans les paramètres du compte.',
          ],
        },
        {
          title: 'Cookies et session',
          paragraphs: [
            'On utilise le minimum. On stocke un cookie ou jeton de session pour te garder connecté et protéger ton compte. Sans ça, tu devrais taper ton mot de passe à chaque clic. On n’utilise pas de cookies pour te poursuivre avec de la pub partout.',
          ],
        },
        {
          title: 'Sécurité',
          paragraphs: [
            'Les mots de passe sont hachés, pas stockés : même nous, on ne peut pas les relire. Le trafic passe en HTTPS. Aucun système n’est infaillible, et si quelque chose de grave arrive, on te prévient et on prévient l’ANPD comme la loi l’exige.',
          ],
        },
        {
          title: 'Changements de cette politique',
          paragraphs: [
            'Si on change quelque chose d’important ici, on met à jour la date d’entrée en vigueur en haut et, pour un changement important, on te prévient dans l’app ou par e-mail. Continuer à utiliser VitalPair après ça signifie que tu es d’accord avec la nouvelle version.',
          ],
        },
        {
          title: 'Parler au délégué',
          paragraphs: [
            'Tout sujet de confidentialité, question sur tes données ou exercice d’un droit, écris simplement à {{mail}}. De vraies personnes lisent.',
          ],
        },
      ],
    },

    terms: {
      badge: 'la règle de la maison',
      title: 'Conditions d’Utilisation',
      intro:
        'Voici les règles pour utiliser VitalPair. Lecture rapide, sans piège. En créant un compte ou en utilisant l’app, tu acceptes ce qui est ici. Si tu n’es pas d’accord avec quelque chose, mieux vaut ne pas l’utiliser.',
      effective: 'Version 1, septembre 2026',
      sections: [
        {
          title: 'Ce qu’est VitalPair',
          paragraphs: [
            'VitalPair est une app web où deux personnes (un couple, des amis, des frères et sœurs, qui vous voulez) s’affrontent sur une saison de 30 jours en prenant soin de leur santé : elles enregistrent des repas, y compris par photo avec l’aide de l’IA, enregistrent leur activité physique, et suivent le classement, les séries et les missions. L’idée est simple : c’est plus facile de tenir la routine quand quelqu’un est dedans avec toi.',
          ],
        },
        {
          title: 'Compte et qui peut l’utiliser',
          bullets: [
            ['Âge', 'tu dois avoir au moins 18 ans pour créer un compte.'],
            [
              'De vraies données',
              'utilise de vraies infos à l’inscription. Une taille, un poids et un objectif faux gâchent tes objectifs et le jeu.',
            ],
            [
              'Ton mot de passe est à toi',
              'garde ton mot de passe secret. Tout ce qui se passe sur ton compte est ta responsabilité.',
            ],
            [
              'Connexion Google',
              'tu peux te connecter avec Google. Dans ce cas, les conditions de Google pour l’authentification s’appliquent aussi.',
            ],
            [
              'Un compte par personne',
              'pas question de créer plusieurs comptes pour fausser le classement.',
            ],
          ],
        },
        {
          title: 'Conduite : ce qui ne passe pas',
          paragraphs: ['En utilisant VitalPair, tu t’engages à ne pas :'],
          bullets: [
            [
              'Tricher au jeu',
              'enregistrer de fausses choses juste pour gonfler ton score ou nuire à ton binôme.',
            ],
            [
              'Attaquer le système',
              'tenter d’entrer, de surcharger, d’aspirer des données ou de contourner la sécurité.',
            ],
            [
              'Utiliser du contenu de tiers',
              'envoyer des photos ou du contenu qui ne sont pas à toi ou qui violent les droits de quelqu’un.',
            ],
            ['Harceler', 'utiliser l’app pour déranger, offenser ou exposer une autre personne.'],
            ['Revendre', 'exploiter le service commercialement sans notre autorisation.'],
          ],
          paragraphsAfter: [
            'Si tu enfreins ces règles, on peut suspendre ou fermer ton compte, selon la gravité.',
          ],
        },
        {
          title: 'Santé : ceci n’est PAS un avis médical',
          calloutFirst: true,
          callout: {
            tone: 'danger',
            icon: 'alert',
            text: 'VitalPair est un outil de motivation et de suivi, pas un professionnel de santé. Rien ici (estimation de calories, objectifs, suggestions, chiffres) ne remplace l’avis d’un médecin, d’un nutritionniste ou d’un coach.',
          },
          paragraphs: [
            'Les estimations de calories à partir d’une photo sont approximatives, faites par IA, et peuvent se tromper. Utilise-les comme repère, pas comme vérité absolue. Avant de changer ton alimentation, de commencer un entraînement lourd ou de prendre une décision de santé, parle à un professionnel qualifié. Si tu as une condition de santé, ça compte double.',
            'En cas d’urgence, consulte un médecin. VitalPair n’est ni un canal d’urgence ni un conseil clinique.',
          ],
        },
        {
          title: 'Offre gratuite et offre payante',
          paragraphs: [
            'Aujourd’hui VitalPair est gratuit et ne demande pas de carte. Les saisons resteront gratuites : c’est le cœur du produit. Un jour il y aura peut-être une offre payante avec des fonctions en plus.',
          ],
          bullets: [
            [
              'Sans surprise',
              'on ne te facturera jamais sans que tu aies clairement souscrit à une offre payante.',
            ],
            [
              'Changement de prix',
              'si on lance des offres payantes, le prix et ce que chaque offre inclut seront visibles avant que tu t’abonnes.',
            ],
            [
              'Le gratuit reste',
              'on compte garder un niveau gratuit, mais on peut ajuster ce qu’il inclut avec le temps.',
            ],
          ],
        },
        {
          title: 'Ton contenu et notre propriété',
          paragraphs: [
            'Ce que tu crées (tes photos, tes enregistrements, tes données) reste à toi. Tu nous donnes seulement l’autorisation nécessaire pour traiter et afficher ce contenu dans l’app, comme le service en a besoin pour fonctionner.',
            'La marque VitalPair, le nom, le logo, le design, le code et les textes sont à nous. Utiliser l’app ne te donne pas le droit de copier, revendre ou réutiliser ces parties sans autorisation.',
          ],
        },
        {
          title: 'Limitation de responsabilité',
          paragraphs: [
            'On s’efforce de garder VitalPair en ligne et fonctionnel, mais le service est fourni "en l’état". Il peut y avoir de l’instabilité, de la maintenance ou des estimations imprécises. Dans la mesure permise par la loi, on n’est pas responsables des décisions de santé que tu prends sur la base de l’app, ni des pertes indirectes liées à son usage.',
            'Rien dans ces conditions ne supprime les droits que la législation brésilienne, y compris le Code de Défense du Consommateur, te garantit en tant que consommateur.',
          ],
        },
        {
          title: 'Fermeture du compte',
          bullets: [
            [
              'Tu pars quand tu veux',
              'tu peux fermer le compte à tout moment dans les paramètres. Tes données suivent la Politique de Confidentialité.',
            ],
            [
              'On peut le fermer',
              'si tu enfreins ces conditions ou utilises l’app de façon abusive ou illégale, on peut suspendre ou fermer l’accès.',
            ],
            [
              'Préavis quand on peut',
              'autant que possible, on prévient avant de fermer et on explique pourquoi.',
            ],
          ],
        },
        {
          title: 'Loi et juridiction',
          paragraphs: [
            'Ces conditions sont régies par les lois du Brésil. Toute question qui ne peut pas se régler à l’amiable relève de la juridiction du domicile de l’utilisateur, selon le Code de Défense du Consommateur.',
          ],
        },
        {
          title: 'Modifications de ces conditions',
          paragraphs: [
            'On peut mettre à jour ces conditions. Quand le changement est important, on met à jour la date d’entrée en vigueur en haut et on te prévient dans l’app ou par e-mail. Si tu continues à utiliser VitalPair après ça, on considère que tu as accepté la nouvelle version. Si tu n’es pas d’accord, ferme simplement le compte.',
          ],
        },
        {
          title: 'Parle avec nous',
          paragraphs: ['Toute question sur ces conditions, écris à {{mail}}.'],
        },
      ],
    },

    contact: {
      badge: 'il y a une vraie personne de l’autre côté',
      title: 'Parle avec nous',
      intro:
        'Un bug, une suggestion, une question sur tes données ou juste pour raconter comment s’est passée ta saison. Écris ici et on répond. Personne ne te donnera un numéro de ticket.',
      nameLabel: 'Ton nom',
      namePlaceholder: 'Comment on t’appelle ?',
      emailLabel: 'Ton e-mail',
      emailPlaceholder: 'pour qu’on puisse te répondre',
      messageLabel: 'Ton message',
      messagePlaceholder: 'Raconte ce qu’il s’est passé ou ce dont tu as besoin.',
      submit: 'Envoyer le message',
      privacyNote: 'On utilise ton e-mail uniquement pour répondre à ce contact.',
      sentTitle: 'Ta messagerie s’est ouverte avec le message prêt',
      sentText:
        'Il suffit de vérifier et d’envoyer. Si rien ne s’est ouvert, écris directement à {{mail}} : on répond sous un jour ouvré.',
      nameRequired: 'Écris ton nom pour qu’on sache à qui on parle.',
      emailInvalid: 'Vérifie cet e-mail : il manque quelque chose.',
      messageRequired: 'Raconte ce qui s’est passé. Le message ne peut pas être vide.',
      sendAnother: 'En envoyer un autre',
      directEmail: 'E-MAIL DIRECT',
      directEmailText:
        'Tu préfères envoyer depuis ton propre e-mail ? Ça marche aussi. C’est le même canal pour les sujets de confidentialité et l’exercice de tes droits.',
      responseTime: 'Temps de réponse',
      responseTimeText: 'En général sous trois jours ouvrés. Les bugs graves, on les priorise.',
      faqTitle: 'Questions rapides',
      faqFreeQ: 'VitalPair est-il gratuit ?',
      faqFreeA:
        'Aujourd’hui tout est gratuit, et on ne demande pas de carte. Les saisons resteront gratuites. Un jour il y aura peut-être une offre payante avec des fonctions en plus, et on te le dira avant.',
      faqPhotoQ: 'Où va la photo de l’assiette ?',
      faqPhotoA:
        'L’image est analysée par IA (Anthropic) uniquement pour estimer les calories et te renvoyer le résultat. Le détail complet est dans la Politique de Confidentialité.',
      faqPhotoLink: 'Politique de Confidentialité',
      faqDeleteQ: 'Comment je supprime mon compte et mes données ?',
      faqDeleteA:
        'Tu peux fermer le compte dans les paramètres, ou écrire à {{mail}} et on s’en occupe.',
    },
  },
} as const
