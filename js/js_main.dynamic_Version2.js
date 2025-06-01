// ======================
// MLB Tier List - main.dynamic.js (parte dinâmica e volátil)
// ======================

// Dados dinâmicos e caches
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
        if (!heroId) return;
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
    .catch(() => {
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

    // Validação do heroObj para evitar erros
    if (!heroObj || !heroObj.name) {
      if (modalBody) {
        modalBody.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Detalhes do herói indisponíveis.</div>';
      }
      return;
    }

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
    if (modalBody) {
      modalBody.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Erro ao carregar detalhes do herói.</div>';
    }
    modal.classList.add('show');
  }
}

// Skill order - IMPLEMENTAÇÃO CORRETA conforme documentação da API
function renderSkillOrder(heroObj) {
  const skillOrderDiv = document.getElementById('modal-hero-skillorder');
  if (!skillOrderDiv) return;

  // Ordem recomendada direto do campo correto
  const label = heroObj.recommendlevellabel || '';
  if (label) {
    skillOrderDiv.innerHTML = `<b>Ordem sugerida:</b> ${label.replace(/-/g, ' → ')}`;
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