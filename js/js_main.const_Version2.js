// ======================
// MLB Tier List - main.const.js (parte estável)
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

// ======== Funções de idioma e tradução ========
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

  applyTranslations(lang);
  if (typeof carregarTierList === 'function') {
    carregarTierList();
  }
}

// ======== Tema ========
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

function toggleTheme() {
  let theme = document.body.getAttribute('data-theme') === "dark" ? "light" : "dark";
  setTheme(theme);
}

// ======== Utilidades ========
function showFlagDropdown(show) {
  const dropdown = document.getElementById('flagDropdown');
  if (dropdown) dropdown.classList.toggle('hidden', !show);
}