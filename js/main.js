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
    lane_roam: "Roteação",
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
function translate(key) { return translations[currentLang][key] || key; }
function updateI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
  });
  document.querySelectorAll('option[data-i18n]').forEach(opt => {
    const key = opt.getAttribute('data-i18n');
    if (translations[currentLang][key]) opt.textContent = translations[currentLang][key];
  });
}
function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  let icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  localStorage.setItem('theme', theme);
}
function toggleTheme() { setTheme(document.body.getAttribute('data-theme') === "dark" ? "light" : "dark"); }
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  updateI18n();
  const langFlag = document.getElementById('langFlag');
  if (langFlag) langFlag.style.backgroundImage = lang === "pt-BR"
    ? "url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/br.svg')"
    : "url('https://cdn.jsdelivr.net/gh/hjnilsson/country-flags/svg/us.svg')";
  document.getElementById('flagBR').classList.toggle('selected', lang === "pt-BR");
  document.getElementById('flagUS').classList.toggle('selected', lang === "en-US");
  localStorage.setItem('lang', lang);
}
function showFlagDropdown(show) { document.getElementById('flagDropdown').classList.toggle('hidden', !show); }
function fetchHeroMap() {
  return fetch('https://mlbb-proxy.vercel.app/api/hero-list')
    .then(res => res.json())
    .then(map => {
      heroIdToName = map;
      heroNameToId = {};
      Object.entries(map).forEach(([id, name]) => { heroNameToId[name] = id; });
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
function carregarTierList() {
  const myToken = ++tierListRequestToken;
  const rank = document.getElementById('rank').value;
  const days = document.getElementById('days').value;
  const url = `https://mlbb-proxy.vercel.app/api/hero-rank?source=rank&days=${days}&rank=${rank}&size=130&sort_field=win_rate&sort_order=desc`;
  document.getElementById('tier-ss').innerHTML = '';
  document.getElementById('tier-s').innerHTML = '';
  document.getElementById('tier-a').innerHTML = '';
  document.getElementById('noResults').classList.add('hidden');
  tierCards = []; tierRecords = [];
  Promise.all([fetchHeroMap(), fetchAllHeroPositions(), fetch(url).then(res => res.json())])
    .then(([_, __, json]) => {
      if (myToken !== tierListRequestToken) return;
      const records = json.data.records || [];
      tierRecords = records;
      const ssHeroes = [], sHeroes = [], aHeroes = [];
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
      renderTierCards(ssHeroes, 'tier-ss');
      setTimeout(() => {
        renderTierCards(sHeroes, 'tier-s');
        renderTierCards(aHeroes, 'tier-a');
      }, 0);
      if (!ssHeroes.length && !sHeroes.length && !aHeroes.length) document.getElementById('noResults').classList.remove('hidden');
      filtrarTierList();
      setupHeroCardClicks();
    })
    .catch(err => { document.getElementById('noResults').classList.remove('hidden'); });
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
document.addEventListener('DOMContentLoaded', function () {
  let theme = localStorage.getItem('theme');
  if (!theme) theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
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
  langSwitch.addEventListener('click', function(e) { showFlagDropdown(true); e.stopPropagation(); });
  document.getElementById('flagBR').addEventListener('click', function() { setLanguage('pt-BR'); showFlagDropdown(false); carregarTierList(); });
  document.getElementById('flagUS').addEventListener('click', function() { setLanguage('en-US'); showFlagDropdown(false); carregarTierList(); });
  document.addEventListener('click', function(e) {
    if (!document.getElementById('flagDropdown').contains(e.target) && e.target !== langSwitch) showFlagDropdown(false);
  });
  document.getElementById('flagBR').addEventListener('keypress', function(e){ if(e.key==='Enter'){setLanguage('pt-BR'); showFlagDropdown(false); carregarTierList();} });
  document.getElementById('flagUS').addEventListener('keypress', function(e){ if(e.key==='Enter'){setLanguage('en-US'); showFlagDropdown(false); carregarTierList();} });
  const modal = document.getElementById("heroModal");
  modal.addEventListener("click", function(e) {
    if (e.target === modal || e.target.classList.contains("hero-modal-close")) {
      modal.classList.remove("show");
      setTimeout(() => modal.classList.add("hidden"), 200);
    }
  });
});
async function showHeroCounterModal(heroId, heroName, heroImg) {
  const modal = document.getElementById("heroModal");
  const body = modal.querySelector(".hero-modal-body");
  let skillHtml = '';
  let detailsData = null;
  try {
    const res = await fetch(`https://mlbb-proxy.vercel.app/api/hero-detail?hero_id=${heroId}`);
    detailsData = await res.json();
  } catch (e) {}
  let descricaoHeroi = "";
  if (
    detailsData && detailsData.data && detailsData.data.records &&
    detailsData.data.records[0] && detailsData.data.records[0].data &&
    detailsData.data.records[0].data.hero && detailsData.data.records[0].data.hero.data
  ) {
    const heroData = detailsData.data.records[0].data.hero.data;
    descricaoHeroi = heroData.desc || heroData.story || "";
  }
  let skills = [];
  if (
    detailsData && detailsData.data && detailsData.data.records &&
    detailsData.data.records[0] && detailsData.data.records[0].data &&
    detailsData.data.records[0].data.hero && detailsData.data.records[0].data.hero.data &&
    detailsData.data.records[0].data.hero.data.heroskilllist
  ) {
    skills = detailsData.data.records[0].data.hero.data.heroskilllist.flatMap(s => s.skilllist);
  }
  const skillLabels = ["P", "1", "2", "ULT"];
  const labelNames = ["Passiva", "Skill 1", "Skill 2", "Ultimate"];
  const mainSkills = skills.slice(0, 4);
  const extraSkills = skills.slice(4);
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
    <div class="hero-modal-strong-title">Forte contra</div>
    <div class="hero-modal-strong-list"></div>
  `;
  const countersLoading = body.querySelector('.hero-modal-counters-loading');
  const countersList = body.querySelector('.hero-modal-counters-list');
  const strongList = body.querySelector('.hero-modal-strong-list');
  if (countersLoading && countersList && strongList) {
    countersLoading.style.display = '';
    countersList.innerHTML = '';
    strongList.innerHTML = '';
    fetchHeroCounters(heroId).then(data => {
      countersLoading.style.display = 'none';
      if (data && Array.isArray(data.sub_hero) && data.sub_hero.length > 0) {
        countersList.innerHTML = data.sub_hero.map(h => `
          <div class="counter-img-wrap" title="${h.hero.data.name}">
            <img class="hero-modal-counter-img" src="${h.hero.data.head}" alt="${h.hero.data.name}">
            <div class="counter-badge counter-badge-red">${(h.hero_win_rate * 100).toFixed(1)}%</div>
            <div class="counter-hover-name">${h.hero.data.name}</div>
          </div>
        `).join('');
      } else {
        countersList.innerHTML = '<div class="hero-modal-counters-empty">Nenhuma informação disponível.</div>';
      }
      if (data && Array.isArray(data.sub_hero_last) && data.sub_hero_last.length > 0) {
        strongList.innerHTML = data.sub_hero_last.map(h => `
          <div class="counter-img-wrap" title="${h.hero.data.name}">
            <img class="hero-modal-counter-img" src="${h.hero.data.head}" alt="${h.hero.data.name}">
            <div class="counter-badge counter-badge-green">${(h.hero_win_rate * 100).toFixed(1)}%</div>
            <div class="counter-hover-name">${h.hero.data.name}</div>
          </div>
        `).join('');
      } else {
        strongList.innerHTML = '<div class="hero-modal-counters-empty">Nenhuma informação disponível.</div>';
      }
      setTimeout(() => {
        document.querySelectorAll('.counter-img-wrap').forEach(wrap => {
          const name = wrap.querySelector('.counter-hover-name');
          wrap.addEventListener('mouseenter', () => {
            if (name) name.classList.add('show');
          });
          wrap.addEventListener('mouseleave', () => {
            if (name) name.classList.remove('show');
          });
          wrap.addEventListener('focus', () => {
            if (name) name.classList.add('show');
          });
          wrap.addEventListener('blur', () => {
            if (name) name.classList.remove('show');
          });
        });
      }, 1);
    });
  }
  modal.classList.remove("hidden");
  setTimeout(() => modal.classList.add("show"), 5);
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
            { name: 'preventOverflow', options: { boundary: document.body, padding: 8 } },
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
    const extraBtn = document.getElementById('extraSkillsBtn');
    const extraPopover = document.getElementById('extraSkillsPopover');
    let extraPopperInstance = null;
    let closeExtraPopover;
    let escCloseExtraPopover;
    if (extraBtn && extraPopover) {
      function showPopover() {
        extraPopover.classList.remove('hidden');
        extraPopperInstance = Popper.createPopper(extraBtn, extraPopover, {
          placement: 'bottom',
          modifiers: [
            { name: 'preventOverflow', options: { boundary: document.body, padding: 8 } },
            { name: 'flip', options: { fallbackPlacements: ['top', 'right', 'left'] } },
            { name: 'offset', options: { offset: [0, 8] } },
          ],
        });
        closeExtraPopover = function(ev) {
          if (!extraPopover.contains(ev.target) && ev.target !== extraBtn) hidePopover();
        };
        escCloseExtraPopover = function(ev) { if (ev.key === 'Escape') hidePopover(); };
        document.body.addEventListener('mousedown', closeExtraPopover);
        document.addEventListener('keydown', escCloseExtraPopover);
      }
      function hidePopover() {
        extraPopover.classList.add('hidden');
        if (extraPopperInstance) extraPopperInstance.destroy();
        extraPopperInstance = null;
        document.body.removeEventListener('mousedown', closeExtraPopover);
        document.removeEventListener('keydown', escCloseExtraPopover);
      }
      extraBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (extraPopover.classList.contains('hidden')) showPopover();
        else hidePopover();
      });
    }
  }, 10);
}
