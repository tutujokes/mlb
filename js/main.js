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
  const langFlag = document.getElementById('langFlag');
  if (langFlag) {
    langFlag.style.backgroundImage =
      lang === "pt-BR"
        ? "url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/br.svg')"
        : "url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/us.svg')";
  }
  document.getElementById('flagBR').classList.toggle('selected', lang === "pt-BR");
  document.getElementById('flagUS').classList.toggle('selected', lang === "en-US");
  localStorage.setItem('lang', lang);
}

// Modal
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

// Busca Counter
async function fetchHeroCounters(heroId) {
  try {
    const res = await fetch(`https://mlbb-proxy.vercel.app/api/hero-counter?id=${heroId}`);
    const json = await res.json();
    if (json && json.data && json.data.records && json.data.records[0] && json.data.records[0].data) {
      return json.data.records[0].data;
    }
  } catch(e) {}
  return null;
}

// Render cards utilitário
function renderTierCards(heroes, tierId) {
  const container = document.getElementById(tierId);
  if (!container) return;
  heroes.forEach(entry => {
    const hero = entry.data.main_hero.data;
    const winRate = (entry.data.main_hero_win_rate * 100).toFixed(1);
    const heroId = heroNameToId[hero.name];
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
    container.appendChild(el);
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

      // Separe os heróis por tier
      const ssHeroes = [];
      const sHeroes  = [];
      const aHeroes  = [];
      let idSet = new Set();

      records.forEach(entry => {
        const hero = entry.data.main_hero.data;
        const winRate = (entry.data.main_hero_win_rate * 100).toFixed(1);
        const heroId = heroNameToId[hero.name];
        if (!heroId || idSet.has(heroId)) return;
        idSet.add(heroId);

        if (winRate >= 54) ssHeroes.push(entry);
        else if (winRate >= 51) sHeroes.push(entry);
        else aHeroes.push(entry);
      });

      // Renderize SS primeiro
      renderTierCards(ssHeroes, 'tier-ss');

      // Aguarde um pouco após o SS (pode ser 0 para apenas jogar na próxima "frame" do navegador)
      setTimeout(() => {
        renderTierCards(sHeroes, 'tier-s');
        renderTierCards(aHeroes, 'tier-a');
      }, 0);

      if (!ssHeroes.length && !sHeroes.length && !aHeroes.length) {
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

function setupHeroCardClicks() {
  document.querySelectorAll('.card').forEach(card => {
    if (card._counterBound) return;
    card._counterBound = true;
    card.style.cursor = "pointer";
    card.onclick = async function() {
      const heroId = card.getAttribute('data-id');
      const heroName = card.getAttribute('data-name');
      const heroImg = card.querySelector('img').src;
      showHeroCounterModal(heroId, heroName, heroImg);
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

// MODAL DO HERÓI
async function showHeroCounterModal(heroId, heroName, heroImg) {
  const modal = document.getElementById("heroModal");
  const body = modal.querySelector(".hero-modal-body");

  // Fetch hero details (skills + desc)
  let skillHtml = '';
  let detailsData = null;
  try {
    const res = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail?hero_id=${heroId}`);
    detailsData = await res.json();
  } catch (e) {}

  // Pega descrição curta (desc) ou usa story como fallback
  let descricaoHeroi = "";
  if (
    detailsData &&
    detailsData.data &&
    detailsData.data.records &&
    detailsData.data.records[0] &&
    detailsData.data.records[0].data &&
    detailsData.data.records[0].data.hero &&
    detailsData.data.records[0].data.hero.data
  ) {
    const heroData = detailsData.data.records[0].data.hero.data;
    descricaoHeroi = heroData.desc || heroData.story || "";
  }

  // Skills
  let skills = [];
  if (
    detailsData &&
    detailsData.data &&
    detailsData.data.records &&
    detailsData.data.records[0] &&
    detailsData.data.records[0].data &&
    detailsData.data.records[0].data.hero &&
    detailsData.data.records[0].data.hero.data &&
    detailsData.data.records[0].data.hero.data.heroskilllist
  ) {
    skills = detailsData.data.records[0].data.hero.data.heroskilllist.flatMap(s => s.skilllist);
  }
  const skillLabels = ["P", "1", "2", "ULT"];
  const labelNames = ["Passiva", "Skill 1", "Skill 2", "Ultimate"];
  const mainSkills = skills.slice(0, 4);
  const extraSkills = skills.slice(4);

  // Main skills
  let skillsRowHtml = mainSkills.map((skill, i) => {
    const tags = Array.isArray(skill.skilltag)
      ? skill.skilltag.map(tag =>
          `<span class="hero-modal-skill-tag" style="background:rgb(${tag.tagrgb});">${tag.tagname}</span>`
        ).join(' ')
      : '';
    const cost = skill["skillcd&cost"] ? `<div class="hero-modal-skill-cost">${skill["skillcd&cost"]}</div>` : '';
    const label = skillLabels[i] || "";
    const labelName = labelNames[i] || "";
    return `
      <div class="hero-modal-skill-inline">
        <div class="hero-modal-skill-icon-wrap" tabindex="0">
          <img src="${skill.skillicon}" alt="${skill.skillname}" class="hero-modal-skill-icon">
          <div class="hero-modal-skill-hover-pop hidden">
            <div class="hero-modal-skill-hover-title">${skill.skillname}</div>
            <div class="hero-modal-skill-hover-desc">${skill.desc || skill.skilldesc || ""}</div>
            <div class="hero-modal-skill-hover-tags">${tags}</div>
            ${cost}
          </div>
        </div>
        <div class="hero-modal-skill-label hero-modal-skill-label-${label}">
          (${label})<span class="hero-modal-skill-label-name">${labelName}</span>
        </div>
      </div>
    `;
  }).join("");

  // Extra skills
  let extraHtml = "";
  if (extraSkills.length > 0) {
    extraHtml = `
      <div class="hero-modal-skill-inline hero-modal-skill-extra-toggle" tabindex="0">
        <div class="hero-modal-skill-extra-btn" id="extraSkillsBtn" aria-label="Mostrar habilidades extras" title="Habilidades extras" tabindex="0">+</div>
        <div class="hero-modal-skill-extra-pop hidden" id="extraSkillsPopover">
          ${extraSkills.map((skill, idx) => {
            const tags = Array.isArray(skill.skilltag)
              ? skill.skilltag.map(tag =>
                  `<span class="hero-modal-skill-tag" style="background:rgb(${tag.tagrgb});">${tag.tagname}</span>`
                ).join(' ')
              : '';
            const cost = skill["skillcd&cost"] ? `<div class="hero-modal-skill-cost">${skill["skillcd&cost"]}</div>` : '';
            return `
              <div class="hero-modal-skill-inline hero-modal-skill-inline-extra">
                <div class="hero-modal-skill-icon-wrap" tabindex="0">
                  <img src="${skill.skillicon}" alt="${skill.skillname}" class="hero-modal-skill-icon">
                  <div class="hero-modal-skill-hover-pop hidden">
                    <div class="hero-modal-skill-hover-title">${skill.skillname}</div>
                    <div class="hero-modal-skill-hover-desc">${skill.desc || skill.skilldesc || ""}</div>
                    <div class="hero-modal-skill-hover-tags">${tags}</div>
                    ${cost}
                  </div>
                </div>
                <div class="hero-modal-skill-label hero-modal-skill-label-EX">
                  (EX${idx+1})<span class="hero-modal-skill-label-name">Extra</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  skillHtml = `
    <div class="hero-modal-skills-section">
      <div class="hero-modal-skills-title">Skills</div>
      <div class="hero-modal-skills-row">
        ${skillsRowHtml}
        ${extraHtml}
      </div>
    </div>
  `;

  // Cabeçalho com nome + descrição curta (ou story)
  body.innerHTML = `
    <div class="hero-modal-header">
      <img src="${heroImg}" alt="${heroName}" class="hero-modal-portrait">
      <div class="hero-modal-title-wrap">
        <div class="hero-modal-title">
          ${heroName}
          ${descricaoHeroi ? `<span class="hero-modal-desc-label">${descricaoHeroi}</span>` : ''}
        </div>
      </div>
    </div>
    ${skillHtml}
    <div class="hero-modal-counters-title">Counters</div>
    <div class="hero-modal-counters-loading">Carregando...</div>
    <div class="hero-modal-counters-list"></div>
  `;
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("show"), 5);

  // Popper para skills principais e extras
  setTimeout(() => {
    document.querySelectorAll('.hero-modal-skill-icon-wrap').forEach((wrap) => {
      const icon = wrap.querySelector('.hero-modal-skill-icon');
      const popover = wrap.querySelector('.hero-modal-skill-hover-pop');
      if (!popover) return;
      let popperInstance = null;
      function show() {
        popover.classList.remove('hidden');
        popperInstance = Popper.createPopper(icon, popover, {
          placement: 'bottom',
          modifiers: [
            {
              name: 'preventOverflow',
              options: { boundary: document.body, padding: 8 },
            },
            { name: 'flip', options: { fallbackPlacements: ['top', 'right', 'left'] } },
            { name: 'offset', options: { offset: [0, 8] } },
          ],
        });
      }
      function hide() {
        popover.classList.add('hidden');
        if (popperInstance) popperInstance.destroy();
        popperInstance = null;
      }
      wrap.addEventListener('mouseenter', show);
      wrap.addEventListener('mouseleave', hide);
      wrap.addEventListener('focus', show);
      wrap.addEventListener('blur', hide);
      wrap.addEventListener('touchstart', function(e){
        e.stopPropagation();
        if (popover.classList.contains('hidden')) {
          show();
          document.body.addEventListener('touchstart', function closePopper(ev){
            if (!wrap.contains(ev.target)) {
              hide();
              document.body.removeEventListener('touchstart', closePopper);
            }
          });
        }
      });
    });

    // Popper para skills extras (+)
    const extraBtn = document.getElementById('extraSkillsBtn');
    const extraPopover = document.getElementById('extraSkillsPopover');
    let extraPopperInstance = null;
    let closeExtraPopover;
    if (extraBtn && extraPopover) {
      // Impede que clique dentro do popover feche ele
      extraPopover.addEventListener('mousedown', function(ev) {
        ev.stopPropagation();
      });
      function showExtra() {
        extraPopover.classList.remove('hidden');
        extraPopperInstance = Popper.createPopper(extraBtn, extraPopover, {
          placement: 'bottom',
          modifiers: [
            { name: 'preventOverflow', options: { boundary: document.body, padding: 12 } },
            { name: 'flip', options: { fallbackPlacements: ['top','left','right'] } },
            { name: 'offset', options: { offset: [0, 8] } },
          ]
        });
        // Fecha só clicando fora ou ESC
        closeExtraPopover = function(ev) {
          if (!extraBtn.contains(ev.target) && !extraPopover.contains(ev.target)) {
            hideExtra();
            document.removeEventListener('mousedown', closeExtraPopover, true);
            document.removeEventListener('keydown', escCloseExtraPopover, true);
          }
        };
        escCloseExtraPopover = function(ev) {
          if (ev.key === "Escape") {
            hideExtra();
            document.removeEventListener('mousedown', closeExtraPopover, true);
            document.removeEventListener('keydown', escCloseExtraPopover, true);
          }
        };
        document.addEventListener('mousedown', closeExtraPopover, true);
        document.addEventListener('keydown', escCloseExtraPopover, true);
      }
      function hideExtra() {
        extraPopover.classList.add('hidden');
        if (extraPopperInstance) extraPopperInstance.destroy();
        extraPopperInstance = null;
      }
      extraBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (extraPopover.classList.contains('hidden')) {
          showExtra();
        } else {
          hideExtra();
        }
      });
      extraBtn.addEventListener('focus', showExtra);
      extraBtn.addEventListener('blur', hideExtra);
      // NÃO fecha ao mouseleave!
    }
  }, 400);

  // Fetch counters
  const data = await fetchHeroCounters(heroId);
  const list = body.querySelector(".hero-modal-counters-list");
  const loading = body.querySelector(".hero-modal-counters-loading");
  loading.style.display = "none";
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
