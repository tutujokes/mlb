// ======================
// MLB Tier List - main.js
// ======================
// Dicionário de traduções
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
    role_label: "Função:",
    all_roles: "Todas",
    role_mage: "Mago",
    role_marksman: "Atirador",
    role_tank: "Tanque",
    role_assassin: "Assassino",
    role_fighter: "Lutador",
    role_support: "Suporte",
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
    role_label: "Role:",
    all_roles: "All",
    role_mage: "Mage",
    role_marksman: "Marksman",
    role_tank: "Tank",
    role_assassin: "Assassin",
    role_fighter: "Fighter",
    role_support: "Support",
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

// Função que aplica as traduções nos elementos com data-i18n
function applyTranslations(lang) {
  const dict = translations[lang] || translations['pt-BR'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = dict[key];
      } else if (el.tagName === "OPTION") {
        el.text = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });
}
// ---- Funções de Utilidade e Cache ----
function toggleTheme() {
  let theme = document.body.getAttribute('data-theme') === "dark" ? "light" : "dark";
  setTheme(theme);
}

function showFlagDropdown(show) {
  const dropdown = document.getElementById('flagDropdown');
  if (dropdown) dropdown.classList.toggle('hidden', !show);
}

let heroIdToName = {};
let heroNameToId = {};
let heroExtraInfo = {};
let tierCards = [];
let tierRecords = [];
let tierListRequestToken = 0;

const heroDetailsCache = {};
const heroStatsCache = {};

// ---- Busca de Dados ----
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

// ---- Renderização da Tier List ----
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

// ---- Modal Detalhado de Herói ----

async function getHeroDetails(heroId) {
  if (heroDetailsCache[heroId]) return heroDetailsCache[heroId];
  const detailsRes = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail?hero_id=${heroId}`);
  const detailsData = await detailsRes.json();
  heroDetailsCache[heroId] = detailsData;
  return detailsData;
}

async function getHeroStats(heroId) {
  if (heroStatsCache[heroId]) return heroStatsCache[heroId];
  const statsRes = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail-stats?main_heroid=${heroId}`);
  const statsData = await statsRes.json();
  heroStatsCache[heroId] = statsData;
  return statsData;
}

async function showHeroModal(heroId) {
  const modal = document.getElementById('heroModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.remove('show');
  const modalBody = document.querySelector('.hero-modal-body');
  if (modalBody) {
    modalBody.innerHTML = '<div style="padding:40px;text-align:center;">Carregando...</div>';
  }
  try {
    const [detailsData, statsData] = await Promise.all([
      getHeroDetails(heroId),
      getHeroStats(heroId)
    ]);

    const heroObj = detailsData?.data?.records?.[0]?.data?.hero?.data || {};
    const heroData = detailsData?.data?.records?.[0]?.data || {};
    const statsObj = statsData?.data?.records?.[0]?.data || {};

    // Atualização segura dos elementos do modal
    const heroImg = document.getElementById('modal-hero-img');
    if (heroImg) heroImg.src = heroObj.head_big || heroObj.head || '';

    const heroName = document.getElementById('modal-hero-name');
    if (heroName) heroName.textContent = heroObj.name || '';

    const heroRole = document.getElementById('modal-hero-role');
    if (heroRole) heroRole.textContent = heroObj.sortlabel?.filter(Boolean).join(', ') || '';

    const heroLanes = document.getElementById('modal-hero-lanes');
    if (heroLanes) heroLanes.textContent = heroObj.roadsortlabel?.filter(Boolean).join(', ') || '';

    renderSkillOrder(heroObj);

    const heroSpecialties = document.getElementById('modal-hero-specialties');
    if (heroSpecialties) heroSpecialties.textContent = (heroObj.speciality || []).join(', ');

    const heroIcons = document.getElementById('modal-hero-icons');
    if (heroIcons) {
      heroIcons.innerHTML = `
        ${(heroObj.roadsort || []).map(r => r.data?.road_sort_icon ? `<img src="${r.data.road_sort_icon}" title="${r.data.road_sort_title}" class="lane-icon"/>` : '').join('')}
        ${(heroObj.sortid || []).map(s => s.data?.sort_icon ? `<img src="${s.data?.sort_icon}" title="${s.data?.sort_title}" class="role-icon"/>` : '').join('')}
      `;
    }

    const skillsList = heroObj.heroskilllist?.[0]?.skilllist || [];
    const heroSkills = document.getElementById('modal-hero-skills');
    if (heroSkills) {
      heroSkills.innerHTML = skillsList.map(skill => `
        <div class="skill">
          <img src="${skill.skillicon}" class="skill-icon" />
          <div class="skill-info">
            <div class="skill-name">${skill.skillname}</div>
            <div class="skill-desc">${skill.desc || skill.skilldesc || ''}</div>
          </div>
        </div>
      `).join('');
    }

    const heroStats = document.getElementById('modal-hero-stats');
    if (heroStats) {
      heroStats.innerHTML = `
        <div>Winrate: ${(statsObj.main_hero_win_rate * 100).toFixed(1)}%</div>
        <div>Banrate: ${(statsObj.main_hero_ban_rate * 100).toFixed(1)}%</div>
        <div>Appearance: ${(statsObj.main_hero_appearance_rate * 100).toFixed(2)}%</div>
      `;
    }

    const heroStatsGraph = document.getElementById('modal-hero-stats-graph');
    if (heroStatsGraph) heroStatsGraph.innerHTML = '';

    // Assist, Strong, Weak, Sub Heroes, Counters
    const assist = heroData.relation?.assist;
    const heroAssist = document.getElementById('modal-hero-assist');
    if (heroAssist) {
      heroAssist.innerHTML = assist ? `
        <div class="relation-desc"><b>Aliados recomendados:</b> ${assist.desc}</div>
        <div class="relation-list">
          ${(assist.target_hero || []).map(h => `<img src="${h.data?.head}" class="relation-hero" />`).join('')}
        </div>
      ` : '';
    }

    const strong = heroData.relation?.strong;
    const heroStrong = document.getElementById('modal-hero-strong');
    if (heroStrong) {
      heroStrong.innerHTML = strong ? `
        <div class="relation-desc"><b>Forte contra:</b> ${strong.desc}</div>
        <div class="relation-list">
          ${(strong.target_hero || []).map(h => `<img src="${h.data?.head}" class="relation-hero" />`).join('')}
        </div>
      ` : '';
    }

    const weak = heroData.relation?.weak;
    const heroWeak = document.getElementById('modal-hero-weak');
    if (heroWeak) {
      heroWeak.innerHTML = weak ? `
        <div class="relation-desc"><b>Fraco contra:</b> ${weak.desc}</div>
        <div class="relation-list">
          ${(weak.target_hero || []).map(h => `<img src="${h.data?.head}" class="relation-hero" />`).join('')}
        </div>
      ` : '';
    }

    const heroSubHeroes = document.getElementById('modal-hero-sub-heroes');
    if (heroSubHeroes) {
      heroSubHeroes.innerHTML = (statsObj.sub_hero || []).map(sh => `
        <div class="sub-hero">
          <img src="${sh.hero?.data?.head}" class="sub-hero-img" />
          <span>Winrate: ${(sh.hero_win_rate * 100).toFixed(1)}% (+${(sh.increase_win_rate * 100).toFixed(2)}%)</span>
        </div>
      `).join('');
    }

    const heroSubHeroesImpact = document.getElementById('modal-hero-sub-heroes-impact');
    if (heroSubHeroesImpact) heroSubHeroesImpact.innerHTML = '';

    const heroSubHeroesLast = document.getElementById('modal-hero-sub-heroes-last');
    if (heroSubHeroesLast) {
      heroSubHeroesLast.innerHTML = (statsObj.sub_hero_last || []).map(sh => `
        <div class="sub-hero negative">
          <span>${sh.heroid}</span>
          <span>Winrate: ${(sh.hero_win_rate * 100).toFixed(1)}% (${(sh.increase_win_rate * 100).toFixed(2)}%)</span>
        </div>
      `).join('');
    }

    await showHeroCounters(heroId);

    setTimeout(() => {
      modal.classList.add('show');
    }, 5);

  } catch (e) {
    console.error('Erro ao carregar detalhes:', e);
    const modalBody = document.querySelector('.hero-modal-body');
    if (modalBody) {
      modalBody.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Erro ao carregar detalhes do herói.</div>';
    }
    modal.classList.add('show');
  }
}

function renderSkillOrder(heroObj) {
  const skillOrderDiv = document.getElementById('modal-hero-skillorder');
  if (!skillOrderDiv) return;
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
  if (!list) return;
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

// ---- Idioma: Corrigido para mostrar bandeira atual ----
function setLanguage(lang) {
  localStorage.setItem('lang', lang);

  // Troca a bandeira principal
  const flagCurrent = document.getElementById('flagCurrent');
  if (flagCurrent) {
    flagCurrent.src =
      lang === 'pt-BR'
        ? 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/br.svg'
        : 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg';
    flagCurrent.alt = lang === 'pt-BR' ? 'Português' : 'English';
  }

  // ... complete aqui a tradução, se necessário
  carregarTierList();
}

// ---- Eventos DOMContentLoaded ----
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
  if (langSwitch) {
    langSwitch.addEventListener('click', function (e) {
      showFlagDropdown(true);
      e.stopPropagation();
    });
  }

  // Clique nas opções do dropdown de idioma
  const flagBR = document.getElementById('flagBR');
  if (flagBR) {
    flagBR.addEventListener('click', function () {
      setLanguage('pt-BR');
      showFlagDropdown(false);
    });
  }

  const flagUS = document.getElementById('flagUS');
  if (flagUS) {
    flagUS.addEventListener('click', function () {
      setLanguage('en-US');
      showFlagDropdown(false);
    });
  }

  // Fechar modal do herói
  const closeModal = document.querySelector('.hero-modal-close');
  if (closeModal) {
    closeModal.onclick = function () {
      const modal = document.getElementById('heroModal');
      if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
          modal.classList.add('hidden');
        }, 300);
      }
    };
  }

  const heroModal = document.getElementById('heroModal');
  if (heroModal) {
    heroModal.addEventListener('click', function (e) {
      if (e.target === this) {
        this.classList.remove('show');
        setTimeout(() => this.classList.add('hidden'), 300);
      }
    });
  }

  document.body.addEventListener('click', function () {
    showFlagDropdown(false);
  });
});

// ---- Tema ----
function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  // Troca ícone do botão
  const themeSwitch = document.getElementById('themeSwitch');
  if (themeSwitch) {
    themeSwitch.innerHTML = theme === 'dark'
      ? '<i class="icon-moon"></i>'
      : '<i class="icon-sun"></i>';
  }
            }
