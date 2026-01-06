const MIN_OK = 2;
const MAX_OK = 8;

fetch("/api/")
  .then(res => res.json())
  .then(raw => {

    const data = raw.reverse();

    document.getElementById("exportCSV").onclick = () => exportCSV(data);

    const labels = data.map(d =>
      new Date(d.dt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    );

    const fullDates = data.map(d =>
      new Date(d.dt).toLocaleString("fr-FR")
    );

    const values = data.map(d => d.temp);

    new Chart(document.getElementById("tempChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Température (°C)",
            data: values,
            borderColor: "#0d6efd",
            backgroundColor: "rgba(13,110,253,0.18)",
            fill: {
              target: "start"
            },
            tension: 0.35,
            borderWidth: 2.5,

            // points bleus
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: "#0d6efd",
            pointBorderColor: "#0d6efd",

            // supprime les taches blanches
            animations: {
              backgroundColor: { duration: 0 }
            }
          },
          {
            label: "Seuil min (2°C)",
            data: Array(values.length).fill(MIN_OK),
            borderColor: "#dc3545",
            borderDash: [6,6],
            pointRadius: 0
          },
          {
            label: "Seuil max (8°C)",
            data: Array(values.length).fill(MAX_OK),
            borderColor: "#fd7e14",
            borderDash: [6,6],
            pointRadius: 0
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        animations: {
          y: {
            from: ctx => ctx.chart.scales.y.getPixelForValue(
              ctx.chart.scales.y.min
            )
          }
        },

        animation: {
          duration: 1200,
          easing: "easeOutQuart"
        },

        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              title: ctx => fullDates[ctx[0].dataIndex],
              label: ctx => ` ${ctx.parsed.y.toFixed(1)} °C`
            }
          }
        },

        scales: {
          x: {
            ticks: {
              maxRotation: 60,
              minRotation: 60,
              font: { size: 10 }
            }
          },
          y: {
            suggestedMin: Math.min(...values, 0) - 2,
            suggestedMax: Math.max(...values) + 5,
            title: {
              display: true,
              text: "Température (°C)"
            }
          }
        }
      }
    });
  });


function exportCSV(data) {
  let csv = "sep=;\nDate;Temperature;Status\n";


  data.forEach(d => {
    const date = new Date(d.dt).toLocaleString("fr-FR");
    const temp = d.temp;

    const status =
      temp < MIN_OK || temp > MAX_OK ? "ALERTE" : "OK";

    csv += `="${date}";="${temp}";="${status}"\n`;
  });

  const BOM = "\uFEFF"; // UTF-8 BOM pour Excel FR
  const blob = new Blob([BOM + csv], {
    type: "text/csv;charset=utf-8;"
  });


  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "historique_temperature.csv";
  a.click();

  URL.revokeObjectURL(url);
}
