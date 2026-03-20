const chartRegistry = new Map();

const chartPalette = {
  cyan: '#7df4ff',
  cyanStrong: '#00f0ff',
  orange: '#ffb874',
  pink: '#ffb3b5',
  textMuted: '#b9cacb',
  grid: 'rgba(132, 148, 149, 0.22)',
  gridStrong: 'rgba(132, 148, 149, 0.35)'
};

const centerTextPlugin = {
  id: 'centerTextPlugin',
  afterDraw(chart, _args, options) {
    if (!options || !options.textLines || !options.textLines.length) {
      return;
    }

    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !meta.data[0]) {
      return;
    }

    const centerX = meta.data[0].x;
    const centerY = meta.data[0].y;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    options.textLines.forEach((line, index) => {
      const offset = (index - (options.textLines.length - 1) / 2) * 32;
      ctx.fillStyle = line.color;
      ctx.font = line.font;
      ctx.fillText(line.text, centerX, centerY + offset);
    });

    ctx.restore();
  }
};

function buildCommonOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 19, 22, 0.95)',
        borderColor: chartPalette.gridStrong,
        borderWidth: 1,
        titleColor: '#e2e2e6',
        bodyColor: chartPalette.textMuted,
        displayColors: false,
        padding: 10
      }
    },
    scales: {
      x: {
        ticks: {
          color: chartPalette.textMuted
        },
        grid: {
          color: chartPalette.grid,
          borderDash: [4, 4],
          drawBorder: false
        }
      },
      y: {
        ticks: {
          color: chartPalette.textMuted
        },
        grid: {
          color: chartPalette.grid,
          borderDash: [4, 4],
          drawBorder: false
        }
      }
    }
  };
}

function renderChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) {
    return;
  }

  if (chartRegistry.has(canvasId)) {
    chartRegistry.get(canvasId).destroy();
  }

  const chart = new window.Chart(canvas, config);
  chartRegistry.set(canvasId, chart);
}

export function renderStepsTrendChart(labels, values) {
  renderChart('activity-steps-trend-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: chartPalette.cyan,
          backgroundColor: 'rgba(125, 244, 255, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: buildCommonOptions()
  });
}

export function renderCaloriesTrendChart(labels, values) {
  renderChart('activity-calories-trend-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: chartPalette.orange,
          backgroundColor: 'rgba(255, 184, 116, 0.08)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: buildCommonOptions()
  });
}

export function renderNutritionTelemetryChart(labels, values) {
  renderChart('nutrition-telemetry-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: chartPalette.cyanStrong,
          backgroundColor: 'rgba(0, 240, 255, 0.08)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: buildCommonOptions()
  });
}

export function renderConsumptionBurnCharts(labels, consumedValues, burnedValues) {
  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Consumed',
          data: consumedValues,
          borderColor: chartPalette.orange,
          backgroundColor: 'rgba(255, 184, 116, 0.08)',
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        {
          label: 'Burned',
          data: burnedValues,
          borderColor: chartPalette.pink,
          backgroundColor: 'rgba(255, 179, 181, 0.08)',
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      ...buildCommonOptions(),
      plugins: {
        legend: {
          display: true,
          labels: {
            color: chartPalette.textMuted,
            boxWidth: 10,
            boxHeight: 10
          }
        }
      }
    }
  };

  renderChart('activity-consumed-burn-chart', config);
  renderChart('nutrition-consumed-burn-chart', config);
}

export function renderCircularBalanceChart(intake, burned, netKcal) {
  const safeIntake = Math.max(0, Number(intake || 0));
  const safeBurned = Math.max(0, Number(burned || 0));

  const intakeGoal = Math.max(safeIntake, safeBurned, 1);
  const burnedGoal = Math.max(safeBurned, safeIntake, 1);

  renderChart('intelligence-circular-balance-chart', {
    type: 'doughnut',
    data: {
      labels: ['Intake', 'Remaining', 'Burned', 'Remaining'],
      datasets: [
        {
          data: [safeIntake, Math.max(intakeGoal - safeIntake, 0.0001)],
          backgroundColor: [chartPalette.orange, 'rgba(132, 148, 149, 0.16)'],
          borderWidth: 0,
          circumference: 360,
          rotation: -90,
          cutout: '72%',
          radius: '98%'
        },
        {
          data: [safeBurned, Math.max(burnedGoal - safeBurned, 0.0001)],
          backgroundColor: [chartPalette.pink, 'rgba(132, 148, 149, 0.16)'],
          borderWidth: 0,
          circumference: 360,
          rotation: -90,
          cutout: '56%',
          radius: '76%'
        }
      ]
    },
    plugins: [centerTextPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        },
        centerTextPlugin: {
          textLines: [
            {
              text: Number(netKcal || 0).toLocaleString(),
              color: '#e2e2e6',
              font: '700 56px "Space Grotesk", sans-serif'
            },
            {
              text: 'NET KCAL',
              color: chartPalette.textMuted,
              font: '600 16px "Inter", sans-serif'
            }
          ]
        }
      }
    }
  });
}

export function renderActivitySpiderChart(labels, values) {
  renderChart('activity-spider-chart', {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: chartPalette.cyanStrong,
          backgroundColor: 'rgba(0, 240, 255, 0.15)',
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(17, 19, 22, 0.95)',
          borderColor: chartPalette.gridStrong,
          borderWidth: 1,
          titleColor: '#e2e2e6',
          bodyColor: chartPalette.textMuted,
          displayColors: false,
          padding: 10
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          angleLines: {
            color: chartPalette.grid
          },
          grid: {
            color: chartPalette.grid
          },
          pointLabels: {
            color: chartPalette.textMuted,
            font: {
              size: 11
            }
          },
          ticks: {
            display: false,
            stepSize: 20
          }
        }
      }
    }
  });
}

export function renderRecoveryTrendChart(labels, values) {
  renderChart('activity-recovery-trend-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: chartPalette.pink,
          backgroundColor: 'rgba(255, 179, 181, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: buildCommonOptions()
  });
}

export function renderCadenceChart(labels, values) {
  renderChart('activity-cadence-chart', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: 'rgba(125, 244, 255, 0.45)',
          borderColor: chartPalette.cyan,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.65,
          categoryPercentage: 0.7
        }
      ]
    },
    options: buildCommonOptions()
  });
}
