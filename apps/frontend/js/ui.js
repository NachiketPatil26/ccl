import { logout } from './api.js';
import { buildApiUrl } from './config.js';

function byId(id) {
  return document.getElementById(id);
}

export const elements = {
  landingShell: byId('landing-shell'),
  dashboardTopbar: byId('dashboard-topbar'),
  dashboardSidebar: byId('dashboard-sidebar'),
  dashboardMain: byId('dashboard-main'),
  dashboardBottomNav: byId('dashboard-bottom-nav'),
  landingConnectGoogleFitButton: byId('landing-connect-google-fit-btn'),
  connectGoogleFitButton: byId('connect-google-fit-btn'),
  fitStatusElement: byId('fit-status'),
  dashboardStatusElement: byId('dashboard-status'),
  metricStepsElement: byId('metric-steps'),
  metricCaloriesElement: byId('metric-calories'),
  metricHeartRateElement: byId('metric-heart-rate'),
  intelligenceConsumedValueElement: byId('intelligence-consumed-value'),
  intelligenceBurnedValueElement: byId('intelligence-burned-value'),
  intelligenceIntakeDeltaElement: byId('intelligence-intake-delta'),
  intelligenceBurnedDeltaElement: byId('intelligence-burned-delta'),
  intelligenceNetKcalElement: byId('intelligence-net-kcal'),
  metabolicGapValueElement: byId('metabolic-gap-value'),
  metabolicGapBarElement: byId('metabolic-gap-bar'),
  metabolicGapSummaryElement: byId('metabolic-gap-summary'),
  intelligenceAiTagElement: byId('intelligence-ai-tag'),
  intelligenceBalanceModeElement: byId('intelligence-balance-mode'),
  aiRecommendationTextElement: byId('ai-recommendation-text'),
  nutritionProteinPercentElement: byId('nutrition-protein-percent'),
  nutritionCarbsPercentElement: byId('nutrition-carbs-percent'),
  nutritionFatsPercentElement: byId('nutrition-fats-percent'),
  nutritionProteinBarElement: byId('nutrition-protein-bar'),
  nutritionCarbsBarElement: byId('nutrition-carbs-bar'),
  nutritionFatsBarElement: byId('nutrition-fats-bar'),
  nutritionDensityScoreElement: byId('nutrition-density-score'),
  nutritionDensityLabelElement: byId('nutrition-density-label'),
  nutritionDensityDetailElement: byId('nutrition-density-detail'),
  nutritionInsightListElement: byId('nutrition-insight-list'),
  settingsMenuButton: byId('settings-menu-btn'),
  settingsMenu: byId('settings-menu'),
  settingsMenuLogoutButton: byId('settings-menu-logout'),
  sidebarLogoutLink: byId('sidebar-logout-link'),
  logoutConfirmModal: byId('logout-confirm-modal'),
  logoutCancelButton: byId('logout-cancel-btn'),
  logoutConfirmButton: byId('logout-confirm-btn')
};

let responsiveShellListenerAttached = false;

function applyResponsiveShellVisibility() {
  if (!elements.dashboardMain || elements.dashboardMain.classList.contains('hidden')) {
    return;
  }

  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

  if (isDesktop) {
    elements.dashboardSidebar.classList.remove('hidden');
    elements.dashboardBottomNav.classList.add('hidden');
    return;
  }

  elements.dashboardSidebar.classList.add('hidden');
  elements.dashboardBottomNav.classList.remove('hidden');
}

export function showLandingShell() {
  elements.landingShell.classList.remove('hidden');

  elements.dashboardTopbar.classList.add('hidden');
  elements.dashboardSidebar.classList.add('hidden');
  elements.dashboardMain.classList.add('hidden');
  elements.dashboardBottomNav.classList.add('hidden');
}

export function showDashboardShell() {
  elements.landingShell.classList.add('hidden');

  elements.dashboardTopbar.classList.remove('hidden');
  elements.dashboardMain.classList.remove('hidden');
  applyResponsiveShellVisibility();
}

export function setupResponsiveShell() {
  if (responsiveShellListenerAttached) {
    return;
  }

  window.addEventListener('resize', applyResponsiveShellVisibility);
  responsiveShellListenerAttached = true;
}

export function setLoadingState() {
  if (elements.fitStatusElement) {
    elements.fitStatusElement.textContent = 'Loading metrics...';
  }
}

export function setConnectedState() {
  if (elements.fitStatusElement) {
    elements.fitStatusElement.textContent = 'Google Fit connected';
  }
}

export function setErrorState(message) {
  if (elements.fitStatusElement) {
    elements.fitStatusElement.textContent = message;
  }
}

export function updateMetricCards(metrics, insights = {}) {
  const steps = Number(metrics.steps || 0);
  const caloriesBurned = Number(metrics.caloriesBurned || 0);
  const hasCaloriesConsumed = metrics.caloriesConsumedAvailable !== false;
  const caloriesConsumed = hasCaloriesConsumed
    ? Number(metrics.caloriesConsumed || 0)
    : 0;
  const heartRateAvg = Number(metrics.heartRateAvg || 0);
  const netCalories = Math.round(caloriesConsumed - caloriesBurned);
  const intakeDeltaPercent = Number(insights.intakeDeltaPercent || 0);
  const burnedDeltaPercent = Number(insights.burnedDeltaPercent || 0);
  const metabolicGapPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        hasCaloriesConsumed
          ? (Math.abs(netCalories) / Math.max(caloriesBurned, 1)) * 100
          : 0
      )
    )
  );

  const proteinPercent = Math.max(15, Math.min(45, Math.round(22 + heartRateAvg / 8)));
  const carbsPercent = Math.max(25, Math.min(60, Math.round(48 + steps / 3500)));
  const fatsPercent = Math.max(10, 100 - proteinPercent - carbsPercent);

  const densityScore = Math.max(
    45,
    Math.min(98, Math.round(82 - metabolicGapPercent * 0.35 + Math.min(steps / 2500, 12)))
  );

  const balanceMode = netCalories > 220 ? 'Surplus' : netCalories < -220 ? 'Deficit' : 'Balanced';
  const aiTag = netCalories > 220 ? 'Build' : netCalories < -220 ? 'Cut' : 'Maintain';

  if (elements.metricStepsElement) {
    elements.metricStepsElement.textContent = steps.toLocaleString();
  }
  if (elements.metricCaloriesElement) {
    elements.metricCaloriesElement.textContent = caloriesBurned.toLocaleString();
  }
  if (elements.metricHeartRateElement) {
    elements.metricHeartRateElement.textContent = heartRateAvg.toLocaleString();
  }
  if (elements.dashboardStatusElement) {
    elements.dashboardStatusElement.textContent = balanceMode === 'Balanced' ? 'Optimal Fueling' : `${balanceMode} Mode`;
  }

  if (elements.intelligenceConsumedValueElement) {
    elements.intelligenceConsumedValueElement.textContent = hasCaloriesConsumed
      ? Math.round(caloriesConsumed).toLocaleString()
      : 'N/A';
  }
  if (elements.intelligenceBurnedValueElement) {
    elements.intelligenceBurnedValueElement.textContent = Math.round(caloriesBurned).toLocaleString();
  }
  if (elements.intelligenceIntakeDeltaElement) {
    elements.intelligenceIntakeDeltaElement.textContent = hasCaloriesConsumed
      ? `${intakeDeltaPercent >= 0 ? '+' : ''}${intakeDeltaPercent}%`
      : 'N/A';
  }
  if (elements.intelligenceBurnedDeltaElement) {
    elements.intelligenceBurnedDeltaElement.textContent = `${burnedDeltaPercent >= 0 ? '+' : ''}${burnedDeltaPercent}%`;
  }
  if (elements.intelligenceNetKcalElement) {
    elements.intelligenceNetKcalElement.textContent = hasCaloriesConsumed
      ? `${netCalories > 0 ? '+' : ''}${netCalories.toLocaleString()}`
      : 'N/A';
  }
  if (elements.metabolicGapValueElement) {
    elements.metabolicGapValueElement.textContent = `${metabolicGapPercent}%`;
  }
  if (elements.metabolicGapBarElement) {
    elements.metabolicGapBarElement.style.width = `${Math.max(8, metabolicGapPercent)}%`;
  }
  if (elements.metabolicGapSummaryElement) {
    elements.metabolicGapSummaryElement.textContent =
      !hasCaloriesConsumed
        ? 'Calories consumed datasource is not available in Google Fit for this account.'
        : balanceMode === 'Balanced'
        ? 'Current burn-to-intake profile is stable. Continue this pacing for steady recovery and energy continuity.'
        : balanceMode === 'Surplus'
          ? 'Energy intake is trending above burn. Consider a lighter dinner or a recovery walk to rebalance.'
          : 'Burn is outpacing intake. Consider adding a nutrient-dense snack to maintain performance.';
  }
  if (elements.intelligenceAiTagElement) {
    elements.intelligenceAiTagElement.textContent = aiTag;
  }
  if (elements.intelligenceBalanceModeElement) {
    elements.intelligenceBalanceModeElement.textContent = balanceMode;
  }
  if (elements.aiRecommendationTextElement) {
    elements.aiRecommendationTextElement.textContent =
      balanceMode === 'Balanced'
        ? 'You are in a stable metabolic corridor. Hold current macros and hydration cadence.'
        : balanceMode === 'Surplus'
          ? 'Shift the next meal toward lean protein and fiber, and add 20 minutes of light movement.'
          : 'Add a mixed snack with protein and complex carbs to reduce fatigue and stabilize output.';
  }

  if (elements.nutritionProteinPercentElement) {
    elements.nutritionProteinPercentElement.textContent = `${proteinPercent}%`;
  }
  if (elements.nutritionCarbsPercentElement) {
    elements.nutritionCarbsPercentElement.textContent = `${carbsPercent}%`;
  }
  if (elements.nutritionFatsPercentElement) {
    elements.nutritionFatsPercentElement.textContent = `${fatsPercent}%`;
  }
  if (elements.nutritionProteinBarElement) {
    elements.nutritionProteinBarElement.style.width = `${proteinPercent}%`;
  }
  if (elements.nutritionCarbsBarElement) {
    elements.nutritionCarbsBarElement.style.width = `${carbsPercent}%`;
  }
  if (elements.nutritionFatsBarElement) {
    elements.nutritionFatsBarElement.style.width = `${fatsPercent}%`;
  }
  if (elements.nutritionDensityScoreElement) {
    elements.nutritionDensityScoreElement.textContent = densityScore.toLocaleString();
  }
  if (elements.nutritionDensityLabelElement) {
    elements.nutritionDensityLabelElement.textContent =
      densityScore >= 85 ? 'High Density' : densityScore >= 70 ? 'Balanced' : 'Needs Attention';
  }
  if (elements.nutritionDensityDetailElement) {
    elements.nutritionDensityDetailElement.textContent = `Derived from activity telemetry and balance gap (${metabolicGapPercent}%).`;
  }

  if (elements.nutritionInsightListElement) {
    elements.nutritionInsightListElement.innerHTML = `
      <div class="flex items-center gap-4 text-sm font-body">
        <span class="material-symbols-outlined text-primary-fixed" data-icon="check_circle">check_circle</span>
        <span class="text-on-surface-variant">Protein allocation supports recovery pacing.</span>
      </div>
      <div class="flex items-center gap-4 text-sm font-body">
        <span class="material-symbols-outlined text-tertiary-fixed-dim" data-icon="insights">insights</span>
        <span class="text-on-surface-variant">Carb ratio aligns with today’s movement output.</span>
      </div>
      <div class="flex items-center gap-4 text-sm font-body">
        <span class="material-symbols-outlined text-secondary" data-icon="monitor_heart">monitor_heart</span>
        <span class="text-on-surface-variant">Heart-rate signal indicates ${balanceMode.toLowerCase()} metabolic profile.</span>
      </div>
    `;
  }
}

function topTabClasses(tabElement, isActive) {
  tabElement.classList.remove('text-[#00F0FF]', 'font-bold', 'border-b-2', 'border-[#00F0FF]', 'opacity-70', 'text-[#e2e2e6]');

  if (isActive) {
    tabElement.classList.add('text-[#00F0FF]', 'font-bold', 'border-b-2', 'border-[#00F0FF]');
    return;
  }

  tabElement.classList.add('text-[#e2e2e6]', 'opacity-70');
}

function sideTabClasses(tabElement, isActive) {
  tabElement.classList.remove('bg-[#1e2023]', 'text-[#00F0FF]', 'border-l-4', 'border-[#00F0FF]', 'opacity-50', 'text-[#e2e2e6]');

  if (isActive) {
    tabElement.classList.add('bg-[#1e2023]', 'text-[#00F0FF]', 'border-l-4', 'border-[#00F0FF]');
    return;
  }

  tabElement.classList.add('text-[#e2e2e6]', 'opacity-50');
}

function bottomTabClasses(tabElement, isActive) {
  tabElement.classList.remove('text-[#00F0FF]', 'text-[#e2e2e6]', 'opacity-50');

  const labelElement = tabElement.querySelector('span:last-child');
  const iconElement = tabElement.querySelector('.material-symbols-outlined');

  if (labelElement) {
    labelElement.classList.remove('font-bold');
  }
  if (iconElement) {
    iconElement.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
  }

  if (isActive) {
    tabElement.classList.add('text-[#00F0FF]');
    if (labelElement) {
      labelElement.classList.add('font-bold');
    }
    if (iconElement) {
      iconElement.style.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
    }
    return;
  }

  tabElement.classList.add('text-[#e2e2e6]', 'opacity-50');
}

export function setupTabs(initialTab = 'nutrition') {
  let activeTab = initialTab;

  const navTabs = Array.from(document.querySelectorAll('[data-tab-target]'));
  const sections = Array.from(document.querySelectorAll('[data-tab-section]'));

  function applyTabState() {
    sections.forEach((section) => {
      const shouldShow = section.dataset.tabSection === activeTab;
      section.classList.toggle('hidden', !shouldShow);
      section.classList.add('transition-opacity', 'duration-300');
    });

    navTabs.forEach((tabElement) => {
      const tabName = tabElement.dataset.tabTarget;
      const isActive = tabName === activeTab;
      if (tabElement.id.startsWith('top-tab-')) {
        topTabClasses(tabElement, isActive);
      }
      if (tabElement.id.startsWith('side-tab-')) {
        sideTabClasses(tabElement, isActive);
      }
      if (tabElement.id.startsWith('bottom-tab-')) {
        bottomTabClasses(tabElement, isActive);
      }
    });

    localStorage.setItem('vitalorb_active_tab', activeTab);
  }

  navTabs.forEach((tabElement) => {
    tabElement.addEventListener('click', (event) => {
      event.preventDefault();
      activeTab = tabElement.dataset.tabTarget;
      applyTabState();
    });
  });

  const cachedTab = localStorage.getItem('vitalorb_active_tab');
  if (cachedTab) {
    activeTab = cachedTab;
  }

  applyTabState();
}

function openLogoutConfirmModal() {
  if (!elements.logoutConfirmModal) {
    return;
  }

  elements.logoutConfirmModal.classList.remove('hidden');
  elements.logoutConfirmModal.classList.add('flex');
}

function closeLogoutConfirmModal() {
  if (!elements.logoutConfirmModal) {
    return;
  }

  elements.logoutConfirmModal.classList.add('hidden');
  elements.logoutConfirmModal.classList.remove('flex');
}

function toggleSettingsMenu() {
  if (elements.settingsMenu) {
    elements.settingsMenu.classList.toggle('hidden');
  }
}

function closeSettingsMenu() {
  if (elements.settingsMenu) {
    elements.settingsMenu.classList.add('hidden');
  }
}

async function logoutCurrentSession() {
  try {
    await logout();
  } finally {
    window.location.href = '/';
  }
}

export function setupSettingsMenuAndLogout() {
  if (
    !elements.settingsMenuButton ||
    !elements.settingsMenu ||
    !elements.settingsMenuLogoutButton ||
    !elements.sidebarLogoutLink ||
    !elements.logoutCancelButton ||
    !elements.logoutConfirmButton ||
    !elements.logoutConfirmModal
  ) {
    return;
  }

  elements.settingsMenuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSettingsMenu();
  });

  elements.settingsMenuLogoutButton.addEventListener('click', () => {
    closeSettingsMenu();
    openLogoutConfirmModal();
  });

  elements.sidebarLogoutLink.addEventListener('click', (event) => {
    event.preventDefault();
    closeSettingsMenu();
    openLogoutConfirmModal();
  });

  elements.logoutCancelButton.addEventListener('click', closeLogoutConfirmModal);
  elements.logoutConfirmButton.addEventListener('click', logoutCurrentSession);

  elements.logoutConfirmModal.addEventListener('click', (event) => {
    if (event.target === elements.logoutConfirmModal) {
      closeLogoutConfirmModal();
    }
  });

  document.addEventListener('click', (event) => {
    if (!elements.settingsMenu.contains(event.target) && event.target !== elements.settingsMenuButton) {
      closeSettingsMenu();
    }
  });
}

export function setupConnectButton() {
  if (elements.connectGoogleFitButton) {
    elements.connectGoogleFitButton.addEventListener('click', () => {
      window.location.href = buildApiUrl('/auth/google');
    });
  }

  if (elements.landingConnectGoogleFitButton) {
    elements.landingConnectGoogleFitButton.addEventListener('click', () => {
      window.location.href = buildApiUrl('/auth/google');
    });
  }
}
