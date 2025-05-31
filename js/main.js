// Traduções
const translations = {
  'pt-BR': {
    title: "Tier List - Mobile Legends",
    rank_label: "Rank:",
    rank_mythic: "Mítico",
    rank_legend: "Lenda",
    rank_epic: "Épico",
    rank_grandmaster: "Grão-mestre",
    rank_master: "Mestre",
    rank_elite: "Elite",
    rank_warrior: "Guerreiro",
    days_label: "Dias:",
    days_1: "1",
    days_3: "3",
    days_7: "7",
    days_15: "15",
    days_30: "30",
    filter_title: "Filtrar por Função e Rota",
    role_label: "Função:",
    role_mage: "Mago",
    role_marksman: "Atirador",
    role_tank: "Tanque",
    role_assassin: "Assassino",
    role_fighter: "Lutador",
    role_support: "Suporte",
    all_roles: "Todas",
    lane_label: "Rota:",
    lane_mid: "Meio",
    lane_gold: "Ouro",
    lane_exp: "EXP",
    lane_jungle: "Selva",
    lane_roam: "Rotação",
    all_lanes: "Todas",
    no_heroes: "Nenhum herói encontrado."
  },
  'en-US': {
    title: "Tier List - Mobile Legends",
    rank_label: "Rank:",
    rank_mythic: "Mythic",
    rank_legend: "Legend",
    rank_epic: "Epic",
    rank_grandmaster: "Grandmaster",
    rank_master: "Master",
    rank_elite: "Elite",
    rank_warrior: "Warrior",
    days_label: "Days:",
    days_1: "1",
    days_3: "3",
    days_7: "7",
    days_15: "15",
    days_30: "30",
    filter_title: "Filter by Role and Lane",
    role_label: "Role:",
    role_mage: "Mage",
    role_marksman: "Marksman",
    role_tank: "Tank",
    role_assassin: "Assassin",
    role_fighter: "Fighter",
    role_support: "Support",
    all_roles: "All",
    lane_label: "Lane:",
    lane_mid: "Mid",
    lane_gold: "Gold",
    lane_exp: "EXP",
    lane_jungle: "Jungle",
    lane_roam: "Roam",
    all_lanes: "All",
    no_heroes: "No heroes found."
  }
};

let heroIdToName = {};
let heroNameToId = {};
let heroExtraInfo = {};
let tierCards = [];
let tierRecords = [];
let currentLang = 'pt-BR';
let tierListRequestToken = 0;

// Funções utilitárias
function translate(key) {
  return translations[currentLang][key] || key;
}
function updateI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
  document.querySelectorAll('option[data-i18n]').forEach(opt => {
    const key = opt.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      opt.textContent = translations[currentLang][key];
    }
  });
}

// Tema
function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  let icon = document.getElementById('themeIcon');
  if (icon) {
    if (theme === "dark") {
      icon.className = "fa-solid fa-sun";
    } else {
      icon.className = "fa-solid fa-moon";
    }
  }
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  const newTheme = document.body.getAttribute('data-theme') === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

// Idioma
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  updateI18n();
  document.getElementById('langFlag').style.backgroundImage =
    lang === "pt-BR"
      ? "url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/br.svg')"
      : "url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/us.svg')";
  document.getElementById('flagBR').classList.toggle('selected', lang === "pt-BR");
  document.getElementById('flagUS').classList.toggle('selected', lang === "en-US");
  localStorage.setItem('lang', lang);
}

// Modal idioma
function showFlagDropdown(show) {
  document.getElementById('flagDropdown').classList.toggle('hidden', !show);
}

// Busca heróis
function fetchHeroMap() {
  return fetch('https://mlbb-proxy.vercel.app/api/hero-list')
    .then(res => res.json())
    .then(map => {
      heroIdToName = map;
      heroNameToId = {};
      Object.entries(map).forEach(([id, name]) => {
        heroNameToId[name] = id;
      });
    });
}

function fetchAllHeroPositions() {
  return fetch('https://mlbb-proxy.vercel.app/api/hero-position?role=all&lane=all&size=128&index=1')
    .then(res => res.json())
    .then(json => {
      heroExtraInfo = {};
      (json.data.records || []).forEach(entry => {
        const heroData = entry.data;
        heroExtraInfo[String(heroData.hero_id)] = {
          role: (heroData.hero && heroData.hero.data && heroData.hero.data.sortid &&
            heroData.hero.data.sortid.length && heroData.hero.data.sortid[0] &&
            heroData.hero.data.sortid[0].data && heroData.hero.data.sortid[0].data.sort_title)
            ? heroData.hero.data.sortid[0].data.sort_title.toLowerCase() : "",
          roadsort: (heroData.hero && heroData.hero.data && heroData.hero.data.roadsort)
            ? heroData.hero.data.roadsort : []
        };
      });
    });
}

// Renderiza Tier List
function carregarTierList() {
  const myToken = ++tierListRequestToken;

  const rank = document.getElementById('rank').value;
  const days = document.getElementById('days').value;
  const url = `https://mlbb-proxy.vercel.app/api/hero-rank?source=rank&days=${days}&rank=${rank}&size=130&sort_field=win_rate&sort_order=desc`;

  document.getElementById('tier-ss').innerHTML = '';
  document.getElementById('tier-s').innerHTML = '';
  document.getElementById('tier-a').innerHTML = '';
  document.getElementById('noResults').classList.add('hidden');
  tierCards = [];
  tierRecords = [];

  Promise.all([fetchHeroMap(), fetchAllHeroPositions(), fetch(url).then(res => res.json())])
    .then(([_, __, json]) => {
      if (myToken !== tierListRequestToken) return;
      const records = json.data.records || [];
      tierRecords = records;
      let count = {ss:0,s:0,a:0};
      let idSet = new Set();

      records.forEach(entry => {
        const hero = entry.data.main_hero.data;
        const winRate = (entry.data.main_hero_win_rate * 100).toFixed(1);
        const heroId = heroNameToId[hero.name];
        if (!heroId || idSet.has(heroId)) return;
        idSet.add(heroId);

        const info = heroExtraInfo[heroId] || {};
        let roadsortTitles = [];
        let iconCount = 0;
        let roadsortHtml = '';

        if (Array.isArray(info.roadsort) && info.roadsort.length > 0) {
          roadsortTitles = info.roadsort.map(rs =>
            (rs.data && rs.data.road_sort_title) ? rs.data.road_sort_title : ''
          ).filter(Boolean);
          iconCount = info.roadsort.length;
          roadsortHtml = info.roadsort.map(rs => {
            const data = rs.data || {};
            return data.road_sort_icon
              ? `<span class="hero-route"><img src="${data.road_sort_icon}" alt="" title="${data.road_sort_title}" width="60" height="60"></span>`
              : '';
          }).join('');
        }

        const el = document.createElement('div');
        el.className = 'card';
        el.setAttribute('data-role', (info.role || '').toLowerCase());
        el.setAttribute('data-routes', roadsortTitles.join('|').toLowerCase());
        el.setAttribute('data-id', heroId || '');
        el.setAttribute('data-name', hero.name);

        el.innerHTML = `
          <img src="${hero.head}" alt="Retrato do herói ${hero.name}" loading="lazy">
          <div class="hero-name">${hero.name}</div>
          <div class="hero-meta">${winRate}% WR</div>
          <div class="hero-routes ${iconCount === 1 ? 'single' : ''}">${roadsortHtml}</div>
        `;

        tierCards.push(el);

        if (winRate >= 54) {
          document.getElementById('tier-ss').appendChild(el); count.ss++;
        } else if (winRate >= 51) {
          document.getElementById('tier-s').appendChild(el); count.s++;
        } else {
          document.getElementById('tier-a').appendChild(el); count.a++;
        }
      });

      if (!count.ss && !count.s && !count.a) {
        document.getElementById('noResults').classList.remove('hidden');
      }
      filtrarTierList();
      setupHeroCardClicks();
    })
    .catch(err => {
      document.getElementById('noResults').classList.remove('hidden');
    });
}

function filtrarTierList() {
  const role = document.getElementById('role').value.toLowerCase();
  const lane = document.getElementById('lane').value.toLowerCase();
  let visible = 0;
  document.querySelectorAll('.tier-container .card').forEach(card => {
    const heroRole = (card.getAttribute('data-role') || '').toLowerCase();
    const heroRoutes = (card.getAttribute('data-routes') || '').toLowerCase();
    let mostra = true;
    if (role && !heroRole.includes(role)) mostra = false;
    if (lane && !heroRoutes.includes(lane)) mostra = false;
    card.classList.toggle('hidden', !mostra);
    if (mostra) visible++;
  });
  document.getElementById('noResults').classList.toggle('hidden', visible !== 0);
  setupHeroCardClicks();
}

// MODAL DETALHADO DE HERÓI - ALTERE OS ENDPOINTS AQUI!
async function showHeroModal(heroId) {
  try {
    // Busca detalhes do herói
    const detailsRes = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail?hero_id=${heroId}`);
    const detailsData = await detailsRes.json();
    const heroObj = detailsData?.data?.records?.[0]?.data?.hero?.data || {};
    const heroData = detailsData?.data?.records?.[0]?.data || {};

    // Busca stats do herói
    const statsRes = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail-stats?main_heroid=${heroId}`);
    const statsData = await statsRes.json();
    const statsObj = statsData?.data?.records?.[0]?.data || {};

    // SOBRE O CAMPEÃO
    document.getElementById('modal-hero-img').src = heroObj.head_big || heroObj.head || '';
    document.getElementById('modal-hero-name').textContent = heroObj.name || '';
    document.getElementById('modal-hero-role').textContent = heroObj.sortlabel?.filter(Boolean).join(', ') || '';
    document.getElementById('modal-hero-lanes').textContent = heroObj.roadsortlabel?.filter(Boolean).join(', ') || '';

    // BUILDS
    document.getElementById('modal-hero-builds').innerHTML =
    (heroObj.recommendmasterplan && heroObj.recommendmasterplan.length)
    ? heroObj.recommendmasterplan.map(plan =>
        `<span class="build-plan">${(plan.item_list || []).map(item =>
          `<img src="${item.item_icon}" alt="${item.item_name}" title="${item.item_name}" class="build-item-icon" style="width:32px;height:32px;margin:0 2px;vertical-align:middle;">`
        ).join('')}</span>`
      ).join('<br>')
    : 'Build recomendada não disponível.';
    document.getElementById('modal-hero-specialties').textContent = (heroObj.speciality || []).join(', ');
    document.getElementById('modal-hero-icons').innerHTML = `
      ${(heroObj.roadsort || []).map(r => r.data?.road_sort_icon ? `<img src="${r.data.road_sort_icon}" title="${r.data.road_sort_title}" class="lane-icon"/>` : '').join('')}
      ${(heroObj.sortid || []).map(s => s.data?.sort_icon ? `<img src="${s.data.sort_icon}" title="${s.data.sort_title}" class="role-icon"/>` : '').join('')}
    `;

    // HABILIDADES
    const skillsList = (heroObj.heroskilllist?.[0]?.skilllist || []);
    document.getElementById('modal-hero-skills').innerHTML = skillsList.map(skill => `
      <div class="skill">
        <img src="${skill.skillicon}" class="skill-icon" />
        <div class="skill-info">
          <div class="skill-name">${skill.skillname}</div>
          <div class="skill-tags">${(skill.skilltag || []).map(tag => `<span class="skill-tag" style="background:rgba(${tag.tagrgb},.15);color:rgb(${tag.tagrgb});">${tag.tagname}</span>`).join(' ')}</div>
          <div class="skill-desc">${skill.skilldesc}</div>
          <div class="skill-cd">${skill['skillcd&cost'] ? `CD/Custo: ${skill['skillcd&cost']}` : ''}</div>
        </div>
      </div>
    `).join('');

    // ESTATÍSTICAS GERAIS
    document.getElementById('modal-hero-stats').innerHTML = `
      <div>Winrate: ${(statsObj.main_hero_win_rate*100).toFixed(1)}%</div>
      <div>Banrate: ${(statsObj.main_hero_ban_rate*100).toFixed(1)}%</div>
      <div>Appearance: ${(statsObj.main_hero_appearance_rate*100).toFixed(2)}%</div>
    `;
    document.getElementById('modal-hero-stats-graph').innerHTML = ''; // Adapte se quiser gráfico/tabela

    // RELAÇÕES E SINERGIAS
    const assist = heroData.relation?.assist;
    document.getElementById('modal-hero-assist').innerHTML = assist ? `
      <div class="relation-desc"><b>Aliados recomendados:</b> ${assist.desc}</div>
      <div class="relation-list">
        ${(assist.target_hero || []).map(h => `<img src="${h.data?.head}" class="relation-hero" />`).join('')}
      </div>
    ` : '';
    const strong = heroData.relation?.strong;
    document.getElementById('modal-hero-strong').innerHTML = strong ? `
      <div class="relation-desc"><b>Forte contra:</b> ${strong.desc}</div>
      <div class="relation-list">
        ${(strong.target_hero || []).map(h => `<img src="${h.data?.head}" class="relation-hero" />`).join('')}
      </div>
    ` : '';
    const weak = heroData.relation?.weak;
    document.getElementById('modal-hero-weak').innerHTML = weak ? `
      <div class="relation-desc"><b>Fraco contra:</b> ${weak.desc}</div>
      <div class="relation-list">
        ${(weak.target_hero || []).map(h => `<img src="${h.data?.head}" class="relation-hero" />`).join('')}
      </div>
    ` : '';

    // PARCERIAS & COMBOS
    document.getElementById('modal-hero-sub-heroes').innerHTML = (statsObj.sub_hero || []).map(sh => `
      <div class="sub-hero">
        <img src="${sh.hero?.data?.head}" class="sub-hero-img" />
        <span>Winrate: ${(sh.hero_win_rate*100).toFixed(1)}% (+${(sh.increase_win_rate*100).toFixed(2)}%)</span>
      </div>
    `).join('');
    document.getElementById('modal-hero-sub-heroes-impact').innerHTML = ''; // Adapte se quiser gráfico/tabela
    document.getElementById('modal-hero-sub-heroes-last').innerHTML = (statsObj.sub_hero_last || []).map(sh => `
      <div class="sub-hero negative">
        <span>${sh.heroid}</span>
        <span>Winrate: ${(sh.hero_win_rate*100).toFixed(1)}% (${(sh.increase_win_rate*100).toFixed(2)}%)</span>
      </div>
    `).join('');

    // COUNTERS (visual)
    await showHeroCounters(heroId);

    // Exibe o modal
    const modal = document.getElementById("heroModal");
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.add("show"), 5);
  } catch(e) {
    alert("Erro ao carregar informações do herói.");
  }
}

// COUNTERS (visual para o modal detalhado)
async function showHeroCounters(heroId) {
  const res = await fetch(`https://mlbb-proxy.vercel.app/api/hero-counter?id=${heroId}`);
  const json = await res.json();
  const data = json?.data?.records?.[0]?.data;
  const list = document.getElementById('modal-hero-counters');
  let counters = [];
  if (data) {
    counters = (data.sub_hero_last && data.sub_hero_last.length) ? data.sub_hero_last
             : (data.sub_hero && data.sub_hero.length) ? data.sub_hero
             : [];
  }
  if (counters.length) {
    list.innerHTML = counters.map(sh => `
      <div class="counter-img-wrap">
        <img src="${sh.hero.data.head}" 
             title="Winrate: ${(sh.hero_win_rate*100).toFixed(1)}%" 
             alt="Counter"
             class="hero-modal-counter-img">
        <span class="counter-badge">${(sh.hero_win_rate*100).toFixed(1)}%</span>
      </div>
    `).join('');
  } else {
    list.innerHTML = `<div class="hero-modal-counters-empty">Nenhum counter encontrado.</div>`;
  }
}

// CLICKS DOS CARDS: MODAL DETALHADO
function setupHeroCardClicks() {
  document.querySelectorAll('.card').forEach(card => {
    if (card._detailsBound) return;
    card._detailsBound = true;
    card.style.cursor = "pointer";
    card.onclick = function() {
      const heroId = card.getAttribute('data-id');
      showHeroModal(heroId);
    };
  });
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  // Tema inicial
  let theme = localStorage.getItem('theme');
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
  }
  setTheme(theme);

  // Idioma inicial
  let lang = localStorage.getItem('lang');
  if (!lang) lang = navigator.language === "en-US" ? "en-US" : "pt-BR";
  setLanguage(lang);

  // Carrega a tierlist
  carregarTierList();

  document.getElementById('rank').addEventListener('change', carregarTierList);
  document.getElementById('days').addEventListener('change', carregarTierList);
  document.getElementById('role').addEventListener('change', filtrarTierList);
  document.getElementById('lane').addEventListener('change', filtrarTierList);

  document.getElementById('themeSwitch').addEventListener('click', toggleTheme);

  const langSwitch = document.getElementById('langSwitch');
  langSwitch.addEventListener('click', function(e) {
    showFlagDropdown(true);
    e.stopPropagation();
  });
  document.getElementById('flagBR').addEventListener('click', function() { setLanguage('pt-BR'); showFlagDropdown(false); carregarTierList(); });
  document.getElementById('flagUS').addEventListener('click', function() { setLanguage('en-US'); showFlagDropdown(false); carregarTierList(); });
  document.addEventListener('click', function(e) {
    if (!document.getElementById('flagDropdown').contains(e.target) && e.target !== langSwitch) {
      showFlagDropdown(false);
    }
  });
  document.getElementById('flagBR').addEventListener('keypress', function(e){ if(e.key==='Enter'){setLanguage('pt-BR'); showFlagDropdown(false); carregarTierList();} });
  document.getElementById('flagUS').addEventListener('keypress', function(e){ if(e.key==='Enter'){setLanguage('en-US'); showFlagDropdown(false); carregarTierList();} });

  // Modal close
  const modal = document.getElementById("heroModal");
  modal.addEventListener("click", function(e) {
    if (e.target === modal || e.target.classList.contains("hero-modal-close")) {
      modal.classList.remove("show");
      setTimeout(() => modal.classList.add("hidden"), 200);
    }
  });
});
