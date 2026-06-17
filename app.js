/* ==========================================
   SUPABASE CONFIGURATION
   Substitua os valores abaixo com as
   credenciais do seu projeto Supabase.
   ========================================== */
const SUPABASE_URL  = 'https://hzwwsbgppdbihyxvdxrn.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d3dzYmdwcGRiaWh5eHZkeHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NDU0MDUsImV4cCI6MjA5NzIyMTQwNX0.ggzeIB9eN3cZEq5fkn0fcqeqdRpf58FUQP9xeyT-3Yg';

/* ==========================================
   SUPABASE — REST API direta (sem SDK)
   Compatível com chaves sb_publishable_ e eyJ
   ========================================== */
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};
const SB_READY = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_KEY !== 'YOUR_SUPABASE_ANON_KEY';

/* ==========================================
   SYNC INDICATOR
   ========================================== */
const syncEl = document.getElementById('sync-indicator');
const syncDot = syncEl ? syncEl.querySelector('.sync-dot') : null;
const syncText = document.getElementById('sync-text');

function setSyncStatus(status) {
  if (!syncEl) return;
  syncEl.className = 'sync-indicator ' + status;
  const labels = { synced: 'Sincronizado', syncing: 'Sincronizando…', offline: 'Offline' };
  if (syncText) syncText.textContent = labels[status] || status;
}

/* ==========================================
   STORAGE — localStorage + Supabase
   ========================================== */
const PREFIX = 'et2-';

function localGet(key) {
  return localStorage.getItem(PREFIX + key) || null;
}

function localSet(key, value) {
  localStorage.setItem(PREFIX + key, value);
}

async function sbUpsert(key, value) {
  if (!SB_READY) return;
  setSyncStatus('syncing');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/eurotrip_data`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setSyncStatus('synced');
  } catch (e) {
    console.warn('Supabase upsert error:', e);
    setSyncStatus('offline');
  }
}

async function save(key, value) {
  localSet(key, value);
  await sbUpsert(key, value);
}

async function loadFromSupabase() {
  if (!SB_READY) return false;
  setSyncStatus('syncing');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/eurotrip_data?select=key,value`, {
      headers: SB_HEADERS
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      data.forEach(row => {
        if (row.key && row.value !== null) {
          localStorage.setItem(PREFIX + row.key, row.value);
        }
      });
    }
    setSyncStatus('synced');
    return true;
  } catch (e) {
    console.warn('Supabase load error:', e);
    setSyncStatus('offline');
    return false;
  }
}

/* ==========================================
   COUNTDOWN — meses · dias · horas · min · seg
   Alvo: 18 de setembro de 2026
   ========================================== */
function updateCountdown() {
  const target = new Date('2026-09-18T00:00:00');
  const now = new Date();
  let diff = target - now;

  if (diff <= 0) {
    ['cd-months','cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '00';
    });
    return;
  }

  // Calculate whole months remaining
  let y = target.getFullYear() - now.getFullYear();
  let m = target.getMonth() - now.getMonth();
  let months = y * 12 + m;
  // Subtract one month if day not yet reached
  const sameMonthTarget = new Date(now.getFullYear(), now.getMonth() + months, target.getDate());
  if (sameMonthTarget > target) months--;
  if (months < 0) months = 0;

  // Remaining time after removing months
  const afterMonths = new Date(now.getFullYear(), now.getMonth() + months, now.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds());
  const rem = target - afterMonths;

  const days  = Math.floor(rem / 86400000);
  const hours = Math.floor((rem % 86400000) / 3600000);
  const mins  = Math.floor((rem % 3600000) / 60000);
  const secs  = Math.floor((rem % 60000) / 1000);

  const pad = n => String(n).padStart(2, '0');
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = pad(val); };
  set('cd-months', months);
  set('cd-days', days);
  set('cd-hours', hours);
  set('cd-mins', mins);
  set('cd-secs', secs);
}
setInterval(updateCountdown, 1000);
updateCountdown();

/* ==========================================
   TABS
   ========================================== */
function showTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tab-' + id);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ==========================================
   ITINERARY DATA
   ========================================== */
const ITINERARY = {
  paris: [
    {
      date: '18/Set · Qui', title: 'Chegada em Paris',
      items: [
        { time: 'Após 18h', desc: 'Chegada no Aeroporto Charles de Gaulle (CDG).' },
        { time: '~19h', desc: 'Trem RER B do aeroporto até o centro de Paris. 40 minutos, direto.' },
        { time: '~20h', desc: 'Check-in. Caminhada leve pelo bairro, jantar próximo.', note: 'Dia só de chegada e descanso.' },
      ],
      fields: [
        { id:'paris-d1-obs', label:'Observações', placeholder:'Notas livres...', type:'textarea' }
      ]
    },
    {
      date: '19/Set · Sex', title: 'Paris Clássica',
      items: [
        { time: '9h', desc: 'Torre Eiffel na abertura. Ingresso em toureiffel.paris com antecedência.' },
        { time: '11h', desc: 'Champ de Mars e orla do Rio Sena.' },
        { time: '13h', desc: 'Almoço em bistrô com menu du jour.' },
        { time: '14h30', desc: 'Museu d\'Orsay. Ingresso em musee-orsay.fr.' },
        { time: '17h', desc: 'Pont de l\'Alma e Rue Cler.' },
        { time: '20h', desc: 'Jantar em Saint-Germain-des-Prés.' },
      ],
      fields: [
        { id:'paris-d2-rest', label:'Restaurante do jantar', placeholder:'Nome do restaurante...' },
        { id:'paris-d2-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
    {
      date: '20/Set · Sáb', title: 'Montmartre e Le Marais',
      items: [
        { time: '9h', desc: 'Sacré-Coeur e Montmartre. Chegar cedo antes das multidões.' },
        { time: '12h', desc: 'Bairro Le Marais. Place des Vosges, galerias, Musée Picasso.' },
        { time: '13h30', desc: 'Almoço no Marais.' },
        { time: '20h', desc: 'Passeio de Bateau Mouche pelo Sena iluminado.' },
      ],
      fields: [
        { id:'paris-d3-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
    {
      date: '21/Set · Dom', title: 'Louvre e Partida para Zurique',
      items: [
        { time: '9h', desc: 'Louvre na abertura. Ingresso em ticketlouvre.fr. Foco: Mona Lisa, Vênus de Milo, Antiguidades Egípcias.' },
        { time: '12h', desc: 'Almoço no Jardin du Palais Royal.' },
        { time: '~15h', desc: 'TREM: Paris Gare de Lyon → Zurique HB. TGV Lyria. ~3h20. Sem baldeação.', note: 'Chegada em Zurique ~18h20.' },
        { time: '~18h20', desc: 'Chegada em Zurique. Check-in. Jantar à beira do Rio Limmat.' },
      ],
      fields: [
        { id:'paris-d4-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
  ],
  zurique: [
    {
      date: '21/Set · Dom', title: 'Chegada em Zurique',
      items: [
        { time: '~18h20', desc: 'Chegada de trem vindo de Paris. Zurique HB é uma das estações mais bonitas da Europa.' },
        { time: '19h', desc: 'Check-in. A estação central fica no coração da cidade.' },
        { time: '20h', desc: 'Jantar na Altstadt. Caminhada à beira do Rio Limmat.', note: 'Dia de chegada e descanso após o trem.' },
      ],
      fields: [
        { id:'zur-d1-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
    {
      date: '22/Set · Seg', title: 'Zurique e Excursão Kilchberg',
      items: [
        { time: '9h', desc: 'Altstadt de Zurique. Niederdorfstrasse: rua histórica cheia de cafés, lojas e vida local.' },
        { time: '10h', desc: 'Grossmünster: catedral icônica do século XII com torres geminadas. Vista panorâmica de Zurique do alto.' },
        { time: '11h', desc: 'Fraumünster: vitrais de Marc Chagall — uma das experiências mais memoráveis da Suíça.' },
        { time: '12h', desc: 'Bahnhofstrasse: uma das ruas comerciais mais sofisticadas do mundo.' },
        { time: '13h', desc: 'Almoço em Zurique.' },
        { time: '14h30', desc: 'Trem Zurique → Kilchberg (~12 min). Lindt Home of Chocolate.', note: 'Reserve em lindt-home-of-chocolate.com.' },
        { time: '15h', desc: 'LINDT Home of Chocolate: museu interativo, degustação ilimitada e loja incrível.' },
        { time: '18h', desc: 'Retorno a Zurique. Lago de Zurique ao entardecer.' },
        { time: '20h', desc: 'Jantar. Última noite na Suíça.' },
      ],
      fields: [
        { id:'zur-d2-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
    {
      date: '23/Set · Ter', title: 'Bernina Express → Milão',
      items: [
        { time: '~6h', desc: 'Saída de Zurique HB para Chur. SBB InterCity, ~1h14.' },
        { time: '~7h15', desc: 'Chegada em Chur. A plataforma do Bernina Express fica ao lado.' },
        { time: '8h28', desc: 'BERNINA EXPRESS (PE 951): Chur → Tirano. 196 pontes, 55 túneis, Passo Bernina a 2.253m. Patrimônio UNESCO.', note: 'Reserva de assento obrigatória em rhb.ch · CHF 44/pessoa.' },
        { time: '12h49', desc: 'Chegada em Tirano, Itália. Almoço na cidade.' },
        { time: '~14h', desc: 'Trem regional Trenord: Tirano → Milano Centrale via Lago di Como. ~3h.' },
        { time: '~17h', desc: 'Chegada em Milão. Check-in. Jantar nos Navigli.' },
      ],
      fields: [
        { id:'zur-d3-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
  ],
  milao: [
    {
      date: '23/Set · Ter', title: 'Chegada em Milão',
      items: [
        { time: '~17h', desc: 'Chegada de Tirano. Check-in no Airbnb em Brera.' },
        { time: '20h', desc: 'Jantar nos Navigli: canais, aperitivo milanesa com mesa farta incluída na bebida.' },
      ],
      fields: [{ id:'mi-d1-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '24/Set · Qua', title: 'Milão Clássico',
      items: [
        { time: '9h', desc: 'Duomo di Milano por dentro e na cobertura. Ingresso em duomomilano.it.' },
        { time: '11h', desc: 'Galleria Vittorio Emanuele II, ao lado do Duomo.' },
        { time: '13h', desc: 'Almoço no centro.' },
        { time: '14h30', desc: 'Santa Maria delle Grazie: O Cenáculo de Leonardo da Vinci.', note: 'RESERVA OBRIGATÓRIA em vivaticket.com. Verifique disponibilidade agora.' },
        { time: '16h30', desc: 'Quadrilatero della Moda: Via Monte Napoleone.' },
        { time: '20h', desc: 'Jantar em trattoria no centro.' },
      ],
      fields: [{ id:'mi-d2-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '25/Set · Qui', title: 'Brera e Navigli',
      items: [
        { time: '9h', desc: 'Bairro Brera. Galerias, mercado de antiguidades (às quintas), espresso autêntico.' },
        { time: '11h', desc: 'Pinacoteca di Brera. pinacotecabrera.org.' },
        { time: '13h', desc: 'Almoço no Brera.' },
        { time: '15h', desc: 'Castello Sforzesco.' },
        { time: '18h', desc: 'Navegação pelos canais do Navigli ao pôr do sol.' },
        { time: '20h', desc: 'Jantar no Navigli. Última noite em Milão.' },
      ],
      fields: [{ id:'mi-d3-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '26/Set · Sex', title: 'Partida para Veneza',
      items: [
        { time: '9h', desc: 'TREM: Milano Centrale → Venezia Santa Lucia. Frecciarossa ou Italo. ~2h15.', note: 'A chegada de trem em Veneza, com o Canal Grande na saída da estação, é inesquecível.' },
        { time: '11h15', desc: 'Chegada em Veneza. Check-in ou guarda-volumes.' },
        { time: '13h', desc: 'Ponte di Rialto e Mercado do Rialto. Caminhem sem mapa.' },
        { time: '16h30', desc: 'Campanile di San Marco no fim da tarde.' },
        { time: '18h30', desc: 'Piazza San Marco no pôr do sol.' },
        { time: '20h', desc: 'Jantar em bacaro veneziano com cicchetti.' },
      ],
      fields: [{ id:'mi-d4-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
  ],
  veneza: [
    {
      date: '26/Set · Sex', title: 'Chegada em Veneza',
      items: [
        { time: '11h15', desc: 'Chegada de Milão. Airbnb em Dorsoduro ou Cannaregio (dentro da ilha, nunca Mestre).' },
        { time: 'Tarde', desc: 'Rialto, Campanile, San Marco. Jantar em bacaro à noite.' },
      ],
      fields: [{ id:'ven-d1-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '27/Set · Sáb', title: 'Veneza Cedo e Dia Livre',
      items: [
        { time: '7h30', desc: 'Saiam cedo. Veneza antes das 9h é transformada: canais sem turistas, luz da manhã.' },
        { time: '9h45', desc: 'Basílica di San Marco na abertura. Mosaicos bizantinos do século XI.' },
        { time: '11h', desc: 'Caminhada pelos calli, gelato, fotos.' },
        { time: '13h', desc: 'Almoço.' },
        { time: 'Tarde', desc: 'Tempo livre. Explore sem destino certo.' },
        { time: '20h', desc: 'Jantar especial. Segunda e última noite em Veneza.' },
      ],
      fields: [{ id:'ven-d2-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '28/Set · Dom', title: 'Partida para Roma',
      items: [
        { time: '7h30', desc: 'Última manhã em Veneza. Café da manhã local.' },
        { time: '10h', desc: 'Check-out. Guarda-volumes na estação se necessário.' },
        { time: '~13h', desc: 'TREM: Venezia Santa Lucia → Roma Termini. Frecciarossa ou Italo. ~3h36.', note: 'Passando pela Toscana.' },
        { time: '~16h30', desc: 'Chegada em Roma Termini. Check-in. Jantar no bairro.' },
      ],
      fields: [{ id:'ven-d3-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
  ],
  roma: [
    {
      date: '28/Set · Dom', title: 'Chegada em Roma',
      items: [
        { time: '~16h30', desc: 'Chegada de Veneza. Check-in em Trastevere.' },
        { time: '20h', desc: 'Jantar no bairro. Roma começa amanhã.' },
      ],
      fields: [{ id:'roma-d1-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '29/Set · Seg', title: 'Coliseu e Foro Romano',
      items: [
        { time: '9h', desc: 'Coliseu com ingresso reservado em coopculture.it. Horário marcado obrigatório.' },
        { time: '11h', desc: 'Foro Romano e Palatino (incluídos no mesmo bilhete).' },
        { time: '13h', desc: 'Almoço no Testaccio, comida romana autêntica.' },
        { time: '15h', desc: 'Circo Máximo e Aventino. Jardim dos Laranjos: melhor mirante de Roma.' },
        { time: '20h', desc: 'Jantar em Trastevere.' },
      ],
      fields: [{ id:'roma-d2-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '30/Set · Ter', title: 'Vaticano — Aniversário de Jane',
      items: [
        { time: '8h30', desc: 'Museus do Vaticano na abertura. Reserva obrigatória em museivaticani.va.' },
        { time: '11h', desc: 'Capela Sistina. Um dos momentos mais emocionantes da viagem.' },
        { time: '13h', desc: 'Basílica de São Pedro. Entrada gratuita.' },
        { time: '15h30', desc: 'Almoço no bairro Prati, preços razoáveis.' },
        { time: '20h', desc: 'Jantar especial de aniversário de Jane. Reserve com antecedência.', note: 'Roma tem restaurantes incríveis em Trastevere.' },
      ],
      fields: [
        { id:'roma-d3-jantar', label:'Restaurante jantar aniversário', placeholder:'Nome e reserva...' },
        { id:'roma-d3-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
    {
      date: '01/Out · Qua', title: 'Centro Histórico Medieval',
      items: [
        { time: '9h', desc: 'Trastevere de manhã. Ruelas de paralelepípedo, igrejas medievais, mercado local.' },
        { time: '11h', desc: 'Fontana di Trevi. Joguem a moeda.' },
        { time: '12h', desc: 'Pantheon. Uma das maravilhas da Antiguidade.' },
        { time: '13h30', desc: 'Almoço próximo ao Pantheon. Evitem restaurantes na Piazza della Rotonda.' },
        { time: '15h', desc: 'Piazza Navona.' },
        { time: '20h', desc: 'Jantar em Trastevere.' },
      ],
      fields: [{ id:'roma-d4-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '02/Out · Qui', title: 'Galleria Borghese',
      items: [
        { time: '9h', desc: 'Galleria Borghese. RESERVA OBRIGATÓRIA em galleriaborghese.it. Bernini, Caravaggio, Tiziano.' },
        { time: '11h30', desc: 'Pincio: terraço panorâmico de Villa Borghese. Vista de Roma de graça.' },
        { time: '13h', desc: 'Almoço.' },
        { time: '15h', desc: 'Campo de Fiori e Piazza Farnese.' },
        { time: '20h', desc: 'Jantar no Campo de Fiori.' },
      ],
      fields: [{ id:'roma-d5-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }]
    },
    {
      date: '03/Out · Sex', title: 'Partida',
      items: [
        { time: 'Manhã', desc: 'Café da manhã, última caminhada. Roma não se despede fácil.' },
        { time: 'Conf. voo', desc: 'Leonardo Express: Roma Termini → Aeroporto Fiumicino. 30 min, direto, sai a cada 30 min.', note: 'Chegue ao aeroporto com 2h30 de antecedência.' },
      ],
      fields: [
        { id:'roma-d6-voo', label:'Nº do voo de volta', placeholder:'Ex: LA8030...' },
        { id:'roma-d6-checkout', label:'Horário de check-out', placeholder:'Ex: 10h' },
        { id:'roma-d6-obs', label:'Observações', placeholder:'Notas...', type:'textarea' }
      ]
    },
  ]
};

/* ==========================================
   BUILD DAY CARDS — com itens editáveis
   ========================================== */
function buildDays(city, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  ITINERARY[city].forEach((day, i) => {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.id = `${city}-day-${i}`;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'day-header';
    headerDiv.setAttribute('onclick', `toggleDay('${city}-day-${i}')`);
    headerDiv.innerHTML = `
      <div class="day-title-wrap">
        <span class="day-date">${day.date}</span>
        <span class="day-title">${day.title}</span>
      </div>
      <span class="day-toggle">▾</span>
    `;

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'day-body';
    bodyDiv.id = `${city}-day-${i}-body`;

    card.appendChild(headerDiv);
    card.appendChild(bodyDiv);
    container.appendChild(card);
    renderDayBody(city, i, day);
  });
}

function renderDayBody(city, dayIdx, day) {
  const body = document.getElementById(`${city}-day-${dayIdx}-body`);
  if (!body) return;

  const removedKey = `it-${city}-${dayIdx}-removed`;
  const customKey  = `it-${city}-${dayIdx}-custom`;
  const removedRaw = localGet(removedKey);
  const customRaw  = localGet(customKey);
  const removed = removedRaw ? JSON.parse(removedRaw) : [];
  const custom  = customRaw  ? JSON.parse(customRaw)  : [];

  let html = '<div class="timeline">';

  day.items.forEach((item, origIdx) => {
    if (removed.includes(origIdx)) return;
    html += `
      <div class="tl-item">
        <div class="tl-time">${item.time}</div>
        <div class="tl-dot"></div>
        <div class="tl-content">
          <div class="tl-desc">${item.desc}</div>
          ${item.note ? `<div class="tl-note">${item.note}</div>` : ''}
        </div>
        <button class="item-remove-btn" onclick="removeItem('${city}',${dayIdx},${origIdx})" title="Remover">×</button>
      </div>`;
  });

  custom.forEach((item, ci) => {
    html += `
      <div class="tl-item">
        <div class="tl-time">${escHtml(item.time)}</div>
        <div class="tl-dot tl-dot-custom"></div>
        <div class="tl-content">
          <div class="tl-desc">${escHtml(item.desc)}</div>
        </div>
        <button class="item-remove-btn" onclick="removeCustomItem('${city}',${dayIdx},${ci})" title="Remover">×</button>
      </div>`;
  });

  html += '</div>';

  // Add item form
  html += `
    <div class="day-add-row" style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--cream-dark);">
      <input class="edit-input add-time-input" id="${city}-${dayIdx}-new-time" type="text" placeholder="Horário" style="width:80px;flex-shrink:0;">
      <input class="edit-input" id="${city}-${dayIdx}-new-desc" type="text" placeholder="Adicionar atividade...">
      <button class="btn-add" onclick="addItem('${city}',${dayIdx})">Adicionar</button>
    </div>
    <button class="btn-restore" onclick="restoreDefaults('${city}',${dayIdx})" style="margin-top:8px;">Restaurar padrões</button>
  `;

  // Edit fields (obs only, no tickets)
  if (day.fields && day.fields.length) {
    html += '<div class="edit-section">';
    day.fields.forEach(field => {
      const saved = localGet(field.id) || '';
      html += `<div class="edit-field ${field.type === 'textarea' ? 'full' : ''}">
        <label class="edit-label">${field.label}</label>
        ${field.type === 'textarea'
          ? `<textarea class="edit-textarea" id="${field.id}" placeholder="${field.placeholder}" oninput="onFieldChange('${field.id}',this.value)">${escHtml(saved)}</textarea>`
          : `<input class="edit-input" type="text" id="${field.id}" value="${escAttr(saved)}" placeholder="${field.placeholder}" oninput="onFieldChange('${field.id}',this.value)">`
        }
      </div>`;
    });
    html += '</div>';
  }

  body.innerHTML = html;
}

function toggleDay(id) {
  document.getElementById(id).classList.toggle('open');
}

function removeItem(city, dayIdx, origIdx) {
  const key = `it-${city}-${dayIdx}-removed`;
  const raw = localGet(key);
  const list = raw ? JSON.parse(raw) : [];
  if (!list.includes(origIdx)) {
    list.push(origIdx);
    const val = JSON.stringify(list);
    localSet(key, val);
    sbUpsert(key, val);
  }
  renderDayBody(city, dayIdx, ITINERARY[city][dayIdx]);
}

function removeCustomItem(city, dayIdx, ci) {
  const key = `it-${city}-${dayIdx}-custom`;
  const raw = localGet(key);
  const list = raw ? JSON.parse(raw) : [];
  list.splice(ci, 1);
  const val = JSON.stringify(list);
  localSet(key, val);
  sbUpsert(key, val);
  renderDayBody(city, dayIdx, ITINERARY[city][dayIdx]);
}

function addItem(city, dayIdx) {
  const timeEl = document.getElementById(`${city}-${dayIdx}-new-time`);
  const descEl = document.getElementById(`${city}-${dayIdx}-new-desc`);
  if (!descEl || !descEl.value.trim()) return;
  const key = `it-${city}-${dayIdx}-custom`;
  const raw = localGet(key);
  const list = raw ? JSON.parse(raw) : [];
  list.push({ time: (timeEl ? timeEl.value.trim() : ''), desc: descEl.value.trim() });
  const val = JSON.stringify(list);
  localSet(key, val);
  sbUpsert(key, val);
  renderDayBody(city, dayIdx, ITINERARY[city][dayIdx]);
}

function restoreDefaults(city, dayIdx) {
  const key = `it-${city}-${dayIdx}-removed`;
  localSet(key, '[]');
  sbUpsert(key, '[]');
  renderDayBody(city, dayIdx, ITINERARY[city][dayIdx]);
}

/* ==========================================
   FIELD CHANGE
   ========================================== */
function onFieldChange(key, value) {
  localSet(key, value);
  sbUpsert(key, value);
}

/* ==========================================
   ACCOMMODATION
   ========================================== */
const HOSP_CITIES = [
  { key: 'paris',   label: 'PARIS · França',           hint: 'Saint-Germain ou Le Marais' },
  { key: 'zurique', label: 'ZURIQUE · Suíça',           hint: 'Altstadt ou perto da Bahnhof' },
  { key: 'milao',   label: 'MILÃO · Itália',            hint: 'Brera' },
  { key: 'veneza',  label: 'VENEZA · Itália',           hint: 'Dorsoduro ou Cannaregio (dentro da ilha)' },
  { key: 'roma',    label: 'ROMA · Itália',             hint: 'Trastevere' },
];

function buildHospedagem() {
  const container = document.getElementById('hosp-cards');
  if (!container) return;
  HOSP_CITIES.forEach(c => {
    const nomeKey = `hosp-${c.key}-nome`;
    const linkKey = `hosp-${c.key}-link`;
    const endKey  = `hosp-${c.key}-endereco`;
    const nome = localGet(nomeKey) || '';
    const link = localGet(linkKey) || '';
    const end  = localGet(endKey)  || '';

    const card = document.createElement('div');
    card.className = 'hosp-card';
    card.innerHTML = `
      <div class="hosp-card-city">${c.label} <span style="color:var(--text-light);font-weight:400;letter-spacing:0;">&nbsp;·&nbsp; ${c.hint}</span></div>
      <div class="hosp-fields">
        <div class="edit-field">
          <label class="edit-label">Nome da hospedagem</label>
          <input class="edit-input" type="text" id="${nomeKey}" value="${escAttr(nome)}" placeholder="Ex: Airbnb Marais Chic..." oninput="onFieldChange('${nomeKey}',this.value)">
        </div>
        <div class="edit-field">
          <label class="edit-label">Link da hospedagem</label>
          <div class="link-field-wrap">
            <input class="edit-input" type="text" id="${linkKey}" value="${escAttr(link)}" placeholder="https://airbnb.com/rooms/..." oninput="onFieldChange('${linkKey}',this.value)">
            <a class="link-open-btn" id="${linkKey}-btn" href="${escAttr(link) || '#'}" target="_blank" rel="noopener" onclick="return openHospLink('${linkKey}')" title="Abrir link">↗</a>
          </div>
        </div>
        <div class="edit-field">
          <label class="edit-label">Endereço completo</label>
          <input class="edit-input" type="text" id="${endKey}" value="${escAttr(end)}" placeholder="Rua, número, bairro..." oninput="onFieldChange('${endKey}',this.value)">
        </div>
      </div>
    `;
    container.appendChild(card);

    // Keep link-open-btn in sync
    const inp = card.querySelector(`#${linkKey}`);
    const btn = card.querySelector(`#${linkKey}-btn`);
    if (inp && btn) {
      inp.addEventListener('input', () => { btn.href = inp.value || '#'; });
    }
  });
}

function openHospLink(key) {
  const el = document.getElementById(key);
  const url = el ? el.value.trim() : '';
  if (!url || url === '#') return false;
  window.open(url, '_blank', 'noopener');
  return false;
}

/* ==========================================
   TRAINS
   ========================================== */
const TRENS = [
  {
    id: 'trem1', route: 'Paris → Zurique', bernina: false,
    info: '<strong>Data:</strong> 21 de setembro &nbsp;·&nbsp; <strong>Trem:</strong> TGV Lyria<br><strong>Saída:</strong> Paris Gare de Lyon ~15h &nbsp;·&nbsp; <strong>Chegada:</strong> Zurique HB ~18h20<br><strong>Duração:</strong> ~3h20 &nbsp;·&nbsp; Direto, sem baldeação<br><strong>Comprar:</strong> <a href="https://www.tgv-lyria.com" target="_blank" class="trem-buy-link" rel="noopener">tgv-lyria.com</a> ou <a href="https://www.raileurope.com" target="_blank" class="trem-buy-link" rel="noopener">raileurope.com</a>'
  },
  {
    id: 'trem2', route: 'Zurique → Chur', bernina: false,
    info: '<strong>Data:</strong> 23 de setembro &nbsp;·&nbsp; <strong>Trem:</strong> SBB InterCity<br><strong>Saída:</strong> Zurique HB ~6h &nbsp;·&nbsp; <strong>Chegada:</strong> Chur ~7h15<br><strong>Duração:</strong> ~1h14 &nbsp;·&nbsp; Direto<br><strong>Comprar:</strong> <a href="https://www.sbb.ch" target="_blank" class="trem-buy-link" rel="noopener">sbb.ch</a>'
  },
  {
    id: 'trem3', route: 'Bernina Express — Chur → Tirano', bernina: true,
    info: '<strong>Data:</strong> 23 de setembro &nbsp;·&nbsp; <strong>Trem:</strong> RhB Bernina Express (PE 951)<br><strong>Saída Chur:</strong> 8h28 &nbsp;·&nbsp; <strong>Chegada Tirano:</strong> 12h49<br><strong>Duração:</strong> ~4h &nbsp;·&nbsp; UNESCO &nbsp;·&nbsp; Panorâmico<br><strong>Bilhete:</strong> <a href="https://www.sbb.ch" target="_blank" class="trem-buy-link" rel="noopener">sbb.ch</a> (Zurique → Tirano)<br><strong>Reserva assento:</strong> <a href="https://www.rhb.ch" target="_blank" class="trem-buy-link" rel="noopener">rhb.ch</a> &nbsp;·&nbsp; CHF 44/pessoa &nbsp;·&nbsp; OBRIGATÓRIA',
    extraFields: [
      { id:'trem3-reserva', label:'Nº reserva assento (rhb.ch)', placeholder:'Ex: RHB...' },
      { id:'trem3-reserva-status', label:'Status reserva', type:'select' }
    ]
  },
  {
    id: 'trem4', route: 'Tirano → Milão', bernina: false,
    info: '<strong>Data:</strong> 23 de setembro &nbsp;·&nbsp; <strong>Trem:</strong> Trenord Regional<br><strong>Saída Tirano:</strong> ~14h &nbsp;·&nbsp; <strong>Chegada Milão:</strong> ~17h<br><strong>Duração:</strong> ~3h &nbsp;·&nbsp; Via Lago di Como<br><strong>Comprar:</strong> <a href="https://www.trenitalia.com" target="_blank" class="trem-buy-link" rel="noopener">trenitalia.com</a> ou na estação'
  },
  {
    id: 'trem5', route: 'Milão → Veneza', bernina: false,
    info: '<strong>Data:</strong> 26 de setembro &nbsp;·&nbsp; <strong>Trem:</strong> Frecciarossa ou Italo<br><strong>Saída:</strong> Milano Centrale ~9h &nbsp;·&nbsp; <strong>Chegada:</strong> Venezia S. Lucia ~11h15<br><strong>Duração:</strong> ~2h15 &nbsp;·&nbsp; Direto<br><strong>Comprar:</strong> <a href="https://www.trenitalia.com" target="_blank" class="trem-buy-link" rel="noopener">trenitalia.com</a> ou <a href="https://www.italotreno.com" target="_blank" class="trem-buy-link" rel="noopener">italotreno.com</a>'
  },
  {
    id: 'trem6', route: 'Veneza → Roma', bernina: false,
    info: '<strong>Data:</strong> 28 de setembro &nbsp;·&nbsp; <strong>Trem:</strong> Frecciarossa ou Italo<br><strong>Saída:</strong> Venezia S. Lucia ~13h &nbsp;·&nbsp; <strong>Chegada:</strong> Roma Termini ~16h30<br><strong>Duração:</strong> ~3h36 &nbsp;·&nbsp; Direto<br><strong>Comprar:</strong> <a href="https://www.trenitalia.com" target="_blank" class="trem-buy-link" rel="noopener">trenitalia.com</a> ou <a href="https://www.italotreno.com" target="_blank" class="trem-buy-link" rel="noopener">italotreno.com</a>'
  },
];

function buildTrens() {
  const container = document.getElementById('trens-list');
  if (!container) return;
  TRENS.forEach(t => {
    const card = document.createElement('div');
    card.className = 'trem-card' + (t.bernina ? ' bernina' : '');
    const ticketVal = localGet(t.id + '-ticket') || '';
    const statusVal = localGet(t.id + '-status') || 'pending';

    let extraHTML = '';
    if (t.extraFields) {
      t.extraFields.forEach(f => {
        const fVal = localGet(f.id) || '';
        if (f.type === 'select') {
          extraHTML += `<div class="edit-field">
            <label class="edit-label">${f.label}</label>
            <select class="edit-input edit-select" id="${f.id}" onchange="onFieldChange('${f.id}',this.value); updateTremBadge('${t.id}')">
              <option value="pending" ${fVal === 'pending' ? 'selected' : ''}>Pendente</option>
              <option value="booked" ${fVal === 'booked' ? 'selected' : ''}>Feita</option>
            </select>
          </div>`;
        } else {
          extraHTML += `<div class="edit-field">
            <label class="edit-label">${f.label}</label>
            <input class="edit-input" type="text" id="${f.id}" value="${escAttr(fVal)}" placeholder="${f.placeholder}" oninput="onFieldChange('${f.id}',this.value)">
          </div>`;
        }
      });
    }

    card.innerHTML = `
      <div>
        <div class="trem-route ${t.bernina ? 'bernina-route' : ''}">${t.route.replace('→','<span class="arrow">→</span>').replace('—','<span class="arrow">—</span>')}</div>
        <div class="trem-info">${t.info}</div>
        <div class="trem-fields">
          <div class="edit-field">
            <label class="edit-label">Nº do bilhete</label>
            <input class="edit-input" type="text" id="${t.id}-ticket" value="${escAttr(ticketVal)}" placeholder="Código do bilhete..." oninput="onFieldChange('${t.id}-ticket',this.value)">
          </div>
          <div class="edit-field">
            <label class="edit-label">Status</label>
            <select class="edit-input edit-select" id="${t.id}-status" onchange="onFieldChange('${t.id}-status',this.value); updateTremBadge('${t.id}')">
              <option value="pending" ${statusVal === 'pending' ? 'selected' : ''}>Pendente</option>
              <option value="booked" ${statusVal === 'booked' ? 'selected' : ''}>Comprado</option>
            </select>
          </div>
          ${extraHTML}
        </div>
      </div>
      <span class="trem-status ${statusVal === 'booked' ? 'status-booked' : 'status-pending'}" id="${t.id}-badge">${statusVal === 'booked' ? 'Comprado' : 'Pendente'}</span>
    `;
    container.appendChild(card);
  });
}

function updateTremBadge(tremId) {
  const sel = document.getElementById(tremId + '-status');
  const badge = document.getElementById(tremId + '-badge');
  if (!sel || !badge) return;
  const booked = sel.value === 'booked';
  badge.className = 'trem-status ' + (booked ? 'status-booked' : 'status-pending');
  badge.textContent = booked ? 'Comprado' : 'Pendente';
}

/* ==========================================
   TICKETS (Ingressos dinâmicos)
   ========================================== */
let ticketsList = [];
const TICKETS_KEY = 'ingressos-list';

function loadTickets() {
  const raw = localGet(TICKETS_KEY);
  ticketsList = raw ? JSON.parse(raw) : [];
  renderTickets();
}

function renderTickets() {
  const container = document.getElementById('ingressos-list');
  if (!container) return;
  container.innerHTML = '';
  if (ticketsList.length === 0) {
    container.innerHTML = '<div class="tickets-empty">Nenhum ingresso adicionado ainda.</div>';
    return;
  }
  ticketsList.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.innerHTML = `
      <div class="ticket-info">
        <div class="ticket-name">${escHtml(t.nome)}</div>
        <div class="ticket-meta">
          ${t.data ? escHtml(t.data) + ' &nbsp;·&nbsp; ' : ''}
          ${t.codigo ? 'Código: ' + escHtml(t.codigo) + ' &nbsp;·&nbsp; ' : ''}
          <span class="trem-status ${t.status === 'confirmado' ? 'status-booked' : 'status-pending'}" style="font-size:9px;padding:3px 8px;">${t.status === 'confirmado' ? 'Confirmado' : 'Pendente'}</span>
        </div>
      </div>
      <button class="ticket-delete-btn" onclick="deleteTicket(${i})" title="Excluir">×</button>
    `;
    container.appendChild(card);
  });
}

function addTicket() {
  const nome   = document.getElementById('new-ticket-nome');
  const data   = document.getElementById('new-ticket-data');
  const codigo = document.getElementById('new-ticket-codigo');
  const status = document.getElementById('new-ticket-status');
  if (!nome || !nome.value.trim()) { nome && nome.focus(); return; }
  ticketsList.push({
    id: Date.now(),
    nome:   nome.value.trim(),
    data:   data   ? data.value   : '',
    codigo: codigo ? codigo.value.trim() : '',
    status: status ? status.value : 'pendente'
  });
  saveTickets();
  if (nome)   nome.value   = '';
  if (data)   data.value   = '';
  if (codigo) codigo.value = '';
}

function deleteTicket(idx) {
  ticketsList.splice(idx, 1);
  saveTickets();
}

function saveTickets() {
  const val = JSON.stringify(ticketsList);
  localSet(TICKETS_KEY, val);
  sbUpsert(TICKETS_KEY, val);
  renderTickets();
}

/* ==========================================
   CHECKLIST
   ========================================== */
const CHECKLISTS = {
  docs: [
    'Passaporte com validade mínima até março de 2027 (emitir com 3 meses de antecedência)',
    'Passaporte da Jane com validade mínima até março de 2027',
    'Emitir documentos necessários para entrada na Europa',
    'Seguro viagem com cobertura mínima de 30 mil euros (obrigatório para Schengen)',
    'Cartão de crédito internacional',
    'Cartão Wise ou cartão débito internacional carregado com euros',
    'Chip internacional ou eSIM europeu ativado antes do embarque',
    'Comprovante de hospedagem de todas as cidades (pode ser solicitado na imigração)',
    'Comprovante de passagens de ida e volta',
    'Declaração de meios financeiros suficientes se exigida',
    'Cópia digital de todos os documentos salva na nuvem',
  ],
  ingressos: [
    'Ingresso Torre Eiffel (toureiffel.paris)',
    'Ingresso Museu d\'Orsay (musee-orsay.fr)',
    'Ingresso Louvre (ticketlouvre.fr)',
    'Ingresso Lindt Home of Chocolate (lindt-home-of-chocolate.com)',
    'Reserva assento Bernina Express (rhb.ch) · CHF 44/pessoa',
    'Ingresso Duomo Milano cobertura (duomomilano.it)',
    'Ingresso Cenáculo de Leonardo da Vinci (vivaticket.com)',
    'Ingresso Coliseu + Foro Romano (coopculture.it)',
    'Ingresso Museus do Vaticano (museivaticani.va)',
    'Ingresso Galleria Borghese (galleriaborghese.it)',
  ],
  trens: [
    'Trem Paris → Zurique (tgv-lyria.com / raileurope.com)',
    'Trem Zurique → Chur (sbb.ch)',
    'Bilhete Bernina Express Chur → Tirano (sbb.ch)',
    'Trem Tirano → Milão Trenord (trenitalia.com)',
    'Trem Milão → Veneza Frecciarossa/Italo',
    'Trem Veneza → Roma Frecciarossa/Italo',
  ],
  hospedagem: [
    'Hospedagem Paris confirmada (Saint-Germain ou Le Marais)',
    'Hospedagem Zurique confirmada (Altstadt ou perto da Bahnhof)',
    'Hospedagem Milão confirmada (Brera)',
    'Hospedagem Veneza confirmada (dentro da ilha)',
    'Hospedagem Roma confirmada (Trastevere)',
  ]
};

function buildChecklist(items, containerId, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;

  items.forEach((item, i) => {
    const key = `${prefix}-${i}`;
    const checked = localGet(key) === 'true';
    container.appendChild(makeCheckItem(item, key, checked));
  });

  // Custom items
  const customKey = `${prefix}-custom`;
  const customRaw = localGet(customKey);
  const customItems = customRaw ? JSON.parse(customRaw) : [];
  customItems.forEach((item, i) => {
    const key = `${prefix}-ci-${i}`;
    container.appendChild(makeCheckItem(item.text, key, item.checked));
  });

  // Add custom item button
  const addRow = document.createElement('div');
  addRow.className = 'checklist-add-row';
  addRow.innerHTML = `
    <input class="edit-input" type="text" id="${prefix}-new-item" placeholder="Adicionar item personalizado..." style="flex:1;">
    <button class="btn-add" onclick="addCustomCheckItem('${containerId}','${prefix}')">Adicionar</button>
  `;
  container.appendChild(addRow);
}

function makeCheckItem(text, key, checked) {
  const div = document.createElement('div');
  div.className = 'check-item' + (checked ? ' checked' : '');
  div.innerHTML = `<div class="check-box"><span class="check-tick">✓</span></div><span class="check-text">${escHtml(text)}</span>`;
  div.addEventListener('click', () => toggleCheck(div, key));
  return div;
}

function toggleCheck(el, key) {
  el.classList.toggle('checked');
  const val = String(el.classList.contains('checked'));
  localSet(key, val);
  sbUpsert(key, val);
}

function addCustomCheckItem(containerId, prefix) {
  const inp = document.getElementById(`${prefix}-new-item`);
  if (!inp || !inp.value.trim()) { inp && inp.focus(); return; }
  const customKey = `${prefix}-custom`;
  const raw = localGet(customKey);
  const list = raw ? JSON.parse(raw) : [];
  list.push({ text: inp.value.trim(), checked: false });
  const val = JSON.stringify(list);
  localSet(customKey, val);
  sbUpsert(customKey, val);
  inp.value = '';

  // Re-render checklist section
  const container = document.getElementById(containerId);
  if (!container) return;
  // Remove old custom items and add row
  const children = Array.from(container.children);
  // Find where custom items start (after the fixed items)
  // Simplest approach: clear and rebuild
  container.innerHTML = '';
  // Rebuild defaults from constant
  const sectionMap = { 'checklist-docs': 'docs', 'checklist-ingressos': 'ingressos', 'checklist-trens': 'trens', 'checklist-hospedagem': 'hospedagem' };
  const section = sectionMap[containerId];
  if (section) buildChecklist(CHECKLISTS[section], containerId, prefix);
}

/* ==========================================
   UTILITIES
   ========================================== */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ==========================================
   RELOAD ALL FIELDS FROM STORAGE
   ========================================== */
function hydrateFields() {
  document.querySelectorAll('[id]').forEach(el => {
    if (!el.id) return;
    const val = localGet(el.id);
    if (val === null) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = val;
    } else if (el.tagName === 'SELECT') {
      el.value = val;
      // Refresh train badges after setting select values
      const m = el.id.match(/^(trem\d+)-status$/);
      if (m) updateTremBadge(m[1]);
    }
  });
  // Reload itinerary custom/removed
  Object.keys(ITINERARY).forEach(city => {
    ITINERARY[city].forEach((day, i) => {
      renderDayBody(city, i, day);
    });
  });
  // Reload checklist custom items
  const clMap = [
    { id: 'checklist-docs',        prefix: 'chk-docs',  section: 'docs' },
    { id: 'checklist-ingressos',   prefix: 'chk-ing',   section: 'ingressos' },
    { id: 'checklist-trens',       prefix: 'chk-trens', section: 'trens' },
    { id: 'checklist-hospedagem',  prefix: 'chk-hosp',  section: 'hospedagem' },
  ];
  clMap.forEach(({ id, prefix, section }) => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = '';
      buildChecklist(CHECKLISTS[section], id, prefix);
    }
  });
  // Reload accommodation link buttons
  HOSP_CITIES.forEach(c => {
    const linkKey = `hosp-${c.key}-link`;
    const inp = document.getElementById(linkKey);
    const btn = document.getElementById(linkKey + '-btn');
    if (inp && btn) btn.href = inp.value || '#';
  });
}

/* ==========================================
   INIT
   ========================================== */
async function init() {
  setSyncStatus('syncing');

  // Build UI
  buildDays('paris',   'paris-days');
  buildDays('zurique', 'zurique-days');
  buildDays('milao',   'milao-days');
  buildDays('veneza',  'veneza-days');
  buildDays('roma',    'roma-days');
  buildTrens();
  buildHospedagem();
  buildChecklist(CHECKLISTS.docs,        'checklist-docs',       'chk-docs');
  buildChecklist(CHECKLISTS.ingressos,   'checklist-ingressos',  'chk-ing');
  buildChecklist(CHECKLISTS.trens,       'checklist-trens',      'chk-trens');
  buildChecklist(CHECKLISTS.hospedagem,  'checklist-hospedagem', 'chk-hosp');
  loadTickets();

  // Try Supabase, fall back to localStorage
  const loaded = await loadFromSupabase();
  if (!loaded) setSyncStatus('offline');

  // Apply persisted values to DOM
  hydrateFields();

  // Rehydrate ticket list (may have been updated from Supabase)
  const raw = localGet(TICKETS_KEY);
  if (raw) { ticketsList = JSON.parse(raw); renderTickets(); }
}

init();
