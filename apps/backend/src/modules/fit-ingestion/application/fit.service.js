const axios = require('axios');
const { env } = require('../../../config/env');

const GOOGLE_FIT_AGGREGATE_URL =
  'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

const FIT_DATA_TYPES = {
  steps: 'com.google.step_count.delta',
  caloriesBurned: 'com.google.calories.expended',
  caloriesConsumed: 'com.google.calories.consumed',
  heartRate: 'com.google.heart_rate.bpm'
};

function resolveRequestedTimezone(timezone) {
  if (typeof timezone === 'string' && timezone.trim()) {
    return timezone.trim();
  }

  return env.fitDefaultTimezone;
}

function toDateInTimezone(date, timeZone) {
  return new Date(date.toLocaleString('en-US', { timeZone }));
}

function buildTodayRangeInTimezone(timeZone) {
  const nowUtc = new Date();
  const nowInTimezone = toDateInTimezone(nowUtc, timeZone);
  const timezoneOffsetMillis = nowUtc.getTime() - nowInTimezone.getTime();

  const startOfDayInTimezone = new Date(nowInTimezone);
  startOfDayInTimezone.setHours(0, 0, 0, 0);

  const startTimeMillis = startOfDayInTimezone.getTime() + timezoneOffsetMillis;
  const endTimeMillis = nowUtc.getTime();

  return {
    startTimeMillis,
    endTimeMillis
  };
}

function buildRangeInTimezone(timeZone, days) {
  const nowUtc = new Date();
  const nowInTimezone = toDateInTimezone(nowUtc, timeZone);
  const timezoneOffsetMillis = nowUtc.getTime() - nowInTimezone.getTime();

  const startOfTodayInTimezone = new Date(nowInTimezone);
  startOfTodayInTimezone.setHours(0, 0, 0, 0);

  const rangeStartInTimezone = new Date(startOfTodayInTimezone);
  rangeStartInTimezone.setDate(startOfTodayInTimezone.getDate() - (days - 1));

  return {
    startTimeMillis: rangeStartInTimezone.getTime() + timezoneOffsetMillis,
    endTimeMillis: nowUtc.getTime()
  };
}

function buildTodayAggregatePayload(aggregateByDataTypes, timeZone) {
  const { startTimeMillis, endTimeMillis } = buildTodayRangeInTimezone(timeZone);

  return {
    aggregateBy: aggregateByDataTypes.map((dataTypeName) => ({ dataTypeName })),
    bucketByTime: {
      durationMillis: 24 * 60 * 60 * 1000
    },
    startTimeMillis,
    endTimeMillis
  };
}

function buildAggregatePayload(aggregateByDataTypes, timeZone, days) {
  const { startTimeMillis, endTimeMillis } = buildRangeInTimezone(timeZone, days);

  return {
    aggregateBy: aggregateByDataTypes.map((dataTypeName) => ({ dataTypeName })),
    bucketByTime: {
      durationMillis: 24 * 60 * 60 * 1000
    },
    startTimeMillis,
    endTimeMillis
  };
}

function isMissingDataSourceError(error, dataTypeName) {
  if (!error || !error.isAxiosError) {
    return false;
  }

  const message =
    error.response && error.response.data && error.response.data.error
      ? String(error.response.data.error.message || '')
      : '';

  return (
    error.response &&
    error.response.status === 400 &&
    message.includes('no default datasource found for') &&
    message.includes(dataTypeName)
  );
}

async function postAggregate(accessToken, payload) {
  const response = await axios.post(GOOGLE_FIT_AGGREGATE_URL, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

async function postAggregateWithOptionalConsumedFallback(accessToken, payload) {
  try {
    const data = await postAggregate(accessToken, payload);
    return {
      data,
      caloriesConsumedAvailable: true
    };
  } catch (error) {
    if (!isMissingDataSourceError(error, FIT_DATA_TYPES.caloriesConsumed)) {
      throw error;
    }

    const fallbackPayload = {
      ...payload,
      aggregateBy: (payload.aggregateBy || []).filter(
        (entry) => entry && entry.dataTypeName !== FIT_DATA_TYPES.caloriesConsumed
      )
    };

    const data = await postAggregate(accessToken, fallbackPayload);
    return {
      data,
      caloriesConsumedAvailable: false
    };
  }
}

function collectPointsFromResponse(aggregateResponse) {
  const buckets = aggregateResponse.bucket || [];
  const points = [];

  for (const bucket of buckets) {
    const datasets = bucket.dataset || [];

    for (const dataset of datasets) {
      const datasetPoints = dataset.point || [];

      for (const point of datasetPoints) {
        points.push(point);
      }
    }
  }

  return points;
}

function sumIntegerValues(points, dataTypeName) {
  let total = 0;

  for (const point of points) {
    if (point.dataTypeName !== dataTypeName) {
      continue;
    }

    const values = point.value || [];

    for (const value of values) {
      if (typeof value.intVal === 'number') {
        total += value.intVal;
      }
    }
  }

  return total;
}

function sumFloatValues(points, dataTypeName) {
  let total = 0;

  for (const point of points) {
    if (point.dataTypeName !== dataTypeName) {
      continue;
    }

    const values = point.value || [];

    for (const value of values) {
      if (typeof value.fpVal === 'number') {
        total += value.fpVal;
      }
    }
  }

  return total;
}

function averageFloatValues(points, dataTypeName) {
  let total = 0;
  let count = 0;

  for (const point of points) {
    if (point.dataTypeName !== dataTypeName) {
      continue;
    }

    const values = point.value || [];

    for (const value of values) {
      if (typeof value.fpVal === 'number') {
        total += value.fpVal;
        count += 1;
      }
    }
  }

  if (count === 0) {
    return 0;
  }

  return Number((total / count).toFixed(2));
}

function formatBucketLabel(startTimeMillis, timeZone) {
  const date = new Date(startTimeMillis);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone
  }).format(date);
}

function formatBucketDayKey(startTimeMillis, timeZone) {
  const date = new Date(startTimeMillis);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone
  }).format(date);
}

function extractBucketMetrics(bucket) {
  const points = [];
  const datasets = bucket.dataset || [];

  for (const dataset of datasets) {
    const datasetPoints = dataset.point || [];
    for (const point of datasetPoints) {
      points.push(point);
    }
  }

  return {
    steps: sumIntegerValues(points, FIT_DATA_TYPES.steps),
    caloriesBurned: Number(sumFloatValues(points, FIT_DATA_TYPES.caloriesBurned).toFixed(2)),
    caloriesConsumed: Number(sumFloatValues(points, FIT_DATA_TYPES.caloriesConsumed).toFixed(2)),
    heartRateAvg: averageFloatValues(points, FIT_DATA_TYPES.heartRate)
  };
}

function deriveDailyScores(day) {
  const stepsScore = Math.min(100, Math.round((Number(day.steps || 0) / 10000) * 100));
  const burnScore = Math.min(
    100,
    Math.round((Number(day.caloriesBurned || 0) / 2800) * 100)
  );
  const cardioScore = Math.min(100, Math.round((Number(day.heartRateAvg || 0) / 180) * 100));
  const cadenceScore = Math.min(120, Math.round(Number(day.steps || 0) / 120));

  let recoveryScore = 0;
  if (day.caloriesBurned > 0) {
    recoveryScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            (Math.abs(Number(day.caloriesConsumed || 0) - Number(day.caloriesBurned || 0)) /
              Number(day.caloriesBurned || 1)) *
              100
        )
      )
    );
  }

  const balanceScore = day.caloriesBurned > 0
    ? Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            (Math.abs(Number(day.caloriesConsumed || 0) - Number(day.caloriesBurned || 0)) /
              Number(day.caloriesBurned || 1)) *
              100
        )
      )
    )
    : 0;

  return {
    stepsScore,
    burnScore,
    cardioScore,
    cadenceScore,
    recoveryScore,
    balanceScore
  };
}

function mapWeeklyMetrics(aggregateResponse, timeZone, caloriesConsumedAvailable = true) {
  const buckets = Array.isArray(aggregateResponse.bucket) ? aggregateResponse.bucket : [];

  const days = buckets.map((bucket) => {
    const bucketMetrics = extractBucketMetrics(bucket);
    const startTimeMillis = Number(bucket.startTimeMillis);
    const label = formatBucketLabel(startTimeMillis, timeZone);
    const dayKey = formatBucketDayKey(startTimeMillis, timeZone);

    return {
      label,
      dayKey,
      date: new Date(startTimeMillis).toISOString(),
      ...bucketMetrics,
      caloriesConsumed: caloriesConsumedAvailable ? bucketMetrics.caloriesConsumed : null,
      ...deriveDailyScores({
        ...bucketMetrics,
        caloriesConsumed: caloriesConsumedAvailable ? bucketMetrics.caloriesConsumed : 0
      })
    };
  });

  return {
    labels: days.map((day) => day.label),
    days,
    series: {
      steps: days.map((day) => day.steps),
      caloriesBurned: days.map((day) => day.caloriesBurned),
      caloriesConsumed: days.map((day) => day.caloriesConsumed),
      heartRateAvg: days.map((day) => day.heartRateAvg),
      recoveryScore: days.map((day) => day.recoveryScore),
      cadenceScore: days.map((day) => day.cadenceScore)
    }
  };
}

function assertHasMetricsData(metrics) {
  const hasData =
    metrics.steps > 0 || metrics.caloriesBurned > 0 || metrics.heartRateAvg > 0;

  if (!hasData) {
    const emptyDataError = new Error('No Google Fit data available for today');
    emptyDataError.code = 'EMPTY_FIT_DATA';
    throw emptyDataError;
  }
}

async function getAggregateData(accessToken, aggregateByDataTypes, options = {}) {
  const timeZone = resolveRequestedTimezone(options.timeZone);
  const payload = buildTodayAggregatePayload(aggregateByDataTypes, timeZone);

  const response = await axios.post(GOOGLE_FIT_AGGREGATE_URL, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

function extractTotalSteps(aggregateResponse) {
  const points = collectPointsFromResponse(aggregateResponse);
  const totalSteps = sumIntegerValues(points, FIT_DATA_TYPES.steps);

  if (totalSteps <= 0) {
    const emptyDataError = new Error('No step data available for today');
    emptyDataError.code = 'EMPTY_FIT_DATA';
    throw emptyDataError;
  }

  return totalSteps;
}

async function getSteps(accessToken, options = {}) {
  const responseData = await getAggregateData(
    accessToken,
    [FIT_DATA_TYPES.steps],
    options
  );

  return extractTotalSteps(responseData);
}

async function getAllMetrics(accessToken, options = {}) {
  const timeZone = resolveRequestedTimezone(options.timeZone);
  const todayPayload = buildTodayAggregatePayload([
    FIT_DATA_TYPES.steps,
    FIT_DATA_TYPES.caloriesBurned,
    FIT_DATA_TYPES.caloriesConsumed,
    FIT_DATA_TYPES.heartRate
  ], timeZone);

  const todayResponse = await postAggregateWithOptionalConsumedFallback(
    accessToken,
    todayPayload
  );

  const points = collectPointsFromResponse(todayResponse.data);

  const weeklyPayload = buildAggregatePayload([
    FIT_DATA_TYPES.steps,
    FIT_DATA_TYPES.caloriesBurned,
    FIT_DATA_TYPES.caloriesConsumed,
    FIT_DATA_TYPES.heartRate
  ], timeZone, 7);

  const weeklyResponse = await postAggregateWithOptionalConsumedFallback(
    accessToken,
    weeklyPayload
  );

  const caloriesConsumedAvailable =
    todayResponse.caloriesConsumedAvailable && weeklyResponse.caloriesConsumedAvailable;

  const weekly = mapWeeklyMetrics(
    weeklyResponse.data,
    timeZone,
    caloriesConsumedAvailable
  );

  const metrics = {
    steps: sumIntegerValues(points, FIT_DATA_TYPES.steps),
    caloriesBurned: Number(
      sumFloatValues(points, FIT_DATA_TYPES.caloriesBurned).toFixed(2)
    ),
    caloriesConsumed: caloriesConsumedAvailable
      ? Number(sumFloatValues(points, FIT_DATA_TYPES.caloriesConsumed).toFixed(2))
      : null,
    caloriesConsumedAvailable,
    heartRateAvg: averageFloatValues(points, FIT_DATA_TYPES.heartRate),
    weekly
  };

  assertHasMetricsData(metrics);

  return metrics;
}

async function getGoogleFitParity(accessToken, options = {}) {
  const timeZone = resolveRequestedTimezone(options.timeZone);
  const aggregateByDataTypes = [
    FIT_DATA_TYPES.steps,
    FIT_DATA_TYPES.caloriesBurned,
    FIT_DATA_TYPES.heartRate
  ];
  const payload = buildTodayAggregatePayload(aggregateByDataTypes, timeZone);

  const response = await axios.post(GOOGLE_FIT_AGGREGATE_URL, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const responseData = response.data;
  const points = collectPointsFromResponse(responseData);

  const metrics = {
    steps: sumIntegerValues(points, FIT_DATA_TYPES.steps),
    caloriesBurned: Number(
      sumFloatValues(points, FIT_DATA_TYPES.caloriesBurned).toFixed(2)
    ),
    heartRateAvg: averageFloatValues(points, FIT_DATA_TYPES.heartRate)
  };

  return {
    mode: 'google-fit-parity',
    source: 'google-fit-aggregate',
    timezone: timeZone,
    windowStart: new Date(payload.startTimeMillis).toISOString(),
    windowEnd: new Date(payload.endTimeMillis).toISOString(),
    metrics,
    raw: {
      aggregateBy: aggregateByDataTypes,
      bucketCount: Array.isArray(responseData.bucket) ? responseData.bucket.length : 0,
      pointCount: points.length
    }
  };
}

module.exports = {
  getSteps,
  getAllMetrics,
  getGoogleFitParity
};
