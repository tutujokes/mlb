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
    no_heroes: "Nenhum herói encontrado.",
    order_label: "Ordem Recomendada das Habilidades:"
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
    no_heroes: "No heroes found.",
    order_label: "Recommended Skill Order:"
  }
};

// Utilitários de tradução e idioma
let currentLang = localStorage.getItem('lang') || (navigator.language === "en-US" ? "en-US" : "pt-BR");
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
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  updateI18n();
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
  let theme = document.body.getAttribute('data-theme') === "dark" ? "light" : "dark";
  setTheme(theme);
}

// Modal idioma
function showFlagDropdown(show) {
  document.getElementById('flagDropdown').classList.toggle('hidden', !show);
}

// Buscas e caches
let heroIdToName = {};
let heroNameToId = {};
let heroExtraInfo = {};
let tierCards = [];
let tierRecords = [];
let tierListRequestToken = 0;

// Caches de detalhes e stats de heróis
const heroDetailsCache = {};
const heroStatsCache = {};

// Busca lista de heróis
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

// Busca extras (role/lane)
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
      let count = { ss: 0, s: 0, a: 0 };
      let idSet = new Set();

      records.forEach(entry => {
        const hero = entry.data.main_hero.data;
        const winRate = (entry.data.main_hero_win_rate * 100).toFixed(1);

        // Robust heroId match
        let heroId = heroNameToId[hero.name];
        if (!heroId) {
          const tryName = hero.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
          for (const [name, id] of Object.entries(heroNameToId)) {
            const normName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
            if (normName === tryName) {
              heroId = id;
              break;
            }
          }
        }
        if (!heroId) {
          console.warn('HeroId não encontrado para', hero.name);
          return;
        }
        if (idSet.has(heroId)) return;
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

// Busca detalhes do herói com cache
async function getHeroDetails(heroId) {
  if (heroDetailsCache[heroId]) return heroDetailsCache[heroId];
  const detailsRes = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail?hero_id=${heroId}`);
  const detailsData = await detailsRes.json();
  heroDetailsCache[heroId] = detailsData;
  return detailsData;
}

// Busca stats do herói com cache
async function getHeroStats(heroId) {
  if (heroStatsCache[heroId]) return heroStatsCache[heroId];
  const statsRes = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail-stats?main_heroid=${heroId}`);
  const statsData = await statsRes.json();
  heroStatsCache[heroId] = statsData;
  return statsData;
}

// MODAL DETALHADO DE HERÓI
async function showHeroModal(heroId) {
  const modal = document.getElementById('heroModal');
  modal.classList.remove('hidden');
  modal.classList.remove('show');
  document.querySelector('.hero-modal-body').innerHTML = '<div style="padding:40px;text-align:center;">Carregando...</div>';
  try {
    // Para debug, descomente:
    // alert('ID enviado para showHeroModal: ' + heroId);

    const [detailsData, statsData] = await Promise.all([
      getHeroDetails(heroId),
      getHeroStats(heroId)
    ]);
    // Para debug, descomente:
    // console.log('detailsData', detailsData);
    // console.log('statsData', statsData);

    const heroObj = detailsData?.data?.records?.[0]?.data?.hero?.data || {};
    const heroData = detailsData?.data?.records?.[0]?.data || {};
    const statsObj = statsData?.data?.records?.[0]?.data || {};

    document.getElementById('modal-hero-img').src = heroObj.head_big || heroObj.head || '';
    document.getElementById('modal-hero-name').textContent = heroObj.name || '';
    document.getElementById('modal-hero-role').textContent = heroObj.sortlabel?.filter(Boolean).join(', ') || '';
    document.getElementById('modal-hero-lanes').textContent = heroObj.roadsortlabel?.filter(Boolean).join(', ') || '';

    renderSkillOrder(heroObj);

    document.getElementById('modal-hero-specialties').textContent = (heroObj.speciality || []).join(', ');
    document.getElementById('modal-hero-icons').innerHTML = `
      ${(heroObj.roadsort || []).map(r => r.data?.road_sort_icon ? `<img src="${r.data.road_sort_icon}" title="${r.data.road_sort_title}" class="lane-icon"/>` : '').join('')}
      ${(heroObj.sortid || []).map(s => s.data?.sort_icon ? `<img src="${s.data?.sort_icon}" title="${s.data?.sort_title}" class="role-icon"/>` : '').join('')}
    `;

    const skillsList = heroObj.heroskilllist?.[0]?.skilllist || [];
    document.getElementById('modal-hero-skills').innerHTML = skillsList.map(skill => `
      <div class="skill">
        <img src="${skill.skillicon}" class="skill-icon" />
        <div class="skill-info">
          <div class="skill-name">${skill.skillname}</div>
          <div class="skill-desc">${skill.desc || skill.skilldesc || ''}</div>
        </div>
      </div>
    `).join('');

    document.getElementById('modal-hero-stats').innerHTML = `
      <div>Winrate: ${(statsObj.main_hero_win_rate * 100).toFixed(1)}%</div>
      <div>Banrate: ${(statsObj.main_hero_ban_rate * 100).toFixed(1)}%</div>
      <div>Appearance: ${(statsObj.main_hero_appearance_rate * 100).toFixed(2)}%</div>
    `;
    document.getElementById('modal-hero-stats-graph').innerHTML = '';

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

    document.getElementById('modal-hero-sub-heroes').innerHTML = (statsObj.sub_hero || []).map(sh => `
      <div class="sub-hero">
        <img src="${sh.hero?.data?.head}" class="sub-hero-img" />
        <span>Winrate: ${(sh.hero_win_rate * 100).toFixed(1)}% (+${(sh.increase_win_rate * 100).toFixed(2)}%)</span>
      </div>
    `).join('');
    document.getElementById('modal-hero-sub-heroes-impact').innerHTML = '';
    document.getElementById('modal-hero-sub-heroes-last').innerHTML = (statsObj.sub_hero_last || []).map(sh => `
      <div class="sub-hero negative">
        <span>${sh.heroid}</span>
        <span>Winrate: ${(sh.hero_win_rate * 100).toFixed(1)}% (${(sh.increase_win_rate * 100).toFixed(2)}%)</span>
      </div>
    `).join('');

    await showHeroCounters(heroId);

    setTimeout(() => {
      modal.classList.add('show');
    }, 5);

  } catch (e) {
    console.error('Erro ao carregar detalhes:', e);
    document.querySelector('.hero-modal-body').innerHTML = '<div style="padding:40px;text-align:center;color:red;">Erro ao carregar detalhes do herói.</div>';
    modal.classList.add('show');
  }
}

function renderSkillOrder(heroObj) {
  const skillOrderDiv = document.getElementById('modal-hero-skillorder');
  skillOrderDiv.innerHTML = '';
  const skillsList = heroObj.heroskilllist?.[0]?.skilllist || [];
  let skillOrderArr = [];

  if (skillsList.length && skillsList[0].recommendedlevel) {
    const order = skillsList[0].recommendedlevel
      .replace(/\s/g, '')
      .replace(/,/g, '-')
      .split(/-|\s/)
      .filter(Boolean)
      .map(i => parseInt(i, 10));
    skillOrderArr = order;
  }
  if (!skillOrderArr.length && skillsList.length) {
    skillOrderArr = skillsList.map((_, i) => i + 1);
  }

  if (skillOrderArr.length) {
    const nodeList = [];
    for (let i = 0; i < skillOrderArr.length; i++) {
      const idx = skillOrderArr[i] - 1;
      const skill = skillsList[idx];
      if (!skill) continue;
      nodeList.push(`
        <div class="skill-order-step">
          <div class="skill-order-num">${skillOrderArr[i]}</div>
          <img src="${skill.skillicon}" alt="${skill.skillname}" class="skill-icon" style="width:32px;height:32px;">
          <span class="skill-order-label">${skill.skillname}</span>
        </div>
      `);
      if (i !== skillOrderArr.length - 1) {
        nodeList.push(`<span class="skill-order-arrow">&rarr;</span>`);
      }
    }
    skillOrderDiv.innerHTML = `<div class="skill-order-list">${nodeList.join('')}</div>`;
  } else {
    skillOrderDiv.innerHTML = '<div style="color:#888;">Ordem não disponível.</div>';
  }
}

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
             title="Winrate: ${(sh.hero_win_rate * 100).toFixed(1)}%" 
             alt="Counter"
             class="hero-modal-counter-img">
        <span class="counter-badge">${(sh.hero_win_rate * 100).toFixed(1)}%</span>
      </div>
    `).join('');
  } else {
    list.innerHTML = `<div class="hero-modal-counters-empty">Nenhum counter encontrado.</div>`;
  }
}

function setupHeroCardClicks() {
  document.querySelectorAll('.card').forEach(card => {
    if (card._detailsBound) return;
    card._detailsBound = true;
    card.style.cursor = "pointer";
    card.onclick = function () {
      const heroId = card.getAttribute('data-id');
      showHeroModal(heroId);
    };
  });
}

document.addEventListener('DOMContentLoaded', function () {
  let theme = localStorage.getItem('theme');
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
  }
  setTheme(theme);

  let lang = localStorage.getItem('lang');
  if (!lang) lang = navigator.language === "en-US" ? "en-US" : "pt-BR";
  setLanguage(lang);

  carregarTierList();

  document.getElementById('rank').addEventListener('change', carregarTierList);
  document.getElementById('days').addEventListener('change', carregarTierList);
  document.getElementById('role').addEventListener('change', filtrarTierList);
  document.getElementById('lane').addEventListener('change', filtrarTierList);

  document.getElementById('themeSwitch').addEventListener('click', toggleTheme);

  const langSwitch = document.getElementById('langSwitch');
  langSwitch.addEventListener('click', function (e) {
    showFlagDropdown(true);
    e.stopPropagation();
  });
  document.getElementById('flagBR').addEventListener('click', function () { setLanguage('pt-BR'); showFlagDropdown(false); carregarTierList(); });
  document.getElementById('flagUS').addEventListener('click', function () { setLanguage('en-US'); showFlagDropdown(false); carregarTierList(); });

  document.querySelector('.hero-modal-close').onclick = function () {
    const modal = document.getElementById('heroModal');
    modal.classList.remove('show');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  };
  document.getElementById('heroModal').addEventListener('click', function (e) {
    if (e.target === this) {
      this.classList.remove('show');
      setTimeout(() => this.classList.add('hidden'), 300);
    }
  });
  document.body.addEventListener('click', function () {
    showFlagDropdown(false);
  });
});
