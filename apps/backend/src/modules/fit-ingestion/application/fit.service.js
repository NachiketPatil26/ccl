const axios = require('axios');
const { env } = require('../../../config/env');

const GOOGLE_FIT_AGGREGATE_URL =
  'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

const FIT_DATA_TYPES = {
  steps: 'com.google.step_count.delta',
  caloriesBurned: 'com.google.calories.expended',
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
  const responseData = await getAggregateData(accessToken, [
    FIT_DATA_TYPES.steps,
    FIT_DATA_TYPES.caloriesBurned,
    FIT_DATA_TYPES.heartRate
  ], options);

  const points = collectPointsFromResponse(responseData);

  const metrics = {
    steps: sumIntegerValues(points, FIT_DATA_TYPES.steps),
    caloriesBurned: Number(
      sumFloatValues(points, FIT_DATA_TYPES.caloriesBurned).toFixed(2)
    ),
    heartRateAvg: averageFloatValues(points, FIT_DATA_TYPES.heartRate)
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
