import { fetchMetrics, fetchSessionStatus } from './api.js';
import {
  renderCircularBalanceChart,
  renderActivitySpiderChart,
  renderRecoveryTrendChart,
  renderCadenceChart,
  renderStepsTrendChart,
  renderCaloriesTrendChart,
  renderNutritionTelemetryChart,
  renderConsumptionBurnCharts
} from './charts.js';
import {
  showLandingShell,
  showDashboardShell,
  setLoadingState,
  setConnectedState,
  setErrorState,
  updateMetricCards,
  setupTabs,
  setupResponsiveShell,
  setupSettingsMenuAndLogout,
  setupConnectButton
} from './ui.js';

const MANUAL_CALORIES_STORAGE_KEY = 'vitalorb_manual_calories_logs_v1';

let latestRawMetrics = null;
let latestTimezone = 'Asia/Kolkata';

function getManualCaloriesElements() {
  return {
    input: document.getElementById('manual-calories-input'),
    saveButton: document.getElementById('manual-calories-save'),
    clearButton: document.getElementById('manual-calories-clear'),
    status: document.getElementById('manual-calories-status')
  };
}

function parseManualCaloriesLogs() {
  try {
    const raw = localStorage.getItem(MANUAL_CALORIES_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveManualCaloriesLogs(logs) {
  localStorage.setItem(MANUAL_CALORIES_STORAGE_KEY, JSON.stringify(logs));
}

function formatDayKeyForTimezone(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone
  }).format(date);
}

function toDayKeyFromWeeklyDay(day, timeZone) {
  if (day && typeof day.dayKey === 'string' && day.dayKey) {
    return day.dayKey;
  }

  if (day && typeof day.date === 'string' && day.date.length >= 10) {
    return formatDayKeyForTimezone(new Date(day.date), timeZone);
  }

  return null;
}

function recomputeBalanceScores(day) {
  const consumed = Number(day.caloriesConsumed || 0);
  const burned = Number(day.caloriesBurned || 0);

  if (burned <= 0) {
    return {
      recoveryScore: 0,
      balanceScore: 0
    };
  }

  const score = clamp(
    Math.round(100 - (Math.abs(consumed - burned) / burned) * 100),
    0,
    100
  );

  return {
    recoveryScore: score,
    balanceScore: score
  };
}

function applyManualCaloriesOverrides(metrics, timeZone) {
  if (!metrics || !metrics.weekly) {
    return metrics;
  }

  const manualLogs = parseManualCaloriesLogs();
  const weekly = metrics.weekly;
  const days = Array.isArray(weekly.days) ? weekly.days : [];

  const nextDays = days.map((day) => {
    const dayKey = toDayKeyFromWeeklyDay(day, timeZone);
    const manualValue = dayKey ? manualLogs[dayKey] : null;

    if (typeof manualValue !== 'number' || Number.isNaN(manualValue)) {
      return day;
    }

    const scores = recomputeBalanceScores({
      ...day,
      caloriesConsumed: manualValue
    });

    return {
      ...day,
      dayKey,
      caloriesConsumed: manualValue,
      ...scores
    };
  });

  const consumedSeries = nextDays.map((day) => day.caloriesConsumed);
  const recoverySeries = nextDays.map((day) => day.recoveryScore);
  const cadenceSeries = nextDays.map((day) => day.cadenceScore);

  const todayKey = formatDayKeyForTimezone(new Date(), timeZone);
  const todayManual = manualLogs[todayKey];
  const hasManualToday = typeof todayManual === 'number' && !Number.isNaN(todayManual);

  return {
    ...metrics,
    caloriesConsumed: hasManualToday
      ? todayManual
      : metrics.caloriesConsumed,
    caloriesConsumedAvailable:
      metrics.caloriesConsumedAvailable !== false || hasManualToday,
    weekly: {
      ...weekly,
      days: nextDays,
      series: {
        ...(weekly.series || {}),
        caloriesConsumed: consumedSeries,
        recoveryScore: recoverySeries,
        cadenceScore: cadenceSeries
      }
    }
  };
}

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
}

function percentageDelta(currentValue, previousValue) {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous <= 0) {
    return 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildDayOverDayInsights(days = []) {
  const todayData = days[days.length - 1] || {};
  const yesterdayData = days[days.length - 2] || {};

  return {
    intakeDeltaPercent: percentageDelta(
      todayData.caloriesConsumed,
      yesterdayData.caloriesConsumed
    ),
    burnedDeltaPercent: percentageDelta(
      todayData.caloriesBurned,
      yesterdayData.caloriesBurned
    )
  };
}

function updateManualCaloriesStatus(metrics, timeZone) {
  const { input, status } = getManualCaloriesElements();
  if (!status || !input) {
    return;
  }

  const logs = parseManualCaloriesLogs();
  const todayKey = formatDayKeyForTimezone(new Date(), timeZone);
  const todayManual = logs[todayKey];

  if (typeof todayManual === 'number' && !Number.isNaN(todayManual)) {
    status.textContent = `Today logged: ${Math.round(todayManual).toLocaleString()} kcal`;
    input.value = String(Math.round(todayManual));
    return;
  }

  const hasGoogleConsumed = metrics && metrics.caloriesConsumedAvailable !== false;
  status.textContent = hasGoogleConsumed
    ? 'Using Google Fit intake'
    : 'No manual entry for today';
  input.value = '';
}

function renderChartsFromWeeklyMetrics(metrics) {
  const weekly = metrics.weekly || {};
  const labels = Array.isArray(weekly.labels) ? weekly.labels : [];
  const days = Array.isArray(weekly.days) ? weekly.days : [];
  const series = weekly.series || {};

  const stepValues = Array.isArray(series.steps) ? series.steps : [];
  const calorieValues = Array.isArray(series.caloriesBurned) ? series.caloriesBurned : [];
  const consumedValues = Array.isArray(series.caloriesConsumed) ? series.caloriesConsumed : [];
  const heartRateValues = Array.isArray(series.heartRateAvg) ? series.heartRateAvg : [];
  const recoveryValues = Array.isArray(series.recoveryScore)
    ? series.recoveryScore
    : days.map((day) => Number(day.recoveryScore || 0));
  const cadenceValues = Array.isArray(series.cadenceScore)
    ? series.cadenceScore
    : days.map((day) => Number(day.cadenceScore || 0));

  const today = days[days.length - 1] || metrics;
  const coverage = labels.length ? Math.min(days.length / labels.length, 1) : 0;

  const spiderValues = [
    clamp(Math.round(Number(today.stepsScore || 0)), 0, 100),
    clamp(Math.round(Number(today.burnScore || 0)), 0, 100),
    clamp(Math.round(Number(today.cardioScore || 0)), 0, 100),
    clamp(Math.round(coverage * 100), 0, 100),
    clamp(Math.round(Number(today.recoveryScore || 0)), 0, 100),
    clamp(Math.round(Number(today.balanceScore || 0)), 0, 100)
  ];

  renderCircularBalanceChart(
    Number(metrics.caloriesConsumed || 0),
    Number(metrics.caloriesBurned || 0),
    Math.round(Number(metrics.caloriesConsumed || 0) - Number(metrics.caloriesBurned || 0))
  );

  renderActivitySpiderChart(
    ['Movement', 'Expenditure', 'Cardio', 'Consistency', 'Recovery', 'Balance'],
    spiderValues
  );
  renderRecoveryTrendChart(labels, recoveryValues);
  renderCadenceChart(labels, cadenceValues);
  renderStepsTrendChart(labels, stepValues);
  renderCaloriesTrendChart(labels, calorieValues);
  renderNutritionTelemetryChart(labels, heartRateValues);
  renderConsumptionBurnCharts(labels, consumedValues, calorieValues);

  return buildDayOverDayInsights(days);
}

function renderDashboardFromMetrics(rawMetrics, timeZone) {
  const effectiveMetrics = applyManualCaloriesOverrides(rawMetrics, timeZone);
  const dayOverDayInsights = renderChartsFromWeeklyMetrics(effectiveMetrics);
  updateMetricCards(effectiveMetrics, dayOverDayInsights);
  updateManualCaloriesStatus(effectiveMetrics, timeZone);
}

function setupManualCaloriesLogging() {
  const { input, saveButton, clearButton, status } = getManualCaloriesElements();
  if (!input || !saveButton || !clearButton || !status) {
    return;
  }

  saveButton.addEventListener('click', () => {
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < 0) {
      status.textContent = 'Enter a valid non-negative number';
      return;
    }

    const logs = parseManualCaloriesLogs();
    const todayKey = formatDayKeyForTimezone(new Date(), latestTimezone);
    logs[todayKey] = Math.round(value);
    saveManualCaloriesLogs(logs);

    if (latestRawMetrics) {
      renderDashboardFromMetrics(latestRawMetrics, latestTimezone);
    }
  });

  clearButton.addEventListener('click', () => {
    const logs = parseManualCaloriesLogs();
    const todayKey = formatDayKeyForTimezone(new Date(), latestTimezone);
    delete logs[todayKey];
    saveManualCaloriesLogs(logs);

    if (latestRawMetrics) {
      renderDashboardFromMetrics(latestRawMetrics, latestTimezone);
    }
  });
}

async function loadDashboardData() {
  setLoadingState();

  const browserTimezone = getBrowserTimezone();
  latestTimezone = browserTimezone;

  try {
    const metrics = await fetchMetrics(browserTimezone);
    latestRawMetrics = metrics;

    showDashboardShell();
    setConnectedState();

    renderDashboardFromMetrics(metrics, browserTimezone);
  } catch (error) {
    if (error && error.status === 401) {
      showLandingShell();
      return;
    }

    showDashboardShell();
    setErrorState('Unable to load metrics');
  }
}

async function bootstrap() {
  setupConnectButton();
  setupResponsiveShell();
  setupManualCaloriesLogging();

  setupTabs('nutrition');
  setupSettingsMenuAndLogout();

  try {
    const sessionStatus = await fetchSessionStatus();

    if (!sessionStatus.authenticated) {
      showLandingShell();
      return;
    }

    showDashboardShell();
    await loadDashboardData();
  } catch (error) {
    showLandingShell();
  }
}

bootstrap();
